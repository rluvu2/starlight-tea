/**
 * ─────────────────────────────────────────────────────────────────────
 *  별빛 찻집 · 팽주의 마음 읽기 (On-Device Naive Bayes)
 * ─────────────────────────────────────────────────────────────────────
 *  서버 없이 브라우저 안에서 한국어 고민 문장을 9가지 열매 속성으로 분류한다.
 *
 *  1) 전처리  문장 → 절 → 어절 → 부정어 처리 → 조사 떼기
 *  2) 특징    어간 전체(w:) + 글자 2-gram(b:). 부정된 단어는 앞에 '!' 를 붙인다.
 *  3) 학습    다항 나이브 베이즈 (스무딩 0.5, 한 문장 안 중복 특징은 한 번만)
 *  4) 예측    속성별 로그 확률 → 순위
 *
 *  [부정어 전처리]
 *  "화가 안 나요" 를 '화'로 읽으면 '화가 난다'는 뜻으로 오판하게 된다.
 *  그래서 부정어(안, 않, 없, 못, 아니)가 걸린 주변 단어는 원래 특징을 무효화하고
 *  '!화' 처럼 뒤집힌 특징으로 바꾼다. 학습 문장도 같은 방식으로 처리되므로
 *  "잠을 못 자요"(→ !잠, !자) 같은 표현은 그 자체로 의미 있는 특징이 된다.
 * ─────────────────────────────────────────────────────────────────────
 */

const CLAUSE_SPLIT = /[.!?,;:~…\n]+/;
const NON_WORD = /[^가-힣a-z0-9\s]/g;

// 단어 끝에서 하나만 떼는 조사 (긴 것부터)
const PARTICLES = [
  '에서는', '에게서', '한테서', '으로는', '이라도', '에서', '에게', '한테', '께서', '까지', '부터',
  '처럼', '보다', '마저', '조차', '이나', '이랑', '으로', '에는', '과', '와', '이', '가', '을', '를',
  '은', '는', '에', '도', '만', '로', '랑', '의',
];

// 뜻이 거의 없는 말
const STOP_WORDS = new Set([
  '그냥', '너무', '정말', '진짜', '요즘', '오늘', '좀', '많이', '조금', '제가', '저는', '저도', '저를', '제',
  '저', '나는', '내가', '나도', '나를', '내', '나', '우리', '것', '거', '게', '건', '수', '때', '같아요',
  '같아', '같은', '같고', '그리고', '근데', '그런데', '하지만', '그래서', '왜', '어떻게', '다', '또', '더',
  '혹시', '이런', '그런', '저런', '뭔가', '어떤', '무슨', '이', '그', '저', '그게', '이게', '있어요', '해요',
  '하는', '하고', '했어요', '하게', '되는', '돼요', '계속', '자꾸', '항상', '매일', '늘', '아직', '이제',
  '다시', '정말로', '완전', '엄청', '되게', '막', '그때', '지금', '것도', '거예요', '거야', '해서',
]);

// 어미처럼 어디에나 나오는 글자 2-gram
const STOP_BIGRAMS = new Set([
  '어요', '아요', '해요', '에요', '예요', '네요', '세요', '어서', '아서', '해서', '는데', '은데', '인데',
  '지만', '고요', '거든', '같아', '같은', '하는', '하고', '하게', '있어', '했어', '었어', '았어', '겠어',
  '싶어', '어도', '아도', '해도', '니까', '으니', '려고', '면서', '다가', '게요', '지요', '하지', '되는',
  '돼요', '하다', '이다', '어야', '아야', '해야', '습니', '니다', '했다', '였어', '이에', '이야', '거야',
  '워요', '려요', '져요', '어졌', '아졌', '해졌', '졌어', '셨어', '어지', '아지', '해지', '는게', '는건', '는거',
  '하면', '으면', '다고', '라고', '다는', '라는', '이라', '같다', '싶다', '없다', '있다', '된다', '한다', '에서',
  '에게', '어버', '아버', '버렸', '렸어', '봐요', '나요', '가요', '와요', '줘요', '워서', '러워', '스러', '스럽',
  '롭다', '로워',
]);

// 부정어
const PRE_NEGATORS = new Set(['안', '못']); // 띄어 쓴 '안 나요', '못 자요'
const POST_NEGATOR = /^(않|없|아니|아닌)/; // '좋지 않아요', '의욕이 없어요', '화난 게 아니에요'
const INNER_NEGATOR = /않|없/; // 붙여 쓴 '재미없어요', '좋지않아'

