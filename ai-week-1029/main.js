// AI 위클리 · 10월 마지막 주 (26–29 Oct 2026) — Broadcast News Package
// Canvas 2D, deterministic render(t). 120 BPM grid, beat 0 = 5.5 s (end of the sting, after a 4 s cold open).
// No burned-in subtitles, no crawl: the strap stays from the first story to the recap; subtitles ship as a sidecar .srt (CUES → tools/subs.py).
// Package-part techniques (strap, split-flap, band wipe, plate) follow the library's news-package demo; story, shots and timings are this film's own.
const W = 1920, H = 1080, DUR = 68.0;
const HANDLE = '@noah.aiart';   // the maker's handle: under the bug, in the strap's end block, on the end card
const cv = document.getElementById('out'); let ctx = cv.getContext('2d');

const C = {
  ink: '#121417', ink2: '#1B1E23', ink3: '#22262C', line: '#454B55',
  lemon: '#F2CF1D', lemonL: '#F8DE4A', lemonD: '#D8B30C', gold: '#D4B064',
  paper: '#F4F1E8', olive: '#6E5A1E', white: '#FFFFFF', grey: '#C9CCD2', grey2: '#7D838D',
};
const F = {
  kr9: s => `900 ${s}px SansKR`, kr7: s => `700 ${s}px SansKR`,
  b8: s => `800 ${s}px Barlow`, b6: s => `600 ${s}px Barlow`, b6i: s => `italic 600 ${s}px Barlow`, mono: s => `500 ${s}px Plex`,
};

// —— Helpers ——
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const eo = x => 1 - Math.pow(1 - x, 3);
const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const ieio = y => y < .5 ? Math.cbrt(y / 4) : 1 - Math.cbrt(2 * (1 - y)) / 2;   // inverse of eio
const back = (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const h = (a, b) => hash(a * 57.3 + b * 113.1), s = v => v * v * (3 - 2 * v);
  return lerp(lerp(h(xi, yi), h(xi + 1, yi), s(xf)), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), s(xf)), s(yf));
}

// —— Text registry (TEXTS is used by readcheck) ——
let TX = [];
function text(s, x, y, font, color, align = 'left', ls = 0, id = null) {
  ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  ctx.letterSpacing = ls + 'px'; ctx.fillText(s, x, y);
  const w = ctx.measureText(s).width; ctx.letterSpacing = '0px';
  if (id) { const m = ctx.getTransform(); const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2; const fs = parseInt(font.match(/(\d+)px/)[1]);
    const p0 = m.transformPoint({ x: x0, y: y - fs }), p1 = m.transformPoint({ x: x0 + w, y: y + 8 });
    TX.push({ id, text: s, x0: Math.min(p0.x, p1.x), y0: Math.min(p0.y, p1.y), x1: Math.max(p0.x, p1.x), y1: Math.max(p0.y, p1.y) }); }
  return w;
}
function tw(s, font, ls = 0) { ctx.font = font; ctx.letterSpacing = ls + 'px'; const w = ctx.measureText(s).width; ctx.letterSpacing = '0px'; return w; }
// largest size ≤ size at which s fits in maxW
function fit(s, f, size, maxW, ls = 0) { while (size > 12 && tw(s, f(size), ls) > maxW) size--; return f(size); }
// Korean label + smaller English label on one line; returns the total width
function bi(kr, en, x, y, ks, es, kc, ec, id = null, krF = F.kr9, enF = F.b6) {
  const w1 = text(kr, x, y, krF(ks), kc, 'left', 0, id); const w2 = text(en, x + w1 + 14, y - 1, enF(es), ec, 'left', 2);
  return w1 + 14 + w2;
}
function biW(kr, en, ks, es, krF = F.kr9, enF = F.b6) { return tw(kr, krF(ks)) + 14 + tw(en, enF(es), 2); }

function vignette(a = .5) {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .95);
  g.addColorStop(0, 'rgba(8,9,11,0)'); g.addColorStop(1, `rgba(8,9,11,${a})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function dots(t, a = .04, sp = 10) {
  ctx.fillStyle = `rgba(244,241,232,${a})`;
  for (let x = 40 - (t * sp) % 48; x < W; x += 48) for (let y = 24; y < H; y += 48) ctx.fillRect(x, y, 2, 2);
}
function studioBg(t) {
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  const rg = ctx.createRadialGradient(1300, 380, 60, 1300, 380, 1100); rg.addColorStop(0, 'rgba(242,207,29,.14)'); rg.addColorStop(1, 'rgba(242,207,29,0)');
  ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 7; i++) {   // slanted light fins, slow drift
    const x = ((i * 380 + t * (30 + i * 6)) % 2600) - 400, w = 40 + hash(i) * 120;
    ctx.fillStyle = `rgba(242,207,29,${.022 + hash(i + 9) * .03})`;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + w, 0); ctx.lineTo(x + w - 500, H); ctx.lineTo(x - 500, H); ctx.fill();
  }
  dots(t, .045, 12);
}
// stamp: accent fill (or ink with a double accent frame), lands from 1.9× in 0.16 s with an expanding ellipse
function stamp(t, t0, cx, cy, kr, en, rot = -.12, ink = false, id = null, ks = 40, es = 34) {
  const k = seg(t, t0, t0 + .16); if (k <= 0) return;
  const s = 1 + .9 * (1 - eo(k)), lw = biW(kr, en, ks, es, F.kr9, F.b8) + 52, h = ks + 40;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
  const r = seg(t, t0 + .12, t0 + .55);
  if (r > 0 && r < 1) { ctx.strokeStyle = `rgba(242,207,29,${.8 * (1 - r)})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(0, 0, lw * (.55 + r * .5), h * (.7 + r * .9), 0, 0, Math.PI * 2); ctx.stroke(); }
  ctx.scale(s, s); ctx.globalAlpha *= clamp(k * 3);
  if (ink) { ctx.fillStyle = C.ink; ctx.fillRect(-lw / 2, -h / 2, lw, h); ctx.strokeStyle = C.lemon; ctx.lineWidth = 4; ctx.strokeRect(-lw / 2 + 6, -h / 2 + 6, lw - 12, h - 12); ctx.lineWidth = 2; ctx.strokeRect(-lw / 2 + 13, -h / 2 + 13, lw - 26, h - 26); }
  else { ctx.fillStyle = C.lemon; ctx.fillRect(-lw / 2, -h / 2, lw, h); }
  const col = ink ? C.lemon : C.ink;
  const w1 = text(kr, -lw / 2 + 26, ks * .38, F.kr9(ks), col, 'left', 0, id); text(en, -lw / 2 + 26 + w1 + 14, ks * .36, F.b8(es), col, 'left', 2);
  ctx.restore();
}
// title pushed up from a mask; never drawn at progress 0
function pushUp(t, t0, s, x, y, font, color, id, d = .35, maskW = 1300) {
  const k = eo(seg(t, t0, t0 + d)); if (k <= 0) return 0;
  const fs = parseInt(font.match(/(\d+)px/)[1]);
  ctx.save(); ctx.beginPath(); ctx.rect(x - 20, y - fs * 1.05, maskW, fs * 1.3); ctx.clip();
  const w = text(s, x, y + (1 - k) * fs * 1.4, font, color, 'left', 1, k >= 1 ? id : null); ctx.restore();
  return w;
}
function eyebrow(t, t0, s, x, y, id) { ctx.globalAlpha = eo(seg(t, t0, t0 + .2)); text(s, x, y, F.mono(22), C.gold, 'left', 3, id); ctx.globalAlpha = 1; }
function card(x, y, w, h, top = C.lemon) {
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(x + 16, y + 20, w, h);
  ctx.fillStyle = C.ink2; ctx.fillRect(x, y, w, h); ctx.fillStyle = top; ctx.fillRect(x, y, w, 6);
}

