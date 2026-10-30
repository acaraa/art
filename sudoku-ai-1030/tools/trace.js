// Records the plain solver (same steps as solver.js) on the film's puzzle → trace.json for the page.
// head: the first events in detail [kind, cell, digit, conflicting cell]; kind x = rule broken, p = placed, b = erased (step back).
// snaps: board state at exponentially spaced try counts, for the fast part.
const fs = require('fs');
const P = '020000070000004000703200000000600000648070020095000000019030060407005003000092701';
const g = P.split('').map(Number), head = [], HEAD = 160;
let tries = 0, back = 0, place = 0, ev = 0;
const log = e => { if (ev++ < HEAD) head.push(e); };
function conflict(i, d) { const r = (i / 9) | 0, c = i % 9, br = r - r % 3, bc = c - c % 3;
  for (let k = 0; k < 9; k++) { if (g[r * 9 + k] === d) return r * 9 + k; if (g[k * 9 + c] === d) return k * 9 + c;
    const j = (br + ((k / 3) | 0)) * 9 + bc + k % 3; if (g[j] === d) return j; } return -1; }
const snaps = [], K = 480, targets = [];
const total = 1988853;
for (let k = 0; k < K; k++) targets.push(Math.round(Math.exp(Math.log(40) + (Math.log(total) - Math.log(40)) * k / (K - 1))));
let ti = 0;
function snap() { while (ti < K && tries >= targets[ti]) { snaps.push([tries, back, g.join('')]); ti++; } }
(function rec(i) { if (i === 81) return true; if (g[i]) return rec(i + 1);
  for (let d = 1; d <= 9; d++) { tries++; const c = conflict(i, d);
    if (c < 0) { g[i] = d; place++; log(['p', i, d, -1]); snap(); if (rec(i + 1)) return true; g[i] = 0; back++; log(['b', i, d, -1]); }
    else { log(['x', i, d, c]); snap(); } }
  return false; })(0);
fs.writeFileSync(__dirname + '/../trace.json', JSON.stringify({ puzzle: P, solution: g.join(''), tries, back, place, head, snaps }));
console.log({ tries, back, place, snaps: snaps.length, head: head.length });
