import { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  CalendarClock,
  ChevronDown,
  Clock,
  ExternalLink,
  Landmark,
  MapPin,
  Mountain,
  Navigation,
  Plane,
  ShoppingBag,
  Sparkles,
  Sun,
  Ticket,
  TreePine,
  Users,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Attraction, AttractionCategory, Lang } from '../data/types';
import { L, mapsUrl, ticketDisplay, visitLabel, formatKzt, formatRub, cn } from '../lib/utils';
import { attractionImage } from '../lib/images';
import Photo from './Photo';
import { DayTripBadge, PermitBadge, VerifyBadge } from './Badge';

/** Жарық, бренд түстеріндегі градиент-фолбэктер (фото жоқ болса). */
const CATEGORY_GRADIENTS: Record<AttractionCategory, string> = {
  history: 'from-teal-400 via-teal-600 to-navy-700',
  monument: 'from-teal-500 via-teal-600 to-navy-700',
  nature: 'from-teal-400 via-teal-500 to-teal-700',
  theatre: 'from-gold-300 via-gold-400 to-gold-600',
  museum: 'from-teal-400 via-teal-500 to-teal-700',
  religious: 'from-teal-500 via-teal-700 to-navy-700',
  market: 'from-gold-300 via-gold-500 to-gold-700',
  park: 'from-teal-300 via-teal-400 to-teal-600',
  space: 'from-navy-600 via-navy-700 to-navy-900',
};

const CATEGORY_ICONS: Record<AttractionCategory, typeof Sun> = {
  history: Landmark,
  monument: Mountain,
  nature: TreePine,
  theatre: Users,
  museum: Sparkles,
  religious: Landmark,
  market: ShoppingBag,
  park: Sun,
  space: Plane,
};

const CATEGORY_KEYS: Record<AttractionCategory, string> = {
  history: 'cat_history',
  monument: 'cat_monument',
  nature: 'cat_nature',
  theatre: 'cat_theatre',
  museum: 'cat_museum',
  religious: 'cat_religious',
  market: 'cat_market',
  park: 'cat_park',
  space: 'cat_space',
};

interface Props {
  attraction: Attraction;
  lang: Lang;
  onShowOnMap?: (a: Attraction) => void;
  /** Беттің жоғарғы сурет биіктігі (класс). */
  photoHeight?: string;
}

/**
 * Көрікті орын карточкасы — SURAT-ALDY (image-first): фото жоғарыда, мәтін астында.
 * Бағалар: null -> «Баға нақтыланбаған», 0 -> «Тегін», Байқоңыр — RUB (аударылмайды),
 * restricted — САРЫ рұқсат ескертпесі АЛДЫН АЛЫНАП көрсетіледі.
 */
