import { AnimatePresence, m } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { playSfx } from '../audio/engine.js';
import { AD_GATE_TEXT, ADVICE_TEXT, COACH_TEXT, FIRST_TRY_REWARD_TEXT, GUEST_TEXT, PICK_TEXT, REFLECTION_TEXT, STAR_REWARD_TEXT } from '../data/scripts.js';
import { isGuestReady, isReflectionReady, PHASE, useGameState } from '../hooks/useGameState.js';
import { skipTyping } from '../hooks/useTypewriter.js';
import { partOf, PICK } from '../logic/blend.js';
import { guestById, INGREDIENT_LIST, ingredientById } from '../logic/gameData.js';
import { fill } from '../logic/josa.js';
import { isAdAvailable } from '../utils/adService.js';
import { ingredientIconUrl } from '../utils/assets.js';
import { haptic } from '../utils/haptics.js';
import { TapButton } from './Buttons.jsx';
import { StarIcon } from './icons.jsx';

const softText = (color) => `color-mix(in srgb, ${color} 62%, white)`;
const idFor = (blend, mode) => (blend ? (mode === PICK.FRUIT ? blend.fruitId : blend.leafId) : null);
const FLIP_DELAY_MS = 260; // 재료를 고른 뒤 다음 탭으로 넘어가기 전, 고른 칸을 보여 주는 시간
const SWIPE_MIN_PX = 44; // 이만큼 옆으로 밀면 탭을 넘긴다
const LONG_PRESS_MS = 420; // 재료 칸을 이만큼 누르고 있으면 설명이 뜬다
const OTHER_MODE = { [PICK.LEAF]: PICK.FRUIT, [PICK.FRUIT]: PICK.LEAF };

/** 아직 비어 있는 쪽을 알려 주는 버튼 문구 (둘 다 골랐으면 null) */
const missingPick = (picked) => (!picked.leafId ? PICK_TEXT.needLeaf : !picked.fruitId ? PICK_TEXT.needFruit : null);

/** 처음 오신 분 안내: 지금 무엇을 하면 되는지 (COACH_TEXT 의 키, 안내가 필요 없으면 null) */
function coachStep(guest) {
  if (guest.step !== 'talking' && guest.step !== 'missed') return null;
  if (guest.leafId && guest.fruitId) return 'serve';
  if (guest.misses > 0) return 'retry';
  return guest.leafId ? 'fruit' : 'leaf';
}

/**
 * 지금 Phase 에서 재료 칸과 메인 버튼이 어떻게 보일지 정한다.
 * view(mode) 는 찻잎·과일 칸 각각의 모습 { selectable, selectedId, solvedId, recommendedId, tried }
 */
