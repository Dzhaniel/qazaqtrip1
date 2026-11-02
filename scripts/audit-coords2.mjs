/**
 * Аудит 2-раунд: қолмен құрастырылған сұраулар (OSM-дағы атақтарға жақынырақ).
 * node scripts/audit-coords2.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(
  readFileSync(join(__dirname, '..', 'src/data/cities/kyzylorda.json'), 'utf8'),
);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

async function nominatim(q) {
  const url =
    'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=3&addressdetails=1&q=' +
    encodeURIComponent(q);
  const res = await fetch(url, { headers: { 'User-Agent': 'QazaqTrip-dev/1.0 (contest project, contact: local)' } });
  if (!res.ok) throw new Error('nominatim ' + res.status);
  return res.json();
}

const QUERIES = {
  baikonur: 'Космодром Байконур',
  'korkyt-ata-park': 'Парк Коркыт ата, Кызылорда',
  'syr-ana-monument': 'Площадь Тагзым, Кызылорда',
  'first-president-park-embankment': 'Набережная Сырдарьи, Кызылорда',
  'central-square-drama-theatre': 'Центральная площадь, Кызылорда',
  'regional-history-museum': 'Краеведческий музей, Кызылорда',
  'akmeshit-museum': 'Музей Акмешит, Кызылорда',
  'aitbayev-art-gallery': 'Галерея Айтбаев, Кызылорда',
  'philharmonic-palace-of-arts': 'Филармония, Кызылорда',
  'akmeshit-syrdarya-mosque': 'Центральная мечеть, Кызылорда',
  'aitbay-mosque': 'Мечеть Айтбая, Кызылорда',
  'kazan-church': 'Свято-Казанский храм, Кызылорда',
  'old-bazaar-sybaga': 'Базар Сыбага, Кызылорда',
  'victory-park-obelisk': 'Парк Победы, Кызылорда',
  'city-culture-park': 'Городской парк, Кызылорда',
  'shukenov-park': 'Парк Шукенова, Кызылорда',
  'hotel-syrdarya': 'Гостиница Сырдарья, Кызылорда',
  'hotel-kyzylorda': 'Гостиница Кызылорда, Кызылорда',
  'hotel-syr-arna': 'Syr Arna, Кызылорда',
  'hotel-sapar-de-lux': 'Sapar De Lux, Кызылорда',
  'hostel-meruert': 'Meruert, Кызылорда',
};

const all = {
  ...Object.fromEntries(data.attractions.map((a) => [a.id, { lat: a.lat, lng: a.lng, kk: a.name.kk }])),
  ...Object.fromEntries(data.hotels.map((h) => [h.id, { lat: h.lat, lng: h.lng, kk: h.name.kk }])),
};

const out = {};
for (const [id, q] of Object.entries(QUERIES)) {
  await sleep(1300);
  let results = [];
  try {
    results = await nominatim(q);
  } catch (e) {
    console.error('ERR', id, e.message);
    await sleep(3000);
  }
  const p = all[id];
  out[id] = {
    q,
    kk: p?.kk,
    cur: p ? [p.lat, p.lng] : null,
    top: results.map((r) => ({
      lat: Number(r.lat),
      lon: Number(r.lon),
      type: r.type,
      name: r.display_name?.split(',').slice(0, 4).join(', '),
      dist: p?.lat != null ? Math.round(haversine(p.lat, p.lng, Number(r.lat), Number(r.lon))) : null,
    })),
  };
  console.log(
    id + ' | q="' + q + '" | ' +
      (out[id].top.map((r) => r.lat.toFixed(5) + ',' + r.lon.toFixed(5) + ' (' + r.dist + 'm ' + r.type + ')').join(' || ') || 'NO RESULT'),
  );
}

writeFileSync(join(__dirname, '..', 'node_modules/.cache/coords-audit2.json'), JSON.stringify(out, null, 2));
console.log('\nSaved coords-audit2.json');
