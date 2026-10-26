/* GIGI RESIDENCE BY ISROMANA — 102s motion-graphics film.
 * Everything is drawn procedurally on one canvas as a pure function of time:
 * renderFrame(t) draws the frame at t seconds. Design space is 1920x1080;
 * the canvas backing store is scaled by SCALE (2 → 3840x2160).
 *
 * Timing (seconds) is locked to the supplied voiceover (sentence breaks measured
 * with ffmpeg silencedetect, see README.md). */
'use strict';

const W = 1920, H = 1080;
const SCALE = Number(new URLSearchParams(location.search).get('scale') || 2);
const cv = document.getElementById('c');
cv.width = W * SCALE; cv.height = H * SCALE;
const ctx = cv.getContext('2d');

// ---------------------------------------------------------------- palette
const C = {
  deep: [6, 20, 44], deep2: [10, 33, 72], royal: [22, 58, 170], night: [3, 10, 24],
  land: '#10294f', land2: '#16386a', white: '#ffffff', green: '#5fae80', green2: '#3f8a60',
  green3: '#7cc79a', gold: '#d6b679', gold2: '#b8955a', slate: '#0c1c36', mist: '#9fb3cf',
};
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

// ---------------------------------------------------------------- math
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const P = (t, a, b) => clamp((t - a) / (b - a));
const ss = t => t * t * (3 - 2 * t);
const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eo = t => 1 - Math.pow(1 - t, 3);
const eo5 = t => 1 - Math.pow(1 - t, 5);
const ei = t => t * t * t;
const eob = t => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
// fade in over [a,b], out over [c,d]
const win = (t, a, b, c, d) => Math.min(ss(P(t, a, b)), 1 - ss(P(t, c, d)));
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ---------------------------------------------------------------- geography
// Coordinates (lat, lon). Regional points are public reference coordinates;
// see README for the list that must be verified before final delivery.
const GEO = {
  telaviv: [32.0853, 34.7818],
  bucharest: [44.4268, 26.1025],
  otp: [44.5711, 26.0850],          // Henri Coandă International Airport
  corbeanca: [44.6005, 26.0450],
  valueCentre: [44.6125, 26.0840],  // DN1 Value Centre, Balotești (DN1)
  lidl: [44.5945, 26.0530],
  mega: [44.6040, 26.0385],
  penny: [44.5885, 26.0440],
};
// DN1 — Bucharest → Otopeni → Balotești → north
const DN1 = [[44.447, 26.084], [44.466, 26.080], [44.480, 26.075], [44.500, 26.080], [44.520, 26.078], [44.540, 26.075], [44.556, 26.073], [44.572, 26.076], [44.590, 26.080], [44.606, 26.083], [44.625, 26.089], [44.650, 26.096], [44.690, 26.103]];
// Airport → Corbeanca drive
const ROUTE = [GEO.otp, [44.5725, 26.0790], [44.5760, 26.0748], [44.5830, 26.0660], [44.5915, 26.0560], [44.5975, 26.0490], GEO.corbeanca];
// A0 ring (drawn only along its southern, operational arc)
const A0C = [44.432, 26.100], A0R = [0.140, 0.205];
const a0pt = th => [A0C[0] + A0R[0] * Math.sin(th), A0C[1] + A0R[1] * Math.cos(th)];

const D2R = Math.PI / 180;
const mercY = lat => Math.log(Math.tan(Math.PI / 4 + lat * D2R / 2)) / D2R;

// pre-project world polygons
const WORLDP = (window.WORLD || []).map(c => ({
  name: c.name, ro: c.name === 'Romania', il: c.name === 'Israel',
  rings: c.rings.map(r => {
    const pts = r.map(([lon, lat]) => [lon, mercY(lat), lon, lat]);
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    return { pts, x0, x1, y0, y1 };
  }),
}));

// ---------------------------------------------------------------- map camera
// cam: {lon, lat, z (px per degree), rot (rad), ox, oy}
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
      // zoom-aware centre interpolation: move the centre in "screen units" of the
      // smaller zoom so large zoom changes don't swing the frame.
      const za = Math.log(a.z), zb = Math.log(b.z), z = Math.exp(lerp(za, zb, u));
      let w = u;
      if (Math.abs(zb - za) > 0.3) {
        const ra = 1 / a.z, rb = 1 / b.z, r = 1 / z;
        w = clamp((ra - r) / (ra - rb));
      }
      return { lon: lerp(a.lon, b.lon, w), lat: lerp(a.lat, b.lat, w), z, rot: lerp(a.rot || 0, b.rot || 0, u), ox: lerp(a.ox || 0, b.ox || 0, u), oy: lerp(a.oy || 0, b.oy || 0, u) };
    }
  }
  return { ...keys[keys.length - 1] };
}

// ---------------------------------------------------------------- drawing helpers
function setFont(size, weight = 400, fam = 'Heebo') { ctx.font = `${weight} ${size}px ${fam}`; }
function text(str, x, y, { size = 28, weight = 400, fam = 'Heebo', color = '#fff', alpha = 1, align = 'center', rtl = false, spacing = 0, base = 'middle', shadow = 0 } = {}) {
  if (alpha <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  setFont(size, weight, fam);
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = base;
  ctx.direction = rtl ? 'rtl' : 'ltr';
  if (spacing) ctx.letterSpacing = spacing + 'px';
  if (shadow) { ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = shadow; }
  ctx.fillText(str, x, y);
  ctx.restore();
}
function glowDot(x, y, r, color = '255,255,255', a = 1) {
  if (a <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
  g.addColorStop(0, `rgba(${color},${0.55 * a})`); g.addColorStop(1, `rgba(${color},0)`);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 4, 0, 7); ctx.fill();
  ctx.fillStyle = `rgba(${color},${a})`; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
}
function polyLen(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; }
// stroke a screen polyline up to fraction f; returns head point + angle
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
function pinMarker(x, y, s, a = 1, { fill = '#fff', dot = C.gold, pulse = 0 } = {}) {
  if (a <= 0 || s <= 0) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(s, s);
  if (pulse > 0) { ctx.strokeStyle = `rgba(214,182,121,${0.6 * (1 - pulse)})`; ctx.lineWidth = 2 / s; ctx.beginPath(); ctx.ellipse(0, 0, 16 + 50 * pulse, 6 + 18 * pulse, 0, 0, 7); ctx.stroke(); }
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(0, 0, 10, 3.5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = fill; ctx.beginPath();
  ctx.moveTo(0, 0); ctx.bezierCurveTo(-6, -12, -16, -20, -16, -32); ctx.arc(0, -32, 16, Math.PI, 0); ctx.bezierCurveTo(16, -20, 6, -12, 0, 0); ctx.fill();
  ctx.fillStyle = dot; ctx.beginPath(); ctx.arc(0, -32, 6.5, 0, 7); ctx.fill();
  ctx.restore();
}
function planeIcon(x, y, ang, s, color = '#fff') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s); ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(14, 0); ctx.quadraticCurveTo(14, -2, 10, -2); ctx.lineTo(3, -2); ctx.lineTo(-4, -12); ctx.lineTo(-7, -12); ctx.lineTo(-2, -2);
  ctx.lineTo(-9, -2); ctx.lineTo(-12, -6); ctx.lineTo(-14, -6); ctx.lineTo(-12, 0); ctx.lineTo(-14, 6); ctx.lineTo(-12, 6); ctx.lineTo(-9, 2);
  ctx.lineTo(-2, 2); ctx.lineTo(-7, 12); ctx.lineTo(-4, 12); ctx.lineTo(3, 2); ctx.lineTo(10, 2); ctx.quadraticCurveTo(14, 2, 14, 0); ctx.fill();
  ctx.restore();
}
function carIcon(x, y, ang, s) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; rr(-11, -6, 24, 14, 4); ctx.fill();
  ctx.fillStyle = '#fff'; rr(-12, -7, 24, 14, 4); ctx.fill();
  ctx.fillStyle = '#1b3768'; rr(-3, -5.5, 7, 11, 2); ctx.fill();
  ctx.fillStyle = C.gold; ctx.fillRect(10, -5, 2, 3); ctx.fillRect(10, 2, 2, 3);
  ctx.restore();
}
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
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

// ---------------------------------------------------------------- brand assets
const IMG = {};
function loadImg(k, src) { return new Promise(r => { const i = new Image(); i.onload = () => { IMG[k] = i; r(); }; i.onerror = () => r(); i.src = src; }); }
const BRAND = {};
for (const [k, d] of Object.entries(window.BRAND_PATHS || {})) BRAND[k] = new Path2D(d);
function drawLogoCorner(a) {
  const img = IMG.logo; if (!img || a <= 0) return;
  const w = W * 0.06, h = w * img.height / img.width;
  ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = 'screen';
  ctx.drawImage(img, W * 0.04, H * 0.04, w, h); ctx.restore();
}
// brand badge for supermarkets — official monochrome marks (Simple Icons) in brand colour
function brandBadge(kind, x, y, s, a) {
  if (a <= 0 || s <= 0) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.arc(0, 4, 34, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 34, 0, 7); ctx.fill();
  ctx.strokeStyle = C.gold; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 37.5, 0, 7); ctx.stroke();
  const p = BRAND[kind];
  if (p && kind !== 'mega') {
    ctx.save(); ctx.translate(-20, -20); ctx.scale(40 / 24, 40 / 24);
    ctx.fillStyle = kind === 'lidl' ? '#0050aa' : '#cd1414'; ctx.fill(p); ctx.restore();
  } else {
    ctx.fillStyle = '#0f2a52'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    setFont(15, 800); ctx.fillText(kind === 'mega' ? 'Mega' : kind, 0, -7); setFont(13, 700); ctx.fillText(kind === 'mega' ? 'Image' : '', 0, 9);
  }
  ctx.restore();
}

