// 표시용 포맷 도우미

/** 손님 난이도를 별로: 1 → ★, 3 → ★★★ */
export const levelStars = (level) => '★'.repeat(Math.max(1, Number.isInteger(level) ? level : 1));

/** 손님 난이도 이름: 1 → 쉬움 (이름이 없는 단계는 "4단계") */
export const levelName = (level, names) => names[level] ?? `${level}단계`;

export function formatDate(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const pad = (v) => String(v).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}
