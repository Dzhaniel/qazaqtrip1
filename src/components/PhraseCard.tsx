import { useState } from 'react';
import { Check, Volume2, VolumeX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { KazakhPhrase, Lang } from '../data/types';
import { speakKazakh, stopSpeech, type SpeechResult } from '../lib/speech';
import { cn } from '../lib/utils';

interface Props {
  phrase: KazakhPhrase;
  lang: Lang;
  /** compact — кіші беттерге; толық нұсқада қазақша сөз ҮЛБЕН. */
  compact?: boolean;
  /** "Үйрендім" белгісі (localStorage прогресс). */
  learned?: boolean;
  onToggleLearned?: () => void;
}

/** Аударма UI тіліне сай: KZ → EN+RU, EN → RU, RU → EN (өз тілін көрсетпейміз). */
function meaningsFor(phrase: KazakhPhrase, lang: Lang): string[] {
  if (lang === 'kk') return [phrase.en, phrase.ru];
  if (lang === 'en') return [phrase.ru];
  return [phrase.en];
}

/**
 * Қазақша сөз карточкасы: ҮЛБЕН қазақша сөз, транслит, аударма, 🔊 (kk-KZ).
 * Қазақша дауыс табылмаса — жүйелік дауыс + міндетті хабарлама.
 */
export default function PhraseCard({ phrase, lang, compact = false, learned = false, onToggleLearned }: Props) {
  const { t } = useTranslation();
  const [speaking, setSpeaking] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const meanings = meaningsFor(phrase, lang);

  async function onSpeak() {
    if (speaking) {
      stopSpeech();
      setSpeaking(false);
      return;
    }
    setNotice(null);
    setSpeaking(true);
    const res: SpeechResult = await speakKazakh(phrase.kk);
    setSpeaking(false);
    if (res === 'unsupported') setNotice(t('city.phrases.voice_unsupported'));
    else if (res === 'no-kk-voice') setNotice(t('city.phrases.voice_unavailable'));
    else if (res === 'error') setNotice(t('city.phrases.voice_unsupported'));
  }

  return (
    <div className={cn('card flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift', compact ? 'p-5' : 'p-6')}>
      <div className="flex items-start justify-between gap-3">
        <p
          className={cn(
            'font-display font-bold leading-tight text-navy-800',
            compact ? 'text-xl' : 'text-2xl sm:text-3xl',
          )}
        >
          {phrase.kk}
        </p>
        <button
          type="button"
          onClick={onSpeak}
          aria-label={t('city.phrases.listen')}
          className={cn(
            'grid h-11 w-11 shrink-0 place-items-center rounded-full border transition-all duration-200',
            speaking
              ? 'animate-pulse-soft border-teal-600 bg-teal-600 text-white shadow-lift'
              : 'border-navy-200 bg-white text-teal-700 hover:border-teal-500 hover:bg-teal-600 hover:text-white',
          )}
        >
          {speaking ? <VolumeX size={18} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}
        </button>
      </div>

      <p className="text-sm italic text-navy-400">
        {phrase.translit} <span className="not-italic text-navy-300">· {t('city.phrases.translit')}</span>
      </p>
      <div>
        <p className={cn('font-bold text-teal-800', compact ? 'text-sm' : 'text-base')}>{meanings[0]}</p>
        {meanings[1] && <p className="mt-0.5 text-sm text-navy-400">{meanings[1]}</p>}
      </div>

      {onToggleLearned && (
        <button
          type="button"
          onClick={onToggleLearned}
          aria-pressed={learned}
          className={cn(
            'inline-flex min-h-11 w-fit items-center gap-1.5 rounded-full border px-4 text-xs font-bold transition-colors',
            learned
              ? 'border-teal-600 bg-teal-600 text-white'
              : 'border-navy-200 bg-white text-navy-500 hover:border-teal-400 hover:text-teal-700',
          )}
        >
          {learned ? <Check size={14} aria-hidden="true" /> : null}
          {learned ? t('city.phrases.learned_done') : t('city.phrases.mark_learned')}
        </button>
      )}

      {notice && (
        <p className="rounded-lg bg-gold-100 px-3 py-2 text-[11px] font-medium leading-snug text-gold-700">{notice}</p>
      )}
    </div>
  );
}
