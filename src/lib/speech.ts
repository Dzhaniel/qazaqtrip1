/**
 * Озвучка фраз через browser SpeechSynthesis (lang kk-KZ).
 * Если казахского голоса нет — используем системный голос и сообщаем об этом UI.
 */

export type SpeechResult = 'ok' | 'no-kk-voice' | 'unsupported' | 'error';

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function allVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSupported()) return [];
  return window.speechSynthesis.getVoices();
}

export function findKazakhVoice(): SpeechSynthesisVoice | null {
  return (
    allVoices().find((v) => v.lang.toLowerCase().replace('_', '-').startsWith('kk')) ?? null
  );
}

/** Ждём, пока браузер загрузит список голосов (иногда пуст на старте). */
export function whenVoicesReady(timeoutMs = 1500): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!isSpeechSupported()) return resolve([]);
    const existing = allVoices();
    if (existing.length > 0) return resolve(existing);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.speechSynthesis.removeEventListener('voiceschanged', finish);
      resolve(allVoices());
    };
    window.speechSynthesis.addEventListener('voiceschanged', finish);
    window.setTimeout(finish, timeoutMs);
  });
}

let activeUtterance: SpeechSynthesisUtterance | null = null;

export function stopSpeech(): void {
  if (!isSpeechSupported()) return;
  window.speechSynthesis.cancel();
  activeUtterance = null;
}

/**
 * Читает фразу на казахском.
 * @returns 'ok' — прозвучало казахским голосом;
 *          'no-kk-voice' — прозвучало системным голосом (нет kk-голоса);
 *          'unsupported' — браузер не поддерживает озвучку;
 *          'error' — сбой синтеза.
 */
export async function speakKazakh(text: string): Promise<SpeechResult> {
  if (!isSpeechSupported()) return 'unsupported';
  const synth = window.speechSynthesis;
  synth.cancel();

  const voices = await whenVoicesReady();
  const kkVoice = voices.find((v) =>
    v.lang.toLowerCase().replace('_', '-').startsWith('kk'),
  );
  const fallbackVoice =
    voices.find((v) => /^ru/i.test(v.lang)) ??
    voices.find((v) => /^en/i.test(v.lang)) ??
    null;
  const voice = kkVoice ?? fallbackVoice;

  return new Promise<SpeechResult>((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    if (voice) utterance.voice = voice;
    utterance.lang = 'kk-KZ';
    utterance.rate = 0.92;
    utterance.pitch = 1;

    let settled = false;
    const finish = (r: SpeechResult) => {
      if (settled) return;
      settled = true;
      if (activeUtterance === utterance) activeUtterance = null;
      resolve(r);
    };

    utterance.onend = () => finish(kkVoice ? 'ok' : 'no-kk-voice');
    utterance.onerror = (e) => {
      // 'interrupted' / 'canceled' — пользователь нажал другую фразу, не ошибка.
      if (e.error === 'interrupted' || e.error === 'canceled') finish('ok');
      else finish('error');
    };

    activeUtterance = utterance;
    synth.speak(utterance);
    // Страховка: некоторые браузеры не вызывают события.
    window.setTimeout(() => finish(kkVoice ? 'ok' : 'no-kk-voice'), 20000);
  });
}
