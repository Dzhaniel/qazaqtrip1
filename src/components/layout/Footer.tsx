import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';
import { getCity } from '../../data/cities';
import { L } from '../../lib/utils';
import { OrnamentMark } from '../Ornament';

export default function Footer() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage as 'kk' | 'en' | 'ru';
  const city = getCity('kyzylorda');

  return (
    <footer className="mt-20 bg-navy-900 text-navy-200">
      <div className="container-page grid gap-10 py-12 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-navy-800 text-gold-400">
              <OrnamentMark className="h-4 w-8" />
            </span>
            <span className="font-display text-lg font-bold text-cream-100">{t('app.name')}</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-navy-200/90">
            {t('footer.about')}
          </p>
          <p className="mt-4 text-xs font-semibold text-gold-400">{t('footer.made_with')}</p>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-navy-300">
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
          <h3 className="text-xs font-bold uppercase tracking-widest text-navy-300">
            {t('footer.data')}
          </h3>
          <p className="mt-4 text-sm">{t('footer.data_source')}</p>
          {city && (
            <p className="mt-2 text-sm text-navy-300">
              {t('footer.checked')}: <span className="font-semibold text-cream-100">{city.meta.last_checked}</span>
            </p>
          )}
        </div>
      </div>

      {city && (
        <div className="border-t border-navy-800">
          <div className="container-page py-4">
            <p className="flex items-start gap-2 text-xs leading-relaxed text-gold-200/90">
              <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{L(city.meta.disclaimer, lang)}</span>
            </p>
          </div>
        </div>
      )}

      <div className="border-t border-navy-800 py-4">
        <div className="container-page flex flex-col items-center justify-between gap-2 text-xs text-navy-400 sm:flex-row">
          <span>© {new Date().getFullYear()} {t('footer.rights')}</span>
          <span className="font-semibold text-navy-300">{t('app.tagline')}</span>
        </div>
      </div>
    </footer>
  );
}
