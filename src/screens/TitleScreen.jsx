import { m } from 'framer-motion';
import { IconButton, PrimaryButton, SecondaryButton } from '../components/Buttons.jsx';
import { BookIcon, GearIcon } from '../components/icons.jsx';
import { buildCollection, useGameState } from '../hooks/useGameState.js';

// 언덕 위, 창문에 불이 켜진 작은 찻집
function TeahouseIllustration() {
  const eaveLights = Array.from({ length: 9 }, (_, i) => {
    const t = (i + 0.5) / 9;
    return { x: 106 + t * 108, y: 99 + Math.sin(t * Math.PI) * 6 };
  });
  return (
    <svg viewBox="0 0 300 200" className="w-full" aria-hidden="true" overflow="visible">
      <defs>
        <radialGradient id="title-glow" cx="0.5" cy="0.55" r="0.5">
          <stop offset="0" stopColor="#ffcf8a" stopOpacity="0.42" />
          <stop offset="1" stopColor="#ffcf8a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="title-hill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f2258" />
          <stop offset="0.55" stopColor="#151845" stopOpacity="0.85" />
          <stop offset="1" stopColor="#0d1031" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="title-window" cx="0.45" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#fff1c9" />
          <stop offset="1" stopColor="#f5b45e" />
        </radialGradient>
      </defs>

      <ellipse cx="160" cy="118" rx="130" ry="90" fill="url(#title-glow)" />
      <path d="M 0 200 L 0 170 C 60 142 120 134 170 138 C 222 142 268 156 300 172 L 300 200 Z" fill="url(#title-hill)" />
      <path d="M 177 150 C 172 166 150 178 128 200" fill="none" stroke="#ffd59a" strokeOpacity="0.22" strokeWidth="9" strokeLinecap="round" />

      {/* 나무 */}
      <rect x="52" y="128" width="5" height="22" rx="2" fill="#141739" />
      <circle cx="54" cy="118" r="17" fill="#18204a" />
      <circle cx="44" cy="128" r="11" fill="#18204a" />
      <circle cx="65" cy="127" r="12" fill="#18204a" />

      {/* 굴뚝과 김 */}
      <rect x="182" y="58" width="13" height="30" fill="#1b1945" />
      <g className="animate-steam" style={{ animationDuration: '4s', transformBox: 'fill-box', transformOrigin: '50% 100%' }}>
        <path d="M 188 54 C 182 44 194 38 188 28 C 184 20 190 14 188 8" fill="none" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="3.5" strokeLinecap="round" />
      </g>

      {/* 집 */}
      <rect x="112" y="92" width="96" height="58" rx="3" fill="#2c2961" />
      <path d="M 100 98 L 160 52 L 220 98 Z" fill="#1d1a48" stroke="#14123a" strokeWidth="3" strokeLinejoin="round" />
      <path d="M 104 98 L 216 98" stroke="#3a3577" strokeWidth="3" strokeLinecap="round" />
      {eaveLights.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="1.9" fill="#ffd98f" className="animate-bulb" style={{ animationDelay: `${i * 0.3}s` }} />
      ))}

      {/* 둥근 창 */}
      <circle cx="137" cy="118" r="20" fill="#ffcf8a" opacity="0.25" />
      <circle cx="137" cy="118" r="13" fill="url(#title-window)" stroke="#1d1a48" strokeWidth="3" />
      <path d="M 137 105 L 137 131 M 124 118 L 150 118" stroke="#1d1a48" strokeWidth="2.5" />

      {/* 문과 간판 */}
      <path d="M 167 150 L 167 125 A 11 11 0 0 1 189 125 L 189 150 Z" fill="#ffd28e" />
      <path d="M 167 150 L 167 125 A 11 11 0 0 1 178 114 L 178 150 Z" fill="#ffe6b8" opacity="0.6" />
      <rect x="161" y="102" width="34" height="9" rx="2" fill="#3a3577" />
      <path d="m 178 103.5 1.2 2.4 2.6 .4 -1.9 1.8 .45 2.6 -2.35 -1.25 -2.35 1.25 .45 -2.6 -1.9 -1.8 2.6 -.4 z" fill="#ffd98f" />

      {/* 문 옆 등불 */}
      <line x1="198" y1="112" x2="198" y2="118" stroke="#14123a" strokeWidth="1.5" />
      <circle cx="198" cy="123" r="9" fill="#ffcf8a" opacity="0.25" />
      <rect x="194.5" y="118" width="7" height="10" rx="2" fill="#ffd98f" />

      {/* 반딧불 */}
      {[
        [86, 150],
        [232, 132],
        [250, 160],
        [100, 176],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.6" fill="#fff3c4" className="animate-bulb" style={{ animationDelay: `${i * 0.8}s` }} />
      ))}
    </svg>
  );
}

const BASE = import.meta.env.BASE_URL;

export default function TitleScreen({ onStart, onOpenCollection, onOpenSettings }) {
  const { state } = useGameState();
  const entries = buildCollection(state.save);
  const comfortedCount = entries.filter((e) => e.status === 'comforted').length;
  const { stars } = state.save;

  return (
    <m.main
      className="relative z-10 mx-auto flex h-full max-w-md flex-col px-safe pb-safe pt-safe"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
    >
      <div className="flex justify-end">
        <IconButton label="설정" sound="page" onClick={onOpenSettings}>
          <GearIcon />
        </IconButton>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <m.div
          className="w-[80%] max-w-[310px]"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 1.2, ease: 'easeOut' }}
        >
          <TeahouseIllustration />
        </m.div>
        <m.h1
          className="mt-5 font-serif text-[44px] font-bold leading-none text-lamp-100 drop-shadow-[0_0_24px_rgba(255,214,150,0.45)]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 1.1 }}
        >
          별빛 찻집
        </m.h1>
        <m.p
          className="mt-3 text-[11px] tracking-[0.42em] text-ink-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1.2 }}
        >
          STARLIGHT TEAHOUSE
        </m.p>
        <m.p
          className="mt-5 text-[15px] text-ink-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.05, duration: 1.2 }}
        >
          지친 마음이 쉬어 가는 곳
        </m.p>
      </div>

      <m.div
        className="space-y-2.5"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.8 }}
      >
        <PrimaryButton sound="chime" feel="medium" onClick={onStart}>
          찻집 문 열기
        </PrimaryButton>
        <SecondaryButton sound="page" onClick={onOpenCollection}>
          <BookIcon className="h-4.5 w-4.5 text-lamp-300" />
          손님 도감
          <span className="tabular-nums text-ink-400">
            {comfortedCount} / {entries.length}
          </span>
        </SecondaryButton>
      </m.div>
      <p className="mt-4 text-center text-xs text-ink-400">
        {stars > 0 ? `지금까지 모은 별조각 ${stars}개` : '소리를 켜고 들으면 더 포근해요'}
      </p>
      <nav className="mt-2 flex justify-center gap-3 text-[11px] text-ink-400" aria-label="안내 페이지">
        <a href={`${BASE}about.html`} className="px-1 py-1 underline-offset-4 hover:underline">
          게임 소개
        </a>
        <span aria-hidden="true">·</span>
        <a href={`${BASE}privacy.html`} className="px-1 py-1 underline-offset-4 hover:underline">
          개인정보처리방침
        </a>
      </nav>
    </m.main>
  );
}
