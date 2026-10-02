// 방문 순서
//  1) 처음 순서(OPENING_VISITS): 예) 쉬움 손님 2명 → 보통 손님 2명의 마음을 데울 때까지는 그 단계 손님만
//  2) 그 뒤로는 아직 마음을 데우지 못한 손님 중에서 단계와 상관없이 무작위
//  3) 모든 손님의 마음을 데운 뒤에는 직전 손님만 빼고 고르게 다시 들른다
// 배열에 손님을 추가하기만 하면 자동으로 후보에 포함된다.
import { pick } from './random.js';

/** 처음 순서 중 지금 진행 중인 단계의 난이도 (처음 순서를 마쳤으면 null) */
export function openingLevel(guests, collection = {}, opening = []) {
  for (const { level, count } of opening) {
    const pool = guests.filter((guest) => guest.level === level);
    const done = pool.filter((guest) => collection[guest.id]).length;
    if (done < count && done < pool.length) return level;
  }
  return null;
}

/**
 * 지금 방문 단계
 * @returns {{ kind: 'opening', level } | { kind: 'free', left } | { kind: 'complete' }}
 *   opening 처음 순서 진행 중 / free 남은 손님 무작위 (left: 아직 데우지 못한 손님 수) / complete 모두 데움
 */
export function visitStage(guests, collection = {}, opening = []) {
  const level = openingLevel(guests, collection, opening);
  if (level !== null) return { kind: 'opening', level };
  const left = guests.filter((guest) => !collection[guest.id]).length;
  return left > 0 ? { kind: 'free', left } : { kind: 'complete' };
}

/**
 * 한 손님을 데운 뒤 로비에서 한 번 알려 줄 소식 (바뀐 게 없으면 null)
 *  levelUp 처음 순서의 다음 단계가 열림 / open 처음 순서를 마쳐 모든 단계가 섞여 옴 / complete 모두 데움
 */
export function stageMilestone(before, after) {
  if (after.kind === 'complete') return before.kind === 'complete' ? null : { kind: 'complete' };
  if (after.kind === 'opening') return before.kind === 'opening' && before.level !== after.level ? { kind: 'levelUp', level: after.level } : null;
  return before.kind === 'opening' ? { kind: 'open' } : null;
}

/**
 * @param guests 검증을 통과한 손님 목록 (level 이 채워져 있다)
 * @param progress 세이브 { collection, lastGuestId }
 * @param opening 처음 순서 [{ level, count }]
 * @returns 고른 손님 (손님이 없으면 null)
 */
export function pickNextGuest(guests, { collection = {}, lastGuestId = null } = {}, random = Math.random, opening = []) {
  if (!guests.length) return null;
  const fresh = guests.filter((guest) => !collection[guest.id]);
  const level = openingLevel(guests, collection, opening);
  if (level !== null) return pick(fresh.filter((guest) => guest.level === level), random);
  if (fresh.length) return pick(fresh, random);
  // 바로 직전 손님은 연달아 오지 않도록 (손님이 한 명뿐이면 예외)
  const pool = guests.length > 1 ? guests.filter((guest) => guest.id !== lastGuestId) : guests;
  return pick(pool, random);
}
