import assert from 'node:assert/strict';
// 별빛 찻집 단위 테스트: npm test (배포 전에 GitHub Actions 에서도 실행)
// 상태 머신 · 블렌딩 규칙 · 팽주의 조언 · 데이터 검증 · 세이브 병합 · 광고 서비스
const root = new URL('../src/', import.meta.url).href;
const gs = await import(root + 'hooks/useGameState.js');
const { PHASE, gameReducer: reduce, createInitialState, createDefaultSave, mergeSave, migrateLegacySave, loadSave, writeSave, buildCollection, SAVE_KEY, LEGACY_SAVE_KEY } = gs;
const { GUEST_LIST } = await import(root + 'logic/gameData.js');
const { analyzeWorry } = await import(root + 'logic/advisor.js');
const { decideBlend, blendName, blendLine, blendParts, isSameBlend, mixHex } = await import(root + 'logic/blend.js');
const { fill } = await import(root + 'logic/josa.js');

// ── 1. 상태 머신: Phase 1 → 2(로비) → 3 → 3.5 → 4 → 2 ──
let s = createInitialState();
assert.equal(s.phase, PHASE.TITLE);
assert.equal(reduce(s, { type: 'START_REFLECTION' }), s, '첫 손님 전에는 나를 위한 차를 끓일 수 없다');
assert.equal(reduce(s, { type: 'TO_CROSSROADS' }), s, '첫 손님 전에는 로비로 갈 수 없다');
s = reduce(s, { type: 'SHOW_INTRO' }); assert.equal(s.phase, PHASE.INTRO);
assert.equal(reduce(s, { type: 'START_REFLECTION' }), s);
s = reduce(s, { type: 'MARK_INTRO_SEEN' });
s = reduce(s, { type: 'START_GUEST', guestId: 'guest_001' });
assert.equal(s.phase, PHASE.GUEST); assert.equal(s.guest.step, 'talking'); assert.equal(s.save.visits.guest_001, 1);
assert.equal(reduce(s, { type: 'START_REFLECTION' }), s, '손님 맞이 중에는 나를 위한 차로 갈 수 없다');
assert.equal(reduce(s, { type: 'SERVE', sipLine: '...' }), s, '선택 없이 차를 낼 수 없다');
assert.equal(reduce(s, { type: 'TO_CROSSROADS' }), s, '정답 전에는 로비로 갈 수 없다');
s = reduce(s, { type: 'SELECT', ingredientId: 2 });
s = reduce(s, { type: 'SERVE', sipLine: '한 모금' }); assert.equal(s.guest.step, 'serving');
assert.equal(reduce(s, { type: 'SELECT', ingredientId: 3 }), s, '마시는 중에는 바꿀 수 없다');
s = reduce(s, { type: 'RESOLVE_SERVE', fallbackLine: 'F1', now: 1 });
assert.equal(s.guest.step, 'missed'); assert.deepEqual(s.guest.tried, [2]); assert.equal(s.guest.hint, null); assert.equal(s.save.stars, 0);
assert.equal(reduce(s, { type: 'SELECT', ingredientId: 2 }), s, '이미 드린 차는 다시 못 고른다');
s = reduce(reduce(reduce(s, { type: 'SELECT', ingredientId: 5 }), { type: 'SERVE', sipLine: '.' }), { type: 'RESOLVE_SERVE', fallbackLine: 'F2', now: 2 });
assert.ok(s.guest.hint?.startsWith('가만히 보니'), '두 번째 오답부터 귀띔');
assert.equal(s.tonight.guests, 0);
s = reduce(reduce(reduce(s, { type: 'SELECT', ingredientId: 8 }), { type: 'SERVE', sipLine: '.' }), { type: 'RESOLVE_SERVE', fallbackLine: 'F3', now: 1000 });
assert.equal(s.guest.step, 'comforted'); assert.equal(s.guest.reward, 3); assert.equal(s.save.stars, 3, '정답 1 + 첫 해금 2');
assert.equal(s.tonight.guests, 1, '로비: 오늘 맞이한 손님');
assert.deepEqual(s.save.collection.guest_001, { firstAt: 1000, count: 1, ingredientId: 8 });
s = reduce(s, { type: 'TO_CROSSROADS' }); assert.equal(s.phase, PHASE.CROSSROADS, '첫 손님을 배웅하면 로비');
s = reduce(s, { type: 'START_GUEST', guestId: 'guest_001' });
s = reduce(reduce(reduce(s, { type: 'SELECT', ingredientId: 8 }), { type: 'SERVE', sipLine: '.' }), { type: 'RESOLVE_SERVE', fallbackLine: 'F', now: 5 });
assert.equal(s.save.stars, 4, '두 번째 위로는 별조각 1개'); assert.equal(s.save.collection.guest_001.count, 2); assert.equal(s.save.collection.guest_001.firstAt, 1000);
s = reduce(s, { type: 'TO_CROSSROADS' });
s = reduce(s, { type: 'START_REFLECTION' }); assert.equal(s.phase, PHASE.REFLECTION);
assert.deepEqual(s.reflection, { text: '', leafId: null, fruitId: null, pickMode: 'leaf' });
assert.equal(reduce(s, { type: 'COMPLETE_REFLECTION', advice: {} }), s, '글과 차가 없으면 완성할 수 없다');
s = reduce(s, { type: 'SET_TEXT', text: '가'.repeat(500) }); assert.equal(s.reflection.text.length, 300);
s = reduce(s, { type: 'SET_TEXT', text: '걱정이 많아서 잠이 안 와요' });
s = reduce(s, { type: 'SELECT', ingredientId: 1 });
assert.equal(s.reflection.leafId, 1); assert.equal(s.reflection.pickMode, 'fruit', '찻잎을 고르면 과일 탭으로');
assert.equal(reduce(s, { type: 'COMPLETE_REFLECTION', advice: {} }), s, '과일이 없으면 완성할 수 없다');
s = reduce(s, { type: 'SELECT', ingredientId: 1 });
assert.equal(s.reflection.fruitId, 1); assert.equal(s.reflection.pickMode, 'fruit');
s = reduce(s, { type: 'SET_PICK_MODE', mode: 'leaf' }); assert.equal(s.reflection.pickMode, 'leaf');
assert.equal(reduce(s, { type: 'SET_PICK_MODE', mode: 'stem' }), s, '모르는 탭은 무시');
s = reduce(s, { type: 'SELECT', ingredientId: 1 }); assert.equal(s.reflection.pickMode, 'leaf', '둘 다 골랐으면 탭은 그대로');
const advice = analyzeWorry(s.reflection.text, { leafId: s.reflection.leafId, fruitId: s.reflection.fruitId });
s = reduce(s, { type: 'COMPLETE_REFLECTION', advice });
assert.equal(s.phase, PHASE.AD_GATE); assert.equal(s.reflection.text, '', '분석 후 고민 글은 지운다'); assert.equal(s.save.reflections, 1);
assert.equal(s.tonight.teas, 1, '로비: 나를 위한 차');
assert.deepEqual(s.advice.chosen, { leafId: 1, fruitId: 1 });
assert.equal(s.advice.recommended.leafId, 3, '1위 화평 → 캐모마일 찻잎'); assert.equal(s.advice.match, false);
assert.equal(s.advice.message, `홍차 딸기차도 좋지만 ${blendName(s.advice.recommended)}는 어떨까요?`);
s = reduce(s, { type: 'SET_PICK_MODE', mode: 'fruit' }); assert.equal(s.reflection.pickMode, 'fruit', '광고 대기 중에도 탭 보기');
s = reduce(s, { type: 'AD_REQUESTED' }); assert.equal(s.adStatus, 'loading');
s = reduce(s, { type: 'AD_DISMISSED' }); assert.equal(s.adStatus, 'dismissed'); assert.equal(s.phase, PHASE.AD_GATE, '중간에 닫으면 조언으로 가지 않는다');
s = reduce(s, { type: 'AD_REWARDED' }); assert.equal(s.phase, PHASE.ADVICE);
s = reduce(s, { type: 'TO_CROSSROADS' }); assert.equal(s.phase, PHASE.CROSSROADS); assert.equal(s.advice, null); assert.equal(s.reflection.leafId, null);
const reset = reduce({ ...s, save: { ...s.save, settings: { music: false, sfx: true, haptics: true } } }, { type: 'RESET_PROGRESS' });
assert.equal(reset.save.stars, 0); assert.equal(reset.save.settings.music, false, '초기화해도 설정은 유지'); assert.equal(reset.phase, PHASE.TITLE);
assert.deepEqual(reset.tonight, { guests: 0, teas: 0 });
console.log('✓ 상태 머신 Phase 1→2(로비)→3→3.5→4→2, 첫 손님 먼저, 찻잎+과일 고르기, 오답/귀띔/별조각/도감/초기화');

