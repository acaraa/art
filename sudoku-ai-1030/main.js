// AI는 스도쿠를 몇 초 만에 풀까 — the whole film. window.render(t) draws second t; window.EV holds the sound, voice and subtitle cues.
// Board states come from trace.json (tools/trace.js runs solver.js on the puzzle); the code on screen is solver.js itself.
import { W, H, initTerm, text, inverse, cursor, width } from './term.js';
import { makeCRT } from './crt.js';

const out = document.getElementById('c');
const crt = makeCRT(out);
crt.params.earth = [.72, .9, 1.0];                    // the one second colour: ice white-blue, used only for the solved board
const scene = document.createElement('canvas'); scene.width = W; scene.height = H;
const g = scene.getContext('2d');
const TR = await (await fetch('trace.json')).json();
const LINES = await (await fetch('vo/lines.json')).json();
const VDUR = await (await fetch('vo/dur.json')).json();
const CODE = (await (await fetch('solver.js')).text()).split('\n').filter(l => !l.startsWith('if (typeof module')).filter((l, i, a) => i < a.length - 1 || l);

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const eio = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const lerp = (a, b, t) => a + (b - a) * t;
const TAU = .12;                                                     // amber phosphor afterglow
const decay = (t, t0) => t < t0 ? 1 : Math.exp(-(t - t0) / TAU);
const blink = (t, t0, p = .5) => t < t0 ? 0 : ((t - t0) % p < p / 2 ? 1 : decay((t - t0) % p, p / 2));
const fmt = n => n.toLocaleString('en-US');

// ===================== Timeline (120 BPM: beat 0.5 s) =====================
const T = {
  cmd: .05, board0: .55, q: .6, push0: 3.5, push1: 4.3, pull0: 12.0, pull1: 12.8, fast1: 19.4, solve: 20.0, ans: 20.5,
  clear1: 26.5, code0: 26.55, push2: 30.5, push3: 31.25, clear2: 34.5, endQ: 34.6, brand: 35.5, dur: 39.0,
};
const VO_AT = { v1: .6, v2: 3.6, v3: 7.15, v4: 9.25, v5: 12.5, v6: 20.5, v7: 22.95, v8: 26.75, v9: 31.15, v10: 34.6 };
const EV = [];
const ev = (t, type, o = {}) => EV.push({ t: +t.toFixed(4), type, ...o });

// ===================== Text =====================
const CMD = '> node solver.js puzzle.txt';
const Q1 = 'Q. AI는 이 스도쿠를 몇 초 만에 풀까?';
const A1 = 'A. 0.04초';
const Q2 = 'Q. 당신은 몇 분 걸리나요?';
const BRAND = '제작 @noah.aiart';
const LBL_T = '숫자 대 본 횟수', LBL_B = '되돌아간 횟수';
const CODECMD = '> cat solver.js';
const KEYLINE = 18, NOTE = '← 되돌리기';
const STATUS_L = ' SOLVER ', STATUS_M = ' puzzle.txt', STATUS_R = '@noah.aiart';

// ===================== Layout and camera =====================
// Everything between the status line and the LOG strip sits on one grid that the camera scales about F (font size = camera).
const F = { x: 540, y: 760 };          // YouTube Shorts covers roughly the bottom fifth: everything that matters stays above y ≈ 1500
const BCW = 30, BOARD = { ox: F.x - 12.5 * BCW, oy: F.y - 13 * BCW, cw: BCW };     // 25 × 13 cells
const VCMD = { ox: BOARD.ox, oy: 300, cw: 20 };
const VCNT = { ox: BOARD.ox, oy: 1185, cw: 24 };
const VCODE = { ox: 34, oy: 372, cw: 13.2 };
const VCODECMD = { ox: 34, oy: 300, cw: 20 };
const head = (s, cw, y) => ({ ox: Math.round((W - width(s) * cw) / 2), oy: y, cw });
const VQ1 = head(Q1, 23, 176), VA1 = head(A1, 46, 140), VQ2 = head(Q2, 26, 170);
const VBR = head(BRAND, 26, 1200);
const VSTAT = { ox: 40, oy: 52, cw: 18 };
const STRIP = { sep: { ox: 40, oy: 1318, cw: 20 }, txt: { ox: 40, oy: 1364, cw: 22 }, cols: 45 };

