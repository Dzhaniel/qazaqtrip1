import type { CityData } from '../types';
import kyzylordaJson from './kyzylorda.json';

/**
 * Единоственный источник данных приложения — JSON-файлы городов.
 * Чтобы добавить новый город:
 *   1) положите файл с той же структурой сюда: /src/data/cities/<id>.json
 *   2) добавьте один import и одну строку в cities (ниже).
 * Больше ничего менять не нужно.
 */
const kyzylorda = kyzylordaJson as unknown as CityData;

export const cities: Record<string, CityData> = {
  kyzylorda,
};

export function getCity(id: string): CityData | undefined {
  return cities[id];
}

/** Города «Жақында» (coming soon) — карточки на главной, без данных. */
export interface ComingSoonCity {
  id: string;
  name: { kk: string; en: string; ru: string };
  region: { kk: string; en: string; ru: string };
}

export const comingSoonCities: ComingSoonCity[] = [
  {
    id: 'astana',
    name: { kk: 'Астана', en: 'Astana', ru: 'Астана' },
    region: { kk: 'Астана қаласы', en: 'Astana city', ru: 'г. Астана' },
  },
  {
    id: 'almaty',
    name: { kk: 'Алматы', en: 'Almaty', ru: 'Алматы' },
    region: { kk: 'Алматы қаласы', en: 'Almaty city', ru: 'г. Алматы' },
  },
  {
    id: 'turkistan',
    name: { kk: 'Түркістан', en: 'Turkistan', ru: 'Туркестан' },
    region: { kk: 'Түркістан облысы', en: 'Turkistan Region', ru: 'Туркестанская область' },
  },
  {
    id: 'shymkent',
    name: { kk: 'Шымкент', en: 'Shymkent', ru: 'Шымкент' },
    region: { kk: 'Шымкент қаласы', en: 'Shymkent city', ru: 'г. Шымкент' },
  },
  {
    id: 'aktau',
    name: { kk: 'Ақтау', en: 'Aktau', ru: 'Акtau' },
    region: { kk: 'Маңғыстау облысы', en: 'Mangystau Region', ru: 'Мангистауская область' },
  },
];
