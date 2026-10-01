import { useEffect, useMemo, useState } from 'react';

const PAUSE_CHARS = /[.,!?…\n]/;

/** 한 글자씩 타자기처럼 보여 준다. 쉼표·마침표 뒤에서는 잠깐 쉰다. */
export function useTypewriter(text, { speed = 34, instant = false } = {}) {
  const chars = useMemo(() => Array.from(text ?? ''), [text]);
  const [count, setCount] = useState(instant ? chars.length : 0);

  useEffect(() => {
    if (instant) {
      setCount(chars.length);
      return undefined;
    }
    setCount(0);
    let timer;
    const step = (i) => {
      setCount((current) => Math.max(current, i));
      if (i >= chars.length) return;
      const delay = PAUSE_CHARS.test(chars[i - 1]) ? speed * 6 : speed;
      timer = setTimeout(() => step(i + 1), delay);
    };
    timer = setTimeout(() => step(1), speed * 3);
    return () => clearTimeout(timer);
  }, [chars, speed, instant]);

  return {
    shown: chars.slice(0, count).join(''),
    done: count >= chars.length,
    complete: () => setCount(chars.length),
  };
}
