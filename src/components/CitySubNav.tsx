import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { CityData } from '../data/types';
import { L, cn } from '../lib/utils';

/**
 * Қаланың бөлімдері үшін sticky тап-навигация (header астында).
 * Активті таб — teal мәтін + алтын астысызғыш.
 */
export default function CitySubNav({ city }: { city: CityData }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage as 'kk' | 'en' | 'ru';
  const base = `/city/${city.city.id}`;

  const items = [
    { to: base, key: 'overview', end: true },
    { to: `${base}/sights`, key: 'sights' },
    { to: `${base}/hotels`, key: 'hotels' },
    { to: `${base}/map`, key: 'map' },
    { to: `${base}/phrases`, key: 'phrases' },
  ];

  return (
    <div className="sticky top-16 z-40 border-b border-navy-100 bg-cream-50/92 backdrop-blur-md">
      <nav className="container-page thin-scroll flex gap-6 overflow-x-auto" aria-label="city sections">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'relative shrink-0 py-3.5 text-[11px] font-bold uppercase tracking-[0.16em] transition-colors duration-200',
                isActive ? 'text-teal-800' : 'text-navy-400 hover:text-navy-700',
              )
            }
          >
            {({ isActive }) => (
              <>
                {t(`city.sections.${item.key}`)}
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute inset-x-0 -bottom-px h-[2.5px] rounded-full bg-gradient-to-r from-gold-400 to-teal-500 transition-opacity duration-300',
                    isActive ? 'opacity-100' : 'opacity-0',
                  )}
                />
                {isActive && (
                  <span className="absolute -left-3 top-1/2 h-1 w-1 -translate-y-1/2 rotate-45 bg-gold-500" aria-hidden="true" />
                )}
              </>
            )}
          </NavLink>
        ))}
        <span className="sr-only">{L(city.city.name, lang)}</span>
      </nav>
    </div>
  );
}