function zoom(t) {
  if (t < T.pull0) return lerp(1, 1.2, eio(seg(t, T.push0, T.push1)));
  if (t < T.clear1) return lerp(1.2, 1, eio(seg(t, T.pull0, T.pull1))) + .05 * seg(t, T.pull1, T.fast1);
  return 1;
}
const cmdA = z => 1 - seg(z, 1.06, 1.14);
const cam = (v, z, fx = F.x, fy = F.y, cx = F.x, cy = F.y) => ({ ox: cx + (v.ox - fx) * z, oy: cy + (v.oy - fy) * z, cw: v.cw * z });

// ===================== Board =====================
const P = TR.puzzle.split('').map(Number), S = TR.solution.split('').map(Number);
const colOf = i => 2 + (i % 9) * 2 + Math.floor((i % 9) / 3) * 2;
const rowOf = i => 1 + Math.floor(i / 9) + Math.floor(Math.floor(i / 9) / 3);
const SEP = '+-------+-------+-------+';
function frame(v, a) {
  for (let r = 0; r < 13; r++) {
    if (r % 4 === 0) { text(g, SEP, 0, r, v, a); continue; }
    for (const c of [0, 8, 16, 24]) text(g, '|', c, r, v, a);
  }
}
// cell(i) → { ch, a, chan, inv } ; the board's look per cell is decided by the section
function board(v, cell) {
  frame(v, .3);
  for (let i = 0; i < 81; i++) {
    const c = cell(i); if (!c) continue;
    for (const L of c.layers || [c]) {
      if (L.inv) inverse(g, L.ch, colOf(i), rowOf(i), v, L.a, L.chan || 0);
      else text(g, L.ch, colOf(i), rowOf(i), v, L.a, L.chan || 0);
    }
  }
}
const givenOrDot = i => P[i] ? { ch: String(P[i]), a: 1 } : { ch: '.', a: .16 };

// --- the slow part: the first 59 solver steps, each on its own time
const HEAD = TR.head.slice(0, 59);
const ET = HEAD.map((e, k) => k === 0 ? 5.75 : k <= 4 ? 7.25 + (k - 1) * .5 : k <= 46 ? 8.95 + (k - 5) * (.45 / 41) : k <= 55 ? 9.5 + (k - 47) * .2 : k === 56 ? 11.4 : k === 57 ? 11.65 : 11.85);
function slowCell(t) {
  const val = P.slice(), prev = new Array(81).fill(0), tch = new Array(81).fill(-9);
  let cur = -1;
  for (let k = 0; k < HEAD.length && ET[k] <= t; k++) {
    const [kind, i, d] = HEAD[k]; cur = k;
    if (kind === 'p') { prev[i] = val[i]; val[i] = d; tch[i] = ET[k]; }
    if (kind === 'b') { prev[i] = val[i]; val[i] = 0; tch[i] = ET[k] + .3; }
  }
  const e = cur >= 0 ? HEAD[cur] : null, te = cur >= 0 ? ET[cur] : 0;
  const tn = cur + 1 < ET.length ? ET[cur + 1] : te + 1;
  const hold = Math.min(.22, tn - te);
  const glow = (ch, t0) => ({ ch, a: .62 * decay(t, t0) });
  return i => {
    const layers = [];
    if (P[i]) layers.push({ ch: String(P[i]), a: 1 });
    else if (val[i]) layers.push({ ch: String(val[i]), a: .62 + .7 * Math.exp(-(t - tch[i]) / .15) });
    else if (prev[i] && t - tch[i] < .8) layers.push(glow(String(prev[i]), tch[i]));
    else layers.push({ ch: '.', a: .16 });
    if (e && e[0] === 'x') {
      const [, ci, d, cf] = e;
      if (i === ci) { if (t < te + hold) return { layers: [{ ch: String(d), a: 1, inv: true }] }; layers.length = 0; layers.push({ ch: String(d), a: .9 * decay(t, te + hold) }); if (t - te - hold > .5) layers[0] = { ch: '.', a: .16 }; }
      if (i === cf && t < te + hold) return { layers: [{ ch: String(P[cf] || val[cf]), a: 1, inv: true }] };
    }
    if (e && e[0] === 'b' && i === e[1] && t < te + .3) return { layers: [{ ch: String(e[2]), a: 1, inv: true }] };
    return { layers };
  };
}

