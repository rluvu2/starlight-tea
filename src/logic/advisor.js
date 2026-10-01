// 팽주의 조언: 유저가 쓴 고민을 분류기로 읽어 블렌딩(1위 열매 = 찻잎, 2위 열매 = 과일)을 정하고,
// 유저가 고른 찻잎·과일과 비교해 조언을 만든다.
// 분류기는 처음 필요할 때(또는 앱을 연 뒤 한가할 때) 한 번만 학습한다.
import { TRAIN_DATA } from '../data/trainData.js';
import { ADVICE_TEXT } from '../data/scripts.js';
import { NaiveBayes } from '../utils/naiveBayes.js';
import { blendLine, blendName, blendParts, decideBlend, isSameBlend } from './blend.js';
import { INGREDIENT_LIST, ingredientById } from './gameData.js';
import { fill } from './josa.js';
import { pick } from './random.js';
import { validateTrainData } from './validateData.js';

let classifier = null;

/** 학습은 처음 필요할 때 한 번만 (문장 수백 개라 몇 밀리초면 끝난다) */
export function getClassifier() {
  if (!classifier) {
    const { samples, errors, warnings } = validateTrainData(TRAIN_DATA, INGREDIENT_LIST);
    if (import.meta.env?.DEV) {
      for (const error of errors) console.error(`[별빛 찻집 데이터] ${error.where}\n - ${error.problems.join('\n - ')}`);
      for (const warning of warnings) console.warn(`[별빛 찻집 데이터] ${warning}`);
    }
    classifier = new NaiveBayes().train(samples);
  }
  return classifier;
}

/**
 * @param text 유저가 쓴 고민
 * @param choice 유저가 고른 블렌딩 { leafId: 찻잎의 열매 번호, fruitId: 과일의 열매 번호 }
 * @returns {{
 *   chosen: { leafId, fruitId },       유저가 고른 차
 *   recommended: { leafId, fruitId },  팽주의 블렌딩 (단서가 없으면 유저가 고른 차)
 *   match, known, message, blendLine, comfort,
 *   mood: { id, share }[]              마음의 결 상위 3개 (단서가 없으면 빈 배열)
 * }}
 */
export function analyzeWorry(text, choice, random = Math.random) {
  let ranking = [];
  let known = 0;
  try {
    ({ ranking, known } = getClassifier().classify(text));
  } catch (error) {
    if (import.meta.env?.DEV) console.error('[팽주의 조언] 분석 중 오류 — 고른 차를 그대로 존중해요.', error);
  }
  const chosen = { leafId: choice?.leafId ?? null, fruitId: choice?.fruitId ?? null };
  const fallback = INGREDIENT_LIST[0]?.id ?? null;
  const safeChosen = blendParts(chosen) ? chosen : { leafId: fallback, fruitId: fallback };

  // 단서가 없으면 팽주가 판단하지 않고, 고른 차를 그대로 존중한다
  const recommended = (known > 0 && decideBlend(ranking)) || safeChosen;
  const match = isSameBlend(recommended, chosen); // 찻잎과 과일이 둘 다 같을 때만 일치
  const names = { chosen: blendName(safeChosen), recommended: blendName(recommended) };
  const message = known === 0 ? fill(ADVICE_TEXT.unknown, names) : match ? ADVICE_TEXT.match : fill(ADVICE_TEXT.suggest, names);
  const leaf = ingredientById(recommended.leafId);

  return {
    chosen,
    recommended,
    match,
    known,
    message,
    blendLine: blendLine(recommended),
    comfort: pick(leaf?.comforts ?? [''], random), // 1위 열매(찻잎)의 위로 글귀
    mood: known > 0 ? ranking.slice(0, 3).map(({ label, share }) => ({ id: label, share })) : [],
  };
}
