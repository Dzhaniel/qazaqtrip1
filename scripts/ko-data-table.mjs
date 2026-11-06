// scripts/ko-data-table.mjs — proofread кестесі: барлық корейше атау/мәтін (kk | ko | notes)
// docs/ko-data-names.md жасайды. Іске қосу: node scripts/ko-data-table.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const d = JSON.parse(readFileSync(join(root, 'src/data/cities/kyzylorda.json'), 'utf8'));
// cities/index.ts — статикалы дерек (скрипт Node-.ts импорттай алмайды, сондықтан мұнда қайталанды)
const comingSoonCities = [
  { id: 'astana', regionKo: '아스타나시' },
  { id: 'almaty', regionKo: '알마티시' },
  { id: 'turkistan', regionKo: '투르키스탄주' },
  { id: 'shymkent', regionKo: '심켄트시' },
  { id: 'aktau', regionKo: '망기스타우주' },
];

// «translit/guess» белгілері — қолмен жиналған notes (id -> note)
const NOTES = {
  'korkyt-ata-memorial': '«кооркит ата» — қазақшадан фонетикалық транслитерация; «мемориалдық кешен → 기념 시설» — таңдау (алтернатива: 기념관)',
  baikonur: 'байконур — бекітілген корей атауы (стандарт)',
  'korkyt-ata-park': 'brief-тегі мысал бойынша: 코르키т а타',
  'syr-ana-monument': '«Сыр-ана → 시르-아나» — транслитерация',
  'first-president-park-embankment': '«Тұңғыш Президент → 첫 대통령» — таңдау (алтернатива: 초대 대통령); «жағалау → 강변 산책로»',
  'central-square-drama-theatre': '«Бекежанов → 베케자노프» — транслитерация',
  'regional-history-museum': '«өлкетану → 향토» (местный краеведение); «облыстық → 주»',
  'akmeshit-museum': '«Ақмешіт → 압메시т» — транслитерация (б.р. 액메시트 нұсқасы бар)',
  'aitbayev-art-gallery': '«Айтбаев → 아트바이에프» — транслитерация; «галерея → 미술관»',
  'philharmonic-palace-of-arts': '«Өнер сарайы → 예술의 전당» — бекітілген',
  'akmeshit-syrdarya-mosque': '«Ақмешіт → 압메시т», «Сырдария → 시르다리야» — транслитерация',
  'aitbay-mosque': '«Айтбай → 아트바이» — транслитерация',
  'kazan-church': '«Қасиетті Қазан шіркеуі → 성 카잔 성당» — таңдау (ортодокс шіркеуі); «Казан → 카잔» транслитерация',
  'old-bazaar-sybaga': '«Сыбаға → 시바가», «Ескі базар → 구 시장» — транслитерация/таңдау',
  'victory-park-obelisk': '«Тағзым → 타즈ым» — транслитерация; «обелиск → 기념탑»',
  'city-culture-park': '«Қалалық мәдениет және демалыс саябағы → 시립 문화·휴양 공원» — табиғи корейше',
  'shukenov-park': '«Батырхан Шүкенов → 바티르한 슈케노프» — транслитерация',
  'hotel-syrdarya': '«Сырдария → 시르다리야» — транслитерация',
  'hotel-kyzylorda': '«Қызылорда → 크질오르да» (brief-тегі бекітілген)',
  'hotel-syr-arna': '«Syr Arna → 시르 아르나» — транслитерация',
  'hotel-sapar-de-lux': 'латин бренд атауы сақталды (Sapar De Lux Hotel)',
  'hostel-meruert': 'латин бренд атауы сақталды (Meruert Hostel)',
};

const esc = (s) => (s ?? '').replace(/\|/g, '\\|');

