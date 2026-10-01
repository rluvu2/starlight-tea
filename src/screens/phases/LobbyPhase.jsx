// Phase 2: 찻집 로비 (메인 메뉴 · 분기점) — 손님이 떠난 찻집에서 오늘 밤의 다음 일을 고른다.
// 찻집 문을 열면 언제나 손님 맞이가 먼저이고, 첫 손님을 배웅한 뒤부터 이 로비가 열린다.
import { m } from 'framer-motion';
import { TapButton } from '../../components/Buttons.jsx';
import { BellIcon, BookIcon, ChevronRightIcon, CupIcon } from '../../components/icons.jsx';
import { Steam } from '../../components/teaware.jsx';
import { LOBBY_TEXT } from '../../data/scripts.js';
import { buildCollection, useGameState } from '../../hooks/useGameState.js';
import { GUEST_LIST } from '../../logic/gameData.js';
import { fill } from '../../logic/josa.js';

/** 가운데: 고요해진 찻집, 카운터 위 찻주전자의 김, 오늘 밤의 기록 */
export function LobbyScene() {
  const { state } = useGameState();
  const { tonight } = state;
  const hasGuests = GUEST_LIST.length > 0;

  return (
    <m.div
      className="absolute inset-0 z-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      {/* 카운터 위 찻주전자에서 오르는 김 (Counter 의 찻주전자와 같은 자리·크기) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0" style={{ height: 'var(--counter-h)' }}>
        <div className="absolute bottom-[calc(100%-10px)] left-[5%] aspect-[160/130] w-[17%] max-w-[76px]">
          <Steam className="absolute -top-[22%] left-1/2 w-[46%] -translate-x-1/2" />
        </div>
      </div>

      <div
        className="absolute inset-x-0 top-0 flex flex-col items-center justify-center px-6 text-center"
        style={{ bottom: 'calc(var(--counter-h) - 4px)' }}
      >
        <p className="text-[11px] tracking-[0.32em] text-ink-400">{LOBBY_TEXT.eyebrow}</p>
        <p className="mt-2.5 break-keep font-serif text-[17px] leading-relaxed text-ink-100">{LOBBY_TEXT.title}</p>
        <p className="mt-1 break-keep text-[13px] text-ink-300">{hasGuests ? LOBBY_TEXT.subtitle : LOBBY_TEXT.noGuests}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-[12px] text-ink-200">
          <span className="rounded-full border border-white/10 bg-night-800/60 px-3 py-1 backdrop-blur-md">
            {fill(LOBBY_TEXT.tonightGuests, { count: tonight.guests })}
          </span>
          <span className="rounded-full border border-white/10 bg-night-800/60 px-3 py-1 backdrop-blur-md">
            {fill(LOBBY_TEXT.tonightTeas, { count: tonight.teas })}
          </span>
        </div>
      </div>
    </m.div>
  );
}

const TONES = {
  lamp: 'bg-linear-to-b from-lamp-200 to-lamp-400 text-night-900 shadow-[0_12px_32px_-12px_rgba(245,184,96,0.75)]',
  mint: 'border border-mint-200/35 bg-[#1d3a45]/75 text-mint-200 shadow-[0_10px_28px_-14px_rgba(159,216,194,0.55)] backdrop-blur-md',
  glass: 'border border-white/10 bg-white/5 text-ink-100 backdrop-blur-md',
};

function MenuButton({ icon, title, caption, tone, trailing, ...rest }) {
  return (
    <TapButton
      feel="medium"
      className={`flex h-[62px] w-full shrink-0 items-center gap-3 rounded-2xl pl-3 pr-4 text-left disabled:opacity-45 ${TONES[tone]}`}
      {...rest}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black/10">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-serif text-[16.5px] font-bold leading-tight">{title}</span>
        <span className="mt-1 block truncate text-[12px] leading-tight opacity-75">{caption}</span>
      </span>
      {trailing}
    </TapButton>
  );
}

/** 하단: 로비의 메인 메뉴 (Phase 1·3 의 재료 칸 자리) */
export function LobbyMenu({ onOpenCollection }) {
  const { state, actions } = useGameState();
  const entries = buildCollection(state.save);
  const comforted = entries.filter((entry) => entry.status === 'comforted').length;
  const hasGuests = GUEST_LIST.length > 0;

  return (
    <m.nav
      aria-label="찻집 로비"
      className="flex min-h-0 flex-1 flex-col justify-center gap-2.5 px-4 pb-safe pt-3"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8, transition: { duration: 0.2 } }}
      transition={{ duration: 0.45, delay: 0.3 }}
    >
      <MenuButton
        tone="lamp"
        sound="chime"
        disabled={!hasGuests}
        onClick={actions.nextGuest}
        icon={<BellIcon className="h-5.5 w-5.5" />}
        title={LOBBY_TEXT.nextGuest}
        caption={LOBBY_TEXT.nextGuestCaption}
      />
      <MenuButton
        tone="mint"
        sound="page"
        onClick={actions.startReflection}
        icon={<CupIcon className="h-5.5 w-5.5" />}
        title={LOBBY_TEXT.brewForMe}
        caption={LOBBY_TEXT.brewForMeCaption}
      />
      <MenuButton
        tone="glass"
        sound="page"
        feel="light"
        onClick={onOpenCollection}
        icon={<BookIcon className="h-5 w-5 text-lamp-300" />}
        title={LOBBY_TEXT.collection}
        caption={fill(LOBBY_TEXT.collectionCaption, { count: comforted, total: entries.length })}
        trailing={<ChevronRightIcon className="h-4.5 w-4.5 shrink-0 text-ink-400" />}
      />
    </m.nav>
  );
}
