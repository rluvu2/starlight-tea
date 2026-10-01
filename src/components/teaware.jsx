// 찻집 소품: 찻주전자, 유리 찻잔, 김, 촛불 (모두 SVG 로 직접 그림)
import { m } from 'framer-motion';
import { useId } from 'react';

/* ── 찻주전자 (viewBox 0 0 160 130 기준) ───────────────────────── */
const BAND_DOTS = [
  [46, 86],
  [63, 90],
  [80, 91],
  [97, 90],
  [114, 86],
];

export function TeapotShape() {
  const id = useId();
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-body`} cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#fffaf1" />
          <stop offset="1" stopColor="#e9dcc8" />
        </radialGradient>
      </defs>
      <path d="M 36 58 C 8 56 8 104 40 102" fill="none" stroke="#c9b293" strokeWidth="13" strokeLinecap="round" />
      <path d="M 36 58 C 8 56 8 104 40 102" fill="none" stroke="#f3e8d8" strokeWidth="8" strokeLinecap="round" />
      <path
        d="M 116 70 C 134 68 142 54 150 40 L 158 44 C 152 60 148 84 122 94 Z"
        fill="#f3e8d8"
        stroke="#c9b293"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <ellipse cx="80" cy="80" rx="48" ry="40" fill={`url(#${id}-body)`} stroke="#c9b293" strokeWidth="3" />
      <path d="M 34 76 Q 80 94 126 76 L 127 88 Q 80 106 33 88 Z" fill="#5d6bb0" />
      {BAND_DOTS.map(([cx, cy]) => (
        <circle key={cx} cx={cx} cy={cy} r="2.2" fill="#f6ecdd" />
      ))}
      <ellipse cx="80" cy="44" rx="28" ry="8" fill="#efe2cf" stroke="#c9b293" strokeWidth="3" />
      <circle cx="80" cy="33" r="6.5" fill="#5d6bb0" stroke="#3e4a86" strokeWidth="2" />
      <ellipse cx="60" cy="64" rx="8" ry="13" fill="#ffffff" opacity="0.55" transform="rotate(25 60 64)" />
    </g>
  );
}

export function Teapot({ className = '' }) {
  return (
    <svg viewBox="0 0 160 130" className={className} aria-hidden="true">
      <TeapotShape />
    </svg>
  );
}

/* ── 유리 찻잔 (viewBox 0 0 200 175 기준) ───────────────────────── */
export const CUP_LEVEL = { empty: 158, full: 60 };
export const levelToY = (level) => CUP_LEVEL.empty + (CUP_LEVEL.full - CUP_LEVEL.empty) * level;

const BOWL = 'M 30 52 L 170 52 C 168 114 140 152 100 152 C 60 152 32 114 30 52 Z';
const WAVE =
  'M -60 0 Q -45 -4 -30 0 T 0 0 T 30 0 T 60 0 T 90 0 T 120 0 T 150 0 T 180 0 T 210 0 T 240 0 T 270 0 L 270 130 L -60 130 Z';
const WAVE_LINE = 'M -60 0 Q -45 -4 -30 0 T 0 0 T 30 0 T 60 0 T 90 0 T 120 0 T 150 0 T 180 0 T 210 0 T 240 0 T 270 0';

/**
 * @param liquidY 찻물 표면 높이. MotionValue 를 주면 매 프레임 따라가고, 숫자를 주면 부드럽게 이동한다.
 */
