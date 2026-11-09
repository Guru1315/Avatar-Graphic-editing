
import { readdir, mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';

const PUBLIC = path.resolve(import.meta.dirname, '..', 'public');
const OUT = path.join(PUBLIC, 'optimized');

const FRAME_FOLDERS = ['New folder', 'New folder (2)', 'New folder (3)', 'New folder (4)', 'New folder (5)'];
const IMAGE_RE = /\.(jpe?g|png|webp)$/i;

sharp.concurrency(1);
const WORKERS = Math.max(2, Math.min(8, os.cpus().length - 1));

async function isFresh(src, dest) {
  if (!existsSync(dest)) return false;
  const [s, d] = await Promise.all([stat(src), stat(dest)]);
  return d.mtimeMs >= s.mtimeMs;
}

async function runPool(jobs) {
  let next = 0, done = 0, skipped = 0;
  async function worker() {
    while (next < jobs.length) {
      const job = jobs[next++];
      if (await isFresh(job.src, job.dest)) { skipped++; continue; }
      await mkdir(path.dirname(job.dest), { recursive: true });
      await job.run();
      done++;
      if (done % 50 === 0) console.log(`  ${done} written...`);
    }
  }
  await Promise.all(Array.from({ length: WORKERS }, worker));
  return { done, skipped };
}

const jobs = [];

// On Vercel the original images are excluded from the upload (.vercelignore) and the
// already-generated public/optimized/ copies are deployed as-is, so skip missing sources.
const listImages = async (dir) => {
  if (!existsSync(dir)) {
    console.log(`  (skipping ${path.relative(PUBLIC, dir)}: originals not present)`);
    return [];
  }
  return (await readdir(dir)).filter((f) => IMAGE_RE.test(f));
};

for (const folder of FRAME_FOLDERS) {
  const files = await listImages(path.join(PUBLIC, folder));
  for (const file of files) {
    const src = path.join(PUBLIC, folder, file);
    const dest = path.join(OUT, 'frames', folder, file.replace(IMAGE_RE, '.jpg'));
    jobs.push({
      src, dest,
      run: () => sharp(src).resize({ width: 1920, withoutEnlargement: true })
        .jpeg({ quality: 80, mozjpeg: true }).toFile(dest),
    });
  }
}

const galleryDir = path.join(PUBLIC, 'gallery section');
for (const file of await listImages(galleryDir)) {
  const src = path.join(galleryDir, file);
  const base = file.replace(IMAGE_RE, '.webp');
  jobs.push({
    src, dest: path.join(OUT, 'gallery', 'thumb', base),
    run: () => sharp(src, { limitInputPixels: false }).resize({ width: 960, withoutEnlargement: true })
      .webp({ quality: 78 }).toFile(path.join(OUT, 'gallery', 'thumb', base)),
  });
  jobs.push({
    src, dest: path.join(OUT, 'gallery', 'full', base),
    run: () => sharp(src, { limitInputPixels: false }).resize({ width: 2560, withoutEnlargement: true })
      .webp({ quality: 85 }).toFile(path.join(OUT, 'gallery', 'full', base)),
  });
}

console.log(`Optimizing ${jobs.length} images with ${WORKERS} workers...`);
const t0 = Date.now();
const { done, skipped } = await runPool(jobs);
console.log(`Done in ${((Date.now() - t0) / 1000).toFixed(1)}s: ${done} written, ${skipped} already up to date.`);
