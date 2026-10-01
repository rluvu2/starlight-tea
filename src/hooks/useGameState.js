/**
 * ─────────────────────────────────────────────────────────────────────
 *  별빛 찻집 · 게임 상태 (상태 머신 + localStorage 안전 병합)
 * ─────────────────────────────────────────────────────────────────────
 *  URL 이동 없이 아래 Phase 사이를 오간다. (라우터 없음, App.jsx 가 phase 로 화면을 고른다)
 *
 *   TITLE ─(첫 방문)→ INTRO ─┐
 *     └──────────────────────┴→ GUEST (Phase 1 손님 맞이: 찻잎 1 + 과일 1) ─정답 후 터치→ CROSSROADS (Phase 2 찻집 로비)
 *   찻집 문을 열면 언제나 손님 맞이가 먼저다. 로비(메인 메뉴)는 첫 손님을 배웅한 뒤부터 열린다.
 *   손님은 아직 마음을 데우지 못한 손님 중 가장 쉬운 단계(level)부터 찾아온다.
 *   CROSSROADS ─[다음 손님 맞이하기]→ GUEST (새 손님)
 *   CROSSROADS ─[나를 위한 차 끓이기]→ REFLECTION (Phase 3: 고민 + 찻잎 1 + 과일 1) ─[완성하기]→ AD_GATE (Phase 3.5)
 *   AD_GATE ─광고 끝까지 시청 / 광고 없음·차단·실패→ ADVICE (Phase 4) ─터치→ CROSSROADS
 *   AD_GATE ─광고를 중간에 닫음→ AD_GATE (버튼을 다시 보여 줌)
 *
 *  세이브(보유 별조각, 해금 도감 등)는 바뀔 때마다 localStorage 에 자동 저장되고,
 *  앱을 열 때 기존 기록과 지금의 데이터를 안전하게 병합한다. (아래 1번 영역)
 * ─────────────────────────────────────────────────────────────────────
 */
