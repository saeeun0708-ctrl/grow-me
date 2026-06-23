// 엔트리 + 해시 라우터 (+ 인증 가드)
import "./style.css";
import { db, MODE } from "./lib/db.js";
import { renderLanding } from "./screens/landing.js";
import { renderOwner } from "./screens/owner.js";
import { renderFeed } from "./screens/feed.js";
import { renderResult, renderSharedResult } from "./screens/result.js";
import { renderOnboarding } from "./screens/onboarding.js";
import { renderLoading } from "./components/loading.js";

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

// 로딩 표시 (트렌디 로더)
function showLoading() {
  app.innerHTML = renderLoading();
}

// supabase 호출이 응답 없이 멈추는 경우(백엔드 장애·프로젝트 일시정지 등) 대비.
// ms 안에 끝나지 않거나 reject되면 fallback 값으로 폴백해 무한 로딩을 막는다.
function withTimeout(promise, ms, fallback) {
  return Promise.race([
    Promise.resolve(promise).catch(() => fallback),
    new Promise((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}
const AUTH_TIMEOUT = 5000;

async function router() {
  const raw = location.hash.slice(1) || "/";
  const parts = raw.split("/").filter(Boolean);
  const route = parts[0] || "";
  const param = parts[1];
  window.scrollTo(0, 0);

  // 로그인 필요 화면 가드 (+ 온보딩 미완료 시 온보딩으로)
  const needsAuth = route === "owner" || route === "result" || route === "onboarding";
  if (needsAuth) {
    // 백엔드가 멈춰도 무한 로딩되지 않도록 타임아웃 폴백 → 실패 시 landing
    const session = await withTimeout(db.getSession(), AUTH_TIMEOUT, null);
    if (!session) return renderLanding(app);
    const me = await withTimeout(db.ensureMyUser(), AUTH_TIMEOUT, null);
    if (!me) return renderLanding(app);
    if (!me.theme && route !== "onboarding") return renderOnboarding(app);
    if (me.theme) applyTheme(me.theme);
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
    case "share":
      // 공개 결과 뷰(비로그인): 친구가 공유 링크로 들어와 결과를 본다. 결제 영역은 제외.
      return renderSharedResult(app, param || "demo");
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
    // (백엔드 장애 시 멈추지 않도록 타임아웃 폴백)
    const session = await withTimeout(db.getSession(), AUTH_TIMEOUT, null);
    // OAuth 후 깨끗한 URL에서 첫 진입이면 내 캐릭터로
    const onRoot = !location.hash || location.hash === "#/";
    if (onRoot && session) {
      navigate("/owner");
      return; // hashchange가 router 호출
    }
  }
  router();
})();
