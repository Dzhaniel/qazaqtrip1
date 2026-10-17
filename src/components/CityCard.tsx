import { Link } from 'react-router-dom';
import { ArrowRight, Lock, Mountain } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Lang } from '../data/types';
import { cn, L } from '../lib/utils';
import { OrnamentPattern } from './Ornament';

interface Props {
  id: string;
  name: { kk: string; en: string; ru: string };
  region: { kk: string; en: string; ru: string } | null;
  active: boolean;
  stats?: { attractions: number; hotels: number; phrases: number };
  lang: Lang;
}

/**
 * Қалалық карточка: белсенді (Қызылорда) немесе «Жақында» (demead).
 */
export default function CityCard({ id, name, region, active, stats, lang }: Props) {
  const { t } = useTranslation();

  const inner = (
    <>
      {/* Gradient-«фото» */}
      <div
        className={cn(
          'relative h-32 bg-gradient-to-br',
          active ? 'from-teal-500 via-teal-600 to-navy-800' : 'from-navy-300 to-navy-400 grayscale',
        )}
        aria-hidden="true"
      >
        <OrnamentPattern className={active ? 'opacity-[0.16]' : 'opacity-10'} />
        <div className="absolute inset-0 grid place-items-center text-white/90">
          <Mountain size={38} strokeWidth={1.5} />
        </div>
        <div className="absolute left-3 top-3">
          {active ? (
            <span className="rounded-full bg-gold-500 px-3 py-1 text-[11px] font-bold text-navy-900 shadow">
              {t('cities.active')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-navy-800/90 px-3 py-1 text-[11px] font-bold text-navy-100">
              <Lock size={10} aria-hidden="true" />
              {t('cities.soon')}
            </span>
          )}
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-display text-xl font-bold text-navy-800">{L(name, lang)}</h3>
        {region && <p className="mt-0.5 text-xs font-semibold text-navy-400">{L(region, lang)}</p>}

        {active && stats && (
          <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold">
            <span className="rounded-full bg-teal-50 px-2.5 py-1 text-teal-800">
              {stats.attractions} {t('hero.stat_attractions')}
            </span>
            <span className="rounded-full bg-teal-50 px-2.5 py-1 text-teal-800">
              {stats.hotels} {t('hero.stat_hotels')}
            </span>
            <span className="rounded-full bg-gold-100 px-2.5 py-1 text-gold-700">
              {stats.phrases} {t('hero.stat_phrases')}
            </span>
          </div>
        )}

        {active ? (
          <span className="btn-primary mt-5 w-full">
            {t('cities.open')}
            <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
          </span>
        ) : (
          <p className="mt-4 text-xs font-medium text-navy-400">{t('cities.soon_note')}</p>
        )}
      </div>
    </>
  );

  if (!active) {
    return (
      <div
        aria-disabled="true"
        className="relative block cursor-not-allowed overflow-hidden rounded-3xl border border-navy-100 bg-navy-50 opacity-80"
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      to={`/city/${id}`}
      className="group relative block overflow-hidden rounded-3xl border border-teal-300/60 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
    >
      {inner}
    </Link>
  );
}