// ================================================================= GLOBE / MAP
function globeParams(t) {
  const u = eio(P(t, 0.0, 2.6));
  return { lon0: lerp(-12, 25.6, u), lat0: lerp(18, 45.6, u), R: Math.exp(lerp(Math.log(300), Math.log(4600), eio(P(t, 0.9, 2.65)))) };
}
const MORPH = [2.15, 2.65];
function camFromGlobe(g) { return { lon: g.lon0, lat: g.lat0, z: g.R * Math.cos(g.lat0 * D2R) * D2R, rot: 0 }; }
const CAM_A = (() => {
  const g = camFromGlobe(globeParams(MORPH[1]));
  return [
    { t: MORPH[1], ...g, rot: 0 },
    { t: 3.6, lon: 25.3, lat: 45.6, z: 150, rot: -0.10 },
    { t: 4.9, lon: 26.1025, lat: 44.4268, z: 1500, rot: 0 },
    { t: 5.5, lon: 26.1025, lat: 44.4268, z: 1600, rot: 0 },
    { t: 8.0, lon: 26.075, lat: 44.515, z: 2700, rot: 0 },
    { t: 10.25, lon: 26.068, lat: 44.523, z: 2900, rot: 0 },
    { t: 11.4, lon: 30.6, lat: 39.6, z: 36, rot: 0, ease: eio },
    { t: 15.6, lon: 30.4, lat: 39.4, z: 37.5, rot: 0, ease: t => t },
    { t: 17.9, lon: 26.074, lat: 44.580, z: 8200, rot: 0 },
    { t: 22.6, lon: 26.064, lat: 44.587, z: 8800, rot: 0, ease: t => t },
    { t: 24.3, lon: 26.090, lat: 44.488, z: 1300, rot: 0 },
    { t: 27.6, lon: 26.088, lat: 44.492, z: 1360, rot: 0, ease: t => t },
    { t: 30.0, lon: 26.0475, lat: 44.5985, z: 60000, rot: ROUTE_ROT(), ease: ei },
  ];
})();
// rotation that makes the last leg of the drive align with the isometric street (30° down-right)
function ROUTE_ROT() {
  const a = ROUTE[ROUTE.length - 2], b = ROUTE[ROUTE.length - 1];
  const dx = (b[1] - a[1]), dy = -(mercY(b[0]) - mercY(a[0]));
  return Math.PI / 6 - Math.atan2(dy, dx);
}

function orthoProj(g, lat, lon) {
  const p = lat * D2R, l = (lon - g.lon0) * D2R, p0 = g.lat0 * D2R;
  const cosc = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l);
  let x = g.R * Math.cos(p) * Math.sin(l), y = g.R * (Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l));
  if (cosc < 0) { const k = g.R / Math.hypot(x, y); x *= k; y *= k; }
  return [W / 2 + x, H / 2 - y, cosc];
}

// stylised local geography (deterministic)
const LOCAL = (() => {
  const r = rng(7), blocks = [], greens = [], houses = [];
  const [bl, bo] = GEO.bucharest;
  const GS = 0.0095;
  for (let gy = -12; gy <= 12; gy++) for (let gx = -16; gx <= 16; gx++) {
    const lat = bl + gy * GS * 0.72, lon = bo + gx * GS;
    const d = Math.hypot(gx / 14.5, gy / 11.5) * (0.9 + r() * 0.2);
    const dens = Math.exp(-d * d * 2.4);
    if (d > 1.05 || r() > dens * 1.25) continue;
    blocks.push({ lat, lon, w: GS * (0.55 + r() * 0.3), h: GS * 0.72 * (0.55 + r() * 0.3), ht: (3 + r() * 14) * dens + 1.5, d, k: r() });
  }
  // greens: Băneasa forest + fields + Corbeanca woods (stylised)
  const gsrc = [[44.518, 26.075, 0.010, 0.016], [44.533, 26.060, 0.008, 0.013], [44.612, 26.020, 0.012, 0.018], [44.625, 26.045, 0.010, 0.016], [44.585, 26.020, 0.009, 0.014], [44.545, 26.035, 0.010, 0.016], [44.640, 26.070, 0.010, 0.016], [44.560, 26.120, 0.010, 0.016]];
  for (const [la, lo, rl, ro] of gsrc) for (let i = 0; i < 14; i++) greens.push({ lat: la + (r() - .5) * rl * 2, lon: lo + (r() - .5) * ro * 2, s: 0.003 + r() * 0.005, k: r() });
  // low-rise settlements north of the city: Otopeni, Corbeanca, Balotești, Tunari
  const towns = [[44.552, 26.068, 0.010, 0.014, 60], [44.600, 26.045, 0.010, 0.016, 90], [44.618, 26.095, 0.007, 0.012, 40], [44.553, 26.135, 0.007, 0.011, 40]];
  for (const [la, lo, rl, ro, n] of towns) for (let i = 0; i < n; i++) houses.push({ lat: la + (r() - .5) * rl * 2, lon: lo + (r() - .5) * ro * 2, s: 0.0012 + r() * 0.0010, k: r() });
  return { blocks, greens, houses };
})();

function drawCountries(cam, a, opt = {}) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  const proj = opt.proj || ((lat, lon) => mproj(cam, lat, lon));
  const vis = opt.cull !== false;
  const xr = cam ? W / cam.z : 0;
  for (const c of WORLDP) {
    ctx.beginPath();
    let any = false;
    for (const r of c.rings) {
      if (vis && cam && (r.x1 < cam.lon - xr * 1.2 || r.x0 > cam.lon + xr * 1.2)) continue;
      any = true;
      for (let i = 0; i < r.pts.length; i++) { const q = proj(r.pts[i][3], r.pts[i][2]); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }
      ctx.closePath();
    }
    if (!any) continue;
    const hi = (c.ro ? opt.roHi : 0) || (c.il ? opt.ilHi : 0) || 0;
    ctx.fillStyle = hi ? `rgba(${lerp(16, 30, hi)},${lerp(41, 70, hi)},${lerp(79, 128, hi)},1)` : C.land;
    ctx.fill();
    ctx.strokeStyle = 'rgba(160,190,235,0.16)'; ctx.lineWidth = 0.8; ctx.stroke();
  }
  // Romania border highlight (drawn progressively)
  if (opt.roLine > 0) {
    const ro = WORLDP.find(c => c.ro);
    for (const r of ro.rings) {
      const pts = r.pts.map(p => proj(p[3], p[2]));
      pts.push(pts[0]);
      strokePartial(pts, opt.roLine, { strokeStyle: 'rgba(255,255,255,0.95)', lineWidth: 2, lineJoin: 'round', shadowColor: 'rgba(255,255,255,0.6)', shadowBlur: 8 });
    }
  }
  ctx.restore();
}

function drawLocal(cam, a, opt = {}) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  const t = opt.t || 0;
  // greens
  const ga = opt.greenA !== undefined ? opt.greenA : 1;
  if (ga > 0) {
    ctx.beginPath();
    for (const g of LOCAL.greens) {
      const [x, y] = mproj(cam, g.lat, g.lon); const r = g.s * cam.z * 0.75;
      if (x < -r || x > W + r || y < -r || y > H + r) continue;
      ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, 7);
    }
    ctx.fillStyle = `rgba(70,150,104,${0.30 * ga})`; ctx.fill();
  }
  // settlements (low houses)
  const hA = opt.housesA !== undefined ? opt.housesA : 1;
  if (hA > 0) for (const h of LOCAL.houses) {
    const [x, y] = mproj(cam, h.lat, h.lon); const s = h.s * cam.z;
    if (x < -20 || x > W + 20 || y < -20 || y > H + 20) continue;
    const g = opt.houseGrow ? opt.houseGrow(h) : 1; if (g <= 0) continue;
    ctx.fillStyle = `rgba(210,222,240,${0.55 * hA * g})`; ctx.fillRect(x - s / 2, y - s / 2 - 2 * g, s, s * 0.8);
    ctx.fillStyle = `rgba(110,140,185,${0.5 * hA * g})`; ctx.fillRect(x - s / 2, y + s * 0.3 - 2 * g, s, 2 * g);
  }
  // city blocks, 2.5D extrusion
  const bA = opt.blocksA !== undefined ? opt.blocksA : 1;
  if (bA > 0) {
    const ext = clamp(cam.z / 2600, 0.15, 1.6);
    const list = LOCAL.blocks;
    for (const b of list) {
      const [x, y] = mproj(cam, b.lat, b.lon);
      const w = b.w * cam.z * 0.95, h = b.h * cam.z * 0.95;
      if (x < -w || x > W + w || y < -h - 60 || y > H + h) continue;
      const g = opt.blockGrow ? opt.blockGrow(b) : 1; if (g <= 0) continue;
      const ht = b.ht * ext * g;
      ctx.fillStyle = `rgba(40,70,120,${0.85 * bA})`; ctx.fillRect(x - w / 2, y - h / 2 - ht + h, w, ht);           // facade
      const l = 150 + b.k * 60 * (1 - b.d);
      ctx.fillStyle = `rgba(${l * 0.82},${l * 0.9},${l * 1.05},${0.9 * bA})`; ctx.fillRect(x - w / 2, y - h / 2 - ht, w, h); // roof
    }
  }
  ctx.restore();
}

function mapLatLonPts(cam, arr) { return arr.map(([la, lo]) => mproj(cam, la, lo)); }

