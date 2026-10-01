import { useEffect, useState } from 'react';
import { guestHappyImageUrl, guestImageUrl } from '../utils/assets.js';

// 손님 그림.
// - appearance 파일이 아직 없으면 실루엣으로 대신한다.
// - mood="happy" 이면 같은 이름 뒤에 _happy 가 붙은 파일(예: bear_tired_happy.png)을 찾아 쓴다.
//   그런 파일이 없으면 원래 그림을 그대로 쓴다. (선택 사항: 데이터 규격은 바뀌지 않는다)

const happyProbes = new Map(); // url → Promise<boolean>
const happyKnown = new Map(); // url → boolean (확인이 끝난 결과)

/** 표정 변화 그림이 있는지 미리 확인해 둔다 (손님이 들어올 때 호출) */
export function probeHappyImage(appearance) {
  if (!appearance) return Promise.resolve(false);
  const url = guestHappyImageUrl(appearance);
  if (!happyProbes.has(url)) {
    happyProbes.set(
      url,
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
      }).then((ok) => {
        happyKnown.set(url, ok);
        return ok;
      }),
    );
  }
  return happyProbes.get(url);
}

function useHappyAvailable(appearance, enabled) {
  const url = appearance ? guestHappyImageUrl(appearance) : null;
  const [available, setAvailable] = useState(() => Boolean(enabled && url && happyKnown.get(url)));
  useEffect(() => {
    if (!enabled || !appearance) {
      setAvailable(false);
      return undefined;
    }
    let alive = true;
    probeHappyImage(appearance).then((ok) => alive && setAvailable(ok));
    return () => {
      alive = false;
    };
  }, [appearance, enabled]);
  return available;
}

/**
 * @param mood 'default' | 'happy'
 * @param happyOnly true 이면 표정 변화 그림이 없을 때 아무것도 그리지 않는다 (겹쳐서 바꿔 보일 때 사용)
 */
export default function GuestImage({ guest, mood = 'default', happyOnly = false, silhouette = false, className = '', style }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const happy = useHappyAvailable(guest?.appearance, mood === 'happy' && !silhouette);

  if (happyOnly && !happy) return null;

  const src = guest ? (happy ? guestHappyImageUrl(guest.appearance) : guestImageUrl(guest.appearance)) : null;
  if (!src || failedSrc === src) return <GuestPlaceholder className={className} style={style} dim={silhouette} />;

  return (
    <img
      src={src}
      alt={silhouette ? '아직 만나지 못한 손님' : guest.name}
      draggable={false}
      onError={() => setFailedSrc(src)}
      onContextMenu={(event) => event.preventDefault()}
      className={className}
      style={silhouette ? { ...style, filter: 'brightness(0)', opacity: 0.38 } : style}
    />
  );
}

function GuestPlaceholder({ className, style, dim }) {
  return (
    <svg viewBox="0 0 512 512" className={className} style={style} role="img" aria-label="그림을 준비 중인 손님">
      <g fill={dim ? '#000000' : '#2e336c'} opacity={dim ? 0.38 : 1}>
        <path d="M 92 520 C 100 428 150 374 212 360 L 300 360 C 362 374 412 428 420 520 Z" />
        <circle cx="256" cy="226" r="120" />
      </g>
      {!dim && (
        <text x="256" y="262" textAnchor="middle" fontSize="110" fill="#8f88b2" fontFamily="serif">
          ?
        </text>
      )}
    </svg>
  );
}
