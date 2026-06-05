// 캐릭터 렌더링 — 클로드 디자인(Character.jsx)을 Vanilla JS로 포팅.
// 동글동글 귀여운 캐릭터: 통통한 몸 · 큰 반짝 눈 · 볼터치 · 아장 발/손 + 8종 시그니처 장식.
// 성장 단계: 1=공통 새싹아기 · 2=어린이(특징 절반) · 3=완성형. (0=알, 눈 감음)
import { CHARACTERS } from "../data/words.js";

// 색 보간
function mix(hex, target, t) {
  const a = parseInt(hex.slice(1), 16),
    b = parseInt(target.slice(1), 16);
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  const h = (n) => n.toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(bl)}`;
}

// 스타일 객체 → 인라인 CSS 문자열
const UNITLESS = new Set(["opacity", "zIndex", "fontWeight", "lineHeight", "flex"]);
function st(o) {
  return Object.entries(o)
    .map(([k, v]) => {
      const prop = k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
      const val = typeof v === "number" && !UNITLESS.has(k) ? v + "px" : v;
      return `${prop}:${val}`;
    })
    .join(";");
}
const div = (style, inner = "") => `<div style="${st(style)}">${inner}</div>`;

/* ── 부품 ── */
function foot(cx, y, w, col) {
  return div({ position: "absolute", left: cx, top: y, transform: "translateX(-50%)", width: w, height: w * 0.62, borderRadius: "50%", background: col, boxShadow: "0 2px 4px rgba(90,60,75,0.18)", zIndex: 0 });
}
function hand(cx, y, r, col) {
  return div({ position: "absolute", left: cx, top: y, transform: "translate(-50%,-50%)", width: r * 2, height: r * 2, borderRadius: "50%", background: col, zIndex: 0, boxShadow: "inset 0 -2px 3px rgba(0,0,0,0.08)" });
}
function cheek(cx, y, w) {
  return div({ position: "absolute", left: cx, top: y, transform: "translate(-50%,-50%)", width: w, height: w * 0.66, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,135,160,0.65), rgba(255,135,160,0.15))", zIndex: 3 });
}
function eye(cx, y, r, heart) {
  const hl = div({ position: "absolute", top: "14%", left: "20%", width: "46%", height: "42%", borderRadius: "50%", background: "#fff" });
  const sp = div({ position: "absolute", bottom: "16%", right: "20%", width: "24%", height: "24%", borderRadius: "50%", background: "rgba(255,255,255,0.85)" });
  const ht = heart ? div({ position: "absolute", top: "34%", left: "50%", transform: "translateX(-50%)", width: "34%", height: "34%", background: "#FF6E8E", clipPath: "polygon(50% 100%, 0 38%, 22% 12%, 50% 30%, 78% 12%, 100% 38%)" }) : "";
  return div({ position: "absolute", left: cx, top: y, transform: "translate(-50%,-50%)", width: r * 1.9, height: r * 2.35, borderRadius: "50%", background: "radial-gradient(circle at 50% 60%, #4a3f4a, #2a2530)", zIndex: 4 }, hl + sp + ht);
}
function closedEye(cx, y, w) {
  return div({ position: "absolute", left: cx, top: y, transform: "translate(-50%,-50%)", width: w, height: w * 0.5, borderBottom: `${Math.max(2.5, w * 0.17)}px solid #2a2530`, borderRadius: "0 0 90% 90%", zIndex: 4 });
}
function warmEye(cx, y, r) {
  const t = Math.max(3, r * 0.34);
  return div({ position: "absolute", left: cx, top: y, transform: "translate(-50%,-50%)", width: r * 1.9, height: r * 1.0, zIndex: 4 },
    div({ position: "absolute", bottom: 0, left: 0, width: "100%", height: "100%", borderBottom: `${t}px solid #2a2530`, borderRadius: "0 0 70% 70%" }));
}
function scrunchEye(cx, y, r, dir) {
  const t = Math.max(3, r * 0.42);
  const s = r * 1.5;
  const o = { position: "absolute", left: cx, top: y, transform: `translate(-50%,-50%) rotate(${dir === "gt" ? 45 : -45}deg)`, width: s, height: s, borderTop: `${t}px solid #2a2530`, borderRadius: "4px", boxSizing: "border-box", zIndex: 4 };
  o[dir === "gt" ? "borderRight" : "borderLeft"] = `${t}px solid #2a2530`;
  return div(o);
}
function glamEye(cx, y, r, side) {
  const outer = side === "l" ? -1 : 1;
  const lashes = [0, 1]
    .map((i) => {
      const o = { position: "absolute", top: `${4 + i * 6}%`, width: r * (0.68 - i * 0.12), height: Math.max(1.5, r * 0.12), background: "#221d28", borderRadius: 999, transformOrigin: outer < 0 ? "right center" : "left center", transform: `rotate(${outer * (-46 + i * 22)}deg)` };
      if (outer < 0) o.left = `${-4 + i * 2}%`;
      else o.right = `${-4 + i * 2}%`;
      return div(o);
    })
    .join("");
  const pupil = div({ position: "relative", width: r * 2, height: r * 2.5, borderRadius: "50%", background: "radial-gradient(circle at 50% 62%, #4a3f4a, #221d28)" },
    div({ position: "absolute", top: "12%", left: "18%", width: "48%", height: "44%", borderRadius: "50%", background: "#fff" }) +
    div({ position: "absolute", bottom: "14%", right: "18%", width: "26%", height: "26%", borderRadius: "50%", background: "rgba(255,255,255,0.9)" }) +
    lashes);
  const star = `<div class="sparkle-tw" style="${st({ position: "absolute", top: -r * 0.55, left: outer < 0 ? -r * 0.4 : r * 1.4, color: "#fff", fontSize: r * 0.95, lineHeight: 1, textShadow: "0 0 5px rgba(255,255,255,0.9)" })}">✦</div>`;
  return div({ position: "absolute", left: cx, top: y, transform: "translate(-50%,-50%)", zIndex: 4 }, pupil + star);
}
function mouth(cx, y, body, big, conf) {
  if (big) {
    return div({ position: "absolute", left: cx, top: y, transform: "translate(-50%,-50%)", width: body * 0.2, height: body * 0.16, background: "#7a2f3a", borderRadius: "40% 40% 100% 100%", zIndex: 4 },
      div({ position: "absolute", bottom: "6%", left: "50%", transform: "translateX(-50%)", width: "56%", height: "40%", background: "#FF8FA3", borderRadius: "50%" }));
  }
  if (conf) {
    return div({ position: "absolute", left: cx, top: y, transform: "translate(-50%,-50%)", width: body * 0.2, height: body * 0.1, borderBottom: `${Math.max(2.5, body * 0.03)}px solid #8a4a55`, borderRadius: "0 0 80% 80%", zIndex: 4 });
  }
  return div({ position: "absolute", left: cx, top: y, transform: "translate(-50%,-50%)", width: body * 0.12, height: body * 0.07, borderBottom: `${Math.max(2.5, body * 0.028)}px solid #7a4a52`, borderRadius: "0 0 90% 90%", zIndex: 4 });
}
function sparkle(x, y, s, c = "#fff") {
  return `<div class="sparkle-tw" style="${st({ position: "absolute", left: x, top: y, width: s, height: s, transform: "translate(-50%,-50%)", color: c, fontSize: s, lineHeight: 1, textShadow: "0 0 5px rgba(255,255,255,0.8)", zIndex: 5 })}">✦</div>`;
}
function cssHeart(size, cx, top) {
  return div({ position: "absolute", left: cx - size / 2, top, width: size, height: size, zIndex: 5 },
    div({ width: "100%", height: "100%", background: "#FF6E8E", clipPath: "polygon(50% 100%, 3% 40%, 22% 8%, 50% 28%, 78% 8%, 97% 40%)", boxShadow: "0 2px 5px rgba(255,110,142,0.4)" }));
}

