import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftRight, Landmark } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getCity } from '../../data/cities';
import type { Attraction, AttractionCategory, Lang } from '../../data/types';
import { L, pluralKey } from '../../lib/utils';
import { useFakeLoad } from '../../lib/hooks';
import PageHero from '../../components/PageHero';
import CitySubNav from '../../components/CitySubNav';
import AttractionCard from '../../components/AttractionCard';
import { GridSkeleton } from '../../components/Skeletons';
import NotFoundPage from '../NotFoundPage';
import { OrnamentDivider } from '../../components/Ornament';

export default function CitySights() {
  const { t, i18n } = useTranslation();
  const { cityId } = useParams();
  const lang = i18n.resolvedLanguage as Lang;
  const navigate = useNavigate();
  const city = getCity(cityId ?? 'kyzylorda');
  const loading = useFakeLoad(500);

  const [cat, setCat] = useState<string>('all');
  const [interests, setInterests] = useState<string[]>([]);

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

  if (!city) return <NotFoundPage />;

  const matchesFilters = (a: Attraction) =>
    (cat === 'all' || a.category === cat) &&
    (interests.length === 0 || interests.some((i) => a.interests.includes(i)));

  const filteredSights = citySights.filter(matchesFilters);
  const filteredTrips = dayTrips.filter(matchesFilters);
  const totalFound = filteredSights.length + filteredTrips.length;

  const showOnMap = (id: string) => navigate(`/city/${city.city.id}/map?sel=a:${id}`);

  return (
    <div>
      <PageHero
        city={city}
        lang={lang}
        crumb={t('city.sections.sights')}
        title={t('city.sights.title')}
        subtitle={t('city.sights.subtitle')}
        Icon={Landmark}
      />
      <CitySubNav city={city} />

      <section className="container-page py-10 sm:py-12">
        {/* Сүзгілер */}
        <div className="card mb-8 space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-32 shrink-0 text-xs font-bold text-navy-500">
              {t('city.sights.filter_category')}
            </span>
            <div className="thin-scroll flex flex-1 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCat('all')}
                className={cat === 'all' ? 'chip-on' : 'chip-off'}
              >
                {t('city.sights.all')}
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCat(c)}
                  className={cat === c ? 'chip-on' : 'chip-off'}
                >
                  {t(`city.sights.cat_${c}`)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-32 shrink-0 text-xs font-bold text-navy-500">
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
          <div className="flex items-center justify-between border-t border-navy-100 pt-3 text-xs font-semibold text-navy-400">
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
          <div className="card p-12 text-center">
            <p className="font-display text-lg font-bold text-navy-700">{t('city.sights.empty')}</p>
            <p className="mt-1 text-sm text-navy-400">{t('city.sights.empty_hint')}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredSights.map((a) => (
                <AttractionCard
                  key={a.id}
                  attraction={a}
                  lang={lang}
                  onShowOnMap={(a2) => showOnMap(a2.id)}
                />
              ))}
            </div>

            {filteredTrips.length > 0 && (
              <div id="outside-list" className="mt-12">
                <div className="mb-5 flex items-start gap-3.5">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-teal-600 text-white">
                    <ArrowLeftRight size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="font-display text-xl font-bold text-navy-800">
                      {t('city.sights.outside_list_title')}
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-navy-500">
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

      <OrnamentDivider className="container-page mb-4" />
    </div>
  );
}
