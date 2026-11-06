/**
 * localizeItinerary() — itinerary-ны UI тіліне локальдейді ДЕРЕКТЕРДЕН.
 *
 * Ережелер (brief 2026-11-06):
 *  - place_id тек деректердегі id-лер ғана; бұзылған/танымалсыз place_id — item жойылады;
 *  - атау/мекенжай/баға/уақыт — data-дан (getLocalized fallback: ko → en → kk);
 *  - ko режимде атау: «Корей атауы (Қазақша атауы)» (koPlace);
 *  - AI/demo мәтін өрістері (name без place_id, tip, warning, notes, budget labels)
 *    қалпында қалады — олар useItineraryLang арқылы translate-сұраныспен аударылады
 *    (cache + fallback);
 *  - ешқашан throw/undefined/бос мәтін болмайды.
 */
import type { CityData, Lang } from '../data/types';
import type { Itinerary, ItineraryPhrase, PlanItem, BudgetLine } from './demoItinerary';
import {
  COST_WORDS,
  koPlace,
  stopPhrasesFor,
  stopTopics,
  ticketCostKnown,
  ticketCostLabel,
} from './demoItinerary';
import { formatKzt, getLocalized, mapsUrl } from './utils';

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim().length > 0 ? v : undefined;
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/**
 * Тікелей (sync, pure) локализация. AI жауабын normalize-дауға да қолданылады
 * (серверде: танымалсыз place_id-лер жойылады, names data-дан толтырылады).
 */