import { createContext, createElement, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { pauseForAd, resumeAfterAd } from '../audio/engine.js';
import { STAR_REWARD } from '../data/rewards.js';
import { HINT_TEMPLATE, REFLECTION_TEXT, SIP_LINES } from '../data/scripts.js';
import { analyzeWorry, getClassifier } from '../logic/advisor.js';
import { blendParts, PICK, tasteBlend } from '../logic/blend.js';
import { GUEST_LIST, guestBlend, guestById, ingredientById, MISS_LINES } from '../logic/gameData.js';
import { fill } from '../logic/josa.js';
import { pickNextGuest } from '../logic/pickGuest.js';
import { pick, pickDifferent } from '../logic/random.js';
import { requestRewardedAd } from '../utils/adService.js';

export const PHASE = {
  TITLE: 'title',
  INTRO: 'intro',
  GUEST: 'guest', // Phase 1
  CROSSROADS: 'crossroads', // Phase 2 (찻집 로비 · 메인 메뉴)
  REFLECTION: 'reflection', // Phase 3
  AD_GATE: 'adGate', // Phase 3.5
  ADVICE: 'advice', // Phase 4
};

/* ═══════════════════════════════════════════════════════════════════
 *  1. 세이브 데이터 — 어떤 기록이 들어와도 깨지지 않는 병합
 * ═══════════════════════════════════════════════════════════════════ */

export const SAVE_KEY = 'starlight-teahouse/save';
export const LEGACY_SAVE_KEY = 'starlight-teahouse-save'; // 이전 버전(v1)의 저장 위치
export const SAVE_VERSION = 3; // v3: 도감 기록에 찻잎(leafId)과 과일(fruitId)을 함께 남긴다
const DEFAULT_SETTINGS = { music: true, sfx: true, haptics: true };

export function createDefaultSave() {
  return {
    version: SAVE_VERSION,
    stars: 0, // 보유 별조각
    collection: {}, // 해금 도감 { [guestId]: { firstAt, count, leafId, fruitId } } — 마음을 데운 찻잎·과일
    visits: {}, // { [guestId]: 방문 횟수 }
    lastGuestId: null,
    seenIntro: false,
    reflections: 0, // '나를 위한 차'를 끓인 횟수
    settings: { ...DEFAULT_SETTINGS },
  };
}

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const toCount = (value) => (Number.isFinite(value) && value > 0 ? Math.floor(value) : 0);
const toId = (value) => (Number.isInteger(value) ? value : null);

function sanitizeCollection(raw) {
  const collection = {};
  if (!isPlainObject(raw)) return collection;
  for (const [guestId, entry] of Object.entries(raw)) {
    if (!isPlainObject(entry)) continue;
    collection[guestId] = {
      firstAt: Number.isFinite(entry.firstAt) ? entry.firstAt : 0,
      count: Math.max(1, toCount(entry.count)),
      // v2 까지는 찻잎 하나만 ingredientId 로 남겼다
      leafId: toId(entry.leafId) ?? toId(entry.ingredientId),
      fruitId: toId(entry.fruitId),
    };
  }
  return collection;
}

function sanitizeCounts(raw) {
  const counts = {};
  if (!isPlainObject(raw)) return counts;
  for (const [key, value] of Object.entries(raw)) {
    if (toCount(value) > 0) counts[key] = toCount(value);
  }
  return counts;
}

/**
 * 어떤 값이 들어와도(손상된 기록, 옛 버전, 앞으로의 버전) 게임이 쓸 수 있는 세이브로 만든다.
 * - 값의 형태가 틀리면 그 항목만 기본값으로 되돌린다.
 * - 모르는 필드는 버리지 않는다 (앞으로의 버전과 호환).
 * - 지금 GUESTS 에 없는 손님의 기록도 지우지 않는다. 기획자가 손님을 추가·삭제하고
 *   재배포해도 기존 유저의 도감이 사라지거나 충돌하지 않는다.
 */
export function mergeSave(raw) {
  const base = createDefaultSave();
  if (!isPlainObject(raw)) return base;
  const settings = { ...base.settings };
  if (isPlainObject(raw.settings)) {
    for (const key of Object.keys(settings)) {
      if (typeof raw.settings[key] === 'boolean') settings[key] = raw.settings[key];
    }
  }
  return {
    ...raw,
    version: SAVE_VERSION,
    stars: toCount(raw.stars),
    collection: sanitizeCollection(raw.collection),
    visits: sanitizeCounts(raw.visits),
    lastGuestId: typeof raw.lastGuestId === 'string' ? raw.lastGuestId : null,
    seenIntro: raw.seenIntro === true,
    reflections: toCount(raw.reflections),
    settings,
  };
}

/** 이전 버전(v1) 기록을 옮긴다. 이미 마음을 데운 손님만큼 별조각을 챙겨 준다. */
export function migrateLegacySave(legacy) {
  const state = isPlainObject(legacy?.state) ? legacy.state : legacy;
  if (!isPlainObject(state)) return null;
  const collection = sanitizeCollection(state.comforted);
  const stars = Object.values(collection).reduce(
    (sum, entry) => sum + entry.count * STAR_REWARD.perfectMatch + STAR_REWARD.firstComfort,
    0,
  );
  return mergeSave({
    stars,
    collection,
    visits: state.visits,
    lastGuestId: state.lastGuestId,
    seenIntro: state.seenIntro,
    settings: state.settings,
  });
}

function getStorage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null; // 사생활 보호 모드 등에서 저장소 접근이 막힌 경우
  }
}

/** 앱을 열 때 저장된 기록을 읽어 병합한다. 어떤 경우에도 예외를 던지지 않는다. */
export function loadSave(storage = getStorage()) {
  if (!storage) return createDefaultSave();
  try {
    const text = storage.getItem(SAVE_KEY);
    if (text != null) return mergeSave(JSON.parse(text));
  } catch {
    // 손상된 기록은 지우지 않고 따로 보관한 뒤 새로 시작한다
    try {
      storage.setItem(`${SAVE_KEY}:corrupted`, storage.getItem(SAVE_KEY) ?? '');
    } catch {
      /* 저장 공간이 없으면 포기 */
    }
    return createDefaultSave();
  }
  try {
    const legacy = storage.getItem(LEGACY_SAVE_KEY);
    if (legacy != null) return migrateLegacySave(JSON.parse(legacy)) ?? createDefaultSave();
  } catch {
    /* 옛 기록이 망가져 있으면 무시 */
  }
  return createDefaultSave();
}

