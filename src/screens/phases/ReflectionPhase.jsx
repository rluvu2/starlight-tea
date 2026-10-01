// Phase 3: 내 고민 털어놓기 — 가운데 편지지에 마음을 적고, 아래에서 마시고 싶은 차를 고른다
import { m } from 'framer-motion';
import { playSfx } from '../../audio/engine.js';
import { ChevronLeftIcon } from '../../components/icons.jsx';
import { REFLECTION_TEXT } from '../../data/scripts.js';
import { useGameState } from '../../hooks/useGameState.js';

function LockIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export default function ReflectionPhase() {
  const { state, actions } = useGameState();
  const { text } = state.reflection;

  return (
    <m.div
      className="absolute inset-0 z-30 flex flex-col bg-night-950/70 px-3 pb-2 pt-1 backdrop-blur-[3px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <m.div
        className="flex min-h-0 flex-1 flex-col rounded-[24px] border border-lamp-300/15 bg-night-800/95 px-4 pb-3 pt-3.5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)]"
        initial={{ y: 14 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 260 }}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-[17px] text-lamp-100">{REFLECTION_TEXT.title}</h2>
          <button
            type="button"
            onClick={() => {
              playSfx('tap');
              actions.toCrossroads();
            }}
            className="flex items-center gap-0.5 rounded-full px-2 py-1 text-[12px] text-ink-400"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5" />
            {REFLECTION_TEXT.back}
          </button>
        </div>
        <p className="mt-1 whitespace-pre-line break-keep text-[13px] leading-relaxed text-ink-300">{REFLECTION_TEXT.prompt}</p>
        <label htmlFor="reflection-text" className="sr-only">
          오늘의 고민
        </label>
        <textarea
          id="reflection-text"
          value={text}
          maxLength={REFLECTION_TEXT.maxLength}
          placeholder={REFLECTION_TEXT.placeholder}
          onChange={(event) => actions.setReflectionText(event.target.value)}
          enterKeyHint="done"
          className="mt-2.5 min-h-0 flex-1 resize-none select-text rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-1.5 font-serif text-[16px] text-ink-100 outline-none [-webkit-touch-callout:default] [-webkit-user-select:text] placeholder:text-ink-400/70 focus:border-lamp-300/40"
          style={{
            lineHeight: '1.9',
            backgroundImage: 'repeating-linear-gradient(transparent 0 calc(1.9em - 1px), rgba(255,255,255,0.07) calc(1.9em - 1px) 1.9em)',
            backgroundAttachment: 'local',
            backgroundPositionY: '6px',
          }}
        />
        <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-ink-400">
          <span className="flex min-w-0 items-center gap-1">
            <LockIcon className="h-3 w-3 shrink-0" />
            <span className="truncate">{REFLECTION_TEXT.privacy}</span>
          </span>
          <span className="shrink-0 tabular-nums">
            {text.length}/{REFLECTION_TEXT.maxLength}
          </span>
        </div>
      </m.div>
    </m.div>
  );
}
