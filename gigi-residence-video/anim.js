/* GIGI RESIDENCE BY ISROMANA — 102 s motion-graphics film (v2).
 * Visual language: flat royal-blue / near-black fields, dot-matrix maps, heavy
 * Hebrew typography, rolling numbers with motion blur, white UI cards, clean
 * elevation-view architecture. Every frame is a pure function of time:
 * renderFrame(t). Design space 1920x1080, backing store scaled by SCALE.
 * Timing is locked to the supplied voiceover (see README.md). */
'use strict';

const W = 1920, H = 1080;
const SCALE = Number(new URLSearchParams(location.search).get('scale') || 2);
const cv = document.getElementById('c');
cv.width = W * SCALE; cv.height = H * SCALE;
const ctx = cv.getContext('2d');
const FONT = "Almoni, 'Noto Sans Hebrew'";   // licensed Almoni is used automatically when its files are present

// ---------------------------------------------------------------- palette
const C = {
  black: [8, 9, 14], ink: [14, 16, 26], royal: [38, 44, 168], royal2: [30, 34, 140], royalHi: [92, 108, 255],
  white: [255, 255, 255], soft: [226, 230, 242], green: [86, 196, 132], greenD: [52, 150, 98], gold: [214, 182, 121],
  warm: [255, 200, 128], dusk: [20, 22, 58],
};
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// ---------------------------------------------------------------- math
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const P = (t, a, b) => clamp((t - a) / (b - a));
const ss = t => t * t * (3 - 2 * t);
const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eo = t => 1 - Math.pow(1 - t, 3);
const eo5 = t => 1 - Math.pow(1 - t, 5);
const ei = t => t * t * t;
const expo = t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
const eob = t => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const win = (t, a, b, c, d) => Math.min(ss(P(t, a, b)), 1 - ss(P(t, c, d)));
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ---------------------------------------------------------------- geography (see README: verify before release)
const GEO = {
  telaviv: [32.0853, 34.7818], bucharest: [44.4268, 26.1025], otp: [44.5711, 26.0850],
  corbeanca: [44.6005, 26.0450], valueCentre: [44.6125, 26.0840],
  lidl: [44.5945, 26.0530], mega: [44.6040, 26.0385], penny: [44.5885, 26.0440],
};
const DN1 = [[44.447, 26.084], [44.466, 26.080], [44.480, 26.075], [44.500, 26.080], [44.520, 26.078], [44.540, 26.075], [44.556, 26.073], [44.572, 26.076], [44.590, 26.080], [44.606, 26.083], [44.625, 26.089], [44.650, 26.096], [44.690, 26.103]];
const ROUTE = [GEO.otp, [44.5725, 26.0790], [44.5760, 26.0748], [44.5830, 26.0660], [44.5915, 26.0560], [44.5975, 26.0490], GEO.corbeanca];
const A0C = [44.432, 26.100], A0R = [0.140, 0.205];
const a0pt = th => [A0C[0] + A0R[0] * Math.sin(th), A0C[1] + A0R[1] * Math.cos(th)];
const D2R = Math.PI / 180;
const mercY = lat => Math.log(Math.tan(Math.PI / 4 + lat * D2R / 2)) / D2R;

