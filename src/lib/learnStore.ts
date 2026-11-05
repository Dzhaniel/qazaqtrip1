/**
 * Үйрену жағдайы (learning state): safe localStorage.
 * Егер storage қолжетімсіз болса (private mode / ескі браузер) — memory-де ұстап,
 * ешқашан crash-теспейміз.
 */

const memory = new Map<string, unknown>();

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw != null) return JSON.parse(raw) as T;
    return fallback;
  } catch {
    return (memory.get(key) as T) ?? fallback;
  }
}

export function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    memory.set(key, value);
  }
}

/* ------------------------------------------------------------------ */
/* Тұрақты кілттер                                                     */
/* ------------------------------------------------------------------ */
export const KEYS = {
  learned: 'qazaqtrip_learned_phrases', // string[]
  favorites: 'qazaqtrip_favorites', // string[]
  leitner: 'qazaqtrip_leitner', // Record<id, { box: 1|2|3 }>
  streak: 'qazaqtrip_streak', // { last: 'YYYY-MM-DD', count: number }
  badges: 'qazaqtrip_badges', // BadgeId[]
  routeDeck: 'qazaqtrip_route_deck', // RoutePhrase[]
  itineraryDone: 'qazaqtrip_itinerary_done', // boolean
} as const;

/** Маршрут көрсетілді → flag (badge «Қала білгірі» үшін). */
export function touchItinerary(): void {
  saveJSON(KEYS.itineraryDone, true);
}

/* ------------------------------------------------------------------ */
/* Leitner (жад карточкалары): box 1 — жиі, 2 — сейрек, 3 — ең сейрек    */
/* ------------------------------------------------------------------ */
export type LeitnerState = Record<string, { box: 1 | 2 | 3 }>;

export function loadLeitner(): LeitnerState {
  return loadJSON<LeitnerState>(KEYS.leitner, {});
}

/** Білемін → box+1 (макс 3); білмеймін → box 1. Жаңа сөз → box 1. */
export function answerLeitner(id: string, knows: boolean): LeitnerState {
  const st = loadLeitner();
  const box: 1 | 2 | 3 = knows ? Math.min(3, (st[id]?.box ?? 1) + 1) as 1 | 2 | 3 : 1;
  const next = { ...st, [id]: { box } };
  saveJSON(KEYS.leitner, next);
  return next;
}

/* ------------------------------------------------------------------ */
/* Streak (күн санағы)                                                  */
/* ------------------------------------------------------------------ */
export interface StreakState {
  last: string; // YYYY-MM-DD
  count: number;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

/** Бет ашылғанда шақырылады: бүгін белсенді болса — streak жалғасады. */
export function touchStreak(): StreakState {
  const today = todayStr();
  const s = loadJSON<StreakState>(KEYS.streak, { last: '', count: 0 });
  if (s.last === today) return s;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const next = { last: today, count: s.last === yesterday ? s.count + 1 : 1 };
  saveJSON(KEYS.streak, next);
  return next;
}

/* ------------------------------------------------------------------ */
/* Достижения (badges)                                                  */
/* ------------------------------------------------------------------ */
export type BadgeId = 'first_quiz' | 'words_10' | 'words_25' | 'words_50' | 'city_master' | 'listener';

export function loadBadges(): BadgeId[] {
  return loadJSON<BadgeId[]>(KEYS.badges, []);
}

/** Жаңа badge ашылса true қайтарады (UI «топ-топ» эффектісі үшін). */
export function unlockBadge(id: BadgeId): boolean {
  const list = loadBadges();
  if (list.includes(id)) return false;
  list.push(id);
  saveJSON(KEYS.badges, list);
  return true;
}

/* ------------------------------------------------------------------ */
/* Маршрут сөздері (A8): гид маршруттарынан қосылған сөздер               */
/* ------------------------------------------------------------------ */
export interface RoutePhrase {
  id: string;
  kk: string;
  translit: string;
  /** Aударма — жауап тіліндегі қарапайым мәтін */
  meaning: string;
}

export function loadRouteDeck(): RoutePhrase[] {
  return loadJSON<RoutePhrase[]>(KEYS.routeDeck, []);
}

/** Маршрут аялдамасының сөздерін deck-ке қосады (қайталанбас). */
export function addRoutePhrases(phrases: RoutePhrase[]): number {
  const deck = loadRouteDeck();
  const ids = new Set(deck.map((p) => p.id));
  const added = phrases.filter((p) => !ids.has(p.id));
  if (added.length > 0) {
    saveJSON(KEYS.routeDeck, [...deck, ...added]);
  }
  return added.length;
}