// —— Channel plate: lemon parallelogram, ink and gold bars, "AI" ——
function plate(cx, cy, s, glint = -1, drop = 1) {
  const w = 520 * s, h = 180 * s, k = h * .28;
  ctx.save(); ctx.translate(cx, cy);
  const path = new Path2D(); path.moveTo(-w / 2 + k, -h / 2); path.lineTo(w / 2 + k, -h / 2); path.lineTo(w / 2 - k, h / 2); path.lineTo(-w / 2 - k, h / 2); path.closePath();
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, C.lemonL); g.addColorStop(1, C.lemonD);
  ctx.fillStyle = g; ctx.fill(path);
  ctx.save(); ctx.clip(path);
  const gx = -w / 2 - k;
  ctx.fillStyle = C.ink; ctx.beginPath(); ctx.moveTo(gx + 2 * k, -h / 2); ctx.lineTo(gx + 2 * k + w * .085, -h / 2); ctx.lineTo(gx + w * .085, h / 2); ctx.lineTo(gx, h / 2); ctx.fill();
  ctx.fillStyle = C.gold; ctx.beginPath(); ctx.moveTo(gx + 2 * k + w * .085, -h / 2); ctx.lineTo(gx + 2 * k + w * .11, -h / 2); ctx.lineTo(gx + w * .11, h / 2); ctx.lineTo(gx + w * .085, h / 2); ctx.fill();
  ctx.font = F.b8(h * .8); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  let x = -w * .14;
  ['A', 'I', '·', 'W'].forEach((L, i) => {
    const d = clamp(drop * 4 - i), yy = h * .29 + (1 - eo(d)) * -h * 1.1;
    ctx.save(); ctx.globalAlpha = ctx.globalAlpha * clamp(d * 3); ctx.fillStyle = C.ink; ctx.fillText(L, x, yy); ctx.restore();
    x += ctx.measureText(L).width + h * .02;
  });
  if (glint >= 0 && glint <= 1) {
    const gx2 = lerp(-w, w, glint), gg = ctx.createLinearGradient(gx2 - 80 * s, 0, gx2 + 80 * s, 0);
    gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(.5, 'rgba(255,255,255,.6)'); gg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gg; ctx.fillRect(-w, -h, w * 2, h * 2);
  }
  ctx.restore(); ctx.restore();
}
function wordmark(x, y, size, align = 'center', id = null) {
  const parts = [['AI ', C.lemon], ['WEEKLY', C.white]], ls = size * .14;
  const tot = parts.reduce((a, [s]) => a + tw(s, F.b8(size), ls), 0);
  let cx = align === 'center' ? x - tot / 2 : align === 'right' ? x - tot : x;
  const x0 = cx; for (const [s, c] of parts) cx += text(s, cx, y, F.b8(size), c, 'left', ls);
  if (id) TX.push({ id, text: 'AI WEEKLY', x0, y0: y - size, x1: cx, y1: y + 8 });
}

// ============ Package layer ============
const STRAP = { a: 10.5, out: 53.0, items: [
  { a: 10.5, tab: ['모델', 'MODELS'], kr: 'OpenAI, GPT-6.1 Terra 출시', en: 'OPENAI LAUNCHES GPT-6.1 TERRA FOR COMPUTER USE' },
  { a: 16.0, tab: ['모델', 'MODELS'], kr: 'GPT-6.1 Terra, API 가격 절반으로', en: 'API PRICES 50% BELOW GPT-5.6 TERRA' },
  { a: 21.0, tab: ['시장', 'MARKETS'], kr: 'Anthropic, 상장 신청서 S-1 제출', en: 'ANTHROPIC FILES AN S-1 FOR A PROPOSED IPO' },
  { a: 26.5, tab: ['시장', 'MARKETS'], kr: '티커 ANT · 공모가 범위 미정', en: 'TICKER "ANT" · PRICE RANGE NOT YET SET' },
  { a: 31.0, tab: ['인프라', 'INFRASTRUCTURE'], kr: 'NVIDIA·Oracle, Vera Rubin 기가와트급 확대', en: 'NVIDIA AND ORACLE TAKE VERA RUBIN TO MULTI-GIGAWATT SCALE' },
  { a: 44.0, tab: ['연구', 'RESEARCH'], kr: 'Google DeepMind, 세계 생성 모델 Genie 4 공개', en: 'GOOGLE DEEPMIND UNVEILS THE GENIE 4 WORLD MODEL' },
] };
function strap(t) {
  if (t < STRAP.a || t >= STRAP.out) return;
  let S = STRAP.items[0], prev = null; for (const it of STRAP.items) if (t >= it.a) { prev = S; S = it; }
  const x0 = 96, ty = 856, by = 904, bh = 104, bw = 1250;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x0 + 8, by + 8, bw, bh);
  ctx.fillStyle = C.paper; ctx.fillRect(x0, by, bw, bh);
  ctx.fillStyle = C.lemon; ctx.fillRect(x0, by, 14, bh);
  ctx.fillStyle = C.ink; ctx.fillRect(x0 + bw, by, 120, bh); ctx.fillStyle = C.lemon; ctx.fillRect(x0 + bw, by, 120, 6);
  text('AI·W', x0 + bw + 60, by + 56, F.b8(34), C.lemon, 'center', 1);
  text(HANDLE, x0 + bw + 60, by + 86, F.mono(13), C.paper, 'center', .5);
  ctx.save(); ctx.beginPath(); ctx.rect(x0 + 14, by, bw - 14, bh); ctx.clip();
  text(S.kr, x0 + 44, by + 58, fit(S.kr, F.kr9, 50, bw - 80), C.ink, 'left', 0, 'strap'); text(S.en, x0 + 46, by + 92, F.b6(27), C.olive, 'left', 1.5, 'strape');
  ctx.restore();
  const tabW = 40 + biW(S.tab[0], S.tab[1], 30, 30, F.kr9, F.b8);
  const flash = prev && prev !== S && prev.tab[0] !== S.tab[0] && t - S.a < .15;
  ctx.fillStyle = flash ? C.white : C.lemon; ctx.fillRect(x0, ty, tabW, by - ty);
  const w1 = text(S.tab[0], x0 + 20, ty + 37, F.kr9(30), C.ink); text(S.tab[1], x0 + 20 + w1 + 14, ty + 37, F.b8(30), C.ink, 'left', 2);
  ctx.restore();
}
// corner tag (top left), flips in and out vertically in 0.2 s
const TAGS = [[10.5, 16.0, 'ILLUSTRATION', '일러스트 · 코드로 그린 화면'], [33.0, 44.0, 'SCHEMATIC', '개념도 · 1칸 = GPU 1,000개'], [44.0, 53.0, 'ILLUSTRATION', '일러스트 · 코드로 그린 화면']];
function cornerTag(t) {
  const A = TAGS.find(r => t >= r[0] && t < r[1]); if (!A) return;
  // a tag that arrives mid-shot flips in; one that belongs to a picture from its first frame is simply there (wipes and cuts carry it)
  const sy = A[0] === 33.0 ? Math.max(.02, eo(seg(t, A[0], A[0] + .2))) : 1;
  const x = 96, y = 56, h = 64, w = 360;
  ctx.save(); ctx.translate(0, y + h / 2); ctx.scale(1, sy); ctx.translate(0, -(y + h / 2));
  ctx.fillStyle = 'rgba(18,20,23,.85)'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = C.gold; ctx.fillRect(x, y, 8, h);
  text(A[2], x + 26, y + 28, F.mono(18), C.gold, 'left', 2, sy > .9 ? 'tag' : null);
  text(A[3], x + 26, y + 54, F.kr7(20), C.white, 'left', 0, sy > .9 ? 'tagk' : null);
  ctx.restore();
}
function bug(t) {
  if (t < 5.45 || t > 61.4) return;
  ctx.globalAlpha = .95; plate(1739, 86, .327, -1, 1);
  text('WEEKLY', 1650, 96, F.b8(26), C.white, 'right', 3);
  ctx.globalAlpha = .8 * seg(t, 5.45, 5.7); text(HANDLE, 1836, 148, F.mono(18), C.paper, 'right', 1.5, 'handle'); ctx.globalAlpha = 1;
}
const SOURCES = [
  [0, 4.0, 'SOURCE: OPENAI API PRICING', '출처: OpenAI 가격표 · 이전 가격은 −50%에서 역산'],
  [10.5, 21.0, 'SOURCE: OPENAI · 26 OCT 2026', '출처: OpenAI 발표 · 개발자 문서'],
  [21.0, 31.0, 'SOURCE: ANTHROPIC NEWSROOM', '출처: Anthropic 보도자료 (2026.10.26)'],
  [31.0, 44.0, 'SOURCE: ORACLE · NVIDIA NEWSROOMS', '출처: Oracle · NVIDIA 보도자료, Oracle AI 인프라'],
  [44.0, 53.0, 'SOURCE: GOOGLE DEEPMIND BLOG', '출처: Google DeepMind 블로그 (2026.10.27)'],
  [57.0, 61.5, 'SOURCE: ANTHROPIC NEWSROOM', '출처: Anthropic 보도자료 (2026.10.26)'],
];
function credit(t) {
  const R = SOURCES.find(r => t >= r[0] && t < r[1]); if (!R) return;
  ctx.save(); ctx.globalAlpha = .75; text(R[2], 1836, 950, F.mono(13), C.paper, 'right', .5); text(R[3], 1836, 978, F.kr7(16), C.paper, 'right', .5); ctx.restore();
}

// Sidecar subtitles (.srt), timed from vo/dur.json; nothing is burned into the picture
const VO_AT = { v0: .5, v1: 5.6, v2: 10.6, v3: 16.1, v4: 21.1, v5: 26.6, v6: 31.1, v7a: 37.6, v7b: 40.6, v8: 44.1, v9: 49.6, v10: 53.1, v11: 57.1, v12: 62.0 };

