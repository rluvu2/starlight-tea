import { AnimatePresence, m } from 'framer-motion';
import { useState } from 'react';
import { playSfx } from '../audio/engine.js';
import { INTRO_LINES } from '../data/scripts.js';
import { haptic } from '../utils/haptics.js';

// 처음 한 번만 보여 주는 이야기
export default function IntroScreen({ onDone }) {
  const [index, setIndex] = useState(0);
  const last = INTRO_LINES.length - 1;

  const next = () => {
    playSfx('tap');
    haptic('light');
    if (index < last) setIndex(index + 1);
    else onDone();
  };

  return (
    <m.main
      className="relative z-10 mx-auto flex h-full max-w-md cursor-pointer flex-col px-safe pb-safe pt-safe"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6 } }}
      onClick={next}
    >
      <div className="flex justify-end">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            playSfx('tap');
            onDone();
          }}
          className="rounded-full px-3 py-2 text-sm text-ink-400"
        >
          건너뛰기
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center px-4">
        <AnimatePresence mode="wait">
          <m.p
            key={index}
            className="whitespace-pre-line break-keep text-center font-serif text-[21px] leading-[1.9] text-ink-100"
            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={{ duration: 0.9 }}
          >
            {INTRO_LINES[index]}
          </m.p>
        </AnimatePresence>
      </div>

      <div className="flex flex-col items-center gap-3 pb-6">
        <div className="flex gap-2">
          {INTRO_LINES.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === index ? 'w-6 bg-lamp-300' : 'w-1.5 bg-white/25'}`} />
          ))}
        </div>
        <m.p
          className="text-xs text-ink-400"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 2.4 }}
        >
          {index < last ? '화면을 눌러 계속' : '화면을 눌러 찻집 문 열기'}
        </m.p>
      </div>
    </m.main>
  );
}
