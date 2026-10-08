// Render selected frames as PNG stills (one bundle, one browser) for frame-by-frame review.
// usage: node scripts/stills.mjs <outdir> <frame> [frame...]   (frames are 60 fps composition frames)
import { bundle } from '@remotion/bundler';
import { openBrowser, renderStill, selectComposition } from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';

const [out, ...frames] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const browserExecutable = process.env.REMOTION_BROWSER || null;
const browser = await openBrowser('chrome', { browserExecutable, chromiumOptions: { gl: 'swangle' } });
const composition = await selectComposition({ serveUrl, id: 'AartiPromo', puppeteerInstance: browser });
for (const f of frames.map(Number)) {
  await renderStill({ composition, serveUrl, frame: f, output: path.join(out, `f${String(f).padStart(4, '0')}.png`), puppeteerInstance: browser, scale: Number(process.env.SCALE || 1) });
  process.stdout.write(`${f} `);
}
await browser.close({ silent: true });
console.log('\ndone');
