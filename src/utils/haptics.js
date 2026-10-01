// 터치 햅틱(진동) 피드백
// - 안드로이드 Chrome 등: Vibration API (navigator.vibrate)
// - iPhone Safari: Vibration API 미지원. iOS 18 이상에서는 'switch' 체크박스를 토글할 때
//   시스템 햅틱이 울리는 점을 이용해 가볍게 흉내 낸다 (사용자 탭 안에서만 동작, 공식 기능 아님).

const PATTERNS = {
  tick: 4,
  light: 8,
  medium: 14,
  success: [10, 50, 18],
  soft: [6, 40, 6],
};

let enabled = true;

export const canVibrate = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

export const isIOS =
  typeof navigator !== 'undefined' &&
  (/iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

export function setHapticsEnabled(on) {
  enabled = on;
}

function iosSwitchTick() {
  const label = document.createElement('label');
  label.setAttribute('aria-hidden', 'true');
  label.style.display = 'none';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.setAttribute('switch', '');
  label.appendChild(input);
  document.head.appendChild(label);
  label.click();
  document.head.removeChild(label);
}

export function haptic(kind = 'light') {
  if (!enabled) return;
  try {
    if (canVibrate) {
      navigator.vibrate(PATTERNS[kind] ?? PATTERNS.light);
      return;
    }
    // 연속으로 울리는 tick 은 iOS 에서 흉내 낼 수 없으므로 건너뛴다
    if (isIOS && kind !== 'tick') iosSwitchTick();
  } catch {
    /* 진동을 쓸 수 없는 환경 */
  }
}
