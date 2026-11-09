
import { mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'docs', 'media');
await mkdir(OUT, { recursive: true });

async function makeGif(name, frames, { width, delay }) {
  const bufs = await Promise.all(frames.map((f) => sharp(f).resize({ width }).toBuffer()));
  const dest = path.join(OUT, name);
  await sharp(bufs, { join: { animated: true } })
    .gif({ delay, loop: 0, effort: 7, dither: 0.4, colours: 128, interFrameMaxError: 6 })
    .toFile(dest);
  const { size } = await stat(dest);
  console.log(`${name}: ${frames.length} frames, ${(size / 1e6).toFixed(2)} MB`);
}

const pick = (list, count) =>
  Array.from({ length: count }, (_, i) => list[Math.round((i * (list.length - 1)) / (count - 1))]);

// 1. Hero: the avatar turns its head left ↔ right (mouse-driven on the site). Ping-pong loop.
const heroDir = path.join(ROOT, 'public', 'left right');
const hero = (await readdir(heroDir)).filter((f) => f.endsWith('.jpg')).sort().map((f) => path.join(heroDir, f));
const heroOneWay = pick(hero, 26);
await makeGif('hero-turn.gif', [...heroOneWay, ...heroOneWay.slice(1, -1).reverse()], { width: 440, delay: 70 });

// 2. A chapter's scroll-driven 3D sequence ("The Way of Water").
const chapterDir = path.join(ROOT, 'public', 'optimized', 'frames', 'New folder (5)');
const chapter = (await readdir(chapterDir)).filter((f) => f.endsWith('.jpg')).sort().map((f) => path.join(chapterDir, f));
await makeGif('chapter-scroll.gif', pick(chapter, 34), { width: 440, delay: 90 });
