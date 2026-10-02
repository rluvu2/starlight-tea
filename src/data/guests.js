/**
 * ─────────────────────────────────────────────────────────────────────
 *  별빛 찻집 · 손님 데이터 (기획자 편집용)
 * ─────────────────────────────────────────────────────────────────────
 *  GUESTS 배열에 { ... } 블록 하나를 복사-붙여넣기 하면
 *  코드 수정 없이 "손님 도감"과 "방문 순서"에 바로 반영됩니다.
 *
 *  [필드 규칙]
 *   id                     고유 ID. 절대 중복 불가 (도감 저장 키). 예) "guest_004"
 *   name                   손님 이름
 *   appearance             이미지 파일명. public/assets/guests/ 폴더에 넣어 주세요.
 *                          (파일이 아직 없으면 게임에서는 실루엣이 대신 보입니다)
 *                          [선택] 같은 폴더에 이름 뒤에 _happy 를 붙인 그림을 두면
 *                          (예: bear_tired_happy.png) 정답 차를 마신 뒤 그 표정으로 바뀝니다.
 *   level                  난이도 1~3. 처음엔 쉬움 2명 → 보통 2명(OPENING_VISITS), 그 뒤로는 무작위로 찾아와요.
 *   story                  손님이 털어놓는 사연 (난이도에 맞춰 써 주세요. 아래 [난이도] 참고)
 *   required_leaf          찻잎 정답 — 열매 번호 (아래 표, 숫자 1~9)
 *   required_fruit         과일 정답 — 열매 번호. 찻잎과 같은 열매여도 됩니다.
 *                          손님에게는 찻잎 하나와 과일 하나를 블렌딩한 차를 내어 드립니다.
 *                          (예: 찻잎 8 + 과일 1 → "호지차 딸기차")
 *   perfect_match_dialogue 찻잎과 과일이 둘 다 맞았을 때의 대사
 *
 *  [난이도] 정답이 사연에 얼마나 드러나는지로 정합니다.
 *   1 쉬움    사연에 찻잎·과일 이름이 그대로 나와요.   예) "엄마가 타 주던 캐모마일 복숭아차"
 *   2 보통    재료 칸 아래의 열매 이름이 사연에 나와요. 예) "오래 참고 기다렸는데…" → 오래 참음
 *   3 어려움  이름은 나오지 않아요. 손님의 상황과 마음을 읽어야 해요.
 *             가장 짙은 마음은 찻잎, 그다음 마음은 과일로 골라요.
 *
 *  [열매 번호 표]  열매 - 찻잎 - 과일 (자세한 설명은 src/data/ingredients.js)
 *   1 사랑-홍차-딸기          2 희락-백차-오렌지      3 화평-캐모마일-복숭아
 *   4 오래 참음-보이차-대추    5 자비-루이보스-무화과  6 양선-녹차-청포도
 *   7 충성-우롱차-석류        8 온유-호지차-배        9 절제-말차-레몬
 *
 *  배열 순서가 도감 번호(No.001, No.002 …) 순서예요. 쉬운 손님부터 적어 두면 보기 좋아요.
 *  (id 는 저장용 이름표라서 순서와 상관없어요)
 *
 *  저장한 뒤 터미널에서 `npm run check` 를 실행하면
 *  빠진 항목, 중복 ID, 없는 이미지 파일을 검사해 줍니다.
 * ─────────────────────────────────────────────────────────────────────
 */
// 처음 찾아오는 손님의 순서: 쉬움 손님 2명 → 보통 손님 2명의 마음을 데운 뒤로는
// 아직 마음을 데우지 못한 손님 중에서 단계와 상관없이 무작위로 찾아와요.
// (모두 데운 뒤에는 직전 손님만 빼고 고르게 다시 들러요)
export const OPENING_VISITS = [
  { level: 1, count: 2 }, // 쉬움 2명
  { level: 2, count: 2 } // 보통 2명
];