// ---------------------------------------------------------------- text
function font(size, weight = 400) { ctx.font = `${weight} ${size}px ${FONT}`; }
function text(str, x, y, o = {}) {
  const { size = 28, weight = 500, color = '#fff', alpha = 1, align = 'center', rtl = false, spacing = 0, blur = 0 } = o;
  if (alpha <= 0.002) return;
  ctx.save(); ctx.globalAlpha *= alpha; font(size, weight);
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.direction = rtl ? 'rtl' : 'ltr';
  if (spacing) ctx.letterSpacing = spacing + 'px';
  if (blur > 0.3) ctx.filter = `blur(${blur}px)`;
  ctx.fillText(str, x, y); ctx.restore();
}
// Hebrew kinetic line: words rise out of a mask one after another (right → left)
function kinetic(str, x, y, t0, o = {}) {
  const { size = 60, weight = 800, color = '#fff', stagger = 0.07, dur = 0.55, out = 1e9, outDur = 0.4, alpha = 1 } = o;
  const words = str.split(' ');
  font(size, weight);
  const sp = size * 0.26, ws = words.map(w => ctx.measureText(w).width);
  const total = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
  let xr = x + total / 2;
  words.forEach((w, i) => {
    const u = P(o.now, t0 + i * stagger, t0 + i * stagger + dur);
    const v = P(o.now, out + i * stagger * 0.5, out + i * stagger * 0.5 + outDur);
    if (u > 0 && v < 1) {
      ctx.save();
      ctx.beginPath(); ctx.rect(xr - ws[i] - 4, y - size * 0.75, ws[i] + 8, size * 1.5); ctx.clip();
      const dy = (1 - expo(u)) * size * 1.1 - ei(v) * size * 1.1;
      const bl = (1 - u) * 6 + v * 6;
      text(w, xr, y + dy, { size, weight, color, align: 'right', rtl: true, alpha: alpha * (0.2 + 0.8 * u), blur: bl });
      ctx.restore();
    }
    xr -= ws[i] + sp;
  });
}
// rolling number: chars given in visual (LTR) order; digits roll with motion blur
function rollNumber(chars, cx, cy, t0, o = {}) {
  const { size = 260, weight = 900, color = '#fff', dur = 1.1, alpha = 1, spins = 2, now } = o;
  font(size, weight);
  const dw = Math.max(...'0123456789'.split('').map(d => ctx.measureText(d).width));
  const widths = chars.map(c => /\d/.test(c) ? dw : ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) - size * 0.02 * (chars.length - 1);
  let x = cx - total / 2;
  chars.forEach((c, i) => {
    const w = widths[i], ts = t0 + i * 0.06;
    ctx.save();
    ctx.beginPath(); ctx.rect(x - 10, cy - size * 0.62, w + 20, size * 1.24); ctx.clip();
    if (/\d/.test(c)) {
      const d = +c, u = P(now, ts, ts + dur + i * 0.08), e = eo5(u);
      const pos = e * (spins * 10 + d);                 // total digits scrolled
      const vel = u < 1 ? (spins * 10 + d) * 5 * Math.pow(1 - u, 4) / (dur + i * 0.08) : 0;
      const base = Math.floor(pos), f = pos - base;
      const bl = Math.min(18, vel * 0.9);
      for (let k = -1; k <= 1; k++) {
        const dig = ((base + k) % 10 + 10) % 10;
        text(String(dig), x + w / 2, cy - (k - f) * size * 1.05, { size, weight, color, alpha: alpha * (u > 0 ? 1 : 0), blur: bl });
      }
    } else {
      const u = eo(P(now, ts + 0.15, ts + 0.7));
      text(c, x + w / 2, cy + (1 - u) * size * 0.5, { size, weight, color, alpha: alpha * u, blur: (1 - u) * 10 });
    }
    ctx.restore();
    x += w - size * 0.02;
  });
  return total;
}
function pill(str, x, y, o = {}) {
  const { size = 26, weight = 700, bg = '#fff', color = rgb(C.royal), alpha = 1, rtl = true, s = 1, dot = null, icon = null } = o;
  if (alpha <= 0.002 || s <= 0.01) return;
  font(size, weight);
  const tw = ctx.measureText(str).width, pad = size * 0.75, extra = (dot || icon) ? size * 1.0 : 0;
  const w = tw + pad * 2 + extra, h = size * 1.9;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.scale(s, s);
  ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
  ctx.fillStyle = bg; rr(-w / 2, -h / 2, w, h, h / 2); ctx.fill(); ctx.shadowColor = 'transparent';
  const ix = rtl ? w / 2 - pad - size * 0.35 : -w / 2 + pad + size * 0.35;
  if (dot) { ctx.fillStyle = dot; ctx.beginPath(); ctx.arc(ix, 0, size * 0.32, 0, 7); ctx.fill(); }
  if (icon) icon(ix, 0, size);
  ctx.restore();
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.scale(s, s);
  text(str, rtl ? (w / 2 - pad - extra) : (-w / 2 + pad + extra), 1, { size, weight, color, align: rtl ? 'right' : 'left', rtl });
  ctx.restore();
  return w;
}
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function card(x, y, w, h, o = {}) {
  const { r = 34, fill = '#fff', alpha = 1, shadow = true } = o;
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha *= alpha;
  if (shadow) { ctx.shadowColor = 'rgba(0,0,20,0.45)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 26; }
  ctx.fillStyle = fill; rr(x, y, w, h, r); ctx.fill(); ctx.restore();
}

// ---------------------------------------------------------------- icons
function planeIcon(x, y, ang, s, color = '#fff') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s); ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(14, 0); ctx.quadraticCurveTo(14, -2, 10, -2); ctx.lineTo(3, -2); ctx.lineTo(-4, -12); ctx.lineTo(-7, -12); ctx.lineTo(-2, -2);
  ctx.lineTo(-9, -2); ctx.lineTo(-12, -6); ctx.lineTo(-14, -6); ctx.lineTo(-12, 0); ctx.lineTo(-14, 6); ctx.lineTo(-12, 6); ctx.lineTo(-9, 2);
  ctx.lineTo(-2, 2); ctx.lineTo(-7, 12); ctx.lineTo(-4, 12); ctx.lineTo(3, 2); ctx.lineTo(10, 2); ctx.quadraticCurveTo(14, 2, 14, 0); ctx.fill();
  ctx.restore();
}
function houseGlyph(x, y, s, color, lw = 3) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = color; ctx.lineWidth = lw / s; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-14, -2); ctx.lineTo(0, -15); ctx.lineTo(14, -2); ctx.moveTo(-10, -5); ctx.lineTo(-10, 13); ctx.lineTo(10, 13); ctx.lineTo(10, -5);
  ctx.moveTo(-3, 13); ctx.lineTo(-3, 5); ctx.lineTo(3, 5); ctx.lineTo(3, 13); ctx.stroke(); ctx.restore();
}
function chartGlyph(x, y, s, color, lw = 3) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = color; ctx.lineWidth = lw / s; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-14, -14); ctx.lineTo(-14, 13); ctx.lineTo(15, 13);
  ctx.moveTo(-9, 6); ctx.lineTo(-2, -2); ctx.lineTo(3, 3); ctx.lineTo(12, -9); ctx.moveTo(6, -9); ctx.lineTo(12, -9); ctx.lineTo(12, -3); ctx.stroke(); ctx.restore();
}
function arrowUp(x, y, size, color) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = color; ctx.lineWidth = size * 0.12; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const s = size * 0.3; ctx.beginPath(); ctx.moveTo(-s, s); ctx.lineTo(s, -s); ctx.moveTo(-s * 0.2, -s); ctx.lineTo(s, -s); ctx.lineTo(s, s * 0.2); ctx.stroke(); ctx.restore();
}
function pin(x, y, s, a = 1, pulse = -1, core = rgb(C.royal)) {
  if (a <= 0 || s <= 0.01) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(s, s);
  if (pulse >= 0) for (const k of [0, 0.5]) { const p = (pulse + k) % 1; ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - p)})`; ctx.lineWidth = 2 / s; ctx.beginPath(); ctx.arc(0, 0, 18 + 60 * p, 0, 7); ctx.stroke(); }
  ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 18, 0, 7); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.fillStyle = core; ctx.beginPath(); ctx.arc(0, 0, 8, 0, 7); ctx.fill();
  ctx.restore();
}
function polyLen(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; }
function strokePartial(pts, f, style) {
  if (f <= 0 || pts.length < 2) return null;
  const L = polyLen(pts) * clamp(f);
  ctx.save(); Object.assign(ctx, style || {});
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  let acc = 0, head = [pts[0][0], pts[0][1], 0];
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const seg = Math.hypot(x1 - x0, y1 - y0), ang = Math.atan2(y1 - y0, x1 - x0);
    if (acc + seg >= L) { const u = seg ? (L - acc) / seg : 0; head = [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, ang]; ctx.lineTo(head[0], head[1]); break; }
    acc += seg; ctx.lineTo(x1, y1); head = [x1, y1, ang];
  }
  ctx.stroke(); ctx.restore();
  return head;
}
// circular reveal of a new background colour from a point
function circleReveal(col, x, y, u) {
  if (u <= 0) return;
  const r = Math.hypot(Math.max(x, W - x), Math.max(y, H - y)) * eio(u) * 1.02;
  ctx.fillStyle = rgb(col); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
}

// ---------------------------------------------------------------- assets
const IMG = {};
function loadImg(k, src) { return new Promise(r => { const i = new Image(); i.onload = () => { IMG[k] = i; r(); }; i.onerror = () => r(); i.src = src; }); }
function drawLogoCorner(a) {
  const img = IMG.logo; if (!img || a <= 0) return;
  const w = W * 0.06, h = w * img.height / img.width;
  ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = 'screen';
  ctx.drawImage(img, W * 0.04, H * 0.04, w, h); ctx.restore();
}

// ================================================================= DOT MAPS
const DOTS = window.DOTS;
function unpack(arr) { const o = []; for (let i = 0; i < arr.length; i += 3) o.push([arr[i + 1], arr[i], arr[i + 2]]); return o; } // [lat, lon, code]
const D_COARSE = unpack(DOTS.coarse), D_MED = unpack(DOTS.med), D_RO = unpack(DOTS.ro);

function mproj(cam, lat, lon) {
  const dx = (lon - cam.lon) * cam.z, dy = -(mercY(lat) - mercY(cam.lat)) * cam.z;
  const c = Math.cos(cam.rot || 0), s = Math.sin(cam.rot || 0);
  return [W / 2 + (cam.ox || 0) + dx * c - dy * s, H / 2 + (cam.oy || 0) + dx * s + dy * c];
}
function track(keys, t) {
  if (t <= keys[0].t) return { ...keys[0] };
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t < b.t) {
      const u = (b.ease || eio)(P(t, a.t, b.t));
      const za = Math.log(a.z), zb = Math.log(b.z), z = Math.exp(lerp(za, zb, u));
      let w = u;
      if (Math.abs(zb - za) > 0.3) { const ra = 1 / a.z, rb = 1 / b.z, r = 1 / z; w = clamp((ra - r) / (ra - rb)); }
      return { lon: lerp(a.lon, b.lon, w), lat: lerp(a.lat, b.lat, w), z, rot: lerp(a.rot || 0, b.rot || 0, u), ox: lerp(a.ox || 0, b.ox || 0, u), oy: lerp(a.oy || 0, b.oy || 0, u) };
    }
  }
  return { ...keys[keys.length - 1] };
}
function orthoProj(g, lat, lon) {
  const p = lat * D2R, l = (lon - g.lon0) * D2R, p0 = g.lat0 * D2R;
  const cosc = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l);
  return [W / 2 + g.R * Math.cos(p) * Math.sin(l), H / 2 - g.R * (Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l)), cosc];
}
// draw a dot set. colourFn(code) -> [rgb, alpha]; size in px
function drawDots(list, proj, size, colourFn, a = 1) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  let last = null;
  for (const d of list) {
    const q = proj(d[0], d[1]); if (!q) continue;
    if (q[0] < -10 || q[0] > W + 10 || q[1] < -10 || q[1] > H + 10) continue;
    const [col, al, sc] = colourFn(d[2], q);
    if (al <= 0.01) continue;
    const key = col + al;
    if (key !== last) { ctx.fillStyle = rgb(col, al); last = key; }
    const r = size * (sc || 1);
    ctx.beginPath(); ctx.arc(q[0], q[1], r, 0, 7); ctx.fill();
  }
  ctx.restore();
}
// procedural local dot field: Bucharest → Corbeanca region
const LOCAL = (() => {
  const r = rng(9), out = [];
  const st = 0.0042;
  const towns = [[44.552, 26.068, 0.010, 0.014], [44.600, 26.045, 0.012, 0.018], [44.618, 26.095, 0.007, 0.012], [44.553, 26.135, 0.007, 0.011], [44.585, 26.150, 0.006, 0.010]];
  const greens = [[44.518, 26.075, 0.012, 0.020], [44.535, 26.055, 0.010, 0.016], [44.612, 26.020, 0.014, 0.022], [44.628, 26.050, 0.010, 0.018], [44.582, 26.018, 0.010, 0.016], [44.545, 26.030, 0.012, 0.018], [44.645, 26.070, 0.012, 0.018], [44.565, 26.118, 0.010, 0.016]];
  let row = 0;
  for (let la = 44.28; la <= 44.74; la += st * 0.72, row++) {
    for (let lo = 25.80 + (row % 2) * st / 2; lo <= 26.42; lo += st) {
      const [bl, bo] = GEO.bucharest;
      const du = Math.hypot((la - bl) / 0.085, (lo - bo) / 0.125);
      let type = 0, w = 0;
      if (du < 1.05) { w = Math.exp(-du * du * 1.6); if (r() < 0.25 + 0.75 * w) type = 1; }
      for (const [a, b, rl, ro] of towns) { const d = Math.hypot((la - a) / rl, (lo - b) / ro); if (d < 1 && r() < 0.85 - d * 0.5) { type = 2; w = 1 - d; } }
      for (const [a, b, rl, ro] of greens) { const d = Math.hypot((la - a) / rl, (lo - b) / ro); if (d < 1 && type !== 2 && r() < 0.9) { type = 3; w = 1 - d; } }
      out.push([la, lo, type, w, r()]);
    }
  }
  return out;
})();
function drawLocal(cam, a, o = {}) {
  if (a <= 0) return;
  const sp = 0.0042 * cam.z;
  const size = clamp(sp * 0.22, 0.8, 7);
  const grow = o.grow || (() => 1);
  ctx.save(); ctx.globalAlpha *= a;
  const cols = o.cols || { 0: [255, 255, 255, 0.07], 1: [255, 255, 255, 0.85], 2: [200, 210, 255, 0.75], 3: [86, 196, 132, 0.8] };
  for (const d of LOCAL) {
    const q = mproj(cam, d[0], d[1]);
    if (q[0] < -10 || q[0] > W + 10 || q[1] < -10 || q[1] > H + 10) continue;
    const c = cols[d[2]], g = grow(d);
    if (g <= 0) continue;
    const s = size * (d[2] === 1 ? 0.55 + 0.6 * d[3] : d[2] === 0 ? 0.7 : 0.9) * g;
    ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${c[3] * (d[2] === 0 ? 1 : 0.5 + 0.5 * g)})`;
    ctx.beginPath(); ctx.arc(q[0], q[1], s, 0, 7); ctx.fill();
  }
  ctx.restore();
}
const mapPts = (cam, arr) => arr.map(([la, lo]) => mproj(cam, la, lo));

