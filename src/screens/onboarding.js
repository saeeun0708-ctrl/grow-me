// 온보딩 — 최초 로그인 후 닉네임 + 테마 선택 → 키우는 화면으로
import { navigate, applyTheme } from "../main.js";
import { db } from "../lib/db.js";
import { renderCharacter } from "../components/character.js";

const THEMES = [
  { name: "딸기우유", swatch: "#FF7FA3" },
  { name: "블루베리", swatch: "#7FA6FF" },
  { name: "복숭아", swatch: "#FF9F5A" },
];

export async function renderOnboarding(app) {
  const me = await db.ensureMyUser();
  if (!me) return navigate("/");

  // 카카오에서 받은 닉네임을 기본값으로 (단, 더미 '나'면 빈칸)
  const defaultNick = me.nickname && me.nickname !== "나" ? me.nickname : "";
  let selected = me.theme || "딸기우유";
  applyTheme(selected);

  app.innerHTML = `
    <div class="screen">
      <div class="center" style="margin-top:8px">
        <div class="pop-in" style="display:inline-block">${renderCharacter("cute", 1, 130)}</div>
        <h1 class="hero-title" style="font-size:28px;margin-top:6px">만나서 반가워요! 🌱</h1>
        <p class="hero-sub" style="margin-top:6px">캐릭터를 키우기 전에<br/>이름과 테마를 골라주세요</p>
      </div>

      <div class="field" style="margin-top:22px">
        <label>닉네임</label>
        <input id="nick" placeholder="예: 민지" maxlength="12" value="${defaultNick}" />
      </div>

      <div style="margin-top:18px">
        <label style="display:block;font-size:14px;font-weight:700;margin-bottom:2px;color:var(--ink2)">테마 선택</label>
        <div class="theme-grid" id="themes">
          ${THEMES.map(
            (t) => `
            <div class="theme-opt ${t.name === selected ? "on" : ""}" data-t="${t.name}">
              <div class="swatch" style="background:radial-gradient(circle at 36% 30%, #fff6, ${t.swatch})"></div>
              <div class="tname">${t.name}</div>
              <div class="check">${t.name === selected ? "✓ 선택됨" : ""}</div>
            </div>`
          ).join("")}
        </div>
      </div>

      <div class="spacer"></div>
      <button class="btn" id="start">시작하기</button>
    </div>
  `;

  const themesEl = app.querySelector("#themes");
  themesEl.addEventListener("click", (e) => {
    const opt = e.target.closest(".theme-opt");
    if (!opt) return;
    selected = opt.dataset.t;
    applyTheme(selected); // 실시간 미리보기
    themesEl.querySelectorAll(".theme-opt").forEach((el) => {
      const on = el.dataset.t === selected;
      el.classList.toggle("on", on);
      el.querySelector(".check").textContent = on ? "✓ 선택됨" : "";
    });
  });

  app.querySelector("#start").onclick = async () => {
    const btn = app.querySelector("#start");
    const nickname = app.querySelector("#nick").value.trim() || me.nickname || "나";
    btn.disabled = true;
    btn.textContent = "준비 중…";
    try {
      await db.updateProfile(nickname, selected);
      navigate("/owner");
    } catch (e) {
      alert("저장에 실패했어요: " + e.message);
      btn.disabled = false;
      btn.textContent = "시작하기";
    }
  };
}
