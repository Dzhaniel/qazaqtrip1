/**
 * Координаттар аудиті: кyzylorda.json-дағы әр орын үшін Nominatim (OSM)
 * сұрау жасап, үздік сәйкестіктіқ қазіргі координатаға дейінгі қашықтығымен шығарады.
 * Нәтиже: node_modules/.cache/coords-audit.json + stdout кестесі.
 * node scripts/audit-coords.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
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

const places = [
  ...data.attractions.map((a) => ({ id: a.id, type: 'attraction', name: a.name, address: a.address, lat: a.lat, lng: a.lng })),
  ...data.hotels.map((h) => ({ id: h.id, type: 'hotel', name: h.name, address: h.address, lat: h.lat, lng: h.lng })),
];

const out = [];
for (const p of places) {
  const queries = [
    `${p.name.ru}, Кызылорда`,
    `${p.name.kk}, Қызылорда`,
    `${p.address}, Қызылорда`,
  ].filter((q, i, arr) => arr.indexOf(q) === i && q.length > 4);

  let results = [];
  let usedQuery = '';
  for (const q of queries) {
    await sleep(1200);
    try {
      results = await nominatim(q);
      usedQuery = q;
      if (results.length > 0) break;
    } catch (e) {
      console.error('ERR', p.id, q, e.message);
      await sleep(3000);
      results = [];
    }
  }

  const top = results.map((r) => ({
    lat: Number(r.lat),
    lon: Number(r.lon),
    type: r.type,
    class: r.class,
    name: r.display_name?.split(',').slice(0, 3).join(', '),
    dist: p.lat != null ? Math.round(haversine(p.lat, p.lng, Number(r.lat), Number(r.lon))) : null,
  }));

  out.push({ id: p.id, type: p.type, kk: p.name.kk, addr: p.address, curLat: p.lat, curLng: p.lng, usedQuery, top });
  console.log(
    `${p.id} | cur=${p.lat},${p.lng} | q="${usedQuery}" | ` +
      top.map((r) => `${r.lat},${r.lon} (${r.dist}m, ${r.type})`).join(' || ') || 'NO RESULT',
  );
}

mkdirSync(join(__dirname, '..', 'node_modules/.cache'), { recursive: true });
writeFileSync(join(__dirname, '..', 'node_modules/.cache/coords-audit.json'), JSON.stringify(out, null, 2));
console.log('\nSaved to node_modules/.cache/coords-audit.json');