function sceneMapA(t) {
  // S1 globe → Romania → Bucharest; S2 north to Corbeanca; S3 flight; S4 OTP drive + roads
  let cam, g = null, m = 1;
  if (t < MORPH[1]) { g = globeParams(t); cam = camFromGlobe(g); m = ss(P(t, MORPH[0], MORPH[1])); }
  else cam = track(CAM_A, t);

  const appear = eo(P(t, 0.0, 1.0));
  // ---- globe disk
  if (g && m < 1) {
    ctx.save();
    ctx.globalAlpha = appear * (1 - m);
    const R = g.R;
    const grd = ctx.createRadialGradient(W / 2 - R * 0.3, H / 2 - R * 0.35, R * 0.1, W / 2, H / 2, R);
    grd.addColorStop(0, '#173f7c'); grd.addColorStop(1, '#0a2149');
    ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(W / 2, H / 2, R, 0, 7); ctx.fill();
    // atmosphere rim
    const rim = ctx.createRadialGradient(W / 2, H / 2, R * 0.96, W / 2, H / 2, R * 1.12);
    rim.addColorStop(0, 'rgba(120,170,255,0.35)'); rim.addColorStop(1, 'rgba(120,170,255,0)');
    ctx.fillStyle = rim; ctx.beginPath(); ctx.arc(W / 2, H / 2, R * 1.12, 0, 7); ctx.fill();
    // graticule
    ctx.strokeStyle = 'rgba(160,190,240,0.10)'; ctx.lineWidth = 1;
    for (let lo = -180; lo < 180; lo += 15) { ctx.beginPath(); let st = false; for (let la = -85; la <= 85; la += 5) { const q = orthoProj(g, la, lo); if (q[2] < 0) { st = false; continue; } st ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); st = true; } ctx.stroke(); }
    for (let la = -75; la <= 75; la += 15) { ctx.beginPath(); let st = false; for (let lo = -180; lo <= 180; lo += 5) { const q = orthoProj(g, la, lo); if (q[2] < 0) { st = false; continue; } st ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); st = true; } ctx.stroke(); }
    ctx.restore();
  }
  // ---- countries (blend ortho → mercator)
  const worldA = appear * (1 - ss(P(Math.log(cam.z), Math.log(900), Math.log(2600))));
  const roHi = ss(P(t, 2.2, 3.4)) * (1 - ss(P(t, 4.6, 5.4)));
  const roLine = eio(P(t, 2.3, 3.7));
  const s3 = win(t, 10.4, 11.4, 16.3, 17.2);
  if (g && m < 1) {
    ctx.save();
    ctx.beginPath(); ctx.arc(W / 2, H / 2, g.R * lerp(1, 6, m), 0, 7); ctx.clip();
    drawCountries(null, worldA, { proj: (la, lo) => { const o = orthoProj(g, la, lo); if (m <= 0) return o; const q = mproj(cam, la, lo); return [lerp(o[0], q[0], m), lerp(o[1], q[1], m)]; }, roHi, roLine });
    ctx.restore();
  } else {
    drawCountries(cam, worldA, { roHi: Math.max(roHi, s3 * 0.6), ilHi: s3, roLine: roLine * (1 - ss(P(t, 4.8, 5.6))) + s3 * 0 });
  }
  // ---- local stylised layer
  const localA = ss(P(Math.log(cam.z), Math.log(300), Math.log(900))) * (1 - ss(P(Math.log(cam.z), Math.log(14000), Math.log(30000))));
  drawLocal(cam, localA, {
    t,
    blockGrow: b => t > 9 ? 1 : eo(P(t, 3.7 + b.d * 1.6 + b.k * 0.5, 4.4 + b.d * 1.6 + b.k * 0.5)),
    houseGrow: h => t > 12 ? 1 : eo(P(t, 6.4 + h.k * 1.6, 7.2 + h.k * 1.6)),
    greenA: t < 12 ? ss(P(t, 6.0, 7.6)) : 1,
  });

  // ---- S1 Bucharest dot + label
  const bA = win(t, 4.25, 4.75, 9.6, 10.3);
  if (bA > 0) {
    const [x, y] = mproj(cam, ...GEO.bucharest);
    const s = eob(P(t, 4.25, 4.8));
    glowDot(x, y, 7 * s, '255,255,255', bA);
    text('BUCHAREST', x, y + 40, { size: 26, weight: 500, spacing: 6, alpha: bA * ss(P(t, 4.4, 4.9)) });
  }
  // ---- S2 connector + Corbeanca marker
  const s2a = win(t, 7.4, 7.8, 10.3, 10.9);
  if (s2a > 0) {
    const a = mproj(cam, ...GEO.bucharest), b = mproj(cam, ...GEO.corbeanca);
    ctx.save(); ctx.globalAlpha = s2a; ctx.setLineDash([6, 8]);
    strokePartial([a, b], eio(P(t, 7.6, 9.4)), { strokeStyle: 'rgba(255,255,255,0.85)', lineWidth: 2 });
    ctx.restore();
    const ms = eob(P(t, 9.25, 9.85));
    pinMarker(b[0], b[1], 1.5 * ms, s2a, { pulse: P(t, 9.8, 10.8) });
    text('CORBEANCA', b[0], b[1] + 34, { size: 30, weight: 600, spacing: 7, alpha: s2a * ss(P(t, 9.55, 10.0)) });
  }
  // ---- S3 Israel → Romania flight
  if (s3 > 0) {
    const ta = mproj(cam, ...GEO.telaviv), bu = mproj(cam, ...GEO.bucharest);
    const dimNum = ss(P(t, 13.4, 14.2));
    ctx.save(); ctx.globalAlpha = s3;
    glowDot(ta[0], ta[1], 6 * eob(P(t, 10.9, 11.4)), '255,255,255', 1);
    glowDot(bu[0], bu[1], 6, '214,182,121', 1);
    text('TEL AVIV', ta[0] + 18, ta[1] + 26, { size: 18, weight: 500, spacing: 4, align: 'left', alpha: ss(P(t, 11.1, 11.6)) * (1 - 0.5 * dimNum) });
    text('BUCHAREST', bu[0] + 18, bu[1] - 22, { size: 18, weight: 500, spacing: 4, align: 'left', alpha: ss(P(t, 11.1, 11.6)) * (1 - 0.5 * dimNum) });
    // arc
    const N = 60, arc = [];
    const mx = (ta[0] + bu[0]) / 2, my = (ta[1] + bu[1]) / 2, dx = bu[0] - ta[0], dy = bu[1] - ta[1];
    const cx = mx + dy * 0.28, cy = my - dx * 0.28;
    for (let i = 0; i <= N; i++) { const u = i / N; arc.push([(1 - u) * (1 - u) * ta[0] + 2 * u * (1 - u) * cx + u * u * bu[0], (1 - u) * (1 - u) * ta[1] + 2 * u * (1 - u) * cy + u * u * bu[1]]); }
    const fp = eio(P(t, 11.8, 13.5));
    ctx.globalAlpha = s3 * (1 - 0.55 * dimNum);
    strokePartial(arc, fp, { strokeStyle: 'rgba(214,182,121,0.95)', lineWidth: 2.5, lineCap: 'round', shadowColor: 'rgba(214,182,121,0.8)', shadowBlur: 10 });
    if (fp > 0 && fp < 1) { const h = strokePartial(arc, fp, { strokeStyle: 'rgba(0,0,0,0)' }); planeIcon(h[0], h[1], h[2], 1.25); }
    ctx.restore();
    // number
    const na = s3 * dimNum * (1 - ss(P(t, 15.9, 16.6)));
    if (na > 0) {
      ctx.save(); ctx.globalAlpha = na * 0.55; ctx.fillStyle = rgb(C.deep); ctx.fillRect(0, 0, W, H); ctx.restore();
      const mins = Math.round(150 * eo(P(t, 13.4, 14.5)));
      const str = `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}`;
      const sc = lerp(0.92, 1, eo(P(t, 13.4, 14.2)));
      ctx.save(); ctx.translate(W / 2, H / 2 - 30); ctx.scale(sc, sc);
      text(str, 0, 0, { size: 230, weight: 300, alpha: na, spacing: 4 });
      ctx.restore();
      text('שעות טיסה', W / 2, H / 2 + 115, { size: 40, weight: 300, rtl: true, alpha: na * ss(P(t, 13.9, 14.5)), spacing: 2 });
    }
  }
  // ---- S4: Bucharest dot migrates to OTP and becomes the airport marker
  const s4 = win(t, 16.2, 17.0, 29.5, 30.0);
  if (s4 > 0) {
    const zt = ss(P(Math.log(cam.z), Math.log(60), Math.log(3000)));
    const bu = mproj(cam, ...GEO.bucharest), ot = mproj(cam, ...GEO.otp);
    const x = lerp(bu[0], ot[0], zt), y = lerp(bu[1], ot[1], zt);
    const morph = eo(P(t, 17.0, 17.9));
    ctx.save(); ctx.globalAlpha = s4;
    // drive route
    const rp = mapLatLonPts(cam, ROUTE);
    const fr = eio(P(t, 18.9, 22.5));
    strokePartial(rp, 1, { strokeStyle: `rgba(255,255,255,${0.12 * ss(P(t, 18.6, 19.2))})`, lineWidth: 10, lineCap: 'round', lineJoin: 'round' });
    const head = strokePartial(rp, fr, { strokeStyle: C.gold, lineWidth: 5, lineCap: 'round', lineJoin: 'round', shadowColor: 'rgba(214,182,121,0.7)', shadowBlur: 12 });
    // roads (DN1, A0)
    const dn = mapLatLonPts(cam, DN1);
    const dnA = ss(P(t, 24.5, 25.0)) * (1 - ss(P(t, 28.0, 28.8)));
    strokePartial(dn, eio(P(t, 24.4, 26.0)), { strokeStyle: `rgba(255,255,255,${0.95 * dnA})`, lineWidth: 4, lineCap: 'round', lineJoin: 'round', shadowColor: 'rgba(255,255,255,0.5)', shadowBlur: 8 });
    const a0 = []; for (let i = 0; i <= 80; i++) a0.push(mproj(cam, ...a0pt(Math.PI * 0.98 + Math.PI * 1.04 * i / 80)));
    const a0A = ss(P(t, 25.3, 25.8)) * (1 - ss(P(t, 28.0, 28.8)));
    strokePartial(a0, eio(P(t, 25.3, 27.4)), { strokeStyle: `rgba(120,170,255,${0.95 * a0A})`, lineWidth: 4, lineCap: 'round', lineJoin: 'round', shadowColor: 'rgba(120,170,255,0.6)', shadowBlur: 8 });
    // road labels
    const dnL = mproj(cam, 44.515, 26.079), a0L = mproj(cam, ...a0pt(Math.PI * 1.5));
    roadTag('DN1', dnL[0] + 50, dnL[1], '#fff', ss(P(t, 24.9, 25.4)) * (1 - ss(P(t, 27.8, 28.4))));
    roadTag('A0', a0L[0], a0L[1] - 36, '#78aaff', ss(P(t, 25.7, 26.2)) * (1 - ss(P(t, 27.8, 28.4))));
    // corbeanca marker at destination
    const cb = mproj(cam, ...GEO.corbeanca);
    const cbA = ss(P(t, 18.4, 19.0));
    pinMarker(cb[0], cb[1], 1.3 * eob(P(t, 18.4, 19.0)) * (1 + 0.15 * Math.sin(P(t, 22.3, 23.0) * Math.PI)), cbA * (1 - ss(P(t, 27.6, 28.3))), { pulse: P(t, 22.4, 23.4) });
    text('CORBEANCA', cb[0], cb[1] + 32, { size: 24, weight: 600, spacing: 5, alpha: cbA * (1 - ss(P(t, 27.6, 28.3))) });
    // car
    if (head && fr > 0.005 && fr < 0.999) carIcon(head[0], head[1], head[2], 1.35);
    // distance tag
    const mid = rp[3];
    const kA = win(t, 19.8, 20.4, 23.6, 24.3);
    if (kA > 0) {
      ctx.save(); ctx.globalAlpha *= kA; ctx.fillStyle = 'rgba(6,20,44,0.85)'; rr(mid[0] + 26, mid[1] - 58, 150, 52, 26); ctx.fill();
      ctx.strokeStyle = 'rgba(214,182,121,0.9)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
      text('כ-6 ק״מ', mid[0] + 101, mid[1] - 31, { size: 30, weight: 500, rtl: true, alpha: kA });
    }
    // airport marker
    const oA = 1 - ss(P(t, 27.6, 28.4));
    const ds = lerp(6, 0, morph);
    if (ds > 0.2) glowDot(x, y, ds, '214,182,121', 1);
    if (morph > 0) {
      const sc = eob(morph) * oA;
      ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(0, 3, 30, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 30, 0, 7); ctx.fill();
      ctx.strokeStyle = C.gold; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 34, 0, 7); ctx.stroke();
      planeIcon(0, 0, -Math.PI / 4, 1.25, '#0f2a52');
      ctx.restore();
      text('OTP', x, y + 58, { size: 26, weight: 700, spacing: 6, alpha: morph * oA });
    }
    ctx.restore();
  }
}
function roadTag(str, x, y, col, a) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = 'rgba(6,20,44,0.9)'; rr(x - 38, y - 20, 76, 40, 8); ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
  text(str, x, y + 1, { size: 22, weight: 700, color: col, alpha: a, spacing: 2 });
}

