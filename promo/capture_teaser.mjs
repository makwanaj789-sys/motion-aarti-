// Teaser captures: the Home greeting, a full search typed letter by letter,
// and the results — at 12x so the camera can push right into them.
import { launch, openApp, seed } from './harness.mjs';
import fs from 'node:fs';
const OUT = 'cap3'; fs.mkdirSync(OUT, { recursive: true });
const rects = {};
const b = await launch();
const { page } = await openApp(b, { dpr: 12, storage: seed({ theme: 'teal' }) });
const wait = (ms) => page.waitForTimeout(ms);
const rect = async (key, sel) => { rects[key] = await page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; }, sel); };
const clip = async (name, c) => page.screenshot({ path: `${OUT}/${name}.png`, caret: 'initial', clip: { x: c[0], y: c[1], width: c[2], height: c[3] } });
await wait(900);
await rect('greet', '#pHome .head h1'); await rect('kicker', '#pHome .brand-kicker'); await rect('brandicon', '.brand-icon');
await clip('greet', [0, 0, 412, 150]);
await page.click('.nav [data-tab=Search]'); await wait(1400);
await page.click('#q'); await wait(500);
await rect('searchbar', '#searchForm'); await rect('searchbtn', '#searchForm button[type=submit]'); await rect('q', '#q');
await clip('sq00', [0, 0, 412, 80]);
const q = 'om jai jagdish hare';
for (let i = 1; i <= q.length; i++) {
  await page.keyboard.type(q[i - 1]); await wait(250);
  await clip('sq' + String(i).padStart(2, '0'), [0, 0, 412, 80]);
}
// the caret position after each letter, for a camera that follows the typing
rects.caret = await page.evaluate((qq) => {
  const inp = document.getElementById('q'), cs = getComputedStyle(inp), c = document.createElement('canvas').getContext('2d');
  c.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`; const r = inp.getBoundingClientRect(); const pl = parseFloat(cs.paddingLeft);
  return [...Array(qq.length + 1).keys()].map((n) => r.left + pl + c.measureText(qq.slice(0, n)).width);
}, q);
await page.keyboard.press('Enter'); await wait(1800);
await page.evaluate(() => document.activeElement && document.activeElement.blur()); await wait(300);
await clip('results', [0, 0, 412, 892]);
rects.rows = await page.evaluate(() => [...document.querySelectorAll('#results .row')].map((e) => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; }));
fs.writeFileSync(`${OUT}/rects.json`, JSON.stringify(rects, null, 1));
await b.close(); console.log('done', JSON.stringify(rects).slice(0, 400));
