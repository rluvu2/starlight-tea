import { m } from 'framer-motion';
import { playSfx } from '../audio/engine.js';
import { AD_GATE_TEXT, ADVICE_TEXT, GUEST_TEXT, REFLECTION_TEXT, STAR_REWARD_TEXT } from '../data/scripts.js';
import { isReflectionReady, PHASE, useGameState } from '../hooks/useGameState.js';
import { partOf, PICK } from '../logic/blend.js';
import { guestById, INGREDIENT_LIST, ingredientById } from '../logic/gameData.js';
import { fill } from '../logic/josa.js';
import { isAdAvailable } from '../utils/adService.js';
import { ingredientIconUrl } from '../utils/assets.js';
import { haptic } from '../utils/haptics.js';
import { TapButton } from './Buttons.jsx';
import { SparkleIcon, StarIcon } from './icons.jsx';

const softText = (color) => `color-mix(in srgb, ${color} 62%, white)`;
const idFor = (blend, mode) => (blend ? (mode === PICK.FRUIT ? blend.fruitId : blend.leafId) : null);

/** 지금 Phase 에서 재료 칸과 메인 버튼이 어떻게 보일지 정한다 */
function usePanelModel() {
  const { state, actions } = useGameState();
  const { phase, guest, reflection, advice, adStatus } = state;

  if (phase === PHASE.GUEST && guest) {
    const guestData = guestById(guest.id);
    const choosing = guest.step === 'talking' || guest.step === 'missed';
    let header = { text: GUEST_TEXT.panelLabel };
    if (guest.step === 'comforted') {
      header = { text: fill(STAR_REWARD_TEXT, { name: guestData?.name ?? '' }), reward: guest.reward };
    } else if (guest.hint) {
      header = { text: guest.hint, hint: true };
    }
    return {
      header,
      mode: PICK.LEAF, // 손님에게는 찻잎 하나로 우린 차를 내어 드린다
      selectable: choosing,
      selectedId: choosing ? guest.selectedId : guest.servedId,
      tried: guest.tried,
      fab:
        guest.step === 'serving'
          ? { label: GUEST_TEXT.servingButton, disabled: true, loading: true }
          : guest.step === 'comforted'
            ? { label: GUEST_TEXT.continueButton, onClick: actions.toCrossroads, sound: 'farewell' }
            : { label: GUEST_TEXT.serveButton, onClick: actions.serve, disabled: !guest.selectedId, sound: 'serve', feel: 'medium' },
      onSelect: actions.select,
    };
  }

  // Phase 3 ~ 4: 찻잎 하나 + 과일 하나 (위의 [찻잎 | 과일] 탭으로 칸을 바꿔 본다)
  const mode = reflection.pickMode;
  const tabs = (picked) => ({ mode, onChange: actions.setPickMode, leafId: picked.leafId, fruitId: picked.fruitId });

  if (phase === PHASE.REFLECTION) {
    return {
      tabs: tabs(reflection),
      mode,
      selectable: true,
      selectedId: idFor(reflection, mode),
      tried: [],
      fab: {
        label: REFLECTION_TEXT.completeButton,
        onClick: actions.completeReflection,
        disabled: !isReflectionReady(reflection),
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
      selectable: false,
      selectedId: idFor(advice.chosen, mode),
      tried: [],
      fab: {
        label: loading ? AD_GATE_TEXT.loadingButton : isAdAvailable() ? AD_GATE_TEXT.watchButton : AD_GATE_TEXT.noAdButton,
        onClick: actions.watchAdForAdvice,
        disabled: loading,
        loading,
        sound: 'tap',
      },
    };
  }

  if (phase === PHASE.ADVICE && advice) {
    return {
      tabs: tabs(advice.chosen),
      mode,
      selectable: false,
      selectedId: idFor(advice.chosen, mode),
      recommendedId: idFor(advice.recommended, mode),
      tried: [],
      fab: { label: ADVICE_TEXT.backButton, onClick: actions.toCrossroads, sound: 'page' },
    };
  }

  return { header: { text: '' }, mode: PICK.LEAF, selectable: false, selectedId: null, tried: [], fab: null };
}

/** [찻잎 | 과일] 탭 — 고른 재료가 있으면 이름과 아이콘을 함께 보여 준다 */
function PickTabs({ mode, onChange, leafId, fruitId }) {
  const items = [
    [PICK.LEAF, REFLECTION_TEXT.leafTab, partOf(ingredientById(leafId), PICK.LEAF)],
    [PICK.FRUIT, REFLECTION_TEXT.fruitTab, partOf(ingredientById(fruitId), PICK.FRUIT)],
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
      {items.map(([key, label, part]) => {
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
            {part && <img src={ingredientIconUrl(part.icon)} alt="" draggable={false} className="h-5 w-5 shrink-0" />}
            <span className={active ? 'text-ink-100' : 'text-ink-400'}>{label}</span>
            <span className={`truncate font-serif ${part ? '' : 'text-ink-400'}`} style={part ? { color: softText(part.color) } : undefined}>
              {part ? part.name : REFLECTION_TEXT.emptyPick}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function IngredientTile({ ingredient, mode, selected, tried, recommended, selectable, onSelect }) {
  const disabled = !selectable || tried;
  const part = partOf(ingredient, mode);
  return (
    <m.button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${part.name} (${ingredient.virtue})${tried ? ', 이미 드린 차' : ''}${recommended ? ', 팽주가 권하는 재료' : ''}`}
      whileTap={disabled ? undefined : { scale: 0.93 }}
      onClick={() => {
        onSelect?.(ingredient.id);
        playSfx('select');
        haptic('light');
      }}
      className={`relative flex min-h-12 items-center gap-1.5 rounded-2xl border px-2 text-left transition-[background-color,border-color,box-shadow,opacity] duration-200 ${
        selected ? 'bg-white/12' : 'border-white/8 bg-white/4'
      } ${tried ? 'opacity-35' : !selectable && !selected && !recommended ? 'opacity-55' : ''}`}
      style={selected || recommended ? { borderColor: part.color, boxShadow: `0 0 0 1px ${part.color}, 0 0 20px -6px ${part.color}` } : undefined}
    >
      <img src={ingredientIconUrl(part.icon)} alt="" draggable={false} className="h-8 w-8 shrink-0" />
      <span className="min-w-0">
        <span className="block truncate text-[14px] leading-tight text-ink-100">{part.name}</span>
        <span className="block truncate text-[10.5px] leading-tight" style={{ color: softText(part.color) }}>
          {ingredient.virtue}
        </span>
      </span>
      {tried && (
        <span
          className="absolute -right-1 -top-1.5 grid h-5 w-5 place-items-center rounded-full border border-white/20 bg-night-700 text-ink-200 shadow"
          title="이미 드린 차"
        >
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m5 12 5 5 9-10" />
          </svg>
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

function FloatingAction({ label, onClick, disabled, loading, sound = 'tap', feel = 'light' }) {
  return (
    <TapButton
      sound={sound}
      feel={feel}
      disabled={disabled}
      onClick={onClick}
      className="relative flex h-14 min-w-[62%] items-center justify-center gap-2 rounded-full bg-linear-to-b from-lamp-200 to-lamp-400 px-8 font-serif text-[17px] font-bold text-night-900 shadow-[0_14px_34px_-10px_rgba(245,184,96,0.75)] disabled:from-white/14 disabled:to-white/8 disabled:text-ink-300 disabled:shadow-none"
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
      ) : header.hint ? (
        <>
          <SparkleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lamp-300" />
          <span className="break-keep text-lamp-200">
            <b className="mr-1 font-normal text-lamp-300">{GUEST_TEXT.hintLabel}</b>
            {header.text}
          </span>
        </>
      ) : (
        <span className="text-ink-300">{header.text}</span>
      )}
    </div>
  );
}

// 하단 액션 패널: 9가지 열매의 찻잎(또는 과일) 3×3 칸과 떠 있는 메인 버튼
export default function ActionPanel({ tapOverlay }) {
  const model = usePanelModel();

  return (
    <div className="relative flex min-h-0 flex-1 flex-col px-4 pb-safe pt-3 [@media(max-height:700px)]:pt-2">
      {model.tabs ? <PickTabs {...model.tabs} /> : <PanelHeader header={model.header} />}

      <m.div
        key={model.mode}
        className="grid min-h-0 flex-1 auto-rows-fr grid-cols-3 gap-2"
        initial={{ opacity: 0.25 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        {INGREDIENT_LIST.map((ingredient) => (
          <IngredientTile
            key={ingredient.id}
            ingredient={ingredient}
            mode={model.mode}
            selected={model.selectedId === ingredient.id}
            recommended={model.recommendedId === ingredient.id}
            tried={model.tried.includes(ingredient.id)}
            selectable={model.selectable}
            onSelect={model.onSelect}
          />
        ))}
      </m.div>

      <div className="flex h-[72px] shrink-0 items-end justify-center [@media(max-height:700px)]:h-16">{model.fab && <FloatingAction {...model.fab} />}</div>

      {/* 탭(z-40) 아래, 재료 칸과 버튼 위 */}
      {tapOverlay && <TapToContinue {...tapOverlay} className="z-30" />}
    </div>
  );
}