export function writeSave(save, storage = getStorage()) {
  try {
    storage?.setItem(SAVE_KEY, JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}

/** 도감 보기: 지금의 GUESTS 기준으로 기록을 맞춰 본다. 새 손님은 잠긴 채로 나온다. */
export function buildCollection(save, guests = GUEST_LIST) {
  return guests.map((guest, index) => {
    const record = save.collection[guest.id] ?? null;
    const visits = save.visits[guest.id] ?? 0;
    // 마음을 데운 차 { leafId, fruitId } — 예전 기록에 빠진 쪽은 손님의 정답으로 채운다
    const answer = guestBlend(guest);
    const blend = record ? { leafId: record.leafId ?? answer.leafId, fruitId: record.fruitId ?? answer.fruitId } : null;
    return {
      guest,
      number: index + 1,
      record,
      blend,
      visits,
      status: record ? 'comforted' : visits > 0 ? 'visited' : 'unknown',
    };
  });
}

/* ═══════════════════════════════════════════════════════════════════
 *  2. 상태 머신 — 순수 함수 (무작위 값과 시간은 action 으로 받는다)
 * ═══════════════════════════════════════════════════════════════════ */

// Phase 1·3 공통: 유저가 고른 찻잎(leafId)·과일(fruitId) + 아래 칸이 지금 보여 주는 탭(pickMode)
const emptyPick = () => ({ leafId: null, fruitId: null, pickMode: PICK.LEAF });
// Phase 3: 고민 글 + 찻잎·과일
const emptyReflection = () => ({ text: '', ...emptyPick() });
const PICK_MODES = [PICK.LEAF, PICK.FRUIT];
const REFLECTION_FLOW = [PHASE.REFLECTION, PHASE.AD_GATE, PHASE.ADVICE];
const HINT_AFTER_MISSES = 2; // 두 번째로 아쉬운 차를 드렸을 때부터 귀띔

// Phase 1: 손님 한 분의 방문
const newVisit = (guest) => ({
  id: guest.id,
  step: 'talking', // talking | serving | missed | comforted
  line: { speaker: 'guest', text: guest.story },
  ...emptyPick(),
  served: null, // 마지막으로 내어 드린 { leafId, fruitId }
  result: null, // 마지막 한 모금의 결과 (tasteBlend: match | leafOnly | fruitOnly | swapped | none)
  solved: { leaf: false, fruit: false }, // 맞힌 쪽은 고정된다
  tried: { leaf: [], fruit: [] }, // 아쉬웠던 찻잎·과일 (다시 고를 수 없다)
  misses: 0,
  hint: null, // { part: leaf|fruit, text }
  reward: 0,
  isNewEntry: false,
});

export function createInitialState(save = createDefaultSave()) {
  return {
    phase: PHASE.TITLE,
    save,
    visitKey: 0,
    guest: null, // Phase 1 (newVisit)
    reflection: emptyReflection(), // Phase 3
    advice: null, // Phase 3 에서 미리 계산해 둔 조언 (analyzeWorry 결과)
    adStatus: 'idle', // Phase 3.5: idle | loading | dismissed
    lastMissLine: null, // 같은 대사가 연달아 나오지 않도록
    tonight: { guests: 0, teas: 0 }, // 로비에 보여 줄 오늘 밤의 기록 (저장하지 않음)
  };
}

const canChooseTea = (guest) => guest?.step === 'talking' || guest?.step === 'missed';
export const isGuestReady = (guest) => canChooseTea(guest) && Boolean(ingredientById(guest.leafId) && ingredientById(guest.fruitId));
export const isReflectionReady = (reflection) =>
  Boolean(reflection?.text.trim() && ingredientById(reflection.leafId) && ingredientById(reflection.fruitId));

/** 찻잎 또는 과일을 고르고, 다른 쪽이 비어 있으면 그 탭으로 넘겨 준다 */
function pickPart(selection, id, mode) {
  if (mode === PICK.FRUIT) return { fruitId: id, pickMode: selection.leafId ? PICK.FRUIT : PICK.LEAF };
  return { leafId: id, pickMode: selection.fruitId ? PICK.LEAF : PICK.FRUIT };
}

// SELECT 는 어느 탭에서 골랐는지(mode)를 함께 받는다. (탭이 넘어가는 사이에 누른 칸도 제자리에 들어가도록)
const pickModeOf = (action, selection) => (PICK_MODES.includes(action.mode) ? action.mode : selection.pickMode);

export function gameReducer(state, action) {
  switch (action.type) {
    case 'SHOW_INTRO':
      return state.phase === PHASE.TITLE ? { ...state, phase: PHASE.INTRO } : state;

    case 'MARK_INTRO_SEEN':
      return { ...state, save: { ...state.save, seenIntro: true } };

    case 'START_GUEST': {
      const guest = guestById(action.guestId);
      if (![PHASE.TITLE, PHASE.INTRO, PHASE.CROSSROADS].includes(state.phase)) return state;
      if (!guest) return { ...state, phase: PHASE.CROSSROADS, guest: null }; // 등장할 손님이 없으면 교차로로
      const { save } = state;
      return {
        ...state,
        phase: PHASE.GUEST,
        visitKey: state.visitKey + 1,
        guest: newVisit(guest),
        save: {
          ...save,
          visits: { ...save.visits, [guest.id]: (save.visits[guest.id] ?? 0) + 1 },
          lastGuestId: guest.id,
        },
      };
    }

    case 'SELECT': {
      const id = action.ingredientId;
      if (!ingredientById(id)) return state;
      const { guest, reflection } = state;
      if (state.phase === PHASE.GUEST && canChooseTea(guest)) {
        // 맞힌 쪽은 고정, 아쉬웠던 재료는 다시 고를 수 없다
        const mode = pickModeOf(action, guest);
        if (guest.solved[mode] || guest.tried[mode].includes(id)) return state;
        return { ...state, guest: { ...guest, ...pickPart(guest, id, mode) } };
      }
      if (state.phase === PHASE.REFLECTION) {
        return { ...state, reflection: { ...reflection, ...pickPart(reflection, id, pickModeOf(action, reflection)) } };
      }
      return state;
    }

    case 'SERVE': {
      const { guest } = state;
      if (state.phase !== PHASE.GUEST || !isGuestReady(guest)) return state;
      return {
        ...state,
        guest: {
          ...guest,
          step: 'serving',
          served: { leafId: guest.leafId, fruitId: guest.fruitId },
          line: { speaker: 'narration', text: action.sipLine },
        },
      };
    }

    case 'RESOLVE_SERVE': {
      const { guest, save } = state;
      const data = guestById(guest?.id);
      if (state.phase !== PHASE.GUEST || guest?.step !== 'serving' || !data) return state;
      const { served } = guest;
      const answer = guestBlend(data);
      const result = tasteBlend(served, answer);

      if (result === 'match') {
        // 찻잎과 과일이 둘 다 맞으면: 고유 위로 대사 + 별조각 획득 + 도감 해금
        const previous = save.collection[guest.id];
        const isNewEntry = !previous;
        const reward = STAR_REWARD.perfectMatch + (isNewEntry ? STAR_REWARD.firstComfort : 0);
        return {
          ...state,
          guest: {
            ...guest,
            step: 'comforted',
            result,
            solved: { leaf: true, fruit: true },
            hint: null,
            reward,
            isNewEntry,
            line: { speaker: 'guest', text: data.perfect_match_dialogue },
          },
          tonight: { ...state.tonight, guests: state.tonight.guests + 1 },
          save: {
            ...save,
            stars: save.stars + reward,
            collection: {
              ...save.collection,
              [guest.id]: { firstAt: previous?.firstAt ?? action.now, count: (previous?.count ?? 0) + 1, ...served },
            },
          },
        };
      }

      // 아쉬운 차: 손님이 어느 쪽이 맞았는지 알려 준다. 맞힌 쪽은 그대로 두고(고정) 아쉬운 쪽만 다시 고른다.
      // 두 번째로 아쉬운 차부터는 아직 못 맞힌 쪽(찻잎 먼저)의 귀띔
      const leafOk = result === 'leafOnly';
      const fruitOk = result === 'fruitOnly';
      const roll = Number.isFinite(action.roll) ? action.roll : 0;
      const template = pickDifferent(MISS_LINES[result], state.lastMissLine, () => roll);
      const parts = blendParts(served);
      const misses = guest.misses + 1;
      const hintPart = leafOk ? PICK.FRUIT : PICK.LEAF;
      const hintFrom = ingredientById(hintPart === PICK.LEAF ? answer.leafId : answer.fruitId);
      return {
        ...state,
        lastMissLine: template,
        guest: {
          ...guest,
          step: 'missed',
          result,
          leafId: leafOk ? served.leafId : null,
          fruitId: fruitOk ? served.fruitId : null,
          pickMode: hintPart,
          solved: { leaf: leafOk, fruit: fruitOk },
          tried: {
            leaf: leafOk ? guest.tried.leaf : [...guest.tried.leaf, served.leafId],
            fruit: fruitOk ? guest.tried.fruit : [...guest.tried.fruit, served.fruitId],
          },
          misses,
          line: { speaker: 'guest', text: fill(template, { leaf: parts?.leaf.name ?? '', fruit: parts?.fruit.name ?? '' }) },
          hint: misses >= HINT_AFTER_MISSES && hintFrom ? { part: hintPart, text: fill(HINT_TEMPLATE, { hint: hintFrom.hint }) } : null,
        },
      };
    }

    case 'TO_CROSSROADS': {
      const fromGuest = state.phase === PHASE.GUEST && state.guest?.step === 'comforted';
      const fromSelfCare = [PHASE.REFLECTION, PHASE.AD_GATE, PHASE.ADVICE].includes(state.phase);
      if (!fromGuest && !fromSelfCare) return state;
      return { ...state, phase: PHASE.CROSSROADS, reflection: emptyReflection(), advice: null, adStatus: 'idle' };
    }

    case 'START_REFLECTION':
      if (state.phase !== PHASE.CROSSROADS) return state;
      return { ...state, phase: PHASE.REFLECTION, reflection: emptyReflection(), advice: null, adStatus: 'idle' };

    case 'SET_PICK_MODE':
      if (!PICK_MODES.includes(action.mode)) return state;
      if (state.phase === PHASE.GUEST && state.guest) return { ...state, guest: { ...state.guest, pickMode: action.mode } };
      if (!REFLECTION_FLOW.includes(state.phase)) return state;
      return { ...state, reflection: { ...state.reflection, pickMode: action.mode } };

    case 'SET_TEXT':
      if (state.phase !== PHASE.REFLECTION) return state;
      return { ...state, reflection: { ...state.reflection, text: String(action.text ?? '').slice(0, REFLECTION_TEXT.maxLength) } };

    case 'COMPLETE_REFLECTION': {
      const { reflection } = state;
      if (state.phase !== PHASE.REFLECTION || !isReflectionReady(reflection) || !action.advice) return state;
      return {
        ...state,
        phase: PHASE.AD_GATE,
        advice: action.advice,
        adStatus: 'idle',
        // 고민 글은 분석이 끝나면 바로 지운다 (어디에도 남기지 않음)
        reflection: { ...reflection, text: '', pickMode: PICK.LEAF },
        tonight: { ...state.tonight, teas: state.tonight.teas + 1 },
        save: { ...state.save, reflections: state.save.reflections + 1 },
      };
    }

    case 'AD_REQUESTED':
      return state.phase === PHASE.AD_GATE ? { ...state, adStatus: 'loading' } : state;

    case 'AD_DISMISSED':
      return state.phase === PHASE.AD_GATE ? { ...state, adStatus: 'dismissed' } : state;

    case 'AD_REWARDED':
      return state.phase === PHASE.AD_GATE && state.advice ? { ...state, phase: PHASE.ADVICE, adStatus: 'idle' } : state;

    case 'SET_SETTING':
      if (!(action.key in DEFAULT_SETTINGS) || typeof action.value !== 'boolean') return state;
      return { ...state, save: { ...state.save, settings: { ...state.save.settings, [action.key]: action.value } } };

    case 'RESET_PROGRESS':
      return {
        ...createInitialState({ ...createDefaultSave(), settings: state.save.settings }),
        visitKey: state.visitKey,
      };

    default:
      return state;
  }
}

/* ═══════════════════════════════════════════════════════════════════
 *  3. React 훅 — <GameProvider> 로 감싸고 useGameState() 로 꺼내 쓴다
 * ═══════════════════════════════════════════════════════════════════ */

const GameContext = createContext(null);


export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => createInitialState(loadSave()));
  const stateRef = useRef(state);
  stateRef.current = state;
  const cancelAdRef = useRef(null);

  // 팽주의 분류기는 앱을 연 뒤 한가할 때 미리 학습해 둔다 ([완성하기]를 눌렀을 때 기다림이 없게).
  // 분석 모듈은 따로 나눠 받지 않고 본 파일에 함께 묶는다. 나눠 두면 새 버전을 배포했을 때
  // 옛 화면을 열어 둔 유저가 사라진 파일을 받으려다 조언을 못 듣게 된다. (약 11KB)
  useEffect(() => {
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(() => getClassifier(), { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(() => getClassifier(), 1500);
    return () => clearTimeout(timer);
  }, []);

  // 세이브가 바뀔 때마다 자동 저장
  useEffect(() => {
    writeSave(state.save);
  }, [state.save]);

  // Phase 3.5 를 떠나면 진행 중이던 광고 요청의 결과는 무시한다
  useEffect(() => {
    if (state.phase !== PHASE.AD_GATE && cancelAdRef.current) {
      cancelAdRef.current();
      cancelAdRef.current = null;
    }
  }, [state.phase]);

  const actions = useMemo(() => {
    const nextGuest = () => {
      const guest = pickNextGuest(GUEST_LIST, stateRef.current.save);
      dispatch({ type: 'START_GUEST', guestId: guest?.id ?? null });
    };
    return {
      openTeahouse() {
        if (stateRef.current.save.seenIntro) nextGuest();
        else dispatch({ type: 'SHOW_INTRO' });
      },
      finishIntro() {
        dispatch({ type: 'MARK_INTRO_SEEN' });
        nextGuest();
      },
      nextGuest,
      select(ingredientId, mode) {
        dispatch({ type: 'SELECT', ingredientId, mode });
      },
      serve() {
        const guest = guestById(stateRef.current.guest?.id);
        if (guest) dispatch({ type: 'SERVE', sipLine: fill(pick(SIP_LINES), { name: guest.name }) });
      },
      resolveServe() {
        dispatch({ type: 'RESOLVE_SERVE', roll: Math.random(), now: Date.now() });
      },
      toCrossroads() {
        dispatch({ type: 'TO_CROSSROADS' });
      },
      startReflection() {
        dispatch({ type: 'START_REFLECTION' });
      },
      setReflectionText(text) {
        dispatch({ type: 'SET_TEXT', text });
      },
      setPickMode(mode) {
        dispatch({ type: 'SET_PICK_MODE', mode });
      },
      completeReflection() {
        const { phase, reflection } = stateRef.current;
        if (phase !== PHASE.REFLECTION || !isReflectionReady(reflection)) return;
        // NLP 분석은 지금 미리 실행해 결과를 보관한다 (광고가 끝난 뒤 기다리지 않도록)
        const { leafId, fruitId } = reflection;
        dispatch({ type: 'COMPLETE_REFLECTION', advice: analyzeWorry(reflection.text, { leafId, fruitId }) });
      },
      watchAdForAdvice() {
        const { phase, adStatus } = stateRef.current;
        if (phase !== PHASE.AD_GATE || adStatus === 'loading') return;
        dispatch({ type: 'AD_REQUESTED' });
        cancelAdRef.current = requestRewardedAd({
          onReward: () => dispatch({ type: 'AD_REWARDED' }),
          onDismiss: () => dispatch({ type: 'AD_DISMISSED' }),
          onPause: pauseForAd,
          onResume: resumeAfterAd,
        });
      },
      setSetting(key, value) {
        dispatch({ type: 'SET_SETTING', key, value });
      },
      resetProgress() {
        dispatch({ type: 'RESET_PROGRESS' });
      },
    };
  }, []);

  const value = useMemo(() => ({ state, actions }), [state, actions]);
  return createElement(GameContext.Provider, { value }, children);
}

export function useGameState() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGameState 는 <GameProvider> 안에서만 쓸 수 있어요.');
  return context;
}
