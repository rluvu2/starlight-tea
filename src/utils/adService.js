/**
 * ─────────────────────────────────────────────────────────────────────
 *  별빛 찻집 · 보상형 광고 (Google H5 Games Ads / Ad Placement API)
 * ─────────────────────────────────────────────────────────────────────
 *  '팽주의 조언'을 열어 주는 보상형 광고(type: 'reward')를 요청한다.
 *
 *  원칙
 *   - 유저가 [광고 보고 조언 듣기]를 직접 눌렀을 때만 호출한다. (자동 재생 금지)
 *   - 끝까지 봄(viewed) → onReward / 중간에 닫음(dismissed) → onDismiss
 *   - 그 밖의 모든 경우(광고 재고 없음, 로드 실패, 광고 차단기, 응답 없음)는
 *     유저를 막지 않도록 onReward 로 처리한다.
 *   - 광고가 화면에 뜨기 직전 onPause(소리 멈춤), 끝난 뒤 onResume(소리 재개)
 *
 *  index.html 의 광고 스니펫이 window.adBreak 를 준비한다. (vite.config.js 참고)
 */

const PLACEMENT_NAME = 'pengju_advice';
const REQUEST_TIMEOUT_MS = 8000; // 광고 응답을 기다리는 최대 시간
const SHOW_TIMEOUT_MS = 10000; // 광고를 띄우라고 한 뒤 실제로 뜰 때까지 기다리는 최대 시간

/** 광고 스크립트를 쓸 수 있는 상태인지 (스니펫이 없거나 차단되면 false) */
export function isAdAvailable() {
  if (typeof window === 'undefined') return false;
  return typeof window.adBreak === 'function' && window.__adsBlocked !== true;
}

/**
 * @param {{ onReward?: () => void, onDismiss?: () => void, onPause?: () => void, onResume?: () => void }} handlers
 * @returns {() => void} 요청 취소 함수 (화면을 떠날 때 호출하면 이후 콜백을 무시한다)
 */
export function requestRewardedAd({ onReward, onDismiss, onPause, onResume } = {}) {
  let settled = false; // 보상/거절 결과는 한 번만 전달한다
  let paused = false;
  let cancelled = false;
  let timer = null;

  const resume = () => {
    if (!paused) return;
    paused = false;
    onResume?.();
  };
  const settle = (callback) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    resume();
    if (!cancelled) callback?.();
  };
  const reward = () => settle(onReward);
  const dismiss = () => settle(onDismiss);
  const watchdog = (ms) => {
    clearTimeout(timer);
    timer = setTimeout(reward, ms);
  };

  // 광고 스크립트가 없거나 차단됨 → 기다리지 않고 바로 보상
  if (!isAdAvailable()) {
    queueMicrotask(reward);
    return () => {
      cancelled = true;
    };
  }

  watchdog(REQUEST_TIMEOUT_MS);
  try {
    window.adBreak({
      type: 'reward',
      name: PLACEMENT_NAME,
      // 보여 줄 광고가 준비됨: 유저가 이미 버튼을 눌러 선택했으므로 바로 띄운다
      beforeReward: (showAdFn) => {
        if (settled || cancelled) return; // 이미 시간 초과로 조언을 열었다면 뒤늦게 광고를 띄우지 않는다
        watchdog(SHOW_TIMEOUT_MS);
        try {
          showAdFn();
        } catch {
          reward();
        }
      },
      beforeAd: () => {
        clearTimeout(timer); // 광고가 재생되는 동안에는 시간 제한을 두지 않는다
        if (!paused) {
          paused = true;
          onPause?.();
        }
      },
      afterAd: () => resume(),
      adViewed: () => reward(),
      adDismissed: () => dismiss(),
      adBreakDone: (placementInfo) => {
        const status = placementInfo?.breakStatus;
        if (status === 'viewed') reward();
        else if (status === 'dismissed') dismiss();
        else reward(); // notReady, timeout, error, noAdPreloaded, frequencyCapped, ignored, other, invalid …
      },
    });
  } catch {
    reward();
  }

  return () => {
    cancelled = true;
    clearTimeout(timer);
    resume();
  };
}