export function GlassCupShape({ color, liquidY, initialY, rippling = false, transition }) {
  const id = useId();
  const isMotionValue = typeof liquidY === 'object' && liquidY !== null;
  return (
    <g>
      <defs>
        <clipPath id={`${id}-bowl`}>
          <path d={BOWL} />
        </clipPath>
        <linearGradient id={`${id}-tea`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.96" />
          <stop offset="1" stopColor={color} stopOpacity="0.78" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="160" rx="92" ry="12" fill="#e7d8c4" stroke="#c4ab8a" strokeWidth="3" />
      <ellipse cx="100" cy="157" rx="50" ry="5.5" fill="#d6c3a9" />
      <path d={BOWL} fill="rgba(255,255,255,0.08)" />
      <g clipPath={`url(#${id}-bowl)`}>
        <m.g
          style={isMotionValue ? { y: liquidY } : undefined}
          initial={initialY === undefined ? false : { y: initialY }}
          animate={isMotionValue ? undefined : { y: liquidY }}
          transition={transition ?? { duration: 1.4, ease: 'easeInOut' }}
        >
          <path d={WAVE} fill={`url(#${id}-tea)`} className={rippling ? 'animate-wave-fast' : 'animate-wave'} />
          <path
            d={WAVE_LINE}
            fill="none"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="2.5"
            className={rippling ? 'animate-wave-fast' : 'animate-wave'}
          />
        </m.g>
      </g>
      <path d={BOWL} fill="none" stroke="rgba(255,255,255,0.62)" strokeWidth="3" />
      <path d="M 46 74 C 50 106 62 128 80 140" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="100" cy="52" rx="70" ry="10" fill="none" stroke="rgba(255,255,255,0.78)" strokeWidth="3" />
      <path d="M 166 70 C 200 66 200 118 156 116" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="7" strokeLinecap="round" />
    </g>
  );
}

export function GlassCup({ color, level = 1, initialLevel, className = '', transition }) {
  return (
    <svg viewBox="0 0 200 175" className={className} aria-hidden="true" overflow="visible">
      <GlassCupShape
        color={color}
        liquidY={levelToY(level)}
        initialY={initialLevel === undefined ? undefined : levelToY(initialLevel)}
        transition={transition}
      />
    </svg>
  );
}

/* ── 모락모락 김 (60×50 영역) ───────────────────────────────────── */
export function SteamPaths() {
  return (
    <g aria-hidden="true">
      {[14, 30, 46].map((x, i) => (
        <path
          key={x}
          d={`M ${x} 46 C ${x - 6} 36 ${x + 6} 28 ${x} 18 C ${x - 5} 10 ${x + 3} 6 ${x} 2`}
          fill="none"
          stroke="rgba(255,255,255,0.65)"
          strokeWidth="3"
          strokeLinecap="round"
          className="animate-steam"
          style={{ animationDelay: `${i * 0.8}s`, opacity: 0, transformBox: 'fill-box', transformOrigin: '50% 100%' }}
        />
      ))}
    </g>
  );
}

export function Steam({ className = '' }) {
  return (
    <svg viewBox="0 0 60 50" className={className} aria-hidden="true" overflow="visible">
      <SteamPaths />
    </svg>
  );
}

/* ── 촛불 ─────────────────────────────────────────────────────── */
/** className 으로 위치(absolute 등)를 정해 주세요. */
export function Candle({ className = '' }) {
  return (
    <div className={className} aria-hidden="true">
      <div className="absolute -inset-10 animate-bulb rounded-full bg-[radial-gradient(circle,rgba(255,196,120,0.38),transparent_62%)]" />
      <svg viewBox="0 0 30 64" className="relative h-full w-full" overflow="visible">
        <ellipse cx="15" cy="61" rx="14" ry="3.5" fill="#20172a" opacity="0.45" />
        <rect x="7" y="26" width="16" height="35" rx="3" fill="#f3e6d4" stroke="#cdb795" strokeWidth="1.5" />
        <path d="M 7.5 29 Q 10 35 12 30 Q 13.5 39 16 32 Q 18.5 36 22.5 29 L 22.5 27 L 7.5 27 Z" fill="#fff6e8" />
        <line x1="15" y1="26" x2="15" y2="20" stroke="#4a3a30" strokeWidth="1.5" />
        <g className="animate-flicker" style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}>
          <path d="M 15 3 C 21 11 22 16 15 22 C 8 16 9 11 15 3 Z" fill="#ffc96a" />
          <path d="M 15 10 C 17.5 14 17.8 17.5 15 20 C 12.2 17.5 12.5 14 15 10 Z" fill="#fff4d6" />
        </g>
      </svg>
    </div>
  );
}
