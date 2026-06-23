// 결과 화면: 심리검사 분석 스타일 (MBTI 느낌의 친구 분석 결과)
import { navigate, applyTheme } from "../main.js";
import { db } from "../lib/db.js";
import { decideStage, decideCharacter, CHARACTERS, WORD_TO_CATEGORY } from "../data/words.js";
import { renderCharacter } from "../components/character.js";
import { openShareSheet } from "../lib/share.js";
import html2canvas from "html2canvas";

// 진입점(시청자가 "나도 해볼래"로 들어올 주소) — 호스팅 도메인
const ENTRY_URL = "grow-me-omega.vercel.app";

// 결과 카드(#insta-card)를 폰트·CSS 그대로 PNG로 저장한다.
// html2canvas는 이미 로드된 웹폰트(Jua/Pretendard)를 canvas에 직접 그려서
// 별도 폰트 임베드 없이도 폰트가 깨지지 않는다(임베드 방식의 수십 MB 비대화도 없음).
async function saveCardImage(card, nick) {
  // 웹폰트가 완전히 로드된 뒤 캡처해야 첫 시도부터 폰트가 제대로 그려진다.
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch {}
  }

  // 카드가 실제로 칠해진 배경색을 그대로 입혀 투명/잘림 방지.
  const bg = getComputedStyle(card).backgroundColor;

  const canvas = await html2canvas(card, {
    scale: 3,                 // 고해상도(레티나/인스타 업로드용)
    useCORS: true,            // 외부 리소스(있을 경우) CORS 허용
    backgroundColor: bg && bg !== "rgba(0, 0, 0, 0)" ? bg : "#ffffff",
    logging: false,
  });

  const dataUrl = canvas.toDataURL("image/png");
  const safeNick = (nick || "결과").replace(/[\\/:*?"<>|]/g, "");
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `나를키워줘_${safeNick}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  return dataUrl;
}

// 캐릭터별 성격 분석 텍스트
// desc: 줄바꿈(\n)으로 문단 구분 / hidden: "이런 타입은 " 다음에 붙는 보조 문장
const ANALYSIS = {
  brain: {
    headline: "논리적이고 똑부러지는 지성미를 갖췄어요.",
    desc: "친구들이 떠올리며 고른 단어엔 '지적인' 면이 가장 많았어요.\n논리적이고 깊이 있게 생각하는 모습, 꼼꼼하게 분석하고 핵심을 짚어내는 판단력. 그게 친구들 눈에 비친 가장 큰 매력이에요.",
    hidden: "냉철해 보여도 속은 의외로 따뜻한 경우가 많아요.",
    emoji: "🧠",
  },
  charm: {
    headline: "눈을 뗄 수 없는 남다른 비주얼의 소유자예요.",
    desc: "친구들이 떠올릴 때 가장 많이 고른 건 '매력적인' 비주얼과 스타일이에요.\n자기만의 분위기, 시선을 끄는 존재감, 거기에 자기관리에서 오는 자신감까지. 친구들 눈엔 그냥 지나치기 어려운 사람이에요.",
    hidden: "화려해 보여도 주변을 세심하게 챙기는 면이 숨어 있곤 해요.",
    emoji: "✨",
  },
  passion: {
    headline: "넘치는 열정과 추진력의 소유자예요.",
    desc: "친구들이 고른 단어 중 가장 많았던 건 '열정적인' 모습이에요.\n한 번 정한 목표는 놓지 않는 끈기, 넘치는 에너지와 추진력. 함께 있으면 나도 뭔가 해내고 싶게 만드는 카리스마가 친구들 눈에 들어왔어요.",
    hidden: "강해 보여도 의외로 주변을 잘 챙기는 다정함을 품고 있어요.",
    emoji: "🔥",
  },
  cute: {
    headline: "주변을 녹이는 사랑스러움의 결정체예요.",
    desc: "친구들이 떠올리며 가장 많이 고른 건 '사랑스러운' 모습이에요.\n순수하고 발랄한 에너지, 보고 있으면 저도 모르게 웃게 되는 분위기. 친구들 눈엔 곁에 두고 싶은 사랑둥이로 비쳤어요.",
    hidden: "귀엽기만 한 것 같아도 속은 의외로 단단하고 생각이 깊은 경우가 많아요.",
    emoji: "🎀",
  },
  fun: {
    headline: "자리를 빛내는 타고난 분위기 메이커예요.",
    desc: "친구들이 고른 단어엔 '유쾌한' 면이 가장 많았어요.\n어떤 자리든 살아나게 만드는 분위기, 함께 있으면 시간 가는 줄 모르는 텐션. 친구들 눈엔 모임의 공기를 바꾸는 사람이에요.",
    hidden: "밝아 보여도 의외로 주변 눈치를 세심하게 살피는 면이 있어요.",
    emoji: "🎉",
  },
  warm: {
    headline: "같이 있으면 안정감 있고 따뜻한 존재예요.",
    desc: "친구들이 떠올리며 가장 많이 고른 건 '다정한' 모습이에요.\n말 안 해도 알아주는 공감, 먼저 손 내미는 따뜻함. 친구들 눈엔 곁에 있으면 마음이 놓이는 사람으로 비쳤어요.",
    hidden: "다정하면서도 자기만의 확고한 생각을 가진 단단함을 함께 지니곤 해요.",
    emoji: "🤗",
  },
  talent: {
    headline: "무엇이든 잘하는 다재다능한 능력자예요.",
    desc: "친구들이 고른 단어 중 가장 많았던 건 '재주 많은' 면이에요.\n뭘 시켜도 해내는 손재주와 다재다능함. 여러 분야에서 빛을 발하는 모습이 친구들 눈에 들어왔어요.",
    hidden: "재능이 많은 만큼, 어디에 집중할지 즐거운 고민을 안고 살기도 해요.",
    emoji: "🌟",
  },
  mystery: {
    headline: "알수록 더 알고 싶은 신비주의자예요.",
    desc: "친구들이 떠올리며 가장 많이 고른 건 '신비로운' 분위기예요.\n쉽게 읽히지 않는 개성, 남들과 다른 시선. 알수록 더 궁금해지는 묘한 매력이 친구들 눈에 비쳤어요.",
    hidden: "차가워 보여도 가까운 사람에겐 깊은 애정을 보이는 경우가 많아요.",
    emoji: "🔮",
  },
};

const CAT_EMOJI = {
  brain: "🧠", charm: "✨", passion: "🔥",
  cute: "🎀", fun: "🎉", warm: "🤗",
  talent: "🌟", mystery: "🔮",
};

// 반전 매력 섹션에서 쓰는 캐릭터별 "매력 축"(명사)
const AXIS = {
  brain: "지성", charm: "비주얼", passion: "열정", cute: "사랑스러움",
  fun: "유쾌함", warm: "다정함", talent: "재능", mystery: "신비로움",
};

// 성격 종합 분석용 캐릭터별 조각 (여러 카테고리를 엮어 한 사람의 성격으로 합성)
// adj=성격을 설명하는 수식어구 / charm=매력 포인트(명사구) / seen=친구들 눈에 비치는 모습(명사구)
const TRAITS = {
  brain:   { adj: "논리적이고 깊이 있게 사고하는",       charm: "핵심을 꿰뚫는 통찰력과 똑부러지는 판단력",       seen: "무엇이든 믿고 물어보고 싶은 똑똑한 사람" },
  charm:   { adj: "자기만의 분위기와 스타일이 뚜렷한",   charm: "시선을 사로잡는 존재감과 자기관리에서 나오는 자신감", seen: "곁에 있으면 괜히 신경 쓰이는 매력적인 사람" },
  passion: { adj: "목표를 향해 거침없이 나아가는",       charm: "한번 마음먹으면 끝까지 해내는 추진력과 에너지",   seen: "함께 있으면 나도 무언가 해내고 싶어지는 사람" },
  cute:    { adj: "순수하고 발랄한 에너지를 가진",       charm: "보고만 있어도 미소 짓게 만드는 사랑스러움",       seen: "자꾸만 챙겨주고 곁에 두고 싶은 사람" },
  fun:     { adj: "어떤 자리든 즐겁게 만드는",           charm: "분위기를 살리는 유쾌함과 센스 있는 입담",         seen: "함께 있으면 시간 가는 줄 모르는 사람" },
  warm:    { adj: "따뜻하고 배려심이 깊은",             charm: "말없이 곁을 지켜주는 다정함과 든든한 공감 능력",   seen: "마음이 힘들 때 가장 먼저 떠오르는 사람" },
  talent:  { adj: "무엇이든 곧잘 해내는",               charm: "다재다능함과 손에 잡히는 건 다 해내는 재주",     seen: "뭐든 부탁하고 싶은 든든한 만능 재주꾼" },
  mystery: { adj: "쉽게 읽히지 않는 개성을 가진",       charm: "알수록 더 궁금해지는 묘한 분위기와 독특한 시선",   seen: "더 알고 싶어지는 신비로운 사람" },
};

// 종합 성격 분석 합성: 상위 카테고리들과 키워드를 엮어 심리검사 결과처럼 문단을 만든다.
// 1·2(·3)위 카테고리를 조합해 "어떤 성격인지 / 친구들에게 어떻게 비치는지 / 어떤 매력이 있는지"를 서술.
function buildComprehensive({ catRanking, nick }) {
  const ranked = catRanking.filter((c) => c.count > 0 && TRAITS[c.code]);
  if (ranked.length === 0) return null;
  const c1 = ranked[0], c2 = ranked[1], c3 = ranked[2];
  const t1 = TRAITS[c1.code], t2 = c2 ? TRAITS[c2.code] : null, t3 = c3 ? TRAITS[c3.code] : null;

  // ① 종합 성격
  let p1 = `${nick}님을 떠올리며 친구들이 골라준 단어를 모아보니, <b>${t1.adj}</b> 모습이 가장 진하게 드러났어요.`;
  if (t2) {
    p1 += ` 여기에 <b>${t2.adj}</b> 면이 더해지고`;
    p1 += t3
      ? `, ${t3.adj} 결까지 은근히 비치면서 한 가지로 단정할 수 없는 입체적인 사람으로 그려져요.`
      : ` 한 가지로만 설명하기 어려운 입체적인 사람으로 그려져요.`;
  } else {
    p1 += ` 그 한 가지 색이 누구보다 선명하게 드러나는 사람이에요.`;
  }

  // ② 친구들에게 어떻게 비치는지
  let p2 = `친구들 눈에 ${nick}님은 <b>${t1.seen}</b>이에요.`;
  if (t2) p2 += ` 동시에 ${t2.seen}이기도 하죠. 상황에 따라 다른 매력이 자연스럽게 나오는 게 ${nick}님의 강점이에요.`;

  // ③ 매력 포인트
  let p3 = `${nick}님만의 가장 큰 매력은 <b>${t1.charm}</b>이에요.`;
  if (t2) p3 += ` 그리고 ${t2.charm}까지 — 친구들은 바로 이런 면에 끌렸다고 말하고 있어요.`;

  return { paras: [p1, p2, p3] };
}

// 캐릭터별 궁합 — match: 환상의 짝꿍 / clash: 티키타카(티격태격 케미)
// ※ 문구는 임시 카피, 검수 후 다듬을 것
const COMPAT = {
  brain:   { match: "warm",    clash: "fun",     matchWhy: "차분히 받쳐주는 포근함이 딱이에요.",   clashWhy: "진지함과 장난기가 의외로 잘 굴러가요." },
  charm:   { match: "talent",  clash: "mystery", matchWhy: "둘이 모이면 시선을 독차지해요.",        clashWhy: "감출수록 더 끌리는 묘한 케미예요." },
  passion: { match: "cute",    clash: "warm",    matchWhy: "추진력에 사랑스러움이 더해져요.",       clashWhy: "속도는 달라도 서로를 채워줘요." },
  cute:    { match: "passion", clash: "mystery", matchWhy: "든든하게 지켜주는 짝꿍이에요.",         clashWhy: "정반대라 더 궁금해지는 사이예요." },
  fun:     { match: "warm",    clash: "brain",   matchWhy: "텐션을 편하게 받아줘요.",              clashWhy: "유쾌함과 똑부러짐이 티격태격 재밌어요." },
  warm:    { match: "brain",   clash: "passion", matchWhy: "다정함을 깊이 알아봐 줘요.",           clashWhy: "잔잔함과 불꽃이 묘하게 통해요." },
  talent:  { match: "charm",   clash: "mystery", matchWhy: "재능과 매력이 만나 빛이 나요.",         clashWhy: "예측불가라 같이 있으면 안 질려요." },
  mystery: { match: "cute",    clash: "fun",     matchWhy: "신비로움을 사랑스럽게 녹여줘요.",       clashWhy: "정반대 텐션이 의외로 찰떡이에요." },
};

// 라인 아이콘 (spark=반짝 / heart=하트). stroke 색은 CSS 변수 문자열 허용 위해 style로 지정.
function symIcon(name, color, size = 19) {
  const paths = {
    spark: `<path d="M10 3.6 C10.5 8.4 11.6 9.5 16.4 10 C11.6 10.5 10.5 11.6 10 16.4 C9.5 11.6 8.4 10.5 3.6 10 C8.4 9.5 9.5 8.4 10 3.6 Z"/><path d="M18 4 C18.2 5.7 18.3 5.8 20 6 C18.3 6.2 18.2 6.3 18 8 C17.8 6.3 17.7 6.2 16 6 C17.7 5.8 17.8 5.7 18 4 Z"/>`,
    heart: `<path d="M12 19.5 C12 19.5 4 14.2 4 8.8 C4 6.1 6.1 4.4 8.5 4.4 C10.1 4.4 11.4 5.4 12 6.6 C12.6 5.4 13.9 4.4 15.5 4.4 C17.9 4.4 20 6.1 20 8.8 C20 14.2 12 19.5 12 19.5 Z"/>`,
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="display:block;fill:none;stroke:${color};stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round">${paths[name] || ""}</svg>`;
}

// 섹션 카드 공통 래퍼 (sym=아이콘, accent=그라데이션 강조) — 우측 상단 번호 뱃지는 제거됨
function rSection({ sym, title, accent, body }) {
  return `
    <div class="rsec${accent ? " accent" : ""}">
      <div class="rsec-head">
        <span class="rsec-sym">${symIcon(sym, "var(--primary-dark)")}</span>
        <h3>${title}</h3>
      </div>
      ${body}
    </div>`;
}

// 잠금 래퍼: 비결제 시 내용을 블러 처리하고 가운데에 해제 CTA(.unlock-cta)를 띄운다.
// 모든 .unlock-cta는 같은 핸들러로 묶여, 하나만 눌러도 전체 잠금이 해제된다.
function lockWrap(inner, label = "잠금 해제 (990원)") {
  return `
    <div class="lock-wrap">
      <div class="lock-blur">${inner}</div>
      <button class="lock-overlay unlock-cta" type="button">
        <span class="lock-overlay-ic">🔒</span>
        <span class="lock-overlay-txt">${label}</span>
      </button>
    </div>`;
}

// 궁합 미니 카드 (best=환상의 짝꿍 / spark=티키타카)
function matchCard(kind, charCode, reason) {
  const c = CHARACTERS[charCode];
  if (!c) return "";
  const isBest = kind === "best";
  return `
    <div class="match-card${isBest ? " best" : ""}">
      <div class="match-kind">${isBest ? "💚 환상의 짝꿍" : "⚡ 티키타카"}</div>
      <div class="match-char">
        <div class="match-glow" style="background:radial-gradient(circle,${c.color}40,transparent 68%)"></div>
        <div style="position:relative">${renderCharacter(charCode, 3, 62, false)}</div>
      </div>
      <div class="match-name">${c.name}</div>
      <p class="match-why">${reason}</p>
    </div>`;
}

// 아바타용 하트 아이콘 — 연핑크 배경 위에 진핑크(테마색)로 채워 표시
const HEART_ICON = `<svg viewBox="0 0 24 24" width="15" height="15" fill="var(--primary)" style="display:block"><path d="M12 20.5 C12 20.5 3.5 14.8 3.5 9 C3.5 6.1 5.7 4.2 8.2 4.2 C10 4.2 11.4 5.3 12 6.6 C12.6 5.3 14 4.2 15.8 4.2 C18.3 4.2 20.5 6.1 20.5 9 C20.5 14.8 12 20.5 12 20.5 Z"/></svg>`;

// 잠금 리스트 한 줄: 아바타(하트 아이콘) + 이름 + 고른 단어 칩들
function fbRow(name, words) {
  const chips = words.map((w) => `<span class="fb-word">${w}</span>`).join("");
  return `
    <div class="row">
      <div class="fb-head">
        <span class="fb-avatar">${HEART_ICON}</span>
        <span class="fb-name">${name}</span>
      </div>
      <div class="fb-words">${chips}</div>
    </div>`;
}

function tally(words) {
  const map = {};
  words.forEach((w) => (map[w] = (map[w] || 0) + 1));
  return Object.entries(map)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);
}

