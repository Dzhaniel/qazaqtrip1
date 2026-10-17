import { useState } from 'react';
import {
  BedDouble,
  ChevronDown,
  Coffee,
  ExternalLink,
  Info,
  MapPin,
  Navigation,
  Star,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Hotel, Lang } from '../data/types';
import { L, cn, hotelPriceLabel, mapsUrl } from '../lib/utils';
import { VerifyBadge } from './Badge';

interface Props {
  hotel: Hotel;
  lang: Lang;
  onShowOnMap?: (h: Hotel) => void;
}

export default function HotelCard({ hotel: h, lang, onShowOnMap }: Props) {
  const { t } = useTranslation();
  const [noteOpen, setNoteOpen] = useState(false);

  const hasCoords = h.lat != null && h.lng != null;
  const priceKnown = h.price_from_kzt != null || h.price_to_kzt != null;

  return (
    <article className="card flex h-full flex-col gap-3 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-lg font-bold leading-snug text-navy-800">
            {L(h.name, lang)}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            {h.stars != null && (
              <span className="flex items-center gap-0.5" aria-label={`${h.stars} ${t('city.hotels.stars')}`}>
                {Array.from({ length: h.stars }).map((_, i) => (
                  <Star key={i} size={13} className="fill-gold-500 text-gold-500" aria-hidden="true" />
                ))}
              </span>
            )}
            {h.rating && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-navy-500">
                <Star size={12} className="fill-gold-500 text-gold-500" aria-hidden="true" />
                {h.rating.score.toFixed(1)}
                <span className="text-navy-300">/ {h.rating.scale}</span>
                <span className="font-normal text-navy-400">· {h.rating.reviews} {t('city.hotels.reviews')}</span>
              </span>
            )}
          </div>
        </div>
        {!h.verified && <VerifyBadge className="shrink-0" />}
      </div>

      <div className="rounded-xl bg-teal-50 px-4 py-3">
        <p className={cn('font-display text-lg font-bold', priceKnown ? 'text-teal-800' : 'italic text-gold-700')}>
          {hotelPriceLabel(h, t as (k: string) => string)}
        </p>
        {h.breakfast_included === true && (
          <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-bold text-teal-800">
            <Coffee size={12} aria-hidden="true" />
            {t('city.hotels.breakfast')}
          </p>
        )}
      </div>

      {h.price_note && (
        <div>
          <button
            type="button"
            onClick={() => setNoteOpen((v) => !v)}
            className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 transition-colors hover:text-teal-800"
            aria-expanded={noteOpen}
          >
            <Info size={12} aria-hidden="true" />
            {t('city.hotels.price_note')}
            <ChevronDown size={12} className={cn('transition-transform', noteOpen && 'rotate-180')} aria-hidden="true" />
          </button>
          {noteOpen && (
            <p className="mt-1.5 rounded-lg bg-navy-50 px-3 py-2 text-xs leading-relaxed text-navy-500">
              {h.price_note}
            </p>
          )}
        </div>
      )}

      <dl className="grid gap-1.5 text-[13px]">
        <div className="flex items-start gap-2">
          <dt className="sr-only">{t('city.hotels.address')}</dt>
          <dd className="flex items-start gap-1.5 text-navy-600">
            <MapPin size={14} className="mt-0.5 shrink-0 text-navy-300" aria-hidden="true" />
            {h.address}
          </dd>
        </div>
        {h.district && (
          <div className="flex items-start gap-2">
            <dt className="sr-only">{t('city.hotels.district')}</dt>
            <dd className="flex items-start gap-1.5 text-navy-500">
              <BedDouble size={14} className="mt-0.5 shrink-0 text-navy-300" aria-hidden="true" />
              {L(h.district, lang)}
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        {hasCoords && (
          <button
            type="button"
            onClick={() => onShowOnMap?.(h)}
            className="btn-ghost flex-1 basis-36"
          >
            <MapPin size={15} aria-hidden="true" />
            {t('city.sights.show_on_map')}
          </button>
        )}
        <a
          href={mapsUrl(h.map_query)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-gold flex-1 basis-36"
          title={t('common.open_external')}
        >
          <Navigation size={15} aria-hidden="true" />
          {t('city.sights.directions')}
          <ExternalLink size={14} aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}