function usePanelModel() {
  const { state, actions } = useGameState();
  const { phase, guest, reflection, advice, adStatus } = state;

  // Phase 1: 손님에게도 찻잎 하나 + 과일 하나. 맞힌 쪽은 고정되고, 아쉬웠던 재료는 다시 고를 수 없다
  if (phase === PHASE.GUEST && guest) {
    const guestData = guestById(guest.id);
    const choosing = guest.step === 'talking' || guest.step === 'missed';
    const comforted = guest.step === 'comforted';
    // 아직 아무 손님의 마음도 데우지 못했다면 처음 오신 분이다 → 한 단계씩 안내
    const coach = Object.keys(state.save.collection).length === 0 ? coachStep(guest) : null;
    let fab = { label: GUEST_TEXT.servingButton, disabled: true, loading: true };
    if (comforted) fab = { label: GUEST_TEXT.continueButton, onClick: actions.toCrossroads, sound: 'farewell' };
    else if (choosing) {
      const ready = isGuestReady(guest);
      fab = {
        label: ready ? GUEST_TEXT.serveButton : missingPick(guest),
        onClick: actions.serve,
        disabled: !ready,
        sound: 'serve',
        feel: 'medium',
        serve: true,
        beckon: coach === 'serve',
      };
    }
    return {
      coach,
      tabs: comforted ? null : { onChange: actions.setPickMode, leafId: guest.leafId, fruitId: guest.fruitId, solved: guest.solved },
      header: comforted
        ? { text: fill(guest.firstTry ? FIRST_TRY_REWARD_TEXT : STAR_REWARD_TEXT, { name: guestData?.name ?? '' }), reward: guest.reward }
        : null,
      mode: guest.pickMode,
      view: (mode) => ({
        selectable: choosing && !guest.solved[mode],
        selectedId: idFor(guest, mode),
        solvedId: guest.solved[mode] ? idFor(guest, mode) : null,
        tried: guest.tried[mode],
      }),
      fab,
      onSelect: actions.select,
    };
  }

  // Phase 3 ~ 4: 찻잎 하나 + 과일 하나 (위의 [찻잎 | 과일] 탭으로 칸을 바꿔 본다)
  const mode = reflection.pickMode;
  const tabs = (picked) => ({ onChange: actions.setPickMode, leafId: picked.leafId, fruitId: picked.fruitId });
  const shows = (picked, extra) => (tab) => ({ selectable: false, selectedId: idFor(picked, tab), tried: [], ...extra?.(tab) });

  if (phase === PHASE.REFLECTION) {
    const ready = isReflectionReady(reflection);
    return {
      tabs: tabs(reflection),
      mode,
      view: shows(reflection, () => ({ selectable: true })),
      fab: {
        label: ready ? REFLECTION_TEXT.completeButton : reflection.text.trim() ? missingPick(reflection) : REFLECTION_TEXT.needText,
        onClick: actions.completeReflection,
        disabled: !ready,
        sound: 'plop',
        feel: 'medium',
      },
      onSelect: actions.select,
    };
  }

  if (phase === PHASE.AD_GATE && advice) {
    const loading = adStatus === 'loading';
    return {
      tabs: tabs(advice.chosen),
      mode,
      view: shows(advice.chosen),
      fab: {
        label: loading ? AD_GATE_TEXT.loadingButton : isAdAvailable() ? AD_GATE_TEXT.watchButton : AD_GATE_TEXT.noAdButton,
        onClick: actions.watchAdForAdvice,
        disabled: loading,
        loading,
        sound: 'tap',
        keyboard: false, // 광고는 버튼을 직접 눌렀을 때만
      },
    };
  }

  if (phase === PHASE.ADVICE && advice) {
    // 팽주의 블렌딩과 같은 쪽 탭에 ✓
    const { chosen, recommended } = advice;
    return {
      tabs: { ...tabs(chosen), solved: { leaf: chosen.leafId === recommended.leafId, fruit: chosen.fruitId === recommended.fruitId } },
      mode,
      view: shows(advice.chosen, (tab) => ({ recommendedId: idFor(advice.recommended, tab) })),
      fab: { label: ADVICE_TEXT.backButton, onClick: actions.toCrossroads, sound: 'page' },
    };
  }

  return { header: { text: '' }, mode: PICK.LEAF, view: () => ({ selectable: false, selectedId: null, tried: [] }), fab: null };
}

/** 재료를 골라 탭이 넘어갈 때는 고른 칸을 잠깐 보여 준 뒤 넘긴다. 탭을 직접 바꿀 때는 바로 */
function useShownMode(mode, pickKey) {
  const [shown, setShown] = useState(mode);
  const lastPick = useRef(pickKey);
  useEffect(() => {
    const picked = lastPick.current !== pickKey;
    lastPick.current = pickKey;
    if (!picked) {
      setShown(mode);
      return undefined;
    }
    const timer = setTimeout(() => setShown(mode), FLIP_DELAY_MS);
    return () => clearTimeout(timer);
  }, [mode, pickKey]);
  return shown;
}

