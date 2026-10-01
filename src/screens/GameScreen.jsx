// 게임 화면: 상단(별조각·메뉴) / 가운데 50dvh(상태별 장면) / 하단(재료 3×3 + 메인 버튼, 로비에서는 메인 메뉴)
import { AnimatePresence, m } from 'framer-motion';
import { useEffect, useState } from 'react';
import { playSfx } from '../audio/engine.js';
import ActionPanel, { TapToContinue } from '../components/ActionPanel.jsx';
import Counter from '../components/Counter.jsx';
import FairyLights from '../components/FairyLights.jsx';
import TopBar from '../components/TopBar.jsx';
import { ADVICE_TEXT, GUEST_TEXT } from '../data/scripts.js';
import { PHASE, useGameState } from '../hooks/useGameState.js';
import { skipTyping } from '../hooks/useTypewriter.js';
import AdGatePhase from './phases/AdGatePhase.jsx';
import AdvicePhase from './phases/AdvicePhase.jsx';
import { GuestCup, GuestOverlay, GuestSprite } from './phases/GuestPhase.jsx';
import { LobbyMenu, LobbyScene } from './phases/LobbyPhase.jsx';
import ReflectionPhase from './phases/ReflectionPhase.jsx';

export default function GameScreen({ onOpenCollection, onOpenSettings }) {
  const { state, actions } = useGameState();
  const { phase, guest } = state;

  // "화면 터치 시 다음으로": 손님을 위로한 뒤 / 팽주의 조언을 들은 뒤
  // 대사를 읽기도 전에 연타로 넘어가지 않도록 잠깐 뒤에 켠다
  const continuable = (phase === PHASE.GUEST && guest?.step === 'comforted') || phase === PHASE.ADVICE;
  const [tapToContinue, setTapToContinue] = useState(false);
  useEffect(() => {
    setTapToContinue(false);
    if (!continuable) return undefined;
    const timer = setTimeout(() => setTapToContinue(true), 1200);
    return () => clearTimeout(timer);
  }, [continuable, phase]);

  // 터치 영역은 가운데 장면과 하단 패널에 따로 깐다. (패널의 [찻잎 | 과일] 탭은 그 위에 남아 계속 누를 수 있다)
  // 대사가 아직 나오는 중이면 첫 터치는 대사를 끝까지 보여 주기만 한다
  const tapOverlay = tapToContinue
    ? {
        label: phase === PHASE.ADVICE ? ADVICE_TEXT.backButton : GUEST_TEXT.continueButton,
        onContinue: () => {
          if (skipTyping()) return;
          playSfx(phase === PHASE.ADVICE ? 'page' : 'farewell');
          actions.toCrossroads();
        },
      }
    : null;

  return (
    <m.main
      className="relative z-10 mx-auto flex h-full max-w-md flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <TopBar onOpenCollection={onOpenCollection} onOpenSettings={onOpenSettings} />

      <div className="relative flex min-h-0 flex-1 flex-col">
        {/* 가운데: 상태별 장면 (50dvh) */}
        <section
          aria-label="찻집"
          className="relative h-[50dvh] shrink-0 overflow-hidden"
          style={{
            containerType: 'size',
            '--guest-w': 'min(70cqw, 300px, 62cqh)',
            '--counter-h': 'clamp(52px, 17cqh, 80px)',
          }}
        >
          <FairyLights className="absolute inset-x-0 top-0 w-full" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[75%] bg-[radial-gradient(60%_55%_at_50%_100%,rgba(255,190,120,0.17),transparent)]" />

          <GuestSprite />
          <Counter>
            <GuestCup />
          </Counter>

          <AnimatePresence mode="wait">
            {phase === PHASE.GUEST && <GuestOverlay key={`guest-${state.visitKey}`} />}
            {phase === PHASE.CROSSROADS && <LobbyScene key="lobby" />}
            {phase === PHASE.REFLECTION && <ReflectionPhase key="reflection" />}
            {phase === PHASE.AD_GATE && <AdGatePhase key="ad-gate" />}
            {phase === PHASE.ADVICE && <AdvicePhase key="advice" />}
          </AnimatePresence>

          {tapOverlay && <TapToContinue {...tapOverlay} />}
        </section>

        {/* 하단: 재료 3×3 + 메인 버튼 / 로비에서는 메인 메뉴 */}
        <AnimatePresence mode="wait" initial={false}>
          {phase === PHASE.CROSSROADS ? (
            <LobbyMenu key="lobby-menu" onOpenCollection={onOpenCollection} />
          ) : (
            <m.div
              key="action-panel"
              className="flex min-h-0 flex-1 flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              transition={{ duration: 0.35 }}
            >
              <ActionPanel tapOverlay={tapOverlay} />
            </m.div>
          )}
        </AnimatePresence>

      </div>
    </m.main>
  );
}
