import { ShieldQuestion } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

/**
 * «деректі тексеріңіз» — дерек ресми дереккөзден толық расталмаған (verified: false).
 */
export function VerifyBadge({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <span
      title={t('common.verify_hint')}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-gold-400/70 bg-gold-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold-700',
        className,
      )}
    >
      <ShieldQuestion size={11} aria-hidden="true" />
      {t('common.verify')}
    </span>
  );
}

/** «Қаладан тыс» — type: day_trip. */
export function DayTripBadge({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-navy-800 px-2.5 py-1 text-[11px] font-bold text-gold-300 shadow',
        className,
      )}
    >
      <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor" aria-hidden="true">
        <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 12.4A5.4 5.4 0 118 2.6a5.4 5.4 0 010 10.8zM6 6.8l2.2-3 2.2 3h-1.3v2.6H9.6V12H6.4v-2.6h.6V6.8H6z" />
      </svg>
      {t('city.sights.day_trip')}
    </span>
  );
}