function tallyByCategory(allWords) {
  const map = {};
  allWords.forEach((w) => {
    const cat = WORD_TO_CATEGORY[w];
    if (cat) map[cat] = (map[cat] || 0) + 1;
  });
  return Object.entries(map)
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count);
}

// 피드백 목록에서 결과 화면이 쓰는 모든 파생값을 한 번에 계산한다.
// 내 결과(renderResult)·공개 결과(renderSharedResult) 양쪽이 같은 모델을 공유한다.
function computeModel(feedbacks, nick) {
  const count = feedbacks.length;
  const stage = decideStage(count);
  const allWords = feedbacks.flatMap((f) => f.words);
  const code = decideCharacter(allWords);
  const wordRanking = tally(allWords);
  const catRanking = tallyByCategory(allWords);
  // 동점이어도 지정 캐릭터(code)가 항상 1위로 보이도록 맨 앞에 고정
  catRanking.sort((a, b) => {
    if (a.code === code) return -1;
    if (b.code === code) return 1;
    return b.count - a.count;
  });
  const totalVotes = allWords.length;
  const form = code ? CHARACTERS[code] : null;
  const analysis = code ? ANALYSIS[code] : null;
  const glowColor = form ? form.color : "#FF7FA3";
  const secondCat = catRanking.length >= 2 ? catRanking[1] : null;
  const secondForm = secondCat ? CHARACTERS[secondCat.code] : null;
  const secondAxis = secondCat ? AXIS[secondCat.code] : null;
  const compat = code ? COMPAT[code] : null;
  const maxCatCount = catRanking.length ? catRanking[0].count : 0;

  // 카테고리 바 HTML — 상위 3개는 무료, 4위 이하는 잠금 대상(공개 뷰에선 제외)
  const catRows = catRanking
    .filter((c) => c.count > 0)
    .map((c) => {
      const char = CHARACTERS[c.code];
      // 지정 캐릭터와 동점인 다른 카테고리는 퍼센트·바를 깎아 1위가 확실히 구분되게
      const tied = c.code !== code && c.count === maxCatCount;
      const rawPct = Math.round((c.count / totalVotes) * 100);
      const pct = tied ? Math.max(0, rawPct - 1) : rawPct;
      const barW = tied ? 94 : Math.round((c.count / maxCatCount) * 100);
      return `
        <div class="cat-row">
          <span class="cat-icon">${CAT_EMOJI[c.code]}</span>
          <span class="cat-name">${char.name}</span>
          <div class="cat-bar-wrap">
            <div class="cat-bar-fill" style="width:${barW}%;background:${char.color}"></div>
          </div>
          <span class="cat-pct">${pct}%</span>
        </div>`;
    });
  const catTop3Html = catRows.slice(0, 3).join("");
  const catRestHtml = catRows.slice(3).join("");

  // 키워드 칩 (상위 8개): 2명 이상이 고른 단어만 강조, 숫자 배지 앞 공백
  const kwHtml = wordRanking
    .slice(0, 8)
    .map((w) => `
      <span class="kw-chip${w.count >= 2 ? " kw-top" : ""}">
        ${w.word} <span class="kw-cnt">${w.count}</span>
      </span>`)
    .join("");

  const top3kw = wordRanking.slice(0, 3).map((w) => w.word);

  // 성격 종합 분석 (상위 카테고리 + 키워드 합성)
  const comprehensive = buildComprehensive({ catRanking, nick });

  // 저장 카드용 미니 성분표 (상위 3개 카테고리) — 1·2·3위 순위 뱃지로 표시
  const icBarsHtml = catRanking
    .filter((c) => c.count > 0)
    .slice(0, 3)
    .map((c, i) => {
      const char = CHARACTERS[c.code];
      const tied = c.code !== code && c.count === maxCatCount;
      const rawPct = Math.round((c.count / totalVotes) * 100);
      const pct = tied ? Math.max(0, rawPct - 1) : rawPct;
      const barW = tied ? 94 : Math.round((c.count / maxCatCount) * 100);
      return `
        <div class="ic-bar-row">
          <span class="ic-bar-rank rank-${i + 1}">${i + 1}위</span>
          <span class="ic-bar-name">${char.name}</span>
          <div class="ic-bar-track"><div class="ic-bar-fill" style="width:${barW}%;background:${char.color}"></div></div>
          <span class="ic-bar-pct">${pct}%</span>
        </div>`;
    })
    .join("");

  return {
    count, stage, code, form, analysis, glowColor, totalVotes,
    catRanking, secondCat, secondForm, secondAxis, compat,
    catTop3Html, catRestHtml, kwHtml, top3kw, icBarsHtml, comprehensive,
  };
}

