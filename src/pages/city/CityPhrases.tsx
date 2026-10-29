import { useParams } from 'react-router-dom';
import { Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getCity } from '../../data/cities';
import type { Lang } from '../../data/types';
import { L } from '../../lib/utils';
import PageHero from '../../components/PageHero';
import CitySubNav from '../../components/CitySubNav';
import PhraseCard from '../../components/PhraseCard';
import NotFoundPage from '../NotFoundPage';
import { OrnamentDivider, OrnCorner } from '../../components/Ornament';

export default function CityPhrases() {
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
        crumb={t('city.sections.phrases')}
        title={t('city.phrases.title')}
        subtitle={t('city.phrases.subtitle')}
        Icon={Volume2}
      />
      <CitySubNav city={city} />

      <section className="container-page py-10 sm:py-12">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {city.kazakh_phrases.map((p) => (
            <PhraseCard key={p.id} phrase={p} lang={lang} />
          ))}
        </div>

        <div className="card relative mt-8 overflow-hidden p-6">
          <OrnCorner className="absolute right-3 top-3 text-gold-400/40" />
          <h3 className="font-display text-lg font-bold text-navy-800">
            {t('city.phrases.food_title')}
          </h3>
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
    </div>
  );
}