/* ── 시그니처 장식 ── */
function feature(type, S, cx, body, bodyTop, eyeY, eyeDx, eyeR, c, stage) {
  if (type === "glasses") {
    const lr = eyeR * 1.6;
    const lens = (sx) =>
      div({ position: "absolute", left: cx + sx, top: eyeY, transform: "translate(-50%,-50%)", width: lr * 2, height: lr * 2, borderRadius: "50%", border: `${Math.max(3, eyeR * 0.42)}px solid #3a3340`, background: "rgba(180,210,255,0.22)", zIndex: 6 },
        div({ position: "absolute", top: "14%", left: "16%", width: "40%", height: "30%", borderRadius: "50%", background: "rgba(255,255,255,0.7)" }));
    return lens(-eyeDx) + lens(eyeDx) +
      div({ position: "absolute", left: cx, top: eyeY, transform: "translate(-50%,-50%)", width: eyeDx * 2 - lr * 1.6, height: Math.max(3, eyeR * 0.42), background: "#3a3340", borderRadius: 4, zIndex: 6 });
  }
  if (type === "flame") {
    const fw = body * 0.36;
    return `<div class="flame-flick" style="${st({ position: "absolute", left: cx, top: bodyTop - fw * 0.62, transform: "translateX(-50%)", width: fw, height: fw * 1.3, background: "linear-gradient(to top,#FF6B3D,#FFC24B)", borderRadius: "50% 50% 50% 50% / 64% 64% 38% 38%", filter: "drop-shadow(0 0 6px rgba(255,140,60,0.5))", zIndex: 2 })}">${div({ position: "absolute", left: "28%", bottom: "12%", width: "44%", height: "50%", background: "linear-gradient(to top,#FFE08A,#fff6cf)", borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%" })}</div>`;
  }
  if (type === "heart") {
    return cssHeart(body * 0.16, cx + body * 0.34, bodyTop + body * 0.06) + sparkle(cx - body * 0.36, bodyTop + body * 0.22, body * 0.1);
  }
  if (type === "wand") {
    const handX = cx + body * 0.6, handY = bodyTop + body * 0.64;
    const bolt = div({ position: "absolute", left: cx - body * 0.02, top: bodyTop - body * 0.2, transform: "translateX(-50%) rotate(6deg)", width: body * 0.22, height: body * 0.32, background: "linear-gradient(160deg,#FFE890,#FFC107)", clipPath: "polygon(60% 0, 100% 0, 52% 42%, 86% 42%, 18% 100%, 44% 52%, 8% 52%)", filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.2))", zIndex: 2 });
    const wand = div({ position: "absolute", left: handX, top: handY, transform: "translate(-50%,-100%) rotate(20deg)", transformOrigin: "bottom center", width: body * 0.36, height: body * 0.5, zIndex: 5 },
      div({ position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%)", width: Math.max(3, body * 0.05), height: "100%", background: "linear-gradient(to top,#C99B3F,#FFE9A8)", borderRadius: 999, boxShadow: "0 2px 4px rgba(0,0,0,0.12)" }) +
      `<div style="${st({ position: "absolute", left: "50%", top: 0, transform: "translate(-50%,-55%)", fontSize: body * 0.34, lineHeight: 1, color: "#FFD24A", textShadow: "0 0 8px rgba(255,200,60,0.95)" })}">★</div>` +
      `<div style="${st({ position: "absolute", left: "50%", top: 0, transform: "translate(-160%,-30%)", fontSize: body * 0.12, lineHeight: 1, color: "#fff" })}">✦</div>`);
    return bolt + wand;
  }
  if (type === "cool") {
    return div({ position: "absolute", left: cx - body * 0.22, top: bodyTop - body * 0.08, width: body * 0.4, height: body * 0.28, borderRadius: "90% 20% 70% 30%", background: `linear-gradient(125deg, ${mix(c.color2, "#000000", 0.12)}, ${c.color2})`, transform: "rotate(-12deg)", zIndex: 2 }) +
      div({ position: "absolute", left: cx + body * 0.04, top: bodyTop - body * 0.05, width: body * 0.26, height: body * 0.22, borderRadius: "20% 90% 30% 70%", background: `linear-gradient(235deg, ${mix(c.color2, "#000000", 0.12)}, ${c.color2})`, transform: "rotate(10deg)", zIndex: 2 }) +
      sparkle(cx + body * 0.4, bodyTop + body * 0.12, body * 0.15) +
      sparkle(cx - body * 0.42, bodyTop + body * 0.34, body * 0.1) +
      sparkle(cx + body * 0.34, bodyTop + body * 0.52, body * 0.08);
  }
  if (type === "warm") {
    const cw = body * 0.52, ch = body * 0.46;
    const coneLeft = cx - cw * 0.5, coneTop = bodyTop - body * 0.42, apexX = coneLeft + cw * 0.74, cap = "#EBA6C0";
    const bub = (x, y, w) => div({ position: "absolute", left: x, top: y, width: w, height: w, borderRadius: "50%", background: "radial-gradient(circle at 36% 32%, rgba(255,255,255,0.92), rgba(216,234,255,0.5) 56%, rgba(188,214,255,0.32))", border: "1.5px solid rgba(255,255,255,0.85)", boxShadow: "0 2px 6px rgba(120,140,180,0.25), inset 0 0 6px rgba(255,255,255,0.6)", zIndex: 6 },
      div({ position: "absolute", top: "18%", left: "22%", width: "30%", height: "24%", borderRadius: "50%", background: "rgba(255,255,255,0.95)" }));
    return div({ position: "absolute", left: coneLeft, top: coneTop, width: cw, height: ch, background: `linear-gradient(150deg, ${cap}, ${mix(cap, "#000000", 0.1)})`, clipPath: "polygon(74% 0, 0 100%, 100% 100%)", zIndex: 2 }) +
      div({ position: "absolute", left: cx - body * 0.31, top: coneTop + ch - body * 0.09, width: body * 0.62, height: body * 0.17, borderRadius: 999, background: "#fff", boxShadow: "inset 0 -2px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.1)", zIndex: 3 }) +
      div({ position: "absolute", left: apexX - body * 0.08, top: coneTop - body * 0.05, width: body * 0.16, height: body * 0.16, borderRadius: "50%", background: "#fff", boxShadow: "0 2px 3px rgba(0,0,0,0.12)", zIndex: 4 }) +
      bub(cx + body * 0.34, bodyTop + body * 0.72, body * 0.26) +
      bub(cx - body * 0.52, bodyTop + body * 0.06, body * 0.15);
  }
  if (type === "mystic") {
    return sparkle(cx + body * 0.36, bodyTop + body * 0.06, body * 0.14, "#fff0c0") +
      sparkle(cx - body * 0.38, bodyTop + body * 0.3, body * 0.1, "#e6d3ff") +
      sparkle(cx + body * 0.3, bodyTop + body * 0.46, body * 0.08, "#fff") +
      `<div style="${st({ position: "absolute", left: cx, top: bodyTop + body * 0.12, transform: "translateX(-50%)", color: "#fff", fontSize: body * 0.15, lineHeight: 1, textShadow: "0 0 6px rgba(255,255,255,0.9)", zIndex: 5 })}">✦</div>`;
  }
  if (type === "laugh") {
    let out = sparkle(cx + body * 0.36, bodyTop + body * 0.16, body * 0.11, "#fff3b0") +
      sparkle(cx - body * 0.36, bodyTop + body * 0.3, body * 0.09, "#fff3b0");
    if (stage >= 3) {
      out += `<div style="${st({ position: "absolute", left: cx + body * 0.38, top: bodyTop + body * 0.3, transform: "translate(-50%,-50%) rotate(12deg)", color: mix(c.color2, "#000000", 0.34), fontSize: body * 0.3, lineHeight: 1, fontWeight: 700, textShadow: "0 1px 2px rgba(0,0,0,0.15)" })}">♪</div>`;
      out += `<div style="${st({ position: "absolute", left: cx - body * 0.4, top: bodyTop + body * 0.12, transform: "translate(-50%,-50%) rotate(-14deg)", color: mix(c.color2, "#000000", 0.34), fontSize: body * 0.24, lineHeight: 1, fontWeight: 700, textShadow: "0 1px 2px rgba(0,0,0,0.15)" })}">♫</div>`;
    }
    return out;
  }
  return "";
}

/* ── 1단계: 공통 새싹 아기 ── */
function sproutBaby(S, bob) {
  const cx = S / 2, body = S * 0.56, bodyW = body * 1.04, bodyH = body;
  const bodyTop = (S - bodyH) / 2 + S * 0.045, bodyLeft = cx - bodyW / 2;
  const bodyCY = bodyTop + bodyH / 2, bodyBottom = bodyTop + bodyH;
  const eyeR = body * 0.14, eyeDx = body * 0.2, eyeY = bodyCY + body * 0.05, mouthY = eyeY + body * 0.16;
  const main = "#FFEBD9", shade = "#F3CFAE", footc = "#EBBE94";
  const leaf = div({ position: "absolute", left: cx, top: bodyTop - body * 0.32, transform: "translateX(-50%)", width: body * 0.52, height: body * 0.34, zIndex: 1 },
    div({ position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%)", width: Math.max(3, body * 0.04), height: body * 0.2, background: "#86C66B", borderRadius: 6 }) +
    div({ position: "absolute", left: "50%", top: 0, transformOrigin: "bottom right", transform: "translateX(-84%) rotate(-28deg)", width: body * 0.28, height: body * 0.19, background: "linear-gradient(135deg,#AEE894,#84CB60)", borderRadius: "0 100% 0 100%" }) +
    div({ position: "absolute", left: "50%", top: 0, transformOrigin: "bottom left", transform: "translateX(-16%) rotate(28deg)", width: body * 0.28, height: body * 0.19, background: "linear-gradient(225deg,#AEE894,#84CB60)", borderRadius: "100% 0 100% 0" }));
  const bodyEl = div({ position: "absolute", left: bodyLeft, top: bodyTop, width: bodyW, height: bodyH, borderRadius: "50% 50% 48% 48% / 52% 52% 48% 48%", background: `radial-gradient(circle at 36% 28%, ${mix(main, "#ffffff", 0.4)} 0%, ${main} 56%, ${shade} 100%)`, boxShadow: `inset 0 ${-bodyH * 0.1}px ${bodyH * 0.16}px ${shade}, inset 0 ${bodyH * 0.06}px ${bodyH * 0.1}px rgba(255,255,255,0.55), 0 8px 18px rgba(120,90,110,0.16)` },
    div({ position: "absolute", top: "8%", left: "24%", width: "40%", height: "26%", borderRadius: "50%", background: "rgba(255,255,255,0.5)", filter: "blur(2px)" }));
  const inner =
    div({ position: "absolute", left: cx, bottom: S * 0.05, transform: "translateX(-50%)", width: body * 0.66, height: body * 0.13, borderRadius: "50%", background: "rgba(90,60,75,0.16)", filter: "blur(3px)" }) +
    foot(cx - body * 0.16, bodyBottom - body * 0.05, body * 0.26, footc) +
    foot(cx + body * 0.16, bodyBottom - body * 0.05, body * 0.26, footc) +
    hand(bodyLeft + body * 0.02, bodyCY + body * 0.12, body * 0.11, shade) +
    hand(bodyLeft + bodyW - body * 0.02, bodyCY + body * 0.12, body * 0.11, shade) +
    leaf + bodyEl +
    cheek(cx - body * 0.26, eyeY + body * 0.13, body * 0.16) +
    cheek(cx + body * 0.26, eyeY + body * 0.13, body * 0.16) +
    eye(cx - eyeDx, eyeY, eyeR) + eye(cx + eyeDx, eyeY, eyeR) +
    mouth(cx, mouthY, body);
  return `<div class="${bob ? "char-bob" : ""}" style="${st({ width: S, height: S, position: "relative", display: "inline-block" })}">${inner}</div>`;
}

/* ── 0단계: 알 (눈 감음) ── */
function egg(S, bob) {
  const cx = S / 2, eggW = S * 0.5, eggH = S * 0.62;
  const eggTop = (S - eggH) / 2 + S * 0.015, eggLeft = cx - eggW / 2;
  const eggCY = eggTop + eggH / 2, eggBottom = eggTop + eggH;
  const eyeDx = eggW * 0.21, eyeY = eggCY + eggH * 0.08, mouthY = eyeY + eggH * 0.13;
  const bodyEl = div({ position: "absolute", left: eggLeft, top: eggTop, width: eggW, height: eggH, borderRadius: "50% 50% 49% 49% / 60% 60% 42% 42%", background: "radial-gradient(circle at 38% 26%, #FFFEFA 0%, #FCEFDF 56%, #F2DBC0 100%)", boxShadow: `inset 0 ${-eggH * 0.13}px ${eggH * 0.16}px rgba(214,176,132,0.55), inset 0 ${eggH * 0.06}px ${eggH * 0.1}px rgba(255,255,255,0.75), 0 8px 18px rgba(120,90,110,0.16)`, overflow: "hidden" },
    div({ position: "absolute", top: "9%", left: "20%", width: "34%", height: "22%", borderRadius: "50%", background: "rgba(255,255,255,0.6)", filter: "blur(2px)" }));
  const inner =
    div({ position: "absolute", left: cx, bottom: S * 0.06, transform: "translateX(-50%)", width: eggW * 0.7, height: eggW * 0.16, borderRadius: "50%", background: "rgba(90,60,75,0.15)", filter: "blur(3px)" }) +
    foot(cx - eggW * 0.18, eggBottom - eggW * 0.04, eggW * 0.26, "#EBBE94") +
    foot(cx + eggW * 0.18, eggBottom - eggW * 0.04, eggW * 0.26, "#EBBE94") +
    bodyEl +
    cheek(cx - eggW * 0.27, eyeY + eggH * 0.05, eggW * 0.15) +
    cheek(cx + eggW * 0.27, eyeY + eggH * 0.05, eggW * 0.15) +
    closedEye(cx - eyeDx, eyeY, eggW * 0.2) + closedEye(cx + eyeDx, eyeY, eggW * 0.2) +
    mouth(cx, mouthY, eggW);
  return `<div class="${bob ? "char-bob" : ""}" style="${st({ width: S, height: S, position: "relative", display: "inline-block" })}">${inner}</div>`;
}

/* ── 메인 렌더러 ── */
export function renderCharacter(code, stage, size = 180, bob = true) {
  const S = size;
  if (stage <= 0) return egg(S, bob);
  if (stage === 1) return sproutBaby(S, bob);

  const c = CHARACTERS[code] || CHARACTERS.cute;
  const cx = S / 2;
  const bodyScale = stage === 2 ? 0.68 : 0.76;
  const body = S * bodyScale;
  const featOp = stage === 2 ? 0.6 : 1;
  const mainCol = stage === 2 ? mix(c.color, "#ffffff", 0.22) : c.color;
  const shadeCol = stage === 2 ? mix(c.color2, "#ffffff", 0.16) : c.color2;
  const footCol = mix(c.color2, "#000000", 0.06);

  const bodyW = body * 1.04, bodyH = body;
  const bodyTop = (S - bodyH) / 2 + S * 0.03, bodyLeft = cx - bodyW / 2;
  const bodyCY = bodyTop + bodyH / 2, bodyBottom = bodyTop + bodyH;
  const eyeR = body * 0.13, eyeDx = body * 0.205, eyeY = bodyCY + body * 0.04, mouthY = eyeY + body * 0.17;

  const f = c.feature;
  const happy = f === "laugh", cool = f === "cool", warm = f === "warm";
  const bigCheek = f === "heart" || f === "warm";

  let eyes;
  if (happy) eyes = scrunchEye(cx - eyeDx, eyeY, eyeR, "gt") + scrunchEye(cx + eyeDx, eyeY, eyeR, "lt");
  else if (cool) eyes = glamEye(cx - eyeDx, eyeY, eyeR, "l") + glamEye(cx + eyeDx, eyeY, eyeR, "r");
  else if (warm) eyes = warmEye(cx - eyeDx, eyeY, eyeR) + warmEye(cx + eyeDx, eyeY, eyeR);
  else { const heart = f === "heart" && stage >= 3; eyes = eye(cx - eyeDx, eyeY, eyeR, heart) + eye(cx + eyeDx, eyeY, eyeR, heart); }

  const bodyEl = div({ position: "absolute", left: bodyLeft, top: bodyTop, width: bodyW, height: bodyH, borderRadius: "50% 50% 48% 48% / 52% 52% 48% 48%", background: `radial-gradient(circle at 36% 28%, ${mix(mainCol, "#ffffff", 0.42)} 0%, ${mainCol} 56%, ${shadeCol} 100%)`, boxShadow: `inset 0 ${-bodyH * 0.1}px ${bodyH * 0.16}px ${shadeCol}, inset 0 ${bodyH * 0.06}px ${bodyH * 0.1}px rgba(255,255,255,0.5), 0 8px 20px rgba(120,90,110,0.16)` },
    div({ position: "absolute", top: "8%", left: "24%", width: "40%", height: "26%", borderRadius: "50%", background: "rgba(255,255,255,0.55)", filter: "blur(2px)" }));

  const featureLayer = div({ position: "absolute", inset: 0, opacity: featOp, transition: "opacity .4s" },
    feature(f, S, cx, body, bodyTop, eyeY, eyeDx, eyeR, c, stage));

  const inner =
    div({ position: "absolute", left: cx, bottom: S * 0.05, transform: "translateX(-50%)", width: body * 0.66, height: body * 0.13, borderRadius: "50%", background: "rgba(90,60,75,0.16)", filter: "blur(3px)" }) +
    foot(cx - body * 0.16, bodyBottom - body * 0.05, body * 0.26, footCol) +
    foot(cx + body * 0.16, bodyBottom - body * 0.05, body * 0.26, footCol) +
    hand(bodyLeft + body * 0.02, bodyCY + body * 0.12, body * 0.11, shadeCol) +
    hand(bodyLeft + bodyW - body * 0.02, bodyCY + body * 0.12, body * 0.11, shadeCol) +
    bodyEl +
    cheek(cx - body * 0.26, eyeY + body * 0.13, body * (bigCheek ? 0.21 : 0.16)) +
    cheek(cx + body * 0.26, eyeY + body * 0.13, body * (bigCheek ? 0.21 : 0.16)) +
    eyes +
    mouth(cx, mouthY, body, happy, cool) +
    featureLayer;

  return `<div class="${bob ? "char-bob" : ""}" style="${st({ width: S, height: S, position: "relative", display: "inline-block" })}">${inner}</div>`;
}