// --- the fast part: board snapshots at exponentially growing try counts
const SN = TR.snaps;
const fastIndex = t => {
  const u = seg(t, T.pull0, T.fast1), target = 58 * Math.pow(TR.tries / 58, u);
  let lo = 0; while (lo + 1 < SN.length - 1 && SN[lo + 1][0] <= target) lo++;
  return Math.min(lo, SN.length - 2);                // the last snapshot is the solution, kept for the colour change
};
function fastCell(t) {
  const k = fastIndex(t), kp = fastIndex(t - .1), s = SN[k][2], sp = SN[kp][2];
  return i => {
    if (P[i]) return { ch: String(P[i]), a: 1 };
    const d = +s[i];
    if (!d) return { ch: '.', a: .16 };
    return { ch: s[i], a: s[i] !== sp[i] ? 1.15 : .62 };
  };
}
const solvedCell = t => i => P[i] ? { ch: String(P[i]), a: 1 } : { ch: String(S[i]), a: 1 + .9 * Math.exp(-(t - T.solve) / .35), chan: 1 };

// ===================== Narration, subtitles and the LOG strip =====================
const VO = LINES.map(L => ({ id: L.id, t: VO_AT[L.id], d: VDUR[L.id], text: L.text }));
VO.forEach((v, k) => { v.t1 = Math.max(v.t + 1.8, v.t + v.d + .6); if (VO[k + 1]) v.t1 = Math.min(v.t1, VO[k + 1].t - .05); });
function wrap(s, cols) {
  const out = []; let line = '';
  for (const w of s.split(' ')) { const tryL = line ? line + ' ' + w : w; if (width(tryL) > cols && line) { out.push(line); line = w; } else line = tryL; }
  if (line) out.push(line); return out;
}
function strip(t) {
  const v = STRIP.sep;
  text(g, '-'.repeat(50), 0, 0, v, .22);
  inverse(g, ' LOG ', 0, 1.15, v, .75);
  const tv = STRIP.txt, c0 = 6;
  const L = VO.find(o => t >= o.t && t < o.t1);
  if (L) {
    const words = L.text.split(' '), shown = Math.ceil(words.length * seg(t, L.t, L.t + L.d * .92));
    const lines = wrap(words.slice(0, Math.max(1, shown)).join(' '), STRIP.cols - c0 - 2);
    lines.forEach((s, r) => text(g, s, c0, r * 1.25, tv, .95));
    const last = lines[lines.length - 1];
    if (shown < words.length) cursor(g, c0 + width(last) + 1, (lines.length - 1) * 1.25, tv, .8);
    return;
  }
  let msg = '>';
  if (t > T.v5end && t < T.fast1) msg = '> 계산 중 ' + '|/-\\'[Math.floor(t * 12) % 4];
  text(g, msg, c0, 0, tv, .7);
  cursor(g, c0 + width(msg) + 1, 0, tv, .8 * blink(t, 0));
}
T.v5end = VO_AT.v5 + VDUR.v5 + .6;

// ===================== Scenes =====================
function status() {
  inverse(g, STATUS_L, 0, 0, VSTAT, .8);
  text(g, STATUS_M, width(STATUS_L), 0, VSTAT, .55);
  text(g, STATUS_R, 55 - width(STATUS_R), 0, VSTAT, .8);
}
const typed = (s, t, t0, dt) => [...s].slice(0, clamp(Math.floor((t - t0) / dt) + 1, 0, [...s].length)).join('');
function typeLine(s, t, t0, dt, col, row, v, a = 1, cur = true) {
  if (t < t0) return;
  const shown = typed(s, t, t0, dt); text(g, shown, col, row, v, a);
  const done = shown.length === [...s].length;
  if (cur && !done) cursor(g, col + width(shown), row, v, .9);
}
const ROWS_DT = (.8) / 13;

