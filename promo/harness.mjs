// Runs the real AartiMusic web layer (extracted from the APK) in Chromium,
// with a local mock of its server so screens fill with demo content.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const APP = path.join(ROOT, 'app');
const S = JSON.parse(fs.readFileSync(path.join(ROOT, 'songs.json'), 'utf8'));
const ORIGIN = 'https://aarti.app';
const API = 'https://api.aarti.app';
const thumb = (c) => `${ORIGIN}/__art/cover${String(c).padStart(2, '0')}.jpg`;
const song = (s) => ({ id: s.id, title: s.title, artist: s.artist, thumb: thumb(s.cover), duration: s.duration });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.json': 'application/json' };

export const W = 412, H = 892;

export function seed(extra = {}) {
  const store = {
    favs: S.favs.map((s, i) => ({ ...song(s), at: 1700000000000 + i })), recents: S.recents.map(song),
    history: ['om jai', 'garba', 'lofi'], repeat: 'off', shuffle: false, gone: {}, link: null, syncedAt: 0,
    lists: S.playlists.slice(0, 4).map((p) => ({ id: p.id, title: p.title, by: p.by, thumb: thumb(p.cover), name: p.title })),
    theme: 'amber', ...extra,
  };
  const own = [
    { id: 'local-1', name: 'Sunday Bhakti', cover: '', songs: S.favs.slice(0, 4).map(song), updatedAt: 1 },
    { id: 'local-2', name: 'Night Drive', cover: '', songs: S.recents.slice(1, 4).map(song), updatedAt: 2 },
  ];
  return {
    'aarti.v1': JSON.stringify(store),
    'aarti.profile.v1': JSON.stringify({ name: 'Priya', photo: '', languages: ['Hindi', 'Gujarati'], artists: ['Evening Aarti'] }),
    'aarti.playlists.v1': JSON.stringify(own),
  };
}

export async function launch() {
  return chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--font-render-hinting=none'] });
}

export async function openApp(browser, { dpr = 4, storage = seed(), reduced = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: dpr, hasTouch: false,
    reducedMotion: reduced ? 'reduce' : 'no-preference', ignoreHTTPSErrors: true });
  await ctx.addInitScript((st) => {
    if (!sessionStorage.getItem('__seeded')) {
      localStorage.clear();
      for (const [k, v] of Object.entries(st)) localStorage.setItem(k, v);
      sessionStorage.setItem('__seeded', '1');
    }
    // A fixed evening, so the greeting is always the same.
    Date.prototype.getHours = function () { return 19; };
  }, storage);
  await ctx.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === 'telegram.org') return route.fulfill({ body: '', contentType: 'text/javascript' });
    if (url.hostname.endsWith('github.io')) return route.fulfill({ json: { server: API } });
    if (url.origin === ORIGIN) {
      if (url.pathname.startsWith('/__art/')) return route.fulfill({ path: path.join(ROOT, 'art', path.basename(url.pathname)) });
      const f = path.join(APP, url.pathname === '/' ? 'index.html' : url.pathname);
      if (fs.existsSync(f)) return route.fulfill({ path: f, contentType: MIME[path.extname(f)] || 'application/octet-stream' });
      return route.fulfill({ status: 404, body: '' });
    }
    if (url.origin === API) {
      const p = url.pathname, q = (url.searchParams.get('q') || '').toLowerCase();
      if (p === '/api/search') {
        const list = q.startsWith('om') ? S.search : S.discover;
        return route.fulfill({ json: { results: list.map(song) } });
      }
      if (p === '/api/playlists') return route.fulfill({ json: { results: S.playlists.map((x) => ({ id: x.id, title: x.title, by: x.by, thumb: thumb(x.cover), count: 24 })) } });
      if (p === '/api/playlist') return route.fulfill({ json: { title: 'Morning Aarti', by: 'Aarti Music', thumb: thumb(8), results: S.search.map(song) } });
      if (p.startsWith('/api/stream/')) {
        const buf = fs.readFileSync(path.join(ROOT, 'app_stream.wav'));
        const range = route.request().headers()['range'];
        const m = range && /bytes=(\d*)-(\d*)/.exec(range);
        if (!m) return route.fulfill({ body: buf, headers: { 'Content-Type': 'audio/wav', 'Accept-Ranges': 'bytes' } });
        const start = +m[1] || 0, end = m[2] ? +m[2] : buf.length - 1;
        return route.fulfill({ status: 206, body: buf.subarray(start, end + 1), headers: { 'Content-Type': 'audio/wav',
          'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${start}-${end}/${buf.length}` } });
      }
      return route.fulfill({ status: 404, json: {} });
    }
    return route.abort();
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('pageerror', e.message));
  await page.goto(ORIGIN + '/index.html');
  await page.waitForTimeout(1500);
  return { ctx, page };
}
