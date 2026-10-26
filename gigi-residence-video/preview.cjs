// Renders still frames for review: node preview.cjs out_dir t1 t2 ...
const { chromium } = require('playwright');
const { writeFileSync, mkdirSync } = require('fs');
const path = require('path');
(async () => {
const [out, ...ts] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
page.on('console', m => console.log('[page]', m.text()));
page.on('pageerror', e => console.log('[err]', e.message));
await page.goto('file://' + path.resolve('index.html') + '?scale=0.5');
await page.evaluate(() => window.READY);
for (const t of ts) {
  const d = await page.evaluate(t => { window.renderFrame(+t); return document.getElementById('c').toDataURL('image/jpeg', 0.85); }, t);
  writeFileSync(`${out}/f_${(+t).toFixed(2).padStart(7, "0")}.jpg`, Buffer.from(d.split(',')[1], 'base64'));
}
await browser.close();
})();
