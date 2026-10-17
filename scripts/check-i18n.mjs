/**
 * Проверка i18n: каждый ключ t('...') в src должен существовать в kk/en/ru JSON.
 * npm run check-i18n
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'src');

const dicts = {};
for (const lang of ['kk', 'en', 'ru']) {
  dicts[lang] = JSON.parse(readFileSync(join(root, 'src/i18n', `${lang}.json`), 'utf8'));
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

// Динамические шаблоны -> конкретные ключи (общие, без привязки к имени переменной)
const CAT_KEYS = ['history', 'monument', 'nature', 'theatre', 'museum', 'religious', 'market', 'park', 'space'].map((c) => `city.sights.cat_${c}`);
const DYNAMIC = [
  { re: /nav\..*\$\{[^}]*\}/, keys: ['nav.home', 'nav.city', 'nav.guide', 'nav.about'] },
  { re: /city\.sections\..*\$\{[^}]*\}/, keys: ['city.sections.sights', 'city.sections.hotels', 'city.sections.map', 'city.sections.phrases', 'city.sections.guide'] },
  { re: /city\.sights\.cat_.*\$\{[^}]*\}/, keys: CAT_KEYS },
  { re: /city\.sights\..*\$\{[^}]*\}/, keys: CAT_KEYS },
  { re: /city\..*\$\{[^}]*\}/, keys: ['city.air', 'city.train', 'city.bus'] },
  { re: /guide\.lang_.*\$\{[^}]*\}/, keys: ['guide.lang_kk', 'guide.lang_en', 'guide.lang_ru'] },
  { re: /guide\.budget_level\..*\$\{[^}]*\}/, keys: ['guide.budget_level.economy', 'guide.budget_level.medium', 'guide.budget_level.high'] },
  { re: /city\.sights\.results_.*\$\{[^}]*\}/, keys: ['city.sights.results_one', 'city.sights.results_few', 'city.sights.results_many'] },
  { re: /city\.hotels\.results_.*\$\{[^}]*\}/, keys: ['city.hotels.results_one', 'city.hotels.results_few', 'city.hotels.results_many'] },
  { re: /why\.items\..*\$\{[^}]*\}\.title/, keys: ['steppe', 'language', 'hospitality', 'history'].map((k) => `why.items.${k}.title`) },
  { re: /why\.items\..*\$\{[^}]*\}\.text/, keys: ['steppe', 'language', 'hospitality', 'history'].map((k) => `why.items.${k}.text`) },
  { re: /guide\.itinerary\..*\$\{[^}]*\}/, keys: ['guide.itinerary.ticket', 'guide.itinerary.hotel', 'guide.itinerary.tour', 'guide.itinerary.other'] },
];

const files = walk(srcDir);
const usedKeys = new Set();
const literalRe = /\bt\(\s*['"]([a-zA-Z0-9_.]+)['"]/g;
const tplRe = /\bt\(\s*`([^`]+)`/g;

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  let m;
  while ((m = literalRe.exec(text)) !== null) usedKeys.add(m[1]);
  while ((m = tplRe.exec(text)) !== null) {
    const tpl = m[1];
    const found = DYNAMIC.find((d) => d.re.test(tpl));
    if (found) found.keys.forEach((k) => usedKeys.add(k));
    else usedKeys.add(tpl.replace(/\$\{[^}]*\}/g, ''));
  }
}

function getPath(dict, key) {
  return key.split('.').reduce((o, k) => (o == null ? o : o[k]), dict);
}

let missing = 0;
for (const key of [...usedKeys].sort()) {
  for (const lang of ['kk', 'en', 'ru']) {
    if (getPath(dicts[lang], key) === undefined) {
      console.error(`MISSING [${lang}] ${key}`);
      missing++;
    }
  }
}

console.log(`Проверено ключей: ${usedKeys.size}`);
if (missing > 0) {
  console.error(`Не хватает: ${missing}`);
  process.exit(1);
}
console.log('OK: все i18n-ключи на месте (kk/en/ru)');
