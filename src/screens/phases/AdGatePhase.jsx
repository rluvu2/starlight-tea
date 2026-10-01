// Phase 3.5: 차 우리는 시간 — 김이 피어오르는 찻주전자와 함께, 유저가 원할 때만 보상형 광고
import { AnimatePresence, m } from 'framer-motion';
import { playSfx } from '../../audio/engine.js';
import { SteamPaths, TeapotShape } from '../../components/teaware.jsx';
import { AD_GATE_TEXT } from '../../data/scripts.js';
import { useGameState } from '../../hooks/useGameState.js';
import { blendName, blendParts } from '../../logic/blend.js';
import { isAdAvailable } from '../../utils/adService.js';
import { ingredientIconUrl } from '../../utils/assets.js';

/** 유저가 고른 찻잎 + 과일 */
function MyBlend({ blend }) {
  const parts = blendParts(blend);
  if (!parts) return null;
  return (
    <div className="mt-3 flex max-w-full items-center gap-1.5 rounded-full border border-white/10 bg-white/5 py-1 pl-1.5 pr-3.5 text-[12.5px]">
      <img src={ingredientIconUrl(parts.leaf.icon)} alt="" className="h-5.5 w-5.5 shrink-0" />
      <img src={ingredientIconUrl(parts.fruit.icon)} alt="" className="-ml-2 h-5.5 w-5.5 shrink-0" />
      <span className="shrink-0 text-ink-400">{AD_GATE_TEXT.myBlendLabel}</span>
      <span className="truncate font-serif text-ink-100">{blendName(blend)}</span>
    </div>
  );
}

export default function AdGatePhase() {
  const { state, actions } = useGameState();
  const { adStatus, advice } = state;
  const adReady = isAdAvailable();

  return (
    <m.div
      className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-night-950/75 px-6 text-center backdrop-blur-[3px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {adStatus !== 'loading' && (
        <button
          type="button"
          onClick={() => {
            playSfx('tap');
            actions.toCrossroads();
          }}
          className="absolute left-3 top-2 rounded-full px-2 py-1 text-[12px] text-ink-400"
        >
          {AD_GATE_TEXT.later}
        </button>
      )}

      {/* 김이 피어오르는 찻주전자 */}
      <div className="relative w-[44%] max-w-[170px] [@media(max-height:760px)]:max-w-[124px]">
        <div className="absolute -inset-6 rounded-full bg-[radial-gradient(circle,rgba(255,200,130,0.22),transparent_65%)]" />
        <svg viewBox="0 -60 160 190" className="relative w-full" overflow="visible" aria-hidden="true">
          <g transform="translate(52 -52) scale(1.1)">
            <SteamPaths />
          </g>
          <g transform="translate(126 -14) scale(0.6)">
            <SteamPaths />
          </g>
          <m.g
            style={{ transformBox: 'fill-box', transformOrigin: '50% 90%' }}
            animate={{ rotate: [-1.5, 1.5, -1.5] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <TeapotShape />
          </m.g>
        </svg>
      </div>

      <p className="mt-3 whitespace-pre-line break-keep font-serif text-[15px] leading-relaxed text-ink-100">{AD_GATE_TEXT.brewing}</p>
      <MyBlend blend={advice?.chosen} />

      <AnimatePresence mode="wait" initial={false}>
        {adStatus === 'dismissed' ? (
          <m.p
            key="dismissed"
            className="mt-3 font-serif text-[15px] text-lamp-300"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {AD_GATE_TEXT.dismissed}
          </m.p>
        ) : (
          adReady && (
            <m.p
              key="notice"
              className="mt-3 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[12px] text-ink-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {AD_GATE_TEXT.rewardNotice}
            </m.p>
          )
        )}
      </AnimatePresence>
    </m.div>
  );
}
