// 기획 데이터 검증: 게임(브라우저)과 `npm run check`(Node)가 함께 사용한다.
// 잘못된 항목은 게임에서 제외하고, 무엇이 문제인지 한국어로 알려 준다.

const DEFAULT_FALLBACK = '정성껏 끓여 주셔서 고마워요. 그런데 제 마음이 찾던 맛과는 조금 다른 것 같아요.';

const isText = (value) => typeof value === 'string' && value.trim().length > 0;
const isHexColor = (value) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(value).trim());

const GUEST_TEXT_FIELDS = ['id', 'name', 'appearance', 'story', 'perfect_match_dialogue'];
const INGREDIENT_TEXT_FIELDS = ['virtue', 'name', 'icon', 'color', 'image', 'description', 'hint'];
const FRUIT_TEXT_FIELDS = ['name', 'icon', 'color'];
export const INGREDIENT_COUNT = 9; // 3×3 칸, 9 × 9 = 81가지 블렌딩
export const RECOMMENDED_TRAIN_SENTENCES = 50; // 속성마다 권장하는 학습 문장 수

export function validateGameData({ guests, ingredients, fallbackDialogues }) {
  const errors = [];
  const warnings = [];

  // ── 재료 ──────────────────────────────────────────
  const ingredientIds = new Set();
  const validIngredients = [];
  (Array.isArray(ingredients) ? ingredients : []).forEach((ing, index) => {
    const where = `ingredients.js › INGREDIENTS[${index}]`;
    const problems = [];
    if (!ing || typeof ing !== 'object') {
      errors.push({ where, problems: ['{ ... } 형태여야 해요'] });
      return;
    }
    if (!Number.isInteger(ing.id)) problems.push('id 는 숫자여야 해요');
    else if (ingredientIds.has(ing.id)) problems.push(`id ${ing.id}번을 다른 재료가 이미 쓰고 있어요`);
    for (const key of INGREDIENT_TEXT_FIELDS) {
      if (!isText(ing[key])) problems.push(`"${key}" 값이 비어 있어요`);
    }
    if (!ing.fruit || typeof ing.fruit !== 'object') {
      problems.push('"fruit" 는 { name: "과일 이름", icon: "아이콘 파일명", color: "#색" } 형태여야 해요');
    } else {
      for (const key of FRUIT_TEXT_FIELDS) {
        if (!isText(ing.fruit[key])) problems.push(`"fruit.${key}" 값이 비어 있어요`);
      }
    }
    if (problems.length) {
      errors.push({ where, problems });
      return;
    }
    for (const [key, value] of [['color', ing.color], ['fruit.color', ing.fruit.color]]) {
      if (!isHexColor(value)) warnings.push(`${where} (${ing.name}): "${key}" 는 #B4533A 같은 16진수 색이어야 찻잔·테두리 색이 보여요. 지금 값: ${value}`);
    }
    ingredientIds.add(ing.id);
    let comforts = (Array.isArray(ing.comforts) ? ing.comforts : []).filter(isText);
    if (comforts.length === 0) {
      warnings.push(`${where} (${ing.name}): "comforts" 위로 글귀가 없어서 description 을 대신 보여 줘요.`);
      comforts = [ing.description];
    }
    validIngredients.push({ ...ing, comforts });
  });

  if (validIngredients.length !== INGREDIENT_COUNT) {
    warnings.push(`ingredients.js: 열매는 ${INGREDIENT_COUNT}가지(3×3 칸)를 기준으로 만들었어요. 지금 ${validIngredients.length}가지예요.`);
  }

  // ── 손님 ──────────────────────────────────────────
  const guestIds = new Set();
  const validGuests = [];
  if (!Array.isArray(guests)) {
    errors.push({ where: 'guests.js › GUESTS', problems: ['[ ... ] 배열 형태여야 해요'] });
  }
  (Array.isArray(guests) ? guests : []).forEach((guest, index) => {
    const label = isText(guest?.id) ? ` (${guest.id})` : '';
    const where = `guests.js › GUESTS[${index}]${label}`;
    if (!guest || typeof guest !== 'object') {
      errors.push({ where, problems: ['{ ... } 형태여야 해요'] });
      return;
    }
    const problems = [];
    for (const key of GUEST_TEXT_FIELDS) {
      if (!isText(guest[key])) problems.push(`"${key}" 값이 비어 있거나, 따옴표로 감싼 글자가 아니에요`);
    }
    const raw = guest.required_ingredient;
    const ingredientId = typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : raw;
    if (!ingredientIds.has(ingredientId)) {
      problems.push(`"required_ingredient" 는 재료 번호(${[...ingredientIds].join(', ')}) 중 하나여야 해요. 지금 값: ${JSON.stringify(raw)}`);
    }
    if (isText(guest.id) && guestIds.has(guest.id)) {
      problems.push(`id "${guest.id}" 를 다른 손님이 이미 쓰고 있어요. id 는 중복될 수 없어요`);
    }
    if (problems.length) {
      errors.push({ where, problems });
      return;
    }
    if (typeof raw === 'string') {
      warnings.push(`${where}: required_ingredient 를 숫자 ${ingredientId}(으)로 읽었어요. 따옴표 없이 숫자로 적어 주세요.`);
    }
    guestIds.add(guest.id);
    validGuests.push({ ...guest, required_ingredient: ingredientId });
  });

  // ── 오답 대사 ──────────────────────────────────────
  let fallbacks = (Array.isArray(fallbackDialogues) ? fallbackDialogues : []).filter(isText);
  if (fallbacks.length === 0) {
    warnings.push('guests.js › FALLBACK_DIALOGUES 가 비어 있어서 기본 대사를 대신 사용해요.');
    fallbacks = [DEFAULT_FALLBACK];
  }

  if (validGuests.length === 0) warnings.push('게임에 등장할 수 있는 손님이 한 명도 없어요.');

  return { guests: validGuests, ingredients: validIngredients, fallbackDialogues: fallbacks, errors, warnings };
}

