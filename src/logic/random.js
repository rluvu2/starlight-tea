export function pick(list, random = Math.random) {
  return list[Math.floor(random() * list.length)];
}

/** 직전에 나온 항목은 가능하면 피해서 고른다 (같은 대사 연속 방지). */
export function pickDifferent(list, previous, random = Math.random) {
  const pool = list.length > 1 ? list.filter((item) => item !== previous) : list;
  return pick(pool, random);
}
