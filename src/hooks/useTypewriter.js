import { useEffect, useMemo, useState } from 'react';

const PAUSE_CHARS = /[.,!?…\n]/;

// 화면을 누르면 지금 나오고 있는 대사를 먼저 끝까지 보여 준다 (손님 말풍선, 팽주의 조언)
let skipCurrent = null;

/** 타자 중인 대사가 있으면 끝까지 보여 주고 true. 없으면 false (그때는 다음으로 넘어가면 된다) */
export function skipTyping() {
  if (!skipCurrent) return false;
  skipCurrent();
  return true;
}

/**
 * 한 글자씩 타자기처럼 보여 준다. 쉼표·마침표 뒤에서는 잠깐 쉰다.
 * skippable 이면 타자 중에 skipTyping() 으로 바로 끝낼 수 있다.
 */
export function useTypewriter(text, { speed = 34, instant = false, skippable = false } = {}) {
  const chars = useMemo(() => Array.from(text ?? ''), [text]);
  const [count, setCount] = useState(instant ? chars.length : 0);
  const done = count >= chars.length;

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

  useEffect(() => {
    if (!skippable || done) return undefined;
    const skip = () => setCount(chars.length);
    skipCurrent = skip;
    return () => {
      if (skipCurrent === skip) skipCurrent = null;
    };
  }, [skippable, done, chars]);

  return {
    shown: chars.slice(0, count).join(''),
    done,
    complete: () => setCount(chars.length),
  };
}