// ================================================================= ISOMETRIC ENGINE
const COS30 = Math.cos(Math.PI / 6), SIN30 = 0.5;
function iso(cam, x, y, z = 0) {
  const dx = x - cam.x, dy = y - cam.y;
  return [W / 2 + (cam.ox || 0) + (dx - dy) * COS30 * cam.s, H / 2 + (cam.oy || 0) + ((dx + dy) * SIN30 - z) * cam.s];
}
function isoPoly(cam, pts, fill, stroke, lw = 1) {
  ctx.beginPath();
  pts.forEach((p, i) => { const q = iso(cam, p[0], p[1], p[2] || 0); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}
function shade(c, k) { return `rgb(${clamp(c[0] * k, 0, 255) | 0},${clamp(c[1] * k, 0, 255) | 0},${clamp(c[2] * k, 0, 255) | 0})`; }
// box with optional windows. o: {col, lit, win, outline, glass}
function isoBox(cam, x, y, z0, w, d, h, o = {}) {
  if (h <= 0.001) {
    isoPoly(cam, [[x, y, z0], [x + w, y, z0], [x + w, y + d, z0], [x, y + d, z0]], null, o.outline || 'rgba(255,255,255,0.7)', 1.5);
    return;
  }
  const col = o.col || [236, 241, 247], z1 = z0 + h;
  const L = o.light || 1;
  isoPoly(cam, [[x, y + d, z0], [x + w, y + d, z0], [x + w, y + d, z1], [x, y + d, z1]], shade(col, 0.80 * L));
  isoPoly(cam, [[x + w, y, z0], [x + w, y + d, z0], [x + w, y + d, z1], [x + w, y, z1]], shade(col, 0.66 * L));
  isoPoly(cam, [[x, y, z1], [x + w, y, z1], [x + w, y + d, z1], [x, y + d, z1]], shade(col, 1.0 * L), o.edge || null, 1);
  if (o.win && h > 0.35) {
    const lit = o.lit || 0;
    const glass = o.glass || [28, 47, 80];
    const wc = mix(glass, [255, 200, 120], lit);
    const gl = `rgb(${wc[0] | 0},${wc[1] | 0},${wc[2] | 0})`;
    // windows on the +y face (left-front) and +x face (right-front)
    const rows = Math.max(1, Math.floor(h / 0.9));
    for (let r = 0; r < rows; r++) {
      const zb = z0 + (r + 0.28) * h / rows, zt = z0 + (r + 0.78) * h / rows;
      if (o.win === 'band') {
        isoPoly(cam, [[x + w * 0.12, y + d, zb], [x + w * 0.88, y + d, zb], [x + w * 0.88, y + d, zt], [x + w * 0.12, y + d, zt]], gl);
        isoPoly(cam, [[x + w, y + d * 0.2, zb], [x + w, y + d * 0.55, zb], [x + w, y + d * 0.55, zt], [x + w, y + d * 0.2, zt]], gl);
      } else {
        const nw = Math.max(1, Math.round(w / 0.8)), nd = Math.max(1, Math.round(d / 0.8));
        for (let i = 0; i < nw; i++) { const a = x + (i + 0.25) * w / nw, b = x + (i + 0.75) * w / nw; isoPoly(cam, [[a, y + d, zb], [b, y + d, zb], [b, y + d, zt], [a, y + d, zt]], gl); }
        for (let i = 0; i < nd; i++) { const a = y + (i + 0.25) * d / nd, b = y + (i + 0.75) * d / nd; isoPoly(cam, [[x + w, a, zb], [x + w, b, zb], [x + w, b, zt], [x + w, a, zt]], gl); }
      }
    }
    if (lit > 0.05 && o.glow !== false) {
      const c = iso(cam, x + w, y + d, z0 + h * 0.5);
      const g = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], cam.s * 2.2);
      g.addColorStop(0, `rgba(255,190,110,${0.22 * lit})`); g.addColorStop(1, 'rgba(255,190,110,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c[0], c[1], cam.s * 2.2, 0, 7); ctx.fill();
    }
  }
}
function isoTree(cam, x, y, sz, grow, palette = 0) {
  if (grow <= 0) return;
  const g = eob(clamp(grow));
  const b = iso(cam, x, y, 0), top = iso(cam, x, y, 0.55 * sz * g);
  ctx.strokeStyle = '#5a4634'; ctx.lineWidth = Math.max(1, 0.08 * cam.s); ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(top[0], top[1]); ctx.stroke();
  const c = iso(cam, x, y, (0.55 + 0.45) * sz * g), r = 0.45 * sz * g * cam.s;
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(b[0] + r * 0.2, b[1], r * 0.9, r * 0.45, 0, 0, 7); ctx.fill();
  const cols = palette ? ['#3f8a60', '#5fae80', '#8fd3a6'] : ['#2f7a55', '#4f9e72', '#7cc79a'];
  ctx.fillStyle = cols[0]; ctx.beginPath(); ctx.arc(c[0], c[1], r, 0, 7); ctx.fill();
  ctx.fillStyle = cols[1]; ctx.beginPath(); ctx.arc(c[0] - r * 0.18, c[1] - r * 0.18, r * 0.78, 0, 7); ctx.fill();
  ctx.fillStyle = cols[2]; ctx.beginPath(); ctx.arc(c[0] - r * 0.35, c[1] - r * 0.38, r * 0.32, 0, 7); ctx.fill();
}
function isoPerson(cam, x, y, col = '#fff') {
  const f = iso(cam, x, y, 0), h = iso(cam, x, y, 0.5);
  ctx.strokeStyle = col; ctx.lineWidth = Math.max(1.2, cam.s * 0.07); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(f[0], f[1]); ctx.lineTo(h[0], h[1] + cam.s * 0.08); ctx.stroke();
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(h[0], h[1], Math.max(1.5, cam.s * 0.07), 0, 7); ctx.fill();
}
function isoTrack(keys, t) {
  if (t <= keys[0].t) return { ...keys[0] };
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t < b.t) { const u = (b.ease || eio)(P(t, a.t, b.t)); return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), s: Math.exp(lerp(Math.log(a.s), Math.log(b.s), u)), ox: lerp(a.ox || 0, b.ox || 0, u), oy: lerp(a.oy || 0, b.oy || 0, u) }; }
  }
  return { ...keys[keys.length - 1] };
}

// ---------------------------------------------------------------- neighbourhood model
function makeHood(seed, opt = {}) {
  const r = rng(seed), lots = [], trees = [], streets = [];
  const X0 = opt.x0 ?? -26, X1 = opt.x1 ?? 26, LW = 5.2;
  streets.push({ x: X0 - 2, y: -1, w: X1 - X0 + 4, d: 2, main: true });
  streets.push({ x: X0 - 2, y: 12.4, w: X1 - X0 + 4, d: 1.4 });
  streets.push({ x: X0 - 2, y: -13.8, w: X1 - X0 + 4, d: 1.4 });
  for (const sx of [-15.7, 0.0, 15.7]) streets.push({ x: sx - 0.7, y: -13.8, w: 1.4, d: 27.6 });
  for (const side of [1, -1]) for (const row of [0, 1]) {
    for (let x = X0; x + LW <= X1 + 0.1; x += LW + 0.2) {
      if ([-15.7, 0, 15.7].some(sx => x < sx + 0.8 && x + LW > sx - 0.8)) continue;
      const y = side > 0 ? 1.4 + row * 5.6 : -1.4 - LW - row * 5.6;
      const park = r() < (opt.parkRate ?? 0.12);
      const cx = x + LW / 2, cy = y + LW / 2;
      const lot = { x, y, w: LW, d: LW, park, dist: Math.hypot(cx, cy * 1.1), k: r(), side };
      if (!park) {
        const hw = 2.2 + r() * 0.9, hd = 2.0 + r() * 0.8;
        lot.house = { x: x + 0.6 + r() * (LW - hw - 1.2), y: y + 0.6 + r() * (LW - hd - 1.2), w: hw, d: hd, h: 1.0 + r() * 0.25, up: r() < 0.65, pool: (opt.pools ?? 0.25) > r() };
        lot.house.uw = hw * (0.55 + r() * 0.3); lot.house.ud = hd * (0.6 + r() * 0.35); lot.house.ux = r() * (hw - lot.house.uw); lot.house.uy = r() * (hd - lot.house.ud);
      }
      lots.push(lot);
      const nt = park ? 6 : 1 + (r() * 2 | 0);
      for (let i = 0; i < nt; i++) {
        let tx = x + 0.5 + r() * (LW - 1), ty = y + 0.5 + r() * (LW - 1);
        if (lot.house) { const hs = lot.house; if (tx > hs.x - 0.5 && tx < hs.x + hs.w + 0.5 && ty > hs.y - 0.5 && ty < hs.y + hs.d + 0.5) { tx = x + 0.45; ty = y + LW - 0.45; } }
        trees.push({ x: tx, y: ty, sz: 0.8 + r() * 0.6, dist: lot.dist + r() * 2, k: r() });
      }
    }
  }
  // street trees
  for (let x = X0; x < X1; x += 2.6) for (const y of [-1.2, 1.2]) trees.push({ x: x + r() * 0.4, y, sz: 0.65, dist: Math.abs(x) + 0.5, k: r(), street: true });
  return { lots, trees, streets };
}
const HOOD = makeHood(11);
const LUX = makeHood(23, { parkRate: 0.08, pools: 0.55 });
// dense city block for the comparison (S6)
const CITY = (() => {
  const r = rng(5), b = [];
  for (let gx = -70; gx < -42; gx += 3.4) for (let gy = -14; gy < 14; gy += 3.4) {
    if (r() < 0.06) continue;
    b.push({ x: gx, y: gy, w: 2.6 + r() * 0.4, d: 2.6 + r() * 0.4, h: 2.5 + r() * 7 + (gx > -50 ? -1.5 : 0), k: r() });
  }
  return b;
})();
// the hero villa (S14–S16), sits on the central lot of the luxury neighbourhood
const HERO = { x: 1.0, y: 1.4, w: 5.2, d: 5.2 };

