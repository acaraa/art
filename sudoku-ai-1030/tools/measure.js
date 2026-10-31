// Times the plain solver in solver.js on one puzzle: median of N runs, after warm-up.
// Usage: node tools/measure.js <81-digit puzzle> [runs]
const { solve } = require('../solver.js');
const p = process.argv[2].split('').map(Number), N = +(process.argv[3] || 30);
const ms = [];
for (let k = 0; k < N + 3; k++) { const g = p.slice(); const t = process.hrtime.bigint(); solve(g); const e = Number(process.hrtime.bigint() - t) / 1e6; if (k >= 3) ms.push(e); }
ms.sort((a, b) => a - b);
console.log(JSON.stringify({ runs: N, median_ms: +ms[N >> 1].toFixed(2), min_ms: +ms[0].toFixed(2), max_ms: +ms[N - 1].toFixed(2), node: process.version, cpu: require('os').cpus()[0].model }));
