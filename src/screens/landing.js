// 랜딩 / 로그인 화면
import { navigate } from "../main.js";
import { db, MODE } from "../lib/db.js";
import { renderCharacter } from "../components/character.js";

export async function renderLanding(app) {
  if (await db.getSession()) return navigate("/owner");

  app.innerHTML = `
    <div class="screen">
      <div class="spacer"></div>
      <div class="center">
        <div class="pop-in" style="display:inline-block">${renderCharacter("cute", 1, 160)}</div>
        <h1 class="hero-title mt">나를 키워줘</h1>
        <p class="hero-sub">친구들이 골라준 단어로 내 캐릭터를 키우고,<br/>"친구가 보는 나"를 확인해보세요 🌱</p>
      </div>
      <div class="spacer"></div>

      <button class="btn kakao" id="login">카카오로 시작하기</button>

      <div class="dev-hint">
        ${
          MODE === "supabase"
            ? "🔌 Supabase 모드 — 카카오 로그인이 실제로 동작합니다."
            : "🛠️ 로컬 모드 — Supabase 키가 없어 더미 로그인입니다. (.env.local 설정 시 실제 로그인)"
        }
      </div>
    </div>
  `;

  app.querySelector("#login").onclick = async () => {
    const btn = app.querySelector("#login");
    btn.disabled = true;
    btn.textContent = "로그인 중…";
    try {
      await db.signIn();
      if (MODE !== "supabase") navigate("/owner");
    } catch (e) {
      alert("로그인에 실패했어요: " + e.message);
      btn.disabled = false;
      btn.textContent = "카카오로 시작하기";
    }
  };
}