function drawHood(cam, M, t, o) {
  // o: {lotGrow(lot), treeGrow(tree), groundCol, lawnCol, streetCol, lit, people, cityA, hero}
  const items = [];
  // streets (ground)
  for (const s of M.streets) {
    isoPoly(cam, [[s.x, s.y], [s.x + s.w, s.y], [s.x + s.w, s.y + s.d], [s.x, s.y + s.d]], o.streetCol);
  }
  // main street centre dashes
  ctx.save(); ctx.setLineDash([cam.s * 0.6, cam.s * 0.6]); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = Math.max(1, cam.s * 0.05);
  const a = iso(cam, -30, 0), b = iso(cam, 30, 0); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.restore();
  // lots (lawns)
  for (const l of M.lots) {
    if (o.skipLot && o.skipLot(l)) continue;
    const g = o.lotGrow(l); if (g <= 0) continue;
    const inset = (1 - eo(g)) * 2.4;
    isoPoly(cam, [[l.x + inset, l.y + inset], [l.x + l.w - inset, l.y + inset], [l.x + l.w - inset, l.y + l.d - inset], [l.x + inset, l.y + l.d - inset]], l.park ? o.parkCol : o.lawnCol, 'rgba(255,255,255,0.10)', 1);
    if (l.house) {
      const hs = l.house;
      if (hs.pool && g > 0.5) { const pa = P(g, 0.5, 1); isoPoly(cam, [[hs.x + hs.w + 0.25, hs.y + 0.2], [hs.x + hs.w + 0.25 + 1.0 * pa, hs.y + 0.2], [hs.x + hs.w + 0.25 + 1.0 * pa, hs.y + 1.9], [hs.x + hs.w + 0.25, hs.y + 1.9]], '#6fc3e0', 'rgba(255,255,255,0.6)', 1); }
      items.push({ k: hs.x + hs.y + hs.w + hs.d, draw: () => drawHouse(cam, hs, g, o) });
    }
  }
  for (const tr of M.trees) {
    if (o.skipTree && o.skipTree(tr)) continue;
    const g = o.treeGrow(tr); if (g <= 0) continue;
    items.push({ k: tr.x + tr.y + 0.5, draw: () => isoTree(cam, tr.x, tr.y, tr.sz, g, o.treePal || 0) });
  }
  if (o.extra) o.extra(items);
  items.sort((p, q) => p.k - q.k);
  for (const it of items) it.draw();
}
function drawHouse(cam, hs, g, o) {
  const e = eo(clamp(g));
  const col = o.houseCol || [238, 242, 248];
  const lit = o.lit ? o.lit(hs) : 0;
  // footprint outline first ("shape transformation"): flat outline → extruded volume
  if (e < 0.08) { isoBox(cam, hs.x, hs.y, 0, hs.w, hs.d, 0, { outline: 'rgba(255,255,255,0.8)' }); return; }
  isoBox(cam, hs.x, hs.y, 0, hs.w, hs.d, hs.h * e, { col, win: 'band', lit, edge: 'rgba(255,255,255,0.25)' });
  if (hs.up) {
    const e2 = eo(P(g, 0.45, 1));
    if (e2 > 0) isoBox(cam, hs.x + hs.ux, hs.y + hs.uy, hs.h * e, hs.uw, hs.ud, 0.85 * e2, { col: o.houseCol2 || [214, 222, 233], win: 'band', lit, edge: 'rgba(255,255,255,0.25)' });
  }
}
function drawCity(cam, t, a, grow) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  isoPoly(cam, [[-72, -16], [-41, -16], [-41, 16], [-72, 16]], '#14294a');
  const sorted = CITY.slice().sort((p, q) => (p.x + p.y) - (q.x + q.y));
  for (const b of sorted) {
    const g = eo(P(grow, b.k * 0.5, b.k * 0.5 + 0.5));
    isoBox(cam, b.x, b.y, 0, b.w, b.d, b.h * g, { col: [150, 168, 196], win: 'grid', glass: [40, 60, 98] });
  }
  ctx.restore();
}

// ================================================================= S5–S6 neighbourhood
const CAM_B = [
  { t: 29.2, x: 0, y: 0, s: 2600 },
  { t: 30.6, x: 0, y: 0, s: 115, ease: eo5 },
  { t: 34.0, x: 0.6, y: 0.2, s: 92, ease: t => t },
  { t: 35.5, x: 1.0, y: 1.0, s: 80 },
  { t: 39.6, x: 0, y: 0, s: 30 },
  { t: 41.4, x: -54, y: 0, s: 26 },
  { t: 42.4, x: -52, y: 0, s: 25, ease: t => t },
  { t: 43.9, x: 0, y: 0.5, s: 34 },
  { t: 45.2, x: 0, y: 0.5, s: 7, ease: ei },
];
function sceneHood(t) {
  const a = ss(P(t, 29.3, 29.9)) * (1 - ss(P(t, 44.4, 45.1)));
  if (a <= 0) return;
  const cam = isoTrack(CAM_B, t);
  ctx.save(); ctx.globalAlpha = a;
  const env = ss(P(t, 30.0, 32.5)); // map → colourful environment
  // street: grows from a thin line (the drive route) to a full street
  const sw = lerp(0.04, 1, eo5(P(t, 29.7, 30.9)));
  const ground = mix(C.deep, [21, 46, 84], env);
  ctx.fillStyle = rgb(ground, 1); ctx.fillRect(0, 0, W, H);
  const lawn = mix([20, 52, 70], [86, 160, 112], env), park = mix([20, 52, 70], [70, 145, 98], env);
  const streetCol = `rgba(12,26,52,1)`;
  if (sw < 1) {
    // the route line widening into the main street
    isoPoly(cam, [[-60, -sw], [60, -sw], [60, sw], [-60, sw]], rgb(mix(hex(C.gold), [12, 26, 52], ss(P(sw, 0.05, 0.4)))));
  }
  drawCity(cam, t, ss(P(t, 39.6, 40.4)), eo(P(t, 40.0, 41.6)));
  drawHood(cam, HOOD, t, {
    lotGrow: l => {
      if (t < 34) { // S5: the closest lots on both sides of the street
        if (l.dist > 8.5) return 0;
        return P(t, 30.3 + l.dist * 0.12, 31.6 + l.dist * 0.12);
      }
      return Math.max(l.dist <= 8.5 ? 1 : 0, P(t, 34.4 + l.dist * 0.17, 35.4 + l.dist * 0.17));
    },
    treeGrow: tr => t < 34 ? (tr.dist > 9 ? 0 : P(t, 31.2 + tr.k * 1.5, 32.2 + tr.k * 1.5)) : Math.max(tr.dist <= 9 ? 1 : 0, P(t, 34.8 + tr.dist * 0.16 + tr.k * 0.4, 35.8 + tr.dist * 0.16 + tr.k * 0.4)),
    streetCol: sw >= 1 ? streetCol : 'rgba(0,0,0,0)',
    lawnCol: rgb(lawn), parkCol: rgb(park),
    extra: items => {
      // people walking (small, simple)
      const pa = ss(P(t, 36.0, 37.0));
      if (pa <= 0) return;
      const walkers = [[-12, 1.2, 0.35], [-11.6, 1.25, 0.35], [-11.9, 1.0, 0.35], [6, -1.25, -0.5], [20, 1.25, -0.4], [-20, -1.2, 0.45]];
      for (const [x0, y, v] of walkers) {
        const x = x0 + v * (t - 36);
        items.push({ k: x + y + 0.3, draw: () => { ctx.save(); ctx.globalAlpha *= pa; isoPerson(cam, x, y); ctx.restore(); } });
      }
    },
  });
  ctx.restore();
}