/**
 * 팽주의 학습 문장 검증. { 재료번호: [문장, …] } → [{ label, text }]
 * (학습 데이터는 '나를 위한 차' 단계에서만 따로 불러오므로 검증도 따로 한다)
 */
export function validateTrainData(trainData, ingredients) {
  const errors = [];
  const warnings = [];
  const samples = [];
  const counts = {};
  const ids = new Set(ingredients.map((ing) => ing.id));
  if (!trainData || typeof trainData !== 'object' || Array.isArray(trainData)) {
    errors.push({ where: 'trainData.js › TRAIN_DATA', problems: ['{ 재료번호: [ 문장, … ] } 형태여야 해요'] });
    return { samples, counts, errors, warnings };
  }
  for (const [key, sentences] of Object.entries(trainData)) {
    const label = Number(key);
    const where = `trainData.js › TRAIN_DATA[${key}]`;
    if (!ids.has(label)) {
      errors.push({ where, problems: [`재료 번호(${[...ids].join(', ')})가 아니라서 학습에서 빠졌어요`] });
      continue;
    }
    const valid = (Array.isArray(sentences) ? sentences : []).filter(isText);
    counts[label] = valid.length;
    for (const text of valid) samples.push({ label, text });
  }
  for (const ing of ingredients) {
    const count = counts[ing.id] ?? 0;
    if (count < RECOMMENDED_TRAIN_SENTENCES) {
      warnings.push(`trainData.js: ${ing.virtue}(${ing.id}번) 학습 문장이 ${count}개예요. ${RECOMMENDED_TRAIN_SENTENCES}개 이상을 권장해요.`);
    }
  }
  return { samples, counts, errors, warnings };
}

const DEFAULT_BLEND_RATIO = 0.2;
const DEFAULT_BLEND_TEXT = {
  name: '{leaf} {fruit}차',
  blendLine: '{leaf}의 {leafImage}에 {fruit}의 {fruitImage}{을/를} 더했어요.',
  pureLine: '{leaf}{과/와} {fruit} 모두 {leafImage}{을/를} 담았어요.',
};

/** 블렌딩 규칙 검증 (blending.js). 잘못된 값은 기본값으로 바꿔 쓴다 */
export function validateBlendData(rule, text) {
  const errors = [];
  const warnings = [];
  let ratio = rule?.secondRatio;
  if (typeof ratio !== 'number' || !(ratio >= 0 && ratio <= 1)) {
    errors.push({
      where: 'blending.js › BLEND_RULE.secondRatio',
      problems: [`0 과 1 사이의 숫자여야 해요 (20% → 0.2). 지금 값: ${JSON.stringify(ratio)} — 기본값 ${DEFAULT_BLEND_RATIO} 를 써요`],
    });
    ratio = DEFAULT_BLEND_RATIO;
  }
  const texts = {};
  for (const [key, fallback] of Object.entries(DEFAULT_BLEND_TEXT)) {
    if (isText(text?.[key])) texts[key] = text[key];
    else {
      warnings.push(`blending.js › BLEND_TEXT.${key} 가 비어 있어서 기본 문구를 써요.`);
      texts[key] = fallback;
    }
  }
  if (!texts.name.includes('{leaf}') || !texts.name.includes('{fruit}')) {
    warnings.push('blending.js › BLEND_TEXT.name 에 {leaf} 와 {fruit} 가 모두 있어야 찻잎과 과일이 차 이름에 보여요.');
  }
  return { ratio, texts, errors, warnings };
}
