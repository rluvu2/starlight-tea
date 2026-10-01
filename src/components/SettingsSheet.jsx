import { m } from 'framer-motion';
import { useState } from 'react';
import { playSfx } from '../audio/engine.js';
import { useGameState } from '../hooks/useGameState.js';
import { canVibrate, haptic, isIOS } from '../utils/haptics.js';
import { SecondaryButton, TapButton } from './Buttons.jsx';
import Sheet from './Sheet.jsx';

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => {
        onChange(!checked);
        playSfx('tap');
        haptic('light');
      }}
      className="flex w-full items-center gap-4 rounded-2xl px-1 py-3 text-left"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] text-ink-100">{label}</span>
        {description && <span className="mt-0.5 block break-keep text-xs leading-relaxed text-ink-400">{description}</span>}
      </span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? 'bg-lamp-400' : 'bg-white/15'}`}>
        <m.span
          className="absolute top-1 h-5 w-5 rounded-full bg-white shadow"
          animate={{ left: checked ? 24 : 4 }}
          transition={{ type: 'spring', stiffness: 600, damping: 32 }}
        />
      </span>
    </button>
  );
}

const vibrationNote = canVibrate
  ? '버튼을 누르거나 차를 낼 때 살짝 떨려요.'
  : isIOS
    ? 'iPhone은 웹 진동을 공식 지원하지 않아, iOS 18 이상에서 가벼운 진동만 일부 느껴져요.'
    : '이 기기(브라우저)는 진동을 지원하지 않아요.';

const BASE = import.meta.env.BASE_URL;

export default function SettingsSheet({ onClose }) {
  const { state, actions } = useGameState();
  const { settings } = state.save;
  const setSetting = actions.setSetting;
  const [confirming, setConfirming] = useState(false);

  return (
    <Sheet title="설정" onClose={onClose}>
      <div className="divide-y divide-white/8">
        <ToggleRow
          label="배경 음악"
          description="그때그때 새로 연주되는 잔잔한 로파이 피아노"
          checked={settings.music}
          onChange={(v) => setSetting('music', v)}
        />
        <ToggleRow label="효과음" description="풍경 소리, 찻잔 소리 등" checked={settings.sfx} onChange={(v) => setSetting('sfx', v)} />
        <ToggleRow label="진동" description={vibrationNote} checked={settings.haptics} onChange={(v) => setSetting('haptics', v)} />
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/3 p-4">
        <p className="text-[15px] text-ink-100">기록 지우기</p>
        <p className="mt-1 break-keep text-xs leading-relaxed text-ink-400">보유 별조각과 손님 도감 기록이 모두 사라져요. (설정은 그대로)</p>
        {confirming ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <SecondaryButton onClick={() => setConfirming(false)}>그만두기</SecondaryButton>
            <TapButton
              feel="medium"
              onClick={() => {
                actions.resetProgress();
                onClose();
              }}
              className="flex h-12 items-center justify-center rounded-2xl border border-rose-300/30 bg-rose-400/15 text-[15px] text-rose-100"
            >
              모두 지우기
            </TapButton>
          </div>
        ) : (
          <SecondaryButton className="mt-3" onClick={() => setConfirming(true)}>
            기록 지우기
          </SecondaryButton>
        )}
      </div>

      <nav className="mt-4 grid grid-cols-2 gap-2 text-center text-[14px]" aria-label="안내 페이지">
        <a
          href={`${BASE}about.html`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl border border-white/10 bg-white/3 py-3 text-ink-200"
        >
          게임 소개
        </a>
        <a
          href={`${BASE}privacy.html`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl border border-white/10 bg-white/3 py-3 text-ink-200"
        >
          개인정보처리방침
        </a>
      </nav>

      <p className="mt-5 break-keep text-center text-xs leading-relaxed text-ink-400">
        별빛 찻집 v3.0
        <br />
        그림, 음악, 효과음은 모두 코드로 그리고 연주했어요.
      </p>
    </Sheet>
  );
}