// ================================================================= S7–S9 retail map → data
const CAM_C = [
  { t: 44.4, lon: 26.050, lat: 44.598, z: 26000 },
  { t: 45.8, lon: 26.052, lat: 44.598, z: 17000, ease: eo },
  { t: 48.3, lon: 26.054, lat: 44.598, z: 16000, ease: t => t },
  { t: 50.0, lon: 26.060, lat: 44.601, z: 12500 },
  { t: 53.3, lon: 26.061, lat: 44.601, z: 12000, ease: t => t },
  { t: 54.3, lon: 26.084, lat: 44.6125, z: 26000 },
  { t: 57.2, lon: 26.084, lat: 44.6125, z: 27500, ease: t => t },
  { t: 58.2, lon: 26.060, lat: 44.598, z: 9000 },
  { t: 60.6, lon: 26.060, lat: 44.598, z: 8600, ease: t => t },
];
const STORES = [['lidl', GEO.lidl, 51.45], ['mega', GEO.mega, 52.15], ['penny', GEO.penny, 52.85]];
function sceneRetail(t) {
  const a = ss(P(t, 44.5, 45.2)) * (1 - ss(P(t, 60.2, 60.9)));
  if (a <= 0) return;
  const cam = track(CAM_C, t);
  const dark = ss(P(t, 58.1, 59.4));         // S9 darken + line mode
  const graph = eio(P(t, 58.6, 60.4));       // roads → graph lines
  ctx.save(); ctx.globalAlpha = a;
  // ground: deep blue map
  drawLocal(cam, 1 - dark, { blocksA: 1, housesA: 0.35 });
  // roads drawn as morphing polylines
  const roads = [DN1, ROUTE, [[44.585, 26.000], [44.592, 26.020], [44.598, 26.040], [44.604, 26.060], [44.610, 26.085]], [[44.575, 26.030], [44.589, 26.045], [44.603, 26.050], [44.620, 26.055]]];
  roads.forEach((rd, i) => {
    const pts = mapLatLonPts(cam, rd).map((q, j, arr) => {
      const gy = 300 + i * 150, gx = lerp(-200, W + 200, j / (arr.length - 1));
      return [lerp(q[0], gx, graph), lerp(q[1], gy, graph)];
    });
    strokePartial(pts, 1, { strokeStyle: `rgba(255,255,255,${lerp(i === 0 ? 0.55 : 0.28, 0.35, dark)})`, lineWidth: lerp(i === 0 ? 4 : 2.5, 1.2, dark), lineCap: 'round', lineJoin: 'round' });
  });
  const ui = 1 - dark;
  // project marker (S7)
  const pm = mproj(cam, ...GEO.corbeanca);
  const mA = ss(P(t, 45.0, 45.6)) * ui * (1 - ss(P(t, 53.4, 54.0)) * 0.6);
  // shopping circles → logos
  STORES.forEach(([k, ll, tl], i) => {
    const sp = mproj(cam, ...ll);
    const ca = ss(P(t, 46.0 + i * 0.3, 46.5 + i * 0.3)) * ui;
    if (ca <= 0) return;
    const lp = eio(P(t, 46.4 + i * 0.3, 47.4 + i * 0.3));
    ctx.save(); ctx.globalAlpha *= ca * (1 - ss(P(t, 53.4, 54.0)) * 0.7);
    strokePartial([pm.map((v, j) => v - (j ? 30 : 0)), sp], lp, { strokeStyle: 'rgba(214,182,121,0.8)', lineWidth: 2 });
    ctx.restore();
    const lg = eob(P(t, tl - 0.25, tl + 0.3));
    if (lg <= 0.01) { ctx.save(); ctx.globalAlpha *= ca; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(sp[0], sp[1], 12 * eob(P(t, 46.0 + i * 0.3, 46.6 + i * 0.3)), 0, 7); ctx.fill(); ctx.restore(); }
    else brandBadge(k, sp[0], sp[1], lerp(0.6, 1.8, lg) * (1 - 0.25 * ss(P(t, 53.4, 54.0))), ca * (1 - ss(P(t, 53.4, 54.0)) * 0.7));
  });
  pinMarker(pm[0], pm[1], 1.4 * eob(P(t, 45.0, 45.6)), mA, { pulse: (t * 0.6) % 1 });
  // value centre marker → iso mall
  const vc = mproj(cam, ...GEO.valueCentre);
  const vA = ss(P(t, 52.9, 53.5)) * ui;
  const ex = eio(P(t, 54.0, 54.9)) * (1 - eio(P(t, 57.1, 58.0)));
  if (vA > 0 && ex < 0.98) {
    ctx.save(); ctx.globalAlpha *= vA * (1 - ex);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(vc[0], vc[1], 14, 0, 7); ctx.fill();
    ctx.strokeStyle = C.gold; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(vc[0], vc[1], 20 + 10 * Math.sin(t * 4) ** 2, 0, 7); ctx.stroke();
    ctx.restore();
  }
  if (ex > 0.001) drawMall(t, vc, ex, ui);
  ctx.restore();
}
function drawMall(t, at, ex, a) {
  const s = 46 * ex;
  const cam = { x: 8.2 + 0.25 * (t - 54), y: 2.6, s, ox: (at[0] - W / 2) * (1 - ex), oy: (at[1] - H / 2) * (1 - ex) + 40 * ex };
  ctx.save(); ctx.globalAlpha *= a * clamp(ex * 1.6);
  const bd = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W * 0.6); bd.addColorStop(0, 'rgba(6,20,44,0.92)'); bd.addColorStop(1, 'rgba(6,20,44,0.75)');
  ctx.fillStyle = bd; ctx.fillRect(0, 0, W, H);
  // plaza + parking
  isoPoly(cam, [[-2, -2], [16, -2], [16, 9], [-2, 9]], 'rgba(18,40,74,1)', 'rgba(255,255,255,0.15)', 1);
  for (let i = 0; i < 10; i++) { const p0 = iso(cam, 1 + i * 1.3, 4.6), p1 = iso(cam, 1 + i * 1.3, 6.4); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke(); }
  const shops = [];
  // L-shaped open retail park
  for (let i = 0; i < 6; i++) shops.push({ x: 1 + i * 2.1, y: -1.2, w: 2.0, d: 3.2, h: 1.6 + (i % 3 === 0 ? 0.5 : 0), tint: [[255, 214, 160], [170, 210, 255], [255, 255, 255], [200, 235, 210], [255, 200, 200], [230, 220, 255]][i] });
  for (let i = 0; i < 3; i++) shops.push({ x: 13.8, y: 2.2 + i * 2.1, w: 3.2, d: 2.0, h: 1.8, tint: [[255, 255, 255], [255, 214, 160], [170, 210, 255]][i] });
  shops.sort((p, q) => (p.x + p.y) - (q.x + q.y));
  shops.forEach((sh, i) => {
    const g = eo(P(t, 54.4 + i * 0.12, 55.0 + i * 0.12)) * (1 - eio(P(t, 57.1, 57.9)));
    isoBox(cam, sh.x, sh.y, 0, sh.w, sh.d, sh.h * g, { col: [226, 232, 241] });
    if (g > 0.6) {
      const f = P(t, 55.0 + i * 0.12, 55.6 + i * 0.12);
      const tc = mix([40, 60, 98], sh.tint, 0.55 * f);
      const z1 = sh.h * g * 0.62;
      if (sh.y < 0) isoPoly(cam, [[sh.x + 0.25, sh.y + sh.d, 0.15], [sh.x + sh.w - 0.25, sh.y + sh.d, 0.15], [sh.x + sh.w - 0.25, sh.y + sh.d, z1], [sh.x + 0.25, sh.y + sh.d, z1]], rgb(tc));
      else isoPoly(cam, [[sh.x, sh.y + 0.25, 0.15], [sh.x, sh.y + sh.d - 0.25, 0.15], [sh.x, sh.y + sh.d - 0.25, z1], [sh.x, sh.y + 0.25, z1]], rgb(tc));
    }
  });
  for (const [x, y] of [[2, 3.6], [5, 3.6], [8, 3.6], [11, 3.6], [12.6, 7.6], [0, 7.6]]) isoTree(cam, x, y, 0.8, P(t, 54.8, 55.6) * (1 - P(t, 57.1, 57.6)));
  ctx.restore();
  text('DN1 VALUE CENTRE', W / 2, 170, { size: 46, weight: 500, spacing: 12, alpha: a * win(t, 54.6, 55.2, 57.0, 57.6) });
}

