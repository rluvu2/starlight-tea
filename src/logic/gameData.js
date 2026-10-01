// 기획 데이터(src/data)를 검증해 게임이 쓰는 형태로 내보낸다.
// 게임 코드는 src/data 를 직접 읽지 않고 항상 이 모듈을 거친다.
import { BLEND_RULE, BLEND_TEXT } from '../data/blending.js';
import { GUESTS, MISS_DIALOGUES } from '../data/guests.js';
import { INGREDIENTS } from '../data/ingredients.js';
import { validateBlendData, validateGameData } from './validateData.js';

const result = validateGameData({
  guests: GUESTS,
  ingredients: INGREDIENTS,
  missDialogues: MISS_DIALOGUES,
});
const blend = validateBlendData(BLEND_RULE, BLEND_TEXT);

export const GUEST_LIST = result.guests;
export const INGREDIENT_LIST = result.ingredients;
// 내어 드린 차가 꼭 맞지 않았을 때의 대사 { leafOnly, fruitOnly, swapped, none }
export const MISS_LINES = result.missDialogues;
// 블렌딩 규칙 { ratio, name, blendLine, pureLine }
export const BLEND_SETTINGS = { ratio: blend.ratio, ...blend.texts };
export const DATA_ERRORS = [...result.errors, ...blend.errors];
export const DATA_WARNINGS = [...result.warnings, ...blend.warnings];

const guestMap = new Map(GUEST_LIST.map((g) => [g.id, g]));
const ingredientMap = new Map(INGREDIENT_LIST.map((i) => [i.id, i]));

export const guestById = (id) => guestMap.get(id) ?? null;
export const ingredientById = (id) => ingredientMap.get(id) ?? null;
/** 손님의 정답 블렌딩 { leafId, fruitId } */
export const guestBlend = (guest) => ({ leafId: guest?.required_leaf ?? null, fruitId: guest?.required_fruit ?? null });

if (import.meta.env?.DEV) {
  for (const error of DATA_ERRORS) console.error(`[별빛 찻집 데이터] ${error.where}\n - ${error.problems.join('\n - ')}`);
  for (const warning of DATA_WARNINGS) console.warn(`[별빛 찻집 데이터] ${warning}`);
}
