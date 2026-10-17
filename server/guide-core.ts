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
  type GuidePayload,
  type Itinerary,
} from '../src/lib/demoItinerary';

export interface GuideServerResult {
  mode: 'ai' | 'demo';
  answerText: string;
  itinerary?: Itinerary;
}

function buildSystemPrompt(data: CityData, lang: Lang): string {
  const langName =
    lang === 'kk' ? 'Kazakh (keep it natural, use Kazakh Cyrillic with ә ғ қ ң ө ұ ү һ і)' : lang === 'ru' ? 'Russian' : 'English';

  const parts: string[] = [];
  parts.push(
    'You are a friendly Kazakhstan travel guide for Kyzylorda. Use ONLY the places, hotels, prices, hours and phrases in the provided JSON. If a value is null or missing, say it is not specified and advise checking officially, never guess. Respect opening hours (for example museum closed on Monday, lunch break). Mention the Baikonur permit warning and the distance of day trips before suggesting them. Answer in Kazakh by default or in the user\'s selected language, keep Kazakh natural, add 1-2 short Kazakh phrases from the data with translation. Give a day-by-day timeline with time, place, how to get there and cost only where the data has a price; finish with a budget summary listing which items have unknown prices. Prices must be in KZT as in the data (RUB for Baikonur).',
  );
  parts.push(`Answer language for this conversation: ${langName}.`);
  parts.push(
    'The user\'s trip details from the planner form are given as "Trip context" in the last user message. The free chat may ask follow-up questions — answer them using the same JSON.',
  );
  parts.push('');
  parts.push(
    'IMPORTANT OUTPUT FORMAT: after your free-text answer, ALWAYS finish with a fenced block exactly like this (valid JSON inside, no comments):',
  );
  parts.push('```itinerary');
  parts.push(
    '{ "days": [ { "day": 1, "dateLabel": "17 қазан", "items": [ { "time": "09:30", "kind": "attraction", "name": "…", "howToGet": "…", "costLabel": "300 ₸ | 400 RUB | <not specified in the answer language>", "costKnown": true, "warning": "only for real warnings like the Baikonur permit" } ] } ], "budget": [ { "label": "…", "kind": "hotel", "amountLabel": "…", "known": true, "kzt": 12000, "rub": null } ], "notes": ["…"], "unknownPrices": ["…"], "phrases": [ { "kk": "…", "translit": "…", "meaning": "…" } ] }',
  );
  parts.push('```');
  parts.push(
    'Rules for the JSON: "kind" is one of attraction|hotel|meal|free|travel; hotel budget uses the hotel price_from_kzt per night; ticket lines only where the JSON has a price; Baikonur prices stay in RUB (rub field) and are never converted; unknown prices => known:false and the label in the answer language meaning "not specified".',
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
  const lang: Lang = payload.form?.language === 'en' || payload.form?.language === 'ru' ? payload.form.language : 'kk';

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const demo = buildDemoItinerary(data, payload.form);
    return { mode: 'demo', answerText: demo.answerText, itinerary: demo.itinerary };
  }

  const model = process.env.GUIDE_MODEL || 'gpt-4o-mini';
  const system = buildSystemPrompt(data, lang);

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
      const parsed = JSON.parse(last) as Itinerary;
      if (parsed && Array.isArray(parsed.days)) itinerary = parsed;
    } catch {
      /* қалдырмаймыз */
    }
  }

  return { mode: 'ai', answerText: full, itinerary };
}
