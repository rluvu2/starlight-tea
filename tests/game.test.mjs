import assert from 'node:assert/strict';
// 별빛 찻집 단위 테스트: npm test (배포 전에 GitHub Actions 에서도 실행)
// 상태 머신 · 손님 난이도와 방문 순서 · 블렌딩 규칙 · 팽주의 조언 · 데이터 검증 · 세이브 병합 · 광고 서비스
const root = new URL('../src/', import.meta.url).href;
const gs = await import(root + 'hooks/useGameState.js');
const { PHASE, gameReducer: reduce, createInitialState, createDefaultSave, mergeSave, migrateLegacySave, loadSave, writeSave, buildCollection, SAVE_KEY, LEGACY_SAVE_KEY } = gs;
const { GUEST_LIST, guestById, ingredientById } = await import(root + 'logic/gameData.js');
const { analyzeWorry } = await import(root + 'logic/advisor.js');
const { decideBlend, blendName, blendLine, blendParts, isSameBlend, mixHex, tasteBlend } = await import(root + 'logic/blend.js');
const { fill } = await import(root + 'logic/josa.js');
const { pickNextGuest } = await import(root + 'logic/pickGuest.js');

// 손님에게 찻잎과 과일을 골라 내어 드리고, 다 마실 때까지 기다린다
const serve = (state, leafId, fruitId, extra = {}) => {
  let next = state;
  if (leafId != null) next = reduce(reduce(next, { type: 'SET_PICK_MODE', mode: 'leaf' }), { type: 'SELECT', ingredientId: leafId });
  if (fruitId != null) next = reduce(reduce(next, { type: 'SET_PICK_MODE', mode: 'fruit' }), { type: 'SELECT', ingredientId: fruitId });
  next = reduce(next, { type: 'SERVE', sipLine: '.' });
  return reduce(next, { type: 'RESOLVE_SERVE', roll: 0, now: 1, ...extra });
};