// ============ Flip tiles ============
function flipTile(x, y, w, h, from, to, t0, t, font, col, id = null) {
  const p = from === null ? 1 : seg(t, t0, t0 + .26);
  const half = (s, top, sc = 1) => {
    ctx.save(); ctx.beginPath(); ctx.rect(x, top ? y : y + h / 2, w, h / 2); ctx.clip();
    ctx.translate(0, y + h / 2); ctx.scale(1, sc); ctx.translate(0, -(y + h / 2));
    ctx.fillStyle = top ? '#2B3038' : '#262A31'; ctx.fillRect(x, y, w, h);
    if (s) text(s, x + w / 2, y + h * .74, font, col, 'center');
    ctx.restore();
  };
  if (p >= 1) { half(to, true); half(to, false); }
  else if (p <= 0) { half(from, true); half(from, false); }
  else { half(to, true); half(from, false); if (p < .5) half(from, true, 1 - p * 2); else half(to, false, (p - .5) * 2); }
  ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x, y + h / 2 - 1.5, w, 3);
  if (id && p >= 1 && to) TX.push({ id, text: to, x0: x, y0: y, x1: x + w, y1: y + h });
}

// ============ Shots ============
// ⓪ Cold open: the price board, old and new on one board (0–4.0)
function shotCold(t) {
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H); dots(t, .04, 8);
  const z = lerp(1.0, 1.06, eio(seg(t, 0, 4.0)));
  ctx.save(); ctx.translate(960, 500); ctx.scale(z, z); ctx.translate(-960, -500);
  const k = back(seg(t, 0, .3), 1.3), X = 330, Y = 180, BW = 1120, BH = 600;
  ctx.globalAlpha = clamp(seg(t, 0, .3) * 4);
  ctx.save(); ctx.translate(0, (1 - k) * 60);
  card(X, Y, BW, BH);
  bi('100만 토큰당 API 가격', 'API PRICE PER 1M TOKENS', X + 50, Y + 74, 40, 26, C.white, C.gold, 'ch');
  text('OPENAI · MON 26 OCT 2026', X + BW - 50, Y + 72, F.mono(18), C.grey2, 'right', 2, 'cd');
  ctx.fillStyle = C.line; ctx.fillRect(X + 50, Y + 104, BW - 100, 2);
  const cx1 = X + 560, cx2 = X + 880, tw0 = 270, th = 120;
  const colh = (cx, kr, en) => { const w = biW(kr, en, 26, 22, F.kr7); bi(kr, en, cx - w / 2, Y + 160, 26, 22, C.white, C.grey, null, F.kr7); };
  colh(cx1, '입력', 'INPUT'); colh(cx2, '출력', 'OUTPUT');
  const row = (y, kr, en, idd) => { text(kr, X + 50, y + 58, F.b8(44), C.white, 'left', 1, idd); text(en, X + 52, y + 94, fit(en, F.kr7, 22, 300), C.grey, 'left', 0); };
  row(Y + 200, 'GPT-5.6 Terra', '이전 모델', 'cr1');
  flipTile(cx1 - tw0 / 2, Y + 200, tw0, th, null, '$2.00', 0, t, F.b8(84), C.paper, 'ct1');
  flipTile(cx2 - tw0 / 2, Y + 200, tw0, th, null, '$10.00', 0, t, F.b8(84), C.paper, 'ct2');
  row(Y + 360, 'GPT-6.1 Terra', '10월 26일 출시', 'cr2');
  flipTile(cx1 - tw0 / 2, Y + 360, tw0, th, '$2.00', '$1.00', 1.2, t, F.b8(84), C.lemon, 'ct3');
  flipTile(cx2 - tw0 / 2, Y + 360, tw0, th, '$10.00', '$5.00', 1.5, t, F.b8(84), C.lemon, 'ct4');
  ctx.restore(); ctx.globalAlpha = 1;
  const bk = seg(t, 2.05, 2.3);
  if (bk > 0) {
    const s = back(bk, 2.2); ctx.save(); ctx.translate(1640, 610); ctx.scale(s, s); ctx.rotate(-.08);
    text('−50%', 0, 30, F.b8(150), C.lemon, 'center', 0, 'cx');
    text('절반', 0, 100, F.kr9(48), C.white, 'center', 0, 'cxk');
    ctx.restore();
  }
  ctx.restore();
  vignette(.45);
}

// Sting (4.0–5.5): slashes, slam, letters drop, wordmark, glint, plate flies to the bug
function shotSting(t) {
  studioBg(t);
  const s = t - 4.0;
  [[.04, .3, 22, -60], [.1, .36, 8, 40]].forEach(([a, b, h, dy]) => {
    const k = seg(s, a, b); if (k <= 0 || k >= 1) return;
    ctx.save(); ctx.translate(960, 470 + dy); ctx.rotate(-.14);
    const x = lerp(-1900, 1900, eio(k)); ctx.fillStyle = C.lemon; ctx.fillRect(x - 700, -h / 2, 1400, h); ctx.restore();
  });
}
function stingLogo(t) {
  const s = t - 4.0; if (s < 0 || s > 1.5) return;
  const k = seg(s, .16, .42), fly = eio(seg(s, 1.12, 1.45));
  const shake = s > .42 && s < .7 ? Math.sin(s * 90) * 14 * (1 - seg(s, .42, .7)) : 0;
  const cx = lerp(960, 1739, fly) + shake, cy = lerp(450, 86, fly), sc = lerp(back(k, 2.2), .327, fly);
  if (k > 0) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate((1 - eo(k)) * -.12 * (1 - fly)); ctx.translate(-cx, -cy);
    plate(cx, cy, sc, seg(s, .85, 1.12) || -1, seg(s, .3, .7)); ctx.restore();
  }
  const r = seg(s, .42, .8); if (r > 0 && r < 1) { ctx.strokeStyle = `rgba(242,207,29,${1 - r})`; ctx.lineWidth = 6 * (1 - r) + 1; ctx.beginPath(); ctx.ellipse(960, 450, 300 + r * 700, 120 + r * 300, 0, 0, Math.PI * 2); ctx.stroke(); }
  const wa = seg(s, .5, .8), wo = 1 - seg(s, 1.05, 1.18);
  if (wa > 0 && wo > 0) {
    ctx.save(); ctx.globalAlpha = wo; ctx.beginPath(); ctx.rect(960 - 520 * eo(wa), 560, 1040 * eo(wa), 160); ctx.clip();
    wordmark(960, 640, 70, 'center');
    text('WEEK 44 · 26–29 OCT 2026', 960, 690, F.mono(22), C.gold, 'center', 3);
    ctx.restore();
  }
}