// ================================================================= ACT 1 — maps (0 → 29.6)
function globeParams(t) {
  const u = eio(P(t, 0.0, 2.6));
  return { lon0: lerp(-25, 25.6, u), lat0: lerp(14, 45.6, u), R: Math.exp(lerp(Math.log(330), Math.log(4600), eio(P(t, 0.9, 2.65)))) };
}
const MORPH = [2.15, 2.65];
const camFromGlobe = g => ({ lon: g.lon0, lat: g.lat0, z: g.R * Math.cos(g.lat0 * D2R) * D2R, rot: 0 });
function routeRot() {
  const a = ROUTE[ROUTE.length - 3], b = ROUTE[ROUTE.length - 1];
  return -Math.atan2(-(mercY(b[0]) - mercY(a[0])), b[1] - a[1]);
}
const CAM_A = (() => {
  const g = camFromGlobe(globeParams(MORPH[1]));
  return [
    { t: MORPH[1], ...g },
    { t: 3.7, lon: 25.0, lat: 45.8, z: 150, rot: -0.08 },
    { t: 4.9, lon: 26.1025, lat: 44.4268, z: 1500 },
    { t: 5.5, lon: 26.1025, lat: 44.4268, z: 1650, ease: t => t },
    { t: 8.0, lon: 26.075, lat: 44.515, z: 2700 },
    { t: 10.25, lon: 26.068, lat: 44.523, z: 2950, ease: t => t },
    { t: 11.4, lon: 30.4, lat: 40.0, z: 40 },
    { t: 15.8, lon: 30.2, lat: 39.8, z: 42, ease: t => t },
    { t: 17.9, lon: 26.072, lat: 44.580, z: 8800 },
    { t: 22.6, lon: 26.064, lat: 44.587, z: 9400, ease: t => t },
    { t: 24.3, lon: 26.090, lat: 44.490, z: 1350 },
    { t: 27.6, lon: 26.088, lat: 44.494, z: 1420, ease: t => t },
    { t: 29.6, lon: 26.0475, lat: 44.5990, z: 26000, rot: routeRot(), ease: eio },
  ];
})();
function act1(t) {
  let cam, g = null, m = 1;
  if (t < MORPH[1]) { g = globeParams(t); cam = camFromGlobe(g); m = ss(P(t, MORPH[0], MORPH[1])); }
  else cam = track(CAM_A, t);
  const blue = ss(P(t, 10.35, 11.3)) * (1 - ss(P(t, 16.4, 17.4)));  // flight segment is on royal blue
  // background reveals
  if (t > 10.3 && t < 17.6) {
    const bu = mproj(cam, ...GEO.bucharest);
    if (t < 16) circleReveal(C.royal, bu[0], bu[1], P(t, 10.3, 11.3));
    else { ctx.fillStyle = rgb(C.royal); ctx.fillRect(0, 0, W, H); circleReveal(C.black, bu[0], bu[1], P(t, 16.3, 17.4)); }
  }
  const appear = eo(P(t, 0.05, 1.1));
  const lz = Math.log(cam.z);
  // ---- globe / world dots
  const proj = (la, lo) => {
    if (!g || m >= 1) return mproj(cam, la, lo);
    const o = orthoProj(g, la, lo); if (o[2] < 0.02 && m < 0.5) return null;
    if (m <= 0) return o; const q = mproj(cam, la, lo); return [lerp(o[0], q[0], m), lerp(o[1], q[1], m)];
  };
  if (g && m < 1) {
    // globe rim + soft glow
    ctx.save(); ctx.globalAlpha = appear * (1 - m);
    const R = g.R * lerp(0.96, 1, appear);
    const gl = ctx.createRadialGradient(W / 2, H / 2, R * 0.6, W / 2, H / 2, R * 1.25);
    gl.addColorStop(0, 'rgba(60,70,220,0.20)'); gl.addColorStop(0.8, 'rgba(60,70,220,0.06)'); gl.addColorStop(1, 'rgba(60,70,220,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(W / 2, H / 2, R * 1.25, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(140,150,255,0.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(W / 2, H / 2, R, 0, 7); ctx.stroke();
    ctx.restore();
  }
  const roHi = ss(P(t, 2.3, 3.4));
  const coarseA = appear * (1 - ss(P(lz, Math.log(40), Math.log(90))));
  const medA = ss(P(lz, Math.log(25), Math.log(55))) * (1 - ss(P(lz, Math.log(140), Math.log(260))));
  const roA = ss(P(lz, Math.log(110), Math.log(200))) * (1 - ss(P(lz, Math.log(700), Math.log(1500))));
  const dotCol = (code, q) => {
    if (code === 1) return [mix([150, 160, 200], [255, 255, 255], roHi), 0.42 + 0.58 * roHi, 1 + 0.25 * roHi];
    if (code === 2) return [blue > 0.5 ? [255, 255, 255] : [150, 160, 200], blue > 0.5 ? 1 : 0.45];
    return [blue > 0.5 ? [255, 255, 255] : [150, 160, 200], blue > 0.5 ? 0.30 : lerp(0.42, 0.22, roHi)];
  };
  const dsz = g ? lerp(2.6, 3.4, P(g.R, 330, 1500)) : clamp(1.15 * cam.z * 0.42 * 0.18, 2, 5);
  drawDots(D_COARSE, (la, lo) => { if (g && m < 1) { const o = orthoProj(g, la, lo); if (o[2] < 0) return null; } return proj(la, lo); }, g ? dsz * clamp(Math.sqrt(4600 / g.R), 0.5, 1) * 1.2 : 3, (c, q) => { const r = dotCol(c, q); if (g && m < 1) { const o = orthoProj(g, 0, 0); } return r; }, coarseA);
  drawDots(D_MED, proj, clamp(0.42 * cam.z * 0.17, 1.6, 4.5), dotCol, medA);
  drawDots(D_RO, proj, clamp(0.11 * cam.z * 0.2, 1.2, 4.5), dotCol, roA);
  // ---- local dot field
  const localA = ss(P(lz, Math.log(500), Math.log(1200))) * (1 - ss(P(t, 29.0, 29.6)));
  if (localA > 0 && blue < 0.99) drawLocal(cam, localA * (1 - blue), {
    grow: d => t > 12 ? 1 : (d[2] === 1 ? eo(P(t, 3.9 + (1 - d[3]) * 1.4 + d[4] * 0.6, 4.5 + (1 - d[3]) * 1.4 + d[4] * 0.6)) : d[2] === 0 ? 1 : eo(P(t, 6.0 + d[4] * 1.8, 6.6 + d[4] * 1.8))),
  });

  // ---- S1 Bucharest
  const bA = win(t, 4.25, 4.7, 9.7, 10.3);
  if (bA > 0) {
    const [x, y] = mproj(cam, ...GEO.bucharest);
    pin(x, y, eob(P(t, 4.25, 4.75)), bA, (t * 0.7) % 1);
    pill('BUCHAREST', x, y + 64, { rtl: false, size: 24, weight: 800, s: eob(P(t, 4.4, 4.85)), alpha: bA });
  }
  // ---- S2 Corbeanca
  const s2 = win(t, 7.4, 7.8, 10.2, 10.8);
  if (s2 > 0) {
    const a = mproj(cam, ...GEO.bucharest), b = mproj(cam, ...GEO.corbeanca);
    ctx.save(); ctx.globalAlpha = s2; ctx.setLineDash([2, 10]); ctx.lineCap = 'round';
    strokePartial([a, b], eio(P(t, 7.6, 9.3)), { strokeStyle: 'rgba(255,255,255,0.95)', lineWidth: 4, lineCap: 'round' });
    ctx.restore();
    pin(b[0], b[1], 1.25 * eob(P(t, 9.2, 9.75)), s2, P(t, 9.6, 12) * 3 % 1);
    pill('CORBEANCA', b[0], b[1] - 74, { rtl: false, size: 30, weight: 900, s: eob(P(t, 9.45, 9.95)), alpha: s2 });
  }
  // ---- S3 flight
  const s3 = win(t, 10.8, 11.4, 16.0, 16.7);
  if (s3 > 0) {
    const ta = mproj(cam, ...GEO.telaviv), bu = mproj(cam, ...GEO.bucharest);
    const dim = ss(P(t, 13.3, 13.9));
    ctx.save(); ctx.globalAlpha = s3 * (1 - 0.6 * dim);
    const N = 60, arc = [];
    const mx = (ta[0] + bu[0]) / 2, my = (ta[1] + bu[1]) / 2, dx = bu[0] - ta[0], dy = bu[1] - ta[1];
    const cx = mx + dy * 0.3, cy = my - dx * 0.3;
    for (let i = 0; i <= N; i++) { const u = i / N; arc.push([(1 - u) * (1 - u) * ta[0] + 2 * u * (1 - u) * cx + u * u * bu[0], (1 - u) * (1 - u) * ta[1] + 2 * u * (1 - u) * cy + u * u * bu[1]]); }
    const fp = eio(P(t, 11.8, 13.5));
    strokePartial(arc, fp, { strokeStyle: 'rgba(255,255,255,1)', lineWidth: 4, lineCap: 'round' });
    if (fp > 0 && fp < 1) { const h = strokePartial(arc, fp, { strokeStyle: 'rgba(0,0,0,0)' }); planeIcon(h[0], h[1], h[2], 2.0); }
    pin(ta[0], ta[1], eob(P(t, 11.0, 11.5)), 1, -1);
    pin(bu[0], bu[1], eob(P(t, 11.2, 11.7)), 1, fp >= 1 ? (t * 0.8) % 1 : -1);
    pill('TEL AVIV', ta[0] - 120, ta[1] + 8, { rtl: false, size: 20, weight: 800, s: eob(P(t, 11.2, 11.7)) });
    pill('BUCHAREST', bu[0] + 140, bu[1], { rtl: false, size: 20, weight: 800, s: eob(P(t, 11.35, 11.85)) });
    ctx.restore();
    const na = s3 * dim * (1 - ss(P(t, 15.9, 16.4)));
    if (na > 0) {
      const lift = -ei(P(t, 15.9, 16.4)) * 80;
      rollNumber(['2', ':', '3', '0'], W / 2, H / 2 - 40 + lift, 13.35, { size: 300, now: t, alpha: na, dur: 0.9 });
      pill('שעות טיסה', W / 2, H / 2 + 150 + lift, { size: 34, weight: 800, s: eob(P(t, 13.9, 14.4)), alpha: na, icon: (x, y, s) => planeIcon(x, y, -Math.PI / 4, s / 30, rgb(C.royal)) });
    }
  }
  // ---- S4 OTP → Corbeanca, DN1, A0
  const s4 = win(t, 16.6, 17.2, 29.3, 29.9);
  if (s4 > 0) {
    ctx.save(); ctx.globalAlpha = s4;
    const zt = ss(P(lz, Math.log(60), Math.log(3000)));
    const bu = mproj(cam, ...GEO.bucharest), ot = mproj(cam, ...GEO.otp);
    const x = lerp(bu[0], ot[0], zt), y = lerp(bu[1], ot[1], zt);
    const rp = mapPts(cam, ROUTE);
    const fr = eio(P(t, 18.9, 22.5));
    const endFade = 1 - ss(P(t, 27.5, 28.3));
    strokePartial(rp, 1, { strokeStyle: `rgba(255,255,255,${0.12 * ss(P(t, 18.6, 19.2)) * endFade})`, lineWidth: 14, lineCap: 'round', lineJoin: 'round' });
    const head = strokePartial(rp, fr, { strokeStyle: rgb(C.royalHi), lineWidth: 7, lineCap: 'round', lineJoin: 'round', shadowColor: 'rgba(92,108,255,0.9)', shadowBlur: 22 });
    if (head && fr > 0.01 && fr < 0.995) { ctx.save(); ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(255,255,255,0.9)'; ctx.shadowBlur = 20; ctx.beginPath(); ctx.arc(head[0], head[1], 9, 0, 7); ctx.fill(); ctx.restore(); }
    // DN1 + A0
    const rf = 1 - ss(P(t, 27.9, 28.6));
    strokePartial(mapPts(cam, DN1), eio(P(t, 24.4, 26.0)), { strokeStyle: `rgba(255,255,255,${rf})`, lineWidth: 5, lineCap: 'round', lineJoin: 'round' });
    const a0 = []; for (let i = 0; i <= 80; i++) a0.push(mproj(cam, ...a0pt(Math.PI * 0.98 + Math.PI * 1.04 * i / 80)));
    strokePartial(a0, eio(P(t, 25.3, 27.4)), { strokeStyle: rgb(C.royalHi, rf), lineWidth: 5, lineCap: 'round', lineJoin: 'round', shadowColor: 'rgba(92,108,255,0.8)', shadowBlur: 14 });
    const dnL = mproj(cam, 44.512, 26.079), a0L = mproj(cam, ...a0pt(Math.PI * 1.5));
    pill('DN1', dnL[0] + 70, dnL[1], { rtl: false, size: 26, weight: 900, s: eob(P(t, 24.9, 25.35)), alpha: rf });
    pill('A0', a0L[0], a0L[1] - 46, { rtl: false, size: 26, weight: 900, bg: rgb(C.royalHi), color: '#fff', s: eob(P(t, 25.7, 26.15)), alpha: rf });
    // destination
    const cb = mproj(cam, ...GEO.corbeanca);
    pin(cb[0], cb[1], 1.2 * eob(P(t, 18.4, 18.9)), endFade, P(t, 22.4, 26) * 2 % 1);
    pill('CORBEANCA', cb[0], cb[1] - 64, { rtl: false, size: 24, weight: 900, s: eob(P(t, 18.6, 19.1)), alpha: endFade });
    // distance
    const mid = rp[3];
    const kA = win(t, 19.8, 20.2, 23.6, 24.2);
    if (kA > 0) pill('כ-6 ק״מ', mid[0] + 150, mid[1] - 10, { size: 34, weight: 900, s: eob(P(t, 19.8, 20.3)) * (1 - ei(P(t, 23.6, 24.2))), alpha: kA, bg: rgb(C.royalHi), color: '#fff' });
    // airport chip
    const morph = eo(P(t, 17.0, 17.8)), oA = 1 - ss(P(t, 27.5, 28.2));
    if (morph < 1) { ctx.fillStyle = `rgba(255,255,255,${1 - morph})`; ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fill(); }
    if (morph > 0) {
      const sc = eob(morph) * oA;
      ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
      ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 6;
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 36, 0, 7); ctx.fill(); ctx.shadowColor = 'transparent';
      planeIcon(0, 0, -Math.PI / 4, 1.5, rgb(C.royal));
      ctx.restore();
      pill('OTP', x, y + 74, { rtl: false, size: 26, weight: 900, s: eob(P(t, 17.3, 17.8)) * oA, bg: '#fff' });
    }
    ctx.restore();
  }
}

// ================================================================= ELEVATION ARCHITECTURE
// modern villa, side view. x = centre, by = ground line, u = unit (px)
function villa(x, by, u, g, o = {}) {
  if (g <= 0) return;
  const { lit = 0, seed = 1, dusk = 0, hero = false } = o;
  const r = rng(seed);
  const w1 = (hero ? 9 : 6.5 + r() * 2), h1 = 2.9, w2 = (hero ? 6.4 : 4 + r() * 1.6), h2 = 2.5;
  const off = hero ? -1.2 : (r() - 0.5) * (w1 - w2);
  const two = hero || r() < 0.75;
  const e1 = eo5(P(g, 0, 0.55)), e2 = eo5(P(g, 0.35, 0.9)), e3 = eo(P(g, 0.6, 1));
  const wall = mix([246, 247, 251], [160, 164, 196], dusk * 0.8), dark = mix([46, 50, 66], [30, 30, 48], dusk), slab = mix([255, 255, 255], [200, 202, 226], dusk * 0.7);
  const glass = rgb(mix(mix([30, 38, 70], [40, 52, 96], 0.3), C.warm, lit));
  ctx.save(); ctx.translate(x, by);
  // ground floor
  const gh = h1 * u * e1;
  ctx.fillStyle = rgb(wall); ctx.fillRect(-w1 * u / 2, -gh, w1 * u, gh);
  if (e1 > 0.3) {
    ctx.fillStyle = glass;
    ctx.fillRect(-w1 * u / 2 + 0.6 * u, -gh + 0.5 * u * e1, w1 * u * 0.46, gh - 0.5 * u * e1);
    ctx.fillRect(w1 * u * 0.12, -gh + 0.7 * u * e1, w1 * u * 0.22, gh * 0.45);
    // mullions
    ctx.fillStyle = rgb(wall, 0.9);
    for (let i = 1; i < 4; i++) ctx.fillRect(-w1 * u / 2 + 0.6 * u + w1 * u * 0.46 * i / 4 - 1.5, -gh + 0.5 * u * e1, 3, gh - 0.5 * u * e1);
  }
  // upper floor
  if (two && e2 > 0) {
    const uh = h2 * u * e2;
    ctx.fillStyle = rgb(dark); ctx.fillRect(off * u - w2 * u / 2, -gh - uh, w2 * u, uh);
    if (e2 > 0.4) { ctx.fillStyle = glass; ctx.fillRect(off * u - w2 * u / 2 + 0.5 * u, -gh - uh + 0.55 * u, w2 * u * 0.62, uh - 1.05 * u); }
    // cantilever slab
    ctx.fillStyle = rgb(slab); ctx.fillRect(off * u - w2 * u / 2 - 0.8 * u * e3, -gh - uh - 0.32 * u, (w2 + 1.6 * e3) * u, 0.32 * u);
  } else if (e3 > 0) { ctx.fillStyle = rgb(slab); ctx.fillRect(-w1 * u / 2 - 0.5 * u * e3, -gh - 0.3 * u, (w1 + e3) * u, 0.3 * u); }
  // window glow at night
  if (lit > 0.05) {
    const gr = ctx.createRadialGradient(0, -gh * 0.6, 0, 0, -gh * 0.6, w1 * u * 0.9);
    gr.addColorStop(0, `rgba(255,190,110,${0.18 * lit})`); gr.addColorStop(1, 'rgba(255,190,110,0)');
    ctx.fillStyle = gr; ctx.fillRect(-w1 * u, -gh * 2.5, w1 * u * 2, gh * 3);
  }
  ctx.restore();
}
function tree(x, by, u, g, o = {}) {
  if (g <= 0) return;
  const { dusk = 0, k = 0.5, tall = false } = o;
  const e = eob(clamp(g));
  const hh = (tall ? 4.2 : 2.6 + k) * u * e, rr_ = (tall ? 0.9 : 1.15 + k * 0.4) * u * e;
  const c1 = mix(C.greenD, [24, 60, 54], dusk), c2 = mix(C.green, [40, 92, 74], dusk);
  ctx.fillStyle = rgb(mix([90, 70, 54], [40, 34, 40], dusk)); ctx.fillRect(x - 0.08 * u, by - hh * 0.55, 0.16 * u, hh * 0.55);
  ctx.fillStyle = rgb(c1);
  if (tall) { rr(x - rr_, by - hh, rr_ * 2, hh * 0.85, rr_); ctx.fill(); ctx.fillStyle = rgb(c2); rr(x - rr_ * 0.75, by - hh * 0.98, rr_ * 1.1, hh * 0.6, rr_); ctx.fill(); }
  else { ctx.beginPath(); ctx.arc(x, by - hh * 0.62, rr_, 0, 7); ctx.fill(); ctx.fillStyle = rgb(c2); ctx.beginPath(); ctx.arc(x - rr_ * 0.25, by - hh * 0.7, rr_ * 0.7, 0, 7); ctx.fill(); }
}
function person(x, by, u, col = '#fff', ph = 0) {
  const s = u * 0.55;
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = s * 0.28; ctx.lineCap = 'round';
  const sw = Math.sin(ph) * s * 0.35;
  ctx.beginPath(); ctx.moveTo(x, by - s * 1.6); ctx.lineTo(x, by - s * 0.7); ctx.lineTo(x + sw, by); ctx.moveTo(x, by - s * 0.7); ctx.lineTo(x - sw, by); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, by - s * 2.0, s * 0.32, 0, 7); ctx.fill();
}
function tower(x, by, w, h, g, col) {
  const hh = h * eo5(clamp(g)); if (hh <= 0) return;
  ctx.fillStyle = col; ctx.fillRect(x - w / 2, by - hh, w, hh);
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  for (let yy = by - hh + 10; yy < by - 8; yy += 14) for (let xx = x - w / 2 + 6; xx < x + w / 2 - 6; xx += 12) ctx.fillRect(xx, yy, 6, 6);
}

