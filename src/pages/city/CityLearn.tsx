import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Award, BookOpen, Flame, GraduationCap, Headphones, Lock, MessagesSquare, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getCity } from '../../data/cities';
import type { Lang } from '../../data/types';
import { cn } from '../../lib/utils';
import { KEYS, loadJSON, loadBadges, touchStreak, type BadgeId, type StreakState } from '../../lib/learnStore';
import PageHero from '../../components/PageHero';
import CitySubNav from '../../components/CitySubNav';
import NotFoundPage from '../NotFoundPage';
import { OrnamentDivider } from '../../components/Ornament';

const TOPIC_IDS = ['greetings', 'numbers', 'directions', 'food', 'transport', 'hotel', 'shopping', 'museum', 'emergency'];

const BADGES: Array<{ id: BadgeId; icon: typeof Trophy; labelKey: string; descKey: string }> = [
  { id: 'first_quiz', icon: GraduationCap, labelKey: 'learn.badge_first_quiz', descKey: 'learn.badge_first_quiz_desc' },
  { id: 'words_10', icon: BookOpen, labelKey: 'learn.badge_words_10', descKey: 'learn.badge_words_10_desc' },
  { id: 'words_25', icon: Headphones, labelKey: 'learn.badge_words_25', descKey: 'learn.badge_words_25_desc' },
  { id: 'words_50', icon: Trophy, labelKey: 'learn.badge_words_50', descKey: 'learn.badge_words_50_desc' },
  { id: 'city_master', icon: Award, labelKey: 'learn.badge_city_master', descKey: 'learn.badge_city_master_desc' },
  { id: 'listener', icon: Headphones, labelKey: 'learn.badge_listener', descKey: 'learn.badge_listener_desc' },
];

