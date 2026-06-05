// 나를 키워줘 — 캐릭터/제시어 데이터
// 총 177개. 카테고리별: 똑똑이 23 · 인기쟁이 20 · 신비 24 · 그 외 22개씩
// (캐릭터 결정은 카테고리 합계 비교이므로 개수 차는 무방)

// 캐릭터 표시 정보
// color/color2 = 고유 파스텔 그라데이션, feature = 시그니처 장식(캐릭터 렌더링용)
export const CHARACTERS = {
  brain:   { name: "똑똑이",   concept: "지성",      tagline: "뇌가 섹시해",               color: "#8FB4F0", color2: "#6E94E0", feature: "glasses" },
  charm:   { name: "멋쟁이",   concept: "외모·매력", tagline: "눈을 뗄 수 없는 비주얼",     color: "#F58FB8", color2: "#EC6E9E", feature: "cool" },
  passion: { name: "불꽃이",   concept: "열정",      tagline: "열정! 식지 않는 에너자이저",  color: "#FF9069", color2: "#FB6E48", feature: "flame" },
  cute:    { name: "러블리",   concept: "귀여움",    tagline: "사랑받는게 일인 걸",         color: "#FFB0CB", color2: "#FF8FB3", feature: "heart" },
  fun:     { name: "인기쟁이", concept: "유머·유쾌", tagline: "어디든 빠지면 섭하지",       color: "#FFD36E", color2: "#FBBE3C", feature: "laugh" },
  warm:    { name: "포근이",   concept: "다정",      tagline: "곁에 있으면 마음이 놓여",     color: "#FFD9AC", color2: "#F8C088", feature: "warm" },
  talent:  { name: "재주꾼",   concept: "만능",      tagline: "못하는 걸 찾는 게 더 빨라",   color: "#A8DE8A", color2: "#84CB60", feature: "wand" },
  mystery: { name: "신비",     concept: "미스터리",  tagline: "알수록 더 궁금해",           color: "#B9A4F2", color2: "#9A85E8", feature: "mystic" },
};

// 카테고리 → 제시어 매핑 (집계 공정성을 위해 22개씩 균등)
export const WORDS_BY_CATEGORY = {
  brain: ["똑똑해","지적이야","논리적이야","꼼꼼해","계획적이야","분석을잘해","기억력좋아","현명해","똑부러져","판단력좋아","집중력좋아","효율적이야","공부잘해","박학다식","통찰력있어","문제해결사","전략가","차근차근해","정확해","깊이있어","핵심을잘짚어","설명을잘해","능력자"],
  charm: ["예뻐","멋있어","매력적이야","섹시해","스타일좋아","잘생겼어","패션센스좋아","비율좋아","눈빛이매력적","미소가예뻐","분위기미인","화려해","도도해","세련됐어","옷잘입어","피부좋아","모델같아","볼매","첫인상좋아","빛이나","자기관리잘해","향기로워"],
  passion: ["열정적이야","끈기있어","카리스마있어","도전적이야","리더십있어","추진력좋아","성실해","부지런해","노력파","야망있어","에너지넘쳐","열심히해","책임감강해","포기를몰라","주도적이야","목표지향적","활동적이야","패기있어","자신감넘쳐","승부욕강해","행동파","멋지게해내"],
  cute: ["귀여워","사랑스러워","청순해","순수해","애교많아","깜찍해","발랄해","해맑아","천진난만","보호본능자극","동안이야","작고소중해","미소가천사","토끼같아","강아지같아","애기같아","방긋방긋","말랑말랑","사랑둥이","귀염뽀짝","베이비페이스","포실포실"],
  fun: ["재미있어","허당이야","재치있어","유쾌해","웃겨","분위기메이커","드립을잘쳐","텐션높아","장난꾸러기","같이있으면즐거워","웃음많아","위트있어","예측불가","반전매력","능청스러워","핵잼이야","리액션좋아","흥부자","깐족깐족","개그욕심"],
  warm: ["친절해","다정해","차분해","배려심깊어","잘들어줘","따뜻해","착해","포근해","정이많아","공감을잘해","챙겨줘","편안해","인내심많아","마음이넓어","위로를잘해","든든해","믿음직해","헌신적이야","다정다감","항상웃어줘","곁에있고싶어","안정감있어"],
  talent: ["요리왕","노래잘해","다재다능","손재주좋아","못하는게없어","그림잘그려","춤잘춰","운동신경좋아","글잘써","만들기왕","금손이야","재능부자","뭐든잘해","게임잘해","악기다뤄","사진잘찍어","정리의달인","척척박사","멀티플레이어","센스만점","일잘러","손이빨라"],
  mystery: ["신비로워","독특해","분위기있어","알수없어","신비주의","개성있어","미스터리해","속을모르겠어","비밀스러워","특별해","아우라있어","무드있어","예술가같아","자유로운영혼","고독해보여","깊은눈빛","남들과달라","시크해","묘한매력","한끗다름","범접불가","엉뚱해","4차원","조용한"],
};

// 제시어 → 카테고리 역매핑 (집계용)
export const WORD_TO_CATEGORY = Object.entries(WORDS_BY_CATEGORY).reduce(
  (acc, [code, words]) => {
    words.forEach((w) => { acc[w] = code; });
    return acc;
  },
  {}
);

// 전체 제시어 평면 리스트 (칩 렌더링용)
export const ALL_WORDS = Object.values(WORDS_BY_CATEGORY).flat();

// 한 명이 골라야 하는 제시어 개수
export const PICK_COUNT = 7;

// 지인 화면 칩: 카테고리당 perChar개씩 무작위 → 전체를 섞어 노출 (8종 모두 등장 보장)
export function pickChips(perChar = 5) {
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  let out = [];
  for (const code in WORDS_BY_CATEGORY) {
    out = out.concat(shuffle(WORDS_BY_CATEGORY[code]).slice(0, perChar));
  }
  return shuffle(out);
}

// 선택된 제시어 배열로 1위 카테고리(캐릭터 코드) 결정
// 동점이면 먼저 채워진(=배열 앞쪽) 순서 우선이 필요하면 호출부에서 타임스탬프 처리
export function decideCharacter(selectedWordsList) {
  const counts = {};
  selectedWordsList.forEach((w) => {
    const code = WORD_TO_CATEGORY[w];
    if (code) counts[code] = (counts[code] || 0) + 1;
  });
  let best = null;
  let bestCount = -1;
  for (const [code, c] of Object.entries(counts)) {
    if (c > bestCount) { best = code; bestCount = c; }
  }
  return best; // 캐릭터 코드 또는 null
}

// 먹이(feedback) 수로 성장 단계(레벨) 결정
// Lv.0=알(0회) · Lv.1=새싹(1회) · Lv.2(2회) · Lv.3=완성(3회+)
export function decideStage(feedbackCount) {
  return Math.min(Math.max(feedbackCount, 0), 3);
}
