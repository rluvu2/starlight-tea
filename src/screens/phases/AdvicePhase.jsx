// Phase 4: 팽주의 조언 — Phase 3 에서 미리 계산해 둔 블렌딩(1위 찻잎 + 2위 과일)과 조언을 보여 준다
import { m, useReducedMotion } from 'framer-motion';
import { useEffect } from 'react';
import { playSfx } from '../../audio/engine.js';
import { GlassCup, Steam } from '../../components/teaware.jsx';
import { ADVICE_TEXT, OWNER_NAME } from '../../data/scripts.js';
import { useGameState } from '../../hooks/useGameState.js';
import { useTypewriter } from '../../hooks/useTypewriter.js';
import { blendColor, blendName, blendParts } from '../../logic/blend.js';
import { ingredientById } from '../../logic/gameData.js';
import { ingredientIconUrl } from '../../utils/assets.js';

/** 마음의 결 상위 3개 — 찻잎(1위)·과일(2위)로 쓰인 마음에 표시를 붙인다 */
function MoodBars({ mood, recommended }) {
  return (
    <div className="mt-2 hidden w-full max-w-[300px] [@media(min-height:740px)]:block">
      <p className="mb-1.5 text-[11px] tracking-wide text-ink-400">{ADVICE_TEXT.moodLabel}</p>
      <div className="space-y-1">
        {mood.map(({ id, share }) => {
          const ingredient = ingredientById(id);
          if (!ingredient) return null;
          const roles = [id === recommended.leafId && ADVICE_TEXT.leafRole, id === recommended.fruitId && ADVICE_TEXT.fruitRole].filter(Boolean);
          return (
            <div key={id} className="flex items-center gap-2 text-[11.5px] text-ink-300">
              <span className="w-14 shrink-0 text-right">{ingredient.virtue}</span>
              <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/8">
                <m.span
                  className="block h-full rounded-full"
                  style={{ backgroundColor: ingredient.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(4, Math.round(share * 100))}%` }}
                  transition={{ duration: 0.9, delay: 0.6, ease: 'easeOut' }}
                />
              </span>
              <span className="w-8 shrink-0 text-right tabular-nums">{Math.round(share * 100)}%</span>
              <span className="w-[52px] shrink-0 text-left text-[10.5px] text-lamp-300">{roles.join('·')}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** 찻잎 → 찻잔 ← 과일 */
function BlendCup({ parts, color }) {
  const icon = (part, from) => (
    <m.img
      src={ingredientIconUrl(part.icon)}
      alt=""
      draggable={false}
      className="h-8 w-8 shrink-0"
      initial={{ opacity: 0, x: from, y: -10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
    />
  );
  return (
    <div className="flex items-end justify-center gap-2.5">
      {icon(parts.leaf, 14)}
      <div className="relative w-[56px]">
        <Steam className="absolute -top-[56%] left-1/2 w-[64%] -translate-x-1/2" />
        <GlassCup color={color} level={0.85} initialLevel={0} transition={{ duration: 1.2, ease: 'easeOut' }} className="w-full" />
      </div>
      {icon(parts.fruit, -14)}
    </div>
  );
}

export default function AdvicePhase() {
  const { state } = useGameState();
  const { advice } = state;
  const reduceMotion = useReducedMotion();
  const { shown, done } = useTypewriter(advice?.message ?? '', { instant: reduceMotion, speed: 34, skippable: true });
  const parts = blendParts(advice?.recommended);

  useEffect(() => {
    playSfx('full');
  }, []);

  if (!advice || !parts) return null;
  const virtues = parts.pure ? parts.leaf.virtue : `${parts.leaf.virtue} + ${parts.fruit.virtue}`;

  return (
    <m.div
      className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center bg-night-950/75 px-5 text-center backdrop-blur-[3px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <BlendCup parts={parts} color={blendColor(advice.recommended)} />
      <p className="mt-1.5 text-[10.5px] tracking-[0.25em] text-ink-400 [@media(max-height:700px)]:hidden">{ADVICE_TEXT.recommendedLabel}</p>
      <p className="mt-0.5 font-serif text-[16px] text-lamp-100">{blendName(advice.recommended)}</p>
      <p className="text-[11px] tracking-[0.12em] text-ink-400">{virtues}</p>

      <div className="relative mt-3 w-full max-w-[340px] rounded-[22px] border border-white/10 bg-night-800/90 px-4 pb-3.5 pt-4 text-left shadow-[0_18px_44px_-20px_rgba(0,0,0,0.9)]">
        <span className="absolute -top-3 left-4 rounded-full bg-mint-200 px-3 py-0.5 font-serif text-[12.5px] font-bold text-night-900 shadow-md">
          {OWNER_NAME}
        </span>
        <p aria-live="polite" className="min-h-[1.6em] break-keep font-serif text-[15px] leading-[1.65] text-ink-100">
          {shown}
        </p>
        <m.div initial={{ opacity: 0 }} animate={{ opacity: done ? 1 : 0 }} transition={{ duration: 0.8 }}>
          <p className="mt-1 break-keep text-[12.5px] leading-relaxed text-ink-300">{advice.blendLine}</p>
          <p className="mt-2 break-keep font-serif text-[15px] leading-[1.7] text-lamp-100">“{advice.comfort}”</p>
        </m.div>
      </div>

      {advice.mood.length > 0 && <MoodBars mood={advice.mood} recommended={advice.recommended} />}

      <m.p
        className="mt-2 text-[11px] text-ink-400"
        animate={{ opacity: done ? [0.4, 1, 0.4] : 0 }}
        transition={done ? { repeat: Infinity, duration: 2.4 } : { duration: 0.2 }}
      >
        {ADVICE_TEXT.backHint}
      </m.p>
    </m.div>
  );
}
