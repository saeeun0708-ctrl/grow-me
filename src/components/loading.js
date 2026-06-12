// 트렌디 로딩 화면 — 회전 그라데이션 링 + 통통대는 코어 + 물결 바운스 도트
// inner: 링 가운데에 넣을 HTML(캐릭터 렌더 결과 등). 없으면 새싹 이모지.
export function renderLoading(inner) {
  return `
    <div class="screen loading-screen">
      <div class="loader">
        <div class="loader-orb">
          <div class="loader-ring"></div>
          <div class="loader-core">${inner || `<span class="loader-seed">🌱</span>`}</div>
        </div>
        <div class="loader-dots"><span></span><span></span><span></span></div>
      </div>
    </div>`;
}
