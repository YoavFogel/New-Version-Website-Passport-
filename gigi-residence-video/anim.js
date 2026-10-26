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
const FONT = "Almoni, Montserrat, Assistant";   // Latin + digits: Montserrat (full Romanian ȘȚĂÂ); Hebrew: Assistant
const SERIF = "'Libre Caslon Text', serif";       // brand end card   // licensed Almoni is used automatically when its files are present

// ---------------------------------------------------------------- palette
const C = {
  black: [10, 14, 40], ink: [16, 22, 58], royal: [38, 44, 168], royal2: [30, 34, 140], royalHi: [92, 108, 255],
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
function font(size, weight = 400, fam = FONT) { ctx.font = `${weight} ${size}px ${fam}`; }
function text(str, x, y, o = {}) {
  const { size = 28, weight = 500, color = '#fff', alpha = 1, align = 'center', rtl = false, spacing = 0, blur = 0, fam = FONT } = o;
  if (alpha <= 0.002) return;
  ctx.save(); ctx.globalAlpha *= alpha; font(size, weight, fam);
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
    ctx.beginPath(); ctx.rect(x - 10, cy - size * 0.56, w + 20, size * 1.12); ctx.clip();
    if (/\d/.test(c)) {
      const d = +c, u = P(now, ts, ts + dur + i * 0.08), e = eo5(u);
      const pos = e * (spins * 10 + d);                 // total digits scrolled
      const vel = u < 1 ? (spins * 10 + d) * 5 * Math.pow(1 - u, 4) / (dur + i * 0.08) : 0;
      const base = u >= 1 ? spins * 10 + d : Math.floor(pos), f = u >= 1 ? 0 : pos - base;
      const bl = Math.min(18, vel * 0.9);
      for (let k = -1; k <= 1; k++) {
        if (u >= 1 && k !== 0) continue;
        const dig = ((base + k) % 10 + 10) % 10;
        const dy = (k - f) * size * 1.05;
        text(String(dig), x + w / 2, cy - dy, { size, weight, color, alpha: alpha * (u > 0 ? 1 : 0) * clamp(1 - Math.abs(dy) / (size * 0.62)), blur: bl });
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
// deep navy field with a slow, soft royal glow (replaces flat black)
function deepBG(x = 0, y = 0, w = W, h = H, tt = 0) {
  ctx.fillStyle = rgb(C.black); ctx.fillRect(x, y, w, h);
  const gx = W * (0.5 + 0.18 * Math.sin(tt * 0.21)), gy = H * (0.42 + 0.08 * Math.cos(tt * 0.17));
  const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, W * 0.62);
  g.addColorStop(0, 'rgba(52,62,190,0.38)'); g.addColorStop(0.55, 'rgba(36,44,150,0.12)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
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
function familyGlyph(x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = col;
  for (const [dx, r, h] of [[-12, 5.5, 22], [12, 5.5, 22], [0, 4.2, 14]]) { ctx.beginPath(); ctx.arc(dx, -h + 2, r, 0, 7); ctx.fill(); rr(dx - r * 1.2, -h + r + 4, r * 2.4, h - r - 2 + 12, r); ctx.fill(); }
  ctx.restore();
}
function briefcaseGlyph(x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 3.4; ctx.lineJoin = 'round';
  rr(-18, -8, 36, 26, 5); ctx.fill(); ctx.beginPath(); ctx.moveTo(-7, -8); ctx.lineTo(-7, -14); ctx.lineTo(7, -14); ctx.lineTo(7, -8); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.fillRect(-18, 1, 36, 2.5); ctx.restore();
}
function bulbGlyph(x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = col;
  ctx.beginPath(); ctx.arc(0, -6, 13, 0, 7); ctx.fill(); rr(-7, 5, 14, 9, 2); ctx.fill(); rr(-5, 15, 10, 4, 2); ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  for (const a of [-2.4, -1.57, -0.74]) { ctx.beginPath(); ctx.moveTo(Math.cos(a) * 18, -6 + Math.sin(a) * 18); ctx.lineTo(Math.cos(a) * 24, -6 + Math.sin(a) * 24); ctx.stroke(); }
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

// ================================================================= MAPS (solid vector)
const WORLDP = (window.WORLD || []).map(c => ({
  ro: c.name === 'Romania', il: c.name === 'Israel',
  rings: c.rings.map(r => { let x0 = 1e9, x1 = -1e9; for (const [lon] of r) { x0 = Math.min(x0, lon); x1 = Math.max(x1, lon); } return { pts: r, x0, x1 }; }),
}));
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
      return { lon: lerp(a.lon, b.lon, w), lat: lerp(a.lat, b.lat, w), z, rot: lerp(a.rot || 0, b.rot || 0, u) };
    }
  }
  return { ...keys[keys.length - 1] };
}
function orthoProj(g, lat, lon) {
  const p = lat * D2R, l = (lon - g.lon0) * D2R, p0 = g.lat0 * D2R;
  const cosc = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l);
  let x = g.R * Math.cos(p) * Math.sin(l), y = g.R * (Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l));
  if (cosc < 0) { const k = g.R / Math.hypot(x, y); x *= k; y *= k; }
  return [W / 2 + x, H / 2 - y, cosc];
}
// land: o = {land, ro, il, border, roLine}
function drawCountries(cam, proj, a, o) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  const xr = cam ? W / cam.z : 999;
  for (const c of WORLDP) {
    ctx.beginPath(); let any = false;
    for (const r of c.rings) {
      if (cam && (r.x1 < cam.lon - xr * 1.3 || r.x0 > cam.lon + xr * 1.3)) continue;
      any = true;
      r.pts.forEach(([lon, lat], i) => { const q = proj(lat, lon); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
      ctx.closePath();
    }
    if (!any) continue;
    ctx.fillStyle = c.ro ? o.ro : c.il ? (o.il || o.land) : o.land; ctx.fill();
    ctx.strokeStyle = o.border; ctx.lineWidth = 1; ctx.stroke();
  }
  if (o.roLine > 0) {
    const ro = WORLDP.find(c => c.ro);
    for (const r of ro.rings) { const pts = r.pts.map(([lon, lat]) => proj(lat, lon)); pts.push(pts[0]); strokePartial(pts, o.roLine, { strokeStyle: '#fff', lineWidth: 3, lineJoin: 'round' }); }
  }
  ctx.restore();
}
// smooth closed blob (lat/lon) for clean schematic areas
function blob(cam, la, lo, rl, ro, seed, n = 48) {
  const r = rng(seed), k1 = r() * 6, k2 = r() * 6, pts = [];
  for (let i = 0; i < n; i++) {
    const th = i / n * Math.PI * 2, f = 1 + 0.07 * Math.sin(3 * th + k1) + 0.05 * Math.cos(5 * th + k2);
    pts.push(mproj(cam, la + Math.sin(th) * rl * f, lo + Math.cos(th) * ro * f));
  }
  ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath();
}
const GREENS = [[44.528, 26.074, 0.011, 0.018], [44.538, 26.048, 0.008, 0.014], [44.618, 26.015, 0.012, 0.020], [44.632, 26.055, 0.010, 0.017], [44.585, 26.012, 0.009, 0.015], [44.650, 26.090, 0.010, 0.018]];
// clean schematic of the Bucharest → Corbeanca area
function drawRegion(cam, a, t, o = {}) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  const gA = o.greenA ?? 1;
  if (gA > 0) { ctx.save(); ctx.globalAlpha *= gA; GREENS.forEach(([la, lo, rl, ro], i) => { blob(cam, la, lo, rl, ro, 50 + i); ctx.fillStyle = 'rgba(64,170,112,0.42)'; ctx.fill(); }); ctx.restore(); }
  // Bucharest: city area with a fine street texture and ring roads
  const [bl, bo] = GEO.bucharest;
  blob(cam, bl, bo, 0.085, 0.125, 7, 72);
  ctx.save(); ctx.fillStyle = rgb(C.royal, 0.85); ctx.fill(); ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 1;
  for (let k = -24; k <= 24; k++) {
    const p0 = mproj(cam, bl + k * 0.0045, bo - 0.2), p1 = mproj(cam, bl + k * 0.0045, bo + 0.2); ctx.beginPath(); ctx.moveTo(...p0); ctx.lineTo(...p1); ctx.stroke();
    const q0 = mproj(cam, bl - 0.12, bo + k * 0.0065), q1 = mproj(cam, bl + 0.12, bo + k * 0.0065); ctx.beginPath(); ctx.moveTo(...q0); ctx.lineTo(...q1); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.30)'; ctx.lineWidth = 2;
  for (const f of [0.35, 0.68]) { blob(cam, bl, bo, 0.085 * f, 0.125 * f, 9, 48); ctx.stroke(); }
  ctx.restore();
  blob(cam, bl, bo, 0.085, 0.125, 7, 72); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; ctx.stroke();
  // northern towns (Otopeni, Corbeanca)
  const tA = o.townA ?? 1;
  if (tA > 0) {
    ctx.save(); ctx.globalAlpha *= tA;
    blob(cam, 44.552, 26.068, 0.008, 0.012, 21); ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fill();
    blob(cam, ...GEO.corbeanca, 0.012, 0.019, 23); ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

// ================================================================= ACT 1 — globe → Bucharest → Corbeanca → flight (0 → 17.4)
function globeParams(t) {
  const u = eio(P(t, 0.0, 2.6));
  return { lon0: lerp(-25, 25.6, u), lat0: lerp(14, 45.6, u), R: Math.exp(lerp(Math.log(330), Math.log(4600), eio(P(t, 0.9, 2.65)))) };
}
const MORPH = [2.15, 2.65];
const camFromGlobe = g => ({ lon: g.lon0, lat: g.lat0, z: g.R * Math.cos(g.lat0 * D2R) * D2R, rot: 0 });
const CAM_A = (() => {
  const g = camFromGlobe(globeParams(MORPH[1]));
  return [
    { t: MORPH[1], ...g },
    { t: 3.7, lon: 25.0, lat: 45.8, z: 150, rot: -0.06 },
    { t: 4.9, lon: 26.1025, lat: 44.4268, z: 2000 },
    { t: 5.6, lon: 26.1025, lat: 44.4268, z: 2150, ease: t => t },
    { t: 8.2, lon: 26.075, lat: 44.513, z: 2550 },
    { t: 10.25, lon: 26.072, lat: 44.517, z: 2650, ease: t => t },
    { t: 11.4, lon: 30.4, lat: 40.0, z: 40 },
    { t: 17.4, lon: 30.0, lat: 39.6, z: 44, ease: t => t },
  ];
})();
function act1(t) {
  let cam, g = null, m = 1;
  if (t < MORPH[1]) { g = globeParams(t); cam = camFromGlobe(g); m = ss(P(t, MORPH[0], MORPH[1])); }
  else cam = track(CAM_A, t);
  const blue = ss(P(t, 10.4, 11.2));
  const bu = mproj(cam, ...GEO.bucharest);
  if (t > 10.3) circleReveal(C.royal, bu[0], bu[1], P(t, 10.3, 11.3));
  const appear = eo(P(t, 0.05, 1.1)), lz = Math.log(cam.z);
  const proj = (la, lo) => {
    if (!g || m >= 1) return mproj(cam, la, lo);
    const o = orthoProj(g, la, lo); if (m <= 0) return o;
    const q = mproj(cam, la, lo); return [lerp(o[0], q[0], m), lerp(o[1], q[1], m)];
  };
  if (g && m < 1) {
    ctx.save(); ctx.globalAlpha = appear * (1 - m);
    const R = g.R * lerp(0.94, 1, appear);
    const gl = ctx.createRadialGradient(W / 2, H / 2, R * 0.8, W / 2, H / 2, R * 1.3);
    gl.addColorStop(0, 'rgba(60,70,220,0.25)'); gl.addColorStop(1, 'rgba(60,70,220,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(W / 2, H / 2, R * 1.3, 0, 7); ctx.fill();
    const oc = ctx.createRadialGradient(W / 2 - R * 0.3, H / 2 - R * 0.3, R * 0.1, W / 2, H / 2, R);
    oc.addColorStop(0, '#1a1f4a'); oc.addColorStop(1, '#0d1030');
    ctx.fillStyle = oc; ctx.beginPath(); ctx.arc(W / 2, H / 2, R, 0, 7); ctx.fill();
    ctx.restore();
  }
  const roHi = ss(P(t, 2.3, 3.3)) * (1 - ss(P(t, 3.75, 4.35)));
  const worldA = appear * (1 - ss(P(lz, Math.log(700), Math.log(1800)))) * (1 - blue) + blue * (1 - ss(P(t, 16.3, 17.0)));
  ctx.save();
  if (g && m < 1) { ctx.beginPath(); ctx.arc(W / 2, H / 2, g.R * lerp(1, 8, m), 0, 7); ctx.clip(); }
  drawCountries(g && m < 1 ? null : cam, proj, worldA, blue > 0.5
    ? { land: 'rgba(255,255,255,0.16)', ro: 'rgba(255,255,255,0.42)', il: 'rgba(255,255,255,0.42)', border: 'rgba(255,255,255,0.12)', roLine: 0 }
    : { land: '#262d62', ro: rgb(mix([38, 45, 98], C.royal, roHi)), border: 'rgba(255,255,255,0.10)', roLine: eio(P(t, 2.4, 3.8)) * (1 - ss(P(t, 4.6, 5.2))) });
  ctx.restore();
  // ---- Bucharest + Corbeanca schematic
  const regA = ss(P(lz, Math.log(400), Math.log(1100))) * (1 - blue);
  if (regA > 0) {
    drawRegion(cam, regA, t, { greenA: ss(P(t, 6.0, 7.4)), townA: ss(P(t, 7.0, 8.4)) });
    const fs = clamp(cam.z / 2150, 0.4, 1.2);
    const lab = eo5(P(t, 4.25, 4.9)) * (1 - ss(P(t, 9.9, 10.4)));
    const blobW = Math.abs(mproj(cam, GEO.bucharest[0], GEO.bucharest[1] + 0.125)[0] - bu[0]) * 2;
    font(100, 800); ctx.save(); ctx.letterSpacing = '6px'; const w100 = ctx.measureText('BUCHAREST').width; ctx.restore();
    const lsz = Math.min(64 * fs, 100 * blobW * 0.56 / w100);
    ctx.save(); ctx.beginPath(); ctx.rect(0, bu[1] - lsz, W, lsz * 2); ctx.clip();
    text('BUCHAREST', bu[0], bu[1] + (1 - lab) * lsz * 1.3, { size: lsz, weight: 800, spacing: lsz * 0.08, alpha: regA * clamp(lab * 1.5) });
    ctx.restore();
    // north arrow Bucharest → Corbeanca
    const s2 = win(t, 7.4, 7.8, 10.0, 10.5);
    if (s2 > 0) {
      const a0 = mproj(cam, GEO.bucharest[0] + 0.080, 26.088), b0 = mproj(cam, GEO.corbeanca[0] - 0.0115, GEO.corbeanca[1]);
      const mx = (a0[0] + b0[0]) / 2, my = (a0[1] + b0[1]) / 2, ddx = b0[0] - a0[0], ddy = b0[1] - a0[1];
      const cpx = mx - ddy * 0.22, cpy = my + ddx * 0.22;
      const path = []; for (let i = 0; i <= 80; i++) { const u = i / 80; path.push([(1 - u) * (1 - u) * a0[0] + 2 * u * (1 - u) * cpx + u * u * b0[0], (1 - u) * (1 - u) * a0[1] + 2 * u * (1 - u) * cpy + u * u * b0[1]]); }
      const fr = eio(P(t, 7.65, 9.15));
      ctx.save(); ctx.globalAlpha *= s2;
      // origin pulse on the city edge
      const op = P(t, 7.4, 8.4); if (op > 0 && op < 1) { ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - op)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(a0[0], a0[1], 10 + 40 * op, 0, 7); ctx.stroke(); }
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(a0[0], a0[1], 8 * eob(P(t, 7.4, 7.8)), 0, 7); ctx.fill();
      strokePartial(path, 1, { strokeStyle: `rgba(255,255,255,${0.16 * ss(P(t, 7.5, 8.0))})`, lineWidth: 6, lineCap: 'round' });
      const h = strokePartial(path, fr, { strokeStyle: '#fff', lineWidth: 6, lineCap: 'round', shadowColor: 'rgba(140,160,255,0.9)', shadowBlur: 18 });
      if (h && fr > 0.02 && fr < 1) {
        ctx.save(); ctx.translate(h[0], h[1]); ctx.rotate(h[2]);
        ctx.shadowColor = 'rgba(255,255,255,0.9)'; ctx.shadowBlur = 22; ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-8, -14); ctx.lineTo(-3, 0); ctx.lineTo(-8, 14); ctx.closePath(); ctx.fill(); ctx.restore();
      }
      // light pulses travelling the route once it is drawn
      if (fr >= 1) for (const k of [0, 0.34, 0.67]) { const u = (P(t, 9.15, 12) * 2.4 + k) % 1; const q = path[Math.round(u * 80)]; ctx.fillStyle = `rgba(255,255,255,${0.9 * Math.sin(u * Math.PI)})`; ctx.beginPath(); ctx.arc(q[0], q[1], 6, 0, 7); ctx.fill(); }
      // arrival burst at Corbeanca
      const ab = P(t, 9.1, 9.9); if (ab > 0 && ab < 1) { const c0 = mproj(cam, ...GEO.corbeanca); ctx.strokeStyle = `rgba(255,255,255,${0.9 * (1 - ab)})`; ctx.lineWidth = 4 * (1 - ab) + 1; ctx.beginPath(); ctx.arc(c0[0], c0[1], 20 + 110 * eo(ab), 0, 7); ctx.stroke(); }
      ctx.restore();
      const cb = mproj(cam, ...GEO.corbeanca);
      pin(cb[0], cb[1], 1.5 * eob(P(t, 9.15, 9.7)), s2, P(t, 9.6, 12) * 3 % 1);
      pill('CORBEANCA', cb[0], cb[1] - 92, { rtl: false, size: 40, weight: 900, s: eob(P(t, 9.4, 9.95)), alpha: s2 });
    }
  }
  // ---- S3 flight
  const s3 = win(t, 10.8, 11.4, 16.0, 16.6);
  if (s3 > 0) {
    const ta = mproj(cam, ...GEO.telaviv);
    const dim = ss(P(t, 13.3, 13.9));
    ctx.save(); ctx.globalAlpha = s3 * (1 - 0.7 * dim);
    const N = 60, arc = [];
    const mx = (ta[0] + bu[0]) / 2, my = (ta[1] + bu[1]) / 2, dx = bu[0] - ta[0], dy = bu[1] - ta[1];
    const cx = mx + dy * 0.3, cy = my - dx * 0.3;
    for (let i = 0; i <= N; i++) { const u = i / N; arc.push([(1 - u) * (1 - u) * ta[0] + 2 * u * (1 - u) * cx + u * u * bu[0], (1 - u) * (1 - u) * ta[1] + 2 * u * (1 - u) * cy + u * u * bu[1]]); }
    const fp = eio(P(t, 11.8, 13.5));
    strokePartial(arc, fp, { strokeStyle: '#fff', lineWidth: 5, lineCap: 'round' });
    if (fp > 0 && fp < 1) { const h = strokePartial(arc, fp, { strokeStyle: 'rgba(0,0,0,0)' }); planeIcon(h[0], h[1], h[2], 2.2); }
    pin(ta[0], ta[1], eob(P(t, 11.0, 11.5)), 1, -1);
    pin(bu[0], bu[1], eob(P(t, 11.2, 11.7)), 1, fp >= 1 ? (t * 0.8) % 1 : -1);
    pill('TEL AVIV', ta[0] - 130, ta[1] + 8, { rtl: false, size: 24, weight: 900, s: eob(P(t, 11.2, 11.7)) });
    pill('BUCHAREST', bu[0] + 150, bu[1], { rtl: false, size: 24, weight: 900, s: eob(P(t, 11.35, 11.85)) });
    ctx.restore();
    const na = s3 * dim * (1 - ss(P(t, 15.9, 16.4)));
    if (na > 0) {
      const lift = -ei(P(t, 15.9, 16.4)) * 80;
      rollNumber(['2', ':', '3', '0'], W / 2, H / 2 - 40 + lift, 13.35, { size: 320, now: t, alpha: na, dur: 0.9 });
      pill('שעות טיסה', W / 2, H / 2 + 165 + lift, { size: 38, weight: 800, s: eob(P(t, 13.9, 14.4)), alpha: na, icon: (x, y, s) => planeIcon(x, y, -Math.PI / 4, s / 30, rgb(C.royal)) });
    }
  }
}

// ================================================================= ACT 1b — airport, the drive, DN1 / A0, connections (16.3 → 29.8)
const VP = [W / 2, 470];                                         // vanishing point of the road
function roadY(z) { return VP[1] + (H + 60 - VP[1]) * (2.2 / z); }
function roadX(xw, z) { return VP[0] + xw * (2.2 / z) * 210; }
function drawRoad(t, a, dist) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  const sky = ctx.createLinearGradient(0, 0, 0, VP[1]); sky.addColorStop(0, rgb(C.black)); sky.addColorStop(1, rgb([24, 28, 90]));
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, VP[1]);
  ctx.fillStyle = rgb([12, 17, 48]); ctx.fillRect(0, VP[1], W, H - VP[1]);
  const glow = ctx.createRadialGradient(VP[0], VP[1], 0, VP[0], VP[1], 700); glow.addColorStop(0, 'rgba(92,108,255,0.35)'); glow.addColorStop(1, 'rgba(92,108,255,0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
  // asphalt
  const zn = 2.2, zf = 120;
  ctx.fillStyle = '#1a2150'; ctx.beginPath(); ctx.moveTo(roadX(-4, zn), roadY(zn)); ctx.lineTo(roadX(-4, zf), roadY(zf)); ctx.lineTo(roadX(4, zf), roadY(zf)); ctx.lineTo(roadX(4, zn), roadY(zn)); ctx.fill();
  // edge lines
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 4;
  for (const e of [-3.7, 3.7]) { ctx.beginPath(); ctx.moveTo(roadX(e, zn), roadY(zn)); ctx.lineTo(roadX(e, zf), roadY(zf)); ctx.stroke(); }
  // centre dashes moving towards the camera
  ctx.fillStyle = '#fff';
  for (let s = Math.floor(dist / 6) * 6; s < dist + zf; s += 6) {
    const z0 = s - dist, z1 = z0 + 2.6; if (z1 < zn) continue;
    const a0 = Math.max(z0, zn);
    ctx.beginPath(); ctx.moveTo(roadX(-0.12, a0), roadY(a0)); ctx.lineTo(roadX(0.12, a0), roadY(a0)); ctx.lineTo(roadX(0.12, z1), roadY(z1)); ctx.lineTo(roadX(-0.12, z1), roadY(z1)); ctx.fill();
  }
  // light posts on both sides
  for (let s = Math.floor(dist / 9) * 9; s < dist + zf; s += 9) {
    const z = s - dist; if (z < zn + 0.4) continue;
    for (const side of [-1, 1]) {
      const x = roadX(side * 5.2, z), y = roadY(z), hpx = 3.2 * (2.2 / z) * 210;
      ctx.strokeStyle = `rgba(255,255,255,${clamp(0.75 - z / 160)})`; ctx.lineWidth = Math.max(1, 12 / z);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - hpx); ctx.lineTo(x - side * hpx * 0.18, y - hpx); ctx.stroke();
      ctx.fillStyle = `rgba(255,220,160,${clamp(0.9 - z / 140)})`; ctx.beginPath(); ctx.arc(x - side * hpx * 0.18, y - hpx, Math.max(1.5, 30 / z), 0, 7); ctx.fill();
    }
  }
  ctx.restore();
}
function roadSign(label, side, z, col, a) {
  if (a <= 0 || z < 2.3) return;
  const k = 2.2 / z, x = roadX(side * 5.6, z), y = roadY(z);
  const w = 420 * k * 1.6, h = 230 * k * 1.6, top = y - 760 * k;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.fillStyle = '#9aa0b4'; ctx.fillRect(x - 6 * k, top + h, 12 * k, y - top - h);
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 30 * k;
  ctx.fillStyle = col; rr(x - w / 2, top, w, h, 26 * k); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 7 * k; rr(x - w / 2 + 12 * k, top + 12 * k, w - 24 * k, h - 24 * k, 18 * k); ctx.stroke();
  text(label, x, top + h / 2 + 4 * k, { size: 150 * k, weight: 900, color: '#fff' });
  ctx.restore();
}
function act1b(t) {
  const a = ss(P(t, 16.3, 16.9)) * (1 - ss(P(t, 29.4, 29.9)));
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  // black takes over from the blue flight scene through the Bucharest point
  circleReveal(C.black, 1180, 330, P(t, 16.3, 17.2));
  // ---- the road
  const dist = 60 * eio(P(t, 18.8, 22.6)) + Math.max(0, t - 22.6) * 9 + Math.max(0, Math.min(t, 18.8) - 18.0) * 2;
  const roadA = ss(P(t, 18.3, 19.1)) * (1 - ss(P(t, 26.4, 27.2)));
  if (roadA > 0) {
    ctx.save(); ctx.beginPath(); const rv = eio(P(t, 18.3, 19.2)); ctx.rect(0, VP[1] - VP[1] * rv, W, H * rv + 10); ctx.clip();
    drawRoad(t, roadA, dist);
    roadSign('DN1', 1, lerp(70, 4.2, eo5(P(t, 24.6, 25.6))), '#1f4fd1', ss(P(t, 24.6, 24.9)) * (1 - ss(P(t, 26.4, 26.9))));
    roadSign('A0', -1, lerp(70, 4.6, eo5(P(t, 25.3, 26.3))), '#14894d', ss(P(t, 25.3, 25.6)) * (1 - ss(P(t, 26.4, 26.9))));
    ctx.restore();
  }
  // ---- airport chip: draws itself, then docks at the start of the progress track
  const dock = eio(P(t, 18.5, 19.3));
  const chipA = ss(P(t, 16.9, 17.2)) * (1 - ss(P(t, 23.2, 23.8)));
  const tx0 = 420, tx1 = 1500, ty = 960;
  if (chipA > 0) {
    const cx = lerp(W / 2, tx0, dock), cy = lerp(500, ty, dock), sc = lerp(1, 0.38, dock);
    ctx.save(); ctx.globalAlpha *= chipA; ctx.translate(cx, cy); ctx.scale(sc, sc);
    const draw = eio(P(t, 16.9, 17.5)), fill = eo(P(t, 17.3, 17.7));
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, 120, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * draw); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 120 * fill, 0, 7); ctx.fill();
    const pl = eob(P(t, 17.4, 17.95));
    if (pl > 0) planeIcon(0, 0, lerp(-Math.PI, -Math.PI / 4, eo(P(t, 17.4, 18.0))), 4.2 * pl, rgb(C.royal));
    ctx.restore();
    ctx.save(); ctx.globalAlpha *= chipA * (1 - dock);
    kinetic('OTP', W / 2, 720, 17.55, { now: t, size: 120, weight: 900 });
    ctx.restore();
  }
  // ---- progress track OTP → CORBEANCA with distance counter
  const trA = ss(P(t, 18.8, 19.3)) * (1 - ss(P(t, 23.2, 23.8)));
  if (trA > 0) {
    ctx.save(); ctx.globalAlpha *= trA;
    const f = eio(P(t, 18.9, 22.5)), w0 = eo5(P(t, 18.8, 19.5));
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; rr(tx0, ty - 4, (tx1 - tx0) * w0, 8, 4); ctx.fill();
    ctx.fillStyle = '#fff'; rr(tx0, ty - 4, (tx1 - tx0) * f, 8, 4); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(255,255,255,0.9)'; ctx.shadowBlur = 20; ctx.beginPath(); ctx.arc(tx0 + (tx1 - tx0) * f, ty, 13, 0, 7); ctx.fill(); ctx.shadowColor = 'transparent';
    pin(tx1, ty, eob(P(t, 19.1, 19.6)), 1, f >= 1 ? (t * 0.9) % 1 : -1);
    pill('OTP', tx0, ty - 92, { rtl: false, size: 26, weight: 900, s: eob(P(t, 19.0, 19.4)) });
    pill('CORBEANCA', tx1, ty - 70, { rtl: false, size: 26, weight: 900, s: eob(P(t, 19.2, 19.6)), bg: f >= 1 ? rgb(C.royalHi) : '#fff', color: f >= 1 ? '#fff' : rgb(C.royal) });
    ctx.restore();
    const ka = ss(P(t, 19.6, 19.9)) * (1 - ss(P(t, 23.0, 23.5)));
    if (ka > 0) rollNumber(['ק״מ', ' ', '6', '-', 'כ'], W / 2, 210 - ei(P(t, 23.0, 23.5)) * 60, 19.7, { size: 180, now: t, alpha: ka, dur: 0.8 });
  }
  // ---- connections: Corbeanca hub → the capital and other cities
  const net = ss(P(t, 26.4, 27.0));
  if (net > 0) {
    ctx.save(); ctx.globalAlpha *= net;
    const flat = eio(P(t, 28.95, 29.65));
    const c = [W / 2, 560];
    // real directions from Corbeanca (screen up = north); names sit at the end of each line
    const nodes = [[W / 2 + 30, 860, 'BUCHAREST', 26.6, true], [W / 2 + 12, 330, 'PLOIEȘTI', 27.25], [W / 2 - 200, 140, 'BRAȘOV', 27.45], [W / 2 - 640, 440, 'PITEȘTI', 27.65], [W / 2 + 560, 620, 'CONSTANȚA', 27.85]];
    for (const [nx, ny, label, ts, cap] of nodes) {
      const p0 = [lerp(c[0], -100, flat), lerp(c[1], 820, flat)], p1 = [lerp(nx, W + 100, flat), lerp(ny, 820, flat)];
      const dr = eio(P(t, ts, ts + 0.6));
      strokePartial([p0, p1], dr, { strokeStyle: `rgba(255,255,255,${cap ? 1 : 0.8})`, lineWidth: cap ? 6 : 4, lineCap: 'round' });
      const f = P(t, ts + 0.5, 30);
      if (flat < 0.3 && dr >= 1) for (const k of [0, 0.5]) { const u = (f * 1.4 + k) % 1; ctx.fillStyle = `rgba(255,255,255,${0.9 * (1 - flat * 3)})`; ctx.beginPath(); ctx.arc(lerp(p0[0], p1[0], u), lerp(p0[1], p1[1], u), 5, 0, 7); ctx.fill(); }
      const na = (1 - flat) * eob(P(t, ts + 0.45, ts + 0.85));
      if (na > 0) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(nx, ny, (cap ? 16 : 12) * na, 0, 7); ctx.fill(); }
      const len = Math.hypot(nx - c[0], ny - c[1]), ux = (nx - c[0]) / len, uy = (ny - c[1]) / len;
      font(30, 800); const pw = ctx.measureText(label).width + 48;
      const off = Math.abs(ux) * (pw / 2 + 26) + Math.abs(uy) * 46;
      pill(label, nx + ux * off, ny + uy * off, { rtl: false, size: 30, weight: 800, s: eob(P(t, ts + 0.5, ts + 0.9)) * (1 - flat), bg: cap ? rgb(C.royalHi) : '#fff', color: cap ? '#fff' : rgb(C.royal) });
    }
    pin(c[0], c[1], 1.6 * eob(P(t, 26.5, 27.0)) * (1 - flat), 1 - flat, (t * 0.8) % 1);
    ctx.restore();
  }
  ctx.restore();
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
  deepBG(0, 0, W, H, t);
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
  // ---- families · businesspeople · entrepreneurs: icon chips over the street
  const chipOut = eio(P(t, 40.0, 40.5));
  [[familyGlyph, 38.55], [briefcaseGlyph, 39.15], [bulbGlyph, 39.75]].forEach(([fn, ts], i) => {
    const e = eob(P(t, ts, ts + 0.5)); if (e <= 0 || chipOut >= 1) return;
    const x = W / 2 + (1 - i) * 260, y = 330 - chipOut * 500;
    ctx.save(); ctx.translate(x, y); ctx.scale(e, e); if (chipOut > 0) ctx.filter = `blur(${chipOut * 14}px)`;
    ctx.shadowColor = 'rgba(0,0,30,0.35)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 92, 0, 7); ctx.fill(); ctx.shadowColor = 'transparent';
    fn(0, 2, 2.4, rgb(C.royal));
    ctx.restore();
  });
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

