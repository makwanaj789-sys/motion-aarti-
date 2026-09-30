// Renders compose.html frame by frame at 2160x3840 (1080x1920 @2x).
// usage: node render.mjs frames <outdir> [workers]      -> every frame as JPEG
//        node render.mjs stills <outdir> t1 t2 ...       -> PNG stills at given times
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const [mode, out, ...rest] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.woff2': 'font/woff2' };

async function newPage(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 });
  await ctx.route('https://promo.local/**', (route) => {
    const f = path.join(ROOT, decodeURIComponent(new URL(route.request().url()).pathname));
    if (!fs.existsSync(f)) return route.fulfill({ status: 404, body: '' });
    route.fulfill({ path: f, contentType: MIME[path.extname(f)] || 'application/octet-stream' });
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('pageerror', e.message));
  await page.goto('https://promo.local/compose.html');
  await page.waitForFunction(() => window.READY || window.READY_ERR, null, { timeout: 120000 });
  const err = await page.evaluate(() => window.READY_ERR);
  if (err) throw new Error(err);
  return page;
}
async function frameAt(page, t) {
  await page.evaluate(async (tt) => {
    window.renderAt(tt);
    await Promise.all([...document.images].filter((i) => !i.complete).map((i) => i.decode().catch(() => {})));
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, t);
}

const browser = await chromium.launch({ args: ['--disable-gpu-vsync', '--force-color-profile=srgb'] });
if (mode === 'stills') {
  const page = await newPage(browser);
  for (const s of rest) {
    await frameAt(page, +s);
    await page.screenshot({ path: path.join(out, `t${(+s).toFixed(2)}.png`) });
    console.log('still', s);
  }
  fs.writeFileSync(path.join(ROOT, 'timeline.json'), JSON.stringify(await page.evaluate(() => window.TIMELINE), null, 1));
} else {
  const workers = +(rest[0] || 4);
  const probe = await newPage(browser);
  const TL = await probe.evaluate(() => window.TIMELINE);
  fs.writeFileSync(path.join(ROOT, 'timeline.json'), JSON.stringify(TL, null, 1));
  await probe.context().close();
  const N0 = Math.round(TL.duration * TL.fps);
  const N = rest[2] ? Math.min(N0, +rest[2]) : N0;
  let next = rest[1] ? +rest[1] : 0; const t0 = Date.now();
  await Promise.all(Array.from({ length: workers }, async () => {
    const page = await newPage(browser);
    while (next < N) {
      const i = next++;
      await frameAt(page, i / TL.fps);
      await page.screenshot({ path: path.join(out, `f${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 95 });
      if (i % 30 === 0) console.log(`frame ${i}/${N}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
  }));
  console.log('frames', N);
}
await browser.close();