// ── 1-b. 블렌딩 규칙 (2위가 1위의 20% 이상일 때만 과일로) ──
const r = (pairs) => pairs.map(([label, share]) => ({ label, share }));
assert.deepEqual(decideBlend(r([[1, 0.5], [8, 0.07], [3, 0.05]])), { leafId: 1, fruitId: 1 }, '사랑 50 · 온유 7 → 사랑+사랑');
assert.equal(blendName(decideBlend(r([[1, 0.5], [8, 0.07]]))), '홍차 딸기차');
assert.deepEqual(decideBlend(r([[1, 0.6], [8, 0.13], [3, 0.05]])), { leafId: 1, fruitId: 8 }, '사랑 60 · 온유 13 → 사랑+온유');
assert.equal(blendName(decideBlend(r([[1, 0.6], [8, 0.13]]))), '홍차 배차');
assert.deepEqual(decideBlend(r([[1, 0.5], [8, 0.1]])), { leafId: 1, fruitId: 8 }, '딱 20% 는 과일로 쓴다');
assert.deepEqual(decideBlend(r([[1, 0.5], [8, 0.0999]])), { leafId: 1, fruitId: 1 });
assert.equal(blendName({ leafId: 3, fruitId: 1 }), '캐모마일 딸기차', '1위 화평, 2위 사랑');
assert.equal(blendName({ leafId: 1, fruitId: 3 }), '홍차 복숭아차', '순서가 의미를 가진다');
const names = new Set();
for (let a = 1; a <= 9; a += 1) for (let b = 1; b <= 9; b += 1) names.add(blendName({ leafId: a, fruitId: b }));
assert.equal(names.size, 81, '조합은 정확히 81가지');
assert.equal(blendLine({ leafId: 1, fruitId: 1 }), '홍차와 딸기 모두 따뜻하고 붉은 마음을 담았어요.');
assert.equal(blendLine({ leafId: 3, fruitId: 3 }), '캐모마일과 복숭아 모두 마음을 가라앉히는 부드러움을 담았어요.');
assert.equal(blendLine({ leafId: 1, fruitId: 8 }), '홍차의 따뜻하고 붉은 마음에 배의 볶아낸 듯 순해진 성품을 더했어요.');
assert.equal(blendLine({ leafId: 3, fruitId: 4 }), '캐모마일의 마음을 가라앉히는 부드러움에 대추의 오랜 시간 숙성되는 깊이를 더했어요.');
assert.equal(fill('{x}{은/는}', { x: '말차 레몬차' }), '말차 레몬차는');
assert.equal(fill('{x}{은/는}', { x: '캐모마일' }), '캐모마일은', '받침이 있으면 은');
assert.ok(isSameBlend({ leafId: 1, fruitId: 8 }, { leafId: 1, fruitId: 8 }));
assert.ok(!isSameBlend({ leafId: 1, fruitId: 8 }, { leafId: 8, fruitId: 1 }));
assert.equal(blendParts({ leafId: 1, fruitId: 99 }), null);
assert.equal(mixHex('#000000', '#ffffff', 0.5), '#808080');
assert.equal(mixHex('#fff', '#000', 0), '#ffffff');
assert.equal(mixHex('nope', '#000', 0.5), 'nope');
// 일치는 찻잎과 과일이 둘 다 같을 때만
const anger = analyzeWorry('화가 나서 소리를 질렀어요', { leafId: 8, fruitId: 8 });
const rec = anger.recommended;
assert.equal(rec.leafId, 8, '분노 → 온유(호지차)');
const exact = analyzeWorry('화가 나서 소리를 질렀어요', rec);
assert.equal(exact.match, true); assert.equal(exact.message, '지금 마음과 딱 맞는 차를 고르셨네요.');
const otherFruit = rec.fruitId === 1 ? 2 : 1;
const leafOnly = analyzeWorry('화가 나서 소리를 질렀어요', { leafId: rec.leafId, fruitId: otherFruit });
assert.equal(leafOnly.match, false, '찻잎만 같으면 일치가 아니다');
assert.equal(leafOnly.message, `${blendName({ leafId: rec.leafId, fruitId: otherFruit })}도 좋지만 ${blendName(rec)}는 어떨까요?`);
const fruitOnly = analyzeWorry('화가 나서 소리를 질렀어요', { leafId: rec.leafId === 1 ? 2 : 1, fruitId: rec.fruitId });
assert.equal(fruitOnly.match, false, '과일만 같아도 일치가 아니다');
const unknownAdvice = analyzeWorry('ㅁㄴㅇㄹ', { leafId: 4, fruitId: 9 });
assert.equal(unknownAdvice.known, 0); assert.equal(unknownAdvice.match, true); assert.deepEqual(unknownAdvice.recommended, { leafId: 4, fruitId: 9 });
assert.equal(unknownAdvice.message, '말로 다 담기 어려운 마음이었나 봐요. 고르신 보이차 레몬차가 지금 당신에게 필요한 차일 거예요.');
assert.deepEqual(unknownAdvice.mood, []);
const negated = analyzeWorry('화가 안 나요. 그냥 요즘 외롭고 아무도 저를 사랑하지 않는 것 같아요', { leafId: 8, fruitId: 8 });
assert.equal(negated.recommended.leafId, 1, '"화가 안 나요"는 화로 읽지 않는다 → 사랑');
// 기획 데이터 검증: 과일이 빠진 열매, 잘못된 색, 잘못된 블렌딩 비율
const { validateGameData, validateBlendData } = await import(root + 'logic/validateData.js');
const { INGREDIENTS } = await import(root + 'data/ingredients.js');
const broken = validateGameData({
  guests: [],
  ingredients: [...INGREDIENTS.slice(0, 7), { ...INGREDIENTS[7], fruit: undefined }, { ...INGREDIENTS[8], color: '연두' }],
  fallbackDialogues: [],
});
assert.equal(broken.ingredients.length, 8, '과일이 빠진 열매는 제외');
assert.ok(broken.errors.some((e) => e.problems.some((p) => p.includes('"fruit"'))));
assert.ok(broken.warnings.some((w) => w.includes('16진수 색')), '색 형식 경고');
assert.ok(broken.warnings.some((w) => w.includes('9가지(3×3 칸)')), '열매 수 경고');
const badBlend = validateBlendData({ secondRatio: 1.5 }, { name: '' });
assert.equal(badBlend.ratio, 0.2); assert.equal(badBlend.errors.length, 1); assert.equal(badBlend.texts.name, '{leaf} {fruit}차');
assert.deepEqual(validateBlendData({ secondRatio: 0.3 }, { name: '{leaf}·{fruit}', blendLine: 'a', pureLine: 'b' }).errors, []);
console.log('✓ 블렌딩: 20% 규칙(사랑50·온유7 / 사랑60·온유13 / 경계), 이름 규칙·81가지, 연결 이미지 문장, 조사, 일치=찻잎+과일 모두');