// street model for the lifestyle act: three depth layers of villas + trees (world units)
const STREET = (() => {
  const r = rng(31), front = [], back = [], trees = [], hills = [];
  for (let i = -10; i <= 10; i++) {
    front.push({ x: i * 11.5 + (r() - 0.5) * 1.5, seed: 100 + i, k: r(), d: Math.abs(i) });
    back.push({ x: i * 10 + 5 + (r() - 0.5) * 2, seed: 300 + i, k: r(), d: Math.abs(i + 0.5) });
    trees.push({ x: i * 11.5 + 5.6 + (r() - 0.5) * 1.2, k: r(), d: Math.abs(i), tall: r() < 0.45 });
    trees.push({ x: i * 11.5 - 5.4 + (r() - 0.5), k: r(), d: Math.abs(i), tall: r() < 0.3 });
  }
  for (let i = -30; i <= 30; i++) hills.push({ x: i * 4.2 + r() * 2, r: 2.2 + r() * 2.4, k: r() });
  return { front, back, trees, hills };
})();
const TOWERS = (() => { const r = rng(77), o = []; for (let i = 0; i < 30; i++) o.push({ x: 40 + i * 32 + r() * 10, w: 30 + r() * 26, h: 300 + r() * 480, k: r() }); return o; })();

// ================================================================= ACT 2 — lifestyle (29.3 → 45)
function act2(t) {
  const a = ss(P(t, 29.3, 29.8)) * (1 - ss(P(t, 44.7, 45.3)));
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  const zoomOut = eio(P(t, 35.0, 39.8));
  const lift = eio(P(t, 43.9, 45.1));                         // camera rises at the end
  const u = lerp(54, 33, zoomOut) * lerp(1, 0.6, lift);
  const cx = lerp(-2, 4, P(t, 29.6, 44.5));
  const by = lerp(820, 790, zoomOut) + lift * 120;
  const X = (wx, par = 1) => W / 2 + (wx - cx * par) * u * par;
  // black → sky: opens up from the horizon line
  ctx.fillStyle = rgb(C.black); ctx.fillRect(0, 0, W, H);
  const open = eio(P(t, 29.6, 30.7));
  if (open > 0) {
    ctx.save(); ctx.beginPath(); ctx.rect(0, by - by * open, W, by * open + (H - by) * open + 4); ctx.clip();
    const sky = ctx.createLinearGradient(0, 0, 0, by); sky.addColorStop(0, rgb(C.royal2)); sky.addColorStop(1, rgb([74, 86, 222]));
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, by);
    const sun = ctx.createRadialGradient(W * 0.78, by - 330, 0, W * 0.78, by - 330, 420); sun.addColorStop(0, 'rgba(255,255,255,0.22)'); sun.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sun; ctx.fillRect(0, 0, W, by);
    ctx.fillStyle = rgb([24, 28, 110]); ctx.fillRect(0, by, W, H - by);
    // far tree line (parallax 0.35)
    ctx.fillStyle = rgb([58, 70, 200]);
    ctx.beginPath();
    for (const h of STREET.hills) { const x = W / 2 + (h.x - cx * 0.35) * u * 0.35 * 2.2, r = h.r * u * 0.5 * eo(P(t, 30.2 + h.k * 0.8, 31.2 + h.k * 0.8)); if (x < -200 || x > W + 200 || r <= 0) continue; ctx.moveTo(x + r, by); ctx.arc(x, by - r * 0.35, r, 0, 7); }
    ctx.fill();
    // back row villas (parallax 0.6, hazed)
    const bu = u * 0.58, bby = by - 6;
    ctx.save(); ctx.globalAlpha *= 0.55;
    for (const h of STREET.back) {
      const st = h.d < 2 ? 31.0 + h.k * 0.6 : 34.6 + h.d * 0.3 + h.k * 0.3;
      const x = W / 2 + (h.x - cx * 0.6) * bu; if (x < -300 || x > W + 300) continue;
      villa(x, bby, bu, P(t, st, st + 1.1), { seed: h.seed });
    }
    ctx.restore();
    ctx.fillStyle = 'rgba(40,46,150,0.35)'; ctx.fillRect(0, 0, W, by);    // atmospheric haze over the back layers
    // front trees + villas
    for (const tr of STREET.trees) {
      const st = tr.d < 1 ? 31.0 + tr.k * 1.4 : 34.8 + tr.d * 0.28 + tr.k * 0.4;
      const x = X(tr.x); if (x < -200 || x > W + 200) continue;
      tree(x, by, u, P(t, st, st + 0.6), { k: tr.k, tall: tr.tall });
    }
    for (const h of STREET.front) {
      const st = h.d < 1.5 ? 30.3 + h.d * 0.5 + h.k * 0.3 : 34.4 + h.d * 0.28 + h.k * 0.3;
      const x = X(h.x); if (x < -500 || x > W + 500) continue;
      villa(x, by, u, P(t, st, st + 1.3), { seed: h.seed });
    }
    // lawn + hedge foreground
    ctx.fillStyle = rgb([44, 150, 100]); ctx.fillRect(0, by, W, 0.5 * u);
    ctx.fillStyle = rgb([30, 34, 120]); ctx.fillRect(0, by + 0.5 * u, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; for (let x = (-(cx * u * 1.2) % 120) - 120; x < W + 120; x += 120) ctx.fillRect(x, by + 1.6 * u, 60, 4);   // road dashes
    const pa = ss(P(t, 36.0, 36.8));
    if (pa > 0) { ctx.save(); ctx.globalAlpha *= pa; for (const [x0, v] of [[-8, 1.3], [-6.9, 1.3], [-7.5, 1.3], [9, -1.6], [20, 2.4], [-18, 2.0]]) { const x = X(x0 + v * (t - 36)); person(x, by + 1.1 * u, u, '#fff', (t - 36) * 7 + x0); } ctx.restore(); }
    ctx.restore();
  }
  // the horizon line itself (continuation of the drive route)
  const lw = lerp(7, 2, P(t, 29.5, 30.6)) * (1 - lift);
  ctx.fillStyle = rgb(mix(C.royalHi, C.white, P(t, 29.6, 30.4)), 0.9 * (1 - open * 0.6)); ctx.fillRect(0, by - lw / 2, W, lw);
  // ---- split screen: dense city vs Corbeanca
  const sp = eio(P(t, 40.2, 40.9)) * (1 - eio(P(t, 42.4, 43.2)));
  if (sp > 0) {
    const sx = W * 0.5 * sp;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, sx, H); ctx.clip();
    ctx.fillStyle = rgb(C.black); ctx.fillRect(0, 0, sx, H);
    for (const tw of TOWERS) tower(tw.x - (W * 0.5 - sx) * 0.4, by, tw.w, tw.h, P(t, 40.3 + tw.k * 0.5, 40.9 + tw.k * 0.5), tw.k > 0.5 ? '#2b2f42' : '#3a3f58');
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(0, by, sx, 2);
    ctx.restore();
    ctx.fillStyle = '#fff'; ctx.fillRect(sx - 2, 0, 4, H);
  }
  ctx.restore();
}

