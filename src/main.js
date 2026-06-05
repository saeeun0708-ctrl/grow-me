// 엔트리 + 해시 라우터 (+ 인증 가드)
import "./style.css";
import { db, MODE } from "./lib/db.js";
import { renderLanding } from "./screens/landing.js";
import { renderOwner } from "./screens/owner.js";
import { renderFeed } from "./screens/feed.js";
import { renderResult } from "./screens/result.js";
import { renderOnboarding } from "./screens/onboarding.js";

const app = document.getElementById("app");

export function navigate(path) {
  const h = path.startsWith("/") ? path : `/${path}`;
  if (location.hash === "#" + h) router(); // 같은 해시면 hashchange가 안 떠서 직접 재실행
  else location.hash = h;
}

// 테마 적용 (#app에 클래스)
const THEME_CLASS = {
  딸기우유: "theme-strawberry",
  블루베리: "theme-blueberry",
  복숭아: "theme-peach",
};
export function applyTheme(name) {
  app.className = THEME_CLASS[name] || "theme-strawberry";
}

// 간단 로딩 표시
function showLoading() {
  app.innerHTML = `<div class="screen"><div class="done"><div class="pop">🌱</div><p class="muted">불러오는 중…</p></div></div>`;
}

async function router() {
  const raw = location.hash.slice(1) || "/";
  const parts = raw.split("/").filter(Boolean);
  const route = parts[0] || "";
  const param = parts[1];
  window.scrollTo(0, 0);

  // 로그인 필요 화면 가드 (+ 온보딩 미완료 시 온보딩으로)
  const needsAuth = route === "owner" || route === "result" || route === "onboarding";
  if (needsAuth) {
    const session = await db.getSession();
    if (!session) return renderLanding(app);
    const me = await db.ensureMyUser();
    if (me && !me.theme && route !== "onboarding") return renderOnboarding(app);
    if (me && me.theme) applyTheme(me.theme);
  }

  switch (route) {
    case "":
      applyTheme("딸기우유");
      return renderLanding(app);
    case "onboarding":
      return renderOnboarding(app);
    case "owner":
      return renderOwner(app);
    case "feed":
      return renderFeed(app, param || "demo");
    case "result":
      return renderResult(app);
    default:
      return renderLanding(app);
  }
}

window.addEventListener("hashchange", router);

// 부팅: Supabase OAuth 리다이렉트(?code=) 처리 후 라우팅
(async function boot() {
  showLoading();
  if (MODE === "supabase") {
    // detectSessionInUrl이 ?code= 를 교환할 시간을 주고 세션 확인
    await db.getSession();
    // OAuth 후 깨끗한 URL에서 첫 진입이면 내 캐릭터로
    const onRoot = !location.hash || location.hash === "#/";
    if (onRoot && (await db.getSession())) {
      navigate("/owner");
      return; // hashchange가 router 호출
    }
  }
  router();
})();
