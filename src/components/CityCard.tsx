import { Link } from 'react-router-dom';
import { ArrowRight, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Lang } from '../data/types';
import { cn, L } from '../lib/utils';
import { comingSoonImage, cityImage } from '../lib/images';
import Photo from './Photo';

interface Props {
  id: string;
  name: { kk: string; en: string; ru: string };
  region: { kk: string; en: string; ru: string } | null;
  active: boolean;
  stats?: { attractions: number; hotels: number; phrases: number };
  lang: Lang;
}

/**
 * Қалалық фото-карточка (Visit Dubai стилі): үлкен фото, атауы сурет үстінде.
 * Белсенді қала — түсімен, «Жақында» — grayscale + белгі.
 */
export default function CityCard({ id, name, region, active, stats, lang }: Props) {
  const { t } = useTranslation();
  const src = active ? cityImage(id) : comingSoonImage(id);

  const inner = (
    <>
      <div className="relative h-56 sm:h-64">
        <Photo
          src={src}
          alt={L(name, lang)}
          className="absolute inset-0 h-full w-full"
          fallback="from-teal-400 via-teal-600 to-navy-700"
          icon={undefined}
          grayscale={!active}
          imgClassName={cn(!active && 'group-hover:scale-100')}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900/85 via-navy-900/25 to-navy-900/5" aria-hidden="true" />
        <div className="absolute left-4 top-4">
          {active ? (
            <span className="rounded-full bg-gold-500 px-3 py-1 text-[11px] font-extrabold text-navy-900 shadow">
              {t('cities.active')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[11px] font-extrabold text-navy-700 shadow backdrop-blur">
              <Lock size={11} aria-hidden="true" />
              {t('cities.soon')}
            </span>
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5">
          <h3 className="font-display text-2xl font-bold text-white drop-shadow-sm sm:text-3xl">{L(name, lang)}</h3>
          {region && <p className="mt-0.5 text-xs font-bold text-white/85">{L(region, lang)}</p>}
        </div>
      </div>

      {active ? (
        <div className="p-5">
          {stats && (
            <div className="flex flex-wrap gap-2 text-[11px] font-bold">
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
          <span className="btn-primary mt-4 w-full">
            {t('cities.open')}
            <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </div>
      ) : (
        <div className="p-5">
          <p className="text-xs font-semibold text-navy-400">{t('cities.soon_note')}</p>
        </div>
      )}
    </>
  );

  if (!active) {
    return (
      <div
        aria-disabled="true"
        className="relative block cursor-not-allowed overflow-hidden rounded-3xl border border-navy-100/70 bg-white opacity-90 shadow-card"
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      to={`/city/${id}`}
      className="group relative block overflow-hidden rounded-3xl border-2 border-teal-500/70 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
    >
      {inner}
    </Link>
  );
}
