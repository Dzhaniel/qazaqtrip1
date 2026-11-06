/**
 * Серверлік ядро /api/guide (Vercel және Netlify функцияларына ортақ).
 *
 * - OPENAI_API_KEY болмаса  => демо режим: маршрут локальді JSON-нан құрылады;
 * - кілт болса              => OpenAI-ға stream-сұраныс, толық kyzylorda.json
 *                              жүйелік нұсқауға (system prompt) салынады.
 *
 * Кілт ЕШҚАШАН клиентке жіберілмейді.
 */
import type { CityData, Lang } from '../src/data/types';
import {
  buildDemoItinerary,
  summarizeForm,
  type AiTexts,
  type GuidePayload,
  type Itinerary,
  type PlanItem,
} from '../src/lib/demoItinerary';
import { localizeItinerary } from '../src/lib/itineraryLocalize';

export interface GuideServerResult {
  mode: 'ai' | 'demo';
  answerText: string;
  itinerary?: Itinerary;
}

/** Тіл whitelist-і (brief: kk, en, ru, ko[, tr — қазір деректерде жоқ]); invalid → 'kk'. */
const LANG_WHITELIST: Lang[] = ['kk', 'en', 'ru', 'ko'];

export function resolveLang(v: unknown): Lang {
  return typeof v === 'string' && (LANG_WHITELIST as string[]).includes(v) ? (v as Lang) : 'kk';
}

function langName(lang: Lang): string {
  switch (lang) {
    case 'kk':
      return 'Kazakh (keep it natural, use Kazakh Cyrillic with ә ғ қ ң ө ұ ү һ і)';
    case 'ru':
      return 'Russian';
    case 'ko':
      return 'Korean (natural, polite 합니다체; write in Hangul)';
    default:
      return 'English';
  }
}

function buildSystemPrompt(data: CityData, lang: Lang, kzMode: boolean): string {
  const lname = langName(lang);

  const parts: string[] = [];
  parts.push(
    'You are a friendly Kazakhstan travel guide for Kyzylorda. Use ONLY the places, hotels, prices, hours and phrases in the provided JSON. If a value is null or missing, say it is not specified and advise checking officially, never guess. Respect opening hours (for example museum closed on Monday, lunch break). Mention the Baikonur permit warning and the distance of day trips before suggesting them. Give a day-by-day timeline with time, place and cost only where the data has a price; finish with a budget summary listing which items have unknown prices. Prices must be in KZT as in the data (RUB for Baikonur).',
  );
  if (lang === 'ko') {
    parts.push(
      'Korean mode: all text fields in natural polite Korean (합니다체). The app displays place names itself as “Korean name (Қазақша атауы)” from the data — you must NOT rewrite names, just reference place_id. When helpful, include 2-3 short Kazakh phrases from the data (Cyrillic) for each stop, with their Korean translation.',
    );
  }
  parts.push(`Write all text fields (summary, day title, stop_tip, budget_note, warnings) in ${lname}. Use natural, polite wording (Korean: 합니다체). Keep Kazakh proper names as given. Do not add facts that are not in the provided data.`);
  if (kzMode) {
    parts.push('');
    parts.push(
      'KAZAKH PRACTICE MODE (user is learning Kazakh): answer ONLY in simple Kazakh — short, easy sentences with basic vocabulary. After your answer add a line «Жаңа сөздер:» and list exactly 2-3 key Kazakh words used in your answer, each in the format: «word» (transliteration) — meaning in the user\'s language. Keep the no-invention rule: if the data has no value, say «нақтыланбаған». If the user asks a language question (teach a word/phrase, translate), you may skip the itinerary JSON block entirely.',
    );
  }
  parts.push(
    'The user\'s trip details from the planner form are given as "Trip context" in the last user message. The free chat may ask follow-up questions — answer them using the same JSON.',
  );
  parts.push('');
  parts.push(
    'IMPORTANT OUTPUT FORMAT: after your free-text answer, ALWAYS finish with a fenced block exactly like this (valid STRICT JSON only, no comments, no trailing commas):',
  );
  parts.push('```itinerary');
  parts.push(
    '{ "summary": "<1-2 sentences in the answer language>", "days": [ { "day": 1, "title": "<day title in the answer language>", "items": [ { "order": 1, "time": "09:30", "kind": "attraction", "place_id": "<id from the data>", "duration_min": 40, "estimated_cost_kzt": 300, "stop_tip": "<1-2 sentence tip in the answer language>", "phrases": [ { "kk": "<Kazakh phrase, Cyrillic, from the data>", "translation": "<translation in the answer language>" } ] } ] } ], "budget": [ { "label": "<short label in the answer language>", "kind": "hotel|ticket|tour|other", "amountLabel": "<amount in the answer language>", "known": true, "kzt": 12000, "rub": null } ], "budget_note": "<1-2 sentences in the answer language>", "warnings": [ "<warning in the answer language>" ] }',
  );
  parts.push('```');
  parts.push(
    'STRICT RULES: "kind" is one of attraction|hotel|meal|free|travel. "place_id" MUST be exactly one of the ids present in the provided data (attractions[].id or hotels[].id). NEVER invent a place_id, a place, a price or a coordinate. Do NOT write place names, addresses or categories — the app fills them from the data; for kind travel|meal|free (no place_id) you may give a short "name" in the answer language. "estimated_cost_kzt" must equal the exact price from the data for that place; if the data has no price, use null (never guess). Baikonur prices stay RUB — put them in "estimated_cost_rub". "budget": hotel line = hotel price_from_kzt per night (x nights), ticket lines only where the data has a price, unknown => known:false with label in the answer language. "phrases": 2-3 Kazakh phrases (Cyrillic) taken from the data\'s "kazakh_phrases" that fit this stop; "translation" in the answer language. Finish the free-text answer with the budget summary (in the answer language).',
  );
  parts.push('');
  parts.push('DATA (the ONLY source of truth):');
  parts.push('```json');
  parts.push(JSON.stringify(data));
  parts.push('```');
  return parts.join('\n');
}

