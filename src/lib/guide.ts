/**
 * Браузер-бағыттағы /api/guide клиенті.
 *
 * 1) Сервер функциясы болса:
 *    - Vercel: SSE-стрим (мәтін тікелей ағынмен келеді);
 *    - Netlify / JSON-жауап: толық JSON.
 * 2) Сервер мүлде қолжетімсіз болса (мыс., жай `vite dev`):
 *    демо режим локальді іске қосылады — қосымша ешқашан өшіп қалмайды.
 *
 * ЕСКЕРТУ: API кілт тек серверде (environment variable), браузерге бармайды.
 */
import { getCity } from '../data/cities';
import { buildDemoItinerary, type GuidePayload, type Itinerary } from './demoItinerary';

export interface GuideResult {
  mode: 'ai' | 'demo';
  text: string;
  itinerary?: Itinerary;
}

export class GuideAbortedError extends Error {
  constructor() {
    super('aborted');
    this.name = 'GuideAbortedError';
  }
}

interface SseEvent {
  type: 'delta' | 'done' | 'error';
  text?: string;
  full?: string;
  mode?: 'ai' | 'demo';
  itinerary?: Itinerary;
  message?: string;
}

/** Модель жауабының аяғындағы ```itinerary ... ``` JSON-блокін алу. */
export function extractItinerary(text: string): Itinerary | undefined {
  const re = /```itinerary\s*([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  let last = '';
  while ((m = re.exec(text)) !== null) last = m[1];
  if (!last) return undefined;
  try {
    const parsed = JSON.parse(last) as Itinerary;
    if (parsed && Array.isArray(parsed.days)) return parsed;
  } catch {
    /* JSON емес — мәтін ғана қалады */
  }
  return undefined;
}

async function readSse(
  body: ReadableStream<Uint8Array>,
  onDelta: (t: string) => void,
  signal?: AbortSignal,
): Promise<SseEvent | undefined> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let lastDone: SseEvent | undefined;
  try {
    for (;;) {
      if (signal?.aborted) throw new GuideAbortedError();
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf('\n\n')) >= 0) {
        const rawEvent = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        for (const line of rawEvent.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          let ev: SseEvent;
          try {
            ev = JSON.parse(line.slice(6)) as SseEvent;
          } catch {
            continue;
          }
          if (ev.type === 'delta' && ev.text) onDelta(ev.text);
          else if (ev.type === 'done') lastDone = ev;
          else if (ev.type === 'error') throw new Error(ev.message || 'stream error');
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
  return lastDone;
}

export async function requestGuide(
  payload: GuidePayload,
  onDelta: (t: string) => void,
  signal?: AbortSignal,
): Promise<GuideResult> {
  let full = '';
  const wrapped = (t: string) => {
    full += t;
    onDelta(t);
  };

  try {
    const res = await fetch('/api/guide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (!res.body) throw new Error('no body');

    const ct = res.headers.get('content-type') ?? '';

    if (ct.includes('application/json')) {
      const data = (await res.json()) as {
        mode?: 'ai' | 'demo';
        answerText?: string;
        itinerary?: Itinerary;
        error?: string;
      };
      if (data.error) throw new Error(data.error);
      const text = data.answerText ?? '';
      return {
        mode: data.mode === 'ai' ? 'ai' : 'demo',
        text,
        itinerary: data.itinerary ?? extractItinerary(text),
      };
    }

    const done = await readSse(res.body, wrapped, signal);
    const finalText = done?.full ?? full;
    return {
      mode: done?.mode === 'demo' ? 'demo' : 'ai',
      text: finalText,
      itinerary: done?.itinerary ?? extractItinerary(finalText),
    };
  } catch (e) {
    if (
      e instanceof GuideAbortedError ||
      (e instanceof DOMException && e.name === 'AbortError')
    ) {
      throw new GuideAbortedError();
    }
    // Сервер қолжетімсіз немесе қате — локальді демо режим.
    const city = getCity('kyzylorda');
    if (!city) throw new Error('city data not found');
    const demo = buildDemoItinerary(city, payload.form);
    return { mode: 'demo', text: demo.answerText, itinerary: demo.itinerary };
  }
}
