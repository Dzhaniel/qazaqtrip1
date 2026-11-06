/**
 * ДЕМО РЕЖИМ: маршрут құрастырғыш.
 *
 * OpenAI кілсіз (немесе сервер қолжетімсіз болғанда браузерде) қолданылады.
 * Тек kyzylorda.json деректеріне сүйенеді:
 *  - null баға  => «нақтыланбаған», ешқашан ойдан сан шығарылмайды;
 *  - мұражай дүйсенбіде жабық, 13:00–15:00 үзіліс — уақыттарға құрметтеліп жоспарланады;
 *  - Байқоңыр тек рұқсат (пропуск) ескертусімен қосылады;
 *  - қаладан тыс орындарға жол уақыты travel_note деректерінен алынады;
 *  - RUB бағалар (Байқоңыр) KZT-ге аударылмайды.
 */
import type { Attraction, AttractionCategory, CityData, Hotel, KazakhPhrase, Lang, L10n } from '../data/types';
import {
  L,
  addDays,
  clamp,
  dateStr,
  daysBetween,
  formatDateLabel,
  formatKzt,
  formatRub,
  getLocalized,
  mapsUrl,
  parseDateStr,
} from './utils';

/**
 * ko UI-де орын атауы: «корей атауы (қазақ оригиналы)» — brief-ке сай.
 * Басқа тілдерде — L() бойынша (kk/en/ru).
 */
export function koPlace(name: L10n, lang: Lang): string {
  if (lang !== 'ko') return L(name, lang);
  const ko = name.ko || name.en || name.kk;
  return ko === name.kk ? ko : `${ko} (${name.kk})`;
}

export type BudgetLevel = 'economy' | 'medium' | 'high';

export interface GuideForm {
  arrival: string; // YYYY-MM-DD | ''
  departure: string; // YYYY-MM-DD | ''
  travelers: number;
  budgetLevel: BudgetLevel;
  interests: string[];
  language: Lang;
  /** Қазақша сөйлесу режимі: қарапайым қазақша жауап + 2–3 маңызды сөз. */
  kz_mode?: boolean;
}

export interface GuideChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GuidePayload {
  form: GuideForm;
  messages: GuideChatMessage[];
  chatText?: string;
  /** UI тілі (whitelist: kk|en|ru|ko; server-де тексеріледі, invalid → kk). */
  lang?: Lang;
}

export interface PlanItem {
  time?: string;
  kind: 'attraction' | 'hotel' | 'meal' | 'free' | 'travel';
  /** Структурное поле: id из данных (attractions[].id | hotels[].id). */
  placeId?: string;
  name: string;
  howToGet?: string;
  /** AI/demo-written 1-2 sentence tip (localized text field). */
  tip?: string;
  costLabel?: string;
  costKnown?: boolean;
  warning?: string;
  mapsUrl?: string;
  order?: number;
  durationMin?: number | null;
  /** Цена только из данных; null = не указано. */
  estimatedCostKzt?: number | null;
  /** Ситуативные фразы этого стопа (из БД фраз, kk всегда на кириллице). */
  phrases?: ItineraryPhrase[];
}

export interface DayPlan {
  day: number;
  dateLabel?: string;
  title?: string;
  items: PlanItem[];
}

export interface BudgetLine {
  label: string;
  kind: 'hotel' | 'ticket' | 'tour' | 'other';
  amountLabel: string;
  known: boolean;
  kzt?: number | null;
  rub?: number | null;
}

export interface ItineraryPhrase {
  kk: string;
  translit: string;
  /** Аударма UI тіліне сай: kk→en, en→en+easy_pron, ru→ru, ko→ko+pron_ko. */
  meaning: string;
  easy_pron?: string;
  pron_ko?: string;
  /** false = AI жазған (тексерілмеген); true = деректерден. */
  reviewed?: boolean;
}

/** AI-жазған мәтін өрістері (аудару/кэш үшін). */
export interface AiTexts {
  summary?: string;
  dayTitles: string[];
  tips: string[];
  notes: string[];
  budgetLabels: string[];
  budgetNote?: string;
}

export interface Itinerary {
  days: DayPlan[];
  budget: BudgetLine[];
  notes: string[];
  unknownPrices: string[];
  phrases: ItineraryPhrase[];
  /** AI/demo summary (localized text field). */
  summary?: string;
  /** Бюджет туралы 1-2 сөйлем (localized text field). */
  budgetNote?: string;
  /** Мәтін өрістері қай тілде жасалған (switch кезінде translate-сұраныс үшін). */
  lang?: Lang;
}

export interface DemoResult {
  answerText: string;
  itinerary?: Itinerary;
}

/* Қазақша режимде жаңа сөздер ретімен келеді (демо-ротация) */
let kzPhraseCursor = 0;