// ================================================================= S10–S12 data
const NB = (() => { // abstract neighbourhood squares for S10
  const r = rng(99), out = [];
  for (let gy = 0; gy < 4; gy++) for (let gx = 0; gx < 14; gx++) {
    if (r() < 0.12) continue;
    out.push({ x: 140 + gx * 118 + r() * 30, y: 300 + gy * 150 - 62 + r() * 18, s: 34 + r() * 22, wave: gx < 3 && gy < 2 ? 0 : (r() < 0.4 ? 1 : 2), k: r() });
  }
  return out;
})();
function sceneData(t) {
  const a = ss(P(t, 59.8, 60.4)) * (1 - ss(P(t, 75.8, 76.5)));
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  // ---- S10 abstract development
  const s10 = 1 - ss(P(t, 64.4, 65.2));
  if (s10 > 0) {
    ctx.save(); ctx.globalAlpha *= s10;
    // horizontal streets continue the graph lines
    for (let i = 0; i < 4; i++) { ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-200, 300 + i * 150); ctx.lineTo(W + 200, 300 + i * 150); ctx.stroke(); }
    // new streets
    for (let i = 0; i < 5; i++) {
      const f = eio(P(t, 61.6 + i * 0.25, 62.6 + i * 0.25)); if (f <= 0) continue;
      const x = 312 + i * 354; ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.moveTo(x, 300); ctx.lineTo(x, 300 + 450 * f); ctx.stroke();
    }
    const gather = eio(P(t, 63.6, 64.8));
    for (const b of NB) {
      const st = 60.6 + b.wave * 1.05 + b.k * 0.8;
      const g = eob(P(t, st, st + 0.5)); if (g <= 0) continue;
      const lift = 8 * eo(P(t, st + 0.3, st + 0.9));
      const s = b.s * g * lerp(1, 0.12, gather);
      const x = lerp(b.x, W / 2 + (b.x - W / 2) * 0.25, gather), y = lerp(b.y, H / 2 + (b.y - H / 2) * 0.25, gather);
      ctx.fillStyle = 'rgba(8,24,80,0.55)'; ctx.fillRect(x - s / 2 + lift * 0.5, y - s / 2 + lift * 0.5, s, s);
      ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fillRect(x - s / 2, y - s / 2 - lift * (1 - gather), s, s);
      if (b.k > 0.55 && gather < 0.5) { const tg = eob(P(t, st + 0.4, st + 0.9)); ctx.fillStyle = C.green3; ctx.beginPath(); ctx.arc(x + b.s * 0.75, y + b.s * 0.3, 9 * tg * (1 - gather * 2), 0, 7); ctx.fill(); }
    }
    ctx.restore();
  }
  // ---- S11 +61%
  const s11 = win(t, 64.5, 65.2, 68.3, 69.0);
  if (s11 > 0) {
    // population dots multiplying
    const r = rng(3), n = Math.floor(lerp(60, 520, eo(P(t, 64.6, 68.2))));
    for (let i = 0; i < 520; i++) {
      const ang = r() * Math.PI * 2, rad = 180 + r() * 760, sp = 0.02 + r() * 0.05, k = r();
      if (i >= n) continue;
      const x = W / 2 + Math.cos(ang + t * sp) * rad * 1.15, y = H / 2 + Math.sin(ang + t * sp) * rad * 0.62;
      ctx.fillStyle = `rgba(255,255,255,${s11 * (0.25 + 0.5 * k) * ss(P(t, 64.6 + i * 0.006, 65.0 + i * 0.006))})`;
      ctx.beginPath(); ctx.arc(x, y, 2 + k * 2.5, 0, 7); ctx.fill();
    }
    const v = Math.round(61 * eo(P(t, 65.3, 67.1)));
    const toBars = eio(P(t, 68.2, 68.9));
    const sc = lerp(0.9, 1, eo(P(t, 65.0, 65.8))) * lerp(1, 0.4, toBars);
    ctx.save(); ctx.translate(W / 2, H / 2 - 40); ctx.scale(sc, sc);
    text(`+${v}%`, 0, 0, { size: 300, weight: 800, alpha: s11, spacing: -4 });
    ctx.restore();
    text('גידול באוכלוסייה', W / 2, H / 2 + 140, { size: 44, weight: 300, rtl: true, alpha: s11 * ss(P(t, 66.4, 67.0)), spacing: 1 });
  }
  // ---- S12 land market bars
  const s12 = win(t, 68.5, 69.2, 75.4, 76.2);
  if (s12 > 0) {
    ctx.save(); ctx.globalAlpha *= s12 * ss(P(t, 68.6, 69.4)); ctx.fillStyle = 'rgb(4,12,28)'; ctx.fillRect(0, 0, W, H); ctx.restore();
    const base = 860, bw = 170, h1 = 230, h2 = h1 * 1.9;
    const g1 = eo(P(t, 68.9, 69.9)), g2 = eio(P(t, 70.2, 72.8));
    const roof = eio(P(t, 75.0, 75.9));
    const bars = [[W / 2 - 150, h1 * g1, [90, 120, 170]], [W / 2 + 150, lerp(h1, h2, g2) * g1, [40, 90, 210]]];
    ctx.save(); ctx.globalAlpha *= s12;
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(W / 2 - 420, base); ctx.lineTo(W / 2 + 420, base); ctx.stroke();
    for (const [cx, h, col] of bars) {
      if (h <= 0) continue;
      const x0 = cx - bw / 2, y0 = base - h;
      const fillA = 1 - roof;
      const grd = ctx.createLinearGradient(0, y0, 0, base); grd.addColorStop(0, rgb(col, fillA)); grd.addColorStop(1, rgb(mix(col, C.night, 0.6), fillA));
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.moveTo(x0, base); ctx.lineTo(x0, y0); ctx.lineTo(cx, y0 - 70 * roof); ctx.lineTo(x0 + bw, y0); ctx.lineTo(x0 + bw, base); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = roof > 0 ? `rgba(255,255,255,${0.9 * roof})` : 'rgba(0,0,0,0)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = C.gold; ctx.globalAlpha *= (1 - roof); ctx.fillRect(x0, y0 - 2, bw, 4); ctx.globalAlpha = s12;
    }
    // gap bracket
    const gA = ss(P(t, 72.4, 73.0)) * (1 - roof);
    if (gA > 0) {
      const xg = W / 2 + 150 + bw / 2 + 30, ya = base - h1, yb = base - h2;
      ctx.globalAlpha = s12 * gA; ctx.setLineDash([5, 6]); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(W / 2 - 150 + bw / 2, ya); ctx.lineTo(xg, ya); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = C.gold; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(xg - 8, ya); ctx.lineTo(xg, ya); ctx.lineTo(xg, yb); ctx.lineTo(xg - 8, yb); ctx.stroke();
    }
    ctx.restore();
    const nA = s12 * ss(P(t, 72.5, 73.1)) * (1 - roof);
    text('כ-90%', W / 2, 250, { size: 150, weight: 700, rtl: true, alpha: nA });
    text('פער בדוגמאות למחירי ביקוש לקרקעות', W / 2, 345, { size: 32, weight: 300, rtl: true, alpha: nA * ss(P(t, 72.9, 73.5)), color: 'rgba(255,255,255,0.85)' });
  }
  ctx.restore();
}

// ================================================================= S13 everything connects
function sceneConnect(t) {
  const a = ss(P(t, 75.6, 76.4)) * (1 - ss(P(t, 79.2, 79.8)));
  if (a <= 0) return;
  const cam = { lon: 26.06, lat: 44.598, z: lerp(7000, 8200, P(t, 75.6, 79.6)), rot: 0 };
  ctx.save(); ctx.globalAlpha = a;
  drawLocal(cam, 0.9, {});
  ctx.fillStyle = 'rgba(6,20,44,0.35)'; ctx.fillRect(0, 0, W, H);
  const c = mproj(cam, ...GEO.corbeanca);
  const fade = 1 - ss(P(t, 78.6, 79.3));
  const icons = [[-Math.PI / 2 - 0.95, 'plane', 76.4], [-Math.PI / 2 + 0.95, 'house', 76.9], [Math.PI / 2, 'chart', 77.4]];
  const R = 330;
  // balanced triangle between icons
  const tri = icons.map(([ang]) => [c[0] + Math.cos(ang) * R * 1.25, c[1] + Math.sin(ang) * R * 0.95 - 30]);
  const triA = ss(P(t, 77.8, 78.4)) * fade;
  if (triA > 0) { ctx.save(); ctx.globalAlpha *= triA * 0.35; ctx.strokeStyle = C.gold; ctx.lineWidth = 1.2; ctx.beginPath(); tri.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); ctx.stroke(); ctx.restore(); }
  icons.forEach(([ang, kind, ti], i) => {
    const pt = tri[i];
    const ia = ss(P(t, ti, ti + 0.4)) * fade;
    if (ia <= 0) return;
    ctx.save(); ctx.globalAlpha *= ia * 0.9;
    strokePartial([[c[0], c[1] - 30], pt], eio(P(t, ti + 0.1, ti + 0.8)), { strokeStyle: 'rgba(255,255,255,0.75)', lineWidth: 2 });
    ctx.restore();
    const sc = eob(P(t, ti, ti + 0.5));
    ctx.save(); ctx.globalAlpha *= ia; ctx.translate(pt[0], pt[1]); ctx.scale(sc, sc);
    ctx.scale(1.25, 1.25); ctx.fillStyle = '#0b2350'; ctx.beginPath(); ctx.arc(0, 0, 54, 0, 7); ctx.fill();
    ctx.strokeStyle = C.gold; ctx.lineWidth = 2.5; ctx.stroke();
    if (kind === 'plane') planeIcon(0, 0, -Math.PI / 4, 1.9);
    if (kind === 'house') houseGlyph(0, 0, 1.55, '#fff');
    if (kind === 'chart') chartGlyph(0, 0, 1.55, '#fff');
    ctx.restore();
  });
  // central marker → becomes the hero house (S14)
  const toHouse = P(t, 78.8, 79.6);
  pinMarker(c[0], c[1], 1.5 * eob(P(t, 75.9, 76.5)) * (1 - toHouse * 0.6), 1 - toHouse, { pulse: (t * 0.7) % 1 });
  ctx.restore();
}

// ================================================================= S14–S15 luxury villa → home at dusk
const CAM_E = [
  { t: 79.2, x: 3.8, y: 4.0, s: 20 },
  { t: 80.4, x: 3.8, y: 4.0, s: 120, ease: eo },
  { t: 82.6, x: 4.6, y: 3.4, s: 112, ease: t => t },
  { t: 86.6, x: 3.6, y: 2.4, s: 36 },
  { t: 88.0, x: 3.6, y: 3.2, s: 44, ease: t => t },
  { t: 93.2, x: 3.8, y: 4.1, s: 132, ease: eio },
  { t: 94.0, x: 3.8, y: 4.1, s: 134, ease: t => t },
];
function drawHeroVilla(cam, t, g, lit, lineMode = 0) {
  const X = HERO.x, Y = HERO.y;
  const e1 = eo(P(g, 0, 0.6)), e2 = eo(P(g, 0.35, 1));
  const col = [244, 246, 250];
  // pool + deck
  isoPoly(cam, [[X + 3.3, Y + 0.3], [X + 4.9, Y + 0.3], [X + 4.9, Y + 4.4], [X + 3.3, Y + 4.4]], '#d9cbb3');
  isoPoly(cam, [[X + 3.5, Y + 0.6], [X + 4.7, Y + 0.6], [X + 4.7, Y + 0.6 + 3.4 * e1], [X + 3.5, Y + 0.6 + 3.4 * e1]], lit > 0.3 ? `rgb(${lerp(111, 70, lit)},${lerp(195, 170, lit)},${lerp(224, 230, lit)})` : '#6fc3e0', 'rgba(255,255,255,0.7)', 1);
  // path (lit stripe in S15)
  isoPoly(cam, [[X + 1.2, Y + 3.6], [X + 1.9, Y + 3.6], [X + 1.9, Y + 5.2], [X + 1.2, Y + 5.2]], '#cdbfa6');
  isoBox(cam, X + 0.3, Y + 0.4, 0, 3.0, 3.2, 1.15 * e1, { col, win: 'band', lit, edge: 'rgba(255,255,255,0.3)' });
  isoBox(cam, X - 0.1, Y + 0.1, 1.15 * e1, 2.6, 2.5, 0.95 * e2, { col: [60, 66, 78], win: 'band', lit, glass: [40, 52, 72], edge: 'rgba(255,255,255,0.2)' });
  // cantilevered roof slab
  if (e2 > 0.05) isoBox(cam, X - 0.3, Y - 0.1, 1.15 * e1 + 0.95 * e2, 3.3 * e2, 2.9, 0.12, { col: [250, 250, 252] });
}
function sceneLux(t) {
  const a = ss(P(t, 79.1, 79.7)) * (1 - ss(P(t, 94.4, 95.2)));
  if (a <= 0) return;
  const cam = isoTrack(CAM_E, t);
  const day = ss(P(t, 79.8, 82.6)) * (1 - ss(P(t, 87.8, 90.0)));
  const dusk = ss(P(t, 87.8, 90.0));
  // sky / background
  const top = mix(mix(C.deep, [112, 148, 196], day), [20, 30, 66], dusk), bot = mix(mix(C.deep2, [200, 216, 234], day), [92, 70, 96], dusk);
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, rgb(top)); g.addColorStop(1, rgb(bot));
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (dusk > 0) { const hz = ctx.createRadialGradient(W * 0.8, H * 1.1, 0, W * 0.8, H * 1.1, H * 0.9); hz.addColorStop(0, `rgba(238,166,104,${0.45 * dusk})`); hz.addColorStop(1, 'rgba(238,166,104,0)'); ctx.fillStyle = hz; ctx.fillRect(0, 0, W, H); }
  const env = ss(P(t, 79.6, 82.0));
  const lawn = mix(mix([24, 54, 80], [118, 182, 128], env), [38, 76, 64], dusk);
  const park = mix(mix([24, 54, 80], [96, 166, 112], env), [30, 66, 54], dusk);
  const street = mix(mix([12, 26, 52], [150, 160, 176], env), [40, 46, 66], dusk);
  const lit = ss(P(t, 88.6, 91.2));
  const villaG = P(t, 79.3, 81.0);
  // neighbourhood grows outward (S14)
  drawHood(cam, LUX, t, {
    skipLot: l => Math.abs(l.x - HERO.x) < 0.1 && Math.abs(l.y - HERO.y) < 0.1,
    skipTree: tr => tr.x > HERO.x && tr.x < HERO.x + HERO.w && tr.y > HERO.y && tr.y < HERO.y + HERO.d,
    lotGrow: l => P(t, 82.4 + l.dist * 0.12 + l.k * 0.3, 83.4 + l.dist * 0.12 + l.k * 0.3),
    treeGrow: tr => P(t, 81.2 + tr.dist * 0.12 + tr.k * 0.5, 82.2 + tr.dist * 0.12 + tr.k * 0.5),
    streetCol: rgb(street, ss(P(t, 80.6, 82.0))), lawnCol: rgb(lawn), parkCol: rgb(park),
    houseCol: mix([244, 246, 250], [170, 170, 190], dusk), houseCol2: mix([90, 98, 112], [60, 62, 80], dusk),
    lit: hs => clamp(lit * 1.4 - (hs.x * 0.013 + 0.2)),
    treePal: 1,
    extra: items => {
      items.push({ k: HERO.x + HERO.y + 5.6, draw: () => {
        // hero lot lawn
        isoPoly(cam, [[HERO.x, HERO.y], [HERO.x + HERO.w, HERO.y], [HERO.x + HERO.w, HERO.y + HERO.d], [HERO.x, HERO.y + HERO.d]], rgb(mix(lawn, [255, 255, 255], 0.05)));
        drawHeroVilla(cam, t, villaG, lit);
        // garden lights + path light (S15)
        const gl = ss(P(t, 90.0, 91.4));
        if (gl > 0) for (const [x, y] of [[HERO.x + 0.3, HERO.y + 4.9], [HERO.x + 2.6, HERO.y + 4.9], [HERO.x + 4.9, HERO.y + 4.9], [HERO.x + 4.9, HERO.y + 0.2]]) { const p = iso(cam, x, y, 0.15); glowDot(p[0], p[1], 2.2 * gl * cam.s / 60, '255,206,140', gl); }
        const pl = eio(P(t, 91.0, 92.6));
        if (pl > 0) {
          const p0 = iso(cam, HERO.x + 1.55, HERO.y + 5.2, 0.02), p1 = iso(cam, HERO.x + 1.55, HERO.y + 3.6, 0.02);
          strokePartial([p0, p1], pl, { strokeStyle: 'rgba(255,214,150,0.95)', lineWidth: Math.max(2, cam.s * 0.05), lineCap: 'round', shadowColor: 'rgba(255,190,110,0.9)', shadowBlur: 16 });
        }
      } });
    },
  });
  ctx.restore();
}