// ── 1. 상태 머신: Phase 1 → 2(로비) → 3 → 3.5 → 4 → 2 ──
let s = createInitialState();
assert.equal(s.phase, PHASE.TITLE);
assert.equal(reduce(s, { type: 'START_REFLECTION' }), s, '첫 손님 전에는 나를 위한 차를 끓일 수 없다');
assert.equal(reduce(s, { type: 'TO_CROSSROADS' }), s, '첫 손님 전에는 로비로 갈 수 없다');
s = reduce(s, { type: 'SHOW_INTRO' }); assert.equal(s.phase, PHASE.INTRO);
assert.equal(reduce(s, { type: 'START_REFLECTION' }), s);
s = reduce(s, { type: 'MARK_INTRO_SEEN' });
// 지친 직장인 곰: 찻잎 호지차(8 온유) + 과일 딸기(1 사랑)
s = reduce(s, { type: 'START_GUEST', guestId: 'guest_001' });
assert.equal(s.phase, PHASE.GUEST); assert.equal(s.guest.step, 'talking'); assert.equal(s.save.visits.guest_001, 1);
assert.equal(reduce(s, { type: 'START_REFLECTION' }), s, '손님 맞이 중에는 나를 위한 차로 갈 수 없다');
assert.equal(reduce(s, { type: 'SERVE', sipLine: '...' }), s, '선택 없이 차를 낼 수 없다');
assert.equal(reduce(s, { type: 'TO_CROSSROADS' }), s, '정답 전에는 로비로 갈 수 없다');
s = reduce(s, { type: 'SELECT', ingredientId: 2 });
assert.equal(s.guest.leafId, 2); assert.equal(s.guest.pickMode, 'fruit', '손님에게도 찻잎을 고르면 과일 탭으로');
assert.equal(reduce(s, { type: 'SERVE', sipLine: '...' }), s, '과일 없이는 차를 낼 수 없다');
s = reduce(s, { type: 'SELECT', ingredientId: 5 });
s = reduce(s, { type: 'SERVE', sipLine: '한 모금' }); assert.equal(s.guest.step, 'serving');
assert.deepEqual(s.guest.served, { leafId: 2, fruitId: 5 });
assert.equal(reduce(s, { type: 'SELECT', ingredientId: 3 }), s, '마시는 중에는 바꿀 수 없다');
s = reduce(s, { type: 'RESOLVE_SERVE', roll: 0, now: 1 });
// 백차 + 무화과: 둘 다 아쉬움 → 둘 다 비우고 찻잎 탭부터
assert.equal(s.guest.step, 'missed'); assert.equal(s.guest.result, 'none');
assert.deepEqual(s.guest.tried, { leaf: [2], fruit: [5] }); assert.deepEqual(s.guest.solved, { leaf: false, fruit: false });
assert.equal(s.guest.leafId, null); assert.equal(s.guest.fruitId, null); assert.equal(s.guest.pickMode, 'leaf');
assert.ok(s.guest.line.text.includes('찻잎도 과일도'), '둘 다 아쉽다고 말한다');
assert.equal(s.guest.hint, null, '처음 아쉬울 때는 귀띔 없음'); assert.equal(s.save.stars, 0);
assert.equal(reduce(s, { type: 'SELECT', ingredientId: 2 }), s, '아쉬웠던 찻잎은 다시 못 고른다');
// 호지차 + 청포도: 찻잎만 맞음 → 찻잎은 고정, 과일 탭으로
s = serve(s, 8, 6, { now: 2 });
assert.equal(s.guest.result, 'leafOnly');
assert.equal(s.guest.line.text, '호지차 향은 참 좋아요. 그런데 청포도는 지금 제 마음과 조금 다른 것 같아요.', '어느 쪽이 맞았는지 알려 준다');
assert.deepEqual(s.guest.solved, { leaf: true, fruit: false }); assert.equal(s.guest.leafId, 8, '맞힌 찻잎은 그대로');
assert.equal(s.guest.fruitId, null); assert.equal(s.guest.pickMode, 'fruit', '아쉬운 과일 탭으로');
assert.deepEqual(s.guest.tried, { leaf: [2], fruit: [5, 6] });
assert.deepEqual(s.guest.hint, { part: 'fruit', text: `가만히 보니, ${ingredientById(1).hint}` }, '두 번째부터 아직 못 맞힌 과일의 귀띔');
const onLeafTab = reduce(s, { type: 'SET_PICK_MODE', mode: 'leaf' });
assert.equal(onLeafTab.guest.pickMode, 'leaf', '손님 맞이에서도 탭을 바꿔 볼 수 있다');
assert.equal(reduce(onLeafTab, { type: 'SELECT', ingredientId: 3 }), onLeafTab, '맞힌 찻잎은 바꿀 수 없다');
assert.equal(s.tonight.guests, 0);
s = serve(s, null, 1, { now: 1000 });
assert.equal(s.guest.step, 'comforted'); assert.equal(s.guest.result, 'match'); assert.equal(s.guest.reward, 3); assert.equal(s.save.stars, 3, '정답 1 + 첫 해금 2');
assert.equal(s.tonight.guests, 1, '로비: 오늘 맞이한 손님');
assert.deepEqual(s.save.collection.guest_001, { firstAt: 1000, count: 1, leafId: 8, fruitId: 1 }, '도감에 찻잎과 과일을 함께 남긴다');
assert.equal(reduce(s, { type: 'SELECT', ingredientId: 4 }), s, '마음을 데운 뒤에는 고를 수 없다');
s = reduce(s, { type: 'TO_CROSSROADS' }); assert.equal(s.phase, PHASE.CROSSROADS, '첫 손님을 배웅하면 로비');
s = reduce(s, { type: 'START_GUEST', guestId: 'guest_001' });
assert.deepEqual(s.guest.tried, { leaf: [], fruit: [] }, '다시 찾아오면 처음부터');
s = serve(s, 8, 1, { now: 5 });
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

