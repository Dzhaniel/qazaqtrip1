/**
 * Netlify Function: /.netlify/functions/guide (netlify.toml арқылы /api/guide-ге қосылады).
 *
 * Netlify функцияларында SSE-стрим қиын, сондықтан мұнда толық JSON-жауап беріледі:
 * { mode: 'ai' | 'demo', answerText, itinerary? }
 * Клиент JSON-ны да SSE-ні де бірдей қолдайды, ал «streaming typing» анимациясын UI жағында жасайды.
 */
import { runGuide } from '../../server/guide-core';
import { getCity } from '../../src/data/cities';

interface NetlifyEvent {
  httpMethod?: string;
  body?: string;
  isBase64Encoded?: boolean;
}

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
};

export const handler = async (event: NetlifyEvent) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: JSON_HEADERS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: JSON_HEADERS, body: JSON.stringify({ error: 'method not allowed' }) };
  }

  let payload: unknown;
  try {
    const raw = event.isBase64Encoded && event.body ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
    payload = JSON.parse(raw || '{}');
  } catch {
    return { statusCode: 400, headers: JSON_HEADERS, body: JSON.stringify({ error: 'invalid json' }) };
  }

  const p = payload as { form?: unknown };
  if (!p || typeof p !== 'object' || !p.form) {
    return { statusCode: 400, headers: JSON_HEADERS, body: JSON.stringify({ error: 'form is required' }) };
  }

  const city = getCity('kyzylorda');
  if (!city) {
    return { statusCode: 500, headers: JSON_HEADERS, body: JSON.stringify({ error: 'city data missing' }) };
  }

  try {
    const result = await runGuide(p as Parameters<typeof runGuide>[0], city, () => {
      /* стрим мұнда қолданылмайды */
    });
    return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify(result) };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'guide error';
    return { statusCode: 500, headers: JSON_HEADERS, body: JSON.stringify({ error: message }) };
  }
};
