// Generates unique-solution puzzles (26 clues) and reports how much work the plain solver in solver.js does on each.
// Usage: node tools/pick.js <count> [seed]
const { ok } = require('../solver.js');
let s = +(process.argv[3] || 1);
const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
function count(g, lim) { // number of solutions up to lim
  const i = g.indexOf(0); if (i < 0) return 1; let n = 0;
  for (let d = 1; d <= 9 && n < lim; d++) if (ok(g, i, d)) { g[i] = d; n += count(g, lim - n); g[i] = 0; }
  return n;
}
function full(g) { const i = g.indexOf(0); if (i < 0) return true;
  for (const d of shuffle([1,2,3,4,5,6,7,8,9])) if (ok(g, i, d)) { g[i] = d; if (full(g)) return true; g[i] = 0; } return false; }
function work(p) { const g = p.slice(); let tries = 0, back = 0, place = 0;
  (function rec(i) { if (i === 81) return true; if (g[i]) return rec(i + 1);
    for (let d = 1; d <= 9; d++) { tries++; if (ok(g, i, d)) { g[i] = d; place++; if (rec(i + 1)) return true; g[i] = 0; back++; } } return false; })(0);
  return { tries, back, place }; }
const N = +(process.argv[2] || 20);
for (let n = 0; n < N; n++) {
  const g = new Array(81).fill(0); full(g); const p = g.slice(); let clues = 81;
  for (const i of shuffle([...Array(81).keys()])) { if (clues <= 26) break; const k = p[i]; p[i] = 0; if (count(p.slice(), 2) !== 1) p[i] = k; else clues--; }
  console.log(JSON.stringify({ clues, ...work(p), p: p.join('') }));
}
