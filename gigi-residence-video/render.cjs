// Renders the film to video segments: node render.cjs <outDir> [scale=2] [workers=4] [fps=25] [from=0] [to=102]
// Each worker owns a contiguous frame range and pipes JPEG frames into its own ffmpeg.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const { mkdirSync, writeFileSync } = require('fs');
const path = require('path');

const [outDir, scaleArg = '2', workersArg = '4', fpsArg = '25', fromArg = '0', toArg = '102'] = process.argv.slice(2);
const SCALE = +scaleArg, WORKERS = +workersArg, FPS = +fpsArg;
const F0 = Math.round(+fromArg * FPS), F1 = Math.round(+toArg * FPS); // [F0, F1)
mkdirSync(outDir, { recursive: true });

async function worker(browser, idx, a, b) {
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  page.on('pageerror', e => console.error(`[w${idx}]`, e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html') + '?scale=' + SCALE);
  await page.evaluate(() => window.READY);
  const seg = path.join(outDir, `seg_${String(idx).padStart(2, '0')}.mp4`);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', String(FPS), seg], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = a; f < b; f++) {
    const b64 = await page.evaluate(t => { window.renderFrame(t); return document.getElementById('c').toDataURL('image/jpeg', 0.96).slice(23); }, f / FPS);
    const buf = Buffer.from(b64, 'base64');
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - a) % 100 === 0) console.log(`[w${idx}] frame ${f} (${f - a + 1}/${b - a}) ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await page.close();
  return seg;
}

(async () => {
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const per = Math.ceil((F1 - F0) / WORKERS), jobs = [];
  for (let i = 0; i < WORKERS; i++) {
    const a = F0 + i * per, b = Math.min(F1, a + per);
    if (a < b) jobs.push(worker(browser, i, a, b));
  }
  const segs = await Promise.all(jobs);
  await browser.close();
  writeFileSync(path.join(outDir, 'segments.txt'), segs.map(s => `file '${path.resolve(s)}'`).join('\n') + '\n');
  console.log('done', segs.length, 'segments');
})();
