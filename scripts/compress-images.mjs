/**
 * public/images суреттерін қысқартады (in-place).
 * node scripts/compress-images.mjs
 */
import sharp from 'sharp';
import { readdirSync, statSync, writeFileSync, renameSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'images');

// max ширина (px) и качество jpeg по файлам
const PRESETS = {
  'hero.jpg': { width: 1600, quality: 72 },
  'city-kyzylorda.jpg': { width: 1600, quality: 72 },
  'astana.jpg': { width: 1000, quality: 72 },
  'almaty.jpg': { width: 1000, quality: 72 },
  'turkistan.jpg': { width: 1000, quality: 72 },
  'shymkent.jpg': { width: 1000, quality: 72 },
  'aktau.jpg': { width: 1000, quality: 72 },
};
const DEFAULT = { width: 1200, quality: 74 };

let before = 0;
let after = 0;
for (const f of readdirSync(dir)) {
  if (!f.toLowerCase().endsWith('.jpg')) continue;
  const p = join(dir, f);
  const b = statSync(p).size;
  before += b;
  const preset = PRESETS[f] ?? DEFAULT;
  const buf = await sharp(p)
    .resize({ width: preset.width, height: preset.width, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: preset.quality, progressive: true, mozjpeg: true })
    .toBuffer();
  const tmp = p + '.tmp';
  writeFileSync(tmp, buf);
  try {
    renameSync(tmp, p);
  } catch {
    rmSync(tmp, { force: true });
    throw new Error('Не удалось перезаписать ' + f + ' (файл занят?)');
  }
  const a = buf.length;
  after += a;
  console.log(f, (b / 1024).toFixed(0) + 'KB ->', (a / 1024).toFixed(0) + 'KB');
}
console.log(`\nITOG: ${(before / 1048576).toFixed(2)}MB -> ${(after / 1048576).toFixed(2)}MB`);
