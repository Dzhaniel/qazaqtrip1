import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CalendarDays,
  CircleAlert,
  FlaskConical,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  Square,
  User,
  Wand2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CityData, Lang } from '../../data/types';
import {
  requestGuide,
  GuideAbortedError,
} from '../../lib/guide';
import type { BudgetLevel, GuideForm, Itinerary } from '../../lib/demoItinerary';
import { cn, L, uid } from '../../lib/utils';
import ItineraryView from './ItineraryView';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  shown: string;
  done: boolean;
  mode?: 'ai' | 'demo';
  itinerary?: Itinerary;
  isPlan?: boolean;
}

interface Props {
  data: CityData;
  lang: Lang;
  compact?: boolean;
  /** Готовое предзаполнение формы (например, из floating-планера на главной). */
  initialForm?: Partial<GuideForm>;
}

const BUDGETS: BudgetLevel[] = ['economy', 'medium', 'high'];
const LANGS: Lang[] = ['kk', 'en', 'ru'];

export default function GuideWidget({ data, lang, compact = false, initialForm }: Props) {
  const { t } = useTranslation();

  const [form, setForm] = useState<GuideForm>(() => ({
    arrival: '',
    departure: '',
    travelers: 2,
    budgetLevel: 'medium',
    interests: [],
    language: lang,
    ...initialForm,
  }));
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<'idle' | 'working' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [input, setInput] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const lastPayloadRef = useRef<{ form: GuideForm; chatText?: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  // Жауап тілі бойынша default (UI тілімен синхрон); алғашқы render-де — алмастырмаймыз,
  // өйткені initialForm тілін планер қолдан таңдаған болуы мүмкін.
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    setForm((f) => ({ ...f, language: lang }));
  }, [lang]);

  useEffect(() => {
    if (typeof bottomRef.current?.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, status]);

  /* ---------- Typewriter: shown -> text ---------- */
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'assistant' || last.done) return;
    if (last.shown.length >= last.text.length) {
      setMessages((prev) => prev.map((m) => (m.id === last.id ? { ...m, done: true, shown: m.text } : m)));
      return;
    }
    const iv = window.setInterval(() => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== last.id) return m;
          const nextLen = Math.min(m.text.length, m.shown.length + 4);
          return { ...m, shown: m.text.slice(0, nextLen), done: nextLen >= m.text.length };
        }),
      );
    }, 24);
    return () => window.clearInterval(iv);
  }, [messages]);

  const working = status === 'working';

  const send = useCallback(
    async (chatText?: string, asPlan = false) => {
      if (working) return;
      abortRef.current?.abort();

      const userText =
        asPlan
          ? `${t('guide.form_summary.dates')}: ${form.arrival || '—'} → ${form.departure || '—'} · ${form.travelers} ${t('guide.form_summary.travelers')} · ${t(`guide.budget_level.${form.budgetLevel}`)}${
              form.interests.length
                ? ` · ${t('guide.form_summary.interests')}: ${form.interests
                    .map((id) => data.interest_options.find((o) => o.id === id)?.[form.language] ?? id)
                    .join(', ')}`
                : ''
            }`
          : chatText ?? '';

      if (!userText.trim()) return;

      const history = messages
        .filter((m) => m.done)
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.text }));

      const payload = {
        form,
        messages: history,
        chatText: asPlan ? undefined : userText,
      };
      lastPayloadRef.current = { form, chatText: asPlan ? undefined : userText };

      const userMsg: Message = {
        id: uid(),
        role: 'user',
        text: userText,
        shown: userText,
        done: true,
        isPlan: asPlan,
      };
      const botId = uid();
      const botMsg: Message = { id: botId, role: 'assistant', text: '', shown: '', done: false };

      setMessages((prev) => [...prev, userMsg, botMsg]);
      setStatus('working');
      setErrorMsg('');

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await requestGuide(
          payload,
          (delta) => {
            setMessages((prev) =>
              prev.map((m) => (m.id === botId ? { ...m, text: m.text + delta, shown: m.shown + delta } : m)),
            );
          },
          controller.signal,
        );
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botId
              ? {
                  ...m,
                  text: res.text,
                  mode: res.mode,
                  itinerary: res.itinerary,
                  // Стрим болса — shown мәтінімен үйлеседі; әйтпесе typewriter жалғайды
                  shown: m.shown.length >= res.text.length ? res.text : m.shown,
                  done: m.shown.length >= res.text.length,
                }
              : m,
          ),
        );
        setStatus('idle');
      } catch (e) {
        if (e instanceof GuideAbortedError) {
          // тоқтатылды — жиналған бөлігі қалады
          setMessages((prev) =>
            prev.map((m) => (m.id === botId ? { ...m, done: true, shown: m.text, text: m.text } : m)),
          );
          setStatus('idle');
          return;
        }
        setMessages((prev) => prev.filter((m) => m.id !== botId));
        setStatus('error');
        setErrorMsg(e instanceof Error ? e.message : String(e));
      } finally {
        abortRef.current = null;
      }
    },
    [working, form, messages, data, t, lang],
  );

  const stop = () => abortRef.current?.abort();

  const toggleInterest = (id: string) =>
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(id)
        ? f.interests.filter((x) => x !== id)
        : [...f.interests, id],
    }));

  return (
    <div className="space-y-5">
      {/* ---------- Planner form ---------- */}
      <form
        className="card space-y-4 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          void send(undefined, true);
        }}
      >
        <p className="flex items-center gap-2 text-sm font-bold text-navy-700">
          <Wand2 size={16} className="text-gold-600" aria-hidden="true" />
          {t('guide.form_title')}
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-navy-500">
              <CalendarDays size={13} aria-hidden="true" />
              {t('guide.arrival')}
            </span>
            <input
              type="date"
              className="input"
              value={form.arrival}
              onChange={(e) => setForm((f) => ({ ...f, arrival: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-navy-500">
              <CalendarDays size={13} aria-hidden="true" />
              {t('guide.departure')}
            </span>
            <input
              type="date"
              className="input"
              value={form.departure}
              min={form.arrival || undefined}
              onChange={(e) => setForm((f) => ({ ...f, departure: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-navy-500">
              <User size={13} aria-hidden="true" />
              {t('guide.travelers')}
            </span>
            <input
              type="number"
              className="input"
              min={1}
              max={12}
              value={form.travelers}
              onChange={(e) =>
                setForm((f) => ({ ...f, travelers: Math.max(1, Math.min(12, Number(e.target.value) || 1)) }))
              }
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-navy-500">{t('guide.language')}</span>
            <select
              className="input"
              value={form.language}
              onChange={(e) => setForm((f) => ({ ...f, language: e.target.value as Lang }))}
            >
              {LANGS.map((l) => (
                <option key={l} value={l}>
                  {t(`guide.lang_${l}`)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-bold text-navy-500">{t('guide.budget')}</span>
          <div className="flex flex-wrap gap-2">
            {BUDGETS.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setForm((f) => ({ ...f, budgetLevel: b }))}
                className={form.budgetLevel === b ? 'chip-on' : 'chip-off'}
                aria-pressed={form.budgetLevel === b}
              >
                {t(`guide.budget_level.${b}`)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-bold text-navy-500">{t('guide.interests')}</span>
          <div className="flex flex-wrap gap-2">
            {data.interest_options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleInterest(opt.id)}
                className={form.interests.includes(opt.id) ? 'chip-on' : 'chip-off'}
                aria-pressed={form.interests.includes(opt.id)}
              >
                {L(opt, form.language)}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" className="btn-gold w-full sm:w-auto" disabled={working}>
          {working ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Sparkles size={16} aria-hidden="true" />}
          {working ? t('guide.planning') : t('guide.submit')}
        </button>
      </form>

      {/* ---------- Chat ---------- */}
      <div className={cn('card flex flex-col overflow-hidden', compact ? 'min-h-[300px]' : 'min-h-[380px]')}>
        <div className="thin-scroll max-h-[480px] flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && !working && status !== 'error' && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-600">
                <Sparkles size={22} aria-hidden="true" />
              </span>
              <p className="max-w-sm text-sm leading-relaxed text-navy-400">{t('guide.subtitle')}</p>
              <div className="flex max-w-xl flex-wrap justify-center gap-2">
                {(t('guide.suggestions', { returnObjects: true }) as unknown as string[]).map(
                  (s: string, i: number) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setInput(s)}
                      className="chip-off max-w-full text-left"
                      title={t('guide.suggestions_title')}
                    >
                      <span className="clamp-1">{s}</span>
                    </button>
                  ),
                )}
              </div>
            </div>
          )}

          {messages.map((m) =>
            m.role === 'user' ? (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-teal-600 px-4 py-2.5 text-sm leading-relaxed text-white">
                  {m.isPlan && (
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gold-300">
                      {t('guide.submit')}
                    </p>
                  )}
                  {m.text}
                </div>
              </div>
            ) : (
              <div key={m.id} className="flex items-start gap-2.5">
                <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-teal-600 text-white">
                  <Sparkles size={14} aria-hidden="true" />
                </span>
                <div className="max-w-[92%] flex-1">
                  <div className="rounded-2xl rounded-tl-md border border-navy-100 bg-white px-4 py-3 shadow-sm">
                    {m.shown === '' && !m.done ? (
                      <span className="flex items-center gap-1.5 py-1 text-sm text-navy-400" role="status">
                        <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-teal-500" />
                        <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-teal-500 [animation-delay:200ms]" />
                        <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-teal-500 [animation-delay:400ms]" />
                      </span>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-navy-700">
                        {m.shown}
                        {!m.done && <span className="ml-0.5 inline-block h-4 w-2 animate-blink bg-teal-600 align-text-bottom" />}
                      </p>
                    )}
                    {m.mode && m.done && (
                      <p
                        className={cn(
                          'mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
                          m.mode === 'demo' ? 'bg-gold-100 text-gold-700' : 'bg-teal-50 text-teal-700',
                        )}
                        title={m.mode === 'demo' ? t('guide.demo_mode_hint') : undefined}
                      >
                        {m.mode === 'demo' ? <FlaskConical size={11} aria-hidden="true" /> : <Sparkles size={11} aria-hidden="true" />}
                        {m.mode === 'demo' ? t('guide.demo_mode') : t('guide.ai_mode')}
                      </p>
                    )}
                    {m.itinerary && m.done && <ItineraryView it={m.itinerary} />}
                  </div>
                </div>
              </div>
            ),
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-red-200 bg-red-50 p-5 text-center">
              <CircleAlert size={22} className="text-red-600" aria-hidden="true" />
              <p className="text-sm font-bold text-red-800">{t('guide.error_title')}</p>
              <p className="text-xs text-red-700/80">{errorMsg}</p>
              {lastPayloadRef.current && (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() =>
                    void send(lastPayloadRef.current?.chatText, !lastPayloadRef.current?.chatText)
                  }
                >
                  <RefreshCw size={14} aria-hidden="true" />
                  {t('guide.error_retry')}
                </button>
              )}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* input */}
        <div className="border-t border-navy-100 bg-cream-50/70 p-3">
          <div className="flex items-end gap-2">
            <textarea
              className="input min-h-[46px] flex-1 resize-none"
              rows={1}
              placeholder={t('guide.chat_placeholder')}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                  setInput('');
                }
              }}
              aria-label={t('guide.chat_placeholder')}
            />
            {working ? (
              <button
                type="button"
                onClick={stop}
                className="btn bg-red-600 px-4 py-3 text-sm text-white hover:bg-red-700"
                aria-label={t('homePhrases.stop')}
              >
                <Square size={15} aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  void send(input);
                  setInput('');
                }}
                disabled={!input.trim()}
                className="btn-primary px-4"
                aria-label={t('guide.send')}
              >
                <Send size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