// ================================================================= ACT 3 — shopping (44.6 → 60.6)
// light UI map inside a white card. Map space: Corbeanca area, projected into the card.
function cardMap(cam, cx, cy, w, h, t, o) {
  ctx.save(); rr(cx - w / 2, cy - h / 2, w, h, 34); ctx.clip();
  ctx.fillStyle = '#eef0f6'; ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
  // green patches
  ctx.fillStyle = '#d6eedd';
  for (const [la, lo, rl, ro] of [[44.612, 26.020, 0.012, 0.018], [44.628, 26.050, 0.010, 0.018], [44.582, 26.018, 0.010, 0.016], [44.645, 26.070, 0.012, 0.018]]) {
    const a = mproj(cam, la, lo), r = rl * cam.z * 1.2; ctx.beginPath(); ctx.ellipse(a[0], a[1], r * 1.3, r, 0, 0, 7); ctx.fill();
  }
  const roads = [DN1, ROUTE, [[44.585, 26.000], [44.592, 26.020], [44.598, 26.040], [44.604, 26.060], [44.610, 26.085]], [[44.575, 26.030], [44.589, 26.045], [44.603, 26.050], [44.620, 26.055]], [[44.560, 26.010], [44.575, 26.030]]];
  roads.forEach((rd, i) => {
    const pts = mapPts(cam, rd);
    strokePartial(pts, 1, { strokeStyle: '#d5d9e6', lineWidth: i === 0 ? 22 : 14, lineCap: 'round', lineJoin: 'round' });
    strokePartial(pts, 1, { strokeStyle: '#ffffff', lineWidth: i === 0 ? 16 : 9, lineCap: 'round', lineJoin: 'round' });
  });
  const dn = mproj(cam, 44.60, 26.081);
  pill('DN1', dn[0] + 44, dn[1], { rtl: false, size: 18, weight: 900, bg: '#ffd84d', color: '#222', alpha: o.dnA ?? 1 });
  ctx.restore();
}
const CAM_C = [
  { t: 44.6, lon: 26.047, lat: 44.598, z: 40000 },
  { t: 46.5, lon: 26.048, lat: 44.598, z: 27000, ease: eo },
  { t: 50.5, lon: 26.046, lat: 44.597, z: 25000 },
  { t: 53.6, lon: 26.046, lat: 44.597, z: 24000, ease: t => t },
];
const STORES = [['Lidl', GEO.lidl, 51.45, '#0050aa'], ['Mega Image', GEO.mega, 52.15, '#e30613'], ['Penny', GEO.penny, 52.85, '#cd1414']];
function act3(t) {
  const a = ss(P(t, 44.6, 45.2)) * (1 - ss(P(t, 60.3, 60.8)));
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = rgb(C.black); ctx.fillRect(0, 0, W, H);
  const enter = eo5(P(t, 44.8, 45.9));
  const swap = eio(P(t, 53.45, 54.25));          // map → Value Centre (horizontal slide inside the card)
  const flat = eio(P(t, 57.2, 58.0));            // card flattens into a line
  const spread = eio(P(t, 57.9, 59.0));          // the line splits into the chart grid
  const cw = lerp(1100, 1560, enter) * lerp(1, 1.25, flat), ch = lerp(600, 860, enter) * lerp(1, 0, flat);
  const cx = W / 2, cy = H / 2 + 20 + (1 - enter) * 140;
  if (spread > 0) {
    // blue opens from the centre line, lines travel to the grid rows of act 4
    const bh = H * spread;
    ctx.fillStyle = rgb(C.royal); ctx.fillRect(0, H / 2 - bh / 2, W, bh);
    for (let i = 0; i < 4; i++) { const f = eio(P(t, 57.9 + i * 0.08, 58.9 + i * 0.08)); const y = lerp(H / 2, 300 + i * 150, f), w = lerp(cw, W + 400, f); ctx.fillStyle = `rgba(255,255,255,${lerp(1, 0.35, f)})`; ctx.fillRect(W / 2 - w / 2, y - 1, w, lerp(4, 1.5, f)); }
  }
  if (ch > 2) {
    ctx.save(); if (enter < 1) ctx.filter = `blur(${(1 - enter) * 12}px)`;
    card(cx - cw / 2, cy - ch / 2, cw, ch, { r: lerp(34, 4, flat) }); ctx.restore();
    ctx.save(); rr(cx - cw / 2, cy - ch / 2, cw, ch, lerp(34, 4, flat)); ctx.clip();
    const cam = track(CAM_C, t);
    // map page
    if (swap < 1) {
      const camIn = { ...cam, z: cam.z * (cw / 1560), ox: -swap * cw, oy: cy - H / 2 };
      cardMap(camIn, cx - swap * cw, cy, cw, ch, t, {});
      const pm = mproj(camIn, ...GEO.corbeanca);
      pin(pm[0], pm[1], 1.5 * eob(P(t, 45.4, 45.9)), 1, (t * 0.6) % 1, rgb(C.royal));
      STORES.forEach(([name, ll, tl, c1], i) => {
        const sp = mproj(camIn, ...ll);
        const ca = ss(P(t, 46.0 + i * 0.3, 46.4 + i * 0.3)); if (ca <= 0) return;
        ctx.save(); ctx.globalAlpha *= ca; ctx.setLineDash([2, 12]);
        strokePartial([pm, sp], eio(P(t, 46.2 + i * 0.3, 47.1 + i * 0.3)), { strokeStyle: rgb(C.royal, 0.8), lineWidth: 5, lineCap: 'round' });
        ctx.restore();
        const lg = P(t, tl - 0.2, tl + 0.35), cs = eob(P(t, 46.0 + i * 0.3, 46.5 + i * 0.3)) * (1 - eo(lg));
        if (cs > 0.01) { ctx.save(); ctx.globalAlpha *= ca; ctx.strokeStyle = rgb(C.royal); ctx.lineWidth = 5; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(sp[0], sp[1], 22 * cs, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore(); }
        if (lg > 0) pill(name, sp[0], sp[1], { rtl: false, size: 38, weight: 900, color: '#14162a', dot: c1, s: eob(lg), alpha: ca });
      });
    }
    // Value Centre page
    if (swap > 0) {
      const ox = (1 - swap) * cw;
      ctx.save(); ctx.translate(ox, 0);
      const sk = ctx.createLinearGradient(0, cy - ch / 2, 0, cy + ch / 2); sk.addColorStop(0, '#e4e8ff'); sk.addColorStop(1, '#f7f8fc');
      ctx.fillStyle = sk; ctx.fillRect(cx - cw / 2, cy - ch / 2, cw, ch);
      const s = cw / 1560, gy = cy + ch * 0.22;
      ctx.fillStyle = '#d9dcea'; ctx.fillRect(cx - cw / 2, gy, cw, ch);
      for (let i = 0; i < 24; i++) { const f = P(t, 54.6 + i * 0.02, 55.0 + i * 0.02); ctx.fillStyle = `rgba(255,255,255,${f})`; ctx.fillRect(cx - cw / 2 + 90 * s + i * 58 * s, gy + 50 * s, 7 * s, 90 * s); }
      const units = [['#262ca8', 1.0], ['#e34b4b', 0.85], ['#14162a', 1.18], ['#3fae7a', 0.9], ['#f2b632', 1.0], ['#262ca8', 0.85], ['#8a5cf6', 1.12], ['#14162a', 0.95]];
      const uw = 172 * s, k0 = 1 - eio(P(t, 56.9, 57.5));
      units.forEach(([col, hf], i) => {
        const g = eo5(P(t, 54.1 + i * 0.08, 54.7 + i * 0.08)) * k0;
        const x0 = cx - units.length * uw / 2 + i * uw, hh = 250 * s * hf * g;
        if (hh <= 0) return;
        ctx.fillStyle = '#ffffff'; ctx.fillRect(x0 + 3 * s, gy - hh, uw - 6 * s, hh);
        ctx.fillStyle = col; ctx.fillRect(x0 + 3 * s, gy - hh, uw - 6 * s, 40 * s * g);
        ctx.fillStyle = `rgba(30,40,80,${0.16 + 0.08 * (i % 2)})`; ctx.fillRect(x0 + 18 * s, gy - hh + 64 * s, uw - 36 * s, hh - 64 * s);
        const aw = P(t, 54.8 + i * 0.07, 55.2 + i * 0.07);
        if (g < 0.5) return; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x0 + 10 * s, gy - hh + 60 * s); ctx.lineTo(x0 + uw - 10 * s, gy - hh + 60 * s); ctx.lineTo(x0 + uw - 2 * s, gy - hh + (60 + 30 * aw) * s); ctx.lineTo(x0 + 2 * s, gy - hh + (60 + 30 * aw) * s); ctx.fill();
      });
      for (const [i, k] of [[-1, 0.2], [units.length, 0.6]]) tree(cx - units.length * uw / 2 + i * uw + uw / 2, gy, 46 * s, P(t, 55.0 + k, 55.6 + k) * k0, { k, tall: true });
      ctx.restore();
      kinetic('CENTRE VALUE DN1', cx + ox, cy - ch / 2 + 120 * s, 54.5, { now: t, size: 88 * s, weight: 900, color: '#14162a', out: 56.8 });
    }
    ctx.restore();
  }
  ctx.restore();
}

