import { useEffect, useMemo, useState } from 'react';
import { Ear, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { KazakhPhrase, Lang } from '../data/types';
import { speakKazakh, stopSpeech, type SpeechResult } from '../lib/speech';
import { cn } from '../lib/utils';

export type QuizMode = 'meaning' | 'listen';

interface Props {
  open: boolean;
  mode: QuizMode;
  phrases: KazakhPhrase[];
  lang: Lang;
  onClose: () => void;
  /** Quiz аяқталғанда (badge-тар үшін). */
  onFinished?: (mode: QuizMode) => void;
}

const QUESTION_COUNT = 10;

/** Рандом + 3 бөгет: дұрыс жауап + 3 бөгет (сол тақырыптан/барлығынан). */
function buildQuestions(phrases: KazakhPhrase[], mode: QuizMode, lang: Lang) {
  const pool = [...phrases];
  // Араластыру (Fisher–Yates)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const chosen = pool.slice(0, Math.min(QUESTION_COUNT, pool.length));
  const meaningOf = (p: KazakhPhrase) => (lang === 'en' ? p.ru : p.en);

  return chosen.map((correct) => {
    const distractorPool = pool.filter((p) => p.id !== correct.id);
    for (let i = distractorPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [distractorPool[i], distractorPool[j]] = [distractorPool[j], distractorPool[i]];
    }
    const options = [correct, ...distractorPool.slice(0, 3)].sort(() => Math.random() - 0.5);
    return {
      correct,
      options,
      // «listen» режимінде варианттар — қазақша мәтін; «meaning» — аударма
      label: (p: KazakhPhrase) => (mode === 'listen' ? p.kk : meaningOf(p)),
      prompt: correct.kk,
      meaning: meaningOf(correct),
    };
  });
}

/**
 * Қазақша сөзді шынайы «тыңдап» таңдау / аудармасын таңдау қызуы.
 * ТTTS (kk-KZ) қолжетімсіз болса — транслитерация fallback-і көрсетіледі.
 */
export default function QuizModal({ open, mode, phrases, lang, onClose, onFinished }: Props) {
  const { t } = useTranslation();
  const [round, setRound] = useState(0);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [speechOk, setSpeechOk] = useState(true);
  const [speaking, setSpeaking] = useState(false);

  const questions = useMemo(
    () => (open ? buildQuestions(phrases, mode, lang) : []),
    // round арқылы «Қайталау» жаңа сұрақ береді
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open, mode, phrases, lang, round],
  );

  useEffect(() => {
    if (open) {
      setIdx(0);
      setPicked(null);
      setScore(0);
      setFinished(false);
      setSpeechOk(true);
    }
    return () => stopSpeech();
  }, [open, mode, round]);

  if (!open || questions.length === 0) return null;

  const q = questions[idx];

  async function play() {
    if (mode !== 'listen') return;
    stopSpeech();
    setSpeaking(true);
    const res: SpeechResult = await speakKazakh(q.prompt);
    setSpeaking(false);
    if (res !== 'ok') setSpeechOk(false);
  }

  function pick(id: string) {
    if (picked) return;
    setPicked(id);
    if (id === q.correct.id) setScore((s) => s + 1);
  }

  function next() {
    stopSpeech();
    if (idx + 1 >= questions.length) {
      setFinished(true);
      onFinished?.(mode);
    } else {
      setIdx(idx + 1);
      setPicked(null);
    }
  }

  function restart() {
    setRound((r) => r + 1);
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center bg-navy-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={t('city.phrases.quiz_title')}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-lift sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="kicker text-teal-700">
            <Ear size={14} aria-hidden="true" />
            {mode === 'listen' ? t('city.phrases.quiz_start_listen') : t('city.phrases.quiz_start_meaning')}
          </p>
            <h3 className="mt-1 font-display text-xl font-bold text-navy-800">{t('city.phrases.quiz_title')}</h3>
          </div>
        </div>

        {finished ? (
          <div className="mt-6 text-center">
            <p className="font-display text-5xl font-bold text-teal-700">
              {score} / {questions.length}
            </p>
            <p className="mt-2 text-sm text-navy-500">{t('city.phrases.quiz_score', { score, total: questions.length })}</p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button type="button" className="btn-primary" onClick={restart}>
                {t('city.phrases.quiz_again')}
              </button>
              <button type="button" className="btn-ghost" onClick={onClose}>
                {t('city.phrases.quiz_close')}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-navy-400">
              {t('city.phrases.quiz_question', { current: idx + 1, total: questions.length })}
            </p>

            {/* Сұрақ: қазақша сөз (үлбі) */}
            <div className="mt-3 rounded-2xl bg-cream-50 px-5 py-4 text-center">
              <p className="font-display text-2xl font-bold text-navy-800">{q.prompt}</p>
              <p className="mt-1 text-sm italic text-navy-400">{q.correct.translit}</p>
              {mode === 'listen' && (
                <div className="mt-3 flex items-center justify-center gap-2">
                  <button type="button" onClick={play} className="btn-ghost min-h-11 px-4 text-xs">
                    <Ear size={15} aria-hidden="true" />
                    {speaking ? '…' : t('city.phrases.listen')}
                  </button>
                  {!speechOk && (
                    <span className="text-[11px] text-navy-400">{t('city.phrases.quiz_listen_fallback')}</span>
                  )}
                </div>
              )}
            </div>

            <p className="mt-4 text-sm font-bold text-navy-600">
              {mode === 'listen' ? t('city.phrases.quiz_pick_heard') : t('city.phrases.quiz_pick_translation')}
            </p>

            <div className="mt-3 grid grid-cols-1 gap-2">
              {q.options.map((opt) => {
                const isCorrect = opt.id === q.correct.id;
                const isPicked = picked === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => pick(opt.id)}
                    disabled={picked != null}
                    aria-pressed={isPicked}
                    className={cn(
                      'min-h-11 rounded-xl border px-4 py-2.5 text-left text-sm font-semibold transition-colors',
                      picked == null && 'border-navy-200 bg-white text-navy-700 hover:border-teal-400 hover:bg-teal-50',
                      picked != null && isCorrect && 'border-teal-600 bg-teal-600 text-white',
                      picked != null && isPicked && !isCorrect && 'border-red-400 bg-red-50 text-red-700',
                      picked != null && !isPicked && !isCorrect && 'border-navy-100 bg-white text-navy-300',
                    )}
                  >
                    {q.label(opt)}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex justify-end">
              {picked && (
                <button type="button" className="btn-primary min-h-11" onClick={next}>
                  {idx + 1 >= questions.length ? t('city.phrases.quiz_finish') : t('city.phrases.quiz_next')}
                </button>
              )}
            </div>
          </>
        )}

        <button
          type="button"
          onClick={onClose}
          aria-label={t('city.phrases.quiz_close')}
          className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full text-navy-400 transition-colors hover:bg-navy-50 hover:text-navy-700"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
