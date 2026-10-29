import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { getCity } from '../data/cities';
import type { Lang } from '../data/types';
import PageHero from '../components/PageHero';
import GuideWidget from '../components/guide/GuideWidget';
import type { GuideForm } from '../lib/demoItinerary';
import NotFoundPage from './NotFoundPage';

interface GuideState {
  form?: Partial<GuideForm>;
}

export default function GuidePage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage as Lang;
  const location = useLocation();
  const city = getCity('kyzylorda');
  if (!city) return <NotFoundPage />;

  const initialForm = (location.state as GuideState | null)?.form;

  return (
    <div>
      <PageHero
        city={city}
        lang={lang}
        crumb={t('nav.guide')}
        title={t('guide.title')}
        subtitle={t('guide.subtitle')}
        Icon={Sparkles}
      />
      <section className="container-page py-10 sm:py-14">
        <GuideWidget data={city} lang={lang} initialForm={initialForm} />
      </section>
    </div>
  );
}
