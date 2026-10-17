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
import type { Attraction, CityData, Hotel, Lang } from '../data/types';
import {
  L,
  addDays,
  clamp,
  dateStr,
  daysBetween,
  formatDateLabel,
  formatKzt,
  formatRub,
  mapsUrl,
  parseDateStr,
} from './utils';

export type BudgetLevel = 'economy' | 'medium' | 'high';

export interface GuideForm {
  arrival: string; // YYYY-MM-DD | ''
  departure: string; // YYYY-MM-DD | ''
  travelers: number;
  budgetLevel: BudgetLevel;
  interests: string[];
  language: Lang;
}

export interface GuideChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GuidePayload {
  form: GuideForm;
  messages: GuideChatMessage[];
  chatText?: string;
}

export interface PlanItem {
  time?: string;
  kind: 'attraction' | 'hotel' | 'meal' | 'free' | 'travel';
  placeId?: string;
  name: string;
  howToGet?: string;
  costLabel?: string;
  costKnown?: boolean;
  warning?: string;
  mapsUrl?: string;
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
  meaning: string;
}

export interface Itinerary {
  days: DayPlan[];
  budget: BudgetLine[];
  notes: string[];
  unknownPrices: string[];
  phrases: ItineraryPhrase[];
}

export interface DemoResult {
  answerText: string;
  itinerary: Itinerary;
}

/* ------------------------------------------------------------------ */
/* Хелперлер                                                           */
/* ------------------------------------------------------------------ */

const BUDGET_LEVEL_NAMES: Record<Lang, Record<BudgetLevel, string>> = {
  kk: { economy: 'үнемді', medium: 'орташа', high: 'жоғары' },
  en: { economy: 'budget', medium: 'medium', high: 'premium' },
  ru: { economy: 'эконом', medium: 'средний', high: 'высокий' },
};

const UNKNOWN = (lang: Lang) =>
  ({ kk: 'нақтыланбаған', en: 'not specified', ru: 'не указано' })[lang];

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

