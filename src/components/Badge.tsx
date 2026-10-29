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
        'inline-flex items-center gap-1 rounded-full border border-gold-400/70 bg-gold-100/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold-700 shadow-sm backdrop-blur',
        className,
      )}
    >
      <ShieldQuestion size={11} aria-hidden="true" />
      {t('common.verify')}
    </span>
  );
}

/** «Қаладан тыс» — type: day_trip. Сурет үстіне арналған ашық нұсқа. */
export function DayTripBadge({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-navy-800 shadow-sm backdrop-blur',
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

/** «Режимдік аймақ» — restricted: true. Сурет үстіне сары ескертпе. */
export function PermitBadge({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-extrabold text-navy-900 shadow-sm',
        className,
      )}
    >
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
      {t('city.sights.permit_badge')}
    </span>
  );
}
