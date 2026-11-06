/**
 * useItineraryLang — генерациядан кейін UI тілін ауыстырғанда жолды ҚАЙТА ҚҰРМайды.
 *
 * - Демо режим: маршрут локальді (детерминделген) жаңа тілде қайта құрылады — бірге дайын;
 * - AI режим: дерек-өрістер (атау/мекенжай/баға/уақыт/фразалар) localizeItinerary-мен
 *   ДАРАЛАЙ локальдейді; AI жазған мәтіндер (summary, day title, tip, notes, budget
 *   label) кіші translate-сұраныспен аударылады (cache: route_id+lang, loading state,
 *   қате болса бұрынғы тілде қалады — fallback).
 */
import { useEffect, useRef, useState } from 'react';
import type { CityData, Lang } from '../data/types';
import {
  buildDemoItinerary,
  type AiTexts,
  type GuideForm,
  type Itinerary,
} from './demoItinerary';
import { localizeItinerary } from './itineraryLocalize';
import { translateGuideTexts } from './guide';

/** Сессия ішіндегі translate кэш (route_id:lang → мәтіндер). */
const translateCache = new Map<string, AiTexts>();

/** AI/demo мәтін өрістерін жинау (index-тар itinerary-мен бір ретте). */
export function extractAiTexts(it: Itinerary | null | undefined): AiTexts {
  if (!it) return { dayTitles: [], tips: [], notes: [], budgetLabels: [] };
  const tips: string[] = [];
  for (const d of it.days) {
    for (const item of d.items) if (item.tip) tips.push(item.tip);
  }
  return {
    summary: it.summary,
    dayTitles: it.days.map((d) => d.title ?? ''),
    tips,
    notes: it.notes,
    budgetLabels: it.budget.map((b) => b.label),
    budgetNote: it.budgetNote,
  };
}

/** Аударылған мәтіндерді itinerary-ге қолдану (index бойынша, бос болмаса). */
export function applyAiTexts(it: Itinerary, texts: AiTexts): Itinerary {
  let tipIdx = 0;
  return {
    ...it,
    summary: texts.summary ?? it.summary,
    budgetNote: texts.budgetNote ?? it.budgetNote,
    days: it.days.map((d, di) => ({
      ...d,
      title: texts.dayTitles[di] ?? d.title,
      items: d.items.map((item) => {
        if (item.tip) {
          const t = texts.tips[tipIdx++];
          if (t) return { ...item, tip: t };
        }
        return item;
      }),
    })),
    notes: texts.notes.length > 0 ? texts.notes : it.notes,
    budget: it.budget.map((b, bi) => {
      const l = texts.budgetLabels[bi];
      return l ? { ...b, label: l } : b;
    }),
  };
}

export interface UseItineraryLangResult {
  itinerary: Itinerary | null;
  translating: boolean;
}

export function useItineraryLang(opts: {
  /** Генерация кезіндегі itinerary (base). */
  base: Itinerary | null | undefined;
  mode: 'ai' | 'demo' | null | undefined;
  data: CityData;
  lang: Lang;
  /** Кэш кілті үшін тұрақты id (message id). */
  routeId: string;
  /** Демо қайта құру үшін генерация формасы. */
  form?: GuideForm;
  chatText?: string;
}): UseItineraryLangResult {
  const { base, mode, data, lang, routeId, form, chatText } = opts;
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [translating, setTranslating] = useState(false);
  const reqRef = useRef(0);

  useEffect(() => {
    if (!base) {
      setItinerary(null);
      setTranslating(false);
      return;
    }

    // Демо режим: локальді детерминделген қайта құру — бірден жаңа тілде.
    if (mode === 'demo') {
      const demo = form
        ? buildDemoItinerary(data, { ...form, language: lang }, chatText)
        : undefined;
      setItinerary(localizeItinerary(demo?.itinerary ?? base, data, lang));
      setTranslating(false);
      return;
    }

    // AI режим: дерек-өрістерді ДАРАЛАЙ локальдейміз (AI мәтінді — translate).
    const localized = localizeItinerary(base, data, lang);
    // Itinerary қазірдің өзінде бұл тілде генерацияланған — translate-сіз.
    if (base.lang && base.lang === lang) {
      setItinerary(localized);
      setTranslating(false);
      return;
    }
    const key = `${routeId}:${lang}`;
    const cached = translateCache.get(key);
    if (cached) {
      setItinerary(applyAiTexts(localized, cached));
      setTranslating(false);
      return;
    }

    // Фallback: аударылу дейін AI мәтіні бұрынғы тілде қалады.
    setItinerary(localized);
    setTranslating(true);
    const id = ++reqRef.current;
    const controller = new AbortController();
    translateGuideTexts({ lang, texts: extractAiTexts(base) }, controller.signal)
      .then((res) => {
        if (id !== reqRef.current) return; // жаңа сұраныс болса ескермейміз
        setTranslating(false);
        if (res) {
          translateCache.set(key, res);
          setItinerary(applyAiTexts(localizeItinerary(base, data, lang), res));
        }
      })
      .catch(() => {
        if (id === reqRef.current) setTranslating(false);
      });
    return () => {
      controller.abort();
    };
  }, [base, mode, data, lang, routeId, form, chatText]);

  return { itinerary, translating };
}
