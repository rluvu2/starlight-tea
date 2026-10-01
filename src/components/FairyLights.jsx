import { useMemo } from 'react';
import { INGREDIENT_LIST } from '../logic/gameData.js';

// 찻집 위에 드리운 아홉 개의 전구 — 아홉 가지 과일의 빛깔
const P0 = [-10, 4];
const P1 = [200, 70];
const P2 = [410, 4];

function pointAt(t) {
  const u = 1 - t;
  return [u * u * P0[0] + 2 * u * t * P1[0] + t * t * P2[0], u * u * P0[1] + 2 * u * t * P1[1] + t * t * P2[1]];
}

export default function FairyLights({ className = '' }) {
  const bulbs = useMemo(() => {
    const colors = INGREDIENT_LIST.length ? INGREDIENT_LIST.map((i) => i.fruit.color) : ['#ffd08a'];
    return Array.from({ length: 9 }, (_, i) => {
      const [x, y] = pointAt((i + 0.5) / 9);
      return { x, y, color: colors[i % colors.length] };
    });
  }, []);

  return (
    <svg viewBox="0 0 400 74" className={className} aria-hidden="true" overflow="visible">
      <defs>
        {bulbs.map((b, i) => (
          <radialGradient key={i} id={`bulb-glow-${i}`}>
            <stop offset="0" stopColor={b.color} stopOpacity="0.75" />
            <stop offset="1" stopColor={b.color} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>
      <path d={`M ${P0[0]} ${P0[1]} Q ${P1[0]} ${P1[1]} ${P2[0]} ${P2[1]}`} fill="none" stroke="#2c2645" strokeWidth="1.6" />
      {bulbs.map((b, i) => (
        <g key={i} transform={`translate(${b.x.toFixed(1)} ${b.y.toFixed(1)})`}>
          <circle cy="13" r="15" fill={`url(#bulb-glow-${i})`} className="animate-bulb" style={{ animationDelay: `${(i * 0.41) % 3}s` }} />
          <line y1="0" y2="5" stroke="#2c2645" strokeWidth="1.4" />
          <rect x="-2.6" y="3.5" width="5.2" height="4" rx="1" fill="#4a4262" />
          <ellipse cy="12.5" rx="4.2" ry="5.4" fill={b.color} className="animate-bulb" style={{ animationDelay: `${(i * 0.41) % 3}s` }} />
          <ellipse cx="-1.3" cy="10.5" rx="1.1" ry="1.8" fill="#ffffff" opacity="0.75" />
        </g>
      ))}
    </svg>
  );
}