// '안'·'못'으로 시작하지만 부정이 아닌 말
const AN_WORDS = [
  '안녕', '안정', '안심', '안전', '안부', '안개', '안경', '안내', '안타', '안쓰', '안아', '안겨', '안기',
  '안락', '안식', '안도', '안방', '안주', '안쪽', '안팎', '안색', '안목', '안간', '안절', '안달', '안위',
  '안고', '안을', '안는', '안은', '안다', '안에', '안의', '안으로',
];
const MOT_WORDS = ['못생', '못된', '못난', '못마', '못지', '못내', '못다'];

// '없'·'않'이 들어 있어도 '~이 없다'는 뜻이 아닌 관용 표현
const NEGATION_IDIOMS = [
  '상관없', '어쩔수없', '끝없', '틀림없', '어이없', '정신없', '하염없', '거침없', '빈틈없', '버릇없', '쓸데없',
  '다름없', '변함없', '수없이', '어김없',
];

// 부정을 건너뛰어 그 앞말까지 닿게 하는 부사: "잠을 잘 못 자요" → '잠'까지 부정
const SKIP_ADVERBS = new Set([
  '잘', '전혀', '너무', '별로', '하나도', '아직', '아직도', '더', '좀', '다', '도저히', '통', '영', '절대',
  '결코', '도무지', '차마', '제대로', '마음대로', '쉽게', '잘은', '도통', '좀처럼',
]);
// '-지 않다 / -지 못하다' 꼴: 그 앞의 단어(주어·목적어)까지 함께 부정 — "화가 나지 않아요" → 화, 나
const JI_FORM = /(지|지는|지도|지가|진|질)$/;
// 의존 명사: 그 앞의 꾸미는 말까지 함께 부정 — "웃을 일이 없어요" → 일, 웃을
const LIGHT_NOUNS = new Set(['게', '것', '건', '거', '수', '줄', '때', '적', '일', '데', '바', '뿐', '맛', '힘']);

export function stripParticle(word) {
  for (const particle of PARTICLES) {
    if (word.length > particle.length && word.endsWith(particle)) {
      const stem = word.slice(0, -particle.length);
      return STOP_WORDS.has(stem) ? word : stem;
    }
  }
  return word;
}

const startsWithAny = (word, prefixes) => prefixes.some((prefix) => word.startsWith(prefix));

/**
 * 부정어 전처리. 문장을 [{ stem, negated }] 로 바꾼다.
 * 부정어 자체는 빠지고, 부정이 걸린 단어는 negated: true 가 된다.
 */
