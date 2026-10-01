// Phase 1: 손님 맞이 — 카운터 뒤의 손님, 카운터 위의 찻잔, 위쪽 말풍선
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { playSfx } from '../../audio/engine.js';
import GuestImage, { probeHappyImage } from '../../components/GuestImage.jsx';
import { launchMeteors } from '../../components/NightSky.jsx';
import SparkleBurst from '../../components/SparkleBurst.jsx';
import { StarIcon } from '../../components/icons.jsx';
import { GlassCup, Steam } from '../../components/teaware.jsx';
import { OWNER_NAME } from '../../data/scripts.js';
import { PHASE, useGameState } from '../../hooks/useGameState.js';
import { useTypewriter } from '../../hooks/useTypewriter.js';
import { guestById, ingredientById } from '../../logic/gameData.js';
import { haptic } from '../../utils/haptics.js';

const SERVING_MS = 1900; // 손님이 차를 마시는 시간

// 같은 반응이 화면을 다시 그릴 때 반복되지 않도록 기억해 둔다
let lastReaction = null;

function reactionFor(step) {
  if (step === 'serving') {
    return {
      animate: { y: [0, 0, 6, 0, 6, 0], rotate: [0, 0, -2, 0, -2, 0], scale: 1, filter: 'brightness(1)' },
      transition: { duration: 1.8, times: [0, 0.3, 0.45, 0.6, 0.75, 1], ease: 'easeInOut' },
    };
  }
  if (step === 'comforted') {
    return { animate: { y: 0, rotate: 0, scale: 1.03, filter: 'brightness(1.08)' }, transition: { duration: 1.4, ease: 'easeOut' } };
  }
  if (step === 'missed') {
    return { animate: { y: 0, rotate: [0, -3, -3, 0], scale: 1, filter: 'brightness(1)' }, transition: { duration: 1.4, ease: 'easeInOut' } };
  }
  return { animate: { y: 0, rotate: 0, scale: 1, filter: 'brightness(1)' }, transition: { duration: 0.8 } };
}

/** 카운터 뒤에 서 있는 손님 (Phase 1 에서만 보이고, 떠날 때 위로 흐려진다) */
export function GuestSprite() {
  const { state } = useGameState();
  const { phase, guest, visitKey } = state;
  const data = guest ? guestById(guest.id) : null;
  const visible = phase === PHASE.GUEST && data;
  const reaction = reactionFor(guest?.step);

  useEffect(() => {
    if (data) probeHappyImage(data.appearance); // 정답 뒤 바뀔 표정 그림을 미리 확인
  }, [data]);

  return (
    <div
      className="absolute left-1/2 z-0 -translate-x-1/2"
      style={{ width: 'var(--guest-w)', bottom: 'calc(var(--counter-h) - var(--guest-w) * 0.2)' }}
    >
      <AnimatePresence>
        {visible && (
          <m.div
            key={visitKey}
            className="relative"
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18, transition: { duration: 0.9, ease: 'easeIn' } }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <AnimatePresence>
              {guest.step === 'comforted' && (
                <m.div
                  className="absolute -inset-[14%] rounded-full bg-[radial-gradient(circle,rgba(255,214,150,0.5),transparent_62%)]"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0, 1, 0.75], scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.8 }}
                />
              )}
            </AnimatePresence>
            <m.div animate={reaction.animate} transition={reaction.transition}>
              <m.div className="relative" animate={{ y: [0, -4, 0] }} transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}>
                <GuestImage guest={data} className="block w-full" />
                <AnimatePresence>
                  {guest.step === 'comforted' && (
                    <m.div
                      className="absolute inset-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.1, delay: 0.3 }}
                    >
                      <GuestImage guest={data} mood="happy" happyOnly className="block w-full" />
                    </m.div>
                  )}
                </AnimatePresence>
              </m.div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** 카운터 위에 내려놓은 찻잔 */
