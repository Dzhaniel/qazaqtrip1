import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MessagesSquare, RotateCcw, User, Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getCity } from '../../data/cities';
import type { Lang } from '../../data/types';
import { L, cn } from '../../lib/utils';
import { speakKazakh, stopSpeech } from '../../lib/speech';
import { DIALOGUES, type Dialogue } from '../../lib/dialogues';
import PageHero from '../../components/PageHero';
import CitySubNav from '../../components/CitySubNav';
import NotFoundPage from '../NotFoundPage';
import { OrnamentDivider, OrnCorner } from '../../components/Ornament';

function DialoguePlayer({ d, lang }: { d: Dialogue; lang: Lang }) {
  const { t } = useTranslation();
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const line = d.lines[step];

  // Local жол көрінгенде — TTS
  useEffect(() => {
    if (!started || done) return;
    if (line?.speaker === 'local' && line.text) {
      const id = window.setTimeout(() => {
        void speakKazakh(line.text!);
      }, 350);
      return () => {
        window.clearTimeout(id);
      };
    }
    return undefined;
  }, [started, done, step, line]);

  function pick(i: number) {
    if (picked != null || line.speaker !== 'tourist' || line.correct == null) return;
    setPicked(i);
    if (i === line.correct) {
      setScore((s) => s + 1);
      window.setTimeout(() => {
        setPicked(null);
        if (step + 1 >= d.lines.length) {
          stopSpeech();
          setDone(true);
        } else {
          setStep((s) => s + 1);
        }
      }, 750);
    }
  }

  function restart() {
    stopSpeech();
    setStarted(true);
    setStep(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  }

  const totalTourist = d.lines.filter((l) => l.speaker === 'tourist').length;

  if (!started) {
    return (
      <div className="card relative overflow-hidden p-6">
        <OrnCorner className="absolute right-3 top-3 text-gold-400/40" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-teal-700">{L(d.place, lang)}</p>
            <h3 className="mt-1 font-display text-lg font-bold text-navy-800">{L(d.title, lang)}</h3>
            <p className="mt-1 text-xs text-navy-400">
              {d.lines.length} {t('learn.dialog_lines')} · {totalTourist} {t('learn.dialog_choices')}
            </p>
          </div>
        </div>
        <button type="button" className="btn-primary mt-4" onClick={restart}>
          <Volume2 size={16} aria-hidden="true" />
          {t('learn.dialog_start')}
        </button>
      </div>
    );
  }

  return (
    <div className="card relative overflow-hidden p-5 sm:p-6">
      <OrnCorner className="absolute right-3 top-3 text-gold-400/40" />
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-lg font-bold text-navy-800">{L(d.title, lang)}</h3>
        {!done && (
          <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-800">
            {step + 1} / {d.lines.length}
          </span>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {d.lines.slice(0, step).map((l, i) => (
          <div key={i} className={cn('flex', l.speaker === 'local' ? 'justify-start' : 'justify-end')}>
            <div
              className={cn(
                'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                l.speaker === 'local' ? 'rounded-bl-md border border-navy-100 bg-white text-navy-700' : 'rounded-br-md bg-teal-600 text-white',
              )}
            >
              {l.speaker === 'tourist' && (
                <span className="mb-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-teal-200">
                  <User size={11} aria-hidden="true" /> {t('learn.you')}
                </span>
              )}
              {l.options?.[l.correct ?? 0]}
            </div>
          </div>
        ))}

        {/* Ағымдағы жол */}
        {!done && line.speaker === 'local' && line.text && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-navy-100 bg-white px-4 py-2.5 text-sm leading-relaxed text-navy-700 shadow-sm">
              {line.text}
            </div>
          </div>
        )}
        {!done && line.speaker === 'tourist' && line.options && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-teal-700">
              <User size={12} aria-hidden="true" /> {t('learn.your_reply')}
            </p>
            <div className="space-y-2">
              {line.options.map((opt, i) => {
                const isCorrect = picked != null && i === line.correct;
                const isWrong = picked === i && i !== line.correct;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => pick(i)}
                    disabled={picked != null}
                    className={cn(
                      'block min-h-11 w-full rounded-xl border px-4 py-2.5 text-left text-sm font-semibold transition-colors',
                      picked == null && 'border-navy-200 bg-white text-navy-700 hover:border-teal-400 hover:bg-teal-50',
                      isCorrect && 'border-teal-600 bg-teal-600 text-white',
                      isWrong && 'border-red-400 bg-red-50 text-red-700',
                      picked != null && !isCorrect && !isWrong && 'border-navy-100 bg-white text-navy-300',
                    )}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {done && (
        <div className="mt-5 flex flex-col items-start justify-between gap-3 rounded-2xl bg-cream-50 px-5 py-4 sm:flex-row sm:items-center">
          <p className="text-sm font-bold text-navy-700">
            {t('learn.dialog_score', { score, total: totalTourist })}
          </p>
          <button type="button" className="btn-ghost min-h-11" onClick={restart}>
            <RotateCcw size={14} aria-hidden="true" />
            {t('learn.again')}
          </button>
        </div>
      )}
    </div>
  );
}

export default function CityDialogues() {
  const { t, i18n } = useTranslation();
  const { cityId } = useParams();
  const lang = i18n.resolvedLanguage as Lang;
  const city = getCity(cityId ?? 'kyzylorda');

  if (!city) return <NotFoundPage />;

  return (
    <div>
      <PageHero
        city={city}
        lang={lang}
        crumb={t('city.sections.learn')}
        title={t('learn.dialogues_title')}
        subtitle={t('learn.dialogues_subtitle')}
        Icon={MessagesSquare}
      />
      <CitySubNav city={city} />

      <section className="container-page py-10 sm:py-12">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {DIALOGUES.map((d) => (
            <DialoguePlayer key={d.id} d={d} lang={lang} />
          ))}
        </div>
      </section>

      <OrnamentDivider className="container-page mb-4" />
    </div>
  );
}