function buildKzLesson(data: CityData, lang: Lang, chatText?: string): string {
  // ko-да дерек-мәтін en-нан алынады (fallback ережесі)
  const textLang: 'kk' | 'en' | 'ru' = lang === 'ko' ? 'en' : lang;
  const pool = data.kazakh_phrases;
  const picks = [0, 1, 2].map((i) => pool[(kzPhraseCursor + i) % pool.length]);
  kzPhraseCursor = (kzPhraseCursor + 3) % pool.length;
  const meaningOf = (p: (typeof pool)[number]) => (textLang === 'kk' ? p.en : p[lang]);

  const lines: string[] = [];
  lines.push(
    textLang === 'kk'
      ? 'Сәлем! Сіз қазақша сөйлесу режимін қостыңыз — мен қарапайым қазақша жауап беремін. 🌤'
      : textLang === 'en'
        ? 'Sälem! You turned on Kazakh practice mode — I will answer in simple Kazakh. 🌤'
        : 'Сәлем! Вы включили режим практики на казахском — я отвечу простым казахским. 🌤',
  );
  if (chatText && chatText.trim()) {
    lines.push('');
    lines.push(
      textLang === 'kk'
        ? 'Сұрағыңызды түсіндім, бірақ деректерде нақты мәлімет болмаса — «нақтыланбаған» деп айтамын, ойдан шығармаймын.'
        : textLang === 'en'
          ? 'I understood your question. If the data has no exact value, I will say “not specified” — I never guess.'
          : 'Я понял ваш вопрос. Если в данных нет точного значения — скажу «не указано», ничего не выдумываю.',
    );
  }
  lines.push('');
  lines.push(
    textLang === 'kk' ? 'Жаңа сөздер:' : textLang === 'en' ? 'New words:' : 'Новые слова:',
  );
  for (const p of picks) {
    lines.push(`• «${p.kk}» (${p.translit}) — ${meaningOf(p)}`);
  }
  lines.push('');
  lines.push(
    textLang === 'kk'
      ? 'Қолданғыңыз келетін сөзді жазыңыз — мысал сөйлем құрап беремін.'
      : textLang === 'en'
        ? 'Send me a phrase you want to use — I will build an example sentence.'
        : 'Пришлите фразу, которую хотите использовать — соберу пример предложения.',
  );
  return lines.join('\n');
}

/* ------------------------------------------------------------------ */
/* Хелперлер                                                           */
/* ------------------------------------------------------------------ */

const BUDGET_LEVEL_NAMES: Record<Lang, Record<BudgetLevel, string>> = {
  kk: { economy: 'үнемді', medium: 'орташа', high: 'жоғары' },
  en: { economy: 'budget', medium: 'medium', high: 'premium' },
  ru: { economy: 'эконом', medium: 'средний', high: 'высокий' },
  ko: { economy: '절약형', medium: '보통', high: '고급' },
};

const UNKNOWN = (lang: Lang) =>
  ({ kk: 'нақтыланбаған', en: 'not specified', ru: 'не указано', ko: '미기재' })[lang];

/** «Редакциялық» басымдық: қызығушылық берілмесе, бірінші рет келгенге ыңғайлы тәртіп. */
const FEATURED_ORDER = [
  'regional-history-museum',
  'central-square-drama-theatre',
  'old-bazaar-sybaga',
  'first-president-park-embankment',
  'korkyt-ata-park',
  'akmeshit-syrdarya-mosque',
  'syr-ana-monument',
  'shukenov-park',
  'aitbayev-art-gallery',
  'philharmonic-palace-of-arts',
  'aitbay-mosque',
  'kazan-church',
  'akmeshit-museum',
  'victory-park-obelisk',
  'city-culture-park',
];

