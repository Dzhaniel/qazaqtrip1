import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';
import { getCity } from '../../data/cities';
import { L } from '../../lib/utils';
import { OrnamentMark, OrnamentPattern } from '../Ornament';

/**
 * Футер — беттің түйіні (anchor). Қошқар мүйіз оюы бүкіл қосымшада
 * ҮЛБЕН өте сирек фон ретінде дәл осында (3–5% opacity) қолданылады.
 */
export default function Footer() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage as 'kk' | 'en' | 'ru';
  const city = getCity('kyzylorda');

  return (
    <footer className="relative mt-20 overflow-hidden bg-navy-900 text-navy-200">
      {/* ою-өрнек — бүкіл сайттағы ЖЕГІЛ сирек орын, opacity 4% */}
      <OrnamentPattern className="opacity-[0.04]" />

      <div className="container-page relative grid gap-10 py-12 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-600 text-gold-300">
              <OrnamentMark className="h-4 w-8" />
            </span>
            <span className="font-display text-lg font-bold text-cream-50">{t('app.name')}</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-navy-200/90">{t('footer.about')}</p>
          <p className="mt-4 text-xs font-bold text-gold-400">{t('footer.made_with')}</p>
        </div>

        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-navy-300">
            {t('footer.sections')}
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link to="/" className="transition-colors hover:text-gold-300">
                {t('nav.home')}
              </Link>
            </li>
            <li>
              <Link to="/city/kyzylorda" className="transition-colors hover:text-gold-300">
                {t('nav.city')}
              </Link>
            </li>
            <li>
              <Link to="/guide" className="transition-colors hover:text-gold-300">
                {t('nav.guide')}
              </Link>
            </li>
            <li>
              <Link to="/about" className="transition-colors hover:text-gold-300">
                {t('nav.about')}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-navy-300">
            {t('footer.data')}
          </h3>
          <p className="mt-4 text-sm">{t('footer.data_source')}</p>
          {city && (
            <p className="mt-2 text-sm text-navy-300">
              {t('footer.checked')}: <span className="font-bold text-cream-50">{city.meta.last_checked}</span>
            </p>
          )}
          <p className="mt-2 text-xs text-navy-300">
            {t('footer.photo_credits')}{' '}
            <a
              href="https://commons.wikimedia.org"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-gold-300 underline underline-offset-2 hover:text-gold-200"
            >
              Wikimedia Commons
            </a>
          </p>
        </div>
      </div>

      {city && (
        <div className="relative border-t border-navy-800">
          <div className="container-page py-4">
            <p className="flex items-start gap-2 text-xs leading-relaxed text-gold-200/90">
              <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{L(city.meta.disclaimer, lang)}</span>
            </p>
          </div>
        </div>
      )}

      <div className="relative border-t border-navy-800 py-4">
        <div className="container-page flex flex-col items-center justify-between gap-2 text-xs text-navy-400 sm:flex-row">
          <span>© {new Date().getFullYear()} {t('footer.rights')}</span>
          <span className="font-bold text-navy-300">{t('app.tagline')}</span>
        </div>
      </div>
    </footer>
  );
}
