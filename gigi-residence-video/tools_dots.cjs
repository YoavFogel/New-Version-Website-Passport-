// Builds assets/dots.js: land sampled on regular lat/lon grids (dot-matrix map style).
global.window = {}; require('./assets/world.js'); const W = window.WORLD;
function inRing(x, y, r) { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
const polys = W.map(c => ({ n: c.name, rings: c.rings.map(r => { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [x, y] of r) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } return { r, x0, x1, y0, y1 }; }) }));
function who(lon, lat) { for (const p of polys) for (const q of p.rings) if (lon >= q.x0 && lon <= q.x1 && lat >= q.y0 && lat <= q.y1 && inRing(lon, lat, q.r)) return p.n; return null; }
const code = n => n === 'Romania' ? 1 : n === 'Israel' ? 2 : 0;
function grid(lo0, lo1, la0, la1, st, hex) { const out = []; let row = 0; for (let la = la0; la <= la1; la += st, row++) { const off = hex && row % 2 ? st / 2 : 0; for (let lo = lo0 + off; lo <= lo1; lo += st) { const n = who(lo, la); if (n) out.push(+lo.toFixed(3), +la.toFixed(3), code(n)); } } return out; }
const coarse = grid(-30, 95, -40, 75, 1.15, true);
const med = grid(5, 50, 25, 56, 0.42, true);
const ro = grid(19.5, 31, 42.8, 49, 0.11, true);
require('fs').writeFileSync('assets/dots.js', 'window.DOTS=' + JSON.stringify({ coarse, med, ro }) + ';');
console.log(coarse.length / 3, med.length / 3, ro.length / 3);
