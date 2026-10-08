// Content shown in the promo. Titles, artists, covers and playlists are the demo
// catalogue the AartiMusic app ships for its search screen (promo/songs.json).
export const QUERY = 'Om Jai Jagdish Hare';

export type Item =
  | { kind: 'header' | 'section' | 'footer'; text: string; y: number; t: number }
  | { kind: 'row'; title: string; sub: string; dur?: string; cover: string; y: number; t: number };

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const row = (title: string, sub: string, cover: string, t: number, secs?: number) =>
  ({ kind: 'row' as const, title, sub, cover, t, dur: secs ? fmt(secs) : undefined, y: 0 });

// t = reference frame at which each item starts to appear, matched to the
// reference's line-by-line reveal (sections at r216, r234, r250; close at r263).
const list: Item[] = [
  { kind: 'header', text: 'Top results for “Om Jai Jagdish Hare”', y: 0, t: 213 },
  { kind: 'section', text: 'Songs', y: 0, t: 216 },
  row('Om Jai Jagdish Hare', 'Evening Aarti', 'cover00', 217, 342),
  row('Om Jai Shiv Omkara', 'Temple Morning', 'cover03', 220.5, 298),
  row('Om Jai Lakshmi Mata', 'Diya Sessions', 'cover08', 224, 276),
  row('Om Jai Ambe Gauri', 'Garba Nights', 'cover04', 228, 315),
  { kind: 'section', text: 'More like this', y: 0, t: 234 },
  row('Om Namah Shivaya', 'Calm Chants', 'cover06', 235.5, 402),
  row('Om Jai Jagdish Hare (Live)', 'Evening Aarti', 'cover11', 239.5, 361),
  { kind: 'section', text: 'Playlists', y: 0, t: 250 },
  row('Morning Aarti', 'Playlist · Aarti Music', 'cover08', 251.5),
  row('Bhakti Classics', 'Playlist · Aarti Music', 'cover00', 255.5),
  { kind: 'footer', text: 'Tap a song to play it. Tap ♥ to keep it in your favourites.', y: 0, t: 263 },
];

// vertical layout in results-world pixels
let y = 0;
for (const it of list) {
  if (it.kind === 'header') { it.y = y; y += 96; }
  else if (it.kind === 'section') { if (y > 96) y += 36; it.y = y; y += 54; }
  else if (it.kind === 'row') { it.y = y; y += 100; }
  else { y += 34; it.y = y; y += 40; }
}
export const RESULTS = list;
export const RESULTS_HEIGHT = y;