// 자랑용 요약 카드(#insta-card) — 이미지 저장 대상이자 공유 미리보기. 양쪽 화면 공용.
function instaCardHtml(m, nick) {
  return `
      <div class="insta-card-outer">
        <div class="insta-card" id="insta-card">
          <div class="ic-dots-bg"></div>
          <div class="ic-inner">
            <div class="ic-subtitle">${m.count}명의 친구들이 키워준</div>
            <div class="ic-maintitle">${nick}님의 매력은?</div>

            <div style="position:relative;display:flex;justify-content:center;margin:4px 0 4px">
              <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:170px;height:170px;border-radius:50%;background:radial-gradient(circle,${m.glowColor}66,transparent 70%)"></div>
              <div class="grow-in" style="position:relative">${renderCharacter(m.code, m.stage, 160, false)}</div>
            </div>

            <div class="ic-name">${m.form ? m.form.name : "성장 중"}</div>
            ${m.form ? `<div class="ic-tagline">"${m.form.tagline}"</div>` : ""}
            ${m.analysis ? `<div class="ic-headline">${m.analysis.headline}</div>` : ""}

            <div class="ic-divider"></div>

            <div class="ic-keywords">
              ${m.top3kw.map((w) => `<span class="ic-kw">#${w}</span>`).join("")}
            </div>

            ${m.icBarsHtml ? `<div class="ic-mini-bars">${m.icBarsHtml}</div>` : ""}

            <div class="ic-footer">
              <span class="ic-brand">🌱 나를 키워줘</span>
              <span class="ic-url">${ENTRY_URL}</span>
            </div>
          </div>
        </div>
      </div>`;
}

// 결과 공유용 카카오 메시지 구성 (자랑 톤)
function resultShareKakao(m, nick) {
  const formName = m.form ? m.form.name : "성장 중인 캐릭터";
  return {
    title: `친구들이 본 ${nick}님은… "${formName}" 🌱`,
    description: m.analysis ? m.analysis.headline : `${nick}님이 친구들 눈에 어떻게 보이는지 확인해보세요!`,
    imageUrl: "https://grow-me-omega.vercel.app/feed-image.png",
    buttonTitle: "결과 보러가기",
  };
}

export async function renderResult(app) {
  const me = await db.ensureMyUser();
  if (!me) return navigate("/");

  const feedbacks = await db.getMyFeedbacks();
  const nick = me.nickname || "나";
  const m = computeModel(feedbacks, nick);
  const {
    count, stage, code, form, analysis, glowColor,
    secondCat, secondForm, secondAxis, compat,
    catTop3Html, catRestHtml, kwHtml, comprehensive,
  } = m;
  const unlocked = me.is_unlocked;

  if (count === 0) {
    app.innerHTML = `
      <div class="screen">
        <div class="top"><button class="back" id="back">←</button><h1>친구들이 보는 나의 모습</h1></div>
        <div class="center-screen">
          ${renderCharacter("cute", 1, 150)}
          <h2>아직 결과가 없어요</h2>
          <p class="muted">친구에게 링크를 공유해<br/>먹이를 받아보세요!</p>
        </div>
        <button class="btn" id="go">친구에게 공유하기</button>
      </div>`;
    app.querySelector("#back").onclick = () => navigate("/owner");
    app.querySelector("#go").onclick = () => navigate("/owner");
    return;
  }

  // 공유 링크: 친구가 결제 영역 없는 공개 결과 뷰로 들어온다
  const shareUrl = `${location.origin}${location.pathname}#/share/${me.share_slug}`;

  app.innerHTML = `
    <div class="screen result-screen">
      <div class="top">
        <button class="back" id="back">←</button>
        <h1>친구들이 보는 나의 모습</h1>
      </div>

      <!-- 요약 카드 (hero) — 첫 진입 시 전체 개요 + 이미지 저장 대상(카드 탭 시 저장) -->
      ${instaCardHtml(m, nick)}

      <!-- 캐릭터 분석 (결과 카드 바로 아래) — 1위 캐릭터의 성격 특성·매력·비춰지는 모습 -->
      ${analysis ? `
      <div class="analysis-section" style="margin-top:20px">
        <div class="section-label">🧬 캐릭터 분석</div>
        <div class="section-sub">${nick}님은 <b style="color:var(--primary)">${form.name}</b> 유형이에요. "${form.tagline}"</div>
        ${analysis.desc.split("\n").map((p) => `<p class="personality-desc">${p}</p>`).join("")}
        ${analysis.hidden ? `<p class="personality-hint">💡 이런 타입은 ${analysis.hidden}</p>` : ""}
      </div>` : ""}

      <div class="analysis-section">
        <div class="section-label">📊 나의 매력 성분표</div>
        <div class="cat-bars">${unlocked ? catTop3Html + catRestHtml : catTop3Html}</div>
        ${!unlocked && catRestHtml ? lockWrap(`<div class="cat-bars">${catRestHtml}</div>`) : ""}
      </div>

      <div class="analysis-section">
        <div class="section-label">💬 많이 고른 키워드</div>
        <div class="kw-list">${kwHtml}</div>
      </div>

      <!-- 종합 분석 (여러 키워드를 종합한 심리검사 스타일 리딩) — 반전 매력 카드 바로 위 -->
      ${comprehensive ? `
      <div class="analysis-section">
        <div class="section-label">🔍 ${nick}님 종합 분석</div>
        <div class="section-sub">친구들이 골라준 단어 전체를 종합해 ${nick}님의 성격을 읽어봤어요.</div>
        ${
          unlocked
            ? `<p class="personality-desc">${comprehensive.paras[0]}</p>
               ${comprehensive.paras.length > 1 ? `
                 <div class="more-wrap" id="comp-more">
                   <div class="more-inner">
                     ${comprehensive.paras.slice(1).map((p) => `<p class="personality-desc">${p}</p>`).join("")}
                   </div>
                 </div>
                 <button class="more-btn" id="comp-more-btn" aria-expanded="false">더보기 <span class="more-arrow">▾</span></button>
               ` : ""}`
            : lockWrap(comprehensive.paras.map((p) => `<p class="personality-desc">${p}</p>`).join(""))
        }
      </div>` : ""}

      <!-- ④ 반전 매력 (2위 캐릭터 기반) -->
      ${secondForm && secondAxis ? rSection({
        sym: "spark", title: "사실 이런 면도 숨어 있어요", accent: true,
        body: `
          <div class="flip-row">
            <div class="flip-char" style="background:radial-gradient(circle,${secondForm.color}40,transparent 68%)">
              ${renderCharacter(secondCat.code, 3, 78, false)}
            </div>
            <div style="flex:1">
              <div class="flip-title">숨은 매력, <span style="color:var(--primary)">${secondForm.name}</span></div>
              <p class="flip-desc">겉으론 ${form.name}이지만, 친구들은 ${nick}님에게서 <b style="color:var(--ink)">${secondAxis}</b>의 반전 매력도 느꼈대요. ${secondForm.tagline} 같은 면이 살짝 숨어 있어요.</p>
            </div>
          </div>`,
      }) : ""}

      <!-- ⑤ 궁합 -->
      ${compat ? rSection({
        sym: "heart", title: "나와 잘 맞는 유형은?", accent: true,
        body: `
          <div class="match-row">
            ${matchCard("best", compat.match, compat.matchWhy)}
            ${matchCard("spark", compat.clash, compat.clashWhy)}
          </div>`,
      }) : ""}

      <!-- ⑧ 잠금 섹션 — 중복 제거 -->
      <div class="lock-area" style="margin-top:10px">
        <div class="lock-title">👀 누가 어떤 말을 골랐을까?</div>
        <div class="lock-sub">${unlocked ? `친구 ${count}명이 골라준 단어를 모두 확인했어요` : "친구별로 어떤 단어를 골랐는지 확인해보세요"}</div>
        ${
          unlocked
            ? `<div class="lock-list">${feedbacks
                .map((f) => fbRow(f.name, f.words))
                .join("")}</div>`
            : `<div class="lock-list blur">${feedbacks
                .slice(0, 3)
                .map((f) => fbRow("●●●", f.words.slice(0, 4)))
                .join("")}</div>
               <button class="btn unlock-cta" type="button" style="margin-top:16px">🔒 잠금 해제 (990원)</button>`
        }
      </div>
    </div>

    <!-- 하단 sticky: 공유 메인 CTA (저장은 결과 카드 탭으로 처리) -->
    <div class="save-dock">
      <button class="btn" id="share-bottom">친구에게 공유하기 💌</button>
    </div>
  `;

  app.querySelector("#back").onclick = () => navigate("/owner");

  // 결과 공유: 하단 버튼이 공유 시트를 연다(공개 결과 뷰 링크)
  const openResultShare = () =>
    openShareSheet({
      sheetTitle: "친구에게 결과 공유하기",
      url: shareUrl,
      kakao: resultShareKakao(m, nick),
      onCopied: () => {
        const b = app.querySelector("#share-bottom");
        if (b) {
          b.textContent = "링크 복사 완료! 💌";
          setTimeout(() => (b.textContent = "친구에게 공유하기 💌"), 1800);
        }
      },
    });
  app.querySelector("#share-bottom").onclick = openResultShare;

  // 종합 분석 더보기: 첫 문단만 보이고, 누르면 나머지 문단을 펼친다
  const compMoreBtn = app.querySelector("#comp-more-btn");
  if (compMoreBtn) {
    const moreWrap = app.querySelector("#comp-more");
    compMoreBtn.onclick = () => {
      const open = moreWrap.classList.toggle("open");
      compMoreBtn.setAttribute("aria-expanded", String(open));
      compMoreBtn.innerHTML = open
        ? `접기 <span class="more-arrow">▴</span>`
        : `더보기 <span class="more-arrow">▾</span>`;
    };
  }

  // 결과 카드 탭 → 이미지로 저장.
  const card = app.querySelector("#insta-card");
  if (card) {
    let saving = false;
    card.classList.add("savable");
    card.onclick = async () => {
      if (saving) return;
      saving = true;
      try {
        await saveCardImage(card, nick);
      } catch (e) {
        console.error("[result] 카드 저장 실패", e);
        alert("이미지 저장에 실패했어요. 다시 시도해 주세요.");
      } finally {
        setTimeout(() => { saving = false; }, 1600);
      }
    };
  }

  // 오픈 이벤트: 결제 연동 전까지, 어떤 잠금 해제 버튼을 눌러도 무료로 전체를 공개한다.
  // (한 번 해제하면 is_unlocked=true 캐시 → 모든 잠금 섹션이 동시에 열린다)
  const unlockAll = async () => {
    alert("안심하세요! 당분간은 결제 없이 결과를 확인할 수 있어요. ");
    await db.setUnlocked(true);
    renderResult(app);
  };
  app.querySelectorAll(".unlock-cta").forEach((b) => (b.onclick = unlockAll));
}