function sQuestion(t) {
  const z = zoom(t);
  typeLine(CMD, t, T.cmd, .018, 0, 0, cam(VCMD, z), .7 * cmdA(z), false);
  // the board arrives as teletype output, row by row
  const v = cam(BOARD, z);
  const rowsShown = Math.floor((t - T.board0) / ROWS_DT) + 1;
  if (rowsShown <= 0) return;
  if (rowsShown < 13) {
    for (let r = 0; r < rowsShown; r++) {
      if (r % 4 === 0) { text(g, SEP, 0, r, v, .3); continue; }
      const br = r - 1 - Math.floor(r / 4);
      let s = ''; for (let c = 0; c < 9; c++) { if (c % 3 === 0) s += '| '; s += (P[br * 9 + c] || '.') + ' '; } s += '|';
      for (let c = 0; c < s.length; c++) { const ch = s[c]; text(g, ch, c, r, v, ch === '|' ? .3 : ch === '.' ? .16 : 1); }
    }
    return;
  }
  board(v, t < ET[0] - .01 ? givenOrDot : slowCell(t));
  // the cell being worked on gets a cursor while the rules are explained
  if (t > T.push1 && t < ET[0]) cursor(g, colOf(0), rowOf(0), v, .6 * blink(t, T.push1));
}
function counters(t, tries, back, a = .85) {
  const v = cam(VCNT, zoom(t));
  text(g, LBL_T, 0, 0, v, .6); text(g, fmt(tries).padStart(10), 16, 0, v, a);
  text(g, LBL_B, 0, 1.25, v, .6); text(g, fmt(back).padStart(10), 16, 1.25, v, a);
}
function sFast(t) {
  const z = zoom(t);
  text(g, CMD, 0, 0, cam(VCMD, z), .7 * cmdA(z));
  const k = fastIndex(t);
  board(cam(BOARD, z), fastCell(t));
  if (t >= T.pull1 - .3) counters(t, SN[k][0], SN[k][1], t < T.fast1 ? .85 : .5);
}
function sSolved(t) {
  const z = zoom(t);
  text(g, CMD, 0, 0, cam(VCMD, z), .7 * cmdA(z));
  board(cam(BOARD, z), solvedCell(t));
  counters(t, TR.tries, TR.back, 1);
}
const codeFocus = { x: VCODE.ox + (6 + 11) * VCODE.cw,          // centre of 'g[i] = 0;  ← 되돌리기'
  y: VCODE.oy + KEYLINE * 2 * VCODE.cw + VCODE.cw };
function sCode(t) {
  const e = eio(seg(t, T.push2, T.push3)), z = lerp(1, 3.1, e);
  const fx = lerp(F.x, codeFocus.x, e), fy = lerp(F.y, codeFocus.y, e);
  const C = v => cam(v, z, fx, fy);
  g.save(); g.beginPath(); g.rect(0, 112, W, 1190); g.clip();      // the code stays between the status line and the LOG strip
  text(g, CODECMD, 0, 0, C(VCODECMD), .7);
  const n = Math.floor((t - T.code0) / .052) + 1;
  const dimOthers = 1 - .8 * seg(t, T.push3 - .3, T.push3 + .2);
  CODE.slice(0, clamp(n, 0, CODE.length)).forEach((l, r) => {
    if (r === KEYLINE && t >= T.push3) { text(g, l.slice(0, 6), 0, r, C(VCODE), .2); inverse(g, l.trim(), 6, r, C(VCODE), .95); return; }
    text(g, l, 0, r, C(VCODE), r === KEYLINE ? .85 : .72 * dimOthers);
  });
  if (n >= CODE.length) text(g, `-- ${CODE.length} lines --`, 0, CODE.length + .5, C(VCODE), .4 * dimOthers);
  if (t >= T.push3 + .25) typeLine(NOTE, t, T.push3 + .25, .07, 6 + width(CODE[KEYLINE].trim()) + 2, KEYLINE, C(VCODE), .75, false);
  g.restore();
}
function sEnd(t) {
  board(BOARD, givenOrDot);
  cursor(g, colOf(0), rowOf(0), BOARD, .85 * blink(t, T.clear2 + .2, .6));
  typeLine(Q2, t, T.endQ, .05, 0, 0, VQ2, 1);
  typeLine(BRAND, t, T.brand, .06, 0, 0, VBR, .9, false);
}

// ===================== Events (sound, voice, subtitles) =====================
[...CMD].forEach((ch, i) => ev(T.cmd + i * .018, ch === ' ' ? 'space' : 'key', { v: .6 }));
ev(T.cmd + CMD.length * .018 + .02, 'enter');
for (let r = 0; r < 13; r++) ev(T.board0 + r * ROWS_DT, 'tick');
[...Q1].forEach((ch, i) => { if (ch !== ' ') ev(T.q + i * .025, 'remote'); });
ev(T.push0, 'zoomIn', { d: .8 }); ev(T.pull0, 'zoomOut', { d: .8 });
HEAD.forEach((e, k) => {
  const [kind, i, d] = e;
  if (kind === 'p') ev(ET[k], 'place', { soft: k > 4 && k < 47 });
  if (kind === 'x') ev(ET[k], 'err', { n: k >= 47 && k <= 55 ? k - 47 : -1, soft: k > 4 && k < 47 });
  if (kind === 'b') ev(ET[k], 'erase');
});
for (let f = Math.ceil(T.pull0 * 30); f / 30 < T.fast1; f++) {
  const t = f / 30, a = SN[fastIndex(t)][2], b = SN[fastIndex(t - 1 / 30)][2];
  let n = 0; for (let i = 0; i < 81; i++) if (a[i] !== b[i]) n++;
  if (n) ev(t, 'grain', { n });
}
ev(T.solve, 'solve');
[...A1].forEach((ch, i) => { if (ch !== ' ') ev(T.ans + i * .09, 'key', { v: .8 }); });
ev(T.clear1, 'clear');
[...CODECMD].forEach((ch, i) => ev(T.code0 - .2 + i * .012, 'key', { v: .35 }));
CODE.forEach((l, r) => ev(T.code0 + r * .052, 'tick', { v: .55 }));
ev(T.push2, 'zoomIn', { d: .75 }); ev(T.push3, 'mark');
ev(T.clear2, 'clear');
[...Q2].forEach((ch, i) => { if (ch !== ' ') ev(T.endQ + i * .05, 'key', { v: .7 }); });
[...BRAND].forEach((ch, i) => { if (ch !== ' ') ev(T.brand + i * .06, 'remote'); });
VO.forEach(v => { ev(v.t, 'vo', { id: v.id }); ev(v.t, 'sub', { t1: +v.t1.toFixed(3), text: v.text }); });
EV.sort((a, b) => a.t - b.t);

