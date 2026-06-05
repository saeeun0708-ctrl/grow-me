// 결과 화면 — 자랑용 결과 카드(브래그 카드) + 상세 언락(결제)
import { navigate } from "../main.js";
import { db } from "../lib/db.js";
import { decideStage, decideCharacter, CHARACTERS } from "../data/words.js";
import { renderCharacter } from "../components/character.js";

function tally(words) {
  const map = {};
  words.forEach((w) => (map[w] = (map[w] || 0) + 1));
  return Object.entries(map)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);
}

export async function renderResult(app) {
  const me = await db.ensureMyUser();
  if (!me) return navigate("/");

  const feedbacks = await db.getMyFeedbacks();
  const count = feedbacks.length;
  const stage = decideStage(count);
  const code = decideCharacter(feedbacks.flatMap((f) => f.words));
  const ranking = tally(feedbacks.flatMap((f) => f.words));
  const top5 = ranking.slice(0, 5);
  const unlocked = me.is_unlocked;
  const form = code ? CHARACTERS[code] : null;

  if (count === 0) {
    app.innerHTML = `
      <div class="screen">
        <div class="top"><button class="back" id="back">←</button><h1>결과 카드</h1></div>
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

  const medal = ["🥇", "🥈", "🥉", "4", "5"];
  const maxCount = top5[0].count;
  const glowColor = form ? form.color : "#FF7FA3";

  app.innerHTML = `
    <div class="screen">
      <div class="top"><button class="back" id="back">←</button><h1>결과 카드</h1></div>

      <div class="brag" id="brag-card">
        <div class="dots-bg"></div>
        <div class="inner">
          <div class="lead-line">${count}명이 키워준 결과, <b>${me.nickname || "나"}</b>는…</div>

          <div style="position:relative;display:flex;justify-content:center;margin:6px 0 2px">
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:200px;height:200px;border-radius:50%;background:radial-gradient(circle, ${glowColor}55, transparent 65%)"></div>
            <div style="position:relative">${renderCharacter(code, stage, 180, false)}</div>
          </div>

          <div style="text-align:center;margin-bottom:16px">
            <div class="jua" style="font-size:32px;color:var(--ink);line-height:1.1">${form ? form.name : "성장 중"}</div>
            ${form ? `<div style="font-size:14px;color:var(--ink2);margin-top:3px;font-weight:600">"${form.tagline}"</div>` : ""}
          </div>

          <div class="rank-box">
            <div class="rh">내가 제일 많이 받은 말 TOP 5</div>
            ${top5
              .map(
                (w, i) => `
              <div class="rank-row">
                <span class="medal" style="${i >= 3 ? "font-size:14px" : ""}">${medal[i]}</span>
                <span class="word">${w.word}</span>
                <div class="bar"><div style="width:${(w.count / maxCount) * 100}%;${i === 0 ? "background:linear-gradient(90deg,var(--primary),var(--primary-dark))" : `opacity:${0.55 - i * 0.07}`}"></div></div>
                <span class="cnt">${w.count}</span>
              </div>`
              )
              .join("")}
          </div>

          <div class="foot">🌱 나를 키워줘 · 너도 키워볼래?</div>
        </div>
      </div>

      <button class="btn mt" id="save">이미지로 저장하기</button>

      <div class="lock-area">
        <div class="lock-title">👀 누가 나를 이렇게 봤을까?</div>
        <div class="muted">이름별로 어떤 단어를 골랐는지 전부 보기</div>
        ${
          unlocked
            ? `<div class="lock-list">${feedbacks
                .map((f) => `<div class="row"><span class="nm">${f.name}</span><span class="ws">${f.words.join(", ")}</span></div>`)
                .join("")}</div>`
            : `<div class="lock-list blur">${feedbacks
                .slice(0, 3)
                .map((f) => `<div class="row"><span class="nm">●●●</span><span class="ws">${f.words.slice(0, 3).join(", ")} …</span></div>`)
                .join("")}</div>
               <button class="btn" id="unlock" style="margin-top:14px">전체 보기 · 990원</button>`
        }
      </div>

      <div class="dev-hint">🛠️ 이미지 저장은 5단계, 결제는 6단계(토스페이먼츠)에서 붙입니다. 지금은 더미예요.</div>
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
