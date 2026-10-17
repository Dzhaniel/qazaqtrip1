import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeftRight,
  Bus,
  MapPin,
  Plane,
  TrainFront,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getCity } from '../data/cities';
import type { Attraction, AttractionCategory, Hotel, Lang } from '../data/types';
import { L, cn } from '../lib/utils';
import { OrnamentPattern, OrnamentDivider } from '../components/Ornament';
import SectionHeading from '../components/SectionHeading';
import AttractionCard from '../components/AttractionCard';
import HotelCard from '../components/HotelCard';
import MapView, { type MapTarget } from '../components/MapView';
import PhraseCard from '../components/PhraseCard';
import GuideWidget from '../components/guide/GuideWidget';
import { GridSkeleton } from '../components/Skeletons';

const SECTION_IDS = ['sights', 'hotels', 'map', 'phrases', 'guide'] as const;
type SectionId = (typeof SECTION_IDS)[number];

/** Қазақ/орыс: one (1), few (2-4), many (5+); en: one/many. */
function pluralKey(lang: string, n: number): 'one' | 'few' | 'many' {
  if (lang === 'en') return n === 1 ? 'one' : 'many';
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'one';
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 11 && mod100 <= 14)) return 'few';
  return 'many';
}

type PriceFilter = 'any' | '0-12' | '12-20' | '20+';
type SortKey = 'price_asc' | 'price_desc' | 'rating';