// ── 1-a. 손님에게 찻잎 + 과일: 맞힌 쪽 알려 주기, 자리 바뀜, 같은 대사 반복 방지 ──
assert.equal(tasteBlend({ leafId: 8, fruitId: 1 }, { leafId: 8, fruitId: 1 }), 'match');
assert.equal(tasteBlend({ leafId: 8, fruitId: 2 }, { leafId: 8, fruitId: 1 }), 'leafOnly');
assert.equal(tasteBlend({ leafId: 2, fruitId: 1 }, { leafId: 8, fruitId: 1 }), 'fruitOnly');
assert.equal(tasteBlend({ leafId: 1, fruitId: 8 }, { leafId: 8, fruitId: 1 }), 'swapped', '찻잎과 과일의 자리가 바뀜');
assert.equal(tasteBlend({ leafId: 1, fruitId: 2 }, { leafId: 8, fruitId: 1 }), 'none', '한쪽 열매만 겹쳐도 자리가 다르면 아쉬움');
const meet = (guestId) => reduce({ ...createInitialState(), phase: PHASE.CROSSROADS }, { type: 'START_GUEST', guestId });
// 잠 못 드는 아기 양: 캐모마일(3) + 복숭아(3). 과일만 맞으면 과일은 고정하고 찻잎 탭으로
let lamb = serve(meet('guest_002'), 1, 3);
assert.equal(lamb.guest.result, 'fruitOnly');
assert.equal(lamb.guest.line.text, '복숭아는 정말 반가운 맛이에요. 그런데 홍차 향이 조금 아쉬워요.');
assert.deepEqual(lamb.guest.solved, { leaf: false, fruit: true }); assert.equal(lamb.guest.fruitId, 3); assert.equal(lamb.guest.pickMode, 'leaf');
assert.equal(reduce(reduce(lamb, { type: 'SET_PICK_MODE', mode: 'fruit' }), { type: 'SELECT', ingredientId: 4 }).guest.fruitId, 3, '맞힌 과일은 바꿀 수 없다');
lamb = reduce(lamb, { type: 'SELECT', ingredientId: 3 });
assert.equal(lamb.guest.pickMode, 'leaf', '과일이 이미 있으면 탭은 그대로');
lamb = reduce(reduce(lamb, { type: 'SERVE', sipLine: '.' }), { type: 'RESOLVE_SERVE', roll: 0, now: 9 });
assert.equal(lamb.guest.step, 'comforted', '캐모마일 복숭아차');
// 곰에게 홍차 + 배: 정답(호지차 + 딸기)과 자리만 바뀜
const bear = serve(meet('guest_001'), 1, 8);
assert.equal(bear.guest.result, 'swapped');
assert.ok(bear.guest.line.text.startsWith('홍차와 배…') && bear.guest.line.text.includes('자리가 바뀐'), '자리가 바뀌었다고 알려 준다');
assert.deepEqual(bear.guest.tried, { leaf: [1], fruit: [8] });
// 같은 대사가 연달아 나오지 않는다
const twice = serve(serve(meet('guest_001'), 2, 5), 3, 6);
assert.equal(twice.guest.result, 'none');
assert.notEqual(twice.guest.line.text, serve(meet('guest_001'), 2, 5).guest.line.text, '직전 대사는 피한다');
assert.deepEqual(twice.guest.hint, { part: 'leaf', text: `가만히 보니, ${ingredientById(8).hint}` }, '둘 다 아쉬우면 찻잎 귀띔부터');
assert.equal(serve(meet('guest_001'), 2, 5, { roll: undefined }).guest.line.text.length > 0, true, 'roll 이 없어도 대사를 고른다');

// 탭이 넘어가는 사이에 누른 칸도 누른 탭 쪽에 들어간다 (SELECT 에 mode 를 함께 보낸다)
let flip = reduce(meet('guest_001'), { type: 'SELECT', ingredientId: 2, mode: 'leaf' });
assert.equal(flip.guest.pickMode, 'fruit');
flip = reduce(flip, { type: 'SELECT', ingredientId: 8, mode: 'leaf' });
assert.deepEqual([flip.guest.leafId, flip.guest.fruitId], [8, null], '과일 탭으로 넘어가기 전에 누른 찻잎은 찻잎으로');
assert.equal(reduce(flip, { type: 'SELECT', ingredientId: 1, mode: 'stem' }).guest.fruitId, 1, '모르는 탭이면 지금 탭으로');

