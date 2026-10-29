import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BedDouble } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getCity } from '../../data/cities';
import type { Lang } from '../../data/types';
import { pluralKey } from '../../lib/utils';
import { useFakeLoad } from '../../lib/hooks';
import PageHero from '../../components/PageHero';
import CitySubNav from '../../components/CitySubNav';
import HotelCard from '../../components/HotelCard';
import { GridSkeleton } from '../../components/Skeletons';
import NotFoundPage from '../NotFoundPage';
import { OrnamentDivider } from '../../components/Ornament';

type PriceFilter = 'any' | '0-12' | '12-20' | '20+';
type SortKey = 'price_asc' | 'price_desc' | 'rating';

export default function CityHotels() {
  const { t, i18n } = useTranslation();
  const { cityId } = useParams();
  const lang = i18n.resolvedLanguage as Lang;
  const navigate = useNavigate();
  const city = getCity(cityId ?? 'kyzylorda');
  const loading = useFakeLoad(500);

  const [priceFilter, setPriceFilter] = useState<PriceFilter>('any');
  const [sort, setSort] = useState<SortKey>('price_asc');

  const hotels = useMemo(() => (city ? city.hotels : []), [city]);

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

  if (!city) return <NotFoundPage />;

  const showOnMap = (id: string) => navigate(`/city/${city.city.id}/map?sel=h:${id}`);

  return (
    <div>
      <PageHero
        city={city}
        lang={lang}
        crumb={t('city.sections.hotels')}
        title={t('city.hotels.title')}
        subtitle={t('city.hotels.subtitle')}
        Icon={BedDouble}
      />
      <CitySubNav city={city} />

      <section className="container-page py-10 sm:py-12">
        <div className="card mb-8 flex flex-wrap items-center gap-4 p-5">
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
            <select className="input w-auto" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
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
          <div className="card p-12 text-center">
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
                onShowOnMap={(h2) => showOnMap(h2.id)}
              />
            ))}
          </div>
        )}
      </section>

      <OrnamentDivider className="container-page mb-4" />
    </div>
  );
}