/** 재료 칸을 옆으로 밀어 탭 넘기기. 밀고 난 뒤의 클릭은 재료 선택으로 치지 않는다 */
function useSwipe(onSwipe) {
  const start = useRef(null);
  const swallowClick = useRef(false);
  return {
    onPointerDown(event) {
      swallowClick.current = false;
      start.current = { x: event.clientX, y: event.clientY, t: event.timeStamp };
    },
    onPointerUp(event) {
      const from = start.current;
      start.current = null;
      if (!from) return;
      const dx = event.clientX - from.x;
      const dy = event.clientY - from.y;
      if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy) * 1.4 || event.timeStamp - from.t > 700) return;
      swallowClick.current = true;
      onSwipe(dx < 0 ? PICK.FRUIT : PICK.LEAF); // 왼쪽으로 밀면 오른쪽 탭(과일)
    },
    onPointerCancel() {
      start.current = null;
    },
    onClickCapture(event) {
      if (!swallowClick.current) return;
      swallowClick.current = false;
      event.stopPropagation();
      event.preventDefault();
    },
  };
}

/** 차를 내어 드릴 때: 탭의 찻잎·과일 아이콘이 카운터 위 찻잔으로 날아간다 */
function captureServeFlight(leafId, fruitId) {
  const counter = document.querySelector('[data-counter]')?.getBoundingClientRect();
  if (!counter) return null;
  const items = [
    [PICK.LEAF, leafId],
    [PICK.FRUIT, fruitId],
  ].flatMap(([mode, id]) => {
    const icon = document.querySelector(`[data-pick-icon="${mode}"]`)?.getBoundingClientRect();
    const part = partOf(ingredientById(id), mode);
    return icon && part ? [{ mode, src: ingredientIconUrl(part.icon), x: icon.left + icon.width / 2, y: icon.top + icon.height / 2 }] : [];
  });
  return items.length ? { id: Date.now(), to: { x: counter.left + counter.width / 2, y: counter.top - 14 }, items } : null;
}

function ServeFlight({ flight, onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 1100);
    return () => clearTimeout(timer);
  }, [flight, onDone]);
  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[70]" aria-hidden="true">
      {flight.items.map((item, i) => {
        const dx = flight.to.x - item.x + (i === 0 ? -6 : 6);
        const dy = flight.to.y - item.y;
        return (
          <m.img
            key={item.mode}
            src={item.src}
            alt=""
            draggable={false}
            className="absolute -ml-4 -mt-4 h-8 w-8 drop-shadow-[0_0_8px_rgba(255,214,150,0.6)]"
            style={{ left: item.x, top: item.y }}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{ x: [0, dx * 0.45, dx], y: [0, Math.min(dy, 0) - 56, dy], scale: [1, 1.2, 0.45], opacity: [1, 1, 0] }}
            transition={{
              duration: 0.7,
              delay: i * 0.09,
              ease: 'easeInOut',
              times: [0, 0.45, 1],
              opacity: { duration: 0.7, delay: i * 0.09, times: [0, 0.82, 1] }, // 찻잔에 닿을 때 사라진다
            }}
          />
        );
      })}
    </div>,
    document.body,
  );
}

function CheckMark({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12 5 5 9-10" />
    </svg>
  );
}

