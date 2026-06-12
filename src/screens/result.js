// 결과 화면: 심리검사 분석 스타일 (MBTI 느낌의 친구 분석 결과)
import { navigate } from "../main.js";
import { db } from "../lib/db.js";
import { decideStage, decideCharacter, CHARACTERS, WORD_TO_CATEGORY } from "../data/words.js";
import { renderCharacter } from "../components/character.js";

// 캐릭터별 성격 분석 텍스트
// desc: 줄바꿈(\n)으로 문단 구분 / hidden: "이런 타입은 " 다음에 붙는 보조 문장
const ANALYSIS = {
  brain: {
    headline: "논리적이고 똑부러지는 지성미를 갖췄어요.",
    desc: "친구들이 너를 떠올리며 고른 단어엔 '지적인' 면이 가장 많았어.\n논리적이고 깊이 있게 생각하는 모습, 꼼꼼하게 분석하고 핵심을 짚어내는 판단력. 그게 친구들 눈에 비친 너의 가장 큰 매력이야.",
    hidden: "냉철해 보여도 속은 의외로 따뜻한 경우가 많아.",
    emoji: "🧠",
  },
  charm: {
    headline: "눈을 뗄 수 없는 남다른 비주얼의 소유자예요.",
    desc: "친구들이 너를 떠올릴 때 가장 많이 고른 건 '매력적인' 비주얼과 스타일이야.\n자기만의 분위기, 시선을 끄는 존재감, 거기에 자기관리에서 오는 자신감까지. 친구들 눈에 너는 그냥 지나치기 어려운 사람이야.",
    hidden: "화려해 보여도 주변을 세심하게 챙기는 면이 숨어 있곤 해.",
    emoji: "✨",
  },
  passion: {
    headline: "넘치는 열정과 추진력의 소유자예요.",
    desc: "친구들이 고른 단어 중 가장 많았던 건 '열정적인' 너의 모습이야.\n한 번 정한 목표는 놓지 않는 끈기, 넘치는 에너지와 추진력. 함께 있으면 나도 뭔가 해내고 싶게 만드는 카리스마가 친구들 눈에 들어온 거야.",
    hidden: "강해 보여도 의외로 주변을 잘 챙기는 다정함을 품고 있어.",
    emoji: "🔥",
  },
  cute: {
    headline: "주변을 녹이는 사랑스러움의 결정체예요.",
    desc: "친구들이 너를 떠올리며 가장 많이 고른 건 '사랑스러운' 모습이야.\n순수하고 발랄한 에너지, 보고 있으면 저도 모르게 웃게 되는 분위기. 친구들 눈엔 곁에 두고 싶은 사랑둥이로 비쳤어.",
    hidden: "귀엽기만 한 것 같아도 속은 의외로 단단하고 생각이 깊은 경우가 많아.",
    emoji: "🎀",
  },
  fun: {
    headline: "자리를 빛내는 타고난 분위기 메이커예요.",
    desc: "친구들이 고른 단어엔 '유쾌한' 네가 가장 많았어.\n어떤 자리든 살아나게 만드는 분위기, 함께 있으면 시간 가는 줄 모르는 텐션. 친구들 눈에 너는 모임의 공기를 바꾸는 사람이야.",
    hidden: "밝아 보여도 의외로 주변 눈치를 세심하게 살피는 면이 있어.",
    emoji: "🎉",
  },
  warm: {
    headline: "같이 있으면 안정감 있고 따뜻한 존재예요.",
    desc: "친구들이 너를 떠올리며 가장 많이 고른 건 '다정한' 모습이야.\n말 안 해도 알아주는 공감, 먼저 손 내미는 따뜻함. 친구들 눈엔 곁에 있으면 마음이 놓이는 사람으로 비쳤어.",
    hidden: "다정하면서도 자기만의 확고한 생각을 가진 단단함을 함께 지니곤 해.",
    emoji: "🤗",
  },
  talent: {
    headline: "무엇이든 잘하는 다재다능한 능력자예요.",
    desc: "친구들이 고른 단어 중 가장 많았던 건 '재주 많은' 너야.\n뭘 시켜도 해내는 손재주와 다재다능함. 여러 분야에서 빛을 발하는 모습이 친구들 눈에 들어온 거야.",
    hidden: "재능이 많은 만큼, 어디에 집중할지 즐거운 고민을 안고 살기도 해.",
    emoji: "🌟",
  },
  mystery: {
    headline: "알수록 더 알고 싶은 신비주의자예요.",
    desc: "친구들이 너를 떠올리며 가장 많이 고른 건 '신비로운' 분위기야.\n쉽게 읽히지 않는 개성, 남들과 다른 시선. 알수록 더 궁금해지는 묘한 매력이 친구들 눈에 비친 너야.",
    hidden: "차가워 보여도 가까운 사람에겐 깊은 애정을 보이는 경우가 많아.",
    emoji: "🔮",
  },
};

const CAT_EMOJI = {
  brain: "🧠", charm: "✨", passion: "🔥",
  cute: "🎀", fun: "🎉", warm: "🤗",
  talent: "🌟", mystery: "🔮",
};

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