export default function CityPage() {
  const { t, i18n } = useTranslation();
  const { cityId } = useParams();
  const lang = i18n.resolvedLanguage as Lang;
  const city = getCity(cityId ?? 'kyzylorda');

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const id = window.setTimeout(() => setLoading(false), 550);
    return () => window.clearTimeout(id);
  }, []);

  /* ---------- Сүзгілер ---------- */
  const [cat, setCat] = useState<string>('all');
  const [interests, setInterests] = useState<string[]>([]);
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('any');
  const [sort, setSort] = useState<SortKey>('price_asc');
  const [selected, setSelected] = useState<MapTarget | null>(null);

  const categories = useMemo(() => {
    if (!city) return [] as AttractionCategory[];
    const seen = new Set<AttractionCategory>();
    const out: AttractionCategory[] = [];
    for (const a of city.attractions) {
      if (!seen.has(a.category)) {
        seen.add(a.category);
        out.push(a.category);
      }
    }
    return out;
  }, [city]);

  const citySights = useMemo(
    () => (city ? city.attractions.filter((a) => a.type === 'city') : []),
    [city],
  );
  const dayTrips = useMemo(
    () => (city ? city.attractions.filter((a) => a.type === 'day_trip') : []),
    [city],
  );
  const hotels = useMemo(() => (city ? city.hotels : []), [city]);

  const matchesFilters = (a: Attraction) =>
    (cat === 'all' || a.category === cat) &&
    (interests.length === 0 || interests.some((i) => a.interests.includes(i)));

  const filteredSights = citySights.filter(matchesFilters);
  const filteredTrips = dayTrips.filter(matchesFilters);

  const filteredHotels = useMemo(() => {
    const list = hotels.filter((h) => {
      if (priceFilter === 'any') return true;
      if (h.price_from_kzt == null) return false;
      if (priceFilter === '0-12') return h.price_from_kzt < 12000;
      if (priceFilter === '12-20') return h.price_from_kzt >= 12000 && h.price_from_kzt < 20000;
      return h.price_from_kzt >= 20000;
    });
    const sorted = [...list];
    if (sort === 'price_asc')
      sorted.sort((a, b) => (a.price_from_kzt ?? Infinity) - (b.price_from_kzt ?? Infinity));
    if (sort === 'price_desc')
      sorted.sort((a, b) => (b.price_from_kzt ?? -1) - (a.price_from_kzt ?? -1));
    if (sort === 'rating')
      sorted.sort((a, b) => (b.rating?.score ?? -1) - (a.rating?.score ?? -1));
    return sorted;
  }, [hotels, priceFilter, sort]);

  /* ---------- Активті секция (IntersectionObserver) ---------- */
  const [active, setActive] = useState<SectionId>('sights');
  useEffect(() => {
    if (loading || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id as SectionId);
      },
      { rootMargin: '-140px 0px -55% 0px', threshold: [0, 0.15, 0.3, 0.6] },
    );
    for (const id of SECTION_IDS) {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, [loading]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const showOnMap = (target: MapTarget) => {
    setSelected(target);
    scrollToSection('map');
  };

  if (!city) {
    return (
      <div className="container-page py-24 text-center">
        <p className="font-display text-2xl font-bold text-navy-800">{t('common.not_found_title')}</p>
        <p className="mt-2 text-sm text-navy-500">{t('common.not_found_text')}</p>
        <Link to="/" className="btn-primary mt-6">
          {t('common.back_home')}
        </Link>
      </div>
    );
  }

  const totalFound = filteredSights.length + filteredTrips.length;

  return (
    <div>
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-navy-900">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-teal-800" aria-hidden="true" />
        <OrnamentPattern className="opacity-[0.07]" />
        <div className="container-page relative py-12 sm:py-16">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-300">
            {t('city.heroRegion')}: {L(city.city.region, lang)}
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-cream-50 sm:text-5xl">
            {L(city.city.name, lang)}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-navy-100/90 sm:text-base">
            {L(city.city.description, lang)}
          </p>

          {/* Қалай жету */}
          <div className="mt-8">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-navy-200">
              {t('city.gettingThere')}
              <span className="rounded-full bg-navy-800/80 px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-navy-300">
                {t('city.gettingThere_note')}
              </span>
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {city.city.getting_there.map((g) => {
                const Icon = g.type === 'air' ? Plane : g.type === 'train' ? TrainFront : Bus;
                return (
                  <div key={g.type} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                    <div className="flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-500/20 text-teal-300">
                        <Icon size={15} aria-hidden="true" />
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300">
                        {t(`city.${g.type}`)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-bold text-cream-50">{L(g.name, lang)}</p>
                    <p className="mt-1 text-xs leading-relaxed text-navy-200">
                      {g.note ? L(g.note, lang) : g.address ?? ''}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] font-semibold text-navy-300">
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
          </div>
        </div>
      </section>

      {/* ================= STICKY SECTION NAV ================= */}
      <div className="sticky top-16 z-40 border-b border-navy-100 bg-cream-50/90 backdrop-blur-md">
        <nav className="container-page thin-scroll flex gap-1.5 overflow-x-auto py-2.5" aria-label="sections">
          {SECTION_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => scrollToSection(id)}
              className={cn(
                'shrink-0 rounded-full px-4 py-2 text-[13px] font-bold transition-all duration-200',
                active === id
                  ? 'bg-teal-600 text-white shadow-card'
                  : 'text-navy-500 hover:bg-navy-100/70 hover:text-navy-800',
              )}
            >
              {t(`city.sections.${id}`)}
            </button>
          ))}
        </nav>
      </div>

      {/* ================= SIGHTS ================= */}
      <section id="sights" className="section-anchor container-page pt-12 sm:pt-16">
        <SectionHeading
          title={t('city.sights.title')}
          subtitle={t('city.sights.subtitle')}
        />

        {/* Сүзгілер */}
        <div className="mb-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-28 shrink-0 text-xs font-bold text-navy-500">
              {t('city.sights.filter_category')}
            </span>
            <div className="thin-scroll flex flex-1 gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setCat('all')}
                className={cat === 'all' ? 'chip-on shrink-0' : 'chip-off shrink-0'}
              >
                {t('city.sights.all')}
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCat(c)}
                  className={cat === c ? 'chip-on shrink-0' : 'chip-off shrink-0'}
                >
                  {t(`city.sights.cat_${c}`)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-28 shrink-0 text-xs font-bold text-navy-500">
              {t('city.sights.filter_interests')}
            </span>
            <div className="thin-scroll flex flex-1 flex-wrap gap-2">
              {city.interest_options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    setInterests((prev) =>
                      prev.includes(opt.id) ? prev.filter((x) => x !== opt.id) : [...prev, opt.id],
                    )
                  }
                  className={interests.includes(opt.id) ? 'chip-on' : 'chip-off'}
                >
                  {L(opt, lang)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold text-navy-400">
            <span>
              {totalFound} {t(`city.sights.results_${pluralKey(lang, totalFound)}`)}
            </span>
            {(cat !== 'all' || interests.length > 0) && (
              <button
                type="button"
                onClick={() => {
                  setCat('all');
                  setInterests([]);
                }}
                className="font-bold text-teal-700 hover:text-teal-800"
              >
                {t('city.sights.reset')}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <GridSkeleton count={6} />
        ) : filteredSights.length === 0 && filteredTrips.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="font-display text-lg font-bold text-navy-700">{t('city.sights.empty')}</p>
            <p className="mt-1 text-sm text-navy-400">{t('city.sights.empty_hint')}</p>
          </div>
        ) : (
          <>
            {filteredSights.length > 0 && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filteredSights.map((a) => (
                  <AttractionCard
                    key={a.id}
                    attraction={a}
                    lang={lang}
                    onShowOnMap={(a2) => showOnMap({ kind: 'attraction', id: a2.id })}
                  />
                ))}
              </div>
            )}

            {filteredTrips.length > 0 && (
              <div id="outside-list" className="section-anchor mt-10">
                <div className="mb-5 flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-navy-800 text-gold-400">
                    <ArrowLeftRight size={17} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-bold text-navy-800">
                      {t('city.sights.outside_list_title')}
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-navy-500">
                      {t('city.sights.outside_list_subtitle')}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {filteredTrips.map((a) => (
                    <AttractionCard key={a.id} attraction={a} lang={lang} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* ================= HOTELS ================= */}
      <section id="hotels" className="section-anchor container-page pt-14 sm:pt-20">
        <SectionHeading
          title={t('city.hotels.title')}
          subtitle={t('city.hotels.subtitle')}
        />

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2">
            <span className="text-xs font-bold text-navy-500">{t('city.hotels.filter_price')}</span>
            <select
              className="input w-auto"
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value as PriceFilter)}
            >
              <option value="any">{t('city.hotels.price_any')}</option>
              <option value="0-12">{t('city.hotels.price_0_12')}</option>
              <option value="12-20">{t('city.hotels.price_12_20')}</option>
              <option value="20+">{t('city.hotels.price_20_plus')}</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-xs font-bold text-navy-500">{t('city.hotels.sort')}</span>
            <select
              className="input w-auto"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              <option value="price_asc">{t('city.hotels.sort_price_asc')}</option>
              <option value="price_desc">{t('city.hotels.sort_price_desc')}</option>
              <option value="rating">{t('city.hotels.sort_rating')}</option>
            </select>
          </label>
          <span className="ml-auto text-xs font-semibold text-navy-400">
            {filteredHotels.length} {t(`city.hotels.results_${pluralKey(lang, filteredHotels.length)}`)}
          </span>
        </div>

        {loading ? (
          <GridSkeleton count={4} />
        ) : filteredHotels.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="font-display text-lg font-bold text-navy-700">{t('city.hotels.empty')}</p>
            <p className="mt-1 text-sm text-navy-400">{t('city.hotels.empty_hint')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredHotels.map((h) => (
              <HotelCard
                key={h.id}
                hotel={h}
                lang={lang}
                onShowOnMap={(h2: Hotel) => showOnMap({ kind: 'hotel', id: h2.id })}
              />
            ))}
          </div>
        )}
      </section>

      {/* ================= MAP ================= */}
      <section id="map" className="section-anchor container-page pt-14 sm:pt-20">
        <SectionHeading title={t('city.map.title')} subtitle={t('city.map.subtitle')} />
        <MapView
          center={[city.city.center.lat, city.city.center.lng]}
          centerApprox={city.city.center.approx}
          attractions={citySights}
          hotels={hotels}
          selected={selected}
          onSelect={setSelected}
          lang={lang}
        />
        <p className="mt-3 flex items-center gap-2 text-xs text-navy-400">
          <MapPin size={13} aria-hidden="true" />
          {t('city.map.day_trip_note')} —{' '}
          <button
            type="button"
            onClick={() => scrollToSection('outside-list')}
            className="font-bold text-teal-700 underline underline-offset-2 hover:text-teal-800"
          >
            {t('city.sights.outside_list_title')}
          </button>
        </p>
      </section>

      {/* ================= PHRASES ================= */}
      <section id="phrases" className="section-anchor container-page pt-14 sm:pt-20">
        <SectionHeading
          title={t('city.phrases.title')}
          subtitle={t('city.phrases.subtitle')}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {city.kazakh_phrases.map((p) => (
            <PhraseCard key={p.id} phrase={p} lang={lang} compact />
          ))}
        </div>

        <div className="card mt-6 p-5">
          <h3 className="font-display text-base font-bold text-navy-800">
            {t('city.phrases.food_title')}
          </h3>
          <p className="mt-1 text-xs text-navy-400">{t('city.phrases.food_note')}</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {city.local_food.items.map((item, i) => (
              <li key={i} className="chip border-teal-200 bg-teal-50 text-teal-800">
                {L(item, lang)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ================= GUIDE ================= */}
      <section id="guide" className="section-anchor container-page pt-14 sm:pt-20">
        <SectionHeading title={t('guide.title')} subtitle={t('guide.subtitle')} />
        <GuideWidget data={city} lang={lang} compact />
      </section>

      <OrnamentDivider className="container-page mt-16" />
    </div>
  );
}
