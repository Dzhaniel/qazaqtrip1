/**
 * Смоук-тест демо-маршрут құрастырғышы (npm run smoke).
 * esbuild арқылы TS-ті бандлдайды және нақты келісімдерді тексереді.
 */
import { readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert';
import { build } from 'esbuild';

const dir = mkdtempSync(join(tmpdir(), 'qazaqtrip-'));
const outfile = join(dir, 'demo-itinerary.mjs');

await build({
  entryPoints: [join(process.cwd(), 'src/lib/demoItinerary.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node18',
  outfile,
});

const mod = await import(pathToFileURL(outfile).href);
const data = JSON.parse(readFileSync(join(process.cwd(), 'src/data/cities/kyzylorda.json'), 'utf8'));

/* --- Сценарий 1: театр + мәдениет, 3 күн, орташа бюджет, қазақша --- */
const r1 = mod.buildDemoItinerary(data, {
  arrival: '2026-10-17',
  departure: '2026-10-19',
  travelers: 2,
  budgetLevel: 'medium',
  interests: ['theatre', 'culture'],
  language: 'kk',
});
assert.strictEqual(r1.itinerary.days.length, 3, 'days length');
const allCosts = r1.itinerary.days.flatMap((d) => d.items.map((i) => i.costLabel ?? ''));
assert.ok(!allCosts.some((c) => /(^|\D)0(\D|$)/.test(c)), 'no "0" prices: ' + JSON.stringify(allCosts));
assert.ok(r1.itinerary.budget.some((b) => b.known && b.kzt === 300 * 2), 'museum ticket 2x300 in budget');
assert.ok(r1.itinerary.budget.some((b) => b.kind === 'hotel' && b.kzt === 12000 * 2), 'medium hotel 12000 x 2 nights');
assert.ok(r1.answerText.includes('нақтыланбаған') || r1.itinerary.unknownPrices.length > 0, 'unknown prices marked');
assert.ok(!r1.answerText.includes('undefined'), 'no undefined in text');

/* --- Сценарий 2: ғарыш (Байқоңыр) — рұқсат міндетті, RUB сақталады --- */
const r2 = mod.buildDemoItinerary(data, {
  arrival: '2026-11-02',
  departure: '2026-11-05',
  travelers: 1,
  budgetLevel: 'economy',
  interests: ['space', 'history'],
  language: 'kk',
});
const baikonurDay = r2.itinerary.days.find((d) => d.items.some((i) => i.placeId === 'baikonur'));
assert.ok(baikonurDay, 'baikonur day exists');
assert.ok(baikonurDay.items.some((i) => i.warning && i.warning.length > 50), 'permit warning present');
assert.ok(r2.itinerary.notes.some((n) => n.includes('Байқоңыр')), 'permit note present');
const rubLines = r2.itinerary.budget.filter((b) => b.rub);
assert.ok(rubLines.length >= 2, 'rub budget lines');
assert.ok(rubLines.every((b) => b.rub != null && b.kzt == null), 'rub not mixed into kzt');
assert.ok(r2.answerText.includes('7 400 ₽'), 'RUB total shown, not converted (400+7000 for 1 person)');
const baikonurCosts = baikonurDay.items.map((i) => i.costLabel);
assert.ok(baikonurCosts.includes('400 ₽') && baikonurCosts.includes('7 000 ₽'), 'baikonur costs in RUB');

/* --- Сценарий 3: күндерсіз, қызығушылықсыз, орысша — 2 күн, қалалық жоспар --- */
const r3 = mod.buildDemoItinerary(data, {
  arrival: '',
  departure: '',
  travelers: 4,
  budgetLevel: 'high',
  interests: [],
  language: 'ru',
});
assert.strictEqual(r3.itinerary.days.length, 2);
assert.ok(/Кызылорд/.test(r3.answerText), 'city name in russian text');
assert.ok(r3.itinerary.budget.some((b) => b.kind === 'hotel' && b.kzt === 22000 * 1), 'high hotel 22000');
assert.ok(r3.itinerary.unknownPrices.length > 0, 'unknown prices listed');

/* --- Сценарий 4: 1 күн — қаладан тыс қосылмайды, ескерту бар --- */
const r4 = mod.buildDemoItinerary(data, {
  arrival: '2026-12-01',
  departure: '2026-12-01',
  travelers: 1,
  budgetLevel: 'economy',
  interests: ['space'],
  language: 'en',
});
assert.strictEqual(r4.itinerary.days.length, 1);
assert.ok(!r4.itinerary.days.some((d) => d.items.some((i) => i.placeId === 'baikonur')), 'no baikonur in 1-day plan');
assert.ok(r4.itinerary.notes.some((n) => /permit/i.test(n)), 'permit note for 1-day plan');

console.log('OK: all smoke assertions passed');
console.log('\n--- Сценарий 1 жауабы (казахша) ---\n');
console.log(r1.answerText);
