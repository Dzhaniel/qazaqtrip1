import { useTranslation } from 'react-i18next';
import { BookOpenCheck, Cpu, Database, Fingerprint, Globe2, Hammer } from 'lucide-react';
import { getCity } from '../data/cities';
import type { Lang } from '../data/types';
import { L } from '../lib/utils';
import SectionHeading from '../components/SectionHeading';
import { OrnamentDivider } from '../components/Ornament';

const TECH_ICONS = [Hammer, Globe2, Cpu, Fingerprint, Database, BookOpenCheck];

export default function AboutPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage as Lang;
  const city = getCity('kyzylorda');
  if (!city) return null;

  const techs = t('about.tech', { returnObjects: true }) as Array<{ name: string; desc: string }>;

  return (
    <div className="container-page py-10 sm:py-14">
      <SectionHeading title={t('about.title')} subtitle={t('about.subtitle')} />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Мақсат */}
        <section className="card p-6">
          <h2 className="font-display text-xl font-bold text-navy-800">{t('about.goal_title')}</h2>
          <p className="mt-3 text-sm leading-relaxed text-navy-600">{t('about.goal_text')}</p>
        </section>

        {/* Дереккөздер */}
        <section className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl font-bold text-navy-800">{t('about.data_title')}</h2>
            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800">
              {t('about.data_checked')}: {city.meta.last_checked}
            </span>
          </div>
          <ul className="mt-4 space-y-1.5">
            {city.meta.sources.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px] leading-relaxed text-navy-600">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" aria-hidden="true" />
                {s}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-navy-400">{t('about.footer_note')}</p>
        </section>
      </div>

      {/* Технологиялар */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-bold text-navy-800">{t('about.tech_title')}</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {techs.map((item, i) => {
            const Icon = TECH_ICONS[i % TECH_ICONS.length];
            return (
              <article key={item.name} className="card p-5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-600 text-white">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-sm font-bold text-navy-800">{item.name}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-navy-500">{item.desc}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* ЖИ */}
      <section className="card mt-10 p-6">
        <h2 className="font-display text-xl font-bold text-navy-800">{t('about.ai_title')}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-navy-600">{t('about.ai_text')}</p>
      </section>

      {/* Дерек ережелері */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-bold text-navy-800">{t('about.data_rules_title')}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gold-300 bg-gold-100/50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-gold-700">{t('about.null_rule_title')}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-navy-600">{city.meta.data_rules.null_means}</p>
          </div>
          <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-teal-700">{t('about.approx_rule_title')}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-navy-600">
              {L(
                {
                  kk: 'Координаталар шамамен берілген. Картада «шамамен» деп белгіленеді, бағдар — map_query бойынша.',
                  en: 'Coordinates are approximate. The map pin is marked “approx.”, directions use the place name.',
                  ru: 'Координаты приблизительные. На карте стоит пометка «прибл.», маршрут строится по названию места.',
                },
                lang,
              )}
            </p>
          </div>
          <div className="rounded-2xl border border-navy-200 bg-navy-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-navy-500">{t('about.editorial_rule_title')}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-navy-600">{city.meta.data_rules.duration_min_and_interests}</p>
          </div>
        </div>
      </section>

      <OrnamentDivider className="mt-14" />
    </div>
  );
}
