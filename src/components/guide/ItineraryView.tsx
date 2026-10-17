import { AlertTriangle, BedDouble, Car, MapPin, Sun, Utensils } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Itinerary, PlanItem } from '../../lib/demoItinerary';
import { cn } from '../../lib/utils';

const KIND_ICONS: Record<PlanItem['kind'], typeof MapPin> = {
  attraction: MapPin,
  hotel: BedDouble,
  meal: Utensils,
  free: Sun,
  travel: Car,
};

function CostPill({ cost, known }: { cost: string; known: boolean }) {
  const { t } = useTranslation();
  const label = known ? cost : t('common.price_unknown');
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold',
        known ? 'bg-teal-50 text-teal-800' : 'border border-dashed border-gold-500 bg-gold-100/60 text-gold-700',
      )}
    >
      {label}
    </span>
  );
}

/** Итнерарий: күн бойынша таймлайн + бюджет кестесі + ескертулер. */
export default function ItineraryView({ it }: { it: Itinerary }) {
  const { t } = useTranslation();
  const kztTotal = it.budget.reduce((s, b) => s + (b.known && b.kzt ? b.kzt : 0), 0);
  const rubTotal = it.budget.reduce((s, b) => s + (b.known && b.rub ? b.rub : 0), 0);
  const kindLabel = (k: string) =>
    t(`guide.itinerary.${k === 'ticket' ? 'ticket' : k === 'hotel' ? 'hotel' : k === 'tour' ? 'tour' : 'other'}`);

  return (
    <div className="mt-4 space-y-5">
      {/* Күндер */}
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
          {t('guide.itinerary.days')}
        </p>
        <div className="space-y-4">
          {it.days.map((day, di) => (
            <div
              key={day.day}
              className="card animate-fade-up overflow-hidden"
              style={{ animationDelay: `${di * 90}ms` }}
            >
              <div className="flex items-center gap-3 bg-navy-800 px-4 py-2.5">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-gold-500 font-display text-sm font-bold text-navy-900">
                  {day.day}
                </span>
                <div>
                  <p className="text-sm font-bold text-cream-100">
                    {t('guide.itinerary.day')} {day.day}
                    {day.dateLabel ? <span className="font-semibold text-gold-300"> · {day.dateLabel}</span> : null}
                  </p>
                  {day.title && <p className="text-[11px] text-navy-200">{day.title}</p>}
                </div>
              </div>

              <ol className="relative space-y-0 p-4">
                {day.items.map((item, ii) => {
                  const Icon = KIND_ICONS[item.kind] ?? MapPin;
                  const last = ii === day.items.length - 1;
                  return (
                    <li key={ii} className="relative flex gap-3 pb-4 last:pb-0">
                      {!last && (
                        <span className="absolute left-[13px] top-7 h-full w-px bg-navy-100" aria-hidden="true" />
                      )}
                      <span
                        className={cn(
                          'relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full border',
                          item.kind === 'travel'
                            ? 'border-navy-200 bg-navy-50 text-navy-500'
                            : 'border-teal-200 bg-teal-50 text-teal-700',
                        )}
                      >
                        <Icon size={13} aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        {item.warning && (
                          <div
                            role="alert"
                            className="mb-2 flex items-start gap-2 rounded-xl border-2 border-red-300 bg-red-50 px-3 py-2.5 text-xs leading-relaxed text-red-900"
                          >
                            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-red-700" aria-hidden="true" />
                            <span>
                              <span className="font-bold">{t('guide.itinerary.warning')}: </span>
                              {item.warning}
                            </span>
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          {item.time && (
                            <span className="rounded-md bg-navy-800 px-1.5 py-0.5 font-mono text-[11px] font-bold text-gold-300">
                              {item.time}
                            </span>
                          )}
                          <p className="text-sm font-semibold leading-snug text-navy-800">{item.name}</p>
                          {item.costLabel && <CostPill cost={item.costLabel} known={item.costKnown ?? false} />}
                        </div>
                        {item.howToGet && (
                          <p className="mt-0.5 text-xs leading-relaxed text-navy-400">{item.howToGet}</p>
                        )}
                        {item.mapsUrl && (
                          <a
                            href={item.mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-block text-[11px] font-bold text-teal-700 underline underline-offset-2 hover:text-teal-800"
                          >
                            {t('guide.itinerary.on_map')} ↗
                          </a>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      </div>

      {/* Бюджет */}
      <div className="card animate-fade-up overflow-hidden" style={{ animationDelay: '180ms' }}>
        <p className="bg-gold-100/70 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-gold-700">
          {t('guide.itinerary.budget')}
        </p>
        <ul className="divide-y divide-navy-100">
          {it.budget.map((b, i) => (
            <li key={i} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-navy-700">{b.label}</p>
                <p className="text-[11px] uppercase tracking-wide text-navy-300">{kindLabel(b.kind)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('text-sm font-bold', b.known ? 'text-navy-800' : 'italic text-gold-700')}>
                  {b.amountLabel}
                </span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-bold',
                    b.known ? 'bg-teal-50 text-teal-700' : 'bg-gold-100 text-gold-700',
                  )}
                >
                  {b.known ? t('guide.itinerary.known') : t('guide.itinerary.unknown')}
                </span>
              </div>
            </li>
          ))}
        </ul>
        {(kztTotal > 0 || rubTotal > 0) && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-navy-100 bg-navy-50/60 px-4 py-3">
            <p className="text-xs font-semibold text-navy-500">{t('guide.itinerary.total_known')}</p>
            <p className="font-display text-lg font-bold text-navy-800">
              {kztTotal > 0 ? `${kztTotal.toLocaleString('ru-RU').replace(/\u00a0/g, ' ')} ₸` : '—'}
              {rubTotal > 0 && (
                <span className="ml-2 text-sm font-semibold text-red-700">
                  + {rubTotal.toLocaleString('ru-RU').replace(/\u00a0/g, ' ')} ₽
                  <span className="ml-1 text-[10px] font-semibold text-navy-400">
                    ({t('guide.itinerary.rub_separate')})
                  </span>
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Нақтыланбаған бағалар */}
      {it.unknownPrices.length > 0 && (
        <div className="card animate-fade-up p-4" style={{ animationDelay: '240ms' }}>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-700">
            {t('guide.itinerary.unknown_items')}
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {it.unknownPrices.map((u, i) => (
              <li key={i} className="rounded-full border border-dashed border-gold-500 bg-gold-100/50 px-3 py-1 text-xs font-semibold text-gold-800">
                {u}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Ескертулер */}
      {it.notes.length > 0 && (
        <div className="card animate-fade-up p-4" style={{ animationDelay: '300ms' }}>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
            {t('guide.itinerary.notes')}
          </p>
          <ul className="mt-2 space-y-1.5">
            {it.notes.map((n, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px] leading-relaxed text-navy-600">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" aria-hidden="true" />
                {n}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Сөздер */}
      {it.phrases.length > 0 && (
        <div className="card animate-fade-up p-4" style={{ animationDelay: '360ms' }}>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-700">
            {t('guide.itinerary.phrases')}
          </p>
          <ul className="mt-2 space-y-1">
            {it.phrases.map((p, i) => (
              <li key={i} className="text-sm text-navy-700">
                <span className="font-display font-bold">«{p.kk}»</span>
                <span className="text-navy-400"> ({p.translit})</span> — {p.meaning}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