export function GuestCup() {
  const { state } = useGameState();
  const { phase, guest, visitKey } = state;
  const served = guest?.servedId ? ingredientById(guest.servedId) : null;
  const visible = phase === PHASE.GUEST && served && guest.step !== 'talking';
  return (
    <AnimatePresence>
      {visible && (
        <m.div
          key={`${visitKey}-${guest.tried.length}`}
          className="absolute bottom-[calc(100%-10px)] left-1/2 w-[19%] max-w-[74px] -translate-x-1/2"
          initial={{ opacity: 0, y: 24, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <Steam className="absolute -top-[52%] left-1/2 w-[62%] -translate-x-1/2" />
          <GlassCup
            color={served.color}
            level={0.45}
            initialLevel={1}
            transition={{ delay: 0.8, duration: 1.4, ease: 'easeInOut' }}
            className="w-full"
          />
        </m.div>
      )}
    </AnimatePresence>
  );
}

function SpeechBubble({ line, guestName }) {
  const reduceMotion = useReducedMotion();
  const { shown } = useTypewriter(line.text, { instant: reduceMotion, speed: 32 });
  const nameTag = line.speaker === 'guest' ? guestName : line.speaker === 'owner' ? OWNER_NAME : null;
  return (
    <div className="relative rounded-[22px] border border-white/10 bg-night-800/85 px-4 pb-3.5 pt-4 shadow-[0_16px_40px_-18px_rgba(0,0,0,0.9)] backdrop-blur-md">
      {nameTag && (
        <span className="absolute -top-3 left-4 max-w-[80%] truncate rounded-full bg-lamp-300 px-3 py-0.5 font-serif text-[12.5px] font-bold text-night-900 shadow-md">
          {nameTag}
        </span>
      )}
      <p
        aria-live="polite"
        className={`min-h-[3.2em] whitespace-pre-line break-keep font-serif text-[15px] leading-[1.6] ${
          line.speaker === 'narration' ? 'text-center text-ink-300' : 'text-ink-100'
        }`}
      >
        {shown}
      </p>
      {/* 말꼬리 */}
      <span className="absolute -bottom-[7px] left-1/2 h-3.5 w-3.5 -translate-x-1/2 rotate-45 border-b border-r border-white/10 bg-night-800/85" />
    </div>
  );
}

/** 별조각이 손님에게서 상단 별조각 칸으로 날아간다 */
function StarFlight({ amount, from }) {
  const [path, setPath] = useState(null);
  useEffect(() => {
    const target = document.getElementById('star-counter')?.getBoundingClientRect();
    const source = from.current?.getBoundingClientRect();
    if (!target || !source) return;
    const start = { x: source.left + source.width / 2, y: source.top + source.height * 0.45 };
    const end = { x: target.left + 18, y: target.top + target.height / 2 };
    setPath({ start, dx: end.x - start.x, dy: end.y - start.y });
  }, [from]);
  if (!path) return null;
  return (
    <m.div
      className="pointer-events-none fixed z-[70] -ml-4 -mt-4 flex h-8 items-center gap-0.5 text-lamp-200"
      style={{ left: path.start.x, top: path.start.y }}
      initial={{ x: 0, y: 0, scale: 0.4, opacity: 0 }}
      animate={{ x: [0, path.dx * 0.25, path.dx], y: [0, -70, path.dy], scale: [0.4, 1.4, 0.7], opacity: [0, 1, 1, 0] }}
      transition={{
        duration: 1,
        delay: 0.5,
        ease: 'easeInOut',
        times: [0, 0.4, 1],
        opacity: { duration: 1, delay: 0.5, times: [0, 0.15, 0.85, 1] },
      }}
      aria-hidden="true"
    >
      <StarIcon className="h-8 w-8 drop-shadow-[0_0_10px_rgba(255,214,150,0.95)]" />
      <span className="font-serif text-lg font-bold">+{amount}</span>
    </m.div>
  );
}

/** 말풍선과 정답 연출 (카운터보다 위에 그려진다) */
export function GuestOverlay() {
  const { state, actions } = useGameState();
  const { guest, visitKey } = state;
  const data = guestById(guest?.id);
  const anchor = useRef(null);

  // 손님 등장
  useEffect(() => {
    playSfx('chime');
  }, [visitKey]);

  // 차를 마시는 동안 잠시 기다렸다가 결과
  useEffect(() => {
    if (guest?.step !== 'serving') return undefined;
    const timer = setTimeout(actions.resolveServe, SERVING_MS);
    return () => clearTimeout(timer);
  }, [guest?.step, actions]);

  // 결과 반응 (같은 결과는 한 번만)
  useEffect(() => {
    if (guest?.step !== 'comforted' && guest?.step !== 'missed') return;
    const key = `${visitKey}-${guest.tried.length}-${guest.step}`;
    if (lastReaction === key) return;
    lastReaction = key;
    if (guest.step === 'comforted') {
      playSfx('sparkle');
      haptic('success');
      launchMeteors(4);
      setTimeout(() => playSfx('star'), 1400);
    } else {
      playSfx('soft');
      haptic('soft');
    }
  }, [guest?.step, guest?.tried.length, visitKey]);

  if (!guest || !data) return null;
  return (
    <m.div className="pointer-events-none absolute inset-0 z-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-x-4 top-[min(12cqw,52px)]">
        <SpeechBubble line={guest.line} guestName={data.name} />
      </div>
      <div
        ref={anchor}
        className="absolute left-1/2 -translate-x-1/2"
        style={{ width: 'var(--guest-w)', height: 'calc(var(--guest-w) * 0.8)', bottom: 'var(--counter-h)' }}
      >
        {guest.step === 'comforted' && <SparkleBurst key={`burst-${visitKey}`} />}
      </div>
      {guest.step === 'comforted' && guest.reward > 0 && <StarFlight key={`star-${visitKey}`} amount={guest.reward} from={anchor} />}
    </m.div>
  );
}