function minToClock(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function pickHotel(hotels: Hotel[], level: BudgetLevel): Hotel {
  const known = hotels
    .filter((h) => h.price_from_kzt != null)
    .sort((a, b) => (a.price_from_kzt ?? 0) - (b.price_from_kzt ?? 0));
  if (known.length === 0) return hotels[0];
  if (level === 'economy') return known[0];
  if (level === 'high') return known[known.length - 1];
  return known[Math.min(1, known.length - 1)];
}

/* ------------------------------------------------------------------ */
/* Негізгі құрастырғыш                                                 */
/* ------------------------------------------------------------------ */

export function buildDemoItinerary(data: CityData, formRaw: GuideForm, chatText?: string): DemoResult {
  const lang = formRaw.language;
  // ko-да demo мәтіні en-нан алынады (fallback ережесі); атаулар — «ко (қазақ)» форматта (koPlace)
  const textLang: 'kk' | 'en' | 'ru' = lang === 'ko' ? 'en' : lang;
  const form: GuideForm = { ...formRaw, travelers: clamp(formRaw.travelers || 1, 1, 12) };
  const t = form.travelers;
  const unknown = UNKNOWN(lang);

  // Қазақша сөйлесу режимі + сұрақ бар => қарапайым қазақша жауап (маршрутсыз)
  if (form.kz_mode && chatText && chatText.trim().length > 0) {
    return { answerText: buildKzLesson(data, lang, chatText) };
  }

  const cityItems = data.attractions.filter((a) => a.type === 'city');
  const dayTrips = data.attractions.filter((a) => a.type === 'day_trip');
  const korkyt = dayTrips.find((a) => a.id === 'korkyt-ata-memorial');
  const baikonur = dayTrips.find((a) => a.id === 'baikonur');

  /* ---- Күндер ---- */
  const dArr = parseDateStr(form.arrival);
  const dDep = parseDateStr(form.departure);
  let nDays = 2;
  let datesOk = false;
  if (dArr && dDep && daysBetween(dArr, dDep) >= 0) {
    nDays = clamp(daysBetween(dArr, dDep) + 1, 1, 6);
    datesOk = true;
  }

  /* ---- Қонақүй ---- */
  const hotel = pickHotel(data.hotels, form.budgetLevel);
  const nights = nDays - 1;

  /* ---- Қызығушылық бойынша рәт ---- */
  const interests = form.interests;
  const score = (a: Attraction) =>
    interests.length === 0 ? 0 : interests.filter((i) => a.interests.includes(i)).length;
  const featuredIndex = (a: Attraction) => {
    const i = FEATURED_ORDER.indexOf(a.id);
    return i === -1 ? 999 : i;
  };
  const ranked = [...cityItems].sort((a, b) => {
    const s = score(b) - score(a);
    if (s !== 0) return s;
    const f = featuredIndex(a) - featuredIndex(b);
    if (f !== 0) return f;
    return a.visit_min - b.visit_min;
  });

  /* ---- Қаладан тыс орындарды таңдау ---- */
  const wantsCultureHistory =
    interests.length === 0 ||
    ['history', 'culture', 'music', 'photo'].some((i) => interests.includes(i));
  const wantKorkyt = Boolean(korkyt) && wantsCultureHistory;
  const wantBaikonur = Boolean(baikonur) && interests.includes('space');

  const notes: string[] = [];
  const unknownPrices: string[] = [];

  // Байқоңыр рұқсаты — егер қосылса, ЕРЕКШЕ ескерту міндетті.
  if (baikonur && baikonur.permit && wantBaikonur) {
    notes.push(`${koPlace(baikonur.name, lang)}: ${L(baikonur.permit, lang)}`);
    if (baikonur.permit.recommendation)
      notes.push(
        `${textLang === 'kk' ? 'Кеңес: ' : textLang === 'en' ? 'Advice: ' : 'Совет: '}` +
          getLocalized(baikonur.permit.recommendation, baikonur.permit.recommendation_ko, lang),
      );
  }
  if (baikonur && baikonur.permit && !wantBaikonur) {
    notes.push(
      `${koPlace(baikonur.name, lang)} ` +
        (textLang === 'kk'
          ? 'режимдік аймақ: барар алдында рұқсат алу міндетті (2026 жылғы маусымнан бастап шетелдіктерге 10 күнге дейін). Маршрутқа қосу үшін қызығушылық ретінде «Ғарыш»-ты таңдаңыз.'
          : textLang === 'en'
            ? 'is a restricted area: a permit must be obtained in advance (since June 2026 — up to 10 days for foreign tourists). To add it to the itinerary, choose "Space" as an interest.'
            : '— режимный объект: пропуск нужно получить заранее (с июня 2026 — до 10 дней для иностранцев). Чтобы добавить в маршрут, выберите интерес «Космос».'),
    );
  }
  if (korkyt && korkyt.travel_note && wantKorkyt) {
    notes.push(
      `${koPlace(korkyt.name, lang)} (${textLang === 'kk' ? 'қаладан тыс' : textLang === 'en' ? 'outside the city' : 'за городом'}): ${L(korkyt.travel_note, lang)}`,
    );
  }

  /* ---- Күндерге бөлу ---- */
  // dayTripDays: 0-based индекстер. nDays>=3 — соңғы екі күн; nDays===2 — соңғы күн ғана.
  const dedicated: Array<{ dayIdx: number; trip: Attraction }> = [];
  if (nDays >= 3) {
    // Соңғы екі күн; Байқоңырға ең соңғысын, Қорқыт атаға қалғанын береміз
    // (айдарта: қалалық күндер алдына жығылады, мұражай дүйсенбіге тірмейді).
    const pool = [nDays - 2, nDays - 1];
    if (wantBaikonur && baikonur) dedicated.push({ dayIdx: pool.pop()!, trip: baikonur });
    if (wantKorkyt && korkyt) dedicated.push({ dayIdx: pool.pop()!, trip: korkyt });
  } else if (nDays === 2) {
    const first = wantBaikonur && baikonur ? baikonur : wantKorkyt && korkyt ? korkyt : null;
    if (first) dedicated.push({ dayIdx: 1, trip: first });
    const second = first === baikonur ? (wantKorkyt && korkyt ? korkyt : null) : wantBaikonur && baikonur ? baikonur : null;
    if (second) {
      if (second === baikonur) {
        notes.push(
          textLang === 'kk'
            ? 'Байқоңырға толық күн керек — екі күндік жоспарға қоса алмадық. Маршрутты ұзартсаңыз немесе «Ғарыш» қызығушылығын таңдасаңыз, арнайы күн бөлеміз (рұқсат міндетті!).'
            : textLang === 'en'
              ? 'Baikonur needs a full day, so it does not fit into a 2-day plan. Extend the trip (a permit is required!) and we will allocate a dedicated day.'
              : 'Байконуру нужен целый день — в 2-дневный план он не поместился. Удлините поездку (пропуск обязателен!), и мы выделим отдельный день.',
        );
      } else if (second === korkyt) {
        notes.push(
          textLang === 'kk'
            ? 'Қорқыт ата мемориалына толық күн керек — екі күндік жоспарға қоса алмадық. Маршрутты ұзартсаңыз, арнайы күн бөлеміз.'
            : textLang === 'en'
              ? 'Korkyt Ata Memorial needs a full day (2+ hours of road each way), so it does not fit into a 2-day plan. Extend the trip and we will allocate a dedicated day.'
              : 'Мемориал Коркыт-ата требует целый день (более 2 часов дороги в одну сторону) — в 2-дневный план он не поместился. Удлините поездку, и мы выделим отдельный день.',
        );
      }
    }
  } else if (nDays === 1 && (wantBaikonur || wantKorkyt)) {
    if (wantBaikonur && baikonur && baikonur.permit) {
      notes.push(
        textLang === 'kk'
          ? 'Байқоңыр режимдік аймақ: рұқсатсыз бару мүмкін емес, сонымен қатар толық күн керек — 1 күндік жоспарға қосылдырылған жоқ.'
          : textLang === 'en'
            ? 'Baikonur is a restricted area: no visit without a permit, and it needs a full day — it was not added to a 1-day plan.'
            : 'Байконур — режимная зона: без пропуска попасть нельзя, а ещё нужен целый день — в 1-дневный план он не добавлен.',
      );
    }
    if (wantKorkyt && korkyt) {
      notes.push(
        textLang === 'kk'
          ? 'Қорқыт ата мемориалы қаладан 170–185 км (2 сағаттан астам жол) — 1 күндік жоспарға қосылдырылған жоқ.'
          : textLang === 'en'
            ? 'Korkyt Ata Memorial is 170–185 km from the city (2+ hours of road) — it was not added to a 1-day plan.'
            : 'Мемориал Коркыт-ата в 170–185 км от города (более 2 часов дороги) — в 1-дневный план не добавлен.',
      );
    }
  }
  const dedicatedDays = new Set(dedicated.map((d) => d.dayIdx));

  /* ---- Мұражай: дүйсенбіде жабық ---- */
  const weekdayOf = (dayIdx: number): number | null =>
    dArr ? (dArr.getDay() + dayIdx) % 7 : null; // 0=ексенбі… 1=дүйсенбі
  const museum = cityItems.find((a) => a.id === 'regional-history-museum');

  /* ---- Қалалық орындарды күндерге салу ---- */
  const cityDayIndices = Array.from({ length: nDays }, (_, i) => i).filter(
    (i) => !dedicatedDays.has(i),
  );
  const perDay: Array<Attraction[]> = cityDayIndices.map(() => []);
  const CAPACITY = 420; // минут
  const cursor: Attraction[] = [...ranked];

  for (let d = 0; d < perDay.length; d++) {
    const dayIdx = cityDayIndices[d];
    let used = 0;
    const mondayClosed = weekdayOf(dayIdx) === 1;
    let i = 0;
    while (i < cursor.length) {
      const item = cursor[i];
      if (item.category === 'museum' && mondayClosed) {
        i++; // дүйсенбіде мұражай жабық — келесі күнге қалдырамыз
        continue;
      }
      if (used + item.visit_min + 30 > CAPACITY) {
        i++;
        continue;
      }
      perDay[d].push(item);
      cursor.splice(i, 1);
      used += item.visit_min + 30;
    }
  }
  const museumDaysUsed = perDay.some((day) => day.some((a) => a?.category === 'museum'));
  if (museumDaysUsed && museum) {
    notes.push(
      textLang === 'kk'
        ? `${koPlace(museum.name, lang)} дүйсенбіде жұмыс істемейді, 13:00–15:00 аралығында үзіліс бар — кесте осыны ескерді.`
        : textLang === 'en'
          ? `The ${koPlace(museum.name, lang)} is closed on Mondays and has a 13:00–15:00 break — the schedule takes this into account.`
          : `${koPlace(museum.name, lang)} закрыт по понедельникам, перерыв 13:00–15:00 — расписание это учитывает.`,
    );
  }
  if (cursor.length > 0) {
    const extra = cursor.slice(0, 3).map((a) => koPlace(a.name, lang)).join(', ');
    notes.push(
      (textLang === 'kk' ? 'Тағы көруге тұрарлық (кейінгі күндерге): ' : textLang === 'en' ? 'Worth seeing later: ' : 'Стоит посмотреть позже: ') +
        extra,
    );
  }

  /* ---- Күн кестесі ---- */
  const days: DayPlan[] = [];
  for (let dayIdx = 0; dayIdx < nDays; dayIdx++) {
    const dateLabel = datesOk && dArr ? formatDateLabel(dateStr(addDays(dArr, dayIdx)), lang) : undefined;
    const planItems: PlanItem[] = [];

    const ded = dedicated.find((x) => x.dayIdx === dayIdx);
    if (ded) {
      const trip = ded.trip;
      const isBaikonur = trip.id === 'baikonur';
      const permitText = trip.permit ? L(trip.permit, lang) : undefined;

      if (isBaikonur && baikonur) {
        const permit = baikonur.permit!;
        planItems.push({
          time: '08:00',
          kind: 'travel',
          name:
            textLang === 'kk'
              ? 'Байқоңырға шығу (тек ұйымдастырылған топтармен)'
              : textLang === 'en'
                ? 'Departure to Baikonur (organized groups only)'
                : 'Выезд в Байконур (только организованные группы)',
          howToGet: permit.recommendation,
          warning: permitText,
        });
        if (baikonur.ticket.museum_audio_guide_rub != null) {
          planItems.push({
            time: '10:00',
            kind: 'attraction',
            placeId: baikonur.id,
            name: koPlace(baikonur.name, lang),
            tip:
              textLang === 'kk'
                ? 'Мұражай (аудиогидпен)'
                : textLang === 'en'
                  ? 'Museum visit (audio guide)'
                  : 'Экскурсия в музей (аудиогид)',
            durationMin: 120,
            estimatedCostKzt: null,
            costLabel: formatRub(baikonur.ticket.museum_audio_guide_rub),
            costKnown: true,
            phrases: stopPhrasesFor(data, stopTopics('attraction', baikonur), lang),
          });
        }
        if (baikonur.ticket.cosmodrome_group_tour_rub != null) {
          planItems.push({
            time: '13:30',
            kind: 'attraction',
            placeId: baikonur.id,
            name: koPlace(baikonur.name, lang),
            tip:
              textLang === 'kk'
                ? 'Ғарыш айлағына топтық экскурсия (4 сағат, 25 адамға дейін)'
                : textLang === 'en'
                  ? 'Group tour of the cosmodrome (4 hours, up to 25 people)'
                  : 'Групповая экскурсия на космодром (4 часа, до 25 человек)',
            durationMin: 240,
            estimatedCostKzt: null,
            costLabel: formatRub(baikonur.ticket.cosmodrome_group_tour_rub),
            costKnown: true,
            phrases: stopPhrasesFor(data, stopTopics('travel'), lang),
          });
        }
        planItems.push({
          time: '18:00',
          kind: 'travel',
          name:
            textLang === 'kk' ? 'Қызылордаға қайту' : textLang === 'en' ? 'Return to Kyzylorda' : 'Возвращение в Кызылорду',
        });
      } else if (korkyt) {
        planItems.push({
          time: '09:00',
          kind: 'travel',
          name:
            textLang === 'kk' ? 'Қорқыт ата мемориалына жол (R-69/E38)' : textLang === 'en' ? 'Drive to Korkyt Ata Memorial (R-69/E38)' : 'Поездка к мемориалу Коркыт-ата (R-69/E38)',
          howToGet: korkyt.travel_note ? L(korkyt.travel_note, lang) : undefined,
        });
        planItems.push({
          time: '12:00',
          kind: 'attraction',
          placeId: korkyt.id,
          name: koPlace(korkyt.name, lang),
          durationMin: korkyt.visit_min,
          estimatedCostKzt: korkyt.ticket.currency === 'RUB' ? null : korkyt.ticket.adult_kzt ?? null,
          costLabel: unknown,
          costKnown: false,
          mapsUrl: mapsUrl(korkyt.map_query),
          phrases: stopPhrasesFor(data, stopTopics('attraction', korkyt), lang),
        });
        planItems.push({
          time: '14:00',
          kind: 'travel',
          name:
            textLang === 'kk' ? 'Қызылордаға қайту' : textLang === 'en' ? 'Return to Kyzylorda' : 'Возвращение в Кызылорду',
        });
      }
      days.push({ day: dayIdx + 1, dateLabel, title: koPlace(trip.name, lang), items: planItems });
      continue;
    }

    /* Қалалық күн */
    const items = perDay[cityDayIndices.indexOf(dayIdx)] ?? [];
    let clock = 9 * 60 + 30;
    let orderNo = 0;
    for (const item of items) {
      orderNo++;
      planItems.push({
        time: minToClock(clock),
        kind: 'attraction',
        placeId: item.id,
        order: orderNo,
        name: koPlace(item.name, lang),
        durationMin: item.visit_min,
        estimatedCostKzt: item.ticket.currency === 'RUB' ? null : item.ticket.adult_kzt ?? null,
        howToGet: item.address,
        costLabel: ticketCostLabel(item, lang),
        costKnown: ticketCostKnown(item),
        mapsUrl: mapsUrl(item.map_query),
        phrases: stopPhrasesFor(data, stopTopics('attraction', item), lang),
      });
      clock += item.visit_min + 30;
      if (item.id === 'old-bazaar-sybaga') {
        planItems.push({
          time: minToClock(clock),
          kind: 'meal',
          name:
            textLang === 'kk'
              ? 'Базарда ыстық самса мен дәмдеуіштер'
              : textLang === 'en'
                ? 'Hot samsa and spices at the market'
                : 'Горячая самса и специи на рынке',
          costLabel: unknown,
          costKnown: false,
          phrases: stopPhrasesFor(data, stopTopics('meal'), lang),
        });
        unknownPrices.push(
          textLang === 'kk'
            ? 'Сыбаға базарындағы тамақ'
            : textLang === 'en'
              ? 'Food at Sybaga Market'
              : 'Еда на рынке Сыбага',
        );
        clock += 60;
      }
    }
    if (planItems.length === 0) {
      planItems.push({
        time: '10:00',
        kind: 'free',
        name:
          textLang === 'kk'
            ? 'Еркін уақыт: қала бойымен серуен, базар'
            : textLang === 'en'
              ? 'Free time: walk around the city, the bazaar'
              : 'Свободное время: прогулка по городу, базар',
        phrases: stopPhrasesFor(data, stopTopics('free'), lang),
      });
    } else if (clock < 17 * 60) {
      planItems.push({
        time: minToClock(clock),
        kind: 'free',
        name:
          textLang === 'kk'
            ? 'Еркін уақыт: Сырдария жағалауында серуен'
            : textLang === 'en'
              ? 'Free time: a walk along the Syr Darya embankment'
              : 'Свободное время: прогулка вдоль набережной Сырдарьи',
        phrases: stopPhrasesFor(data, stopTopics('free'), lang),
      });
    }
    days.push({ day: dayIdx + 1, dateLabel, items: planItems });
  }

  /* ---- Бюджет ---- */
  const budget: BudgetLine[] = [];
  const perNight =
    textLang === 'kk' ? 'түніне' : textLang === 'en' ? 'per night' : 'за ночь';
  const perPerson =
    textLang === 'kk' ? 'адамға' : textLang === 'en' ? 'per person' : 'с человека';

  if (nights > 0) {
    if (hotel.price_from_kzt != null) {
      budget.push({
        label: `${hotelName(lang)}: ${koPlace(hotel.name, lang)}`,
        kind: 'hotel',
        amountLabel: `${formatKzt(hotel.price_from_kzt)} ${perNight} × ${nights} ${
          textLang === 'kk' ? 'түн' : textLang === 'en' ? 'nights' : 'ноч'
        }`,
        known: true,
        kzt: hotel.price_from_kzt * nights,
      });
    } else {
      budget.push({
        label: `${hotelName(lang)}: ${koPlace(hotel.name, lang)}`,
        kind: 'hotel',
        amountLabel: unknown,
        known: false,
      });
      unknownPrices.push(koPlace(hotel.name, lang));
    }
  }

  const allPlanned = perDay.flat();
  for (const item of allPlanned) {
    const tk = item.ticket;
    if (tk.currency === 'RUB') continue; // RUB — Байқоңыр, алда бөлек жол
    if (tk.adult_kzt == null) {
      unknownPrices.push(koPlace(item.name, lang));
      continue;
    }
    if (tk.adult_kzt === 0) continue; // тегін — бюджетке енбейді
    budget.push({
      label: `${koPlace(item.name, lang)} × ${t} ${textLang === 'kk' ? 'адам' : textLang === 'en' ? 'people' : 'чел.'}`,
      kind: 'ticket',
      amountLabel: `${formatKzt(tk.adult_kzt)} × ${t}`,
      known: true,
      kzt: tk.adult_kzt * t,
    });
  }

  // Байқоңыр RUB бағалары (конвертацияланбайды!)
  const baikonurDay = dedicated.find((x) => x.trip.id === 'baikonur');
  if (baikonurDay && baikonur && baikonur.ticket) {
    if (baikonur.ticket.museum_audio_guide_rub != null) {
      budget.push({
        label:
          textLang === 'kk'
            ? 'Байқоңыр: музей (аудиогид)'
            : textLang === 'en'
              ? 'Baikonur: museum (audio guide)'
              : 'Байконур: музей (аудиогид)',
        kind: 'tour',
        amountLabel: `${formatRub(baikonur.ticket.museum_audio_guide_rub)} ${perPerson} × ${t}`,
        known: true,
        rub: baikonur.ticket.museum_audio_guide_rub * t,
      });
    }
    if (baikonur.ticket.cosmodrome_group_tour_rub != null) {
      budget.push({
        label:
          textLang === 'kk'
            ? 'Байқоңыр: ғарыш айлағына топтық экскурсия'
            : textLang === 'en'
              ? 'Baikonur: group tour of the cosmodrome'
              : 'Байконур: групповая экскурсия на космодром',
        kind: 'tour',
        amountLabel: `${formatRub(baikonur.ticket.cosmodrome_group_tour_rub)} ${perPerson} × ${t}`,
        known: true,
        rub: baikonur.ticket.cosmodrome_group_tour_rub * t,
      });
    }
  }

  /* ---- Сөздер ---- */
  const phrases: ItineraryPhrase[] = [];
  const p1 = data.kazakh_phrases[0];
  const p2 =
    interests.includes('food') && data.kazakh_phrases[8]
      ? data.kazakh_phrases[8]
      : data.kazakh_phrases[2];
  for (const p of [p1, p2]) {
    phrases.push({
      kk: p.kk,
      translit: p.translit,
      meaning: phraseMeaning(p, lang),
      easy_pron: p.easy_pron,
      pron_ko: p.pron_ko,
      reviewed: true,
    });
  }

  /* ---- Жауап мәтіні ---- */
  const answerText = buildAnswerText({
    data,
    form,
    lang,
    nDays,
    datesOk,
    hotel,
    notes,
    unknownPrices,
    phrases,
    kztTotal: budget.reduce((s, b) => s + (b.kzt ?? 0), 0),
    rubTotal: budget.reduce((s, b) => s + (b.rub ?? 0), 0),
  });

  // қайталанған unknownPrices-терді тазалаймыз
  const uniqueUnknown = Array.from(new Set(unknownPrices));

  const kztTotalAll = budget.reduce((s, b) => s + (b.kzt ?? 0), 0);
  const rubTotalAll = budget.reduce((s, b) => s + (b.rub ?? 0), 0);
  const tripCount = dedicated.length;
  const summary =
    textLang === 'kk'
      ? `Қызылордада ${nDays} күндік маршрут: ${allPlanned.length} қалалық орын${tripCount ? ` + ${tripCount} күндік саяхат` : ''} + қонақүй.`
      : textLang === 'en'
        ? `A ${nDays}-day Kyzylorda itinerary: ${allPlanned.length} city stops${tripCount ? ` + ${tripCount} day trip(s)` : ''} + hotel.`
        : `Маршрут по Кызылорде на ${nDays} дн.: ${allPlanned.length} городских точек${tripCount ? ` + выезды (${tripCount})` : ''} + отель.`;
  const budgetNote =
    textLang === 'kk'
      ? kztTotalAll > 0
        ? `Нақты белгілі қосынды: шамамен ${formatKzt(kztTotalAll)}${rubTotalAll > 0 ? ` + Байқоңырға ${formatRub(rubTotalAll)} (RUB, аударылмаған)` : ''}. Бағасы нақтыланбаған жерлер астында көрсетілді.`
        : 'Баға деректері қолжетімсіз — барлық сомалар нақтыланбаған.'
      : textLang === 'en'
        ? kztTotalAll > 0
          ? `Known total: about ${formatKzt(kztTotalAll)}${rubTotalAll > 0 ? ` + ${formatRub(rubTotalAll)} RUB for Baikonur (not converted)` : ''}. Places with unknown prices are listed below.`
          : 'No price data available — all amounts are unspecified.'
        : kztTotalAll > 0
          ? `Известная сумма: примерно ${formatKzt(kztTotalAll)}${rubTotalAll > 0 ? ` + ${formatRub(rubTotalAll)} RUB на Байконур (без конвертации)` : ''}. Места без цены указаны ниже.`
          : 'Нет данных о ценах — все суммы не указаны.';

  return {
    answerText,
    itinerary: { days, budget, notes: notes.filter(Boolean), unknownPrices: uniqueUnknown, phrases, summary, budgetNote, lang },
  };
}

function hotelName(lang: Lang): string {
  return {
    kk: 'Қонақүй',
    en: 'Hotel',
    ru: 'Отель',
    ko: '호텔',
  }[lang];
}

export function ticketCostLabel(a: Attraction, lang: Lang): string {
  const textLang: 'kk' | 'en' | 'ru' = lang === 'ko' ? 'en' : lang;
  const unknown = UNKNOWN(lang);
  const tk = a.ticket;
  if (tk.currency === 'RUB') {
    const parts: string[] = [];
    if (tk.museum_audio_guide_rub != null)
      parts.push(
        `${textLang === 'kk' ? 'музей (аудиогид)' : textLang === 'en' ? 'museum (audio guide)' : 'музей (аудиогид)'}: ${formatRub(tk.museum_audio_guide_rub)}`,
      );
    if (tk.cosmodrome_group_tour_rub != null)
      parts.push(
        `${textLang === 'kk' ? 'ғарыш айлағы (топтық)' : textLang === 'en' ? 'cosmodrome (group)' : 'космодром (группово)'}: ${formatRub(tk.cosmodrome_group_tour_rub)}`,
      );
    return parts.join(' · ');
  }
  if (tk.adult_kzt === 0) return { kk: 'Тегін', en: 'Free', ru: 'Бесплатно', ko: '무료' }[lang];
  if (tk.adult_kzt == null) return unknown;
  return formatKzt(tk.adult_kzt);
}

export function ticketCostKnown(a: Attraction): boolean {
  const tk = a.ticket;
  if (tk.currency === 'RUB') return true;
  if (tk.adult_kzt == null) return false;
  return true;
}

/* ------------------------------------------------------------------ */
/* Stop-phrases: әр stop-қа 2-3 деректерден алынған жағдайлық фраза     */
/* ------------------------------------------------------------------ */

/** Баға сөздері (локальді көрсету үшін; i18n мәндерімен сәйкес). */
export const COST_WORDS: Record<Lang, { free: string; unknown: string; perNight: string; from: string }> = {
  kk: { free: 'Тегін', unknown: 'Баға нақтыланбаған', perNight: 'түніне', from: 'бағасы бастап' },
  en: { free: 'Free', unknown: 'Price not specified', perNight: 'per night', from: 'from' },
  ru: { free: 'Бесплатно', unknown: 'Цена не указана', perNight: 'за ночь', from: 'от' },
  ko: { free: '무료', unknown: '가격 미기재', perNight: '1박', from: '부터' },
};

/** Фразаның аудармасы UI тіліне сай (brief: kk→en, en→en+easy_pron, ru→ru, ko→ko+pron_ko). */
export function phraseMeaning(p: KazakhPhrase, lang: Lang): string {
  if (lang === 'kk') return p.en;
  if (lang === 'ko') return p.ko ?? p.en;
  return p[lang] ?? p.en;
}

/** Stop-тың тақырыбына сәйкес фразалар topic-тары (cat/interests → topics). */
export function stopTopics(
  kind: PlanItem['kind'],
  a?: { category?: AttractionCategory; interests?: string[] },
): string[] {
  if (kind === 'meal') return ['food', 'shopping'];
  if (kind === 'travel') return ['transport', 'directions'];
  if (kind === 'free') return ['greetings'];
  const ints = a?.interests ?? [];
  switch (a?.category) {
    case 'museum':
      return ['museum', 'shopping'];
    case 'market':
      return ['shopping', 'food'];
    case 'religious':
      return ['greetings', 'directions'];
    case 'theatre':
      return ['greetings', 'museum'];
    case 'space':
      return ['directions', 'emergency'];
    default:
      if (ints.includes('food')) return ['food', 'shopping'];
      if (ints.includes('shopping')) return ['shopping', 'food'];
      return ['directions', 'greetings'];
  }
}

/**
 * Деректерден (kazakh_phrases) жағдайлық фразалар: 2-3 дана, topic-тар бойынша.
 * kk мәтіні әрқашан кириллица; аударма/pronunciation UI тіліне сай.
 * AI фразалары мағыналы болмаса, тек деректердегі фразалар ғана қолданылады.
 */
export function stopPhrasesFor(data: CityData, topics: string[], lang: Lang, limit = 2): ItineraryPhrase[] {
  const out: ItineraryPhrase[] = [];
  const seen = new Set<string>();
  for (const topic of topics) {
    for (const p of data.kazakh_phrases) {
      if (out.length >= limit) break;
      if (p.topic !== topic || seen.has(p.id)) continue;
      seen.add(p.id);
      out.push({
        kk: p.kk,
        translit: p.translit,
        meaning: phraseMeaning(p, lang),
        easy_pron: p.easy_pron,
        pron_ko: p.pron_ko,
        reviewed: true,
      });
    }
  }
  if (out.length === 0) {
    const p = data.kazakh_phrases[0];
    if (p)
      out.push({
        kk: p.kk,
        translit: p.translit,
        meaning: phraseMeaning(p, lang),
        easy_pron: p.easy_pron,
        pron_ko: p.pron_ko,
        reviewed: true,
      });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Жауап мәтіні                                                        */
/* ------------------------------------------------------------------ */

interface AnswerInput {
  data: CityData;
  form: GuideForm;
  lang: Lang;
  nDays: number;
  datesOk: boolean;
  hotel: Hotel;
  notes: string[];
  unknownPrices: string[];
  phrases: ItineraryPhrase[];
  kztTotal: number;
  rubTotal: number;
}

function buildAnswerText(input: AnswerInput): string {
  const { lang, form, nDays, datesOk, hotel, notes, phrases, kztTotal, rubTotal, unknownPrices } = input;
  const textLang: 'kk' | 'en' | 'ru' = lang === 'ko' ? 'en' : lang;
  const level = BUDGET_LEVEL_NAMES[lang][form.budgetLevel];
  const unknown = UNKNOWN(lang);

  const dArr = parseDateStr(form.arrival);
  const dDep = parseDateStr(form.departure);
  const datesLabel = datesOk && dArr && dDep
    ? `${formatDateLabel(form.arrival, lang)} – ${formatDateLabel(form.departure, lang)}`
    : textLang === 'kk' ? 'күндер көрсетілмеген' : textLang === 'en' ? 'no dates given' : 'даты не указаны';

  const interestNames =
    form.interests.length > 0
      ? form.interests
          .map((id) => {
            const opt = input.data.interest_options.find((o) => o.id === id);
            return opt ? opt[lang] : id;
          })
          .join(', ')
      : textLang === 'kk' ? 'таңдалмаған' : textLang === 'en' ? 'none selected' : 'не выбраны';

  const lines: string[] = [];

  const greet =
    textLang === 'kk'
      ? 'Сәлеметсіз бе! Қызылорда үшін маршрут құрдым. 🌤'
      : textLang === 'en'
        ? 'Hello! I have built an itinerary for you in Kyzylorda. 🌤'
        : 'Здравствуйте! Я составил маршрут для вас по Кызылорде. 🌤';
  lines.push(greet);

  lines.push('');
  const planTitle =
    textLang === 'kk' ? 'Сіздің сұранысыңыз:' : textLang === 'en' ? 'Your request:' : 'Ваш запрос:';
  lines.push(planTitle);
  lines.push(
    textLang === 'kk'
      ? `• Күндері: ${datesLabel} (${nDays} күн)\n• Саяхатшылар: ${form.travelers} адам\n• Бюджет: ${level}\n• Қызығушылықтар: ${interestNames}`
      : textLang === 'en'
        ? `• Dates: ${datesLabel} (${nDays} days)\n• Travelers: ${form.travelers}\n• Budget: ${level}\n• Interests: ${interestNames}`
        : `• Даты: ${datesLabel} (${nDays} дн.)\n• Путешественники: ${form.travelers}\n• Бюджет: ${level}\n• Интересы: ${interestNames}`,
  );

  const hotelLine =
    hotel.price_from_kzt != null
      ? textLang === 'kk'
        ? `• Қонақүй: ${koPlace(hotel.name, lang)} — түніне ${formatKzt(hotel.price_from_kzt)}-тен бастап${hotel.breakfast_included ? ' (таңғы ас қоса)' : ''}`
        : textLang === 'en'
          ? `• Hotel: ${koPlace(hotel.name, lang)} — from ${formatKzt(hotel.price_from_kzt)} per night${hotel.breakfast_included ? ' (breakfast included)' : ''}`
          : `• Отель: ${koPlace(hotel.name, lang)} — от ${formatKzt(hotel.price_from_kzt)} за ночь${hotel.breakfast_included ? ' (с завтраком)' : ''}`
      : textLang === 'kk'
        ? `• Қонақүй: ${koPlace(hotel.name, lang)} — бағасы ${unknown}`
        : textLang === 'en'
          ? `• Hotel: ${koPlace(hotel.name, lang)} — price ${unknown}`
          : `• Отель: ${koPlace(hotel.name, lang)} — цена ${unknown}`;
  lines.push(hotelLine);

  if (notes.length > 0) {
    lines.push('');
    lines.push(
      textLang === 'kk' ? 'Маңызды ескертулер:' : textLang === 'en' ? 'Important notes:' : 'Важные замечания:',
    );
    for (const n of notes) lines.push(`• ${n}`);
  }

  lines.push('');
  lines.push(
    textLang === 'kk'
      ? 'Төменде күн бойынша кесте мен бюджет қорытындысы. Бағасы белгісіз орындар «нақтыланбаған» деп белгіленді — ойлап сан айтқан жоқпын.'
      : textLang === 'en'
        ? 'Below is the day-by-day plan and the budget summary. Places with unknown prices are marked “not specified” — I never guess.'
        : 'Ниже — подневной план и итог по бюджету. Места с неизвестной ценой помечены «не указано» — я никогда не выдумываю.',
  );

  if (kztTotal > 0) {
    lines.push(
      textLang === 'kk'
        ? `Нақты белгілі қосынды: шамамен ${formatKzt(kztTotal)}`
        : textLang === 'en'
          ? `Total of known costs: about ${formatKzt(kztTotal)}`
          : `Сумма известных расходов: примерно ${formatKzt(kztTotal)}`,
    );
  }
  if (rubTotal > 0) {
    lines.push(
      textLang === 'kk'
        ? `Байқоңырға арналған қосымша (RUB-пен, аударылмаған): ${formatRub(rubTotal)}`
        : textLang === 'en'
          ? `Extra for Baikonur (in RUB, not converted): ${formatRub(rubTotal)}`
          : `Дополнительно для Байконура (в RUB, без конвертации): ${formatRub(rubTotal)}`,
    );
  }
  if (unknownPrices.length > 0) {
    lines.push(
      textLang === 'kk'
        ? `Бағасы нақтыланбаған: ${unknownPrices.join(', ')}.`
        : textLang === 'en'
          ? `Unknown prices: ${unknownPrices.join(', ')}.`
          : `Цены не указаны: ${unknownPrices.join(', ')}.`,
    );
  }

  if (phrases.length > 0) {
    lines.push('');
    lines.push(
      textLang === 'kk'
        ? 'Жолда пайдалы сөздер:'
        : textLang === 'en'
          ? 'Useful Kazakh phrases for the road:'
          : 'Полезные казахские фразы в пути:',
    );
    for (const p of phrases) lines.push(`• «${p.kk}» (${p.translit}) — ${p.meaning}`);
  }

  lines.push('');
  lines.push(L(input.data.meta.disclaimer, lang));

  return lines.join('\n');
}

/* ------------------------------------------------------------------ */
/* API-ге жіберілетін формалық қорытынды (контекст)                     */
/* ------------------------------------------------------------------ */

export function summarizeForm(form: GuideForm, lang: Lang): string {
  const textLang: 'kk' | 'en' | 'ru' = lang === 'ko' ? 'en' : lang;
  const level = BUDGET_LEVEL_NAMES[lang][form.budgetLevel];
  const interests =
    form.interests.length > 0
      ? form.interests.join(', ')
      : textLang === 'kk' ? 'таңдалмаған' : textLang === 'en' ? 'none selected' : 'не выбраны';
  if (textLang === 'kk') {
    return `Саяхат сұранысы: келу — ${form.arrival || 'нақтыланбаған'}, кету — ${form.departure || 'нақтыланбаған'}, саяхатшылар: ${form.travelers} адам, бюджет: ${level}, қызығушылықтар: ${interests}.`;
  }
  if (lang === 'ru') {
    return `Запрос на поездку: прибытие — ${form.arrival || 'не указано'}, отъезд — ${form.departure || 'не указано'}, путешественников: ${form.travelers}, бюджет: ${level}, интересы: ${interests}.`;
  }
  return `Trip request: arrival — ${form.arrival || 'not specified'}, departure — ${form.departure || 'not specified'}, travelers: ${form.travelers}, budget: ${level}, interests: ${interests}.`;
}