// ================================================================= S16–S17 brand reveal
function sceneBrand(t) {
  const a = ss(P(t, 93.9, 94.6));
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a; ctx.fillStyle = rgb(C.deep); ctx.fillRect(0, 0, W, H);
  const v = ctx.createRadialGradient(W / 2, H * 0.45, 50, W / 2, H / 2, W * 0.7);
  v.addColorStop(0, 'rgba(30,60,120,0.55)'); v.addColorStop(1, 'rgba(0,0,0,0.45)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  // house outline → lines converging into the brand rule
  const br = eio(P(t, 94.0, 95.0));
  if (br < 1) {
    ctx.save(); ctx.globalAlpha *= (1 - ss(P(t, 94.7, 95.1)));
    const segs = [[-160, 60, -160, -60], [-160, -60, 0, -160], [0, -160, 160, -60], [160, -60, 160, 60], [160, 60, -160, 60], [-40, 60, -40, -10], [-40, -10, 40, -10], [40, -10, 40, 60]];
    ctx.strokeStyle = C.gold; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    for (const [x0, y0, x1, y1] of segs) {
      const tx0 = lerp(x0, -150, br), tx1 = lerp(x1, 150, br), ty0 = lerp(y0, 0, br), ty1 = lerp(y1, 0, br);
      ctx.beginPath(); ctx.moveTo(W / 2 + tx0, 400 + ty0); ctx.lineTo(W / 2 + tx1, 400 + ty1); ctx.stroke();
    }
    ctx.restore();
  }
  const out2 = 1 - ss(P(t, 100.4, 100.9)); // secondary elements leave for the final hold
  // GIGI RESIDENCE (typographic stand-in until the official GIGI logo file is supplied)
  const gA = ss(P(t, 94.3, 95.2));
  const sc = lerp(1.05, 1, eo(P(t, 94.3, 95.8)));
  ctx.save(); ctx.translate(W / 2, 318); ctx.scale(sc, sc);
  const grad = ctx.createLinearGradient(-420, -50, 420, 50); grad.addColorStop(0, '#e9d6ad'); grad.addColorStop(0.5, '#ffffff'); grad.addColorStop(1, '#c9a96e');
  text('GIGI RESIDENCE', 0, 0, { size: 96, weight: 600, fam: 'Cinzel', color: grad, alpha: gA, spacing: lerp(30, 16, eo(P(t, 94.3, 95.8))) });
  ctx.restore();
  // gold rule
  const ruleW = 300 * eio(P(t, 94.8, 95.6));
  ctx.fillStyle = C.gold; ctx.globalAlpha = a; ctx.fillRect(W / 2 - ruleW / 2, 400, ruleW, 2);
  text('BY', W / 2, 440, { size: 22, weight: 500, fam: 'Cinzel', spacing: 8, alpha: ss(P(t, 95.25, 95.7)), color: '#d6b679' });
  // ISROMANA official logo (screen-blended: its black field disappears into the background)
  const img = IMG.logo;
  if (img) {
    const la = ss(P(t, 95.35, 96.2));
    const lw = 540, lh = lw * img.height / img.width;
    const ls = lerp(0.96, 1, eo(P(t, 95.35, 96.6)));
    ctx.save(); ctx.globalAlpha = la; ctx.globalCompositeOperation = 'screen';
    ctx.translate(W / 2, 470 + lh / 2); ctx.scale(ls, ls); ctx.drawImage(img, -lw / 2, -lh / 2, lw, lh); ctx.restore();
    // LUXURY RESIDENCE moment: a light sweep across the logo's tagline
    const sw = P(t, 96.5, 97.6);
    if (sw > 0 && sw < 1) {
      const yy = 470 + lh * 0.935, xx = W / 2 - lw * 0.42 + lw * 0.84 * eio(sw);
      const gr = ctx.createRadialGradient(xx, yy, 0, xx, yy, 60);
      gr.addColorStop(0, 'rgba(255,240,210,0.45)'); gr.addColorStop(1, 'rgba(255,240,210,0)');
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = gr; ctx.fillRect(xx - 60, yy - 60, 120, 120); ctx.restore();
    }
    const ul = eio(P(t, 96.5, 97.4)) * out2;
    ctx.fillStyle = `rgba(214,182,121,${0.8 * ul})`; ctx.fillRect(W / 2 - lw * 0.4 * ul, 470 + lh + 8, lw * 0.8 * ul, 1.5);
  }
  // tagline
  text('מרימים את הסטנדרט רמה אחת מעל.', W / 2, 935, { size: 44, weight: 300, rtl: true, alpha: ss(P(t, 98.05, 98.8)) * out2, color: 'rgba(255,255,255,0.92)', spacing: 1 });
  ctx.restore();
}

// ================================================================= frame
function background(t) {
  // base colour per act
  let c = C.deep;
  const royal = ss(P(t, 58.6, 60.2)) * (1 - ss(P(t, 68.5, 69.3)));
  c = mix(c, C.royal, royal);
  ctx.fillStyle = rgb(c); ctx.fillRect(0, 0, W, H);
  // soft light falloff
  const g = ctx.createRadialGradient(W * 0.5, H * 0.42, 100, W * 0.5, H * 0.5, W * 0.75);
  g.addColorStop(0, 'rgba(255,255,255,0.05)'); g.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function vignette(a = 1) {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, W * 0.72);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${0.38 * a})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function renderFrame(t) {
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  background(t);
  if (t < 30.2) sceneMapA(t);
  if (t > 29.1 && t < 45.3) sceneHood(t);
  if (t > 44.3 && t < 61) sceneRetail(t);
  if (t > 59.6 && t < 76.6) sceneData(t);
  if (t > 75.5 && t < 80) sceneConnect(t);
  if (t > 79 && t < 95.4) sceneLux(t);
  if (t > 93.8) sceneBrand(t);
  vignette();
  // corner logo (top-left), kept readable over the bright daylight scene
  const cl = ss(P(t, 0.3, 1.2)) * (1 - ss(P(t, 94.2, 95.0)));
  const day = ss(P(t, 80.0, 82.0)) * (1 - ss(P(t, 88, 90)));
  if (day > 0 && cl > 0) { const g = ctx.createRadialGradient(135, 75, 10, 135, 75, 170); g.addColorStop(0, `rgba(6,20,44,${0.55 * day})`); g.addColorStop(1, 'rgba(6,20,44,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 400, 300); }
  drawLogoCorner(cl);
  // end: fade to black
  const fb = ss(P(t, 101.3, 102.0));
  if (fb > 0) { ctx.fillStyle = `rgba(0,0,0,${fb})`; ctx.fillRect(0, 0, W, H); }
}
window.renderFrame = renderFrame;
window.READY = (async () => {
  await Promise.all([loadImg('logo', 'assets/isromana-logo.jpg')]);
  const fams = ['300 20px Heebo', '400 20px Heebo', '500 20px Heebo', '700 20px Heebo', '800 20px Heebo', '600 20px Cinzel', '500 20px Cinzel'];
  await Promise.all(fams.flatMap(f => [document.fonts.load(f, 'אבג'), document.fonts.load(f, 'ABC')]));
  await document.fonts.ready;
  renderFrame(0);
  return true;
})();
