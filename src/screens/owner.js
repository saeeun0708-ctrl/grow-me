// 내 캐릭터 (주인) 화면 — 디자인 홈 화면 기반

function openShareSheet(url) {
  const backdrop = document.createElement("div");
  backdrop.className = "sheet-backdrop";
  backdrop.innerHTML = `
    <div class="sheet">
      <div class="sheet-handle"></div>
      <div class="sheet-title">친구에게 먹이 요청하기</div>
      <button class="sheet-btn kakao" id="sheet-kakao">카카오톡으로 공유하기</button>
      <button class="sheet-btn copy" id="sheet-copy">링크 복사하기</button>
      <button class="sheet-cancel" id="sheet-cancel">취소</button>
    </div>
  `;

  document.body.appendChild(backdrop);

  const close = () => backdrop.remove();
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });
  backdrop.querySelector("#sheet-cancel").onclick = close;

  backdrop.querySelector("#sheet-kakao").onclick = () => {
    close();
    const kakaoKey = "f716efd9dc8b2eac6addddad097c4b4f";
    if (!window.Kakao.isInitialized()) window.Kakao.init(kakaoKey);
    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title: "나를 키워줘 🌱",
        description: "나를 보면 생각나는 말 7개만 골라줘!",
        imageUrl: "https://grow-me-omega.vercel.app/feed-image.png",
        link: { mobileWebUrl: url, webUrl: url },
      },
      buttons: [{ title: "먹이 주러 가기", link: { mobileWebUrl: url, webUrl: url } }],
    });
  };

  backdrop.querySelector("#sheet-copy").onclick = async () => {
    close();
    try {
      await navigator.clipboard.writeText(url);
      const btn = document.querySelector("#share");
      if (btn) {
        btn.textContent = "링크 복사 완료!";
        setTimeout(() => (btn.textContent = "친구에게 먹이 요청하기"), 1800);
      }
    } catch {
      prompt("이 링크를 복사해서 공유해주세요", url);
    }
  };
}
import { navigate } from "../main.js";
import { db } from "../lib/db.js";
import { decideStage, decideCharacter, CHARACTERS } from "../data/words.js";
import { renderCharacter } from "../components/character.js";

export async function renderOwner(app) {
  const me = await db.ensureMyUser();
  if (!me) return navigate("/");
  if (!me.theme) return navigate("/onboarding");

  const feedbacks = await db.getMyFeedbacks();
  const count = feedbacks.length;
  const stage = decideStage(count);
  const code = decideCharacter(feedbacks.flatMap((f) => f.words));
  const independent = me.is_independent;
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

      <div class="char-stage" style="flex:1">
        <div class="glow"></div>
        <div class="grow-in">${renderCharacter(code, stage, 220)}</div>
        <div style="margin-top:4px">${labelHtml}</div>
        ${count > 0 ? `<div class="fed-pill">🍚 ${count}명이 키워줬어요</div>` : ""}
      </div>

      ${
        independent
          ? `<div class="card center" style="margin-bottom:14px"><b>독립한 캐릭터예요 🎓</b><div class="muted mt-s">더 이상 먹이를 받지 않아요</div></div>`
          : `<div class="card prog">
              <div class="prog-head"><span class="l">${progLabel}</span>${stage >= 3 ? "" : `<span class="r">${nextLabel}</span>`}</div>
              ${stage >= 3 ? `<div class="prog-next">${nextLabel}</div>` : ""}
              <div class="prog-bar"><div style="width:${progPct}%"></div></div>
            </div>`
      }

      <div style="display:flex;flex-direction:column;gap:10px;margin-top:14px">
        ${independent
          ? `<button class="btn" id="result">결과 카드 보기</button>`
          : `<button class="btn" id="share">친구에게 먹이 요청하기</button>
             ${stage >= 3 ? `<button class="btn ghost" id="independ">독립 시키기 (결과 보기)</button>` : ""}`}
        <button class="btn text" id="logout">로그아웃</button>
      </div>
    </div>
  `;

  const resultBtn = app.querySelector("#result");
  if (resultBtn) resultBtn.onclick = () => navigate("/result");
  app.querySelector("#logout").onclick = async () => {
    await db.signOut();
    navigate("/");
  };

  const shareBtn = app.querySelector("#share");
  if (shareBtn)
    shareBtn.onclick = () => openShareSheet(shareUrl);

  const independ = app.querySelector("#independ");
  if (independ)
    independ.onclick = async () => {
      if (confirm("독립시키면 더 이상 먹이를 받을 수 없어요. 계속할까요?")) {
        await db.setIndependent(true);
        renderOwner(app);
      }
    };
}
