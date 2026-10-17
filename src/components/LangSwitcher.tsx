import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Lang } from '../data/types';
import { cn } from '../lib/utils';
import { LANGS, setAppLanguage } from '../i18n';

const LABELS: Record<Lang, string> = { kk: 'KZ', en: 'EN', ru: 'RU' };

export default function LangSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n, t } = useTranslation();
  const current = (i18n.resolvedLanguage ?? 'kk') as Lang;
  const ref = useRef<HTMLDivElement>(null);

  // Тіл өзгергенде компоненттерді қайта рендерлеу i18next өз жүзеге асырады;
  // ref — болашақта фокус-бақылау үшін.
  void ref;

  return (
    <div
      ref={ref}
      role="group"
      aria-label={t('lang.label')}
      className="inline-flex items-center rounded-full border border-navy-200/70 bg-white/80 p-0.5 shadow-sm"
    >
      {LANGS.map((lang) => {
        const active = current === lang;
        return (
          <button
            key={lang}
            type="button"
            onClick={() => setAppLanguage(lang)}
            aria-pressed={active}
            className={cn(
              'rounded-full font-bold transition-all duration-200',
              compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs',
              active
                ? 'bg-navy-800 text-cream-100 shadow'
                : 'text-navy-400 hover:text-teal-700',
            )}
          >
            {LABELS[lang]}
          </button>
        );
      })}
    </div>
  );
}
