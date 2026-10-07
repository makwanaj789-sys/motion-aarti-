// v2 capture: every screen in the app's own "Midnight" (teal) theme, extra
// interaction states, and 8x macro crops for close-up shots.
// usage: node capture_v2.mjs            -> cap2/  (4x full screens + rects)
//        MACRO=1 node capture_v2.mjs    -> cap2m/ (8x clipped regions)
import { launch, openApp, seed } from './harness.mjs';
import fs from 'node:fs';

const MACRO = process.env.MACRO === '1';
const OUT = MACRO ? 'cap2m' : 'cap2';
fs.mkdirSync(OUT, { recursive: true });
// regions shot at 8x in macro mode (CSS px of the 412x892 viewport)
const CLIP = {
  home: [0, 0, 412, 240], home_chip1: [0, 0, 412, 240], home_chip2: [0, 0, 412, 240],
  search_focus: [0, 0, 412, 80], search_q1: [0, 0, 412, 80], search_q2: [0, 0, 412, 80], search_q3: [0, 0, 412, 80],
  search_q4: [0, 0, 412, 80], search_q5: [0, 0, 412, 80], search_q6: [0, 0, 412, 80],
  search_results: [0, 420, 412, 260], search_tapped: [0, 420, 412, 260],
  now_paused: [0, 150, 412, 742], now_playing0: [0, 150, 412, 742], now_playing1: [0, 150, 412, 742],
  lib: [0, 440, 412, 240], lib_footer: [0, 560, 412, 332],
};
const rects = {};
const b = await launch();
const { page } = await openApp(b, { dpr: MACRO ? 8 : 4, storage: seed({ theme: 'teal' }) });
const wait = (ms) => page.waitForTimeout(ms);
const shot = async (name) => {
  if (MACRO) { const c = CLIP[name]; if (!c) return; await page.screenshot({ path: `${OUT}/${name}.png`, caret: 'initial', clip: { x: c[0], y: c[1], width: c[2], height: c[3] } }); }
  else await page.screenshot({ path: `${OUT}/${name}.png`, caret: 'initial' });
  console.log('shot', name);
};
const rect = async (key, sel, all = false) => {
  rects[key] = await page.evaluate(([s, a]) => {
    const f = (e) => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; };
    return a ? [...document.querySelectorAll(s)].map(f) : (document.querySelector(s) ? f(document.querySelector(s)) : null);
  }, [sel, all]);
};

// ---------- HOME, then the mood chips being picked
await wait(900);
await shot('home');
await rect('home_chips', '#discovery .discovery-chips .chip', true);
await rect('home_cards', '#discovery .discovery-card', true);
await rect('home_songs', '#discovery .discovery-song', true);
await rect('nav', '#nav'); await rect('nav_btns', '#nav button', true);
await rect('profile', '#profileMenu');
if (!MACRO) {
  await page.addStyleTag({ content: 'body.__cap .nav,body.__cap .mini{visibility:hidden!important}' });
  await page.evaluate(() => document.body.classList.add('__cap'));
  await page.screenshot({ path: `${OUT}/home_content.png`, fullPage: true });
  rects.home_content_h = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.evaluate(() => document.body.classList.remove('__cap'));
  await page.addStyleTag({ content: 'body.__nav{background:transparent!important}html.__nav{background:transparent!important}body.__nav>*:not(.nav){visibility:hidden!important}' });
  await page.evaluate(() => { document.body.classList.add('__nav'); document.documentElement.classList.add('__nav'); });
  await page.locator('#nav').screenshot({ path: `${OUT}/nav_home.png`, omitBackground: true });
  await page.evaluate(() => { document.body.classList.remove('__nav'); document.documentElement.classList.remove('__nav'); });
}
for (const i of [1, 2]) {
  await page.click(`#discovery .discovery-chips .chip:nth-child(${i + 1})`); await wait(1300);
  await shot(`home_chip${i}`);
}
await page.click('#discovery .discovery-chips .chip:nth-child(1)'); await wait(1200);

