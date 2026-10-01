// 한국어 조사 자동 선택: 앞 글자의 받침 유무에 따라 '이/가', '은/는' 등을 고른다.

const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;
const RIEUL = 8; // 종성 'ㄹ' 인덱스

// 숫자로 끝날 때 읽는 소리 기준 받침 (0:영 1:일 3:삼 6:육 7:칠 8:팔)
const DIGIT_FINAL = { 0: 21, 1: RIEUL, 3: 16, 6: 1, 7: RIEUL, 8: RIEUL };

function finalConsonant(word) {
  const chars = Array.from(String(word ?? '').trim());
  const last = chars[chars.length - 1];
  if (!last) return 0;
  const code = last.codePointAt(0);
  if (code >= HANGUL_START && code <= HANGUL_END) return (code - HANGUL_START) % 28;
  if (/[0-9]/.test(last)) return DIGIT_FINAL[last] ?? 0;
  return 0;
}

// 받침이 있을 때 / 없을 때 형태
const PAIRS = {
  '이/가': ['이', '가'],
  '은/는': ['은', '는'],
  '을/를': ['을', '를'],
  '과/와': ['과', '와'],
  '와/과': ['과', '와'],
  '아/야': ['아', '야'],
  '이에요/예요': ['이에요', '예요'],
  '이랑/랑': ['이랑', '랑'],
};

export function josa(word, pair) {
  const final = finalConsonant(word);
  if (pair === '으로/로') return final === 0 || final === RIEUL ? '로' : '으로';
  const [withFinal, withoutFinal] = PAIRS[pair] ?? pair.split('/');
  return final === 0 ? withoutFinal : withFinal;
}

/**
 * 템플릿 채우기: "{name}{이/가} 왔어요" + { name: '곰' } → "곰이 왔어요"
 * 1) {key} 를 값으로 바꾼 뒤  2) {A/B} 조사를 바로 앞 글자에 맞춰 고른다.
 */
export function fill(template, vars = {}) {
  const withVars = String(template).replace(/\{(\w+)\}/g, (match, key) => (key in vars ? String(vars[key]) : match));
  return withVars.replace(/\{([^{}\/]+)\/([^{}\/]+)\}/g, (_, a, b, offset, whole) => josa(whole.slice(0, offset), `${a}/${b}`));
}
