/**
 * Фото Wikimedia Commons-тен жүктеп алады (CC лицензиялар) және
 * public/images/CREDITS.md — атрибуция жазба болады.
 * Қайта жүктеу: node scripts/fetch-images.mjs
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'public', 'images');

/** [localName, commonsFileTitle, thumbWidth] */
const FILES = [
  ['hero.jpg', 'Кызылорда, Акмешит.jpg', 1600],
  ['city-kyzylorda.jpg', 'Қызылорда қаласы.jpg', 1600],
  ['theater.jpg', 'Kyzylorda Theater.jpg', 1600],
  ['museum.jpg', 'Кызылорда, краеведческий музей, залы (1).jpg', 1600],
  ['central-square.jpg', 'Kyzylorda Central Square.jpg', 1600],
  ['syrdarya.jpg', 'Syr Darya river.jpg', 1600],
  ['aitbay-mosque.jpg', 'Кызылорда, мечеть Айтбая.jpg', 1600],
  ['korkyt-ata.jpg', 'Korkyt Ata Mausoleum in Kyzylorda Region 03.jpg', 1600],
  ['baikonur.jpg', 'Soyuz TMA-09M spacecraft at the Baikonur Cosmodrome launch pad (4).jpg', 1600],
  ['astana.jpg', 'View from Bayterek tower.jpg', 1200],
  ['almaty.jpg', 'Medeu, Almaty (P1180176).jpg', 1200],
  ['turkistan.jpg', 'Mausoleum of Khoja Ahmed Yasawi in Hazrat-e Turkestan, Kazakhstan.jpg', 1200],
  ['shymkent.jpg', 'Shymkent city downtown.jpg', 1200],
  ['aktau.jpg', 'Afternoon Caspian Seashore in Aktau city.jpg', 1200],
];

const api = (title, width) =>
  'https://commons.wikimedia.org/w/api.php?action=query&titles=' +
  encodeURIComponent('File:' + title) +
  '&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=' +
  width +
  '&format=json';

mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CREDITS_JSON = join(OUT, 'CREDITS.json');
let credits = [];
if (existsSync(CREDITS_JSON)) {
  try {
    credits = JSON.parse(readFileSync(CREDITS_JSON, 'utf8'));
  } catch {
    credits = [];
  }
}

for (const [local, title, width] of FILES) {
  const outFile = join(OUT, local);
  const known = credits.find((c) => c.file === local);
  if (existsSync(outFile) && known) {
    console.log('SKIP', local);
    continue;
  }
  await sleep(2500); // API rate limit
  const data = await (await fetch(api(title, width))).json();
  const page = Object.values(data?.query?.pages ?? {})[0];
  const ii = page?.imageinfo?.[0];
  if (!ii) {
    console.log('NOT FOUND:', title);
    continue;
  }
  const url = ii.thumburl ?? ii.url;
  const res = await fetch(url, { headers: { 'User-Agent': 'QazaqTrip/1.0 (contests project; contact: local)' } });
  if (!res.ok) {
    console.log('DOWNLOAD FAIL', res.status, title);
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(join(OUT, local), buf);
  const meta = ii.extmetadata ?? {};
  const clean = (s) => (s ? s.replace(/<[^>]+>/g, '').trim() : '');
  credits.push({
    file: local,
    title,
    author: clean(meta.Artist?.value),
    license: clean(meta.LicenseShortName?.value),
    source: ii.descriptionurl,
  });
  console.log('OK', local, (buf.length / 1024).toFixed(0) + 'KB', credits.at(-1).license);
  writeFileSync(CREDITS_JSON, JSON.stringify(credits, null, 2));
  await sleep(1200);
}

const md = [
  '# Суреттер (photo credits)',
  '',
  'Барлық суреттер [Wikimedia Commons](https://commons.wikimedia.org/) есебінен — Creative Commons лицензияларымен.',
  '',
  '| Файл | Автор | Лицензия | Дәйек |',
  '| --- | --- | --- | --- |',
  ...credits.map(
    (c) => `| \`${c.file}\` | ${c.author || '—'} | ${c.license || '—'} | [${c.title}](${c.source}) |`,
  ),
  '',
].join('\n');
writeFileSync(join(OUT, 'CREDITS.md'), md);
console.log('\nCREDITS.md written:', credits.length, 'files');
