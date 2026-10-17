import { useTranslation } from 'react-i18next';
import { getCity } from '../data/cities';
import type { Lang } from '../data/types';
import { OrnamentPattern } from '../components/Ornament';
import GuideWidget from '../components/guide/GuideWidget';

export default function GuidePage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage as Lang;
  const city = getCity('kyzylorda');
  if (!city) return null;

  return (
    <div>
      <section className="relative overflow-hidden bg-navy-900">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-teal-800" aria-hidden="true" />
        <OrnamentPattern className="opacity-[0.07]" />
        <div className="container-page relative py-12 sm:py-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-gold-500/10 px-4 py-1.5 text-xs font-bold text-gold-300">
            {t('app.name')} · {t('app.slogan')}
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-cream-50 sm:text-4xl">
            {t('guide.title')}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-navy-100/90 sm:text-base">
            {t('guide.subtitle')}
          </p>
        </div>
      </section>

      <section className="container-page py-10 sm:py-14">
        <GuideWidget data={city} lang={lang} />
      </section>
    </div>
  );
}