export default function AttractionCard({ attraction: a, lang, onShowOnMap, photoHeight = 'h-48 sm:h-56' }: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const Icon = CATEGORY_ICONS[a.category];
  const isDayTrip = a.type === 'day_trip';
  const restricted = Boolean(a.restricted && a.permit);
  const ticket = ticketDisplay(a.ticket);

  function hoursText(): string {
    if (a.hours == null) return t('common.hours_unknown');
    return L(a.hours, lang);
  }

  function ticketMain(): string {
    if (ticket.kind === 'rub') {
      const parts: string[] = [];
      if (a.ticket.museum_audio_guide_rub != null)
        parts.push(
          `${lang === 'kk' ? 'Музей (аудиогид)' : lang === 'en' ? 'Museum (audio guide)' : 'Музей (аудиогид)'}: ${formatRub(a.ticket.museum_audio_guide_rub)}`,
        );
      if (a.ticket.cosmodrome_group_tour_rub != null)
        parts.push(
          `${lang === 'kk' ? 'Ғарыш айлағы (топтық)' : lang === 'en' ? 'Cosmodrome (group)' : 'Космодром (группово)'}: ${formatRub(a.ticket.cosmodrome_group_tour_rub)}`,
        );
      return parts.join(' · ');
    }
    if (ticket.kind === 'free') return t('city.sights.free');
    if (ticket.kind === 'unknown') return t('common.price_unknown');
    let label = formatKzt(ticket.kzt ?? 0);
    if (a.ticket.student_kzt != null) label += ` · ${lang === 'kk' ? 'студенттер' : lang === 'en' ? 'students' : 'студенты'} ${formatKzt(a.ticket.student_kzt)}`;
    if (a.ticket.child_kzt != null) label += ` · ${lang === 'kk' ? 'балалар' : lang === 'en' ? 'children' : 'дети'} ${formatKzt(a.ticket.child_kzt)}`;
    return label;
  }

  return (
    <article className="card group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
      {/* Фото: JSON image → жергілікті фото → градиент */}
      <div className="relative shrink-0">
        <Photo
          src={attractionImage(a)}
          alt={L(a.name, lang)}
          fallback={CATEGORY_GRADIENTS[a.category]}
          icon={Icon}
          className={photoHeight}
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5 pr-24">
          {isDayTrip && <DayTripBadge />}
          {restricted && <PermitBadge />}
        </div>
        {!a.verified && <VerifyBadge className="absolute right-3 top-3" />}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        {/* Байқоңыр: рұқсат — САРЫ, ЕРЕКШЕ және ДЕТАЛЬДАР АЛДЫНДА */}
        {restricted && a.permit && (
          <div role="alert" className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-3.5">
            <p className="flex items-center gap-1.5 text-sm font-extrabold text-amber-900">
              <AlertTriangle size={15} className="shrink-0 text-amber-600" aria-hidden="true" />
              {t('city.sights.permit_title')}
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-amber-900/90">{L(a.permit, lang)}</p>
            {a.permit.recommendation && (
              <p className="mt-1.5 text-xs font-bold text-amber-800">
                {lang === 'kk' ? 'Кеңес: ' : lang === 'en' ? 'Advice: ' : 'Совет: '}
                {a.permit.recommendation}
              </p>
            )}
          </div>
        )}

        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-teal-700">
            {t(`city.sights.${CATEGORY_KEYS[a.category]}`)}
          </p>
          <h3 className="mt-1 font-display text-lg font-bold leading-snug text-navy-800">{L(a.name, lang)}</h3>
        </div>

        <p className={cn('text-sm leading-relaxed text-navy-500', !expanded && 'clamp-3')}>
          {L(a.short, lang)}
        </p>

        {isDayTrip && a.travel_note && (
          <p className="flex items-start gap-2 rounded-xl bg-teal-50 px-3 py-2.5 text-xs leading-relaxed text-navy-600">
            <ArrowLeftRight size={14} className="mt-0.5 shrink-0 text-teal-700" aria-hidden="true" />
            <span>{L(a.travel_note, lang)}</span>
          </p>
        )}

        <dl className="grid gap-2 text-[13px]">
          <div className="flex items-start gap-2">
            <dt className="flex items-center gap-1.5 font-bold text-navy-400">
              <MapPin size={14} className="shrink-0" aria-hidden="true" />
              {t('city.sights.address')}
            </dt>
            <dd className="text-navy-600">{a.address}</dd>
          </div>
          <div className="flex items-start gap-2">
            <dt className="flex items-center gap-1.5 font-bold text-navy-400">
              <Clock size={14} className="shrink-0" aria-hidden="true" />
              {t('city.sights.hours')}
            </dt>
            <dd className="text-navy-600">{hoursText()}</dd>
          </div>
          <div className="flex items-start gap-2">
            <dt className="flex items-center gap-1.5 font-bold text-navy-400">
              <Ticket size={14} className="shrink-0" aria-hidden="true" />
              {t('city.sights.ticket')}
            </dt>
            <dd className={cn(ticket.kind === 'unknown' ? 'italic text-gold-700' : 'text-navy-600')}>
              {ticketMain()}
              {a.ticket.note && <span className="mt-0.5 block text-xs text-navy-400">{a.ticket.note}</span>}
            </dd>
          </div>
          <div className="flex items-start gap-2">
            <dt className="flex items-center gap-1.5 font-bold text-navy-400">
              <CalendarClock size={14} className="shrink-0" aria-hidden="true" />
              {t('city.sights.visit')}
            </dt>
            <dd className="text-navy-600">{visitLabel(a.visit_min, lang)}</dd>
          </div>
        </dl>

        {(a.notes || a.etiquette || a.source || a.phone) && (
          <div>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 transition-colors hover:text-teal-800"
              aria-expanded={expanded}
            >
              {expanded ? t('city.sights.hide_details') : t('city.sights.details')}
              <ChevronDown size={13} className={cn('transition-transform', expanded && 'rotate-180')} aria-hidden="true" />
            </button>
            {expanded && (
              <div className="mt-2 space-y-2 text-xs leading-relaxed text-navy-500">
                {a.notes && <p>{L(a.notes, lang)}</p>}
                {a.etiquette && (
                  <p className="rounded-lg bg-gold-100 px-3 py-2 text-gold-800">
                    <span className="font-bold">{t('city.sights.etiquette')}: </span>
                    {L(a.etiquette, lang)}
                  </p>
                )}
                {a.phone && <p>{a.phone}</p>}
                {a.source && <p className="text-navy-300">{t('city.sights.source')}: {a.source}</p>}
              </div>
            )}
          </div>
        )}

        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          {isDayTrip || a.lat == null || a.lng == null ? null : (
            <button type="button" onClick={() => onShowOnMap?.(a)} className="btn-ghost flex-1 basis-36">
              <MapPin size={15} aria-hidden="true" />
              {t('city.sights.show_on_map')}
            </button>
          )}
          <a
            href={mapsUrl(a.map_query)}
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
      </div>
    </article>
  );
}
