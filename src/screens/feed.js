// 먹이주기 (지인) 화면 — 인트로 → 제시어 7개 선택 → 완료 (로그인 불필요)
import { navigate, applyTheme } from "../main.js";
import { db } from "../lib/db.js";
import { ALL_WORDS, PICK_COUNT } from "../data/words.js";
import { renderCharacter } from "../components/character.js";
import { renderLoading } from "../components/loading.js";

function alreadyFed(slug) {
  try {
    return JSON.parse(localStorage.getItem("growme_fed") || "[]").includes(slug);
  } catch {
    return false;
  }
}
function markFed(slug) {
  let list = [];
  try {
    list = JSON.parse(localStorage.getItem("growme_fed") || "[]");
  } catch {}
  if (!list.includes(slug)) list.push(slug);
  localStorage.setItem("growme_fed", JSON.stringify(list));
}

function confetti() {
  const cols = ["#FFA8C5", "#FFD36E", "#8FB4F0", "#A8DE8A", "#C9A8F0"];
  let bits = "";
  for (let i = 0; i < 18; i++) {
    const left = 10 + Math.random() * 80;
    const delay = Math.random() * 0.3;
    const dur = 1.1 + Math.random() * 0.6;
    const rot = Math.random() * 360;
    bits += `<div class="confetti" style="position:absolute;top:-16px;left:${left}%;width:9px;height:13px;background:${cols[i % cols.length]};border-radius:2px;transform:rotate(${rot}deg);animation-delay:${delay}s;animation-duration:${dur}s"></div>`;
  }
  return `<div style="position:absolute;inset:0;overflow:hidden;pointer-events:none">${bits}</div>`;
}

function infoScreen(app, emoji, code, st, title, sub, btnLabel, onBtn, conf) {
  app.innerHTML = `
    <div class="screen">
      ${conf ? confetti() : ""}
      <div class="center-screen">
        <div class="pop-in" style="display:inline-block">${renderCharacter(code, st, 150)}</div>
        ${emoji ? `<div class="muted" style="font-weight:600">${emoji}</div>` : ""}
        <h2>${title}</h2>
        <p class="muted" style="line-height:1.6">${sub}</p>
      </div>
      <button class="btn" id="b">${btnLabel}</button>
    </div>`;
  app.querySelector("#b").onclick = onBtn;
}

export async function renderFeed(app, slug) {
  app.innerHTML = renderLoading(renderCharacter("cute", 1, 96));

  let owner;
  try {
    owner = await db.getOwnerBySlug(slug);
  } catch {
    owner = null;
  }

  if (!owner)
    return infoScreen(app, "", "cute", 0, "캐릭터를 찾을 수 없어요", "링크가 올바른지 확인해주세요", "나도 만들기", () => navigate("/"));

  // 친구는 주인의 테마로 본다
  applyTheme(owner.theme);
  // 독립한 캐릭터도 먹이는 계속 받을 수 있다(차단하지 않음)
  if (alreadyFed(slug))
    return infoScreen(app, "🍽️", "warm", 2, "이미 먹이를 줬어요", "한 캐릭터에는 한 번만 줄 수 있어요", "나도 만들기", () => navigate("/"));

  const ownerName = owner.nickname || "친구";

  // ── 인트로 ──
  app.innerHTML = `
    <div class="screen">
      <div class="center-screen">
        <div class="pop-in" style="display:inline-block">${renderCharacter("cute", 1, 150)}</div>
        <div class="muted" style="font-weight:600">🌱 누군가 너를 기다리고 있어</div>
        <h2 style="line-height:1.3"><span style="color:var(--primary)">${ownerName}</span>님을 보면<br/>떠오르는 말은?</h2>
        <p class="muted" style="line-height:1.6">어울리는 단어 <b style="color:var(--ink)">7개</b>를 골라주면<br/>${ownerName}님에게 <b style="color:var(--ink)">먹이</b>를 줄 수 있어요.</p>
      </div>
      <button class="btn" id="go">고르러 가기</button>
      <p class="center muted" style="font-size:12.5px;margin-top:10px">딱 30초면 충분해요 · 내 이름과 함께 전달돼요</p>
    </div>`;
  app.querySelector("#go").onclick = () => renderPick(app, owner, slug, ownerName);
}