export async function renderResult(app) {
  const me = await db.ensureMyUser();
  if (!me) return navigate("/");

  const feedbacks = await db.getMyFeedbacks();
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
  const unlocked = me.is_unlocked;
  const form = code ? CHARACTERS[code] : null;
  const analysis = code ? ANALYSIS[code] : null;
  const glowColor = form ? form.color : "#FF7FA3";
  const secondCat = catRanking.length >= 2 ? catRanking[1] : null;
  const secondForm = secondCat ? CHARACTERS[secondCat.code] : null;
  const nick = me.nickname || "나";

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

  // 카테고리 바 HTML
  const maxCatCount = catRanking[0].count;
  const catBarsHtml = catRanking
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
    })
    .join("");

  // 키워드 칩 (상위 8개): 2명 이상이 고른 단어만 강조, 숫자 배지 앞 공백
  const kwHtml = wordRanking
    .slice(0, 8)
    .map((w) => `
      <span class="kw-chip${w.count >= 2 ? " kw-top" : ""}">
        ${w.word} <span class="kw-cnt">${w.count}</span>
      </span>`)
    .join("");

  const top3kw = wordRanking.slice(0, 3).map((w) => w.word);

  // 저장 카드용 미니 성분표 (상위 3개 카테고리) — 본문 성분표와 같은 동점 보정 적용
  // 이모지 대신 1·2·3위 순위 뱃지로 표시
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

  // 진입점(시청자가 "나도 해볼래"로 들어올 주소) — 호스팅 도메인 또는 현재 origin
  const entryUrl = "grow-me-omega.vercel.app";

  app.innerHTML = `
    <div class="screen result-screen">
      <div class="top">
        <button class="back" id="back">←</button>
        <h1>친구들이 보는 나의 모습</h1>
      </div>

      <!-- 요약 카드 (hero) — 첫 진입 시 전체 개요 + 이미지 저장 대상 -->
      <div class="insta-card-outer">
        <div class="insta-card" id="insta-card">
          <div class="ic-dots-bg"></div>
          <div class="ic-inner">
            <!-- 타이틀: 서브('N명의 친구가 본') + 메인('{닉네임}님의 매력은?') -->
            <div class="ic-subtitle">${count}명의 친구들이 뽑아준</div>
            <div class="ic-maintitle">${nick}님의 매력은?</div>

            <div style="position:relative;display:flex;justify-content:center;margin:4px 0 4px">
              <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:170px;height:170px;border-radius:50%;background:radial-gradient(circle,${glowColor}66,transparent 70%)"></div>
              <div class="grow-in" style="position:relative">${renderCharacter(code, stage, 160, false)}</div>
            </div>

            <div class="ic-name">${form ? form.name : "성장 중"}</div>
            ${form ? `<div class="ic-tagline">"${form.tagline}"</div>` : ""}
            ${analysis ? `<div class="ic-headline">${analysis.headline}</div>` : ""}

            <div class="ic-divider"></div>

            <!-- 가장 많이 받은 키워드 TOP3 (해시태그 칩) -->
            <div class="ic-keywords">
              ${top3kw.map((w) => `<span class="ic-kw">#${w}</span>`).join("")}
            </div>

            <!-- 매력 성분표 TOP3 (가로 bar) -->
            ${icBarsHtml ? `<div class="ic-mini-bars">${icBarsHtml}</div>` : ""}

            <div class="ic-footer">
              <span class="ic-brand">🌱 나를 키워줘</span>
              <span class="ic-url">${entryUrl}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 성격 분석 -->
      ${analysis ? `
      <div class="analysis-section" style="margin-top:20px">
        <div class="section-label">🪞 성격 분석</div>
        ${analysis.desc.split("\n").map(p => `<p class="personality-desc">${p}</p>`).join("")}
        <p class="personality-hint">이런 타입은 ${analysis.hidden}</p>
      </div>` : ""}

      <div class="analysis-section">
        <div class="section-label">📊 나의 매력 성분표</div>
        <div class="cat-bars">${catBarsHtml}</div>
      </div>

      <div class="analysis-section">
        <div class="section-label">💬 많이 고른 키워드</div>
        <div class="kw-list">${kwHtml}</div>
      </div>

      <!-- ⑤ 의외의 매력 문장 자연스럽게 -->
      ${secondForm ? `
      <div class="hidden-trait-card">
        <div class="hidden-trait-label">✨ 또 하나의 매력</div>
        <div class="hidden-trait-main">
          ${secondForm.name} 매력도 함께 가지고 있어. "${secondForm.tagline}"
        </div>
      </div>` : ""}

      <!-- ⑧ 잠금 섹션 — 중복 제거 -->
      <div class="lock-area" style="margin-top:10px">
        <div class="lock-title">👀 누가 어떤 말을 골랐을까?</div>
        ${
          unlocked
            ? `<div class="lock-list" style="margin-top:12px">${feedbacks
                .map((f) => `<div class="row"><span class="nm">${f.name}</span><span class="ws">${f.words.join(", ")}</span></div>`)
                .join("")}</div>`
            : `<div class="lock-list blur" style="margin-top:12px">${feedbacks
                .slice(0, 3)
                .map((f) => `<div class="row"><span class="nm">●●●</span><span class="ws">${f.words.slice(0, 3).join(", ")} …</span></div>`)
                .join("")}</div>
               <button class="btn" id="unlock" style="margin-top:14px">전체 보기 · 990원</button>`
        }
      </div>

      <div class="dev-hint">🛠️ 이미지 저장은 5단계(html2canvas), 결제는 6단계(토스페이먼츠)에서 구현 예정</div>
    </div>

    <!-- ③ 저장 CTA를 하단 sticky로 — 스크롤 내내 공유 전환 가능 -->
    <div class="save-dock">
      <button class="btn" id="save">결과 카드 저장하기 📸</button>
    </div>
  `;

  app.querySelector("#back").onclick = () => navigate("/owner");
  app.querySelector("#save").onclick = () => alert("📸 이미지 저장은 5단계에서 구현합니다!");

  const unlockBtn = app.querySelector("#unlock");
  if (unlockBtn)
    unlockBtn.onclick = async () => {
      if (confirm("(더미 결제) 990원을 결제하고 전체를 볼까요?")) {
        await db.setUnlocked(true);
        renderResult(app);
      }
    };
}
