/**
 * Vercel Serverless Function: POST /api/guide
 *
 * Запрос:  { form: GuideForm, messages: [{role, content}], chatText?: string }
 * Ответ:   SSE-стрим (data: {"type":"delta"|"done"|"error", ...})
 *
 * OpenAI-кілт тек процесс-әйнекшелерден (OPENAI_API_KEY), браузерге бармайды.
 */
import { runGuide } from '../server/guide-core';
import { getCity } from '../src/data/cities';

interface Req {
  method?: string;
  body: unknown;
}

interface Res {
  status(code: number): Res;
  setHeader(key: string, value: string): void;
  write(chunk: string): void;
  end(): void;
  json(obj: unknown): void;
}

export default async function handler(req: Req, res: Res): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  let payload: unknown;
  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    res.status(400).json({ error: 'invalid json' });
    return;
  }

  const p = payload as { form?: unknown };
  if (!p || typeof p !== 'object' || !p.form) {
    res.status(400).json({ error: 'form is required' });
    return;
  }

  const city = getCity('kyzylorda');
  if (!city) {
    res.status(500).json({ error: 'city data missing' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Accel-Buffering', 'no');

  const send = (obj: unknown): void => {
    res.write(`data: ${JSON.stringify(obj)}\n\n`);
  };

  try {
    const result = await runGuide(
      p as Parameters<typeof runGuide>[0],
      city,
      (t) => send({ type: 'delta', text: t }),
    );
    if (result.mode === 'demo') {
      // Демо жауабы бір кесіндіде келеді — анимацияны клиент жасайды.
      send({ type: 'delta', text: result.answerText });
    }
    send({ type: 'done', mode: result.mode, full: result.answerText, itinerary: result.itinerary });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'guide error';
    send({ type: 'error', message });
  }

  res.end();
}
