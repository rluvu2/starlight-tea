// 방문 순서: 아직 마음을 데우지 못한 손님 중 가장 쉬운 단계(level)의 손님부터 찾아온다.
// 모든 손님의 마음을 데운 뒤에는 직전 손님만 빼고 고르게 다시 들른다.
// 배열에 손님을 추가하기만 하면 자동으로 후보에 포함된다.
import { pick } from './random.js';

/**
 * @param guests 검증을 통과한 손님 목록 (level 이 채워져 있다)
 * @param progress 세이브 { collection, lastGuestId }
 * @returns 고른 손님 (손님이 없으면 null)
 */
export function pickNextGuest(guests, { collection = {}, lastGuestId = null } = {}, random = Math.random) {
  if (!guests.length) return null;
  const waiting = guests.filter((guest) => !collection[guest.id]);
  if (waiting.length) {
    const level = Math.min(...waiting.map((guest) => guest.level));
    return pick(
      waiting.filter((guest) => guest.level === level),
      random,
    );
  }
  // 바로 직전 손님은 연달아 오지 않도록 (손님이 한 명뿐이면 예외)
  const pool = guests.length > 1 ? guests.filter((guest) => guest.id !== lastGuestId) : guests;
  return pick(pool, random);
}
