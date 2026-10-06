/**
 * ─────────────────────────────────────────────────────────────────────
 *  별빛 찻집 · 팽주의 찻장 (쿠팡 파트너스 링크, 기획자 편집용)
 * ─────────────────────────────────────────────────────────────────────
 *  '팽주의 조언'이 끝나면 조언 카드 아래에 "오늘의 {찻잎}, 집에서도 우려 볼까요?"
 *  꼬리표가 살며시 떠요. 원하는 분만 눌러서 '팽주의 찻장'을 열고,
 *  거기서 우림 노트를 본 뒤 쿠팡 링크로 넘어갈 수 있어요. (자동으로 열리지 않아요)
 *
 *  enabled      false 로 바꾸면 꼬리표와 찻장이 모두 사라져요
 *  leaves       찻잎마다 쿠팡 링크와 우림 노트. 키는 ingredients.js 의 열매 번호(id)
 *     link        쿠팡 파트너스 링크 (비어 있으면 그 찻잎은 꼬리표를 띄우지 않아요)
 *     water       물 온도
 *     time        우리는 시간
 *     tip         (선택) 그 찻잎만의 우리는 요령
 *  teaware      다구(찻주전자·찻잔) 링크
 *  disclosure   쿠팡 파트너스 필수 고지 문구 — 지우지 마세요
 * ─────────────────────────────────────────────────────────────────────
 */
export const SHOP = {
  enabled: true,
  leaves: {
    1: { link: "https://link.coupang.com/a/hCHZRH1f0m", water: "95℃", time: "3분" }, // 홍차
    2: { link: "https://link.coupang.com/a/hCH10woqcu", water: "85℃", time: "3분" }, // 백차
    3: { link: "https://link.coupang.com/a/hCH4TkJ5xI", water: "100℃", time: "5분" }, // 캐모마일
    4: { link: "https://link.coupang.com/a/hCH7NBrF92", water: "100℃", time: "1분", tip: "처음 우린 물은 찻잎을 깨우는 물이라 한 번 따라 버려요." }, // 보이차
    5: { link: "https://link.coupang.com/a/hCH8WJ3vc4", water: "100℃", time: "5분" }, // 루이보스
    6: { link: "https://link.coupang.com/a/hCIay9ppZs", water: "75℃", time: "2분", tip: "너무 뜨거운 물은 쓴맛을 내요. 끓인 물을 한 김 식혀서 부어 주세요." }, // 녹차
    7: { link: "https://link.coupang.com/a/hCIbGOCo9I", water: "90℃", time: "3분", tip: "여러 번 우려도 맛이 이어져요. 두 번째 잔부터는 조금 더 길게 우려 보세요." }, // 우롱차
    8: { link: "https://link.coupang.com/a/hCIdc2ANbw", water: "95℃", time: "1분" }, // 호지차
    9: { link: "https://link.coupang.com/a/hCIekA3Uo8", water: "80℃", time: "20초", tip: "말차 2g을 물 70ml에 풀고, 손목으로 W를 그리듯 20초쯤 저어 고운 거품을 내요." }, // 말차
  },
  teaware: "https://link.coupang.com/a/hCIe9qGbBs",
  disclosure: "이 콘텐츠는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다."
};

// {leaf} 찻잎 이름, {fruit} 과일 이름, {blend} 팽주의 블렌딩 이름 ("홍차 딸기차")
// {을/를} 같은 조사는 바로 앞 글자의 받침에 맞춰 자동으로 골라집니다.
export const SHOP_TEXT = {
  // 조언 카드 아래 꼬리표
  tag: "오늘의 {leaf}, 집에서도 우려 볼까요?",
  title: "팽주의 찻장",
  adBadge: "광고",
  // 팽주가 건네는 말
  intro: "오늘 밤 권해 드린 {leaf}{을/를} 집에서도 우려 보고 싶다면, 팽주가 아끼는 찻잎을 소개해 드릴게요.",
  noteLabel: "팽주의 우림 노트",
  water: "물",
  time: "시간",
  fruit: "곁들임",
  // 우림 노트 아래 한 줄. 1위와 2위가 같은 열매여도 그대로 어울려요
  blendTip: "우린 {leaf}에 {fruit}{을/를} 조금 곁들이면 오늘 밤의 {blend}{이/가} 돼요.",
  buyButton: "쿠팡에서 {leaf} 보기",
  teawareButton: "찻주전자·찻잔도 둘러보기",
  // 찻장 맨 아래, 부담 없이 닫을 수 있도록
  freeNote: "찻집의 차는 언제나 값을 받지 않아요. 이 링크로 들인 찻잎은 찻집의 등불을 밝히는 작은 보탬이 돼요.",
  // 찻장을 닫고 조언으로 돌아가기
  close: "다음에 볼게요"
};