// ===================== Texts for the reading-time check =====================
const box = (id, s, col, row, v) => ({ id, text: s, x0: v.ox + col * v.cw, y0: v.oy + row * 2 * v.cw, x1: v.ox + (col + width(s)) * v.cw, y1: v.oy + (row + 1) * 2 * v.cw });
window.TEXTS = t => {
  const o = [box('status', STATUS_L + STATUS_M + ' ' + STATUS_R, 0, 0, { ...VSTAT, cw: VSTAT.cw * 55 / width(STATUS_L + STATUS_M + ' ' + STATUS_R) })];
  if (t >= T.q && t < T.solve) o.push(box('q1', Q1, 0, 0, VQ1));
  if (t >= T.cmd && t < T.clear1 && cmdA(zoom(t)) > .95) o.push(box('cmd', CMD, 0, 0, cam(VCMD, zoom(t))));
  if (t >= T.ans && t < T.clear1) o.push(box('a1', A1, 0, 0, VA1));
  if (t >= T.solve && t < T.clear1) { const v = cam(VCNT, zoom(t)); o.push(box('c1', LBL_T + ' ' + fmt(TR.tries), 0, 0, { ...v, cw: v.cw * 26 / width(LBL_T + ' ' + fmt(TR.tries)) }), box('c2', LBL_B + ' ' + fmt(TR.back), 0, 1.25, { ...v, cw: v.cw * 26 / width(LBL_B + ' ' + fmt(TR.back)) })); }
  if (t >= T.push3 && t < T.clear2) { const z = 3.1, C = v => cam(v, z, codeFocus.x, codeFocus.y); o.push(box('key', CODE[KEYLINE].trim(), 6, KEYLINE, C(VCODE)), box('note', NOTE, 6 + width(CODE[KEYLINE].trim()) + 2, KEYLINE, C(VCODE))); }
  if (t >= T.endQ) o.push(box('q2', Q2, 0, 0, VQ2));
  if (t >= T.brand) o.push(box('brand', BRAND, 0, 0, VBR));
  return o;
};

// ===================== Main =====================
function film(t) {
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'lighter';
  status();
  if (t < T.pull0) sQuestion(t);
  else if (t < T.solve) sFast(t);
  else if (t < T.clear1) sSolved(t);
  else if (t < T.clear2) sCode(t);
  else sEnd(t);
  // headers sit outside the camera, like the status line
  if (t >= T.q && t < T.solve) typeLine(Q1, t, T.q, .025, 0, 0, VQ1, 1, false);
  if (t >= T.ans && t < T.clear1) typeLine(A1, t, T.ans, .09, 0, 0, VA1, 1.15);
  strip(t);
  // a cleared screen keeps a short afterglow of what was there
  for (const tc of [T.clear1, T.clear2]) if (t >= tc && t < tc + .5) { const k = decay(t, tc); g.globalAlpha = 1; g.fillStyle = `rgba(255,0,0,${.06 * k})`; g.fillRect(0, 120, W, 1180); }
}

const CHARSET = [CMD, Q1, A1, Q2, BRAND, LBL_T, LBL_B, CODECMD, NOTE, STATUS_L, STATUS_M, STATUS_R, SEP, '0123456789.|-> ,', '|/-\\', '계산 중', ' LOG ', `-- ${CODE.length} lines --`, ...CODE, ...LINES.map(L => L.text)].join('');
await initTerm(CHARSET);
window.DUR = T.dur; window.EV = EV;
window.render = t => { film(t); crt.render(scene, Math.round(t * 30), {}); };
window.READY = true;
