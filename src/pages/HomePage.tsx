import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Coffee,
  Languages,
  Landmark,
  MapPin,
  Mountain,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cities, comingSoonCities, getCity } from '../data/cities';
import type { Lang } from '../data/types';
import { L } from '../lib/utils';
import { OrnamentPattern, OrnamentDivider } from '../components/Ornament';
import SectionHeading from '../components/SectionHeading';
import CityCard from '../components/CityCard';
import PhraseCard from '../components/PhraseCard';

const WHY_ICONS = [Mountain, Languages, Coffee, Landmark];

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage as Lang;
  const navigate = useNavigate();
  const [selected, setSelected] = useState('kyzylorda');

  const kyzylorda = getCity('kyzylorda');

  const stats = {
    attractions: kyzylorda?.attractions.length ?? 0,
    hotels: kyzylorda?.hotels.length ?? 0,
    phrases: kyzylorda?.kazakh_phrases.length ?? 0,
  };

  const randomPhrases = useMemo(() => {
    if (!kyzylorda) return [];
    const pool = [...kyzylorda.kazakh_phrases];
    const picked: typeof pool = [];
    while (picked.length < 3 && pool.length > 0) {
      picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    return picked;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kyzylorda]);

  if (!kyzylorda) return null;

  const whyKeys = ['steppe', 'language', 'hospitality', 'history'] as const;

  return (
    <div>
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-navy-900">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-teal-900" aria-hidden="true" />
        <div
          className="absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(60% 80% at 80% 10%, rgba(27,163,184,0.25) 0%, transparent 60%), radial-gradient(50% 60% at 10% 90%, rgba(224,165,38,0.14) 0%, transparent 55%)',
          }}
        />
        <OrnamentPattern className="opacity-[0.07]" />

        <div className="container-page relative py-16 sm:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-gold-500/10 px-4 py-1.5 text-xs font-bold text-gold-300">
            <MapPin size={13} aria-hidden="true" />
            {t('hero.kicker')}
          </span>

          <h1 className="mt-6 max-w-3xl font-display text-4xl font-bold leading-[1.08] tracking-tight text-cream-50 sm:text-6xl">
            {t('hero.title')}
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-navy-100/90 sm:text-lg">
            {t('hero.subtitle')}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/city/kyzylorda" className="btn-gold px-7 py-3.5 text-base">
              {t('hero.cta_city')}
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link
              to="/guide"
              className="btn border border-cream-100/30 bg-white/10 px-7 py-3.5 text-base text-cream-50 backdrop-blur hover:border-gold-400/60 hover:bg-white/20"
            >
              <Sparkles size={17} aria-hidden="true" />
              {t('hero.cta_guide')}
            </Link>
          </div>

          <dl className="mt-12 flex flex-wrap gap-x-10 gap-y-4">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-navy-200">
                {t('hero.badge_city')}
              </dt>
              <dd className="font-display text-3xl font-bold text-gold-400">{L(kyzylorda.city.name, lang)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-navy-200">{t('hero.stat_attractions')}</dt>
              <dd className="font-display text-3xl font-bold text-cream-50">{stats.attractions}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-navy-200">{t('hero.stat_hotels')}</dt>
              <dd className="font-display text-3xl font-bold text-cream-50">{stats.hotels}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-navy-200">{t('hero.stat_phrases')}</dt>
              <dd className="font-display text-3xl font-bold text-cream-50">{stats.phrases}</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* ================= CITIES ================= */}
      <section className="container-page pt-14 sm:pt-20">
        <SectionHeading title={t('cities.title')} subtitle={t('cities.subtitle')} />

        <label className="mb-6 block max-w-sm">
          <span className="mb-1.5 block text-xs font-bold text-navy-500">{t('cities.choose')}</span>
          <select
            className="input"
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value);
              if (cities[e.target.value]) navigate(`/city/${e.target.value}`);
            }}
          >
            {Object.values(cities).map((c) => (
              <option key={c.city.id} value={c.city.id}>
                {L(c.city.name, lang)}
              </option>
            ))}
            {comingSoonCities.map((c) => (
              <option key={c.id} value={c.id} disabled>
                {c.name[lang]} — {t('cities.soon')}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <CityCard
            id={kyzylorda.city.id}
            name={kyzylorda.city.name}
            region={kyzylorda.city.region}
            active
            stats={stats}
            lang={lang}
          />
          {comingSoonCities.map((c) => (
            <CityCard
              key={c.id}
              id={c.id}
              name={c.name}
              region={c.region}
              active={false}
              lang={lang}
            />
          ))}
        </div>
      </section>

      {/* ================= WHY ================= */}
      <section className="container-page pt-16 sm:pt-24">
        <SectionHeading title={t('why.title')} subtitle={t('why.subtitle')} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {whyKeys.map((key, i) => {
            const Icon = WHY_ICONS[i];
            return (
              <article
                key={key}
                className="card group p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal-600 transition-colors duration-300 group-hover:bg-teal-600 group-hover:text-white">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-base font-bold text-navy-800">
                  {t(`why.items.${key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-500">{t(`why.items.${key}.text`)}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* ================= PHRASES ================= */}
      <section className="container-page pt-16 sm:pt-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 via-teal-700 to-navy-800 p-6 sm:p-10">
          <OrnamentPattern className="opacity-[0.1]" />
          <div className="relative">
            <h2 className="font-display text-2xl font-bold text-cream-50 sm:text-3xl">
              {t('homePhrases.title')}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-teal-100/90">{t('homePhrases.subtitle')}</p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {randomPhrases.map((p) => (
                <PhraseCard key={p.id} phrase={p} lang={lang} />
              ))}
            </div>

            <Link to="/city/kyzylorda#phrases" className="btn-ghost mt-6 border-white/30 bg-white/10 text-cream-50 hover:border-gold-300 hover:bg-white/20 hover:text-cream-50">
              {t('homePhrases.view_all')}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <OrnamentDivider className="container-page mt-16" />
    </div>
  );
}
