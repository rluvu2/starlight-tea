// 팽주의 블렌딩: 1위 열매는 찻잎, 2위 열매는 과일로 표현한 차 (9 × 9 = 81가지)
// 블렌딩은 { leafId, fruitId } — 찻잎을 고른 열매 번호, 과일을 고른 열매 번호
import { BLEND_SETTINGS, ingredientById } from './gameData.js';
import { fill } from './josa.js';

export const PICK = { LEAF: 'leaf', FRUIT: 'fruit' };

/** 열매 하나를 찻잎으로 볼지, 과일로 볼지 → { name, icon, color } */
export function partOf(ingredient, mode) {
  if (!ingredient) return null;
  return mode === PICK.FRUIT ? ingredient.fruit : { name: ingredient.name, icon: ingredient.icon, color: ingredient.color };
}

/**
 * 분류 결과(마음의 결 순위, share 내림차순)로 팽주의 블렌딩을 정한다.
 * 2위 마음이 1위의 ratio(기본 20%) 미만이면 1위 열매 하나로 찻잎과 과일을 모두 고른다.
 *   사랑 0.50 · 온유 0.07 → 사랑 + 사랑 / 사랑 0.60 · 온유 0.13 → 사랑 + 온유
 */
export function decideBlend(ranking, ratio = BLEND_SETTINGS.ratio) {
  const [first, second] = ranking ?? [];
  if (!first) return null;
  const pure = !second || second.share < first.share * ratio;
  return { leafId: first.label, fruitId: pure ? first.label : second.label };
}

export const isSameBlend = (a, b) => Boolean(a && b) && a.leafId === b.leafId && a.fruitId === b.fruitId;

/** { leafId, fruitId } → 찻잎과 과일의 이름·아이콘·빛깔·열매 */
export function blendParts(blend) {
  const leafOf = ingredientById(blend?.leafId);
  const fruitOf = ingredientById(blend?.fruitId);
  if (!leafOf || !fruitOf) return null;
  const describe = (ingredient, mode) => ({ id: ingredient.id, virtue: ingredient.virtue, image: ingredient.image, ...partOf(ingredient, mode) });
  return { leaf: describe(leafOf, PICK.LEAF), fruit: describe(fruitOf, PICK.FRUIT), pure: leafOf.id === fruitOf.id };
}

/** 차 이름 — 예) 1위 화평, 2위 사랑 → "캐모마일 딸기차" */
export function blendName(blend) {
  const parts = blendParts(blend);
  return parts ? fill(BLEND_SETTINGS.name, { leaf: parts.leaf.name, fruit: parts.fruit.name }) : '';
}

/** 찻잎과 과일의 연결 이미지를 엮은 한 줄 */
export function blendLine(blend) {
  const parts = blendParts(blend);
  if (!parts) return '';
  const { leaf, fruit, pure } = parts;
  return fill(pure ? BLEND_SETTINGS.pureLine : BLEND_SETTINGS.blendLine, {
    leaf: leaf.name,
    fruit: fruit.name,
    leafImage: leaf.image,
    fruitImage: fruit.image,
  });
}

/** 찻물 색: 찻잎 빛깔에 과일 빛깔을 조금 섞는다 */
export function blendColor(blend, fruitWeight = 0.3) {
  const parts = blendParts(blend);
  return parts ? mixHex(parts.leaf.color, parts.fruit.color, fruitWeight) : '#d9b26c';
}

function parseHex(color) {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(color ?? '').trim());
  if (!match) return null;
  const hex = match[1].length === 3 ? [...match[1]].map((c) => c + c).join('') : match[1];
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

/** 두 색을 t(0~1) 비율로 섞는다. 읽을 수 없는 색이면 a 를 그대로 돌려준다 */
export function mixHex(a, b, t) {
  const from = parseHex(a);
  const to = parseHex(b);
  if (!from || !to) return a;
  return `#${from.map((v, i) => Math.round(v + (to[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}
