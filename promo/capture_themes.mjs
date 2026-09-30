// Home screen in each of the app's seven themes (same layout, only the palette changes).
import { launch, openApp, seed } from './harness.mjs';
const b = await launch();
const { page } = await openApp(b, { dpr: 4, storage: seed({ theme: 'teal' }) });
await page.waitForTimeout(900);
for (const t of ['amber', 'green', 'teal', 'violet', 'indigo', 'neon', 'ruby']) {
  await page.evaluate((tt) => { if (tt === 'amber') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', tt); }, t);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `cap2/home_${t}.png` }); console.log('theme', t);
}
await b.close();
