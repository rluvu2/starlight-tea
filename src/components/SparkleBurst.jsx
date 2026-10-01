import { m } from 'framer-motion';
import { useMemo } from 'react';
import { SparkleIcon } from './icons.jsx';

const COLORS = ['#ffe7a8', '#ffd08a', '#fff6e0', '#ffc2b0', '#d9f2ff'];

// 정답 차를 마셨을 때 손님 주위로 터지는 별가루
export default function SparkleBurst({ count = 24 }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.35;
        const distance = 80 + Math.random() * 90;
        return {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance * 0.85 - 24,
          size: 8 + Math.random() * 11,
          delay: Math.random() * 0.3,
          rotate: (Math.random() - 0.5) * 240,
          color: COLORS[i % COLORS.length],
        };
      }),
    [count],
  );

  return (
    <div className="pointer-events-none absolute left-1/2 top-[42%] z-20 h-0 w-0" aria-hidden="true">
      <m.div
        className="absolute -left-20 -top-20 h-40 w-40 rounded-full border-2 border-lamp-200/70"
        initial={{ scale: 0.2, opacity: 0.9 }}
        animate={{ scale: 2.6, opacity: 0 }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
      />
      {particles.map((p, i) => (
        <m.span
          key={i}
          className="absolute"
          style={{ left: -p.size / 2, top: -p.size / 2, width: p.size, height: p.size, color: p.color }}
          initial={{ x: 0, y: 0, scale: 0, opacity: 0, rotate: 0 }}
          animate={{ x: p.x, y: p.y, scale: [0, 1.2, 0.7], opacity: [0, 1, 0], rotate: p.rotate }}
          transition={{ duration: 1.8, delay: p.delay, ease: 'easeOut' }}
        >
          <SparkleIcon className="h-full w-full drop-shadow-[0_0_6px_rgba(255,220,150,0.9)]" />
        </m.span>
      ))}
    </div>
  );
}