// 난이도와 방문 순서: 아직 마음을 데우지 못한 손님 중 가장 쉬운 단계부터
const levels = GUEST_LIST.map((g) => g.level);
assert.deepEqual(levels, [...levels].sort(), '도감 번호도 쉬운 손님부터');
assert.deepEqual([1, 2, 3].map((level) => levels.filter((l) => l === level).length >= 2), [true, true, true], '단계마다 손님이 둘 이상');
for (const g of GUEST_LIST.filter((g) => g.level === 1)) {
  assert.ok(g.story.includes(ingredientById(g.required_leaf).name) && g.story.includes(ingredientById(g.required_fruit).fruit.name), `${g.name}: 쉬움은 정답 이름이 사연에 보인다`);
}
for (const g of GUEST_LIST.filter((g) => g.level === 2)) {
  const words = [g.required_leaf, g.required_fruit].map((id) => ingredientById(id).virtue.slice(0, 2));
  assert.ok(words.every((w) => g.story.includes(w)), `${g.name}: 보통은 열매 이름이 사연에 보인다 (${words})`);
}
const comforted = (...ids) => ({ collection: Object.fromEntries(ids.map((id) => [id, { count: 1 }])) });
const idsAt = (level) => GUEST_LIST.filter((g) => g.level === level).map((g) => g.id);
const levelOf = (progress, roll) => pickNextGuest(GUEST_LIST, progress, () => roll).level;
for (const roll of [0, 0.5, 0.99]) assert.equal(levelOf({}, roll), 1, '처음엔 언제나 쉬운 손님');
assert.notEqual(pickNextGuest(GUEST_LIST, {}, () => 0).id, pickNextGuest(GUEST_LIST, {}, () => 0.99).id, '같은 단계끼리는 무작위');
assert.equal(levelOf(comforted(idsAt(1)[0]), 0.99), 1, '쉬운 손님을 다 데우기 전에는 쉬운 손님');
for (const roll of [0, 0.99]) assert.equal(levelOf(comforted(...idsAt(1)), roll), 2, '쉬움 다음은 보통');
for (const roll of [0, 0.99]) assert.equal(levelOf(comforted(...idsAt(1), ...idsAt(2)), roll), 3, '그다음 어려움');
assert.equal(levelOf(comforted(...idsAt(3)), 0.5), 1, '어려운 손님만 데웠던 옛 기록도 쉬운 손님부터');
const [firstEasy, secondEasy] = idsAt(1);
assert.equal(pickNextGuest(GUEST_LIST, { ...comforted(secondEasy), lastGuestId: firstEasy }).id, firstEasy, '아직 못 데운 손님은 연달아 와도 된다');
const all = { ...comforted(...GUEST_LIST.map((g) => g.id)), lastGuestId: firstEasy };
for (const roll of [0, 0.5, 0.99]) assert.notEqual(pickNextGuest(GUEST_LIST, all, () => roll).id, firstEasy, '모두 데운 뒤에는 직전 손님만 빼고');
const twins = [{ id: 'a', level: 1 }, { id: 'b', level: 1 }, { id: 'c', level: 2 }];
assert.equal(pickNextGuest(twins, {}, () => 0).id, 'a'); assert.equal(pickNextGuest(twins, {}, () => 0.99).id, 'b', '같은 단계끼리는 무작위');
assert.equal(pickNextGuest([], {}), null);
console.log('✓ 손님: 찻잎+과일 내기, 맞힌 쪽 고정·알려 주기, 자리 바뀜, 귀띔(못 맞힌 쪽), 난이도 순서(쉬움→보통→어려움)');

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
const { validateGameData, validateBlendData, DEFAULT_GUEST_LEVEL } = await import(root + 'logic/validateData.js');
const { INGREDIENTS } = await import(root + 'data/ingredients.js');
const broken = validateGameData({
  guests: [],
  ingredients: [...INGREDIENTS.slice(0, 7), { ...INGREDIENTS[7], fruit: undefined }, { ...INGREDIENTS[8], color: '연두' }],
  missDialogues: {},
});
assert.equal(broken.ingredients.length, 8, '과일이 빠진 열매는 제외');
assert.ok(broken.errors.some((e) => e.problems.some((p) => p.includes('"fruit"'))));
assert.ok(broken.warnings.some((w) => w.includes('16진수 색')), '색 형식 경고');
assert.ok(broken.warnings.some((w) => w.includes('9가지(3×3 칸)')), '열매 수 경고');
assert.deepEqual(Object.keys(broken.missDialogues), ['leafOnly', 'fruitOnly', 'swapped', 'none'], '대사가 비어 있으면 기본 대사');
assert.ok(broken.warnings.some((w) => w.includes('MISS_DIALOGUES.swapped')));
// 손님: 찻잎·과일 정답과 난이도
const guest = (extra) => ({ id: 'g', name: '손님', appearance: 'g.png', story: '사연', perfect_match_dialogue: '고마워요', required_leaf: 3, required_fruit: 3, level: 2, ...extra });
const checked = validateGameData({
  guests: [
    guest({ id: 'no_fruit', required_fruit: undefined }),
    guest({ id: 'bad_leaf', required_leaf: 12 }),
    guest({ id: 'quoted', required_leaf: '8', required_fruit: '1' }),
    guest({ id: 'no_level', level: undefined }),
    guest({ id: 'easy_hidden', level: 1, story: '걱정이 많아 잠이 안 와요' }),
    guest({ id: 'easy_shown', level: 1, story: '캐모마일 복숭아차가 그리워요' }),
  ],
  ingredients: INGREDIENTS,
  missDialogues: { leafOnly: ['a'], fruitOnly: ['b'], swapped: ['c'], none: ['d'] },
});
assert.deepEqual(checked.guests.map((g) => g.id), ['quoted', 'no_level', 'easy_hidden', 'easy_shown'], '정답이 빠지거나 틀린 손님은 제외');
assert.ok(checked.errors.some((e) => e.where.includes('no_fruit') && e.problems.some((p) => p.includes('"required_fruit"'))));
assert.ok(checked.errors.some((e) => e.where.includes('bad_leaf') && e.problems.some((p) => p.includes('"required_leaf"'))));
assert.deepEqual([checked.guests[0].required_leaf, checked.guests[0].required_fruit], [8, 1], '따옴표로 감싼 번호는 숫자로 읽는다');
assert.ok(checked.warnings.some((w) => w.includes('quoted') && w.includes('따옴표')));
assert.equal(checked.guests[1].level, DEFAULT_GUEST_LEVEL, 'level 이 없으면 가장 나중에');
assert.ok(checked.warnings.some((w) => w.includes('easy_hidden') && w.includes('"캐모마일"') && w.includes('"복숭아"')), '쉬움인데 정답 이름이 안 보이면 경고');
assert.ok(!checked.warnings.some((w) => w.includes('easy_shown')));
assert.deepEqual(checked.missDialogues.none, ['d']);
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
assert.deepEqual(merged.collection.ghost, { firstAt: 9, count: 2, leafId: 3, fruitId: null }, 'v2 의 ingredientId 는 찻잎으로 옮긴다');
assert.equal(merged.collection.bad, undefined); assert.deepEqual(merged.visits, { a: 2 });
assert.deepEqual(merged.settings, { music: false, sfx: true, haptics: true });
assert.deepEqual(merged.future, { keep: true }, '모르는 필드는 버리지 않는다');
const legacy = migrateLegacySave({ state: { nightCount: 4, comforted: { guest_002: { firstAt: 5, count: 2, ingredientId: 3 } }, visits: { guest_002: 3 }, lastGuestId: 'guest_002', seenIntro: true, settings: { music: false, sfx: true, haptics: true } }, version: 1 });
assert.equal(legacy.stars, 4, '옛 기록: 2번 위로(2) + 첫 해금(2)'); assert.equal(legacy.seenIntro, true); assert.equal(legacy.settings.music, false);
assert.deepEqual(legacy.collection.guest_002, { firstAt: 5, count: 2, leafId: 3, fruitId: null });
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
  mergeSave({
    collection: { guest_001: { firstAt: 1, count: 1, ingredientId: 8 }, guest_003: { firstAt: 2, count: 1, leafId: 4, fruitId: 4 }, removed_guest: { firstAt: 1, count: 1 } },
    visits: { guest_002: 1 },
  }),
  [...GUEST_LIST, { id: 'guest_999', name: '새 손님' }],
);
const entry = (id) => view.find((v) => v.guest.id === id);
assert.deepEqual(
  ['guest_002', 'guest_003', 'guest_001', 'guest_004', 'guest_999'].map((id) => entry(id).status),
  ['visited', 'comforted', 'comforted', 'unknown', 'unknown'],
);
assert.equal(view.length, GUEST_LIST.length + 1, '지금 없는 손님의 기록은 도감에 나오지 않는다');
assert.deepEqual(entry('guest_001').blend, { leafId: 8, fruitId: guestById('guest_001').required_fruit }, '예전 기록의 빠진 과일은 손님의 정답으로');
assert.deepEqual(entry('guest_003').blend, { leafId: 4, fruitId: 4 }); assert.equal(entry('guest_002').blend, null);
console.log('✓ 세이브 병합: 손상/옛 버전/모르는 필드/사라진 손님/새 손님/저장소 차단, 도감 기록 v2→v3(찻잎+과일)');

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