export function localizeItinerary(raw: Itinerary | null | undefined, data: CityData, lang: Lang): Itinerary {
  const fallback: Itinerary = { days: [], budget: [], notes: [], unknownPrices: [], phrases: [] };
  if (!raw || !Array.isArray(raw.days)) return fallback;

  const byAttraction = new Map(data.attractions.map((a) => [a.id, a]));
  const byHotel = new Map(data.hotels.map((h) => [h.id, h]));
  const words = COST_WORDS[lang];

  const days = raw.days
    .filter((d) => d && Array.isArray(d.items))
    .map((day, di) => {
      const items: PlanItem[] = [];
      day.items.forEach((item, ii) => {
        if (!item || typeof item.name !== 'string' || !item.name.trim()) return;
        const base: PlanItem = {
          time: str(item.time),
          kind:
            item.kind === 'hotel' || item.kind === 'meal' || item.kind === 'free' || item.kind === 'travel'
              ? item.kind
              : 'attraction',
          name: item.name.trim(),
          howToGet: str(item.howToGet),
          tip: str(item.tip),
          warning: str(item.warning),
          order: num(item.order) ?? ii + 1,
          phrases: Array.isArray(item.phrases)
            ? (item.phrases as ItineraryPhrase[]).filter((p) => p && typeof p.kk === 'string')
            : undefined,
        };

        const pid = str(item.placeId);
        const attraction = pid ? byAttraction.get(pid) : undefined;
        const hotel = pid && !attraction ? byHotel.get(pid) : undefined;

        if (pid && !attraction && !hotel) return; // танымалсыз place_id — жоямыз (brief §2)

        if (attraction) {
          const a = attraction;
          base.placeId = a.id;
          base.name = koPlace(a.name, lang);
          base.howToGet = getLocalized(a.address, a.address_ko, lang) || undefined;
          base.mapsUrl = mapsUrl(a.map_query);
          base.durationMin = a.visit_min;
          base.estimatedCostKzt = a.ticket.currency === 'RUB' ? null : (a.ticket.adult_kzt ?? null);
          base.costLabel = ticketCostLabel(a, lang);
          base.costKnown = ticketCostKnown(a);
          // Деректердегі фразалар — әрқашан жаңа (lang-ға сай), AI фразаларынан кейін
          const dataPhrases = stopPhrasesFor(data, stopTopics(base.kind, a), lang);
          const extraAi = (base.phrases ?? [])
            .filter((p) => !dataPhrases.some((d) => d.kk === p.kk))
            .slice(0, 3 - dataPhrases.length)
            .map((p) => ({
              kk: p.kk,
              translit: p.translit || '',
              meaning: p.meaning || '',
              easy_pron: p.easy_pron,
              pron_ko: p.pron_ko,
              reviewed: p.reviewed === true,
            }));
          base.phrases = [...dataPhrases, ...extraAi].slice(0, 3);
          // Байқоңыр: рұқсат ескертуі әрқашан бірінші stop-та (data-дан, lang-ға сай)
          if (a.restricted && a.permit?.required && !base.warning) {
            base.warning = lang === 'ko' ? a.permit.ko ?? a.permit.en ?? a.permit.kk : a.permit[lang] ?? a.permit.kk;
          }
        } else if (hotel) {
          const h = hotel;
          base.placeId = h.id;
          base.name = koPlace(h.name, lang);
          base.howToGet = getLocalized(h.address, h.address_ko, lang) || undefined;
          base.mapsUrl = mapsUrl(h.map_query);
          base.durationMin = null;
          base.estimatedCostKzt = h.price_from_kzt;
          base.costKnown = h.price_from_kzt != null;
          base.costLabel =
            h.price_from_kzt != null ? `${formatKzt(h.price_from_kzt)} ${words.perNight}` : words.unknown;
          base.phrases = stopPhrasesFor(data, ['hotel', 'greetings'], lang);
        } else {
          // travel/meal/free — AI/demo мәтіні (place_id жоқ)
          const n = num(item.estimatedCostKzt);
          base.estimatedCostKzt = n;
          base.costLabel = str(item.costLabel);
          base.costKnown = typeof item.costKnown === 'boolean' ? item.costKnown : undefined;
          if (base.phrases && base.phrases.length === 0) base.phrases = undefined;
          if (!base.phrases) base.phrases = stopPhrasesFor(data, stopTopics(base.kind), lang);
        }
        items.push(base);
      });

      return {
        day: num(day.day) ?? di + 1,
        dateLabel: str(day.dateLabel),
        title: str(day.title),
        items,
      };
    })
    .filter((d) => d.items.length > 0);

  const budget = (Array.isArray(raw.budget) ? raw.budget : [])
    .filter((b) => b && typeof b === 'object')
    .map((b): BudgetLine => ({
      label: str(b.label) || '',
      kind: b.kind === 'hotel' || b.kind === 'tour' || b.kind === 'ticket' ? b.kind : 'other',
      amountLabel: str(b.amountLabel) || '',
      known: b.known === true,
      kzt: b.known === true ? (num(b.kzt) ?? null) : null,
      rub: b.known === true ? (num(b.rub) ?? null) : null,
    }));

  const notes = (Array.isArray(raw.notes) ? raw.notes : [])
    .map((n) => (typeof n === 'string' ? n.trim() : ''))
    .filter((n) => n.length > 0);

  const unknownPrices = Array.from(
    new Set(
      (Array.isArray(raw.unknownPrices) ? raw.unknownPrices : [])
        .filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
        .map((u) => u.trim()),
    ),
  );

  const phrases = (Array.isArray(raw.phrases) ? raw.phrases : [])
    .filter((p) => p && typeof p.kk === 'string' && p.kk.trim().length > 0)
    .slice(0, 10)
    .map((p) => ({
      kk: p.kk.trim(),
      translit: typeof p.translit === 'string' ? p.translit : '',
      meaning: typeof p.meaning === 'string' ? p.meaning : '',
      easy_pron: typeof p.easy_pron === 'string' ? p.easy_pron : undefined,
      pron_ko: typeof p.pron_ko === 'string' ? p.pron_ko : undefined,
      reviewed: p.reviewed === true,
    }));

  return {
    days,
    budget,
    notes,
    unknownPrices,
    phrases,
    summary: str(raw.summary),
    budgetNote: str(raw.budgetNote),
    lang: raw.lang ?? lang,
  };
}