/** [찻잎 | 과일] 탭 — 고른 재료가 있으면 이름과 아이콘을, 손님 마음(또는 팽주의 블렌딩)에 맞은 쪽에는 ✓ 를 보여 준다 */
function PickTabs({ mode, onChange, leafId, fruitId, solved }) {
  const items = [
    [PICK.LEAF, PICK_TEXT.leafTab, partOf(ingredientById(leafId), PICK.LEAF), solved?.leaf],
    [PICK.FRUIT, PICK_TEXT.fruitTab, partOf(ingredientById(fruitId), PICK.FRUIT), solved?.fruit],
  ];
  return (
    <div
      role="tablist"
      aria-label="블렌딩 재료"
      className="relative z-40 mb-2 grid h-9 shrink-0 grid-cols-2 rounded-full border border-white/8 bg-white/5 p-0.5 [@media(max-height:700px)]:mb-1.5 [@media(max-height:700px)]:h-8"
    >
      <span
        aria-hidden="true"
        className="absolute bottom-0.5 left-0.5 top-0.5 w-[calc(50%-2px)] rounded-full bg-white/12 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] transition-transform duration-300 ease-out"
        style={{ transform: mode === PICK.FRUIT ? 'translateX(100%)' : 'none' }}
      />
      {items.map(([key, label, part, done]) => {
        const active = mode === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => {
              if (active) return;
              onChange(key);
              playSfx('tap');
              haptic('light');
            }}
            className="relative flex min-w-0 items-center justify-center gap-1.5 rounded-full px-2 text-[13px]"
          >
            {part && <img src={ingredientIconUrl(part.icon)} alt="" draggable={false} data-pick-icon={key} className="h-5 w-5 shrink-0" />}
            <span className={active ? 'text-ink-100' : 'text-ink-400'}>{label}</span>
            <span className={`truncate font-serif ${part ? '' : 'text-ink-400'}`} style={part ? { color: softText(part.color) } : undefined}>
              {part ? part.name : PICK_TEXT.emptyPick}
            </span>
            {done && (
              <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-lamp-300 text-night-900">
                <CheckMark className="h-2.5 w-2.5" />
                <span className="sr-only">, 꼭 맞았어요</span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function IngredientTile({ ingredient, number, mode, selected, tried, solved, recommended, selectable, onSelect, onPeek }) {
  const disabled = !selectable || tried;
  const part = partOf(ingredient, mode);
  const notes = [tried && '아쉬웠던 재료', solved && '손님 마음에 꼭 맞은 재료', recommended && '팽주가 권하는 재료'].filter(Boolean);
  // 꾹 누르면 재료 설명. 고를 수 없는 칸도 설명은 볼 수 있도록 disabled 대신 aria-disabled 를 쓴다
  const press = useRef(null);
  const endPress = () => {
    if (!press.current) return;
    clearTimeout(press.current.timer);
    if (press.current.peeked) onPeek?.(null);
  };
  return (
    <m.button
      type="button"
      aria-disabled={disabled || undefined}
      aria-pressed={selected}
      aria-label={[`${part.name} (${ingredient.virtue})`, ...notes].join(', ')}
      aria-keyshortcuts={String(number)}
      title={`${part.name} · ${ingredient.virtue} — ${ingredient.image}`}
      whileTap={disabled ? undefined : { scale: 0.93 }}
      onPointerDown={(event) => {
        const tile = event.currentTarget;
        const from = { x: event.clientX, y: event.clientY, peeked: false };
        from.timer = setTimeout(() => {
          from.peeked = true;
          onPeek?.({ id: ingredient.id, mode, rect: tile.getBoundingClientRect() });
          haptic('light');
        }, LONG_PRESS_MS);
        press.current = from;
      }}
      onPointerMove={(event) => {
        const from = press.current;
        if (!from || from.peeked || Math.hypot(event.clientX - from.x, event.clientY - from.y) < 10) return;
        clearTimeout(from.timer); // 밀고 있으면 설명 대신 탭 넘기기
        press.current = null;
      }}
      onPointerUp={endPress}
      onPointerLeave={endPress}
      onPointerCancel={() => {
        endPress();
        press.current = null;
      }}
      onContextMenu={(event) => event.preventDefault()}
      onClick={() => {
        const peeked = press.current?.peeked;
        press.current = null;
        if (peeked || disabled) return; // 꾹 눌러 설명을 본 뒤에는 고르지 않는다
        onSelect?.(ingredient.id, mode);
        playSfx('select');
        haptic('light');
      }}
      className={`relative flex min-h-12 items-center gap-1.5 rounded-2xl border px-2 text-left transition-[background-color,border-color,box-shadow,opacity] duration-200 [@media(max-width:380px)]:gap-1 [@media(max-width:380px)]:px-1.5 ${
        selected ? 'bg-white/12' : 'border-white/8 bg-white/4'
      } ${tried ? 'opacity-35' : !selectable && !selected && !recommended ? 'opacity-55' : ''} ${disabled ? 'cursor-default' : ''}`}
      style={selected || recommended ? { borderColor: part.color, boxShadow: `0 0 0 1px ${part.color}, 0 0 20px -6px ${part.color}` } : undefined}
    >
      <img
        src={ingredientIconUrl(part.icon)}
        alt=""
        draggable={false}
        className="h-8 w-8 shrink-0 [@media(max-width:380px)]:h-7 [@media(max-width:380px)]:w-7"
      />
      <span className="min-w-0">
        <span className="block truncate text-[14px] leading-tight text-ink-100">{part.name}</span>
        <span className="block truncate text-[10.5px] leading-tight" style={{ color: softText(part.color) }}>
          {ingredient.virtue}
        </span>
      </span>
      {/* 마우스로 하는 화면에서만: 숫자 키 1~9 로도 고를 수 있어요 */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-1 right-2 hidden text-[10px] tabular-nums text-ink-400/60 [@media(hover:hover)_and_(pointer:fine)]:block"
      >
        {number}
      </span>
      {tried && (
        <span
          className="absolute -right-1 -top-1.5 grid h-5 w-5 place-items-center rounded-full border border-white/20 bg-night-700 text-ink-300 shadow"
          title="아쉬웠던 재료"
        >
          <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" aria-hidden="true">
            <path d="M7 7l10 10M17 7 7 17" />
          </svg>
        </span>
      )}
      {solved && (
        <span className="absolute -right-1 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-lamp-300 text-night-900 shadow" title="손님 마음에 꼭 맞은 재료">
          <CheckMark className="h-3 w-3" />
        </span>
      )}
      {recommended && (
        <span className="absolute -right-1 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-lamp-300 text-night-900 shadow">
          <StarIcon className="h-3 w-3" />
        </span>
      )}
    </m.button>
  );
}

function FloatingAction({ label, onClick, disabled, loading, beckon, sound = 'tap', feel = 'light' }) {
  return (
    <TapButton
      sound={sound}
      feel={feel}
      disabled={disabled}
      onClick={onClick}
      className={`relative flex h-14 min-w-[62%] items-center justify-center gap-2 rounded-full bg-linear-to-b from-lamp-200 to-lamp-400 px-8 font-serif text-[17px] font-bold text-night-900 shadow-[0_14px_34px_-10px_rgba(245,184,96,0.75)] disabled:from-white/14 disabled:to-white/8 disabled:text-ink-300 disabled:shadow-none ${
        beckon && !disabled ? 'animate-beckon' : ''
      }`}
    >
      {loading && (
        <span className="flex gap-1" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <m.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-current"
              animate={{ opacity: [0.25, 1, 0.25] }}
              transition={{ repeat: Infinity, duration: 1.1, delay: i * 0.18 }}
            />
          ))}
        </span>
      )}
      {label}
    </TapButton>
  );
}

/** 처음 오신 분 안내: 재료 칸 위(카운터 앞)에 떠서 지금 할 일을 알려 준다 */
function CoachMark({ text, arrow }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex -translate-y-full justify-center px-4 pb-1">
      <m.div
        className="flex flex-col items-center"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4, transition: { duration: 0.15 } }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <span aria-live="polite" className="break-keep rounded-full border border-lamp-300/45 bg-night-800/90 px-3.5 py-1 text-center text-[12.5px] text-lamp-100 shadow-[0_8px_24px_-10px_rgba(0,0,0,0.9)] backdrop-blur-md">
          {text}
        </span>
        {arrow && (
          <svg viewBox="0 0 24 24" className="mt-0.5 h-3.5 w-3.5 animate-nudge text-lamp-300" fill="currentColor" aria-hidden="true">
            <path d="M4 8h16l-8 10z" />
          </svg>
        )}
      </m.div>
    </div>
  );
}

/** 꾹 누른 재료의 설명: 누른 칸 바로 위에 뜬다 */
function PeekCard({ peek, panel }) {
  const ingredient = ingredientById(peek.id);
  const part = partOf(ingredient, peek.mode);
  const box = panel.current?.getBoundingClientRect();
  if (!part || !box) return null;
  const width = Math.min(264, box.width - 24);
  const left = Math.min(Math.max(peek.rect.left + peek.rect.width / 2 - box.left - width / 2, 12), box.width - width - 12);
  return (
    <m.div
      role="tooltip"
      className="pointer-events-none absolute z-50 rounded-2xl border border-white/12 bg-night-800 p-3 text-left shadow-[0_18px_40px_-14px_rgba(0,0,0,0.95)]"
      style={{ left, width, bottom: box.bottom - peek.rect.top + 8 }}
      initial={{ opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, transition: { duration: 0.12 } }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      <div className="flex items-center gap-2">
        <img src={ingredientIconUrl(part.icon)} alt="" draggable={false} className="h-8 w-8 shrink-0" />
        <div className="min-w-0">
          <p className="font-serif text-[15px] leading-tight text-ink-100">
            {part.name}
            <span className="ml-1.5 text-[12px]" style={{ color: softText(part.color) }}>
              {ingredient.virtue}
            </span>
          </p>
          <p className="mt-0.5 text-[12px] leading-tight text-lamp-200">{ingredient.image}</p>
        </div>
      </div>
      <p className="mt-2 break-keep text-[12.5px] leading-relaxed text-ink-300">{ingredient.description}</p>
    </m.div>
  );
}

/** "화면을 누르면 다음으로" 터치 영역 (가운데 장면과 하단 패널에 각각 깐다) */
export function TapToContinue({ label, onContinue, className = 'z-40' }) {
  return <button type="button" aria-label={label} className={`absolute inset-0 cursor-pointer ${className}`} onClick={onContinue} />;
}

function PanelHeader({ header }) {
  return (
    <div className="mb-2 flex min-h-[22px] items-start gap-1.5 text-[13px] leading-snug [@media(max-height:700px)]:mb-1.5" aria-live="polite">
      {header.reward ? (
        <>
          <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-lamp-300/20 px-2 py-0.5 font-bold text-lamp-200">
            <StarIcon className="h-3 w-3" />+{header.reward}
          </span>
          <span className="break-keep text-lamp-200">{header.text}</span>
        </>
      ) : (
        <span className="text-ink-300">{header.text}</span>
      )}
    </div>
  );
}

/**
 * PC 키보드: 1~9 재료 고르기, ←/→ 탭 넘기기, Enter 대사 넘기기·메인 버튼.
 * 글을 쓰는 중이거나 도감·설정 창이 열려 있으면 쉰다.
 */
function useKeyboard(latest) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      const tag = event.target?.tagName;
      if (['TEXTAREA', 'INPUT', 'SELECT'].includes(tag) || document.querySelector('[role="dialog"]')) return;
      const { model, mode, switchTab, fab } = latest.current;
      if (/^[1-9]$/.test(event.key)) {
        const ingredient = INGREDIENT_LIST[Number(event.key) - 1];
        const view = model.view(mode);
        if (!ingredient || !model.onSelect || !view.selectable || view.tried.includes(ingredient.id)) return;
        event.preventDefault();
        model.onSelect(ingredient.id, mode);
        playSfx('select');
        haptic('light');
      } else if ((event.key === 'ArrowLeft' || event.key === 'ArrowRight') && model.tabs) {
        event.preventDefault();
        switchTab(event.key === 'ArrowLeft' ? PICK.LEAF : PICK.FRUIT);
      } else if (event.key === 'Enter' && tag !== 'BUTTON' && tag !== 'A') {
        if (skipTyping()) {
          event.preventDefault();
          return;
        }
        if (!fab || fab.disabled || !fab.onClick || fab.keyboard === false) return;
        event.preventDefault();
        playSfx(fab.sound ?? 'tap');
        haptic(fab.feel ?? 'light');
        fab.onClick();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [latest]);
}

// 하단 액션 패널: 9가지 열매의 찻잎(또는 과일) 3×3 칸과 떠 있는 메인 버튼
export default function ActionPanel({ tapOverlay }) {
  const model = usePanelModel();
  const leafView = model.view(PICK.LEAF);
  const fruitView = model.view(PICK.FRUIT);
  const mode = useShownMode(model.mode, `${leafView.selectedId}-${fruitView.selectedId}`);
  const view = mode === PICK.FRUIT ? fruitView : leafView;
  const [flight, setFlight] = useState(null);
  const clearFlight = useRef(() => setFlight(null)).current;
  const [peek, setPeek] = useState(null); // 꾹 누른 재료 { id, mode, rect }
  const panel = useRef(null);

  const switchTab = (next) => {
    if (!model.tabs || next === mode) return;
    model.tabs.onChange(next);
    playSfx('tap');
    haptic('light');
  };
  const swipe = useSwipe(switchTab);

  // 차를 내어 드릴 때는 찻잎과 과일이 찻잔으로 날아간다
  const fab = model.fab?.serve
    ? {
        ...model.fab,
        onClick: () => {
          setFlight(captureServeFlight(leafView.selectedId, fruitView.selectedId));
          model.fab.onClick();
        },
      }
    : model.fab;

  const latest = useRef(null);
  latest.current = { model, mode, switchTab, fab };
  useKeyboard(latest);

  return (
    <div ref={panel} className="relative flex min-h-0 flex-1 flex-col px-4 pb-safe pt-3 [@media(max-height:700px)]:pt-2">
      {/* 이 패널 안의 등장 연출은 바깥 AnimatePresence(initial=false)의 영향을 받지 않도록 각자 감싼다 */}
      <AnimatePresence>
        {model.coach && <CoachMark key={model.coach} text={COACH_TEXT[model.coach]} arrow={model.coach !== 'serve'} />}
      </AnimatePresence>
      {model.tabs ? <PickTabs {...model.tabs} mode={mode} /> : <PanelHeader header={model.header} />}

      {/* 옆으로 밀면 [찻잎 | 과일] 탭이 넘어간다.
          패널 바깥의 AnimatePresence(initial=false)와 상관없이 탭을 바꿀 때마다 미끄러지도록 따로 감싼다 */}
      <div className="relative flex min-h-0 flex-1 touch-pan-y flex-col" {...(model.tabs ? swipe : {})}>
        <AnimatePresence initial={false} mode="popLayout">
          <m.div
            key={mode}
            className="grid min-h-0 flex-1 auto-rows-fr grid-cols-3 gap-2"
            initial={{ opacity: 0.2, x: model.tabs ? (mode === PICK.FRUIT ? 26 : -26) : 0 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {INGREDIENT_LIST.map((ingredient, index) => (
              <IngredientTile
                key={ingredient.id}
                ingredient={ingredient}
                number={index + 1}
                mode={mode}
                selected={view.selectedId === ingredient.id}
                solved={view.solvedId === ingredient.id}
                recommended={view.recommendedId === ingredient.id}
                tried={view.tried.includes(ingredient.id)}
                selectable={view.selectable}
                onSelect={model.onSelect}
                onPeek={setPeek}
              />
            ))}
          </m.div>
        </AnimatePresence>
      </div>
      <AnimatePresence>{peek && <PeekCard key={`${peek.mode}-${peek.id}`} peek={peek} panel={panel} />}</AnimatePresence>

      <div className="flex h-[72px] shrink-0 items-end justify-center [@media(max-height:700px)]:h-16">{fab && <FloatingAction {...fab} />}</div>

      {/* 탭(z-40) 아래, 재료 칸과 버튼 위 */}
      {tapOverlay && <TapToContinue {...tapOverlay} className="z-30" />}
      <AnimatePresence>{flight && <ServeFlight key={flight.id} flight={flight} onDone={clearFlight} />}</AnimatePresence>
    </div>
  );
}