// 공개 결과 뷰(비로그인): 친구가 공유 링크(#/share/:slug)로 들어와 결과를 본다.
// 결제(언락) 영역(4위 이하 순위·종합분석 후반부·반전 매력·누가 골랐는지)은 깔끔히 제외하고,
// 무료로 공개되는 부분만 보여준다. 하단은 "나도 만들기"로 바이럴 루프를 연결한다.
export async function renderSharedResult(app, slug) {
  app.innerHTML = renderLoadingShared();

  let owner;
  try {
    owner = await db.getOwnerBySlug(slug);
  } catch {
    owner = null;
  }

  if (!owner) {
    app.innerHTML = `
      <div class="screen">
        <div class="center-screen">
          ${renderCharacter("cute", 0, 150)}
          <h2>결과를 찾을 수 없어요</h2>
          <p class="muted">링크가 올바른지 확인해주세요</p>
        </div>
        <button class="btn" id="make">나도 내 캐릭터 키우기 🌱</button>
      </div>`;
    app.querySelector("#make").onclick = () => navigate("/");
    return;
  }

  // 친구는 주인의 테마로 본다
  applyTheme(owner.theme);

  let feedbacks = [];
  try {
    feedbacks = await db.getFeedbacksBySlug(slug);
  } catch {
    feedbacks = [];
  }

  const nick = owner.nickname || "친구";
  const m = computeModel(feedbacks, nick);
  const { count, form, analysis, catTop3Html, kwHtml, secondCat, secondForm, secondAxis, compat } = m;

  if (count === 0) {
    app.innerHTML = `
      <div class="screen">
        <div class="center-screen">
          ${renderCharacter("cute", 1, 150)}
          <h2>${nick}님은 아직 자라는 중</h2>
          <p class="muted">아직 받은 먹이가 없어요.<br/>조금 뒤에 다시 와주세요!</p>
        </div>
        <button class="btn" id="make">나도 내 캐릭터 키우기 🌱</button>
      </div>`;
    app.querySelector("#make").onclick = () => navigate("/");
    return;
  }

  app.innerHTML = `
    <div class="screen result-screen">
      <div class="top">
        <h1>${nick}님이 친구들에게 보이는 모습</h1>
      </div>

      <!-- 요약 카드 (hero) -->
      ${instaCardHtml(m, nick)}

      <!-- 캐릭터 분석 -->
      ${analysis ? `
      <div class="analysis-section" style="margin-top:20px">
        <div class="section-label">🧬 캐릭터 분석</div>
        <div class="section-sub">${nick}님은 <b style="color:var(--primary)">${form.name}</b> 유형이에요. "${form.tagline}"</div>
        ${analysis.desc.split("\n").map((p) => `<p class="personality-desc">${p}</p>`).join("")}
        ${analysis.hidden ? `<p class="personality-hint">💡 이런 타입은 ${analysis.hidden}</p>` : ""}
      </div>` : ""}

      <!-- 매력 성분표 (공개분: TOP3만) -->
      <div class="analysis-section">
        <div class="section-label">📊 ${nick}님의 매력 성분표</div>
        <div class="cat-bars">${catTop3Html}</div>
      </div>

      <!-- 많이 고른 키워드 -->
      <div class="analysis-section">
        <div class="section-label">💬 친구들이 많이 고른 키워드</div>
        <div class="kw-list">${kwHtml}</div>
      </div>

      <!-- 종합 분석은 유료 영역이라 공개 뷰에서 제외 -->

      <!-- 반전 매력 (2위 캐릭터 기반) — 공개 -->
      ${secondForm && secondAxis ? rSection({
        sym: "spark", title: "사실 이런 면도 숨어 있어요", accent: true,
        body: `
          <div class="flip-row">
            <div class="flip-char" style="background:radial-gradient(circle,${secondForm.color}40,transparent 68%)">
              ${renderCharacter(secondCat.code, 3, 78, false)}
            </div>
            <div style="flex:1">
              <div class="flip-title">숨은 매력, <span style="color:var(--primary)">${secondForm.name}</span></div>
              <p class="flip-desc">겉으론 ${form.name}이지만, 친구들은 ${nick}님에게서 <b style="color:var(--ink)">${secondAxis}</b>의 반전 매력도 느꼈대요. ${secondForm.tagline} 같은 면이 살짝 숨어 있어요.</p>
            </div>
          </div>`,
      }) : ""}

      <!-- 궁합 -->
      ${compat ? rSection({
        sym: "heart", title: `${nick}님과 잘 맞는 유형은?`, accent: true,
        body: `
          <div class="match-row">
            ${matchCard("best", compat.match, compat.matchWhy)}
            ${matchCard("spark", compat.clash, compat.clashWhy)}
          </div>`,
      }) : ""}

      <!-- 바이럴 유도 카드 -->
      <div class="share-cta-card">
        <div class="share-cta-emoji">🌱</div>
        <div class="share-cta-title">나도 친구들이 보는 내 모습이 궁금하다면?</div>
        <p class="share-cta-sub">30초면 내 캐릭터를 키울 수 있어요</p>
      </div>
    </div>

    <!-- 하단 sticky: 나도 만들기를 메인 CTA로 (바이럴 루프) -->
    <div class="save-dock">
      <button class="btn" id="make">나도 내 캐릭터 키우기 🌱</button>
    </div>
  `;

  app.querySelector("#make").onclick = () => navigate("/");
}

// 공개 결과 뷰 로딩 표시 (간단)
function renderLoadingShared() {
  return `
    <div class="screen">
      <div class="center-screen">
        ${renderCharacter("cute", 1, 110)}
        <p class="muted">결과를 불러오는 중…</p>
      </div>
    </div>`;
}
