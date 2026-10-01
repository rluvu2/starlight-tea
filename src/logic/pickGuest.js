// 랜덤 방문 로직: GUESTS 배열 전체에서 가중치를 두고 오늘 밤의 손님을 고른다.
// 배열에 손님을 추가하기만 하면 자동으로 후보에 포함된다.

export const VISIT_WEIGHT = {
  unseen: 5, // 한 번도 오지 않은 손님 → 먼저 만나기 쉽게
  visited: 3, // 왔지만 아직 마음을 데우지 못한 손님
  comforted: 1, // 이미 마음이 따뜻해진 손님도 가끔 다시 들른다
};

export function guestWeight(guest, { comforted = {}, visits = {} } = {}) {
  if (comforted[guest.id]) return VISIT_WEIGHT.comforted;
  if (visits[guest.id]) return VISIT_WEIGHT.visited;
  return VISIT_WEIGHT.unseen;
}

/**
 * @param guests 검증을 통과한 손님 목록
 * @param progress { comforted, visits, lastGuestId }
 * @returns 고른 손님 (손님이 없으면 null)
 */
export function pickNextGuest(guests, progress = {}, random = Math.random) {
  if (!guests.length) return null;
  // 바로 직전 손님은 연달아 오지 않도록 (손님이 한 명뿐이면 예외)
  const pool = guests.length > 1 ? guests.filter((g) => g.id !== progress.lastGuestId) : guests;
  const weights = pool.map((g) => guestWeight(g, progress));
  const total = weights.reduce((sum, w) => sum + w, 0);
  let roll = random() * total;
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i];
    if (roll < 0) return pool[i];
  }
  return pool[pool.length - 1];
}
