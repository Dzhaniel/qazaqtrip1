import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Ear, Search, Star, Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getCity } from '../../data/cities';
import type { Lang } from '../../data/types';
import { cn, L } from '../../lib/utils';
import { KEYS, loadJSON, unlockBadge } from '../../lib/learnStore';
import PageHero from '../../components/PageHero';
import CitySubNav from '../../components/CitySubNav';
import PhraseCard from '../../components/PhraseCard';
import QuizModal, { type QuizMode } from '../../components/QuizModal';
import NotFoundPage from '../NotFoundPage';
import { OrnamentDivider, OrnCorner } from '../../components/Ornament';

const TOPICS = [
  'greetings',
  'directions',
  'hotel',
  'transport',
  'food',
  'museum',
  'shopping',
  'emergency',
  'numbers',
] as const;

const LEARNED_KEY = 'qazaqtrip_learned_phrases';
const FAVORITES_KEY = 'qazaqtrip_favorites';

function loadLearned(): string[] {
  try {
    const raw = localStorage.getItem(LEARNED_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export default function CityPhrases() {
  const { t, i18n } = useTranslation();
  const { cityId } = useParams();
  const lang = i18n.resolvedLanguage as Lang;
  const city = getCity(cityId ?? 'kyzylorda');

  const [topic, setTopic] = useState<'all' | (typeof TOPICS)[number]>(() => {
    const params = new URLSearchParams(window.location.search);
    const tp = params.get('topic');
    return tp && (TOPICS as readonly string[]).includes(tp) ? (tp as (typeof TOPICS)[number]) : 'all';
  });
  const [query, setQuery] = useState('');
  const [learned, setLearned] = useState<string[]>(loadLearned);
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);
  const [favOnly, setFavOnly] = useState(false);
  const [quiz, setQuiz] = useState<QuizMode | null>(null);

  const phrases = city?.kazakh_phrases ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return phrases.filter((p) => {
      if (topic !== 'all' && p.topic !== topic) return false;
      if (favOnly && !favorites.includes(p.id)) return false;
      if (!q) return true;
      const hay = [p.kk, p.translit, p.en, p.ru].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [phrases, topic, query, favOnly, favorites]);

  if (!city) return <NotFoundPage />;

  const learnedCount = learned.filter((id) => phrases.some((p) => p.id === id)).length;

  function toggleLearned(id: string) {
    setLearned((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(LEARNED_KEY, JSON.stringify(next));
      } catch {
        /* private mode — ignore */
      }
      // Badge: сөз саны еселері
      const valid = new Set(phrases.map((p) => p.id));
      const count = next.filter((x) => valid.has(x)).length;
      if (count >= 50) unlockBadge('words_50');
      else if (count >= 25) unlockBadge('words_25');
      else if (count >= 10) unlockBadge('words_10');
      return next;
    });
  }

  function onQuizFinished(mode: QuizMode) {
    unlockBadge('first_quiz');
    if (mode === 'listen') unlockBadge('listener');
    if (loadJSON<boolean>(KEYS.itineraryDone, false)) unlockBadge('city_master');
  }

  function toggleFavorite(id: string) {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      } catch {
        /* private mode — ignore */
      }
      return next;
    });
  }

  return (
    <div>
      <PageHero
        city={city}
        lang={lang}
        crumb={t('city.sections.phrases')}
        title={t('city.phrases.title')}
        subtitle={t('city.phrases.subtitle')}
        Icon={Volume2}
      />
      <CitySubNav city={city} />

      <section className="container-page py-10 sm:py-12">
        {/* Прогресс + транслит ескертпесі */}
        <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-navy-400">
              {t('city.phrases.progress_label')}
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-teal-700">
              {learnedCount} / {phrases.length}
            </p>
          </div>
          <div className="sm:max-w-xs">
            <div className="h-2.5 overflow-hidden rounded-full bg-navy-100" role="progressbar" aria-valuenow={learnedCount} aria-valuemin={0} aria-valuemax={phrases.length}>
              <div
                className="h-full rounded-full bg-teal-600 transition-all duration-500"
                style={{ width: phrases.length ? `${(learnedCount / phrases.length) * 100}%` : '0%' }}
              />
            </div>
            <p className="mt-2 text-[11px] leading-snug text-navy-400">{t('city.phrases.translit_note')}</p>
          </div>
        </div>

        {/* Сүзгі + іздеу */}
        <div className="mt-6 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label={t('city.phrases.topics_label')}>
            <button
              type="button"
              onClick={() => setTopic('all')}
              aria-pressed={topic === 'all'}
              className={cn(
                'rounded-full border px-4 py-2 text-xs font-bold transition-colors',
                topic === 'all' ? 'border-teal-600 bg-teal-600 text-white' : 'border-navy-200 bg-white text-navy-500 hover:border-teal-400 hover:text-teal-700',
              )}
            >
              {t('city.phrases.filter_all')}
            </button>
            {TOPICS.map((tp) => (
              <button
                key={tp}
                type="button"
                onClick={() => setTopic(tp)}
                aria-pressed={topic === tp}
                className={cn(
                  'rounded-full border px-4 py-2 text-xs font-bold transition-colors',
                  topic === tp ? 'border-teal-600 bg-teal-600 text-white' : 'border-navy-200 bg-white text-navy-500 hover:border-teal-400 hover:text-teal-700',
                )}
              >
                {t(`city.phrases.topic_${tp}`)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setFavOnly((v) => !v)}
              aria-pressed={favOnly}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition-colors',
                favOnly ? 'border-gold-400 bg-gold-100 text-gold-700' : 'border-navy-200 bg-white text-navy-500 hover:border-gold-400 hover:text-gold-700',
              )}
            >
              <Star size={13} fill={favOnly ? 'currentColor' : 'none'} aria-hidden="true" />
              {t('city.phrases.saved_only')} ({favorites.length})
            </button>
          </div>
          <label className="relative block sm:max-w-sm">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-300" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('city.phrases.search_placeholder')}
              className="input pl-10"
              aria-label={t('city.phrases.search_label')}
            />
          </label>
        </div>

        {/* Фразалар торы */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {filtered.map((p) => (
            <PhraseCard
              key={p.id}
              phrase={p}
              lang={lang}
              learned={learned.includes(p.id)}
              onToggleLearned={() => toggleLearned(p.id)}
              favorited={favorites.includes(p.id)}
              onToggleFavorite={() => toggleFavorite(p.id)}
            />
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full rounded-2xl bg-navy-50 px-5 py-6 text-center text-sm text-navy-400">
              {t('city.phrases.no_results')}
            </p>
          )}
        </div>

        {/* Қызу */}
        <div className="card relative mt-8 overflow-hidden p-6">
          <OrnCorner className="absolute right-3 top-3 text-gold-400/40" />
          <p className="kicker text-teal-700">
            <Ear size={14} aria-hidden="true" />
            {t('city.phrases.quiz_kicker')}
          </p>
          <h3 className="mt-2 font-display text-lg font-bold text-navy-800">{t('city.phrases.quiz_title')}</h3>
          <p className="mt-1 text-sm text-navy-500">{t('city.phrases.quiz_subtitle')}</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button type="button" className="btn-primary" onClick={() => setQuiz('meaning')}>
              {t('city.phrases.quiz_start_meaning')}
            </button>
            <button type="button" className="btn-ghost" onClick={() => setQuiz('listen')}>
              <Ear size={16} aria-hidden="true" />
              {t('city.phrases.quiz_start_listen')}
            </button>
          </div>
        </div>

        {/* Тамақ сөздері */}
        <div className="card relative mt-8 overflow-hidden p-6">
          <OrnCorner className="absolute right-3 top-3 text-gold-400/40" />
          <h3 className="font-display text-lg font-bold text-navy-800">{t('city.phrases.food_title')}</h3>
          <p className="mt-1 text-xs text-navy-400">{t('city.phrases.food_note')}</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {city.local_food.items.map((item, i) => (
              <li key={i} className="chip border-teal-200 bg-teal-50 text-teal-800">
                {L(item, lang)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <OrnamentDivider className="container-page mb-4" />

      <QuizModal
        open={quiz != null}
        mode={quiz ?? 'meaning'}
        phrases={phrases}
        lang={lang}
        onClose={() => setQuiz(null)}
        onFinished={onQuizFinished}
      />
    </div>
  );
}
