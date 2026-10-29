import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Map as MapIcon, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getCity } from '../../data/cities';
import type { Lang } from '../../data/types';
import PageHero from '../../components/PageHero';
import CitySubNav from '../../components/CitySubNav';
import MapView, { type MapTarget } from '../../components/MapView';
import NotFoundPage from '../NotFoundPage';
import { OrnamentDivider } from '../../components/Ornament';

function parseSel(sel: string | null): MapTarget | null {
  if (!sel) return null;
  const m = sel.match(/^(a|h):(.+)$/);
  if (!m) return null;
  return m[1] === 'a' ? { kind: 'attraction', id: m[2] } : { kind: 'hotel', id: m[2] };
}

export default function CityMap() {
  const { t, i18n } = useTranslation();
  const { cityId } = useParams();
  const lang = i18n.resolvedLanguage as Lang;
  const city = getCity(cityId ?? 'kyzylorda');
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSelected = useMemo(() => parseSel(searchParams.get('sel')), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [selected, setSelected] = useState<MapTarget | null>(initialSelected);

  if (!city) return <NotFoundPage />;

  const citySights = city.attractions.filter((a) => a.type === 'city');

  const handleSelect = (target: MapTarget) => {
    setSelected(target);
    const code = target.kind === 'attraction' ? 'a' : 'h';
    setSearchParams({ sel: `${code}:${target.id}` }, { replace: true });
  };

  return (
    <div>
      <PageHero
        city={city}
        lang={lang}
        crumb={t('city.sections.map')}
        title={t('city.map.title')}
        subtitle={t('city.map.subtitle')}
        Icon={MapIcon}
      />
      <CitySubNav city={city} />

      <section className="container-page py-10 sm:py-12">
        <MapView
          center={[city.city.center.lat, city.city.center.lng]}
          centerApprox={city.city.center.approx}
          attractions={citySights}
          hotels={city.hotels}
          selected={selected}
          onSelect={handleSelect}
          lang={lang}
        />
        <p className="mt-4 flex flex-wrap items-center gap-1.5 text-xs text-navy-400">
          <MapPin size={13} aria-hidden="true" />
          {t('city.map.day_trip_note')} —{' '}
          <Link
            to={`/city/${city.city.id}/sights`}
            className="font-bold text-teal-700 underline underline-offset-2 hover:text-teal-800"
          >
            {t('city.sights.outside_list_title')}
          </Link>
        </p>
      </section>

      <OrnamentDivider className="container-page mb-4" />
    </div>
  );
}
