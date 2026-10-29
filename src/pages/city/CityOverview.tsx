import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight,
  BedDouble,
  Bus,
  Landmark,
  Map,
  MapPin,
  Plane,
  Sparkles,
  TrainFront,
  Volume2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getCity } from '../../data/cities';
import type { Lang } from '../../data/types';
import { L, cn } from '../../lib/utils';
import { cityImage } from '../../lib/images';
import Photo from '../../components/Photo';
import SectionHeading from '../../components/SectionHeading';
import CitySubNav from '../../components/CitySubNav';
import { OrnamentDivider } from '../../components/Ornament';
import NotFoundPage from '../NotFoundPage';

const SECTION_ICONS = [Landmark, BedDouble, Map, Volume2, Sparkles];

/** Қала бетінің кіреберісі: PHOTO HEADER + sticky тап-бар + бөлімдер. */
export default function CityOverview() {
  const { t, i18n } = useTranslation();
  const { cityId } = useParams();
  const lang = i18n.resolvedLanguage as Lang;
  const city = getCity(cityId ?? 'kyzylorda');

  if (!city) return <NotFoundPage />;

  const base = `/city/${city.city.id}`;
  const stats = {
    attractions: city.attractions.length,
    hotels: city.hotels.length,
    phrases: city.kazakh_phrases.length,
  };

  const sections = [
    { to: `${base}/sights`, icon: 'sights', count: `${stats.attractions} ${t('hero.stat_attractions')}`, desc: t('city.overview.sights_desc') },
    { to: `${base}/hotels`, icon: 'hotels', count: `${stats.hotels} ${t('hero.stat_hotels')}`, desc: t('city.overview.hotels_desc') },
    { to: `${base}/map`, icon: 'map', count: t('city.overview.map_badge'), desc: t('city.overview.map_desc') },
    { to: `${base}/phrases`, icon: 'phrases', count: `${stats.phrases} ${t('hero.stat_phrases')}`, desc: t('city.overview.phrases_desc') },
    { to: '/guide', icon: 'guide', count: t('city.overview.guide_badge'), desc: t('city.overview.guide_desc') },
  ] as const;

  return (
    <div>
      {/* ================= PHOTO HEADER ================= */}
      <section className="relative">
        <div className="relative h-[46vh] max-h-[560px] min-h-[380px] w-full overflow-hidden">
          <Photo
            src={city.city.image ?? cityImage(city.city.id)}
            alt={L(city.city.name, lang)}
            eager
            className="absolute inset-0 h-full w-full"
            fallback="from-teal-600 via-teal-700 to-navy-800"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-900/90 via-navy-900/40 to-navy-900/10" aria-hidden="true" />
          <div className="container-page absolute inset-0 flex flex-col justify-end pb-8 sm:pb-12">
            <p className="kicker text-gold-300">
              {t('city.heroRegion')}: {L(city.city.region, lang)}
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold leading-[1.05] tracking-tight text-white drop-shadow-sm sm:text-6xl">
              {L(city.city.name, lang)}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/90 sm:text-base">
              {L(city.city.description, lang)}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link to="/guide" className="btn-gold px-6 py-3">
                <Sparkles size={16} aria-hidden="true" />
                {t('hero.cta_guide')}
              </Link>
              <Link to={`${base}/sights`} className="btn-white px-6 py-3">
                <MapPin size={16} aria-hidden="true" />
                {t('hero.cta_city')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CitySubNav city={city} />

      {/* ================= СЕКЦИЯЛАР ================= */}
      <section className="container-page pt-12 sm:pt-16">
        <SectionHeading
          num="01"
          kicker={t('city.overview.sections_kicker')}
          title={t('city.overview.sections_title')}
          subtitle={t('city.overview.sections_subtitle')}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((s, i) => {
            const Icon = SECTION_ICONS[i];
            return (
              <Link
                key={s.to}
                to={s.to}
                className="card group p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-600 text-white transition-transform duration-300 group-hover:scale-105">
                  <Icon size={21} aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-navy-800">
                  {t(`city.sections.${s.icon}`)}
                </h3>
                <p className="mt-1.5 inline-flex rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-800">
                  {s.count}
                </p>
                <p className="mt-2.5 text-sm leading-relaxed text-navy-500">{s.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-extrabold text-teal-700">
                  {t('city.overview.open')}
                  <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ================= ҚАЛАЙ ЖЕТУ ================= */}
      <section className="container-page pt-14 sm:pt-20">
        <SectionHeading
          num="02"
          kicker={t('city.overview.getting_kicker')}
          title={t('city.gettingThere')}
          subtitle={t('city.gettingThere_note')}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          {city.city.getting_there.map((g) => {
            const Icon = g.type === 'air' ? Plane : g.type === 'train' ? TrainFront : Bus;
            return (
              <div key={g.type} className="card p-5">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700">
                    <Icon size={17} aria-hidden="true" />
                  </span>
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-teal-700">
                    {t(`city.${g.type}`)}
                  </span>
                </div>
                <p className="mt-3 text-sm font-bold text-navy-800">{L(g.name, lang)}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-navy-500">
                  {g.note ? L(g.note, lang) : g.address ?? ''}
                </p>
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-bold text-navy-400">
                  {g.distance_to_center_km != null && (
                    <span>
                      {t('city.center')}: {String(g.distance_to_center_km)}
                      {typeof g.distance_to_center_km === 'number' ? ` ${t('common.km')}` : ''}
                    </span>
                  )}
                  {g.hours && <span>{g.hours}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= CTA BAND (turquoise, dark емес) ================= */}
      <section className="container-page pt-14 sm:pt-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 via-teal-600 to-teal-800 p-8 sm:p-12">
          <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
                {t('city.overview.cta_band_title')}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-teal-50/95">
                {t('city.overview.cta_band_text')}
              </p>
            </div>
            <Link to="/guide" className={cn('btn-gold shrink-0 px-6 py-3.5')}>
              <Sparkles size={16} aria-hidden="true" />
              {t('hero.cta_guide')}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <OrnamentDivider className="container-page mt-16" />
    </div>
  );
}
