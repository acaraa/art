// Character-grid engine for a vertical 1080×1920 terminal.
// The scene canvas is drawn additively: R = amber phosphor intensity, G = second-colour intensity (crt.js colours both).
// A cell is cw wide and 2·cw tall. ASCII uses VT323; Hangul and other wide characters use Nanum Gothic Coding across two cells.
export const W = 1080, H = 1920;
const GS = 160, GW = 64, GH = 128, BASE = 102.4, PAD = 4;   // atlas: VT323 at 160 px, cell 64×128
const KS = 104, KBASE = 100;                                 // Hangul size and baseline inside a two-cell slot
export const wide = ch => ch.charCodeAt(0) >= 0x1100;
export const width = s => { let n = 0; for (const ch of s) n += wide(ch) ? 2 : 1; return n; };
let A = null;

export async function initTerm(charset) {
  await document.fonts.load(`${GS}px VT323`);
  await document.fonts.load(`700 ${KS}px "Nanum Gothic Coding"`);
  const chars = [...new Set([...charset])].filter(c => c !== ' ' && c !== '\n');
  const PER = 24, slot = 2 * GW + PAD * 2, rows = Math.ceil(chars.length / PER);
  const aw = PER * slot, ah = rows * (GH + PAD * 2);
  const white = document.createElement('canvas'); white.width = aw; white.height = ah;
  const g = white.getContext('2d');
  g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineJoin = 'round';
  const pos = {};
  chars.forEach((ch, i) => {
    const x = (i % PER) * slot + PAD, y = Math.floor(i / PER) * (GH + PAD * 2) + PAD, w = wide(ch) ? 2 * GW : GW;
    pos[ch] = [x, y, w];
    g.save(); g.beginPath(); g.rect(x, y, w, GH); g.clip();
    if (wide(ch)) { g.font = `700 ${KS}px "Nanum Gothic Coding"`; g.lineWidth = 1.6; g.textAlign = 'center'; g.fillText(ch, x + GW, y + KBASE); g.strokeText(ch, x + GW, y + KBASE); }
    else { g.font = `${GS}px VT323`; g.lineWidth = 2.2; g.textAlign = 'left'; g.fillText(ch, x, y + BASE); g.strokeText(ch, x, y + BASE); }   // the stroke stands in for beam spread
    g.restore();
  });
  const tint = col => { const c = document.createElement('canvas'); c.width = aw; c.height = ah; const x = c.getContext('2d');
    x.drawImage(white, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, aw, ah); return c; };
  A = { red: tint('#ff0000'), green: tint('#00ff00'), black: tint('#000000'), pos };
}

// one glyph with its top-left corner at (x, y); a = brightness (above 1 draws twice); chan 0 = amber, 1 = second colour
export function glyph(g, ch, x, y, cw, a = 1, chan = 0) {
  if (ch === ' ' || a <= .004) return;
  const p = A.pos[ch]; if (!p) return;
  const w = p[2] === GW ? cw : cw * 2;
  g.globalAlpha = Math.min(1, a);
  g.drawImage(chan ? A.green : A.red, p[0], p[1], p[2], GH, x, y, w, cw * 2);
  if (a > 1) { g.globalAlpha = Math.min(1, a - 1); g.drawImage(chan ? A.green : A.red, p[0], p[1], p[2], GH, x, y, w, cw * 2); }
}
// a string from cell (col, row) of the view {ox, oy, cw}; wide characters take two cells
export function text(g, s, col, row, v, a = 1, chan = 0) {
  let c = col;
  for (const ch of s) { glyph(g, ch, v.ox + c * v.cw, v.oy + row * v.cw * 2, v.cw, a, chan); c += wide(ch) ? 2 : 1; }
}
// inverse video: a lit block with the glyphs knocked out in black (the scene canvas is opaque)
export function inverse(g, s, col, row, v, a = 1, chan = 0) {
  const x = v.ox + col * v.cw, y = v.oy + row * v.cw * 2;
  g.globalAlpha = Math.min(1, a); g.fillStyle = chan ? '#00ff00' : '#ff0000';
  g.fillRect(x, y + v.cw * .1, width(s) * v.cw, v.cw * 1.8);
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  let c = 0;
  for (const ch of s) { const p = A.pos[ch]; if (p && ch !== ' ') g.drawImage(A.black, p[0], p[1], p[2], GH, x + c * v.cw, y, p[2] === GW ? v.cw : v.cw * 2, v.cw * 2); c += wide(ch) ? 2 : 1; }
  g.globalCompositeOperation = 'lighter';
}
export function cursor(g, col, row, v, a = 1, chan = 0) {
  g.globalAlpha = Math.min(1, a); g.fillStyle = chan ? '#00ff00' : '#ff0000';
  g.fillRect(v.ox + col * v.cw + v.cw * .06, v.oy + row * v.cw * 2 + v.cw * .22, v.cw * .88, v.cw * 1.56);
}
