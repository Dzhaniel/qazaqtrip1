// scripts/ko-table.mjs — proofread кестесін шығарады: key | kk | ko
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const kk = JSON.parse(readFileSync(join(root, 'src/i18n/kk.json'), 'utf8'));
const ko = JSON.parse(readFileSync(join(root, 'src/i18n/ko.json'), 'utf8'));

function flat(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(out, flat(v, key));
    else out[key] = v;
  }
  return out;
}

const kkFlat = flat(kk);
const koFlat = flat(ko);
const keys = Object.keys(kkFlat).sort();

let rows = ['| key | kk | ko |', '|---|---|---|'];
let missing = [];
for (const k of keys) {
  const kkV = kkFlat[k];
  const koV = koFlat[k];
  if (koV === undefined) missing.push(k);
  const esc = (v) =>
    typeof v === 'string' ? v.replace(/\|/g, '\\|').replace(/\n/g, ' ') : JSON.stringify(v ?? '').slice(0, 120);
  rows.push(`| ${k} | ${esc(kkV)} | ${esc(koV)} |`);
}

writeFileSync(join(root, 'docs/ko-strings.md'), rows.join('\n') + '\n', 'utf8');
console.log(missing.length ? `MISSING KO: ${missing.join(', ')}` : `OK: ${keys.length} keys -> docs/ko-strings.md`);
