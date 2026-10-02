// 기획 데이터 검증: 게임(브라우저)과 `npm run check`(Node)가 함께 사용한다.
// 잘못된 항목은 게임에서 제외하고, 무엇이 문제인지 한국어로 알려 준다.

// 내어 드린 차가 꼭 맞지 않았을 때의 기본 대사 (guests.js 의 MISS_DIALOGUES 가 비어 있을 때)
const DEFAULT_MISS_DIALOGUES = {
  leafOnly: '{leaf} 향은 참 좋아요. 그런데 {fruit}{은/는} 지금 제 마음과 조금 다른 것 같아요.',
  fruitOnly: '{fruit}{은/는} 반가운 맛이에요. 그런데 {leaf} 향이 조금 아쉬워요.',
  swapped: '{leaf}{과/와} {fruit}… 둘 다 마음에 닿는데, 찻잎과 과일의 자리가 바뀐 것 같아요.',
  none: '정성껏 끓여 주셔서 고마워요. 그런데 찻잎도 과일도 제 마음이 찾던 맛과는 조금 다른 것 같아요.',
};

const isText = (value) => typeof value === 'string' && value.trim().length > 0;
const isHexColor = (value) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(value).trim());

const GUEST_TEXT_FIELDS = ['id', 'name', 'appearance', 'story', 'perfect_match_dialogue'];
const GUEST_ANSWER_FIELDS = ['required_leaf', 'required_fruit'];
const INGREDIENT_TEXT_FIELDS = ['virtue', 'name', 'icon', 'color', 'image', 'description', 'hint'];
const FRUIT_TEXT_FIELDS = ['name', 'icon', 'color'];
export const INGREDIENT_COUNT = 9; // 3×3 칸, 9 × 9 = 81가지 블렌딩
export const RECOMMENDED_TRAIN_SENTENCES = 50; // 속성마다 권장하는 학습 문장 수
export const DEFAULT_GUEST_LEVEL = 3; // level 이 비어 있는 손님은 가장 나중에 (어려움)

export const DEFAULT_OPENING_VISITS = [
  { level: 1, count: 2 },
  { level: 2, count: 2 },
];

export function validateGameData({ guests, ingredients, missDialogues, openingVisits = DEFAULT_OPENING_VISITS }) {
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
    // 정답 찻잎·과일: 열매 번호 (따옴표로 감싼 숫자는 숫자로 읽고 알려 준다)
    const answer = {};
    const quoted = [];
    for (const key of GUEST_ANSWER_FIELDS) {
      const raw = guest[key];
      const id = typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : raw;
      if (!ingredientIds.has(id)) {
        problems.push(`"${key}" 는 열매 번호(${[...ingredientIds].join(', ')}) 중 하나여야 해요. 지금 값: ${JSON.stringify(raw)}`);
      } else if (typeof raw === 'string') {
        quoted.push(`${key} 를 숫자 ${id}(으)로 읽었어요`);
      }
      answer[key] = id;
    }
    if (isText(guest.id) && guestIds.has(guest.id)) {
      problems.push(`id "${guest.id}" 를 다른 손님이 이미 쓰고 있어요. id 는 중복될 수 없어요`);
    }
    if (problems.length) {
      errors.push({ where, problems });
      return;
    }
    if (quoted.length) warnings.push(`${where}: ${quoted.join(', ')}. 따옴표 없이 숫자로 적어 주세요.`);
    let level = guest.level;
    if (!Number.isInteger(level) || level < 1) {
      warnings.push(`${where}: "level" 은 1(쉬움)·2(보통)·3(어려움) 같은 숫자여야 해요. 지금 값: ${JSON.stringify(level)} — ${DEFAULT_GUEST_LEVEL}(으)로 둘게요.`);
      level = DEFAULT_GUEST_LEVEL;
    }
    // 쉬움 손님은 정답이 사연에 그대로 보여야 한다 (찻잎·과일 이름)
    if (level === 1) {
      const leaf = validIngredients.find((ing) => ing.id === answer.required_leaf);
      const fruit = validIngredients.find((ing) => ing.id === answer.required_fruit);
      const missing = [];
      if (leaf && !guest.story.includes(leaf.name)) missing.push(`찻잎 "${leaf.name}"`);
      if (fruit && !guest.story.includes(fruit.fruit.name)) missing.push(`과일 "${fruit.fruit.name}"`);
      if (missing.length) warnings.push(`${where}: 쉬움(level 1) 손님은 사연에 ${missing.join(', ')} 이름이 그대로 나와야 정답이 한눈에 보여요.`);
    }
    guestIds.add(guest.id);
    validGuests.push({ ...guest, ...answer, level });
  });

  // ── 아쉬울 때의 대사 (찻잎만 맞음 / 과일만 맞음 / 자리가 바뀜 / 둘 다 아쉬움) ──
  const dialogues = {};
  for (const [key, fallback] of Object.entries(DEFAULT_MISS_DIALOGUES)) {
    const lines = (Array.isArray(missDialogues?.[key]) ? missDialogues[key] : []).filter(isText);
    if (lines.length === 0) warnings.push(`guests.js › MISS_DIALOGUES.${key} 가 비어 있어서 기본 대사를 대신 사용해요.`);
    dialogues[key] = lines.length ? lines : [fallback];
  }

  if (validGuests.length === 0) warnings.push('게임에 등장할 수 있는 손님이 한 명도 없어요.');

  // ── 처음 순서 (OPENING_VISITS): [{ level, count }] ──
  const opening = [];
  if (!Array.isArray(openingVisits)) {
    warnings.push('guests.js › OPENING_VISITS 는 [{ level: 1, count: 2 }, …] 배열이어야 해요. 기본 순서(쉬움 2 → 보통 2)를 써요.');
  }
  (Array.isArray(openingVisits) ? openingVisits : DEFAULT_OPENING_VISITS).forEach((step, index) => {
    const ok = Number.isInteger(step?.level) && step.level >= 1 && Number.isInteger(step?.count) && step.count >= 1;
    if (!ok) {
      warnings.push(`guests.js › OPENING_VISITS[${index}]: { level: 숫자, count: 1 이상 } 형태여야 해서 건너뛰어요. 지금 값: ${JSON.stringify(step)}`);
      return;
    }
    const available = validGuests.filter((guest) => guest.level === step.level).length;
    if (available < step.count) {
      warnings.push(`guests.js › OPENING_VISITS[${index}]: ${step.level}단계 손님이 ${available}명이라 처음 ${step.count}명을 채울 수 없어요.`);
    }
    opening.push({ level: step.level, count: step.count });
  });

  return { guests: validGuests, ingredients: validIngredients, missDialogues: dialogues, opening, errors, warnings };
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