export function preprocess(text) {
  const words = [];
  const clauses = String(text ?? '').normalize('NFC').toLowerCase().split(CLAUSE_SPLIT);

  for (const clause of clauses) {
    const items = clause
      .replace(NON_WORD, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .map((raw) => ({ raw, text: raw, negated: false, drop: false }));

    const negate = (k) => {
      if (k >= 0 && k < items.length && !items[k].drop) items[k].negated = true;
    };
    // 부정어 앞쪽 단어들을 부정 (부사는 건너뛰고, '-지' 꼴이나 의존 명사면 한 단어 더)
    const negateBefore = (i) => {
      let j = i - 1;
      while (j >= 0 && SKIP_ADVERBS.has(items[j].raw)) {
        negate(j);
        j -= 1;
      }
      if (j < 0) return;
      negate(j);
      if (JI_FORM.test(items[j].raw)) {
        negate(j - 1); // "화가 나지 않아요" → 나지, 화
      } else if (LIGHT_NOUNS.has(stripParticle(items[j].raw))) {
        negate(j - 1); // "웃을 일이 없어요" → 일, 웃을
        negate(j - 2); // "짜증이 나는 건 아닌데" → 건, 나는, 짜증
      }
    };

    items.forEach((item, i) => {
      const word = item.raw;
      if (PRE_NEGATORS.has(word)) {
        // '안 나요', '못 자요' → 뒷말(서술어)과 앞말(주어·목적어)을 부정
        item.drop = true;
        negate(i + 1);
        negateBefore(i);
      } else if (word.length > 1 && word[0] === '안' && !startsWithAny(word, AN_WORDS)) {
        // 붙여 쓴 '안돼요', '안좋아'
        item.text = word.slice(1);
        item.negated = true;
        negateBefore(i);
      } else if (word.length > 1 && word[0] === '못' && !startsWithAny(word, MOT_WORDS)) {
        // 붙여 쓴 '못자요', '못해요'
        item.text = word.slice(1);
        item.negated = true;
        negateBefore(i);
      } else if (POST_NEGATOR.test(word)) {
        // 띄어 쓴 '않아요', '없어요', '아니에요' → 부정어는 빼고 앞말을 부정
        item.drop = true;
        negateBefore(i);
      } else if (!NEGATION_IDIOMS.some((idiom) => word.includes(idiom))) {
        // 붙여 쓴 '재미없어요', '좋지않아' → '재미', '좋'을 부정
        const at = word.search(INNER_NEGATOR);
        if (at > 0) {
          item.text = word.slice(0, at).replace(/지$/, '');
          item.negated = true;
          if (!item.text) item.drop = true;
        }
      }
    });

    for (const item of items) {
      if (item.drop || !item.text) continue;
      words.push({ stem: stripParticle(item.text), negated: item.negated });
    }
  }
  return words;
}

/** 분류에 쓰는 특징 목록(중복 없음). 부정된 단어의 특징은 '!' 로 시작한다. */
export function extractFeatures(text) {
  const features = new Set();
  for (const { stem, negated } of preprocess(text)) {
    if (!stem || STOP_WORDS.has(stem)) continue;
    const mark = negated ? '!' : '';
    features.add(`${mark}w:${stem}`);
    for (let i = 0; i + 1 < stem.length; i += 1) {
      const bigram = stem.slice(i, i + 2);
      if (!STOP_BIGRAMS.has(bigram)) features.add(`${mark}b:${bigram}`);
    }
  }
  return [...features];
}

/** 다항 나이브 베이즈 분류기 */
export class NaiveBayes {
  constructor({ alpha = 0.5 } = {}) {
    this.alpha = alpha;
    this.labels = [];
    this.docCount = new Map(); // label → 학습 문장 수
    this.featureCount = new Map(); // label → Map(feature → 횟수)
    this.featureTotal = new Map(); // label → 특징 총 개수
    this.vocabulary = new Set();
    this.totalDocs = 0;
  }

  learn(label, text) {
    if (!this.docCount.has(label)) {
      this.labels.push(label);
      this.docCount.set(label, 0);
      this.featureCount.set(label, new Map());
      this.featureTotal.set(label, 0);
    }
    const counts = this.featureCount.get(label);
    const features = extractFeatures(text);
    for (const feature of features) {
      counts.set(feature, (counts.get(feature) ?? 0) + 1);
      this.vocabulary.add(feature);
    }
    this.docCount.set(label, this.docCount.get(label) + 1);
    this.featureTotal.set(label, this.featureTotal.get(label) + features.length);
    this.totalDocs += 1;
    return this;
  }

  /** @param samples [{ label, text }] */
  train(samples) {
    for (const { label, text } of samples) this.learn(label, text);
    return this;
  }

  /**
   * @returns {{ ranking: { label, logProb, share }[], known: number, features: string[] }}
   *   ranking  가능성이 높은 순. share 는 화면 표시용 상대 비율(합 1)
   *   known    학습 때 본 특징의 수 (0이면 판단 근거가 없다는 뜻)
   */
  classify(text) {
    const features = extractFeatures(text).filter((feature) => this.vocabulary.has(feature));
    const vocabularySize = this.vocabulary.size;
    const ranking = this.labels.map((label) => {
      const counts = this.featureCount.get(label);
      const denominator = this.featureTotal.get(label) + this.alpha * vocabularySize;
      let logProb = Math.log(this.docCount.get(label) / this.totalDocs);
      for (const feature of features) logProb += Math.log(((counts.get(feature) ?? 0) + this.alpha) / denominator);
      return { label, logProb };
    });
    ranking.sort((a, b) => b.logProb - a.logProb);

    // 표시용 비율: 특징이 많을수록 확률이 극단으로 치우치므로 온도를 두어 부드럽게
    const temperature = Math.max(1, features.length / 3);
    const top = ranking[0]?.logProb ?? 0;
    const weights = ranking.map(({ logProb }) => Math.exp((logProb - top) / temperature));
    const sum = weights.reduce((acc, w) => acc + w, 0) || 1;
    ranking.forEach((entry, i) => {
      entry.share = weights[i] / sum;
    });
    return { ranking, known: features.length, features };
  }

  predict(text) {
    return this.classify(text).ranking[0]?.label ?? null;
  }
}
