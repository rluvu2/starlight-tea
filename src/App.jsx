import { AnimatePresence, domAnimation, LazyMotion, MotionConfig } from 'framer-motion';
import { useEffect, useState } from 'react';
import { setMusicEnabled, setSfxEnabled, unlockAudio } from './audio/engine.js';
import DataErrorBanner from './components/DataErrorBanner.jsx';
import NightSky from './components/NightSky.jsx';
import SettingsSheet from './components/SettingsSheet.jsx';
import { GameProvider, PHASE, useGameState } from './hooks/useGameState.js';
import CollectionScreen from './screens/CollectionScreen.jsx';
import GameScreen from './screens/GameScreen.jsx';
import IntroScreen from './screens/IntroScreen.jsx';
import TitleScreen from './screens/TitleScreen.jsx';
import { setHapticsEnabled } from './utils/haptics.js';

// 라우터 없이 phase 상태로 화면을 고른다 (GitHub Pages 에서 새로고침해도 404 가 나지 않는다)
function Screens() {
  const { state, actions } = useGameState();
  const { phase } = state;
  const { settings } = state.save;
  const [overlay, setOverlay] = useState(null); // 'collection' | 'settings' | null

  // 설정 → 소리·진동 모듈에 반영
  useEffect(() => {
    setMusicEnabled(settings.music);
    setSfxEnabled(settings.sfx);
    setHapticsEnabled(settings.haptics);
  }, [settings]);

  // 브라우저는 사용자의 첫 터치 이후에만 소리를 허락한다
  useEffect(() => {
    const unlock = () => unlockAudio();
    const events = ['pointerdown', 'touchend', 'keydown'];
    events.forEach((type) => window.addEventListener(type, unlock, { capture: true, passive: true }));
    return () => events.forEach((type) => window.removeEventListener(type, unlock, { capture: true }));
  }, []);

  const openCollection = () => setOverlay('collection');
  const openSettings = () => setOverlay('settings');
  const screen = phase === PHASE.TITLE ? 'title' : phase === PHASE.INTRO ? 'intro' : 'game';

  return (
    <div className="relative h-(--app-height) w-full overflow-hidden">
      <NightSky />

      <AnimatePresence mode="wait">
        {screen === 'title' && (
          <TitleScreen key="title" onStart={actions.openTeahouse} onOpenCollection={openCollection} onOpenSettings={openSettings} />
        )}
        {screen === 'intro' && <IntroScreen key="intro" onDone={actions.finishIntro} />}
        {screen === 'game' && <GameScreen key="game" onOpenCollection={openCollection} onOpenSettings={openSettings} />}
      </AnimatePresence>

      <AnimatePresence>{overlay === 'collection' && <CollectionScreen key="collection" onClose={() => setOverlay(null)} />}</AnimatePresence>
      <AnimatePresence>{overlay === 'settings' && <SettingsSheet key="settings" onClose={() => setOverlay(null)} />}</AnimatePresence>

      {import.meta.env.DEV && <DataErrorBanner />}
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      {/* Framer Motion 은 필요한 기능(domAnimation)만 불러와 번들을 가볍게 */}
      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion="user">
          <Screens />
        </MotionConfig>
      </LazyMotion>
    </GameProvider>
  );
}
