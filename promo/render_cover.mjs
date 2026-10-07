import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 });
const p = await ctx.newPage(); await p.goto('file://' + ROOT + '/reel_cover.html');
await p.evaluate(async () => { await document.fonts.load('800 100px Sora'); await Promise.all([...document.images].map((i) => i.decode().catch(() => {}))); });
await p.waitForTimeout(500);
await p.locator('#c').screenshot({ path: process.argv[2] }); await b.close();
