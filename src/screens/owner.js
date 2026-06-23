// 내 캐릭터 (주인) 화면 — 디자인 홈 화면 기반
import { navigate } from "../main.js";
import { db, MODE } from "../lib/db.js";
import { decideStage, decideCharacter, CHARACTERS } from "../data/words.js";
import { renderCharacter } from "../components/character.js";
import { openShareSheet } from "../lib/share.js";

// 먹이 요청 공유 시트 — 지인에게 "먹이주기" 링크를 보낸다
function openFeedShare(url) {
  openShareSheet({
    sheetTitle: "친구에게 먹이 요청하기",
    url,
    kakao: {
      title: "나를 키워줘 🌱",
      description: "나를 보면 생각나는 말 7개만 골라줘!",
      imageUrl: "https://grow-me-omega.vercel.app/feed-image.png",
      buttonTitle: "먹이 주러 가기",
    },
    onCopied: () => {
      const btn = document.querySelector("#share");
      if (btn) {
        btn.textContent = "링크 복사 완료!";
        setTimeout(() => (btn.textContent = "친구에게 먹이 요청하기"), 1800);
      }
    },
  });
}

// 개발용: 로컬 모드에서 더미 친구 3명을 채워 결과 화면을 바로 확인 (운영 Supabase 모드에선 숨김)
const DEMO_FEEDBACKS = [
  { name: "지민", words: ["예뻐", "멋있어", "스타일좋아", "매력적이야", "옷잘입어", "귀여워", "웃겨"] },
  { name: "수아", words: ["매력적이야", "세련됐어", "분위기있어", "다정해", "예뻐", "스타일좋아", "재미있어"] },
  { name: "현우", words: ["멋있어", "잘생겼어", "예뻐", "똑똑해", "열정적이야", "친절해", "매력적이야"] },
];
async function seedDemoFeedbacks(me) {
  for (const f of DEMO_FEEDBACKS) await db.submitFeedback(me.id, f.name, f.words);
}

export async function renderOwner(app) {
  const me = await db.ensureMyUser();
  if (!me) return navigate("/");
  if (!me.theme) return navigate("/onboarding");

  const feedbacks = await db.getMyFeedbacks();
  const count = feedbacks.length;
  const stage = decideStage(count);
  const code = decideCharacter(feedbacks.flatMap((f) => f.words));
  const form = code ? CHARACTERS[code] : null;

  if (me.character_code !== code || me.stage !== stage) db.updateMyComputed(code, stage);

  const shareUrl = `${location.origin}${location.pathname}#/feed/${me.share_slug}`;

  // 진행 라벨 (Lv.0 알 → Lv.1 새싹 → Lv.2 → Lv.3 완성)
  let progLabel, nextLabel, charSub;
  if (stage === 0) {
    progLabel = "첫 먹이를 기다리는 중";
    nextLabel = "먹이 1번 받으면 → 새싹 🌱";
    charSub = "아직 정체불명의 알";
  } else if (stage === 1) {
    progLabel = "새싹이 돋았어요 🌱";
    nextLabel = "먹이 1번 더 → 2단계";
    charSub = "쑥쑥 자라는 중! 🌱";
  } else if (stage === 2) {
    progLabel = "무럭무럭 자라는 중";
    nextLabel = "먹이 1번 더 → 3단계 완성";
    charSub = "거의 다 자랐어요! 👀";
  } else {
    progLabel = "완전히 자랐어요!";
    nextLabel = "원한다면 얼마든지 먹이를 더 받을 수 있어요";
  }
  const progPct = (stage / 3) * 100;

  // 캐릭터 라벨
  let labelHtml;
  if (stage === 3 && form) {
    labelHtml = `
      <div class="char-name jua">${form.name}<span class="small"> 완성!</span></div>
      <div class="char-tagline">"${form.tagline}"</div>`;
  } else {
    labelHtml = `<div class="char-sub">${charSub}</div>${
      stage === 0 ? `<div class="char-hungry">"배고파요.."</div>` : ""
    }`;
  }

  app.innerHTML = `
    <div class="screen" style="padding-bottom:24px">
      <div class="top" style="justify-content:space-between">
        <div>
          <div class="jua" style="font-size:25px;color:var(--ink);line-height:1.15">나를 <span style="color:var(--primary)">키워줘</span> 🌱</div>
          <div style="font-size:15px;color:var(--ink3);font-weight:600;margin-top:3px"><span style="color:var(--ink2);font-weight:800">${me.nickname || "나"}</span>를 키우는 중</div>
        </div>
        <span class="lv">Lv.${stage}</span>
      </div>

      <div class="char-stage" style="flex:1;min-height:0">
        <div class="glow"></div>
        <div class="grow-in">${renderCharacter(code, stage, 188)}</div>
        <div style="margin-top:4px">${labelHtml}</div>
        ${count > 0 ? `<div class="fed-pill">🍚 ${count}명이 키워줬어요</div>` : ""}
      </div>

      <div class="card prog">
        <div class="prog-head"><span class="l">${progLabel}</span>${stage >= 3 ? "" : `<span class="r">${nextLabel}</span>`}</div>
        ${stage >= 3 ? `<div class="prog-next">${nextLabel}</div>` : ""}
        <div class="prog-bar"><div style="width:${progPct}%"></div></div>
      </div>

      <div style="display:flex;flex-direction:column;gap:9px;margin-top:12px">
        <button class="btn" id="share">친구에게 먹이 요청하기</button>
        ${count > 0 ? `<button class="btn ghost" id="result">결과 카드 보기</button>` : ""}
        <button class="btn text" id="logout">로그아웃</button>
        ${MODE === "local" ? `<button class="btn text" id="demo" style="color:var(--ink3)">🧪 (개발) 더미 친구 3명 채우고 결과 보기</button>` : ""}
      </div>
    </div>
  `;

  const demoBtn = app.querySelector("#demo");
  if (demoBtn)
    demoBtn.onclick = async () => {
      demoBtn.disabled = true;
      demoBtn.textContent = "채우는 중…";
      await seedDemoFeedbacks(me);
      navigate("/result");
    };

  const resultBtn = app.querySelector("#result");
  if (resultBtn) resultBtn.onclick = () => navigate("/result");
  app.querySelector("#logout").onclick = async () => {
    await db.signOut();
    navigate("/");
  };

  const shareBtn = app.querySelector("#share");
  if (shareBtn)
    shareBtn.onclick = () => openFeedShare(shareUrl);
}
