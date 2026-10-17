import type { Lang, L10n, Ticket, Attraction, Hotel } from '../data/types';

/** Соединяет классы. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/**
 * Локализация контента из JSON: если строка — возвращаем как есть
 * (одноязычные поля данных, например notes), если {kk,en,ru} — берём язык.
 */
export function L(value: L10n | string | null | undefined, lang: Lang): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return value[lang] || value.kk;
}

/** Google Maps link из map_query (единое правило для всех «Бағдар алу»). */
export function mapsUrl(mapQuery: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
}

/** 12000 -> "12 000" (обычный пробел — удобно для копирования и сравнения). */
export function formatNumber(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** 12000 -> "12 000 ₸". */
export function formatKzt(n: number): string {
  return `${formatNumber(n)} ₸`;
}

export function formatRub(n: number): string {
  return `${formatNumber(n)} ₽`;
}

/**
 * Формат цены билета.
 * kind: 'free' | 'price' | 'unknown' | 'rub'
 * Для null — никогда не показываем 0 или выдуманное число.
 */
export function ticketDisplay(
  ticket: Ticket,
): { kind: 'free' | 'price' | 'unknown' | 'rub'; kzt?: number } {
  if (ticket.currency === 'RUB' || ticket.museum_audio_guide_rub != null) {
    return { kind: 'rub' };
  }
  if (ticket.adult_kzt === 0) return { kind: 'free' };
  if (ticket.adult_kzt == null) return { kind: 'unknown' };
  return { kind: 'price', kzt: ticket.adult_kzt };
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function parseDateStr(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / 86400000);
}

const LOCALES: Record<Lang, string> = { kk: 'kk-KZ', en: 'en-GB', ru: 'ru-RU' };

/** "2026-10-17" -> "17 қазан" / "17 Oct" / "17 октября". */
export function formatDateLabel(s: string, lang: Lang): string {
  const d = parseDateStr(s);
  if (!d) return '';
  return new Intl.DateTimeFormat(LOCALES[lang], { day: 'numeric', month: 'long' }).format(d);
}

export function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

export function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** 90 -> "90 мин", 480 -> "8 сағат" (локальные единицы). */
export function visitLabel(min: number, lang: Lang): string {
  const minUnit = { kk: 'мин', en: 'min', ru: 'мин' }[lang];
  const hourUnit = { kk: 'сағат', en: 'h', ru: 'ч' }[lang];
  if (min >= 60 && min % 60 === 0) return `${min / 60} ${hourUnit}`;
  return `${min} ${minUnit}`;
}

export function attractionMapsUrl(a: Attraction): string {
  return mapsUrl(a.map_query);
}

export function hotelPriceLabel(h: Hotel, t: (k: string) => string): string {
  if (h.price_from_kzt == null && h.price_to_kzt == null) {
    return t('common.price_unknown');
  }
  const from = h.price_from_kzt != null ? formatKzt(h.price_from_kzt) : null;
  const to = h.price_to_kzt != null ? formatKzt(h.price_to_kzt) : null;
  if (from && to) return `${from} – ${to} ${t('city.sights.per_night')}`;
  if (from) return `${from} ${t('city.sights.from')} ${t('city.sights.per_night')}`;
  return t('common.price_unknown');
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}