// ── 2. 세이브 안전 병합 ──
assert.deepEqual(mergeSave(null), createDefaultSave());
assert.deepEqual(mergeSave('망가진 값'), createDefaultSave());
const merged = mergeSave({
  stars: -5,
  collection: { guest_001: { firstAt: 'x', count: 0 }, ghost: { count: 2, ingredientId: 3, firstAt: 9 }, bad: 7 },
  visits: { a: 2, b: -1, c: 'x' },
  settings: { music: false, sfx: 'yes' },
  future: { keep: true },
});
assert.equal(merged.stars, 0); assert.equal(merged.collection.guest_001.count, 1); assert.ok(merged.collection.ghost, '지금 없는 손님 기록도 보존');
assert.equal(merged.collection.bad, undefined); assert.deepEqual(merged.visits, { a: 2 });
assert.deepEqual(merged.settings, { music: false, sfx: true, haptics: true });
assert.deepEqual(merged.future, { keep: true }, '모르는 필드는 버리지 않는다');
const legacy = migrateLegacySave({ state: { nightCount: 4, comforted: { guest_002: { firstAt: 5, count: 2, ingredientId: 3 } }, visits: { guest_002: 3 }, lastGuestId: 'guest_002', seenIntro: true, settings: { music: false, sfx: true, haptics: true } }, version: 1 });
assert.equal(legacy.stars, 4, '옛 기록: 2번 위로(2) + 첫 해금(2)'); assert.equal(legacy.seenIntro, true); assert.equal(legacy.settings.music, false);
const store = (init = {}) => {
  const m = new Map(Object.entries(init));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), map: m };
};
assert.deepEqual(loadSave(store()), createDefaultSave());
const corrupted = store({ [SAVE_KEY]: '{broken json' });
assert.deepEqual(loadSave(corrupted), createDefaultSave());
assert.equal(corrupted.map.get(SAVE_KEY + ':corrupted'), '{broken json', '손상된 기록은 따로 보관');
const legacyStore = store({ [LEGACY_SAVE_KEY]: JSON.stringify({ state: { comforted: { guest_001: { firstAt: 1, count: 1, ingredientId: 8 } } }, version: 1 }) });
assert.equal(loadSave(legacyStore).stars, 3);
const st = store(); writeSave({ ...createDefaultSave(), stars: 7 }, st); assert.equal(loadSave(st).stars, 7);
assert.equal(loadSave({ getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } }).stars, 0, '저장소 접근이 막혀도 동작');
const view = buildCollection(
  mergeSave({ collection: { guest_001: { firstAt: 1, count: 1, ingredientId: 8 }, removed_guest: { firstAt: 1, count: 1 } }, visits: { guest_002: 1 } }),
  [...GUEST_LIST, { id: 'guest_999', name: '새 손님' }],
);
assert.deepEqual(view.map((v) => v.status), ['comforted', 'visited', 'unknown', 'unknown']);
console.log('✓ 세이브 병합: 손상/옛 버전/모르는 필드/사라진 손님/새 손님/저장소 차단');