export async function runGuide(
  payload: GuidePayload,
  data: CityData,
  onDelta: (t: string) => void,
): Promise<GuideServerResult> {
  const lang = resolveLang(payload.lang ?? payload.form?.language);
  const kzMode = payload.form?.kz_mode === true;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const demo = buildDemoItinerary(data, payload.form, payload.chatText);
    return { mode: 'demo', answerText: demo.answerText, itinerary: localizeItinerary(demo.itinerary, data, lang) };
  }

  const model = process.env.GUIDE_MODEL || 'gpt-4o-mini';
  const system = buildSystemPrompt(data, lang, kzMode);

  const formContext = `Trip context: ${summarizeForm(payload.form, lang)}`;
  const history = (payload.messages ?? [])
    .filter((m) => m && typeof m.content === 'string' && m.content.length > 0)
    .slice(-10)
    .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

  const lastUser =
    payload.chatText && payload.chatText.trim().length > 0
      ? `${formContext}\n\n${payload.chatText.trim()}`
      : formContext;

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.6,
      max_tokens: 2200,
      stream: true,
      messages: [
        { role: 'system', content: system },
        ...history,
        { role: 'user', content: lastUser },
      ],
    }),
    signal: AbortSignal.timeout(90_000),
  });

  if (!resp.ok || !resp.body) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`OpenAI HTTP ${resp.status}${errText ? `: ${errText.slice(0, 300)}` : ''}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let full = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf('\n\n')) >= 0) {
        const rawEvent = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        for (const line of rawEvent.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const dataStr = line.slice(6).trim();
          if (dataStr === '[DONE]') continue;
          let chunk: { choices?: Array<{ delta?: { content?: string } }> };
          try {
            chunk = JSON.parse(dataStr);
          } catch {
            continue;
          }
          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) {
            full += delta;
            onDelta(delta);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (!full.trim()) throw new Error('empty response from model');

  // Парсинг itinerary JSON-блокi (клиент те қайта парсилайды).
  const re = /```itinerary\s*([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  let last = '';
  while ((m = re.exec(full)) !== null) last = m[1];
  let itinerary: Itinerary | undefined;
  if (last) {
    try {
      const parsed: unknown = JSON.parse(last);
      const adapted = adaptAiItinerary(parsed);
      if (adapted) itinerary = localizeItinerary(adapted, data, lang);
    } catch {
      /* қалдырмаймыз */
    }
  }

  return { mode: 'ai', answerText: full, itinerary };
}

/* ---- AI жауабын (place_id-схемасы) app-тапшырмаға бейімдеу ---- */

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim().length > 0 ? v : undefined;
}
function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function adaptAiItinerary(raw: unknown): Itinerary | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, any>;
  const kindOk = (k: unknown) =>
    k === 'attraction' || k === 'hotel' || k === 'meal' || k === 'free' || k === 'travel';
  const daysRaw: unknown[] = Array.isArray(r.days) ? r.days : [];
  const days = daysRaw
    .map((d: any, di: number) => {
      const itemsRaw: unknown[] = Array.isArray(d?.items) ? d.items : [];
      const items = itemsRaw
        .map((it: any, ii: number) => {
          const base: PlanItem = {
            time: str(it?.time),
            kind: kindOk(it?.kind) ? it.kind : 'attraction',
            placeId: str(it?.place_id),
            order: num(it?.order) ?? ii + 1,
            name: str(it?.name) ?? '',
            tip: str(it?.stop_tip),
            durationMin: num(it?.duration_min),
            estimatedCostKzt: num(it?.estimated_cost_kzt),
            phrases: Array.isArray(it?.phrases)
              ? (it.phrases as any[])
                  .map((p: any) => ({
                    kk: str(p?.kk) ?? '',
                    translit: str(p?.translit) ?? '',
                    meaning: str(p?.translation) ?? str(p?.meaning) ?? '',
                    reviewed: false,
                  }))
                  .filter((p) => p.kk.length > 0)
              : undefined,
          };
          return base;
        })
        .filter((it) => Boolean(it.name) || Boolean(it.placeId));
      return { day: num(d?.day) ?? di + 1, title: str(d?.title), items };
    })
    .filter((d) => d.items.length > 0);
  if (days.length === 0) return null;

  const budget = (Array.isArray(r.budget) ? r.budget : [] as unknown[]).map((b: any) => ({
    label: str(b?.label) ?? '',
    kind: b?.kind === 'hotel' || b?.kind === 'ticket' || b?.kind === 'tour' ? b.kind : 'other',
    amountLabel: str(b?.amountLabel) ?? '',
    known: b?.known === true,
    kzt: b?.known === true ? (num(b?.kzt) ?? null) : null,
    rub: b?.known === true ? (num(b?.rub) ?? null) : null,
  }));
  const notes = [
    ...(Array.isArray(r.warnings) ? r.warnings : []).map((n: unknown) => str(n) ?? '').filter(Boolean),
    ...(Array.isArray(r.notes) ? r.notes : []).map((n: unknown) => str(n) ?? '').filter(Boolean),
  ];
  const phrases = (Array.isArray(r.phrases) ? r.phrases : [])
    .map((p: any) => ({
      kk: str(p?.kk) ?? '',
      translit: str(p?.translit) ?? '',
      meaning: str(p?.translation) ?? str(p?.meaning) ?? '',
      reviewed: false,
    }))
    .filter((p) => p.kk.length > 0);

  return {
    days,
    budget,
    notes,
    unknownPrices: (Array.isArray(r.unknownPrices) ? r.unknownPrices : [])
      .filter((u): u is string => typeof u === 'string' && u.trim().length > 0),
    phrases,
    summary: str(r.summary),
    budgetNote: str(r.budget_note) ?? str(r.budgetNote),
  };
}

