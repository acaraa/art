// 빈칸에 1부터 넣어 보고, 막히면 한 칸 되돌아간다
function ok(g, i, d) {
  const r = Math.floor(i / 9), c = i % 9;
  const br = r - r % 3, bc = c - c % 3;
  for (let k = 0; k < 9; k++) {
    if (g[r * 9 + k] === d) return false;
    if (g[k * 9 + c] === d) return false;
    if (g[(br + Math.floor(k / 3)) * 9 + bc + k % 3] === d) return false;
  }
  return true;
}
function solve(g, i = 0) {
  if (i === 81) return true;
  if (g[i] !== 0) return solve(g, i + 1);
  for (let d = 1; d <= 9; d++) {
    if (ok(g, i, d)) {
      g[i] = d;
      if (solve(g, i + 1)) return true;
      g[i] = 0;
    }
  }
  return false;
}
if (typeof module !== 'undefined') module.exports = { ok, solve };