// Rundown (opens at 5.5, returns ticked at 53.0)
const ROWS = [
  ['01', 'OpenAI GPT-6.1 Terra 출시', 'OPENAI LAUNCHES GPT-6.1 TERRA', 'MON 26 OCT'],
  ['02', 'Anthropic 상장 신청서 제출', 'ANTHROPIC FILES FOR AN IPO', 'MON 26 OCT'],
  ['03', 'NVIDIA·Oracle 기가와트급 확대', 'VERA RUBIN AT GIGAWATT SCALE', 'TUE 27 OCT'],
  ['04', 'Google DeepMind Genie 4', 'GENIE 4 RESEARCH PREVIEW', 'TUE 27 OCT'],
];
const RD = { open: 5.25, close: 53.0, ticks: 53.9 };
function rundown(t, close) {
  studioBg(t);
  ctx.save(); ctx.translate(0, 100);
  const zs = close ? lerp(1.04, 1.0, eo(seg(t, 52.8, 53.8))) : lerp(1.0, 1.03, seg(t, 5.5, 10.5));
  ctx.translate(960, 420); ctx.scale(zs, zs); ctx.translate(-960, -420);
  const A0 = close ? RD.close - .3 : RD.open;
  const m = (a, b) => close ? eo(seg(t, A0 + a - RD.open, A0 + b - RD.open)) : eo(seg(t, a, b));
  const x = 120, ta = m(RD.open, RD.open + .25);
  const tab = close ? ['이번 주 정리', 'RECAP'] : ['이번 주 헤드라인', 'TOP STORIES'];
  const tabW = 40 + biW(tab[0], tab[1], 30, 30, F.kr9, F.b8);
  ctx.fillStyle = C.lemon; ctx.fillRect(x, 120, tabW * ta, 50);
  if (ta > .9) { const w1 = text(tab[0], x + 20, 158, F.kr9(30), C.ink, 'left', 0, 'rtab'); text(tab[1], x + 20 + w1 + 14, 158, F.b8(30), C.ink, 'left', 2); }
  const r = (y, h, k, fn) => { if (k <= 0) return; ctx.save(); ctx.beginPath(); ctx.rect(0, y - h, 780, h + 24); ctx.clip(); ctx.translate(0, (1 - k) * (h + 24)); fn(); ctx.restore(); };
  r(370, 170, m(5.45, 5.75), () => text('26–29', x - 6, 370, F.b8(180), C.white, 'left', 2, 'rdate'));
  r(460, 90, m(5.6, 5.9), () => text('OCT 2026', x, 460, F.b8(84), C.lemon, 'left', 4, 'rmon'));
  ctx.globalAlpha = m(5.85, 6.1); text('WEEK 44 · 10월 마지막 주', x, 512, F.mono(22), C.gold, 'left', 3, 'rwk'); ctx.globalAlpha = 1;
  r(606, 64, m(5.95, 6.25), () => text('이번 주 AI 네 가지', x, 606, F.kr9(54), C.white, 'left', 0, 'rtt'));
  ctx.globalAlpha = m(6.1, 6.35); text('THE WEEK IN AI · 4 STORIES', x + 2, 648, F.b6(28), C.grey, 'left', 3); ctx.globalAlpha = 1;
  const X0 = 800, RW = 1024, RH = 120;
  ROWS.forEach(([n, kr, en, d], i) => {
    const a = 6.5 + i * .5, y = 100 + i * 140;
    const k = close ? 1 : seg(t, a, a + .3); if (k <= 0) return;
    const sy = close ? 1 : back(k, 2.0);
    ctx.save(); ctx.translate(0, y); ctx.scale(1, Math.max(.02, sy)); ctx.translate(0, -y);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(X0 + 10, y + 10, RW, RH);
    ctx.fillStyle = C.ink2; ctx.fillRect(X0, y, RW, RH);
    ctx.fillStyle = C.lemon; ctx.fillRect(X0, y, 140, RH);
    text(n, X0 + 70, y + 90, F.b8(84), C.ink, 'center', 0);
    text(kr, X0 + 176, y + 58, fit(kr, F.kr9, 40, 640), C.white, 'left', 0, 'row' + i);
    text(en, X0 + 178, y + 96, F.b6(23), C.gold, 'left', 1.5, 'rowe' + i);
    text(d, X0 + RW - 26, y + 96, F.mono(18), C.grey2, 'right', 2);
    const sw = close ? 0 : seg(t, a + .05, a + .45);
    if (sw > 0 && sw < 1) { const gx = X0 + 140 + (RW - 140) * eio(sw); const g = ctx.createLinearGradient(gx - 160, 0, gx, 0); g.addColorStop(0, 'rgba(242,207,29,0)'); g.addColorStop(1, 'rgba(242,207,29,.28)'); ctx.fillStyle = g; ctx.fillRect(Math.max(X0 + 140, gx - 160), y, Math.min(160, gx - X0 - 140), RH); }
    if (close) {
      const ck = seg(t, RD.ticks + i * .4, RD.ticks + i * .4 + .22);
      if (ck > 0) {
        const s = back(ck, 2.6), cx = X0 + RW - 64, cy = y + 44;
        ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
        ctx.fillStyle = C.lemon; ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = C.ink; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(-13, 1); ctx.lineTo(-3, 11); ctx.lineTo(15, -10); ctx.stroke(); ctx.restore();
      }
    }
    ctx.restore();
  });
  if (!close) {
    const hl = seg(t, 9.6, 9.85);
    if (hl > 0) { ctx.strokeStyle = C.lemon; ctx.lineWidth = 5; ctx.globalAlpha = .6 + .4 * Math.cos((t - 9.6) * Math.PI * 4); ctx.strokeRect(X0 - 4, 96, RW * eo(hl) + 8, RH + 8); ctx.globalAlpha = 1; }
  }
  ctx.restore();
}