export const GUESTS = [
  // ── ★ 쉬움 (10명): 사연에 찻잎·과일 이름이 그대로 나와요 ─────────────
  {
    id: "guest_002", // 고유 ID (절대 중복 불가, 도감 저장용 키값)
    name: "잠 못 드는 아기 양",
    appearance: "lamb_sleepless.png", // public/assets/guests/ 안의 그림 파일명
    level: 1, // 쉬움: 사연에 "캐모마일 복숭아차"가 그대로 나와요
    story: "걱정이 꼬리를 물어서 양을 세어 봐도 잠이 안 와요. 엄마가 타 주던 캐모마일 복숭아차가 그리워요.",
    required_leaf: 3, // 3: 화평-캐모마일
    required_fruit: 3, // 3: 화평-복숭아
    perfect_match_dialogue: "엄마가 타 주던 바로 그 맛이에요… 오늘 밤엔 양을 세지 않아도 잠들 수 있을 것 같아요."
  },
  {
    id: "guest_004",
    name: "생일을 잊힌 고양이",
    appearance: "cat_birthday.png",
    level: 1, // 쉬움: 사연에 "백차", "딸기"가 그대로 나와요 (찻잎과 과일이 서로 다른 열매)
    story: "오늘 제 생일인데 아무도 기억하지 못했어요. 백차에 딸기를 띄워 주시면 웃을 수 있을 것 같아요.",
    required_leaf: 2, // 2: 희락-백차
    required_fruit: 1, // 1: 사랑-딸기
    perfect_match_dialogue: "달콤한 향에 웃음이 나요! 찻집에서 받은 이 차가 올해 최고의 생일 선물이에요."
  },
  {
    id: "guest_007",
    name: "이사 온 아기 펭귄",
    appearance: "penguin_newcomer.png",
    level: 1,
    story: "남쪽 바다에서 막 이사 왔는데 아는 얼굴이 하나도 없어요. 따뜻한 홍차에 무화과를 띄워 주시면 외로움이 조금 녹을 것 같아요.",
    required_leaf: 1, // 1: 사랑-홍차
    required_fruit: 5, // 5: 자비-무화과
    perfect_match_dialogue: "몸도 마음도 사르르 녹아요. 내일은 옆 둥지 친구에게 제가 먼저 인사해 볼래요!"
  },
  {
    id: "guest_008",
    name: "주인을 기다리는 강아지",
    appearance: "puppy_waiting.png",
    level: 1,
    story: "주인이 여행을 떠나서 사흘째 현관 앞에서 기다리고 있어요. 보이차에 복숭아를 넣어 주시면 조금 덜 불안할 것 같아요.",
    required_leaf: 4, // 4: 오래 참음-보이차
    required_fruit: 3, // 3: 화평-복숭아
    perfect_match_dialogue: "꼬리가 저절로 살랑거려요. 오래 기다린 만큼 다시 만나는 날이 더 반갑겠죠? 이제 편하게 기다릴게요."
  },
  {
    id: "guest_009",
    name: "가시가 많은 고슴도치",
    appearance: "hedgehog_prickly.png",
    level: 1,
    story: "가시 때문에 친구들이 저를 안아 주려다 자꾸 놀라요. 호지차에 무화과를 넣은 차를 마시면 저도 포근해질 수 있을까요?",
    required_leaf: 8, // 8: 온유-호지차
    required_fruit: 5, // 5: 자비-무화과
    perfect_match_dialogue: "가시가 스르르 눕는 것 같아요. 가시가 있어도 저는 저대로 따뜻한 고슴도치예요."
  },
  {
    id: "guest_010",
    name: "수영이 무서운 아기 오리",
    appearance: "duckling_pond.png",
    level: 1,
    story: "내일 처음으로 연못에 들어가요. 너무 떨려서요… 캐모마일에 오렌지를 띄운 차를 마시면 웃으면서 들어갈 수 있을 것 같아요.",
    required_leaf: 3, // 3: 화평-캐모마일
    required_fruit: 2, // 2: 희락-오렌지
    perfect_match_dialogue: "떨리던 날개가 가라앉았어요. 내일은 첨벙! 하고 웃으면서 뛰어들 거예요."
  },
  {
    id: "guest_011",
    name: "쳇바퀴를 못 멈추는 햄스터",
    appearance: "hamster_wheel.png",
    level: 1,
    story: "쳇바퀴를 한번 돌기 시작하면 멈출 수가 없어요. 말차에 레몬을 넣으면 정신이 맑아진다던데, 한 잔 부탁드려요.",
    required_leaf: 9, // 9: 절제-말차
    required_fruit: 9, // 9: 절제-레몬
    perfect_match_dialogue: "머릿속이 상쾌해졌어요. 오늘은 열 바퀴만 돌고, 해바라기씨를 먹으며 쉴래요."
  },
  {
    id: "guest_012",
    name: "약속을 깜빡한 아기 여우",
    appearance: "fox_promise.png",
    level: 1,
    story: "친구랑 한 약속을 깜빡하고 지키지 못했어요. 우롱차에 청포도를 넣은 차를 마시고 다시 믿음직한 친구가 되고 싶어요.",
    required_leaf: 7, // 7: 충성-우롱차
    required_fruit: 6, // 6: 양선-청포도
    perfect_match_dialogue: "마음이 단단해졌어요. 내일 친구에게 먼저 사과하고, 이번 약속은 꼭 지킬게요."
  },
  {
    id: "guest_013",
    name: "결과를 기다리는 부엉이",
    appearance: "owl_exam.png",
    level: 1,
    story: "밤새 공부한 시험의 결과가 다음 주에 나와요. 보이차에 석류를 넣어 주시면 끝까지 의젓하게 기다릴 수 있을 것 같아요.",
    required_leaf: 4, // 4: 오래 참음-보이차
    required_fruit: 7, // 7: 충성-석류
    perfect_match_dialogue: "깊고 단단한 맛이에요. 결과가 어떻든, 밤마다 애쓴 제가 자랑스러워요."
  },
  {
    id: "guest_014",
    name: "혼자 잠드는 아기 생쥐",
    appearance: "mouse_alone.png",
    level: 1,
    story: "엄마가 밤늦게까지 일하셔서 혼자 잠들어요. 홍차에 배를 넣어 주시면 엄마 품처럼 따뜻할 것 같아요.",
    required_leaf: 1, // 1: 사랑-홍차
    required_fruit: 8, // 8: 온유-배
    perfect_match_dialogue: "엄마 품처럼 따뜻하고 순한 맛이에요. 엄마가 오실 때까지 씩씩하게 기다릴게요."
  },

  // ── ★★ 보통 (10명): 재료 칸 아래의 열매 이름이 사연에 나와요 (먼저 나온 마음이 찻잎) ──
  {
    id: "guest_003",
    name: "싹을 기다리는 다람쥐",
    appearance: "squirrel_waiting.png",
    level: 2, // 보통: "오래 참고" → 오래 참음
    story: "봄에 심은 도토리가 아직도 싹을 틔우지 않았어요. 오래 참고 기다렸는데… 제 기다림이 다 헛수고였던 걸까요?",
    required_leaf: 4, // 4: 오래 참음-보이차
    required_fruit: 4, // 4: 오래 참음-대추
    perfect_match_dialogue: "오랜 시간 숙성된 만큼 깊은 맛이 나네요. 제 도토리도 땅속에서 천천히, 단단하게 자라고 있는 거겠죠? 조금 더 기다려 볼게요."
  },
  {
    id: "guest_005",
    name: "야식을 못 끊는 너구리",
    appearance: "raccoon_snack.png",
    level: 2, // 보통: "절제" → 찻잎, "오래 참는" → 과일 (먼저 나온 마음이 찻잎)
    story: "밤마다 야식을 참으려 해도 절제가 안 돼요. 오래 참는 게 왜 이렇게 어려울까요?",
    required_leaf: 9, // 9: 절제-말차
    required_fruit: 4, // 4: 오래 참음-대추
    perfect_match_dialogue: "쌉싸름하고 달큰해서 야식 생각이 사라졌어요. 오늘부터 천천히, 조금씩 참아 볼게요."
  },
  {
    id: "guest_015",
    name: "쉬지 못하는 비버",
    appearance: "beaver_dam.png",
    level: 2, // "절제" → 찻잎, "희락" → 과일
    story: "댐 쌓는 일을 멈추면 불안해서 밤낮없이 나무를 갉아요. 절제가 필요하다는 건 알지만… 마지막으로 희락을 느껴 본 게 언제인지 모르겠어요.",
    required_leaf: 9, // 9: 절제-말차
    required_fruit: 2, // 2: 희락-오렌지
    perfect_match_dialogue: "쉬어도 괜찮다고 말해 주는 맛이에요. 오늘은 일을 내려놓고 강물에 둥둥 떠서 놀아 볼래요."
  },
  {
    id: "guest_016",
    name: "비밀을 들킨 앵무새",
    appearance: "parrot_secret.png",
    level: 2, // "충성" → 찻잎, "자비" → 과일
    story: "충성을 다해 지켜 준 제 비밀을, 믿었던 친구가 숲 전체에 퍼뜨렸어요. 화가 나지만 자비로운 마음까지 잃고 싶지는 않아요.",
    required_leaf: 7, // 7: 충성-우롱차
    required_fruit: 5, // 5: 자비-무화과
    perfect_match_dialogue: "흔들리던 마음이 제자리를 찾았어요. 친구를 용서할 준비가 되면, 제가 먼저 말을 걸어 볼게요."
  },
  {
    id: "guest_017",
    name: "짐을 도맡은 코끼리",
    appearance: "elephant_burden.png",
    level: 2, // "양선" → 찻잎, "온유" → 과일
    story: "양선을 지키며 살았는데 다들 제 커다란 등에 짐만 올려요. 이러다 온유한 마음까지 잃을까 봐 걱정이에요.",
    required_leaf: 6, // 6: 양선-녹차
    required_fruit: 8, // 8: 온유-배
    perfect_match_dialogue: "맑고 순한 맛이에요. 착한 마음은 지키되, 무거운 짐은 이제 함께 나눠 들자고 말해 볼게요."
  },
  {
    id: "guest_018",
    name: "거울이 싫은 개구리",
    appearance: "frog_mirror.png",
    level: 2, // "사랑" → 찻잎, "화평" → 과일
    story: "울퉁불퉁한 피부를 볼 때마다 제가 싫어져요. 저도 사랑받을 수 있을까요? 마음에 화평이 찾아왔으면 좋겠어요.",
    required_leaf: 1, // 1: 사랑-홍차
    required_fruit: 3, // 3: 화평-복숭아
    perfect_match_dialogue: "있는 그대로의 제가 조금 좋아졌어요. 오늘은 연못에 비친 저에게 웃어 줄래요."
  },
  {
    id: "guest_019",
    name: "욱하는 아기 호랑이",
    appearance: "tiger_temper.png",
    level: 2, // "온유" → 찻잎, "오래 참는" → 과일
    story: "친구들이 놀리면 저도 모르게 으르렁거려요. 온유한 호랑이가 되고 싶은데… 오래 참는 게 왜 이렇게 어려울까요?",
    required_leaf: 8, // 8: 온유-호지차
    required_fruit: 4, // 4: 오래 참음-대추
    perfect_match_dialogue: "으르렁 대신 그르릉 소리가 나요. 화가 날 땐 숨을 세 번 쉬고 말해 볼게요."
  },
  {
    id: "guest_020",
    name: "친구와 헤어지는 수달",
    appearance: "otter_farewell.png",
    level: 2, // "자비" → 찻잎, "사랑" → 과일
    story: "제일 친한 친구가 멀리 이사를 가요. 서운해서 모진 말을 해 버렸어요. 친구에게 자비를 구하고, 사랑한다고 말하고 싶어요.",
    required_leaf: 5, // 5: 자비-루이보스
    required_fruit: 1, // 1: 사랑-딸기
    perfect_match_dialogue: "마음이 포근해졌어요. 지금 바로 편지를 쓰러 갈래요. 멀리 가도 우리는 단짝이니까요."
  },
  {
    id: "guest_021",
    name: "무대가 무서운 참새",
    appearance: "sparrow_choir.png",
    level: 2, // "희락" → 찻잎, "충성" → 과일
    story: "숲속 합창단에서 노래하는 게 제 희락이었는데, 요즘은 무대가 무섭기만 해요. 그래도 단원들에게 충성을 다하고 싶어요.",
    required_leaf: 2, // 2: 희락-백차
    required_fruit: 7, // 7: 충성-석류
    perfect_match_dialogue: "목이 다시 환하게 열렸어요. 이번 공연에서는 친구들 소리를 들으며 즐겁게 노래할게요."
  },
  {
    id: "guest_022",
    name: "고맙단 말을 못 들은 원숭이",
    appearance: "monkey_helper.png",
    level: 2, // "자비" → 찻잎, "양선" → 과일
    story: "자비를 베풀어 친구 숙제를 도와줬는데 고맙다는 말 한마디가 없어요. 양선을 베풀면 손해만 보는 걸까요?",
    required_leaf: 5, // 5: 자비-루이보스
    required_fruit: 6, // 6: 양선-청포도
    perfect_match_dialogue: "따뜻하고 개운해요. 고맙다는 말이 없어도, 누군가를 도운 제 마음은 그대로 귀한 거네요."
  },

  // ── ★★★ 어려움 (10명): 이름은 나오지 않아요. 가장 짙은 마음은 찻잎, 그다음 마음은 과일 ──
  {
    id: "guest_001",
    name: "지친 직장인 곰",
    appearance: "bear_tired.png",
    level: 3, // 어려움: 비교하다 뾰족해진 마음(온유) + 스스로 초라해 보이는 마음(사랑)
    story: "요즘 자꾸 남과 비교하게 되어서 마음이 뾰족해져요. 그러다 보면 제가 한없이 초라하게 느껴지고요.",
    required_leaf: 8, // 8: 온유-호지차
    required_fruit: 1, // 1: 사랑-딸기
    perfect_match_dialogue: "마치 누군가 저를 있는 그대로 안아 주는 기분이에요. 뾰족했던 마음이 둥글어지네요."
  },
  {
    id: "guest_006",
    name: "거절을 못 하는 토끼",
    appearance: "rabbit_kind.png",
    level: 3, // 어려움: 착하게 살수록 손해 보는 마음(양선) + 웃음을 잃은 마음(희락)
    story: "부탁을 거절 못 해서 늘 남의 몫까지 떠맡아요. 착하게 살면 손해만 보는 것 같고… 요즘은 웃은 기억도 잘 안 나요.",
    required_leaf: 6, // 6: 양선-녹차
    required_fruit: 2, // 2: 희락-오렌지
    perfect_match_dialogue: "오랜만에 웃음이 나요. 착한 마음은 그대로 두고, 내일은 '아니요'라고 말하는 연습도 해 볼게요."
  },
  {
    id: "guest_023",
    name: "단짝이 그리운 판다",
    appearance: "panda_bestfriend.png",
    level: 3, // 필요 없는 존재 같은 마음(사랑) + 튀어나오는 뾰족한 말(온유)
    story: "단짝이 요즘 새 친구랑만 다녀요. 저는 이제 필요 없는 걸까요… 서운한 마음에 괜히 뾰족한 말만 튀어나와요.",
    required_leaf: 1, // 1: 사랑-홍차
    required_fruit: 8, // 8: 온유-배
    perfect_match_dialogue: "포근하고 순한 맛이에요. 내일은 단짝에게 '보고 싶었어'라고 먼저 말해 볼게요."
  },
  {
    id: "guest_024",
    name: "작심삼일 물개",
    appearance: "seal_resolution.png",
    level: 3, // 사흘을 못 가는 다짐(충성) + 멈추지 못하는 군것질(절제)
    story: "새해마다 운동하겠다고 다짐하는데 사흘을 못 가요. 오늘도 소파에 누워 생선 과자 봉지를 끝까지 비웠어요.",
    required_leaf: 7, // 7: 충성-우롱차
    required_fruit: 9, // 9: 절제-레몬
    perfect_match_dialogue: "단단하고 산뜻한 맛이에요. 거창한 다짐 말고, 내일 아침 한 바퀴 헤엄치기부터 해 볼게요."
  },
  {
    id: "guest_025",
    name: "모임을 지키는 오소리",
    appearance: "badger_keeper.png",
    level: 3, // 처음 한 다짐을 저버리기 싫은 마음(충성) + 당연하게 여겨지는 선의(양선)
    story: "십 년째 마을 모임의 살림을 맡고 있어요. 그만두고 싶다가도 처음 한 다짐을 저버리는 것 같아서요. 다들 당연한 줄만 알고요.",
    required_leaf: 7, // 7: 충성-우롱차
    required_fruit: 6, // 6: 양선-청포도
    perfect_match_dialogue: "변함없는 마음도, 선한 마음도 알아준 맛이에요. 이번 모임에서는 도와 달라고 솔직하게 말해 볼게요."
  },
  {
    id: "guest_026",
    name: "가족에게 지친 기린",
    appearance: "giraffe_family.png",
    level: 3, // 차가운 말에 얼어붙은 마음(자비) + 그래도 계속 베풀어야 하는 마음(양선)
    story: "가족들에게 차가운 말을 듣고 하루 종일 마음이 얼어 있었어요. 그런데도 내일 아침이면 또 제가 높은 가지의 열매를 따다 줘야 해요.",
    required_leaf: 5, // 5: 자비-루이보스
    required_fruit: 6, // 6: 양선-청포도
    perfect_match_dialogue: "꽁꽁 언 마음이 녹고, 제가 하는 일이 귀하게 느껴져요. 오늘은 저에게도 열매 하나를 남겨 둘래요."
  },
  {
    id: "guest_027",
    name: "장바구니를 못 닫는 코알라",
    appearance: "koala_cart.png",
    level: 3, // 차가운 말에 얼어붙은 마음(자비) + 멈추지 못하는 쇼핑(절제)
    story: "회사에서 차가운 말을 들은 날이면 마음이 꽁꽁 얼어요. 그 말을 잊으려고 밤새 쇼핑 앱만 들여다보게 되고요.",
    required_leaf: 5, // 5: 자비-루이보스
    required_fruit: 9, // 9: 절제-레몬
    perfect_match_dialogue: "포근하게 안기는 맛이에요. 오늘은 장바구니 대신 베개를 꼭 안고 일찍 잘래요."
  },
  {
    id: "guest_028",
    name: "붓을 놓은 레서판다",
    appearance: "redpanda_brush.png",
    level: 3, // 뭘 해도 재미없는 마음(희락) + 매번 흐지부지되는 다짐(충성)
    story: "요즘은 뭘 해도 재미가 없어요. 좋아하던 그림도 다시 시작하겠다고 몇 번이나 다짐했지만 매번 흐지부지되고요.",
    required_leaf: 2, // 2: 희락-백차
    required_fruit: 7, // 7: 충성-석류
    perfect_match_dialogue: "마음이 환해졌어요. 오늘은 딱 한 장만, 제일 좋아하던 노을을 그려 볼게요."
  },
  {
    id: "guest_029",
    name: "다투는 소리에 깬 아기 사슴",
    appearance: "fawn_quarrel.png",
    level: 3, // 다투는 소리에 잠 못 드는 불안(화평) + 차가워진 말투에 얼어붙은 마음(자비)
    story: "엄마 아빠가 다투는 소리에 잠이 안 와요. 요즘은 저한테도 말투가 차가워서 마음이 꽁꽁 얼었어요.",
    required_leaf: 3, // 3: 화평-캐모마일
    required_fruit: 5, // 5: 자비-무화과
    perfect_match_dialogue: "조용하고 포근한 맛이에요. 내일은 엄마 아빠에게 꼭 안아 달라고 말해 볼래요."
  },
  {
    id: "guest_030",
    name: "퉁명스러워진 늑대",
    appearance: "wolf_gruff.png",
    level: 3, // 착하면 만만해 보이는 서러움(양선) + 일부러 퉁명스러운 말투(온유)
    story: "착하게 굴면 만만하게 보는 것 같아서, 요즘은 일부러 퉁명스럽게 굴어요. 그런데 그런 제가 더 싫어요.",
    required_leaf: 6, // 6: 양선-녹차
    required_fruit: 8, // 8: 온유-배
    perfect_match_dialogue: "맑고 순한 맛이 나요. 친절한 늑대여도 괜찮다는 걸 다시 믿어 볼게요."
  }
];

