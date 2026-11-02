/**
 * Автоматическая проверка координат kyzylorda.json:
 *  - у каждого места (кроме day_trip с пометкой) координаты обязаны быть;
 *  - городские места обязаны лежать в границах города Кызылорда;
 *  - day_trip — в границах области (Байконур и Коркыт ата — за городом).
 * При провале — exit 1 (не даст закоммитить «слетевшие» пины).
 * node scripts/verify-coords.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(
  readFileSync(join(__dirname, '..', 'src/data/cities/kyzylorda.json'), 'utf8'),
);

// Границы города Кызылорда (bbox) и области для day_trip
const CITY_BOX = { minLat: 44.72, maxLat: 44.95, minLng: 65.38, maxLng: 65.62 };
const REGION_BOX = { minLat: 44.4, maxLat: 46.3, minLng: 62.5, maxLng: 65.8 };

function inBox(lat, lng, box) {
  return lat >= box.minLat && lat <= box.maxLat && lng >= box.minLng && lng <= box.maxLng;
}

const errors = [];
const report = [];

for (const a of data.attractions) {
  const box = a.type === 'day_trip' ? REGION_BOX : CITY_BOX;
  const row = {
    id: a.id,
    name: a.name.kk,
    type: a.type,
    lat: a.lat,
    lng: a.lng,
    verified: a.coords_verified,
  };
  if (a.lat == null || a.lng == null) {
    errors.push(`${a.id}: нет координат`);
    report.push(row);
    continue;
  }
  if (!inBox(a.lat, a.lng, box)) {
    errors.push(`${a.id}: координаты вне границ (${a.lat}, ${a.lng})`);
  }
  report.push(row);
}

for (const h of data.hotels) {
  const row = { id: h.id, name: h.name.kk, type: 'hotel', lat: h.lat, lng: h.lng, verified: h.coords_verified };
  if (h.lat == null || h.lng == null) {
    errors.push(`${h.id}: нет координат`);
    report.push(row);
    continue;
  }
  if (!inBox(h.lat, h.lng, CITY_BOX)) {
    errors.push(`${h.id}: координаты вне границ города (${h.lat}, ${h.lng})`);
  }
  report.push(row);
}

console.log('=== Отчёт о координатах ===');
for (const r of report) {
  const coords = r.lat == null ? '—' : `${r.lat}, ${r.lng}`;
  const mark = r.verified ? 'verified' : 'NOT VERIFIED';
  console.log(`${r.id.padEnd(36)} ${String(coords).padEnd(20)} ${mark}`);
}

if (errors.length > 0) {
  console.error('\nОШИБКИ:');
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log('\nOK: все координаты на месте и в границах.');