let rows = [];
rows.push('# QazaqTrip — коорейше дерек аудармалары (proofread)');
rows.push('');
rows.push('Барлық жаңа ко мәлімет `ko_reviewed: false` — native тексеру күтуде.');
rows.push('Атау көрсету форматы: **коорейше** + кіші қазақша (компонентте `nameParts()`)');
rows.push('');
rows.push('## Қала');
rows.push('');
rows.push('| kk | ko | notes |');
rows.push('|---|---|---|');
rows.push(`| ${d.city.name.kk} | ${d.city.name.ko} | brief-тегі бекітілген атау |`);
rows.push(`| ${d.city.region.kk} | ${d.city.region.ko} | облыс → 주 |`);
rows.push('');
rows.push('## «Қалай жетуге» (getting there)');
rows.push('');
rows.push('| өріс | kk | ko |');
rows.push('|---|---|---|');
for (const g of d.city.getting_there) {
  rows.push(`| ${g.type} атауы | ${g.name.kk} | ${g.name.ko} |`);
  if (g.address) rows.push(`| ${g.type} мекенжайы | ${esc(g.address)} | ${esc(g.address_ko ?? '—')} |`);
  if (g.hours) rows.push(`| ${g.type} уақыты | ${esc(g.hours)} | ${esc(g.hours_ko ?? '—')} |`);
  if (g.note) rows.push(`| ${g.type} note | ${esc(g.note.kk)} | ${esc(g.note.ko)} |`);
}
rows.push('');
rows.push('## Көрікті орындар (attractions)');
rows.push('');
rows.push('| id | атау kk | атау ko | notes |');
rows.push('|---|---|---|---|');
for (const a of d.attractions) {
  rows.push(`| ${a.id} | ${esc(a.name.kk)} | ${esc(a.name.ko)} | ${NOTES[a.id] ?? '—'} |`);
}
rows.push('');
rows.push('### Сипаттама / мекенжай / билет-ескертпелер');
rows.push('');
rows.push('| id | өріс | kk | ko |');
rows.push('|---|---|---|---|');
for (const a of d.attractions) {
  rows.push(`| ${a.id} | short | ${esc(a.short.kk)} | ${esc(a.short.ko)} |`);
  rows.push(`| ${a.id} | address | ${esc(a.address)} | ${esc(a.address_ko ?? '—')} |`);
  if (a.travel_note) rows.push(`| ${a.id} | travel_note | ${esc(a.travel_note.kk)} | ${esc(a.travel_note.ko)} |`);
  if (a.hours && typeof a.hours === 'object') rows.push(`| ${a.id} | hours | ${esc(a.hours.kk)} | ${esc(a.hours.ko)} |`);
  if (a.ticket.note) rows.push(`| ${a.id} | ticket.note | ${esc(a.ticket.note)} | ${esc(a.ticket.note_ko ?? '—')} |`);
  if (a.notes) rows.push(`| ${a.id} | notes | ${esc(a.notes.kk)} | ${esc(a.notes.ko)} |`);
  if (a.etiquette) rows.push(`| ${a.id} | etiquette | ${esc(a.etiquette.kk)} | ${esc(a.etiquette.ko)} |`);
  if (a.permit) {
    rows.push(`| ${a.id} | permit | ${esc(a.permit.kk)} | ${esc(a.permit.ko)} |`);
    if (a.permit.recommendation) rows.push(`| ${a.id} | permit.rec | ${esc(a.permit.recommendation)} | ${esc(a.permit.recommendation_ko)} |`);
  }
  if (a.warnings) rows.push(`| ${a.id} | warnings | ${esc(a.warnings.kk)} | ${esc(a.warnings.ko)} |`);
}
rows.push('');
rows.push('## Қонақүйлер (hotels)');
rows.push('');
rows.push('| id | атау kk | атау ko | notes |');
rows.push('|---|---|---|---|');
for (const h of d.hotels) {
  rows.push(`| ${h.id} | ${esc(h.name.kk)} | ${esc(h.name.ko)} | ${NOTES[h.id] ?? '—'} |`);
}
rows.push('');
rows.push('| id | өріс | kk | ko |');
rows.push('|---|---|---|---|');
for (const h of d.hotels) {
  if (h.price_note) rows.push(`| ${h.id} | price_note | ${esc(h.price_note)} | ${esc(h.price_note_ko ?? '—')} |`);
  rows.push(`| ${h.id} | address | ${esc(h.address)} | ${esc(h.address_ko ?? '—')} |`);
  if (h.district) rows.push(`| ${h.id} | district | ${esc(h.district.kk)} | ${esc(h.district.ko)} |`);
}
rows.push('');
rows.push('## Жергілікті тағам (local food)');
rows.push('');
rows.push('| өріс | kk | ko |');
rows.push('|---|---|---|');
rows.push(`| note | ${esc(d.local_food.note)} | ${esc(d.local_food.note_ko)} |`);
d.local_food.items.forEach((it) => rows.push(`| item | ${esc(it.kk)} | ${esc(it.ko)} |`));
rows.push('');
rows.push('## Қызығушылық опциялары (interest options)');
rows.push('');
rows.push('| id | kk | ko |');
rows.push('|---|---|---|');
for (const o of d.interest_options) rows.push(`| ${o.id} | ${o.kk} | ${o.ko} |`);

if (comingSoonCities.length) {
  rows.push('');
  rows.push('## Жақында қалалар (coming soon — cities/index.ts)');
  rows.push('');
  rows.push('| id | region ko |');
  rows.push('|---|---|');
  for (const c of comingSoonCities) rows.push(`| ${c.id} | ${c.regionKo} |`);
}

writeFileSync(join(root, 'docs/ko-data-names.md'), rows.join('\n') + '\n', 'utf8');
console.log('OK: docs/ko-data-names.md жасалды (' + rows.length + ' жол)');
