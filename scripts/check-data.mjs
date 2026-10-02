// 기획 데이터·배포 설정 검사: npm run check  (npm run build 전에 자동으로 실행됩니다)
// guests.js 의 빠진 항목·중복 ID·잘못된 재료 번호·난이도·없는 그림 파일, 블렌딩 규칙,
// 팽주의 학습 문장 수, 광고·도메인·썸네일 설정, 정책 페이지의 미입력 항목을 알려 준다.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BLEND_RULE, BLEND_TEXT } from '../src/data/blending.js';
import { GUESTS, MISS_DIALOGUES, OPENING_VISITS } from '../src/data/guests.js';
import { INGREDIENTS } from '../src/data/ingredients.js';
import { LEVEL_NAMES } from '../src/data/scripts.js';
import { TRAIN_DATA } from '../src/data/trainData.js';
import { happyFileName } from '../src/logic/fileNames.js';
import { levelName } from '../src/logic/format.js';
import { validateBlendData, validateGameData, validateTrainData } from '../src/logic/validateData.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { guests, ingredients, missDialogues, opening, errors, warnings } = validateGameData({
  guests: GUESTS,
  ingredients: INGREDIENTS,
  missDialogues: MISS_DIALOGUES,
  openingVisits: OPENING_VISITS,
});
const train = validateTrainData(TRAIN_DATA, ingredients);
errors.push(...train.errors);
warnings.push(...train.warnings);
const blend = validateBlendData(BLEND_RULE, BLEND_TEXT);
errors.push(...blend.errors);
warnings.push(...blend.warnings);
const trainCounts = train.counts;
const trainSamples = train.samples;
const notes = [];

// ── 그림 파일 ──
let happyCount = 0;
for (const guest of guests) {
  if (!existsSync(join(root, 'public/assets/guests', guest.appearance))) {
    warnings.push(`손님 "${guest.name}" 의 그림 public/assets/guests/${guest.appearance} 파일이 없어요. (게임에서는 실루엣으로 보여요)`);
  }
  if (existsSync(join(root, 'public/assets/guests', happyFileName(guest.appearance)))) happyCount += 1;
}
for (const ingredient of ingredients) {
  for (const [label, part] of [['찻잎', ingredient], ['과일', ingredient.fruit]]) {
    if (!existsSync(join(root, 'public/assets/ingredients', part.icon))) {
      warnings.push(`${label} "${part.name}" 의 아이콘 public/assets/ingredients/${part.icon} 파일이 없어요.`);
    }
  }
}

// ── 배포 설정 (.env, 환경변수가 있으면 그쪽이 우선) ──
function readEnvFile() {
  const env = {};
  const file = join(root, '.env');
  if (!existsSync(file)) return env;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match) env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
  return env;
}
const env = { ...readEnvFile(), ...process.env };
const client = env.VITE_ADSENSE_CLIENT?.trim() ?? '';
if (!client) notes.push('광고: VITE_ADSENSE_CLIENT 가 비어 있어 광고 없이 조언이 바로 열려요. (AdSense 승인 후 .env 에 적어 주세요)');
else if (!/^ca-pub-\d{10,20}$/.test(client)) errors.push({ where: '.env › VITE_ADSENSE_CLIENT', problems: [`"ca-pub-숫자" 형식이어야 해요. 지금 값: ${client}`] });
else notes.push(`광고: ${client} (개발 서버에서는 테스트 광고, 배포 빌드에서는 실제 광고)`);

const domain = env.CUSTOM_DOMAIN?.trim() ?? '';
const base = env.BASE_PATH?.trim() || '/';
notes.push(domain ? `도메인: ${domain} (빌드 결과에 CNAME 을 만들어요)` : '도메인: CUSTOM_DOMAIN 이 비어 있어 CNAME 을 만들지 않아요.');
notes.push(`경로(base): ${base}`);
if (domain && base !== '/') warnings.push(`커스텀 도메인(${domain})을 쓰면 BASE_PATH 는 / 여야 해요. 지금 값: ${base}`);

const siteUrl = env.SITE_URL?.trim() ?? '';
const withSlash = (url) => (url.endsWith('/') ? url : `${url}/`);
if (!siteUrl) notes.push('썸네일: SITE_URL 이 비어 있어요. (GitHub Actions 에서는 아이디.github.io 주소로 자동으로 채워요)');
else if (!/^https?:\/\/[^/]+\//.test(withSlash(siteUrl))) {
  errors.push({ where: '.env › SITE_URL', problems: [`https://로 시작하는 전체 주소여야 해요. 지금 값: ${siteUrl}`] });
} else {
  notes.push(`썸네일: ${withSlash(siteUrl)}og-image.png`);
  const path = withSlash(new URL(siteUrl).pathname);
  if (path !== base) warnings.push(`SITE_URL 의 경로(${path})와 BASE_PATH(${base})가 달라요. 썸네일 주소가 틀릴 수 있어요.`);
}
if (!existsSync(join(root, 'public/og-image.png'))) warnings.push('public/og-image.png(1200×630 링크 미리보기 썸네일)가 없어요.');

for (const page of ['about.html', 'privacy.html']) {
  const file = join(root, 'public', page);
  if (!existsSync(file)) errors.push({ where: `public/${page}`, problems: ['AdSense 심사에 필요한 페이지가 없어요'] });
  else if (readFileSync(file, 'utf8').includes('data-placeholder')) warnings.push(`public/${page}: [운영자 이름]·[문의 이메일] 같은 빈칸을 배포 전에 채워 주세요.`);
}

// ── 결과 ──
const levels = [...new Set(guests.map((guest) => guest.level))].sort((a, b) => a - b);
const levelSummary = levels.map((level) => `${levelName(level, LEVEL_NAMES)} ${guests.filter((g) => g.level === level).length}`).join(' · ');
const missCount = Object.values(missDialogues).reduce((sum, lines) => sum + lines.length, 0);
console.log('\n별빛 찻집 · 데이터 검사');
console.log(`  손님 ${guests.length}명${levelSummary ? ` (${levelSummary})` : ''} · 재료 ${ingredients.length}가지 · 아쉬울 때 대사 ${missCount}개`);
const openingSummary = opening.map((step) => `${levelName(step.level, LEVEL_NAMES)} ${step.count}명`).join(' → ');
console.log(`  방문 순서: ${openingSummary ? `${openingSummary} → ` : ''}그 뒤로는 아직 마음을 데우지 못한 손님 중 무작위`);
console.log(`  표정 변화 그림(_happy) ${happyCount}/${guests.length}명 (선택 사항)`);
console.log(`  블렌딩: 1위 열매 = 찻잎, 2위 열매 = 과일 (2위가 1위의 ${Math.round(blend.ratio * 100)}% 이상일 때) · ${ingredients.length} × ${ingredients.length} = ${ingredients.length ** 2}가지`);
console.log(`  팽주의 학습 문장 ${trainSamples.length}개 — ${ingredients.map((ing) => `${ing.virtue} ${trainCounts[ing.id] ?? 0}`).join(', ')}`);
for (const note of notes) console.log(`  · ${note}`);
console.log('');

for (const error of errors) {
  console.log(`✗ ${error.where}`);
  for (const problem of error.problems) console.log(`    - ${problem}`);
}
for (const warning of warnings) console.log(`! ${warning}`);

if (errors.length) {
  console.log(`\n오류 ${errors.length}개를 고쳐 주세요. (오류가 있는 항목은 게임에서 빠져요)\n`);
  process.exit(1);
}
console.log(warnings.length ? '\n오류는 없어요. 위의 안내만 확인해 주세요.\n' : '✓ 모두 좋아요!\n');
