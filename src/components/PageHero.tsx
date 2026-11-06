import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CityData, Lang } from '../data/types';
import { L, cn } from '../lib/utils';
import { OrnamentMark } from './Ornament';

interface Props {
  city: CityData;
  lang: Lang;
  /** Бөлім аты — city.sections.* i18n-кілтінің мәні. */
  crumb: string;
  title: string;
  subtitle?: string;
  Icon?: React.ComponentType<{ size?: number | string; className?: string; strokeWidth?: number | string }>;
  /** region орнына басқа кіккер (мыс., «Қазақстан»). */
  kicker?: string;
  /** true — крошкада қала сілтемесін көрсетпеу (Басты бет > бөлім). */
  homeOnly?: boolean;
  /** оң жақтағы декоративті иконка орнына белсенді батырма/түйме. */
  action?: React.ReactNode;
}

/**
 * Қаланың әр бөлім-бетінің ортақ «басы» — ЖАРЫҚ нұсқа:
 * жылы ақ фон, крошки, үлкен display-тақырып, алтын сызықша.
 */
export default function PageHero({ city, lang, crumb, title, subtitle, Icon, kicker, homeOnly, action }: Props) {
  const { t } = useTranslation();

  return (
    <section className="border-b border-navy-100/70 bg-cream-50">
      <div className="container-page py-6 sm:py-8">
        <nav className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-navy-400" aria-label="breadcrumb">
          <Link to="/" className="transition-colors hover:text-teal-700">
            {t('nav.home')}
          </Link>
          {homeOnly ? null : (
            <>
              <ChevronRight size={12} aria-hidden="true" />
              <Link to={`/city/${city.city.id}`} className="transition-colors hover:text-teal-700">
                {L(city.city.name, lang)}
              </Link>
            </>
          )}
          <ChevronRight size={12} aria-hidden="true" />
          <span className="text-navy-700">{crumb}</span>
        </nav>

        <div className="mt-3 flex items-end justify-between gap-4">
          <div>
            <span className="kicker text-teal-700">{kicker ?? L(city.city.region, lang)}</span>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy-800 sm:text-4xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-navy-500 sm:text-[15px]">{subtitle}</p>
            )}
          </div>

          {action ? (
            <div className="shrink-0 pb-1">{action}</div>
          ) : Icon ? (
            <span
              className={cn(
                'hidden h-16 w-16 shrink-0 place-items-center rounded-2xl bg-teal-600 text-white shadow-card sm:grid',
              )}
              aria-hidden="true"
            >
              <Icon size={28} strokeWidth={1.5} />
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-gradient-to-r from-gold-400/70 via-gold-300/40 to-transparent" />
          <OrnamentMark className="h-4 w-8 text-gold-500/80" />
        </div>
      </div>
    </section>
  );
}