function renderPick(app, owner, slug, ownerName) {
  const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const allChips = shuffle(ALL_WORDS);
  const INIT = 30;
  const BATCH = 20;
  let loaded = INIT;
  const selected = new Set();

  app.innerHTML = `
    <div id="pickHead" style="position:fixed;top:0;left:50%;transform:translateX(-50%);width:min(430px,100%);background:var(--bg);z-index:10;padding:16px 16px 10px">
      <div class="center" style="margin-bottom:10px">
        <h2 class="jua" style="font-size:21px;margin:0;color:var(--ink)">${ownerName}님에게 어울리는 말 7개</h2>
        <p class="muted" style="font-size:13.5px;color:var(--ink3);margin:4px 0 0">마음에 드는 단어를 톡톡 눌러줘</p>
      </div>
      <div class="field" style="margin-bottom:10px">
        <input id="name" placeholder="내 이름 (예: 김민지)" maxlength="12" />
      </div>
      <div class="dots" id="dots">${Array.from({ length: PICK_COUNT }).map(() => `<i></i>`).join("")}</div>
    </div>
    <div id="pickBody" style="padding:170px 16px 100px">
      <div class="chips" id="chips">
        ${allChips.slice(0, INIT).map((w) => `<button class="chip" data-w="${w}">${w}</button>`).join("")}
      </div>
    </div>
    <div style="position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:min(430px,100%);padding:0 16px 20px;background:linear-gradient(transparent,var(--bg) 40%);z-index:20">
      <button class="btn" id="submit" disabled>7개 더 골라줘</button>
    </div>`;

  const chipsEl = app.querySelector("#chips");
  const dotsEl = app.querySelector("#dots");
  const submitEl = app.querySelector("#submit");
  const nameEl = app.querySelector("#name");
  const headEl = app.querySelector("#pickHead");
  const bodyEl = app.querySelector("#pickBody");
  // 고정 헤더 높이를 측정해 칩 영역 상단 여백을 맞춘다(헤더에 칩이 가려지지 않도록)
  function syncHeadPad() {
    bodyEl.style.paddingTop = headEl.offsetHeight + 12 + "px";
  }
  syncHeadPad();
  window.addEventListener("resize", syncHeadPad, { passive: true });
  // window 스크롤로 감지 (iOS Safari 호환)
  function loadMore() {
    if (loaded >= allChips.length) return;
    const next = allChips.slice(loaded, loaded + BATCH);
    const full = selected.size >= PICK_COUNT;
    next.forEach((w) => {
      const btn = document.createElement("button");
      btn.className = "chip" + (full ? " dim" : "");
      btn.dataset.w = w;
      btn.textContent = w;
      chipsEl.appendChild(btn);
    });
    loaded += BATCH;
  }

  function onScroll() {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    if (scrollTop + clientHeight >= scrollHeight - 200) loadMore();
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  // 화면 벗어날 때 리스너 정리
  const cleanup = new MutationObserver(() => {
    if (!document.contains(chipsEl)) {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", syncHeadPad);
      cleanup.disconnect();
    }
  });
  cleanup.observe(document.body, { childList: true, subtree: true });

  function refresh() {
    const n = selected.size;
    const full = n >= PICK_COUNT;
    const hasName = nameEl.value.trim().length > 0;
    chipsEl.querySelectorAll(".chip").forEach((el) => {
      const on = selected.has(el.dataset.w);
      el.classList.toggle("on", on);
      el.classList.toggle("dim", full && !on);
      el.textContent = (on ? "✓ " : "") + el.dataset.w;
    });
    dotsEl.querySelectorAll("i").forEach((d, i) => d.classList.toggle("on", i < n));
    submitEl.disabled = !(full && hasName);
    submitEl.textContent = !full
      ? `${PICK_COUNT - n}개 더 골라줘`
      : !hasName
      ? "이름을 적어줘"
      : "먹이주기";
  }

  chipsEl.addEventListener("click", (e) => {
    const el = e.target.closest(".chip");
    if (!el) return;
    const w = el.dataset.w;
    if (selected.has(w)) selected.delete(w);
    else {
      if (selected.size >= PICK_COUNT) return;
      selected.add(w);
    }
    refresh();
  });
  nameEl.addEventListener("input", refresh);

  submitEl.onclick = async () => {
    submitEl.disabled = true;
    submitEl.textContent = "주는 중…";
    try {
      await db.submitFeedback(owner.id, nameEl.value.trim(), [...selected]);
      markFed(slug);
      renderDone(app, ownerName, [...selected]);
    } catch (e) {
      alert("먹이주기에 실패했어요: " + e.message);
      refresh();
    }
  };
}

function renderDone(app, ownerName, picks) {
  app.innerHTML = `
    <div class="screen">
      ${confetti()}
      <div class="center-screen">
        <div class="pop-in" style="display:inline-block">${renderCharacter("fun", 2, 150)}</div>
        <h2>먹이 주기 완료! 🍚</h2>
        <p class="muted" style="line-height:1.6">덕분에 <b style="color:var(--primary)">${ownerName}</b>님이<br/>한 뼘 더 무럭무럭 자랐어요.</p>
        <div class="pill-list">${picks.map((w) => `<span>${w}</span>`).join("")}</div>
      </div>
      <button class="btn" id="me">나도 내 캐릭터 키우기 →</button>
    </div>`;
  app.querySelector("#me").onclick = () => navigate("/");
}