// 내어 드린 차가 꼭 맞지 않았을 때 손님이 하는 말 (경우마다 그중 하나가 무작위로 골라집니다)
// {leaf} 는 내어 드린 찻잎, {fruit} 는 내어 드린 과일 이름으로 바뀝니다.
// 맞힌 쪽은 그대로 두고, 아쉬운 쪽만 다시 고르게 됩니다.
export const MISS_DIALOGUES = {
  // 찻잎은 맞았는데 과일이 아쉬울 때
  leafOnly: [
    "{leaf} 향은 참 좋아요. 그런데 {fruit}{은/는} 지금 제 마음과 조금 다른 것 같아요.",
    "{leaf} 향을 맡으니 마음이 조금 풀려요. 다만 {fruit} 맛이 살짝 아쉬워요.",
    "찻잎은 꼭 맞아요! 과일이 {fruit}{이/가} 아니라면 더 좋을 것 같아요."
  ],
  // 과일은 맞았는데 찻잎이 아쉬울 때
  fruitOnly: [
    "{fruit}{은/는} 정말 반가운 맛이에요. 그런데 {leaf} 향이 조금 아쉬워요.",
    "{fruit} 맛이 마음에 꼭 와닿아요. 다만 찻잎은 {leaf}{이/가} 아닌 것 같아요.",
    "과일은 꼭 맞아요! 찻잎만 다른 걸로 바꿔 주시면 좋겠어요."
  ],
  // 찻잎과 과일이 서로 자리가 바뀌었을 때 (예: 정답은 홍차+배인데, 호지차+딸기를 드렸을 때)
  swapped: [
    "{leaf}{과/와} {fruit}… 둘 다 제 마음에 닿는 맛이에요. 그런데 찻잎과 과일의 자리가 바뀐 것 같아요."
  ],
  // 찻잎도 과일도 아쉬울 때
  none: [
    "향긋하긴 하지만… 찻잎도 과일도 지금 제 마음을 달래기엔 조금 아쉬운 맛이에요.",
    "정성껏 우려 주셔서 고마워요. 그런데 찻잎도 과일도 제가 찾던 맛과는 조금 다르네요.",
    "따뜻한 차네요. 그런데 {leaf}도 {fruit}도 지금 제 마음과는 조금 다른 것 같아요.",
    "고마워요. 참 맛있는데… 찻잎도 과일도 지금 제 마음이 찾던 맛은 아닌 것 같아요."
  ]
};