export function buildDemoItinerary(data: CityData, formRaw: GuideForm): DemoResult {
  const lang = formRaw.language;
  const form: GuideForm = { ...formRaw, travelers: clamp(formRaw.travelers || 1, 1, 12) };
  const t = form.travelers;
  const unknown = UNKNOWN(lang);

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
    notes.push(`${L(baikonur.name, lang)}: ${L(baikonur.permit, lang)}`);
    if (baikonur.permit.recommendation) notes.push(`Кеңес: ${baikonur.permit.recommendation}`);
  }
  if (baikonur && baikonur.permit && !wantBaikonur) {
    notes.push(
      `${L(baikonur.name, lang)} режимдік аймақ: барар алдында рұқсат алу міндетті (2026 жылғы маусымнан бастап шетелдіктерге 10 күнге дейін). Маршрутқа қосу үшін қызығушылық ретінде «Ғарыш»-ты таңдаңыз.`,
    );
  }
  if (korkyt && korkyt.travel_note && wantKorkyt) {
    notes.push(`${L(korkyt.name, lang)} (қаладан тыс): ${L(korkyt.travel_note, lang)}`);
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
          lang === 'kk'
            ? 'Байқоңырға толық күн керек — екі күндік жоспарға қоса алмадық. Маршрутты ұзартсаңыз немесе «Ғарыш» қызығушылығын таңдасаңыз, арнайы күн бөлеміз (рұқсат міндетті!).'
            : lang === 'en'
              ? 'Baikonur needs a full day, so it does not fit into a 2-day plan. Extend the trip (a permit is required!) and we will allocate a dedicated day.'
              : 'Байконуру нужен целый день — в 2-дневный план он не поместился. Удлините поездку (пропуск обязателен!), и мы выделим отдельный день.',
        );
      } else if (second === korkyt) {
        notes.push(
          lang === 'kk'
            ? 'Қорқыт ата мемориалына толық күн керек — екі күндік жоспарға қоса алмадық. Маршрутты ұзартсаңыз, арнайы күн бөлеміз.'
            : lang === 'en'
              ? 'Korkyt Ata Memorial needs a full day (2+ hours of road each way), so it does not fit into a 2-day plan. Extend the trip and we will allocate a dedicated day.'
              : 'Мемориал Коркыт-ата требует целый день (более 2 часов дороги в одну сторону) — в 2-дневный план он не поместился. Удлините поездку, и мы выделим отдельный день.',
        );
      }
    }
  } else if (nDays === 1 && (wantBaikonur || wantKorkyt)) {
    if (wantBaikonur && baikonur && baikonur.permit) {
      notes.push(
        lang === 'kk'
          ? 'Байқоңыр режимдік аймақ: рұқсатсыз бару мүмкін емес, сонымен қатар толық күн керек — 1 күндік жоспарға қосылдырылған жоқ.'
          : lang === 'en'
            ? 'Baikonur is a restricted area: no visit without a permit, and it needs a full day — it was not added to a 1-day plan.'
            : 'Байконур — режимная зона: без пропуска попасть нельзя, а ещё нужен целый день — в 1-дневный план он не добавлен.',
      );
    }
    if (wantKorkyt && korkyt) {
      notes.push(
        lang === 'kk'
          ? 'Қорқыт ата мемориалы қаладан 170–185 км (2 сағаттан астам жол) — 1 күндік жоспарға қосылдырылған жоқ.'
          : lang === 'en'
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
      lang === 'kk'
        ? `${L(museum.name, lang)} дүйсенбіде жұмыс істемейді, 13:00–15:00 аралығында үзіліс бар — кесте осыны ескерді.`
        : lang === 'en'
          ? `The ${L(museum.name, lang)} is closed on Mondays and has a 13:00–15:00 break — the schedule takes this into account.`
          : `${L(museum.name, lang)} закрыт по понедельникам, перерыв 13:00–15:00 — расписание это учитывает.`,
    );
  }
  if (cursor.length > 0) {
    const extra = cursor.slice(0, 3).map((a) => L(a.name, lang)).join(', ');
    notes.push(
      (lang === 'kk' ? 'Тағы көруге тұрарлық (кейінгі күндерге): ' : lang === 'en' ? 'Worth seeing later: ' : 'Стоит посмотреть позже: ') +
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
            lang === 'kk'
              ? 'Байқоңырға шығу (тек ұйымдастырылған топтармен)'
              : lang === 'en'
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
            name:
              lang === 'kk'
                ? 'Байқоңыр ғарыш айлағы тарихы мұражайы (аудиогид)'
                : lang === 'en'
                  ? 'Baikonur Cosmodrome History Museum (audio guide)'
                  : 'Музей истории космодрома Байконур (аудиогид)',
            costLabel: formatRub(baikonur.ticket.museum_audio_guide_rub),
            costKnown: true,
          });
        }
        if (baikonur.ticket.cosmodrome_group_tour_rub != null) {
          planItems.push({
            time: '13:30',
            kind: 'attraction',
            placeId: baikonur.id,
            name:
              lang === 'kk'
                ? 'Ғарыш айлағына топтық экскурсия (4 сағат, 25 адамға дейін)'
                : lang === 'en'
                  ? 'Group tour of the cosmodrome (4 hours, up to 25 people)'
                  : 'Групповая экскурсия на космодром (4 часа, до 25 человек)',
            costLabel: formatRub(baikonur.ticket.cosmodrome_group_tour_rub),
            costKnown: true,
          });
        }
        planItems.push({
          time: '18:00',
          kind: 'travel',
          name:
            lang === 'kk' ? 'Қызылордаға қайту' : lang === 'en' ? 'Return to Kyzylorda' : 'Возвращение в Кызылорду',
        });
      } else if (korkyt) {
        planItems.push({
          time: '09:00',
          kind: 'travel',
          name:
            lang === 'kk' ? 'Қорқыт ата мемориалына жол (R-69/E38)' : lang === 'en' ? 'Drive to Korkyt Ata Memorial (R-69/E38)' : 'Поездка к мемориалу Коркыт-ата (R-69/E38)',
          howToGet: korkyt.travel_note ? L(korkyt.travel_note, lang) : undefined,
        });
        planItems.push({
          time: '12:00',
          kind: 'attraction',
          placeId: korkyt.id,
          name: L(korkyt.name, lang),
          costLabel: unknown,
          costKnown: false,
          mapsUrl: mapsUrl(korkyt.map_query),
        });
        planItems.push({
          time: '14:00',
          kind: 'travel',
          name:
            lang === 'kk' ? 'Қызылордаға қайту' : lang === 'en' ? 'Return to Kyzylorda' : 'Возвращение в Кызылорду',
        });
      }
      days.push({ day: dayIdx + 1, dateLabel, title: L(trip.name, lang), items: planItems });
      continue;
    }

    /* Қалалық күн */
    const items = perDay[cityDayIndices.indexOf(dayIdx)] ?? [];
    let clock = 9 * 60 + 30;
    for (const item of items) {
      planItems.push({
        time: minToClock(clock),
        kind: 'attraction',
        placeId: item.id,
        name: L(item.name, lang),
        howToGet: item.address,
        costLabel: ticketCostLabel(item, lang),
        costKnown: ticketCostKnown(item),
        mapsUrl: mapsUrl(item.map_query),
      });
      clock += item.visit_min + 30;
      if (item.id === 'old-bazaar-sybaga') {
        planItems.push({
          time: minToClock(clock),
          kind: 'meal',
          name:
            lang === 'kk'
              ? 'Базарда ыстық самса мен дәмдеуіштер'
              : lang === 'en'
                ? 'Hot samsa and spices at the market'
                : 'Горячая самса и специи на рынке',
          costLabel: unknown,
          costKnown: false,
        });
        unknownPrices.push(
          lang === 'kk'
            ? 'Сыбаға базарындағы тамақ'
            : lang === 'en'
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
          lang === 'kk'
            ? 'Еркін уақыт: қала бойымен серуен, базар'
            : lang === 'en'
              ? 'Free time: walk around the city, the bazaar'
              : 'Свободное время: прогулка по городу, базар',
      });
    } else if (clock < 17 * 60) {
      planItems.push({
        time: minToClock(clock),
        kind: 'free',
        name:
          lang === 'kk'
            ? 'Еркін уақыт: Сырдария жағалауында серуен'
            : lang === 'en'
              ? 'Free time: a walk along the Syr Darya embankment'
              : 'Свободное время: прогулка вдоль набережной Сырдарьи',
      });
    }
    days.push({ day: dayIdx + 1, dateLabel, items: planItems });
  }

  /* ---- Бюджет ---- */
  const budget: BudgetLine[] = [];
  const perNight =
    lang === 'kk' ? 'түніне' : lang === 'en' ? 'per night' : 'за ночь';
  const perPerson =
    lang === 'kk' ? 'адамға' : lang === 'en' ? 'per person' : 'с человека';

  if (nights > 0) {
    if (hotel.price_from_kzt != null) {
      budget.push({
        label: `${hotelName(lang)}: ${L(hotel.name, lang)}`,
        kind: 'hotel',
        amountLabel: `${formatKzt(hotel.price_from_kzt)} ${perNight} × ${nights} ${
          lang === 'kk' ? 'түн' : lang === 'en' ? 'nights' : 'ноч'
        }`,
        known: true,
        kzt: hotel.price_from_kzt * nights,
      });
    } else {
      budget.push({
        label: `${hotelName(lang)}: ${L(hotel.name, lang)}`,
        kind: 'hotel',
        amountLabel: unknown,
        known: false,
      });
      unknownPrices.push(L(hotel.name, lang));
    }
  }

  const allPlanned = perDay.flat();
  for (const item of allPlanned) {
    const tk = item.ticket;
    if (tk.currency === 'RUB') continue; // RUB — Байқоңыр, алда бөлек жол
    if (tk.adult_kzt == null) {
      unknownPrices.push(L(item.name, lang));
      continue;
    }
    if (tk.adult_kzt === 0) continue; // тегін — бюджетке енбейді
    budget.push({
      label: `${L(item.name, lang)} × ${t} ${lang === 'kk' ? 'адам' : lang === 'en' ? 'people' : 'чел.'}`,
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
          lang === 'kk'
            ? 'Байқоңыр: музей (аудиогид)'
            : lang === 'en'
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
          lang === 'kk'
            ? 'Байқоңыр: ғарыш айлағына топтық экскурсия'
            : lang === 'en'
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
      meaning: lang === 'kk' ? p.en : p[lang],
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

  return { answerText, itinerary: { days, budget, notes: notes.filter(Boolean), unknownPrices: uniqueUnknown, phrases } };
}

function hotelName(lang: Lang): string {
  return {
    kk: 'Қонақүй',
    en: 'Hotel',
    ru: 'Отель',
  }[lang];
}

function ticketCostLabel(a: Attraction, lang: Lang): string {
  const unknown = UNKNOWN(lang);
  const tk = a.ticket;
  if (tk.currency === 'RUB') {
    const parts: string[] = [];
    if (tk.museum_audio_guide_rub != null)
      parts.push(
        `${lang === 'kk' ? 'музей (аудиогид)' : lang === 'en' ? 'museum (audio guide)' : 'музей (аудиогид)'}: ${formatRub(tk.museum_audio_guide_rub)}`,
      );
    if (tk.cosmodrome_group_tour_rub != null)
      parts.push(
        `${lang === 'kk' ? 'ғарыш айлағы (топтық)' : lang === 'en' ? 'cosmodrome (group)' : 'космодром (группово)'}: ${formatRub(tk.cosmodrome_group_tour_rub)}`,
      );
    return parts.join(' · ');
  }
  if (tk.adult_kzt === 0) return { kk: 'Тегін', en: 'Free', ru: 'Бесплатно' }[lang];
  if (tk.adult_kzt == null) return unknown;
  return formatKzt(tk.adult_kzt);
}

function ticketCostKnown(a: Attraction): boolean {
  const tk = a.ticket;
  if (tk.currency === 'RUB') return true;
  if (tk.adult_kzt == null) return false;
  return true;
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
  const level = BUDGET_LEVEL_NAMES[lang][form.budgetLevel];
  const unknown = UNKNOWN(lang);

  const dArr = parseDateStr(form.arrival);
  const dDep = parseDateStr(form.departure);
  const datesLabel = datesOk && dArr && dDep
    ? `${formatDateLabel(form.arrival, lang)} – ${formatDateLabel(form.departure, lang)}`
    : lang === 'kk' ? 'күндер көрсетілмеген' : lang === 'en' ? 'no dates given' : 'даты не указаны';

  const interestNames =
    form.interests.length > 0
      ? form.interests
          .map((id) => {
            const opt = input.data.interest_options.find((o) => o.id === id);
            return opt ? opt[lang] : id;
          })
          .join(', ')
      : lang === 'kk' ? 'таңдалмаған' : lang === 'en' ? 'none selected' : 'не выбраны';

  const lines: string[] = [];

  const greet =
    lang === 'kk'
      ? 'Сәлеметсіз бе! Қызылорда үшін маршрут құрдым. 🌤'
      : lang === 'en'
        ? 'Hello! I have built an itinerary for you in Kyzylorda. 🌤'
        : 'Здравствуйте! Я составил маршрут для вас по Кызылорде. 🌤';
  lines.push(greet);

  lines.push('');
  const planTitle =
    lang === 'kk' ? 'Сіздің сұранысыңыз:' : lang === 'en' ? 'Your request:' : 'Ваш запрос:';
  lines.push(planTitle);
  lines.push(
    lang === 'kk'
      ? `• Күндері: ${datesLabel} (${nDays} күн)\n• Саяхатшылар: ${form.travelers} адам\n• Бюджет: ${level}\n• Қызығушылықтар: ${interestNames}`
      : lang === 'en'
        ? `• Dates: ${datesLabel} (${nDays} days)\n• Travelers: ${form.travelers}\n• Budget: ${level}\n• Interests: ${interestNames}`
        : `• Даты: ${datesLabel} (${nDays} дн.)\n• Путешественники: ${form.travelers}\n• Бюджет: ${level}\n• Интересы: ${interestNames}`,
  );

  const hotelLine =
    hotel.price_from_kzt != null
      ? lang === 'kk'
        ? `• Қонақүй: ${L(hotel.name, lang)} — түніне ${formatKzt(hotel.price_from_kzt)}-тен бастап${hotel.breakfast_included ? ' (таңғы ас қоса)' : ''}`
        : lang === 'en'
          ? `• Hotel: ${L(hotel.name, lang)} — from ${formatKzt(hotel.price_from_kzt)} per night${hotel.breakfast_included ? ' (breakfast included)' : ''}`
          : `• Отель: ${L(hotel.name, lang)} — от ${formatKzt(hotel.price_from_kzt)} за ночь${hotel.breakfast_included ? ' (с завтраком)' : ''}`
      : lang === 'kk'
        ? `• Қонақүй: ${L(hotel.name, lang)} — бағасы ${unknown}`
        : lang === 'en'
          ? `• Hotel: ${L(hotel.name, lang)} — price ${unknown}`
          : `• Отель: ${L(hotel.name, lang)} — цена ${unknown}`;
  lines.push(hotelLine);

  if (notes.length > 0) {
    lines.push('');
    lines.push(
      lang === 'kk' ? 'Маңызды ескертулер:' : lang === 'en' ? 'Important notes:' : 'Важные замечания:',
    );
    for (const n of notes) lines.push(`• ${n}`);
  }

  lines.push('');
  lines.push(
    lang === 'kk'
      ? 'Төменде күн бойынша кесте мен бюджет қорытындысы. Бағасы белгісіз орындар «нақтыланбаған» деп белгіленді — ойлап сан айтқан жоқпын.'
      : lang === 'en'
        ? 'Below is the day-by-day plan and the budget summary. Places with unknown prices are marked “not specified” — I never guess.'
        : 'Ниже — подневной план и итог по бюджету. Места с неизвестной ценой помечены «не указано» — я никогда не выдумываю.',
  );

  if (kztTotal > 0) {
    lines.push(
      lang === 'kk'
        ? `Нақты белгілі қосынды: шамамен ${formatKzt(kztTotal)}`
        : lang === 'en'
          ? `Total of known costs: about ${formatKzt(kztTotal)}`
          : `Сумма известных расходов: примерно ${formatKzt(kztTotal)}`,
    );
  }
  if (rubTotal > 0) {
    lines.push(
      lang === 'kk'
        ? `Байқоңырға арналған қосымша (RUB-пен, аударылмаған): ${formatRub(rubTotal)}`
        : lang === 'en'
          ? `Extra for Baikonur (in RUB, not converted): ${formatRub(rubTotal)}`
          : `Дополнительно для Байконура (в RUB, без конвертации): ${formatRub(rubTotal)}`,
    );
  }
  if (unknownPrices.length > 0) {
    lines.push(
      lang === 'kk'
        ? `Бағасы нақтыланбаған: ${unknownPrices.join(', ')}.`
        : lang === 'en'
          ? `Unknown prices: ${unknownPrices.join(', ')}.`
          : `Цены не указаны: ${unknownPrices.join(', ')}.`,
    );
  }

  if (phrases.length > 0) {
    lines.push('');
    lines.push(
      lang === 'kk'
        ? 'Жолда пайдалы сөздер:'
        : lang === 'en'
          ? 'Useful Kazakh phrases for the road:'
          : 'Полезные казахские фразы в пути:',
    );
    for (const p of phrases) lines.push(`• «${p.kk}» (${p.translit}) — ${p.meaning}`);
  }

  lines.push('');
  lines.push(input.data.meta.disclaimer[lang]);

  return lines.join('\n');
}

/* ------------------------------------------------------------------ */
/* API-ге жіберілетін формалық қорытынды (контекст)                     */
/* ------------------------------------------------------------------ */

export function summarizeForm(form: GuideForm, lang: Lang): string {
  const level = BUDGET_LEVEL_NAMES[lang][form.budgetLevel];
  const interests =
    form.interests.length > 0
      ? form.interests.join(', ')
      : lang === 'kk' ? 'таңдалмаған' : lang === 'en' ? 'none selected' : 'не выбраны';
  if (lang === 'kk') {
    return `Саяхат сұранысы: келу — ${form.arrival || 'нақтыланбаған'}, кету — ${form.departure || 'нақтыланбаған'}, саяхатшылар: ${form.travelers} адам, бюджет: ${level}, қызығушылықтар: ${interests}.`;
  }
  if (lang === 'ru') {
    return `Запрос на поездку: прибытие — ${form.arrival || 'не указано'}, отъезд — ${form.departure || 'не указано'}, путешественников: ${form.travelers}, бюджет: ${level}, интересы: ${interests}.`;
  }
  return `Trip request: arrival — ${form.arrival || 'not specified'}, departure — ${form.departure || 'not specified'}, travelers: ${form.travelers}, budget: ${level}, interests: ${interests}.`;
}