// ================================================================= ACT 4 — data (59.6 → 79.8)
const NB = (() => { const r = rng(99), out = []; for (let gy = 0; gy < 3; gy++) for (let gx = 0; gx < 13; gx++) { if (r() < 0.15) continue; out.push({ x: 180 + gx * 128 + (r() - 0.5) * 30, y: 300 + gy * 150 + 75, wave: Math.min(2, Math.floor(gx / 4.5)), k: r() }); } return out; })();
function act4(t) {
  const a = ss(P(t, 59.0, 59.6)) * (1 - ss(P(t, 79.4, 79.9)));
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  // ---- backgrounds
  ctx.fillStyle = rgb(C.royal); ctx.fillRect(0, 0, W, H);
  // ---- S10 development: grid → houses appearing → growth line
  const s10 = 1 - ss(P(t, 64.3, 65.0));
  if (s10 > 0) {
    ctx.save(); ctx.globalAlpha *= s10;
    for (let i = 0; i < 4; i++) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-200, 300 + i * 150, W + 400, 1.5); }
    const gather = eio(P(t, 63.6, 64.6));
    for (const b of NB) {
      const st = 60.6 + b.wave * 0.95 + b.k * 0.5;
      const g = eob(P(t, st, st + 0.45)); if (g <= 0) continue;
      const x = lerp(b.x, W / 2 + (b.x - W / 2) * 0.15, gather), y = lerp(b.y, H / 2 + (b.y - H / 2) * 0.15, gather);
      if (gather < 0.6) houseGlyph(x, y - 6 + (1 - g) * 20, 1.5 * g * (1 - gather), '#fff', 3.5);
      if (gather > 0.2) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 5 * gather, 0, 7); ctx.fill(); }
      if (b.k > 0.6 && gather < 0.5) { ctx.fillStyle = rgb(C.green); ctx.beginPath(); ctx.arc(x + 36, y + 12, 8 * eob(P(t, st + 0.3, st + 0.7)), 0, 7); ctx.fill(); }
    }
    // rising development curve
    const cp = []; for (let i = 0; i <= 60; i++) { const u = i / 60; cp.push([140 + u * (W - 280), 780 - 420 * Math.pow(u, 1.6) - Math.sin(u * 9) * 12]); }
    strokePartial(cp, eio(P(t, 60.8, 63.9)) * (1 - gather), { strokeStyle: 'rgba(255,255,255,0.9)', lineWidth: 5, lineCap: 'round', lineJoin: 'round', shadowColor: 'rgba(255,255,255,0.6)', shadowBlur: 14 });
    ctx.restore();
  }
  // ---- S11 +61%
  const s11 = win(t, 64.5, 65.0, 68.2, 68.8);
  if (s11 > 0) {
    const r = rng(3), n = Math.floor(lerp(40, 600, eo(P(t, 64.6, 68.0))));
    for (let i = 0; i < 600; i++) {
      const ang = r() * Math.PI * 2, rad = 330 + r() * 700, sp = 0.03 + r() * 0.05, k = r();
      if (i >= n) continue;
      const x = W / 2 + Math.cos(ang + t * sp) * rad * 1.2, y = H / 2 + Math.sin(ang + t * sp) * rad * 0.62;
      ctx.fillStyle = `rgba(255,255,255,${s11 * (0.2 + 0.45 * k) * ss(P(t, 64.6 + i * 0.005, 65.0 + i * 0.005))})`;
      ctx.beginPath(); ctx.arc(x, y, 2 + k * 2.5, 0, 7); ctx.fill();
    }
    const up = -ei(P(t, 68.2, 68.8)) * 120;
    rollNumber(['+', '6', '1', '%'], W / 2, H / 2 - 50 + up, 65.15, { size: 330, now: t, alpha: s11, dur: 1.4 });
    pill('גידול באוכלוסייה', W / 2, H / 2 + 160 + up, { size: 36, weight: 800, s: eob(P(t, 66.4, 66.9)), alpha: s11, icon: (x, y, s) => arrowUp(x, y, s * 1.3, '#1f9d5c') });
  }
  // ---- S12 land market: royal panel slides away to black; bars
  const s12 = win(t, 68.4, 68.9, 75.6, 76.4);
  if (s12 > 0) {
    const wipe = eio(P(t, 68.3, 69.0)), back = eio(P(t, 75.4, 76.3));
    ctx.save(); ctx.beginPath(); ctx.rect(0, H * (1 - wipe), W, H * wipe); ctx.clip();
    ctx.fillStyle = rgb(C.black); ctx.fillRect(0, 0, W, H);
    const base = 880, bw = 220, h1 = 240, h2 = h1 * 1.9;
    const g1 = eo5(P(t, 68.9, 69.8)), g2 = eio(P(t, 70.1, 72.8));
    const bars = [[W / 2 - 160, h1 * g1, '#3a3f58'], [W / 2 + 160, lerp(h1, h2, g2) * g1, rgb(C.royalHi)]];
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(W / 2 - 460, base, 920, 2);
    for (const [bx, h, col] of bars) {
      if (h <= 0) continue;
      const x0 = bx - bw / 2, y0 = base - h, peak = 90 * back;
      ctx.fillStyle = col; ctx.globalAlpha = 1 - back * 0.9;
      ctx.beginPath(); ctx.moveTo(x0, base); ctx.lineTo(x0, y0 + 14); ctx.quadraticCurveTo(x0, y0, x0 + 14, y0); ctx.lineTo(x0 + bw - 14, y0); ctx.quadraticCurveTo(x0 + bw, y0, x0 + bw, y0 + 14); ctx.lineTo(x0 + bw, base); ctx.fill();
      ctx.globalAlpha = 1;
      if (back > 0) { ctx.strokeStyle = `rgba(255,255,255,${back})`; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x0, base); ctx.lineTo(x0, y0); ctx.lineTo(bx, y0 - peak); ctx.lineTo(x0 + bw, y0); ctx.lineTo(x0 + bw, base); ctx.stroke(); }
    }
    const gA = ss(P(t, 72.5, 73.0)) * (1 - back);
    if (gA > 0) {
      const xg = W / 2 + 160 + bw / 2 + 40;
      ctx.globalAlpha = gA; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(xg - 12, base - h1); ctx.lineTo(xg, base - h1); ctx.lineTo(xg, base - h2); ctx.lineTo(xg - 12, base - h2); ctx.stroke();
      { const sc = eob(P(t, 72.7, 73.1)), yy = base - (h1 + h2) / 2; ctx.save(); ctx.translate(xg + 46, yy); ctx.scale(sc, sc); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 26, 0, 7); ctx.fill(); arrowUp(0, 0, 40, rgb(C.royal)); ctx.restore(); }
      ctx.globalAlpha = 1;
    }
    const na = ss(P(t, 72.4, 72.8)) * (1 - back);
    rollNumber(['9', '0', '%', '-', 'כ'], W / 2, 190, 72.35, { size: 190, now: t, alpha: na, dur: 0.8 });
    pill('פער בדוגמאות למחירי ביקוש לקרקעות', W / 2, 318, { size: 26, weight: 700, s: eob(P(t, 73.0, 73.5)), alpha: na, bg: '#fff', color: '#14162a' });
    ctx.restore();
  }
  // ---- S13 everything connects (royal blue)
  const s13 = ss(P(t, 75.9, 76.5)) * (1 - ss(P(t, 79.3, 79.9)));
  if (s13 > 0) {
    ctx.save(); ctx.globalAlpha *= s13;
    const cam = { lon: 26.055, lat: 44.598, z: lerp(7500, 8800, P(t, 75.8, 79.8)), rot: 0 };
    drawLocal(cam, 0.55, { cols: { 0: [255, 255, 255, 0.08], 1: [255, 255, 255, 0.6], 2: [255, 255, 255, 0.55], 3: [140, 230, 170, 0.6] } });
    const c = mproj(cam, ...GEO.corbeanca);
    const cxy = [W / 2, H / 2 + 20];
    const fade = 1 - ss(P(t, 78.7, 79.3));
    const icons = [[-Math.PI / 2 - 1.0, 'plane', 76.3], [-Math.PI / 2 + 1.0, 'house', 76.75], [Math.PI / 2, 'chart', 77.2]];
    const pts = icons.map(([ang]) => [cxy[0] + Math.cos(ang) * 420, cxy[1] + Math.sin(ang) * 300]);
    const triA = ss(P(t, 77.7, 78.2)) * fade;
    if (triA > 0) { ctx.save(); ctx.globalAlpha *= triA * 0.4; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.setLineDash([2, 10]); ctx.lineCap = 'round'; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); ctx.stroke(); ctx.restore(); }
    icons.forEach(([ang, kind, ti], i) => {
      const p = pts[i], ia = ss(P(t, ti, ti + 0.35)) * fade;
      if (ia <= 0) return;
      ctx.save(); ctx.globalAlpha *= ia;
      strokePartial([cxy, p], eio(P(t, ti + 0.1, ti + 0.7)), { strokeStyle: 'rgba(255,255,255,0.85)', lineWidth: 3, lineCap: 'round' });
      const sc = eob(P(t, ti, ti + 0.5));
      ctx.translate(p[0], p[1]); ctx.scale(sc, sc);
      ctx.shadowColor = 'rgba(0,0,30,0.4)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 74, 0, 7); ctx.fill(); ctx.shadowColor = 'transparent';
      if (kind === 'plane') planeIcon(0, 0, -Math.PI / 4, 2.6, rgb(C.royal));
      if (kind === 'house') houseGlyph(0, 0, 2.2, rgb(C.royal), 7);
      if (kind === 'chart') chartGlyph(0, 0, 2.2, rgb(C.royal), 7);
      ctx.restore();
    });
    const toHouse = P(t, 78.9, 79.6);
    pin(cxy[0], cxy[1], 1.6 * eob(P(t, 76.0, 76.5)) * (1 + toHouse * 2), 1 - toHouse, (t * 0.7) % 1);
    ctx.restore();
  }
  ctx.restore();
}