// ---------- SEARCH
await page.click('.nav [data-tab=Search]'); await wait(1400);
await shot('search_idle');
await page.click('#q'); await wait(500);
await shot('search_focus');
await rect('searchbar', '#searchForm');
const q = 'om jai';
for (let i = 1; i <= q.length; i++) { await page.keyboard.type(q[i - 1]); await wait(700); await shot(`search_q${i}`); }
await page.keyboard.press('Enter'); await wait(1700);
await shot('search_results');
await rect('result_rows', '#results .row', true);
await rect('result_hearts', '#results .row .icon:not(:last-child)', true);
await page.click('#results .row .info'); await wait(1600);
await page.evaluate(() => document.getElementById('audio').pause()); await wait(300);
await shot('search_tapped');

// ---------- PLAYER (paused at 1:10, then playing on)
await page.click('#miniOpen'); await wait(1800);
await page.evaluate(() => { const a = document.getElementById('audio'); a.pause(); a.currentTime = 70; }); await wait(900);
await shot('now_paused');
await rect('now_cover', '#sharedArt img'); await rect('now_play', '#nPlay'); await rect('now_seek', '#seekRail'); await rect('now_fav', '#nFav');
for (const [i, t] of [[0, 71], [1, 74], [2, 77]]) {
  await page.evaluate((tt) => { const a = document.getElementById('audio'); a.currentTime = tt; return a.play(); }, t);
  await wait(i === 0 ? 1200 : 500);
  await page.evaluate((tt) => { document.getElementById('audio').currentTime = tt; }, t); await wait(400);
  await shot(`now_playing${i}`);
}
await page.click('#nowClose'); await wait(900);

// ---------- LIBRARY, a new playlist, the maker's footer
await page.click('.nav [data-tab=Lib]'); await wait(1400);
await shot('lib');
await rect('lib_account', '#account'); await rect('lib_cards', '#ownGrid .own-card', true); await rect('lib_create', '#createPlaylist');
await rect('lib_rows', '#libRows .row', true);
await page.click('#createPlaylist'); await wait(900);
await shot('create_0'); await rect('create_dialog', 'dialog.personal-dialog');
const name = 'Road Trip';
for (let i = 1; i <= name.length; i++) { await page.keyboard.type(name[i - 1]); await wait(120); await shot(`create_${i}`); }
await page.evaluate(() => document.activeElement.blur()); await wait(200);
await shot('create_typed'); await rect('create_btn', 'dialog.personal-dialog .personal-actions .primary');
await page.click('dialog.personal-dialog .personal-actions .primary'); await wait(900);
await page.keyboard.press('Escape'); await wait(700);
await shot('lib_after'); await rect('lib_cards_after', '#ownGrid .own-card', true);
await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await wait(700);
await shot('lib_footer'); await rect('made', 'footer.made'); await rect('made_ig', 'footer.made .handle');
await page.evaluate(() => window.scrollTo(0, 330)); await wait(500);
await shot('lib_scroll');
await page.evaluate(() => window.scrollTo(0, 0)); await wait(500);
await page.click('#accBtn'); await wait(1200);
await shot('link'); await rect('link_sheet', '#linkSheet .sheet-in');
await page.click('#linkCancel'); await wait(900);

// ---------- SETTINGS: theme chooser and app icons
await page.click('.nav [data-tab=Home]'); await wait(1200);
await page.click('#profileMenu'); await wait(1300);
await shot('drawer'); await rect('drawer_themes', '.settings-drawer .th', true);
await page.evaluate(() => { const d = document.querySelector('.settings-drawer'); const h = [...d.querySelectorAll('h2,h3')].find((x) => /App icon/.test(x.textContent)); d.scrollTop = h.offsetTop - 120; });
await wait(500);
await shot('drawer_icons'); await rect('drawer_iconbtns', '.settings-drawer .icon-choice', true);

if (!MACRO) fs.writeFileSync(`${OUT}/rects.json`, JSON.stringify(rects, null, 1));
await b.close();
console.log('done');