/* ---- mode=translate: AI-мәтіндерді ғана мақсат тіліне аудару (жол қайта құрылмайды) ---- */

export async function runGuideTranslate(payload: { lang?: unknown; texts?: unknown }): Promise<AiTexts> {
  const lang = resolveLang(payload.lang);
  const texts = (payload.texts ?? {}) as Record<string, unknown>;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('no-key');

  const arr = (v: unknown): string[] =>
    Array.isArray(v) ? v.map((x) => (typeof x === 'string' ? x : '')).filter((x) => x) : [];
  const normalized: AiTexts = {
    summary: typeof texts.summary === 'string' ? texts.summary : undefined,
    dayTitles: arr(texts.dayTitles),
    tips: arr(texts.tips),
    notes: arr(texts.notes),
    budgetLabels: arr(texts.budgetLabels),
    budgetNote: typeof texts.budgetNote === 'string' ? texts.budgetNote : undefined,
  };

  const system =
    `You are a professional travel-content translator. Translate ONLY the text fields of the given itinerary into ${langName(lang)}. ` +
    'Keep the meaning exactly as in the source (it may be Kazakh, English, Russian or Korean). Do not add or remove facts; keep the same number of items in every array and the same order. ' +
    'Keep proper names unchanged: Kazakh Cyrillic place names and Korean (Hangul) names stay as they are; keep numbers, currency and symbols unchanged. ' +
    'Return STRICT JSON with exactly this shape and nothing else (no markdown, no comments): {"summary": "...", "dayTitles": ["..."], "tips": ["..."], "notes": ["..."], "budgetLabels": ["..."], "budgetNote": "..."}. Use natural, polite wording (Korean: 합니다체).';

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.GUIDE_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: JSON.stringify(normalized) },
      ],
      temperature: 0.3,
      max_tokens: 1200,
      stream: false,
    }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`OpenAI HTTP ${resp.status}${errText ? `: ${errText.slice(0, 200)}` : ''}`);
  }
  const json = (await resp.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = json.choices?.[0]?.message?.content ?? '';
  if (!content.trim()) throw new Error('empty response from model');
  const cleaned = content
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('invalid JSON from translate');
  }
  return {
    summary: typeof parsed.summary === 'string' ? parsed.summary : normalized.summary,
    dayTitles: arr(parsed.dayTitles),
    tips: arr(parsed.tips),
    notes: arr(parsed.notes),
    budgetLabels: arr(parsed.budgetLabels),
    budgetNote: typeof parsed.budgetNote === 'string' ? parsed.budgetNote : normalized.budgetNote,
  };
}