// ================================================================= ACT 5 — luxury villa → home at dusk (79.1 → 95)
function act5(t) {
  const a = ss(P(t, 79.1, 79.7)) * (1 - ss(P(t, 94.3, 95.0)));
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  const day = ss(P(t, 79.6, 82.0)), dusk = ss(P(t, 87.8, 90.2));
  const top = mix(mix(C.royal, [70, 96, 230], day), [14, 16, 46], dusk);
  const bot = mix(mix(C.royal2, [190, 205, 255], day), [120, 76, 110], dusk);
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, rgb(top)); g.addColorStop(1, rgb(bot));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (dusk > 0) { const hz = ctx.createRadialGradient(W * 0.75, H * 0.8, 0, W * 0.75, H * 0.8, H); hz.addColorStop(0, `rgba(255,170,100,${0.35 * dusk})`); hz.addColorStop(1, 'rgba(255,170,100,0)'); ctx.fillStyle = hz; ctx.fillRect(0, 0, W, H); }
  // stars at dusk
  if (dusk > 0.3) { const r = rng(12); for (let i = 0; i < 70; i++) { const x = r() * W, y = r() * H * 0.5; ctx.fillStyle = `rgba(255,255,255,${(dusk - 0.3) * (0.3 + 0.5 * r()) * (0.6 + 0.4 * Math.sin(t * 2 + i))})`; ctx.fillRect(x, y, 2, 2); } }
  // camera: hero close → neighbourhood wide → back to hero
  const wide = eio(P(t, 82.6, 86.4)) * (1 - eio(P(t, 87.6, 93.2)));
  const u = lerp(62, 30, wide) * lerp(1, 1.05, P(t, 93.2, 94.5));
  const intro = eo5(P(t, 79.2, 80.4));
  const uu = u * lerp(0.4, 1, intro);
  const by = lerp(800, 760, wide);
  const X = wx => W / 2 + wx * uu;
  // lawn
  ctx.fillStyle = rgb(mix(mix(C.royal2, [92, 170, 116], day), [26, 50, 46], dusk)); ctx.fillRect(0, by, W, H - by);
  ctx.fillStyle = rgb(mix([255, 255, 255], [80, 86, 120], dusk), 0.35); ctx.fillRect(0, by, W, 3);
  const lit = ss(P(t, 88.6, 91.0));
  // neighbours
  const nb = [[-30, 3], [-17, 1], [17, 2], [30, 4], [-43, 5], [43, 6], [-56, 7], [56, 8]];
  nb.forEach(([x, k]) => { const xx = X(x); if (xx < -500 || xx > W + 500) return; villa(xx, by, uu, P(t, 82.4 + k * 0.25, 83.6 + k * 0.25), { seed: 40 + k, lit: clamp(lit * 1.3 - k * 0.06), dusk }); });
  for (const [x, k, tall] of [[-9, 0.2, true], [8.5, 0.5, false], [-23.5, 0.3, false], [23.5, 0.8, true], [-36.5, 0.6, true], [36.5, 0.1, false], [-49.5, 0.4, false], [49.5, 0.7, true]]) tree(X(x), by, uu, P(t, 81.0 + k + Math.abs(x) * 0.03, 81.6 + k + Math.abs(x) * 0.03), { k, tall, dusk });
  const pg = P(t, 80.6, 81.4);
  ctx.fillStyle = rgb(mix([110, 200, 240], [40, 90, 160], dusk)); ctx.fillRect(X(-3) , by, 7 * uu * eo(pg), 0.45 * uu);
  villa(X(0), by, uu, P(t, 79.3, 80.9), { hero: true, lit, dusk, seed: 1 });
  // garden lights + path light
  const gl = ss(P(t, 90.0, 91.2));
  if (gl > 0) for (const x of [-5.6, -3.4, 4.6, 6.2]) { const xx = X(x), yy = by - 0.25 * uu; const gr = ctx.createRadialGradient(xx, yy, 0, xx, yy, 40); gr.addColorStop(0, `rgba(255,206,140,${0.8 * gl})`); gr.addColorStop(1, 'rgba(255,206,140,0)'); ctx.fillStyle = gr; ctx.fillRect(xx - 40, yy - 40, 80, 80); ctx.fillStyle = `rgba(255,230,190,${gl})`; ctx.fillRect(xx - 3, yy - 3, 6, 6); }
  const pl = eio(P(t, 91.0, 92.6));
  if (pl > 0) strokePartial([[X(2.4), by + 3 * uu], [X(1.8), by + 0.05 * uu]], pl, { strokeStyle: 'rgba(255,214,150,1)', lineWidth: 6, lineCap: 'round', shadowColor: 'rgba(255,190,110,1)', shadowBlur: 24 });
  // foreground depth: large out-of-focus trees and hedge at the frame edges
  const fg = ss(P(t, 82.8, 84.0)) * (1 - ss(P(t, 88.2, 89.4)));
  if (fg > 0) {
    ctx.save(); ctx.globalAlpha *= fg; ctx.filter = 'blur(3px)';
    for (const [fx, k] of [[-0.06, 0.3], [0.08, 0.7], [0.93, 0.5], [1.05, 0.2]]) tree(W * fx + (t - 84) * (fx < 0.5 ? -14 : 14), H + 40, 62, eob(P(t, 82.8 + k * 0.4, 83.6 + k * 0.4)), { k, tall: k > 0.4, dusk });
    ctx.fillStyle = rgb(mix([40, 128, 84], [20, 44, 40], dusk)); rr(-40, H - 70, W + 80, 140, 60); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

// ================================================================= ACT 6 — brand (93.9 → 102)
function act6(t) {
  const a = ss(P(t, 93.9, 94.5));
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = rgb(C.black); ctx.fillRect(0, 0, W, H);
  const v = ctx.createRadialGradient(W / 2, H * 0.45, 40, W / 2, H / 2, W * 0.7);
  v.addColorStop(0, 'rgba(38,44,168,0.35)'); v.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  const out2 = 1 - ss(P(t, 100.4, 100.9));
  // logo build: circle stroke draws, then opens into the gold rule
  const cdraw = eio(P(t, 94.0, 94.8)), copen = eio(P(t, 94.8, 95.4));
  if (copen < 1) {
    ctx.save(); ctx.globalAlpha *= 1 - copen; ctx.strokeStyle = rgb(C.gold); ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(W / 2, 400, 60 * (1 + copen * 3), -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * cdraw); ctx.stroke(); ctx.restore();
  }
  // GIGI RESIDENCE — letters rise out of a mask (typographic stand-in for the GIGI logo)
  const word = 'GIGI RESIDENCE';
  font(104, 300); ctx.save(); ctx.letterSpacing = '22px';
  const tw = ctx.measureText(word).width; ctx.restore();
  let x = W / 2 - tw / 2;
  ctx.save(); ctx.beginPath(); ctx.rect(0, 300 - 80, W, 160); ctx.clip();
  for (let i = 0; i < word.length; i++) {
    const ch = word[i]; font(104, 300); const cw = ctx.measureText(ch).width + 22;
    const u = expo(P(t, 94.5 + i * 0.035, 95.3 + i * 0.035));
    text(ch, x + cw / 2 - 11, 300 + (1 - u) * 120, { size: 104, weight: 300, alpha: u, blur: (1 - u) * 8 });
    x += cw;
  }
  ctx.restore();
  const ruleW = 360 * eio(P(t, 95.0, 95.8));
  ctx.fillStyle = rgb(C.gold); ctx.fillRect(W / 2 - ruleW / 2, 392, ruleW, 2);
  text('BY', W / 2, 438, { size: 24, weight: 700, spacing: 10, alpha: ss(P(t, 95.25, 95.7)), color: rgb(C.gold) });
  const img = IMG.logo;
  if (img) {
    const la = ss(P(t, 95.35, 96.2)), lw = 520, lh = lw * img.height / img.width;
    const ls = lerp(0.94, 1, eo5(P(t, 95.35, 96.8)));
    ctx.save(); ctx.globalAlpha = la; ctx.globalCompositeOperation = 'screen';
    if (la < 1) ctx.filter = `blur(${(1 - la) * 10}px)`;
    ctx.translate(W / 2, 470 + lh / 2); ctx.scale(ls, ls); ctx.drawImage(img, -lw / 2, -lh / 2, lw, lh); ctx.restore();
    const sw = P(t, 96.5, 97.6);
    if (sw > 0 && sw < 1) {
      const yy = 470 + lh * 0.935, xx = W / 2 - lw * 0.42 + lw * 0.84 * eio(sw);
      const gr = ctx.createRadialGradient(xx, yy, 0, xx, yy, 70); gr.addColorStop(0, 'rgba(255,240,210,0.5)'); gr.addColorStop(1, 'rgba(255,240,210,0)');
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = gr; ctx.fillRect(xx - 70, yy - 70, 140, 140); ctx.restore();
    }
    const ul = eio(P(t, 96.5, 97.4)) * out2;
    ctx.fillStyle = rgb(C.gold, 0.85 * ul); ctx.fillRect(W / 2 - lw * 0.4 * ul, 470 + lh + 6, lw * 0.8 * ul, 2);
  }
  kinetic('מרימים את הסטנדרט רמה אחת מעל.', W / 2, 940, 98.05, { now: t, size: 50, weight: 700, out: 100.35, stagger: 0.08 });
  ctx.restore();
}

// ================================================================= frame
function renderFrame(t) {
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  ctx.fillStyle = rgb(C.black); ctx.fillRect(0, 0, W, H);
  if (t < 30.0) act1(t);
  if (t > 29.2 && t < 45.3) act2(t);
  if (t > 44.5 && t < 61) act3(t);
  if (t > 58.9 && t < 80) act4(t);
  if (t > 79 && t < 95.1) act5(t);
  if (t > 93.8) act6(t);
  // gentle vignette
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.5, W / 2, H / 2, W * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.28)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  drawLogoCorner(ss(P(t, 0.3, 1.2)) * (1 - ss(P(t, 94.2, 95.0))));
  const fb = ss(P(t, 101.3, 102.0));
  if (fb > 0) { ctx.fillStyle = `rgba(0,0,0,${fb})`; ctx.fillRect(0, 0, W, H); }
}
window.renderFrame = renderFrame;
window.READY = (async () => {
  await loadImg('logo', 'assets/isromana-logo.jpg');
  const loads = [];
  for (const w of [200, 300, 400, 500, 700, 800, 900]) for (const s of ['אבג', 'ABC123']) loads.push(document.fonts.load(`${w} 20px ${FONT}`, s).catch(() => null));
  await Promise.all(loads); await document.fonts.ready;
  renderFrame(0);
  return true;
})();