// ── 3. 광고 서비스 ──
globalThis.window = {};
const { requestRewardedAd } = await import(root + 'utils/adService.js');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function scenario(setup) {
  delete window.adBreak;
  delete window.__adsBlocked;
  setup();
  const log = [];
  requestRewardedAd({ onReward: () => log.push('reward'), onDismiss: () => log.push('dismiss'), onPause: () => log.push('pause'), onResume: () => log.push('resume') });
  await sleep(30);
  return log.join(',');
}
assert.equal(await scenario(() => {}), 'reward', '스크립트 없음');
assert.equal(await scenario(() => { window.adBreak = () => {}; window.__adsBlocked = true; }), 'reward', '차단됨');
assert.equal(await scenario(() => { window.adBreak = (o) => o.beforeReward(() => { o.beforeAd(); o.adViewed(); o.afterAd(); o.adBreakDone({ breakStatus: 'viewed' }); }); }), 'pause,resume,reward', '끝까지 봄');
assert.equal(await scenario(() => { window.adBreak = (o) => o.beforeReward(() => { o.beforeAd(); o.adDismissed(); o.afterAd(); o.adBreakDone({ breakStatus: 'dismissed' }); }); }), 'pause,resume,dismiss', '중간에 닫음');
assert.equal(await scenario(() => { window.adBreak = (o) => o.adBreakDone({ breakStatus: 'notReady' }); }), 'reward', '재고 없음');
assert.equal(await scenario(() => { window.adBreak = (o) => o.adBreakDone({ breakStatus: 'frequencyCapped' }); }), 'reward', '빈도 제한');
assert.equal(await scenario(() => { window.adBreak = () => { throw new Error('boom'); }; }), 'reward', '예외');
console.log('✓ 광고: 스크립트 없음/차단/끝까지 봄/중간에 닫음/재고 없음/빈도 제한/예외');
console.log('\n모든 테스트 통과');
