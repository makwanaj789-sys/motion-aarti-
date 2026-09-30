// Captures every real AartiMusic screen state the promo uses, at 4x density,
// plus element rectangles (CSS px, 412x892 viewport) for layered animation.
import { launch, openApp, W, H } from './harness.mjs';
import fs from 'node:fs';

const OUT = 'cap';
fs.mkdirSync(OUT, { recursive: true });
const rects = {};
const b = await launch();
const { page } = await openApp(b, { dpr: 4 });
const wait = (ms) => page.waitForTimeout(ms);
const shot = async (name, opts = {}) => { await page.screenshot({ path: `${OUT}/${name}.png`, caret: 'initial', ...opts }); console.log('shot', name); };
const rect = async (key, sel, all = false) => {
  rects[key] = await page.evaluate(([s, a]) => {
    const f = (e) => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; };
    return a ? [...document.querySelectorAll(s)].map(f) : (document.querySelector(s) ? f(document.querySelector(s)) : null);
  }, [sel, all]);
};

// ---------- HOME (fresh, nothing playing) ----------
await wait(800);
await shot('home');
await rect('home_chips', '#discovery .discovery-chips .chip', true);
await rect('home_brand', '.brand-icon');
await rect('home_cards', '#discovery .discovery-card', true);
await rect('home_songs', '#discovery .discovery-song', true);
// Scrollable content without the floating nav, and the nav on its own.
await page.addStyleTag({ content: 'body.__cap .nav,body.__cap .mini{visibility:hidden!important}' });
await page.evaluate(() => document.body.classList.add('__cap'));
await shot('home_content', { fullPage: true });
rects.home_content_h = await page.evaluate(() => document.documentElement.scrollHeight);
await page.evaluate(() => document.body.classList.remove('__cap'));
await page.addStyleTag({ content: 'body.__nav{background:transparent!important}html.__nav{background:transparent!important}body.__nav>*:not(.nav){visibility:hidden!important}' });
await page.evaluate(() => { document.body.classList.add('__nav'); document.documentElement.classList.add('__nav'); });
await rect('nav', '#nav');
await page.locator('#nav').screenshot({ path: `${OUT}/nav_home.png`, omitBackground: true });
await page.evaluate(() => { document.body.classList.remove('__nav'); document.documentElement.classList.remove('__nav'); });

// ---------- SEARCH ----------
await page.click('.nav [data-tab=Search]'); await wait(1400);
await shot('search_idle');
await page.click('#q'); await wait(500);
await shot('search_focus');
await rect('searchbar', '#searchForm');
const q = 'om jai';
for (let i = 1; i <= q.length; i++) {
  await page.keyboard.type(q[i - 1]); await wait(700);
  await shot(`search_q${i}`);
}
await page.keyboard.press('Enter'); await wait(1600);

await wait(300);
await shot('search_results');
await rect('result_rows', '#results .row', true);
await rect('result_thumb0', '#results .row img');
await page.click('#results .row .info'); await wait(1600);

await page.evaluate(() => { const a = document.getElementById('audio'); a.pause(); });
await wait(300);
await shot('search_tapped');

// ---------- PLAYER ----------
await page.click('#miniOpen'); await wait(1800);
await page.evaluate(() => { const a = document.getElementById('audio'); a.pause(); a.currentTime = 70; });
await wait(900);
await shot('now_paused');
await rect('now_cover', '#sharedArt img');
await rect('now_play', '#nPlay');
await rect('now_seek', '#seekRail');
for (const [i, t] of [[0, 71], [1, 74], [2, 77]].entries()) {
  await page.evaluate((tt) => { const a = document.getElementById('audio'); a.currentTime = tt; return a.play(); }, t[1]);
  await wait(i === 0 ? 1200 : 500);
  await page.evaluate((tt) => { const a = document.getElementById('audio'); a.currentTime = tt; }, t[1]);
  await wait(400);
  await shot(`now_playing${i}`);
}
await page.click('#nowClose'); await wait(900);

// ---------- LIBRARY ----------
await page.click('.nav [data-tab=Lib]'); await wait(1400);
await shot('lib');
await rect('lib_account', '#account');
await rect('lib_cards', '#ownGrid .own-card', true);
await rect('lib_create', '#createPlaylist');
await rect('lib_rows', '#libRows .row', true);
await page.evaluate(() => window.scrollTo(0, 330)); await wait(500);
await shot('lib_scroll');
await page.evaluate(() => window.scrollTo(0, 0)); await wait(500);

await page.click('#createPlaylist'); await wait(900);
await shot('create_0');
await rect('create_dialog', 'dialog.personal-dialog');
const name = 'Road Trip';
for (let i = 1; i <= name.length; i++) { await page.keyboard.type(name[i - 1]); await wait(120); await shot(`create_${i}`); }
await page.evaluate(() => document.activeElement.blur()); await wait(200);
await shot('create_typed');
await rect('create_btn', 'dialog.personal-dialog .personal-actions .primary');
await page.click('dialog.personal-dialog .personal-actions .primary'); await wait(900);
await shot('create_done');
await page.keyboard.press('Escape'); await wait(700);
await shot('lib_after');
await rect('lib_cards_after', '#ownGrid .own-card', true);

// ---------- TELEGRAM ----------
await page.evaluate(() => window.scrollTo(0, 0)); await wait(400);
await page.click('#accBtn'); await wait(1200);
await shot('link');
await rect('link_sheet', '#linkSheet .sheet-in');
await page.click('#linkCancel'); await wait(900);

// ---------- THEMES ----------
const themes = ['amber', 'green', 'teal', 'violet', 'indigo', 'neon', 'ruby'];
await page.click('.nav [data-tab=Home]'); await wait(1200);
await page.click('#profileMenu'); await wait(1300);
await shot('drawer_amber');
await rect('drawer_themes', '.settings-drawer .th', true);
for (const t of themes) {
  await page.click(`.settings-drawer .th[data-theme=${t}]`); await wait(700);
  await shot(`drawer_${t}`);
}
await page.click(`.settings-drawer .th[data-theme=amber]`); await wait(500);
await page.evaluate(() => { const d = document.querySelector('.settings-drawer'); const h = [...d.querySelectorAll('h2,h3')].find((x) => /App icon/.test(x.textContent)); d.scrollTop = h.offsetTop - 120; });
await wait(500);
await shot('drawer_icons');
await rect('drawer_iconbtns', '.settings-drawer .icon-choice', true);
await page.evaluate(() => { document.querySelector('.settings-drawer').scrollTop = 0; });
await page.keyboard.press('Escape'); await wait(900);
for (const t of themes) {
  await page.evaluate((tt) => { if (tt === 'amber') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', tt); }, t);
  await page.evaluate(() => { document.getElementById('audio').pause(); window.scrollTo(0, 0); });
  await wait(700);
  await shot(`home_${t}`);
  await page.click('.nav [data-tab=Lib]'); await wait(900);
  await shot(`lib_${t}`);
  await page.click('.nav [data-tab=Home]'); await wait(900);
}

fs.writeFileSync(`${OUT}/rects.json`, JSON.stringify(rects, null, 1));
await b.close();
console.log('done');