export default function CityLearn() {
  const { t, i18n } = useTranslation();
  const { cityId } = useParams();
  const lang = i18n.resolvedLanguage as Lang;
  const city = getCity(cityId ?? 'kyzylorda');

  const [streak, setStreak] = useState<StreakState>({ last: '', count: 0 });
  const [badges, setBadges] = useState<BadgeId[]>([]);
  const [learned, setLearned] = useState<string[]>(() => loadJSON<string[]>(KEYS.learned, []));

  useEffect(() => {
    setStreak(touchStreak());
    setBadges(loadBadges());
    setLearned(loadJSON<string[]>(KEYS.learned, []));
  }, []);

  const phrases = city?.kazakh_phrases ?? [];

  const learnedIn = useMemo(() => {
    const byTopic: Record<string, { total: number; done: number }> = {};
    for (const p of phrases) {
      byTopic[p.topic] ??= { total: 0, done: 0 };
      byTopic[p.topic].total += 1;
      if (learned.includes(p.id)) byTopic[p.topic].done += 1;
    }
    return byTopic;
  }, [phrases, learned]);

  if (!city) return <NotFoundPage />;

  const learnedCount = learned.filter((id) => phrases.some((p) => p.id === id)).length;
  const pct = phrases.length ? Math.round((learnedCount / phrases.length) * 100) : 0;

  return (
    <div>
      <PageHero
        city={city}
        lang={lang}
        crumb={t('city.sections.learn')}
        title={t('learn.hub_title')}
        subtitle={t('learn.hub_subtitle')}
        Icon={GraduationCap}
      />
      <CitySubNav city={city} />

      <section className="container-page py-10 sm:py-12">
        {/* Прогресс overview */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="card flex items-center gap-4 p-6">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gold-100 text-gold-600">
              <Flame size={26} aria-hidden="true" />
            </span>
            <div>
              <p className="font-display text-3xl font-bold text-navy-800">{streak.count}</p>
              <p className="text-xs font-bold text-navy-400">{t('learn.streak', { count: streak.count })}</p>
            </div>
          </div>

          <div className="card p-6 lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-wider text-navy-400">{t('learn.overall_label')}</p>
              <p className="text-sm font-bold text-teal-700">
                {learnedCount} / {phrases.length}
              </p>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-navy-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-700 transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-xs text-navy-400">{t('learn.overall_text', { count: learnedCount, total: phrases.length })}</p>
          </div>
        </div>

        {/* Достижения */}
        <h3 className="mt-10 font-display text-lg font-bold text-navy-800">{t('learn.badges_title')}</h3>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {BADGES.map((b) => {
            const Icon = b.icon;
            const unlocked = badges.includes(b.id);
            return (
              <div
                key={b.id}
                title={t(b.descKey)}
                className={cn(
                  'card flex flex-col items-center gap-2 p-4 text-center transition-all',
                  !unlocked && 'opacity-50',
                )}
              >
                <span className={cn('grid h-11 w-11 place-items-center rounded-full', unlocked ? 'bg-gold-100 text-gold-600' : 'bg-navy-50 text-navy-300')}>
                  {unlocked ? <Icon size={20} aria-hidden="true" /> : <Lock size={18} aria-hidden="true" />}
                </span>
                <p className={cn('text-xs font-bold leading-tight', unlocked ? 'text-navy-700' : 'text-navy-400')}>{t(b.labelKey)}</p>
              </div>
            );
          })}
        </div>

        {/* Санаттар (A1): сөз саны + прогресс */}
        <h3 className="mt-10 font-display text-lg font-bold text-navy-800">{t('learn.categories_title')}</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOPIC_IDS.map((tp) => {
            const st = learnedIn[tp] ?? { total: 0, done: 0 };
            const p = st.total ? Math.round((st.done / st.total) * 100) : 0;
            return (
              <Link key={tp} to={`/city/${city.city.id}/phrases?topic=${tp}`} className="card group p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display text-[15px] font-bold text-navy-800">{t(`city.phrases.topic_${tp}`)}</p>
                  <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-800">
                    {st.total} {t('learn.words_unit')}
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-navy-100">
                  <div className="h-full rounded-full bg-teal-600 transition-all duration-300" style={{ width: `${p}%` }} />
                </div>
                <p className="mt-2 text-[11px] font-bold text-navy-400">
                  {st.done} / {st.total} · {p}%
                </p>
              </Link>
            );
          })}
        </div>

        {/* Үйрену құралдары */}
        <h3 className="mt-10 font-display text-lg font-bold text-navy-800">{t('learn.tools_title')}</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link to={`/city/${city.city.id}/flashcards`} className="card group p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-600 text-white transition-transform duration-300 group-hover:scale-105">
              <BookOpen size={21} aria-hidden="true" />
            </span>
            <h4 className="mt-4 font-display text-base font-bold text-navy-800">{t('learn.tool_flashcards')}</h4>
            <p className="mt-1.5 text-sm leading-relaxed text-navy-500">{t('learn.tool_flashcards_desc')}</p>
          </Link>
          <Link to={`/city/${city.city.id}/dialogues`} className="card group p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gold-400 text-white transition-transform duration-300 group-hover:scale-105">
              <MessagesSquare size={21} aria-hidden="true" />
            </span>
            <h4 className="mt-4 font-display text-base font-bold text-navy-800">{t('learn.tool_dialogues')}</h4>
            <p className="mt-1.5 text-sm leading-relaxed text-navy-500">{t('learn.tool_dialogues_desc')}</p>
          </Link>
          <Link to={`/city/${city.city.id}/alphabet`} className="card group p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-navy-700 text-white transition-transform duration-300 group-hover:scale-105">
              <BookOpen size={21} aria-hidden="true" />
            </span>
            <h4 className="mt-4 font-display text-base font-bold text-navy-800">{t('learn.tool_alphabet')}</h4>
            <p className="mt-1.5 text-sm leading-relaxed text-navy-500">{t('learn.tool_alphabet_desc')}</p>
          </Link>
        </div>
      </section>

      <OrnamentDivider className="container-page mb-4" />
    </div>
  );
}