// ================================================================= ACT 3 — shopping → DN1 Value Centre → numbers (44.6 → 60.6)
const BRAND = {}; for (const [k, d] of Object.entries(window.BRAND_PATHS || {})) BRAND[k] = new Path2D(d);
// official mark (24×24 Simple Icons path) with a stroke-draw → fill build, like a logo reveal
function brandMark(k, x, y, size, col, build = 1, a = 1) {
  const p = BRAND[k]; if (!p || a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x - size / 2, y - size / 2); ctx.scale(size / 24, size / 24);
  if (build < 1) { ctx.strokeStyle = col; ctx.lineWidth = 0.35; ctx.setLineDash([140 * clamp(build * 1.6), 400]); ctx.stroke(p); ctx.setLineDash([]); }
  ctx.globalAlpha *= clamp((build - 0.45) / 0.55); ctx.fillStyle = col; ctx.fill(p, 'evenodd');
  ctx.restore();
}
function bagGlyph(x, y, s, col, draw = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = col; ctx.lineWidth = 3.2; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.setLineDash([200 * draw, 400]);
  ctx.beginPath(); ctx.moveTo(-15, -8); ctx.lineTo(15, -8); ctx.lineTo(17, 18); ctx.lineTo(-17, 18); ctx.closePath(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-8, -8); ctx.lineTo(-8, -13); ctx.quadraticCurveTo(-8, -20, 0, -20); ctx.quadraticCurveTo(8, -20, 8, -13); ctx.lineTo(8, -8); ctx.stroke();
  ctx.restore();
}
const SUPER = [['lidl', 'Lidl', 51.45, '#0050aa'], ['mega', 'Mega Image', 52.15, '#14162a'], ['penny', 'Penny', 52.85, '#cd1414']];
const VC_BRANDS = [['carrefour', 'Carrefour'], ['dm', 'dm'], ['', 'NEW YORKER'], ['', 'C&A'], ['', 'Deichmann'], ['', 'JYSK'], ['', 'PEPCO'], ['', 'CCC']];
function act3(t) {
  const a = ss(P(t, 44.6, 45.2)) * (1 - ss(P(t, 60.4, 60.9)));
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  // royal blue rises from the bottom as the street scene lifts away
  ctx.fillStyle = rgb(C.royal); ctx.fillRect(0, H * (1 - eio(P(t, 44.6, 45.3))), W, H);
  // ---- S7 shopping nearby: bag icon + proximity rings
  const bagOut = eio(P(t, 48.2, 49.0));
  const bA = ss(P(t, 45.0, 45.3)) * (1 - ss(P(t, 53.2, 53.7)));
  if (bA > 0) {
    const bx = W / 2, by = lerp(500, 210, bagOut), bs = lerp(1, 0.5, bagOut);
    ctx.save(); ctx.globalAlpha *= bA;
    for (const k of [0, 0.33, 0.66]) { const p = (P(t, 46.4, 60) * 2.2 + k) % 1; const ra = (1 - bagOut) * ss(P(t, 46.4, 46.8)); ctx.strokeStyle = `rgba(255,255,255,${0.45 * (1 - p) * ra})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(bx, by, 150 + 360 * p, 0, 7); ctx.stroke(); }
    const sc = eob(P(t, 45.0, 45.6)) * bs;
    ctx.translate(bx, by); ctx.scale(sc, sc);
    ctx.shadowColor = 'rgba(0,0,30,0.4)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 14;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 140, 0, 7); ctx.fill(); ctx.shadowColor = 'transparent';
    bagGlyph(0, 6, 3.4, rgb(C.royal), eio(P(t, 45.3, 46.2)));
    ctx.restore();
  }
  // ---- S8a supermarket icons (no map): white app-style tiles, logos land on the spoken names
  const tOut = eio(P(t, 53.3, 53.9));
  SUPER.forEach(([k, name, tl, col], i) => {
    const x = W / 2 + (1 - i) * 400;                         // RTL: first named on the right
    const ent = eo5(P(t, 48.5 + i * 0.12, 49.3 + i * 0.12));
    if (ent <= 0) return;
    const y = 560 + (1 - ent) * 500 - tOut * 900, sz = 270;
    const vel = (1 - ent) * 16 + tOut * (1 - tOut) * 40;
    ctx.save(); if (vel > 0.5) ctx.filter = `blur(${vel}px)`;
    card(x - sz / 2, y - sz / 2, sz, sz, { r: 62 });
    const lg = P(t, tl - 0.15, tl + 0.4);
    if (lg <= 0) { // loading skeleton
      const sh = (t * 1.2 + i * 0.2) % 1;
      ctx.fillStyle = '#eceef6'; rr(x - 70, y - 20, 140, 40, 20); ctx.fill();
      const g = ctx.createLinearGradient(x - 70 + 220 * sh - 60, 0, x - 70 + 220 * sh + 60, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; rr(x - 70, y - 20, 140, 40, 20); ctx.fill();
    } else {
      const s = eob(lg);
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      if (BRAND[k]) brandMark(k, 0, 0, 170, col, 1, clamp(lg * 2));
      else { text('Mega', 0, -26, { size: 62, weight: 900, color: col, alpha: clamp(lg * 2) }); text('Image', 0, 34, { size: 50, weight: 700, color: col, alpha: clamp(lg * 2) }); }
      ctx.restore();
    }
    ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(x - 250, y + sz / 2 + 20, 500, 90); ctx.clip();
    const nl = expo(P(t, tl, tl + 0.5));
    text(name, x, y + sz / 2 + 62 + (1 - nl) * 70, { size: 46, weight: 900, alpha: nl * (1 - tOut) });
    ctx.restore();
  });
  // ---- S8b DN1 Value Centre: black panel slides up, title, international brand grid
  const pan = eio(P(t, 53.3, 54.0));
  if (pan > 0) {
    ctx.save(); ctx.beginPath(); ctx.rect(0, H * (1 - pan), W, H * pan); ctx.clip();
    deepBG(0, 0, W, H, t);
    const out = eio(P(t, 57.4, 58.2));
    ctx.save(); ctx.globalAlpha *= 1 - out;
    kinetic('CENTRE VALUE DN1', W / 2, 200, 53.75, { now: t, size: 104, weight: 900 });
    const line = eio(P(t, 54.2, 54.9)); ctx.fillStyle = rgb(C.royalHi); ctx.fillRect(W / 2 - 230 * line, 285, 460 * line, 5);
    ctx.restore();
    const cols = 4, tw = 360, th = 190, gx = 34, gy = 34;
    VC_BRANDS.forEach(([k, name], i) => {
      const r = Math.floor(i / cols), c = i % cols;
      const x = W / 2 + (1.5 - c) * (tw + gx), y = 520 + r * (th + gy);   // RTL order
      const ts = 54.3 + i * 0.11;
      const e = eo5(P(t, ts, ts + 0.7));
      if (e <= 0) return;
      const col2 = P(t, 57.4 + i * 0.03, 58.1 + i * 0.03);
      const shrink = eio(col2);
      const w = lerp(tw, 10, shrink), h = lerp(th, 10, shrink);
      const yy = y + (1 - e) * 160;
      ctx.save(); ctx.globalAlpha *= clamp(e * 1.4) * (1 - ss(P(col2, 0.7, 1)));
      if (e < 1) ctx.filter = `blur(${(1 - e) * 14}px)`;
      ctx.fillStyle = 'rgba(70,84,220,0.20)'; rr(x - w / 2, yy - h / 2, w, h, lerp(30, 5, shrink)); ctx.fill();
      ctx.strokeStyle = 'rgba(160,175,255,0.22)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
      if (shrink < 0.4) {
        const ca = clamp(e * 1.5) * (1 - shrink * 2.5);
        if (k) brandMark(k, x, yy, k === 'dm' ? 120 : 110, '#fff', P(t, ts + 0.2, ts + 1.3), ca);
        else {
          font(48, 900); const fw = ctx.measureText(name).width; const fsz = Math.min(48, 48 * 280 / fw);
          ctx.save(); ctx.beginPath(); ctx.rect(x - tw / 2, yy - th / 2, tw, th); ctx.clip();
          const u = expo(P(t, ts + 0.25, ts + 0.85));
          text(name, x, yy + (1 - u) * 60, { size: fsz, weight: 900, alpha: ca * u, spacing: name.length < 5 ? 4 : 1 });
          ctx.restore();
        }
      }
    });
    // ---- S9 the numbers: perspective data matrix (as in the reference)
    const mA = ss(P(t, 57.9, 58.5));
    if (mA > 0) drawMatrix(t, mA);
    ctx.restore();
  }
  // hand-off to the data act: royal blue opens from the centre line
  const op = eio(P(t, 59.9, 60.6));
  if (op > 0) { ctx.fillStyle = rgb(C.royal); ctx.fillRect(0, H / 2 - H / 2 * op, W, H * op); }
  ctx.restore();
}
const MATRIX = (() => { const r = rng(17), cells = []; for (let row = 0; row < 52; row++) for (let col = -6; col <= 6; col++) { const v = (r() * 9000 + 100).toFixed(r() < 0.5 ? 2 : 0); cells.push({ row, col, v: Number(v).toLocaleString('en-US', { minimumFractionDigits: v.includes('.') ? 2 : 0 }), g: r() < 0.12, k: r() }); } return cells; })();
function drawMatrix(t, a) {
  ctx.save(); ctx.globalAlpha *= a;
  const scroll = (t - 57.9) * 7 + ei(P(t, 59.2, 60.4)) * 40;
  const hy = 150;
  for (const c of MATRIX) {
    const z = ((c.row * 2.2 - scroll) % 114 + 114) % 114, sc = 4 / (z + 4);
    const y = hy + 900 * sc, x = W / 2 + (c.col + (c.row % 2) * 0.5) * 310 * sc;
    if (y < hy || y > H + 40 || x < -200 || x > W + 200) continue;
    const al = clamp(1.4 - z / 70) * (0.35 + 0.65 * c.k);
    text(c.v, x, y, { size: Math.max(6, 64 * sc), weight: 700, color: c.g ? '#46d38a' : '#fff', alpha: al });
  }
  // depth fade toward the horizon
  const g = ctx.createLinearGradient(0, 0, 0, H * 0.55); g.addColorStop(0, rgb(C.black)); g.addColorStop(1, rgb(C.black, 0));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * 0.55);
  ctx.restore();
}

// ================================================================= ACT 4 — data (59.6 → 79.8)
function act4(t) {
  const a = ss(P(t, 60.45, 60.6)) * (1 - ss(P(t, 79.4, 79.9)));
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  // ---- backgrounds
  ctx.fillStyle = rgb(C.royal); ctx.fillRect(0, 0, W, H);
  // ---- S10 a decade of development: white chart card (line + area + columns), no dates
  const cardIn = eo5(P(t, 60.5, 61.3)), cardOut = eio(P(t, 64.2, 64.9));
  if (cardIn > 0 && cardOut < 1) {
    const cw = 1400, ch = 700, cx = W / 2 - cardOut * 1500, cy = H / 2 + 30 + (1 - cardIn) * 700;
    const bl = (1 - cardIn) * 14 + Math.sin(cardOut * Math.PI) * 20;
    ctx.save(); if (bl > 0.5) ctx.filter = `blur(${bl}px)`;
    card(cx - cw / 2, cy - ch / 2, cw, ch, { r: 40 });
    const x0 = cx - cw / 2 + 110, x1 = cx + cw / 2 - 110, y0 = cy + ch / 2 - 110, y1 = cy - ch / 2 + 150;
    ctx.fillStyle = '#e9ebf3'; for (let i = 0; i <= 4; i++) ctx.fillRect(x0, lerp(y0, y1, i / 4), x1 - x0, 2);
    // columns
    const N = 10;
    for (let i = 0; i < N; i++) {
      const g = eo5(P(t, 61.0 + i * 0.12, 61.7 + i * 0.12)), hh = (y0 - y1) * (0.18 + 0.62 * Math.pow((i + 1) / N, 1.5)) * g;
      ctx.fillStyle = i === N - 1 ? rgb(C.royal) : '#d7dbf5'; rr(x0 + (i + 0.2) * (x1 - x0) / N, y0 - hh, (x1 - x0) / N * 0.6, hh, 10); ctx.fill();
    }
    // line + area
    const pts = []; for (let i = 0; i <= 80; i++) { const u = i / 80; pts.push([lerp(x0, x1, u), y0 - (y0 - y1) * (0.12 + 0.8 * Math.pow(u, 1.5) + 0.03 * Math.sin(u * 14))]); }
    const f = eio(P(t, 61.2, 63.8)), n = Math.max(2, Math.round(80 * f) + 1);
    const sub = pts.slice(0, n);
    const ag = ctx.createLinearGradient(0, y1, 0, y0); ag.addColorStop(0, rgb(C.royal, 0.28)); ag.addColorStop(1, rgb(C.royal, 0));
    ctx.fillStyle = ag; ctx.beginPath(); ctx.moveTo(sub[0][0], y0); sub.forEach(p => ctx.lineTo(...p)); ctx.lineTo(sub[sub.length - 1][0], y0); ctx.fill();
    const head = strokePartial(sub, 1, { strokeStyle: rgb(C.royal), lineWidth: 7, lineJoin: 'round', lineCap: 'round' });
    if (head && f > 0) { ctx.fillStyle = rgb(C.royal); ctx.beginPath(); ctx.arc(head[0], head[1], 13, 0, 7); ctx.fill(); ctx.strokeStyle = rgb(C.royal, 0.35); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(head[0], head[1], 13 + 20 * ((t * 1.5) % 1), 0, 7); ctx.stroke(); }
    // card header: house icon chip
    ctx.fillStyle = rgb(C.royal); ctx.beginPath(); ctx.arc(cx + cw / 2 - 90, cy - ch / 2 + 80, 34, 0, 7); ctx.fill(); houseGlyph(cx + cw / 2 - 90, cy - ch / 2 + 80, 1.15, '#fff', 3.5);
    ctx.fillStyle = '#e9ebf3'; rr(cx + cw / 2 - 400, cy - ch / 2 + 62, 260, 16, 8); ctx.fill(); rr(cx + cw / 2 - 330, cy - ch / 2 + 88, 190, 12, 6); ctx.fill();
    ctx.restore();
  }
  // ---- S11 +61% with a growth sparkline
  const s11 = win(t, 64.4, 64.9, 68.2, 68.8);
  if (s11 > 0) {
    const sl = (1 - eo5(P(t, 64.4, 65.2))) * 600;
    const r = rng(3), nd = Math.floor(lerp(40, 520, eo(P(t, 64.6, 68.0))));
    for (let i = 0; i < 520; i++) {
      const ang = r() * Math.PI * 2, rad = 380 + r() * 700, sp = 0.03 + r() * 0.05, k = r();
      if (i >= nd) continue;
      const x = W / 2 + Math.cos(ang + t * sp) * rad * 1.2, y = H / 2 + Math.sin(ang + t * sp) * rad * 0.62;
      ctx.fillStyle = `rgba(255,255,255,${s11 * (0.15 + 0.4 * k) * ss(P(t, 64.6 + i * 0.005, 65.0 + i * 0.005))})`;
      ctx.beginPath(); ctx.arc(x, y, 2 + k * 2.5, 0, 7); ctx.fill();
    }
    const up = -ei(P(t, 68.2, 68.8)) * 120;
    rollNumber(['+', '6', '1', '%'], W / 2 + sl, H / 2 - 90 + up, 65.15, { size: 330, now: t, alpha: s11, dur: 1.4 });
    const sp = []; for (let i = 0; i <= 50; i++) { const u = i / 50; sp.push([W / 2 - 330 + u * 660 + sl, H / 2 + 170 + up - 90 * Math.pow(u, 1.6) + 10 * Math.sin(u * 11)]); }
    ctx.save(); ctx.globalAlpha *= s11;
    const h = strokePartial(sp, eio(P(t, 65.4, 67.2)), { strokeStyle: '#46d38a', lineWidth: 6, lineCap: 'round', lineJoin: 'round' });
    if (h) { ctx.fillStyle = '#46d38a'; ctx.beginPath(); ctx.arc(h[0], h[1], 10, 0, 7); ctx.fill(); }
    ctx.restore();
    pill('גידול באוכלוסייה', W / 2 + sl, H / 2 + 270 + up, { size: 36, weight: 800, s: eob(P(t, 66.4, 66.9)), alpha: s11, icon: (x, y, s) => arrowUp(x, y, s * 1.3, '#1f9d5c') });
  }
  // ---- S12 land market: royal panel slides away to black; bars
  const s12 = win(t, 68.4, 68.9, 75.6, 76.4);
  if (s12 > 0) {
    const wipe = eio(P(t, 68.3, 69.0)), back = eio(P(t, 75.4, 76.3));
    ctx.save(); ctx.beginPath(); ctx.rect(0, H * (1 - wipe), W, H * wipe); ctx.clip();
    deepBG(0, 0, W, H, t);
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
    const cam = { lon: 26.06, lat: 44.56, z: lerp(2600, 3000, P(t, 75.8, 79.8)), rot: 0 };
    drawRegion(cam, 0.35, t, {});
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
  const a = ss(P(t, 79.1, 79.7)) * (1 - ss(P(t, 94.7, 95.3)));
  const rise = eio(P(t, 93.45, 95.1));             // drone shot: camera lifts away into the night sky
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  const day = ss(P(t, 79.6, 82.0)), dusk = ss(P(t, 87.8, 90.2));
  const top = mix(mix(mix(C.royal, [70, 96, 230], day), [14, 16, 46], dusk), C.black, rise);
  const bot = mix(mix(mix(C.royal2, [190, 205, 255], day), [120, 76, 110], dusk), [24, 30, 90], rise);
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, rgb(top)); g.addColorStop(1, rgb(bot));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (dusk > 0) { const hz = ctx.createRadialGradient(W * 0.75, H * 0.8, 0, W * 0.75, H * 0.8, H); hz.addColorStop(0, `rgba(255,170,100,${0.35 * dusk})`); hz.addColorStop(1, 'rgba(255,170,100,0)'); ctx.fillStyle = hz; ctx.fillRect(0, 0, W, H); }
  // stars at dusk
  if (dusk > 0.3) { const r = rng(12); const n = Math.round(70 + 110 * rise); for (let i = 0; i < n; i++) { const x = r() * W, y = r() * H * (0.5 + 0.5 * rise) + rise * 260 - 120 * rise, k = r(); ctx.fillStyle = `rgba(255,255,255,${(dusk - 0.3) * (0.3 + 0.5 * k) * (0.6 + 0.4 * Math.sin(t * 2 + i)) * (i >= 70 ? rise : 1)})`; ctx.fillRect(x, y, 2, 2); } }
  // camera: hero close → neighbourhood wide → back to hero
  const wide = eio(P(t, 82.6, 86.4)) * (1 - eio(P(t, 87.6, 93.2)));
  const u = lerp(62, 30, wide) * lerp(1, 1.05, P(t, 93.2, 94.5));
  const intro = eo5(P(t, 79.2, 80.4));
  const uu = u * lerp(0.4, 1, intro);
  const by = lerp(800, 760, wide);
  const X = wx => W / 2 + wx * uu;
  // everything on the ground slides down and away as the camera rises
  ctx.save(); ctx.translate(W / 2, by + rise * 950); ctx.scale(1 - 0.22 * rise, 1 - 0.22 * rise); ctx.translate(-W / 2, -by);
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
  // foreground depth: large out-of-focus trees and hedge at the frame edges
  const fg = ss(P(t, 82.8, 84.0)) * (1 - ss(P(t, 88.2, 89.4)));
  if (fg > 0) {
    ctx.save(); ctx.globalAlpha *= fg; ctx.filter = 'blur(3px)';
    for (const [fx, k] of [[-0.06, 0.3], [0.08, 0.7], [0.93, 0.5], [1.05, 0.2]]) tree(W * fx + (t - 84) * (fx < 0.5 ? -14 : 14), H + 40, 62, eob(P(t, 82.8 + k * 0.4, 83.6 + k * 0.4)), { k, tall: k > 0.4, dusk });
    ctx.fillStyle = rgb(mix([40, 128, 84], [20, 44, 40], dusk)); rr(-40, H - 70, W + 80, 140, 60); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
  ctx.restore();
}

// ================================================================= ACT 6 — brand (93.9 → 102)
function act6(t) {
  const a = ss(P(t, 94.55, 95.15));
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  // royal-blue field with a soft centre light and darker edges
  ctx.fillStyle = rgb([14, 22, 92]); ctx.fillRect(0, 0, W, H);
  const v = ctx.createRadialGradient(W / 2, H * 0.48, 60, W / 2, H * 0.5, W * 0.62);
  v.addColorStop(0, 'rgba(40,58,170,0.75)'); v.addColorStop(0.6, 'rgba(26,38,130,0.35)'); v.addColorStop(1, 'rgba(6,10,50,0.6)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  const out2 = 1 - ss(P(t, 100.4, 100.9));
  // GIGI RESIDENCE — classic serif, silver, letters rise out of a mask
  const word = 'GIGI RESIDENCE', fs = 150, sp = 8, gy = 205;
  font(fs, 400, SERIF);
  const widths = [...word].map(ch => ctx.measureText(ch).width + sp);
  const tw = widths.reduce((p, q) => p + q, 0) - sp;
  const silver = ctx.createLinearGradient(0, gy - 70, 0, gy + 70); silver.addColorStop(0, '#ffffff'); silver.addColorStop(0.55, '#e9ecf6'); silver.addColorStop(1, '#b9bfd3');
  let x = W / 2 - tw / 2;
  ctx.save(); ctx.beginPath(); ctx.rect(0, gy - 110, W, 220); ctx.clip();
  [...word].forEach((ch, i) => {
    const u = expo(P(t, 94.65 + i * 0.04, 95.5 + i * 0.04));
    ctx.save(); ctx.shadowColor = 'rgba(0,0,30,0.45)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
    text(ch, x + (widths[i] - sp) / 2, gy + (1 - u) * 160, { size: fs, weight: 400, fam: SERIF, color: silver, alpha: u, blur: (1 - u) * 8 });
    ctx.restore();
    x += widths[i];
  });
  ctx.restore();
  // gold rule draws out from the centre
  const ruleW = 560 * eio(P(t, 95.0, 95.8));
  ctx.fillStyle = rgb(C.gold); ctx.fillRect(W / 2 - ruleW / 2, 318, ruleW, 2.5);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 340, W, 90); ctx.clip();
  const bu = expo(P(t, 95.25, 95.9));
  text('BY', W / 2, 386 + (1 - bu) * 70, { size: 68, weight: 400, fam: SERIF, color: rgb(C.gold), alpha: bu, spacing: 4 });
  ctx.restore();
  // ISROMANA official logo (screen-blended so its black field disappears)
  const img = IMG.logo;
  if (img) {
    const la = ss(P(t, 95.4, 96.3)), lw = 700, lh = lw * img.height / img.width, top = 420;
    const ls = lerp(0.94, 1, eo5(P(t, 95.4, 96.9)));
    ctx.save(); ctx.globalAlpha = la; ctx.globalCompositeOperation = 'screen';
    if (la < 1) ctx.filter = `blur(${(1 - la) * 10}px)`;
    ctx.translate(W / 2, top + lh / 2); ctx.scale(ls, ls); ctx.drawImage(img, -lw / 2, -lh / 2, lw, lh); ctx.restore();
    // LUXURY RESIDENCE moment: a light sweep across the logo's own tagline
    const sw = P(t, 96.5, 97.6);
    if (sw > 0 && sw < 1) {
      const yy = top + lh * 0.935, xx = W / 2 - lw * 0.42 + lw * 0.84 * eio(sw);
      const gr = ctx.createRadialGradient(xx, yy, 0, xx, yy, 80); gr.addColorStop(0, 'rgba(255,240,210,0.5)'); gr.addColorStop(1, 'rgba(255,240,210,0)');
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = gr; ctx.fillRect(xx - 80, yy - 80, 160, 160); ctx.restore();
    }
  }
  kinetic('מרימים את הסטנדרט רמה אחת מעל.', W / 2, 1000, 98.05, { now: t, size: 44, weight: 700, out: 100.35, stagger: 0.08, alpha: out2 });
  ctx.restore();
}

// ================================================================= frame
function drawFrame(t) {
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  deepBG(0, 0, W, H, t);
  if (t < 17.5) act1(t);
  if (t > 16.2 && t < 30.0) act1b(t);
  if (t > 29.2 && t < 45.3) act2(t);
  if (t > 44.5 && t < 61) act3(t);
  if (t > 58.9 && t < 80) act4(t);
  if (t > 79 && t < 95.4) act5(t);
  if (t > 94.5) act6(t);
  // gentle vignette
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.5, W / 2, H / 2, W * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.28)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  drawLogoCorner(ss(P(t, 0.3, 1.2)) * (1 - ss(P(t, 94.2, 95.0))));
  const fb = ss(P(t, 101.3, 102.0));
  if (fb > 0) { ctx.fillStyle = `rgba(0,0,0,${fb})`; ctx.fillRect(0, 0, W, H); }
}
// Motion blur: average MB sub-frames across a 180° shutter (half a frame at 25 fps).
const MB = Number(new URLSearchParams(location.search).get('mb') || 1);
let ACC = null;
function renderFrame(t) {
  if (MB <= 1) return drawFrame(t);
  if (!ACC) { ACC = document.createElement('canvas'); ACC.width = cv.width; ACC.height = cv.height; }
  const ac = ACC.getContext('2d');
  for (let i = 0; i < MB; i++) {
    drawFrame(clamp(t + (i / (MB - 1) - 0.5) * 0.5 / 25, 0, 102));
    ac.globalAlpha = 1 / (i + 1); ac.drawImage(cv, 0, 0);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none'; ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(ACC, 0, 0);
}
window.renderFrame = renderFrame;
window.READY = (async () => {
  await loadImg('logo', 'assets/isromana-logo.jpg');
  const loads = [];
  for (const w of [200, 300, 400, 500, 700, 800, 900]) for (const s of ['אבג', 'ABC123', 'ȘȚÂ']) loads.push(document.fonts.load(`${w} 20px ${FONT}`, s).catch(() => null));
  loads.push(document.fonts.load(`400 40px ${SERIF}`, 'GIGI RESIDENCE BY'));
  await Promise.all(loads); await document.fonts.ready;
  renderFrame(0);
  return true;
})();