// ① A — GPT-6.1 Terra: spec card + a computer-use illustration (10.5–16.0)
const S1 = { eye: 10.25, title: 10.3, stamp: 11.2, chips: [11.6, 11.9, 12.2], id: 12.4, clicks: [11.9, 12.7, 13.5, 14.3, 15.1] };
function shotTerra(t) {
  studioBg(t);
  const z = lerp(1.0, 1.03, eio(seg(t, 10.5, 16.0)));
  ctx.save(); ctx.translate(960, 480); ctx.scale(z, z); ctx.translate(-960, -480);
  const x = 150;
  eyebrow(t, S1.eye, 'OPENAI · MON 26 OCT 2026', x + 4, 200, 'k1');
  pushUp(t, S1.title, 'GPT-6.1', x - 4, 340, F.b8(150), C.white, 'k1t', .35, 900);
  pushUp(t, S1.title + .15, 'Terra', x - 4, 490, F.b8(150), C.lemon, 'k1t2', .35, 900);
  stamp(t, S1.stamp, x + 610, 440, '컴퓨터 사용', 'COMPUTER USE', -.1, false, 'k1s', 36, 30);
  const chips = [['ChatGPT Work', ''], ['Codex', ''], ['API', '']];
  let cx = x;
  chips.forEach(([s], i) => {
    const k = eo(seg(t, S1.chips[i], S1.chips[i] + .25)); const w = tw(s, F.b8(36), 1) + 48;
    if (k > 0) { ctx.save(); ctx.globalAlpha = k; ctx.translate(0, (1 - k) * 30);
      ctx.fillStyle = C.ink3; ctx.fillRect(cx, 560, w, 64); ctx.fillStyle = C.lemon; ctx.fillRect(cx, 560, 6, 64);
      text(s, cx + 26, 606, F.b8(36), C.paper, 'left', 1, 'k1c' + i); ctx.restore(); }
    cx += w + 18;
  });
  ctx.globalAlpha = eo(seg(t, S1.chips[0] - .1, S1.chips[0] + .15)); text('제공 범위 · AVAILABLE IN', x + 2, 540, F.kr7(22), C.grey, 'left', 0); ctx.globalAlpha = 1;
  if (t >= S1.id) {
    const full = 'model = "gpt-6.1-terra"', n = Math.floor(seg(t, S1.id, S1.id + .6) * full.length);
    ctx.fillStyle = 'rgba(27,30,35,.95)'; ctx.fillRect(x, 660, 600, 60); ctx.fillStyle = C.lemon; ctx.fillRect(x, 660, 6, 60);
    const w = text(full.slice(0, n), x + 28, 700, F.mono(28), C.paper, 'left', 0, n >= full.length ? 'k1id' : null);
    if (Math.floor(t * 4) % 2 === 0 || n < full.length) { ctx.fillStyle = C.lemon; ctx.fillRect(x + 32 + w, 674, 14, 34); }
  }
  // right: a code-drawn desktop window; a cursor clicks through a form (illustration of "computer use")
  const wk = eo(seg(t, 10.35, 10.75)), WX = 1100 + (1 - wk) * 300, WY = 190, WW = 680, WH = 560;
  ctx.globalAlpha = clamp(wk * 2);
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(WX + 16, WY + 20, WW, WH);
  ctx.fillStyle = '#1E2227'; ctx.fillRect(WX, WY, WW, WH);
  ctx.fillStyle = C.ink3; ctx.fillRect(WX, WY, WW, 48);
  [0, 1, 2].forEach(i => { ctx.fillStyle = i === 0 ? C.lemon : C.line; ctx.beginPath(); ctx.arc(WX + 28 + i * 26, WY + 24, 8, 0, Math.PI * 2); ctx.fill(); });
  ctx.fillStyle = '#2B3038'; ctx.fillRect(WX + 120, WY + 14, 420, 20);
  const fields = [[WX + 50, WY + 100, 580, 56], [WX + 50, WY + 186, 580, 56], [WX + 50, WY + 272, 280, 56], [WX + 350, WY + 272, 280, 56], [WX + 410, WY + 450, 220, 64]];
  fields.forEach(([fx, fy, fw, fh], i) => {
    const done = t >= S1.clicks[i] + .08, last = i === fields.length - 1;
    ctx.fillStyle = last ? (done ? C.lemon : C.ink3) : '#262A31'; ctx.fillRect(fx, fy, fw, fh);
    if (!last) { ctx.strokeStyle = done ? C.lemon : C.line; ctx.lineWidth = 2; ctx.strokeRect(fx, fy, fw, fh);
      const fk = seg(t, S1.clicks[i] + .08, S1.clicks[i] + .45); if (fk > 0) { ctx.fillStyle = C.paper; ctx.globalAlpha *= .8; ctx.fillRect(fx + 20, fy + 22, (fw - 120) * fk * (.6 + hash(i) * .4), 12); ctx.globalAlpha = clamp(wk * 2); } }
    else { ctx.fillStyle = done ? C.ink : C.grey2; ctx.fillRect(fx + 70, fy + 28, 80, 8); }
    ctx.fillStyle = '#353B44'; ctx.fillRect(fx, fy - 18, 90 + hash(i + 3) * 80, 8);
  });
  // cursor path: one world→screen path through the click targets
  const pts = fields.map(([fx, fy, fw, fh]) => [fx + fw * .55, fy + fh * .55]); pts.unshift([WX + WW - 60, WY + WH - 30]);
  let p = pts[0];
  for (let i = 0; i < S1.clicks.length; i++) { const a = S1.clicks[i] - .55, b = S1.clicks[i]; if (t >= a) { const k = eio(seg(t, a, b)); p = [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)]; } }
  S1.clicks.forEach(c => { const r = seg(t, c, c + .35); if (r > 0 && r < 1) { ctx.strokeStyle = `rgba(242,207,29,${1 - r})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p[0], p[1], 10 + r * 40, 0, Math.PI * 2); ctx.stroke(); } });
  ctx.save(); ctx.translate(p[0], p[1]); ctx.fillStyle = C.white; ctx.strokeStyle = C.ink; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 34); ctx.lineTo(9, 26); ctx.lineTo(16, 40); ctx.lineTo(22, 37); ctx.lineTo(15, 23); ctx.lineTo(27, 23); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ① B — price bars on one scale (16.0–21.0, hard cut)
const S1B = { in: 16.0, b: [16.4, 16.8, 17.6, 18.0], badge: 18.6 };
function shotBars(t) {
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H); dots(t, .035, 8);
  ctx.save(); ctx.translate(0, 30);
  const x = 150;
  eyebrow(t, S1B.in, 'OPENAI API PRICING · STANDARD · PER 1M TOKENS', x + 4, 150, 'b1k');
  pushUp(t, S1B.in + .05, 'API 가격, 이전 모델의 절반', x - 4, 250, F.kr9(76), C.white, 'b1t', .35, 1500);
  const BW = 1100, unit = BW / 10, rows = [
    [380, '입력', 'INPUT', 'GPT-5.6 Terra', 2, C.paper, 0], [450, '', '', 'GPT-6.1 Terra', 1, C.lemon, 1],
    [600, '출력', 'OUTPUT', 'GPT-5.6 Terra', 10, C.paper, 2], [670, '', '', 'GPT-6.1 Terra', 5, C.lemon, 3]];
  rows.forEach(([y, kr, en, lab, v, col, i]) => {
    const a = S1B.b[i], la = eo(seg(t, a - .15, a + .1)); if (la <= 0) return;
    ctx.globalAlpha = la;
    if (kr) bi(kr, en, x, y - 22, 32, 24, C.white, C.grey, 'b1l' + i);
    text(lab, x, y + 40, F.b6(28), col === C.lemon ? C.lemon : C.grey, 'left', 1);
    ctx.globalAlpha = 1;
    const bx = x + 250; ctx.fillStyle = C.ink3; ctx.fillRect(bx, y, BW, 52);
    const k = eio(seg(t, a, a + .45)), w = Math.max(4, v * unit * k);
    const g = ctx.createLinearGradient(bx, 0, bx + w, 0); g.addColorStop(0, col === C.lemon ? C.lemonD : '#B9B4A6'); g.addColorStop(1, col);
    ctx.fillStyle = g; ctx.fillRect(bx, y, w, 52);
    if (k > .05) { const s = '$' + v.toFixed(2); ctx.save(); ctx.globalAlpha = clamp(k * 3); text(s, bx + w + 20, y + 44, F.b8(52), col, 'left', 0, k >= 1 ? 'b1v' + i : null); ctx.restore(); }
  });
  // scale ticks under the bars ($0 … $10, one scale for all four)
  ctx.globalAlpha = eo(seg(t, 16.3, 16.6));
  for (let v = 0; v <= 10; v += 2) { const xx = x + 250 + v * unit; ctx.fillStyle = C.line; ctx.fillRect(xx, 740, 2, 12); text('$' + v, xx, 778, F.mono(16), C.grey2, 'center', 1); }
  ctx.globalAlpha = 1;
  const bk = seg(t, S1B.badge, S1B.badge + .2);
  if (bk > 0) { const s = back(bk, 2.4), w = biW('절반', '−50%', 44, 52, F.kr9, F.b8) + 50;
    ctx.save(); ctx.translate(1520, 330); ctx.scale(s, s); ctx.rotate(-.06); ctx.fillStyle = C.gold; ctx.fillRect(-w / 2, -40, w, 80);
    bi('절반', '−50%', -w / 2 + 25, 18, 44, 52, C.ink, C.ink, 'b1p', F.kr9, F.b8); ctx.restore(); }
  ctx.restore();
}

// ② A — S-1: the filing flies in, boxes tick, stamp (21.0–26.5)
const S2 = { title: 20.75, doc: 20.8, ticks: [22.4, 23.1, 23.8], stamp: 24.5 };
function shotS1(t) {
  studioBg(t);
  const x = 150;
  eyebrow(t, S2.title, 'ANTHROPIC · MON 26 OCT 2026', x + 4, 230, 'a1k');
  pushUp(t, S2.title + .05, 'S-1 제출', x - 4, 390, F.kr9(150), C.white, 'a1t', .35, 800);
  ctx.globalAlpha = eo(seg(t, S2.title + .4, S2.title + .7));
  text('미국 증권거래위원회(SEC) 상장 신청서', x, 470, F.kr7(34), C.grey, 'left', 0, 'a1s');
  text('REGISTRATION STATEMENT · PROPOSED IPO', x + 2, 516, F.b6(26), C.gold, 'left', 2);
  ctx.globalAlpha = 1;
  // the document: arc in, scale 0.08 → 1, rotation settles
  const k = eio(seg(t, S2.doc, S2.doc + .5)); if (k <= 0) return;
  const DX = lerp(1980, 1360, k), DY = lerp(120, 470, eo(seg(t, S2.doc, S2.doc + .5))) - Math.sin(k * Math.PI) * 120, sc = lerp(.08, 1, k);
  const rot = lerp(.5, -.035, k) + Math.sin(seg(t, S2.doc + .5, S2.doc + 1.4) * Math.PI) * .02 * (1 - seg(t, S2.doc + .5, S2.doc + 1.4));
  ctx.save(); ctx.translate(DX, DY); ctx.rotate(rot); ctx.scale(sc, sc);
  const w = 520, h = 680;
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(-w / 2 + 18, -h / 2 + 24, w, h);
  ctx.fillStyle = C.paper; ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.fillStyle = C.ink; ctx.fillRect(-w / 2, -h / 2, w, 110);
  text('FORM S-1', -w / 2 + 34, -h / 2 + 66, F.b8(56), C.lemon, 'left', 2, k >= 1 ? 'a1d' : null);
  text('U.S. SECURITIES AND EXCHANGE COMMISSION', -w / 2 + 36, -h / 2 + 96, F.mono(14), C.paper, 'left', 1);
  text('Anthropic, PBC', -w / 2 + 34, -h / 2 + 180, F.b8(46), C.ink, 'left', 1, k >= 1 ? 'a1n' : null);
  ctx.fillStyle = '#CFC8B6'; for (let i = 0; i < 3; i++) ctx.fillRect(-w / 2 + 34, -h / 2 + 206 + i * 18, 380 - i * 70, 6);
  const items = [['클래스 A 보통주', 'CLASS A COMMON STOCK'], ['나스닥 글로벌 셀렉트', 'NASDAQ GLOBAL SELECT'], ['티커 “ANT”', 'SYMBOL “ANT”']];
  items.forEach(([kr, en], i) => {
    const y = -h / 2 + 330 + i * 92;
    ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.strokeRect(-w / 2 + 34, y - 30, 36, 36);
    const ck = seg(t, S2.ticks[i], S2.ticks[i] + .18);
    if (ck > 0) { ctx.strokeStyle = C.lemonD; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); const p = eo(ck);
      ctx.moveTo(-w / 2 + 40, y - 12); ctx.lineTo(-w / 2 + 50, y - 2); if (p > .4) ctx.lineTo(lerp(-w / 2 + 50, -w / 2 + 72, (p - .4) / .6), lerp(y - 2, y - 34, (p - .4) / .6)); ctx.stroke(); }
    text(kr, -w / 2 + 90, y, F.kr9(30), C.ink, 'left', 0, k >= 1 ? 'a1i' + i : null);
    text(en, -w / 2 + 92, y + 30, F.b6(20), C.olive, 'left', 1.5);
  });
  stamp(t, S2.stamp, 60, 250, '제출', 'FILED', -.14, true, 'a1st', 44, 40);
  ctx.restore();
}

// ② B — ticker board + price range not yet set (26.5–31.0, hard cut)
const S2B = { a: 26.5, tiles: [26.65, 26.8, 26.95], range: 27.3, stamp: 28.8 };
function shotTicker(t) {
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H); dots(t, .035, 8);
  const z = lerp(1.0, 1.04, eio(seg(t, 26.5, 31.0)));
  ctx.save(); ctx.translate(960, 460); ctx.scale(z, z); ctx.translate(-960, -460);
  const X = 260, Y = 150, BW = 1400, BH = 640;
  card(X, Y, BW, BH);
  bi('나스닥 티커', 'NASDAQ TICKER', X + 60, Y + 80, 40, 26, C.white, C.gold, 'tk1');
  text('ANTHROPIC · CLASS A', X + BW - 60, Y + 78, F.mono(18), C.grey2, 'right', 2, 'tk2');
  ctx.fillStyle = C.line; ctx.fillRect(X + 60, Y + 110, BW - 120, 2);
  'ANT'.split('').forEach((L, i) => flipTile(X + 60 + i * 200, Y + 150, 180, 200, ' ', t >= S2B.tiles[i] ? L : ' ', S2B.tiles[i], t, F.b8(170), C.lemon, i === 0 ? 'tkA' : null));
  if (t >= S2B.tiles[2] + .3) TX.push({ id: 'tkw', text: 'ANT', x0: X + 60, y0: Y + 150, x1: X + 640, y1: Y + 350 });
  const rk = eo(seg(t, S2B.range, S2B.range + .3));
  if (rk > 0) {
    ctx.globalAlpha = rk;
    bi('공모가 범위', 'PRICE RANGE', X + 60, Y + 450, 36, 24, C.white, C.grey, 'tk3');
    ['$', '?', '–', '$', '?'].forEach((s, i) => {
      const bx = X + 60 + i * 132, live = s === '?';
      const blink = live && Math.floor(t * 3 + i) % 2 === 0;
      ctx.fillStyle = '#262A31'; ctx.fillRect(bx, Y + 480, 116, 120);
      if (!live) text(s, bx + 58, Y + 572, F.b8(84), C.grey, 'center');
      else { ctx.fillStyle = blink ? C.lemon : '#3A3F47'; ctx.fillRect(bx + 28, Y + 560, 60, 10); }
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(bx, Y + 538.5, 116, 3);
    });
    ctx.globalAlpha = 1;
  }
  // right column: what the notice says, plainly
  const nk = eo(seg(t, S2B.range + .2, S2B.range + .5));
  if (nk > 0) { ctx.globalAlpha = nk;
    text('“have not yet been determined”', X + 760, Y + 230, F.b6i(40), C.paper, 'left', 0, 'tkq');
    text('아직 정해지지 않음', X + 760, Y + 286, F.kr7(30), C.grey, 'left', 0, 'tkqk');
    ctx.globalAlpha = 1; }
  stamp(t, S2B.stamp, X + 1080, Y + 500, '미정', 'NOT YET SET', -.1, false, 'tkst', 44, 38);
  ctx.restore();
}

// ③ — Vera Rubin: one long take; the GPU grid fills, a beat of silence, then 3 GW+ (31.0–44.0)
const S3 = { eye: 30.75, title: 30.8, stamp: 31.8, pull: [32.8, 34.2], fill: [33.4, 37.4], bracket: 38.5, sil: 40.0, hit: 40.5, read: 40.7, push: [40.5, 44.0] };
const GC = 40, GR = 25, CELL = 20, GAP = 3;
function view3(t) {   // one camera for the take: zoomed on the title, pulls out to show the grid, pushes in after the hit
  const k = eio(seg(t, S3.pull[0], S3.pull[1]));
  let s = lerp(1.18, 1.0, k), cx = lerp(640, 960, k), cy = lerp(430, 470, k);
  const p = eio(seg(t, S3.push[0], S3.push[1])); s *= lerp(1, 1.035, p);
  const sh = t > S3.hit && t < S3.hit + .35 ? Math.sin(t * 95) * 16 * (1 - seg(t, S3.hit, S3.hit + .35)) : 0;
  return { s, cx, cy, sh };
}
function shotRubin(t) {
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H); dots(t, .035, 6);
  const v = view3(t);
  ctx.save(); ctx.translate(960 + v.sh, 470); ctx.scale(v.s, v.s); ctx.translate(-v.cx, -v.cy);
  const x = 150;
  ctx.save(); ctx.translate(-900 * eio(seg(t, S3.sil - .35, S3.sil)), 0);   // the title column slides out before the silent beat, making room for the hit
  if (t < S3.sil) {
  eyebrow(t, S3.eye, 'NVIDIA · ORACLE · TUE 27 OCT 2026', x + 4, 200, 'r1k');
  pushUp(t, S3.title, 'Vera Rubin', x - 4, 320, F.b8(120), C.white, 'r1t', .35, 800);
  pushUp(t, S3.title + .15, 'NVL72', x - 4, 440, F.b8(120), C.lemon, 'r1t2', .35, 800);
  stamp(t, S3.stamp, x + 290, 520, 'OCI 정식 제공', 'GENERALLY AVAILABLE', -.06, false, 'r1s', 30, 26);
  ctx.globalAlpha = eo(seg(t, S3.stamp + .4, S3.stamp + .7));
  text('Oracle AI World · 라스베이거스', x, 620, F.kr7(26), C.grey, 'left', 0, 'r1w');
  }
  ctx.restore();
  // the grid: 1,000 cells, 1 cell = 1,000 GPUs (schematic)
  const GX = 860, GY = 170, n = GC * GR, fk = seg(t, S3.fill[0], S3.fill[1]), lit = Math.floor(eio(fk) * n + .001);
  ctx.globalAlpha = eo(seg(t, S3.pull[0] + .4, S3.pull[0] + .9));
  for (let c = 0; c < GC; c++) for (let r = 0; r < GR; r++) {
    const i = c * GR + r, on = i < lit;
    ctx.fillStyle = on ? (i >= lit - 30 ? C.lemonL : C.lemon) : '#1F2328';
    ctx.fillRect(GX + c * (CELL + GAP), GY + r * (CELL + GAP), CELL, CELL);
  }
  if (fk > 0 && fk < 1) { const c = Math.floor(lit / GR); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(GX + c * (CELL + GAP) - 2, GY - 6, 4, GR * (CELL + GAP) + 8); }
  ctx.globalAlpha = eo(seg(t, S3.pull[0] + .6, S3.pull[0] + 1.0));
  text('1칸 = GPU 1,000개 · 1 CELL = 1,000 GPUs', GX, GY - 24, F.kr7(20), C.grey2, 'left', 0, 'r1g');
  ctx.globalAlpha = 1;
  // bracket under the grid → 1M+ GPUs
  const GW = GC * (CELL + GAP) - GAP, GB = GY + GR * (CELL + GAP) + 6;
  const bk = eio(seg(t, S3.bracket, S3.bracket + .3));
  if (bk > 0) {
    ctx.strokeStyle = C.lemon; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(GX, GB); ctx.lineTo(GX, GB + 18);
    ctx.lineTo(lerp(GX, GX + GW, bk), GB + 18); if (bk >= 1) ctx.lineTo(GX + GW, GB); ctx.stroke();
    const lk = seg(t, S3.bracket + .2, S3.bracket + .45);
    if (lk > 0) { const s = back(lk, 2.2); ctx.save(); ctx.translate(GX + GW / 2, GB + 96); ctx.scale(s, s);
      const w = biW('100만 개 이상', '1M+ GPUs', 46, 46, F.kr9, F.b8);
      bi('100만 개 이상', '1M+ GPUs', -w / 2, 0, 46, 46, C.white, C.lemon, 'r1m', F.kr9, F.b8); ctx.restore(); }
  }
  ctx.restore();
  // the hit: 3 GW+ slams over the left column (screen space, after the pull-out)
  const hk = seg(t, S3.hit, S3.hit + .18);
  if (hk > 0) {
    const s = 1 + 1.2 * (1 - eo(hk));
    ctx.save(); ctx.translate(470 + v.sh, 470);
    const r = seg(t, S3.hit + .05, S3.hit + .6); if (r > 0 && r < 1) { ctx.strokeStyle = `rgba(242,207,29,${1 - r})`; ctx.lineWidth = 8 * (1 - r) + 1; ctx.beginPath(); ctx.ellipse(0, -40, 260 + r * 500, 120 + r * 240, 0, 0, Math.PI * 2); ctx.stroke(); }
    ctx.scale(s, s); ctx.globalAlpha = clamp(hk * 3);
    ctx.fillStyle = 'rgba(18,20,23,.94)'; ctx.fillRect(-360, -250, 720, 400); ctx.fillStyle = C.lemon; ctx.fillRect(-360, -250, 720, 8);
    text('3 GW+', 0, 0, F.b8(220), C.lemon, 'center', 0, hk >= 1 ? 'r1gw' : null);
    ctx.restore();
    const rk = eo(seg(t, S3.read, S3.read + .3));
    if (rk > 0) { ctx.save(); ctx.globalAlpha = rk; ctx.translate(470, 470 + (1 - rk) * 20);
      const w = biW('2027년 말까지 계획', 'PLANNED BY END OF 2027', 36, 26);
      bi('2027년 말까지 계획', 'PLANNED BY END OF 2027', -w / 2, 90, 36, 26, C.white, C.gold, 'r1r'); ctx.restore(); }
  }
}

// ④ — Genie 4 over a wireframe world (44.0–53.0)
const S4 = { eye: 43.75, title: 43.8, sub: 44.4, rows: [45.3, 46.1, 46.9], chip: 49.25, stamp: 50.2 };
function terrain(t) {
  ctx.fillStyle = '#0F1114'; ctx.fillRect(0, 0, W, H);
  const hz = 360, f = 900, camH = 3.2, travel = (t - 43.5) * 2.2;
  const sun = eo(seg(t, S4.rows[2] + .1, S4.rows[2] + .9));   // "steer with text": light changes on cue
  const sg = ctx.createRadialGradient(1500, hz - 40, 10, 1500, hz - 40, 700); sg.addColorStop(0, `rgba(242,207,29,${.08 + .22 * sun})`); sg.addColorStop(1, 'rgba(242,207,29,0)');
  ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);
  const hgt = (X, Z) => (vnoise(X * .22, Z * .22) * 2.6 + vnoise(X * .6 + 9, Z * .6) * .7) * clamp((Math.abs(X) - 1.2) / 6, 0, 1.4);
  const proj = (X, Z) => { const zz = Z - (travel % 1); return [1180 + X * f / zz, hz + (camH - hgt(X, Z + Math.floor(travel))) * f / zz]; };
  ctx.lineWidth = 1.6;
  for (let zi = 32; zi >= 1; zi--) {
    const a = clamp(1 - zi / 34) * .7;
    ctx.strokeStyle = `rgba(212,176,100,${a})`; ctx.beginPath();
    for (let xi = -24; xi <= 24; xi++) { const [sx, sy] = proj(xi * .8, zi); xi === -24 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy); }
    ctx.stroke();
  }
  for (let xi = -24; xi <= 24; xi += 2) {
    ctx.strokeStyle = 'rgba(212,176,100,.22)'; ctx.beginPath();
    for (let zi = 1; zi <= 32; zi++) { const [sx, sy] = proj(xi * .8, zi); zi === 1 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy); }
    ctx.stroke();
  }
  const g = ctx.createLinearGradient(0, 0, 1300, 0); g.addColorStop(0, 'rgba(14,16,19,.94)'); g.addColorStop(.6, 'rgba(14,16,19,.7)'); g.addColorStop(1, 'rgba(14,16,19,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  vignette(.55);
}
function shotGenie(t) {
  terrain(t);
  const x = 150;
  eyebrow(t, S4.eye, 'GOOGLE DEEPMIND · TUE 27 OCT 2026', x + 4, 190, 's4k');
  pushUp(t, S4.title, 'Genie 4', x - 4, 340, F.b8(170), C.white, 's4t', .35, 900);
  ctx.globalAlpha = eo(seg(t, S4.sub, S4.sub + .3));
  bi('실시간 세계 생성 모델', 'WORLD MODEL', x, 410, 36, 26, C.lemon, C.gold, 's4s');
  ctx.globalAlpha = 1;
  const rows = [['실시간으로 반응하는 세계', 'REAL-TIME, INTERACTIVE'], ['소리도 함께 생성', 'NATIVE AUDIO'], ['텍스트로 장면 조정', 'STEER WITH TEXT']];
  rows.forEach(([kr, en], i) => {
    const a = S4.rows[i], k = eo(seg(t, a, a + .3)); if (k <= 0) return;
    const y = 470 + i * 84;
    ctx.save(); ctx.globalAlpha = k; ctx.translate((1 - k) * -40, 0);
    ctx.fillStyle = 'rgba(27,30,35,.92)'; ctx.fillRect(x, y, 760, 68); ctx.fillStyle = C.lemon; ctx.fillRect(x, y, 6, 68);
    text('0' + (i + 1), x + 26, y + 48, F.b8(36), C.lemon, 'left', 0);
    bi(kr, en, x + 90, y + 46, 32, 22, C.white, C.grey, 's4r' + i);
    ctx.restore();
  });
  const ck = eo(seg(t, S4.chip, S4.chip + .3));
  if (ck > 0) { ctx.globalAlpha = ck; ctx.fillStyle = C.ink3; ctx.fillRect(x, 740, 640, 58); ctx.strokeStyle = C.gold; ctx.lineWidth = 2; ctx.strokeRect(x, 740, 640, 58);
    bi('일부 신뢰 테스터 대상', 'TRUSTED TESTERS', x + 24, 780, 28, 22, C.paper, C.gold, 's4c', F.kr7); ctx.globalAlpha = 1; }
  stamp(t, S4.stamp, 1300, 640, '연구 프리뷰', 'RESEARCH PREVIEW', -.1, true, 's4st', 40, 34);
}

// ⑤ Next week: what is still open (57.5–61.5)
const S5 = { eye: 56.75, title: 56.8, tiles: 57.5, foot: 57.9 };
function shotNext(t) {
  studioBg(t);
  const z = lerp(1.0, 1.05, eio(seg(t, 57.0, 61.5)));
  ctx.save(); ctx.translate(960, 460); ctx.scale(z, z); ctx.translate(-960, -460);
  const x = 150;
  const tab = ['다음 주 지켜볼 것', 'NEXT WEEK']; const tabW = 40 + biW(tab[0], tab[1], 30, 30, F.kr9, F.b8);
  const ta = eo(seg(t, S5.eye, S5.eye + .25)); ctx.fillStyle = C.lemon; ctx.fillRect(x, 150, tabW * ta, 50);
  if (ta > .9) bi(tab[0], tab[1], x + 20, 188, 30, 30, C.ink, C.ink, 'n0', F.kr9, F.b8);
  pushUp(t, S5.title, 'ANT 공모가 범위', x - 4, 340, F.kr9(110), C.white, 'n1', .35, 1400);
  ctx.globalAlpha = eo(seg(t, S5.title + .3, S5.title + .6)); text('ANTHROPIC IPO · PRICE RANGE', x + 2, 400, F.b6(30), C.gold, 'left', 3); ctx.globalAlpha = 1;
  ['$', '?', '–', '$', '?'].forEach((s, i) => {
    const a = S5.tiles + i * .12, k = eo(seg(t, a, a + .25)); if (k <= 0) return;
    const bx = x + i * 150, live = s === '?', blink = live && Math.floor(t * 3 + i) % 2 === 0;
    ctx.save(); ctx.globalAlpha = k; ctx.translate(0, (1 - k) * 30);
    ctx.fillStyle = '#262A31'; ctx.fillRect(bx, 450, 132, 150);
    if (!live) text(s, bx + 66, 562, F.b8(100), C.grey, 'center'); else { ctx.fillStyle = blink ? C.lemon : '#3A3F47'; ctx.fillRect(bx + 32, 548, 68, 12); }
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(bx, 523.5, 132, 3); ctx.restore();
  });
  ctx.globalAlpha = eo(seg(t, S5.foot, S5.foot + .3));
  text('10월 26일 기준 · 공모가 범위 미정', x, 680, F.kr7(30), C.grey, 'left', 0, 'n2');
  text('AS OF 26 OCT 2026: NOT YET EFFECTIVE · RANGE NOT SET', x + 2, 722, F.b6(24), C.grey2, 'left', 2);
  ctx.globalAlpha = 1;
  ctx.restore();
}

// End card (61.5–66.0)
function shotEnd(t) {
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#1A1D22'); g.addColorStop(1, '#0E1013');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); dots(t, .04, 10);
  ctx.fillStyle = C.lemon; ctx.beginPath(); ctx.moveTo(1260, 0); ctx.lineTo(1290, 0); ctx.lineTo(1150, 790); ctx.lineTo(1120, 790); ctx.fill();
  ctx.fillStyle = C.gold; ctx.beginPath(); ctx.moveTo(1300, 0); ctx.lineTo(1306, 0); ctx.lineTo(1166, 790); ctx.lineTo(1160, 790); ctx.fill();
  const m = (a, b) => eo(seg(t, a, b)), T = 61.3;
  const r = (y, h, k, fn) => { if (k <= 0) return; ctx.save(); ctx.beginPath(); ctx.rect(0, y - h, 1120, h + 30); ctx.clip(); ctx.translate(0, (1 - k) * (h + 30)); fn(); ctx.restore(); };
  const x = 150;
  ctx.globalAlpha = m(T, T + .2); text('AI WEEKLY · WEEK 44 · 26–29 OCT 2026', x, 210, F.mono(24), C.gold, 'left', 3, 'e0'); ctx.globalAlpha = 1;
  r(350, 130, m(T + .05, T + .35), () => text('AI 위클리', x - 4, 350, F.kr9(120), C.white, 'left', 0, 'e1'));
  r(440, 80, m(T + .2, T + .5), () => text('The Week in AI', x, 440, F.b6i(76), C.lemon, 'left', 2, 'e2'));
  const lk = eio(seg(t, T + .35, T + .65)); ctx.fillStyle = C.lemon; ctx.fillRect(x, 482, 880 * lk, 2);
  ctx.globalAlpha = m(T + .5, T + .75); text('10월 마지막 주 · 네 가지 소식', x, 548, F.kr7(32), C.white, 'left', 0, 'e3'); ctx.globalAlpha = 1;
  ctx.globalAlpha = m(T + .65, T + .9); const hw = text('제작', x, 616, F.kr7(32), C.grey, 'left', 0, 'e4k'); text(HANDLE, x + hw + 18, 618, F.b8(44), C.lemon, 'left', 1, 'e4'); ctx.globalAlpha = 1;
  ctx.globalAlpha = m(T + .7, T + 1.0);
  ctx.fillStyle = C.line; ctx.fillRect(x, 800, 1620, 1);
  [['출처: OpenAI · Anthropic · Oracle · NVIDIA · Google DeepMind', 'e5'],
   ['회사 로고는 쓰지 않음 · 일러스트는 코드로 그림', 'e5b'],
   ['음악 VSCO 2 CE · VCSL (CC0) · 음성 Typecast', 'e6'],
   ['글꼴 Noto Sans KR · Barlow Condensed · IBM Plex Mono (OFL)', 'e6b']].forEach(([s, id], i) => text(s, x, 842 + i * 34, F.kr7(21), C.grey, 'left', 0, id));
  ctx.globalAlpha = 1;
  const la = m(T + .2, T + .5); ctx.globalAlpha = la;
  plate(1600, 360, .62, seg(t, T + 1.0, T + 1.45) || -1, seg(t, T + .2, T + .7));
  wordmark(1600, 520, 48, 'center', 'e8');
  ctx.globalAlpha = 1;
}

// ============ Compositing ============
function wipeBand(bx) { ctx.fillStyle = C.lemon; ctx.fillRect(bx - 84, 0, 84, H); ctx.fillStyle = C.ink; ctx.fillRect(bx, 0, 5, H); ctx.fillStyle = C.gold; ctx.fillRect(bx + 5, 0, 14, H); }
// one picture = a shot + its own package layer (tag, source, strap), drawn in that picture's state (tov)
function layer(fn, t, tov) { fn(t); cornerTag(tov); credit(tov); strap(tov); }
function wipe(t, a, b, oldFn, newFn) {
  const bx = lerp(-140, W + 140, eio(seg(t, a, b)));
  const n0 = TX.length; layer(newFn, t, b + .001); const NEW = TX.splice(n0);
  ctx.save(); ctx.beginPath(); ctx.rect(bx, 0, W, H); ctx.clip(); layer(oldFn, t, a - .001); ctx.restore();
  const OLD = TX.splice(n0); TX.push(...(seg(t, a, b) < .5 ? OLD : NEW));
  wipeBand(bx);
}
const OPEN = t => rundown(t, false), RECAP = t => rundown(t, true);
// Transitions: band wipe between stories, hard cut (+ timpani) inside a story, slanted wipe into the end card
const SCENES = [
  [0, shotCold], [4.0, shotSting], [5.5, OPEN], [10.5, shotTerra], [16.0, shotBars], [21.0, shotS1], [26.5, shotTicker],
  [31.0, shotRubin], [44.0, shotGenie], [53.0, RECAP], [57.0, shotNext], [61.5, shotEnd],
];
const WIPES = [[5.2, 5.5], [10.2, 10.5], [20.7, 21.0], [30.7, 31.0], [43.7, 44.0], [52.7, 53.0], [56.7, 57.0]];
const SLANT = [61.25, 61.5];
function scene(t) {
  const w = WIPES.find(([a, b]) => t >= a && t < b);
  if (w) { const i = SCENES.findIndex(s => Math.abs(s[0] - w[1]) < .01); wipe(t, w[0], w[1], SCENES[i - 1][1], SCENES[i][1]); }
  else if (t >= SLANT[0] && t < SLANT[1]) {
    layer(shotNext, t, SLANT[0] - .001);
    const k = eio(seg(t, SLANT[0], SLANT[1])), x = W - k * (W + 340);
    ctx.save(); ctx.beginPath(); ctx.moveTo(x + 340, 0); ctx.lineTo(W + 340, 0); ctx.lineTo(W + 340, H); ctx.lineTo(x, H); ctx.closePath(); ctx.clip(); shotEnd(t); ctx.restore();
    ctx.fillStyle = C.lemon; ctx.beginPath(); ctx.moveTo(x + 340, 0); ctx.lineTo(x + 380, 0); ctx.lineTo(x + 40, H); ctx.lineTo(x, H); ctx.fill();
  } else {
    let fn = SCENES[0][1]; for (const [a, f] of SCENES) if (t >= a) fn = f;
    layer(fn, t, t);
  }
  stingLogo(t);
}
function render(t) {
  TX = [];
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none';
  scene(t);
  bug(t);
  if (t > 67.2) { ctx.fillStyle = `rgba(0,0,0,${seg(t, 67.2, 67.9)})`; ctx.fillRect(0, 0, W, H); }
}

// —— Events (sound and cues), exported by events.mjs for mix.py ——
const EV = [
  { t: .0, type: 'card' }, { t: 1.2, type: 'flap' }, { t: 1.5, type: 'flap' }, { t: 2.05, type: 'stamp' },
  { t: 4.0, type: 'hit_cut' }, { t: 4.04, type: 'swish' }, { t: 4.4, type: 'stab' }, { t: 4.9, type: 'glint' }, { t: 5.2, type: 'whoosh' },
  { t: 5.45, type: 'slide' }, { t: 5.95, type: 'slide' },
  ...[0, 1, 2, 3].map(i => ({ t: 6.5 + i * .5, type: 'row', i })), { t: 9.6, type: 'blip' },
  { t: 10.2, type: 'whoosh' }, { t: 10.5, type: 'hit' }, { t: 10.3, type: 'slam' }, { t: 10.45, type: 'slam' }, { t: 11.2, type: 'stamp' },
  ...S1.chips.map(c => ({ t: c, type: 'pop' })), ...Array.from({ length: 22 }, (_, i) => ({ t: S1.id + i * (.6 / 22), type: 'key' })),
  ...S1.clicks.map(c => ({ t: c, type: 'click' })),
  { t: 16.0, type: 'hit_cut' }, ...S1B.b.map(c => ({ t: c, type: 'bar' })), { t: S1B.badge, type: 'ding' },
  { t: 20.7, type: 'whoosh' }, { t: 21.0, type: 'hit' }, { t: 20.75, type: 'slam' }, { t: S2.doc, type: 'paper' }, { t: 21.3, type: 'market', dur: 9.7 },
  ...S2.ticks.map(c => ({ t: c, type: 'tick_ok' })), { t: S2.stamp, type: 'stamp' },
  { t: 26.5, type: 'hit_cut' }, ...S2B.tiles.map(c => ({ t: c, type: 'flap' })), { t: S2B.range, type: 'card' }, { t: S2B.stamp, type: 'stamp' },
  { t: 30.7, type: 'whoosh' }, { t: 31.0, type: 'hit' }, { t: 30.8, type: 'slam' }, { t: 30.95, type: 'slam' }, { t: S3.stamp, type: 'stamp' },
  { t: S3.pull[0], type: 'zoom' }, ...Array.from({ length: GC }, (_, c) => ({ t: Math.round((S3.fill[0] + (S3.fill[1] - S3.fill[0]) * ieio((c + 1) / GC)) * 1000) / 1000, type: 'cell', c })),
  { t: S3.bracket, type: 'draw' }, { t: S3.sil - .35, type: 'slide' }, { t: S3.bracket + .2, type: 'pop' }, { t: S3.hit, type: 'boom' }, { t: S3.read, type: 'card' },
  { t: 43.7, type: 'whoosh' }, { t: 44.0, type: 'hit' }, { t: 43.8, type: 'slam' }, ...S4.rows.map(c => ({ t: c, type: 'slide' })), { t: S4.rows[2] + .1, type: 'sweep' },
  { t: S4.chip, type: 'pop' }, { t: S4.stamp, type: 'stamp' },
  { t: 52.7, type: 'whoosh' }, { t: 53.0, type: 'hit' }, ...[0, 1, 2, 3].map(i => ({ t: RD.ticks + i * .4, type: 'tick_ok', i })),
  { t: 56.7, type: 'whoosh' }, { t: 57.0, type: 'hit' }, { t: 56.8, type: 'slam' }, ...[0, 1, 2, 3, 4].map(i => ({ t: S5.tiles + i * .12, type: 'flap' })),
  { t: 61.25, type: 'whoosh' }, { t: 61.5, type: 'end' },
];
for (const id in VO_AT) EV.push({ t: VO_AT[id], type: 'vo', id });

window.DUR = DUR; window.EV = EV; window.VO_AT = VO_AT; window.render = render; window.TEXTS = t => { render(t); return TX; };
(async () => {
  await Promise.all([F.kr9(40), F.kr7(40), F.b8(40), F.b6(40), F.b6i(40), F.mono(40)].map(f => document.fonts.load(f, '이번 Aa')));
  render(0); window.READY = true;
})();
