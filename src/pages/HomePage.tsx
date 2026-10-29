import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarCheck,
  Clock,
  Cpu,
  MapPin,
  Route,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cities, comingSoonCities, getCity } from '../data/cities';
import type { Attraction, Lang } from '../data/types';
import { L, cn, visitLabel } from '../lib/utils';
import { HERO_IMAGE, attractionImage } from '../lib/images';
import Photo from '../components/Photo';
import SectionHeading from '../components/SectionHeading';
import CityCard from '../components/CityCard';
import PhraseCard from '../components/PhraseCard';
import { DayTripBadge } from '../components/Badge';
import { OrnamentDivider } from '../components/Ornament';

/** «Міндетті түрде көріңіз» — қолмен таңдалған 5 орын (барлығы фотомен). */
const MUST_SEE_IDS = [
  'regional-history-museum',
  'central-square-drama-theatre',
  'first-president-park-embankment',
  'aitbay-mosque',
  'korkyt-ata-memorial',
];

const MUST_SEE_FALLBACKS: Record<string, string> = {
  'regional-history-museum': 'from-teal-400 via-teal-500 to-teal-700',
  'central-square-drama-theatre': 'from-gold-300 via-gold-400 to-gold-600',
  'first-president-park-embankment': 'from-teal-400 via-teal-500 to-teal-700',
  'aitbay-mosque': 'from-teal-500 via-teal-700 to-navy-700',
  'korkyt-ata-memorial': 'from-teal-400 via-teal-600 to-navy-700',
};

const HOW_STEPS = [
  { icon: CalendarCheck, titleKey: 'home.how_step1_title', textKey: 'home.how_step1_text' },
  { icon: Cpu, titleKey: 'home.how_step2_title', textKey: 'home.how_step2_text' },
  { icon: Route, titleKey: 'home.how_step3_title', textKey: 'home.how_step3_text' },
];

/** Тақырыптың соңғы сөзін алтын градиентпен бөледі. */
function HeroTitle({ text }: { text: string }) {
  const idx = text.lastIndexOf(' ');
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}{' '}
      <span className="bg-gradient-to-r from-gold-300 via-gold-400 to-gold-300 bg-clip-text text-transparent">
        {text.slice(idx + 1)}
      </span>
    </>
  );
}

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage as Lang;
  const navigate = useNavigate();
  const kyzylorda = getCity('kyzylorda');

  // ---- Floating planner (ЖИ-гидке кіреберіс) ----
  const [arrival, setArrival] = useState('');
  const [departure, setDeparture] = useState('');
  const [interests, setInterests] = useState<string[]>([]);

  const mustSee = useMemo(() => {
    if (!kyzylorda) return [] as Attraction[];
    return MUST_SEE_IDS.map((id) => kyzylorda.attractions.find((a) => a.id === id)).filter(
      (a): a is Attraction => a != null,
    );
  }, [kyzylorda]);

  const randomPhrases = useMemo(() => {
    if (!kyzylorda) return [];
    const pool = [...kyzylorda.kazakh_phrases];
    const picked: typeof pool = [];
    while (picked.length < 3 && pool.length > 0) {
      picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    return picked;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kyzylorda]);

  if (!kyzylorda) return null;

  const stats = {
    attractions: kyzylorda.attractions.length,
    hotels: kyzylorda.hotels.length,
    phrases: kyzylorda.kazakh_phrases.length,
  };

  function toggleInterest(id: string) {
    setInterests((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function submitPlanner(e: React.FormEvent) {
    e.preventDefault();
    navigate('/guide', {
      state: {
        form: {
          arrival,
          departure,
          interests,
          travelers: 2,
          budgetLevel: 'medium',
        },
      },
    });
  }

  return (
    <div>
      {/* ================= HERO (full-bleed фото) ================= */}
      <section className="relative">
        <div className="relative h-[78vh] max-h-[780px] min-h-[560px] w-full overflow-hidden">
          <Photo
            src={HERO_IMAGE}
            alt={L(kyzylorda.city.name, lang)}
            eager
            className="absolute inset-0 h-full w-full"
            fallback="from-teal-600 via-teal-700 to-navy-800"
          />
          {/* мәтін оқуға арналған ЖАРЫҚ градиент */}
          <div className="absolute inset-0 bg-gradient-to-r from-navy-900/75 via-navy-900/40 to-navy-900/5" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-cream-0 to-transparent" aria-hidden="true" />

          <div className="absolute inset-0">
            <div className="container-page flex h-full flex-col justify-center">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-md">
                <MapPin size={13} aria-hidden="true" />
                {t('hero.kicker')}
              </span>

              <h1 className="mt-5 max-w-3xl font-display text-5xl font-bold leading-[1.04] tracking-tight text-white drop-shadow-sm sm:text-6xl lg:text-7xl">
                <HeroTitle text={t('hero.title')} />
              </h1>

              <p className="mt-4 max-w-xl text-base font-medium leading-relaxed text-white/90 sm:text-lg">
                {t('hero.tagline')}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/city/kyzylorda" className="btn-gold px-7 py-3.5 text-base">
                  {t('hero.cta_city')}
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
                <Link to="/guide" className="btn-white px-7 py-3.5 text-base">
                  <Sparkles size={17} aria-hidden="true" />
                  {t('hero.cta_guide')}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ---- Floating planner card: hero астымен бетіп тұрады ---- */}
        <div className="container-page relative z-10 -mt-14 sm:-mt-16">
          <form onSubmit={submitPlanner} className="card p-5 shadow-lift sm:p-6">
            <p className="flex items-center gap-2 text-sm font-extrabold text-navy-800">
              <Wand2 size={16} className="text-gold-600" aria-hidden="true" />
              {t('planner.title')}
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.25fr_1fr_1fr_auto] lg:items-end">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-navy-500">{t('cities.choose')}</span>
                <select className="input" defaultValue="kyzylorda">
                  {Object.values(cities).map((c) => (
                    <option key={c.city.id} value={c.city.id}>
                      {L(c.city.name, lang)}
                    </option>
                  ))}
                  {comingSoonCities.map((c) => (
                    <option key={c.id} value={c.id} disabled>
                      {c.name[lang]} — {t('cities.soon')}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-navy-500">{t('guide.arrival')}</span>
                <input
                  type="date"
                  className="input"
                  value={arrival}
                  onChange={(e) => setArrival(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-navy-500">{t('guide.departure')}</span>
                <input
                  type="date"
                  className="input"
                  value={departure}
                  min={arrival || undefined}
                  onChange={(e) => setDeparture(e.target.value)}
                />
              </label>
              <button type="submit" className="btn-gold h-[46px] px-6 text-sm">
                {t('guide.submit')}
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {kyzylorda.interest_options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleInterest(opt.id)}
                  className={interests.includes(opt.id) ? 'chip-on' : 'chip-off'}
                  aria-pressed={interests.includes(opt.id)}
                >
                  {L(opt, lang)}
                </button>
              ))}
            </div>
          </form>
        </div>
      </section>

      {/* ================= 1. ҚАЛАЛАР ================= */}
      <section className="container-page pt-16 sm:pt-24">
        <SectionHeading title={t('cities.title')} subtitle={t('cities.subtitle')} />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <CityCard
            id={kyzylorda.city.id}
            name={kyzylorda.city.name}
            region={kyzylorda.city.region}
            active
            stats={stats}
            lang={lang}
          />
          {comingSoonCities.map((c) => (
            <CityCard key={c.id} id={c.id} name={c.name} region={c.region} active={false} lang={lang} />
          ))}
        </div>
      </section>

      {/* ================= 2. МІНДЕТТІ ТҮРДЕ КӨРІҢІЗ ================= */}
      <section className="mt-16 sm:mt-24">
        <div className="container-page">
          <SectionHeading
            title={t('home.mustsee_title')}
            subtitle={t('home.mustsee_subtitle')}
            className="mb-4"
          >
            <div className="mt-4">
              <Link
                to="/city/kyzylorda/sights"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-teal-700 transition-colors hover:text-teal-800"
              >
                {t('home.mustsee_more')}
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </SectionHeading>

          <div className="thin-scroll no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            {mustSee.map((a) => (
              <Link
                key={a.id}
                to="/city/kyzylorda/sights"
                className="group card relative w-[272px] shrink-0 snap-start overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lift sm:w-[300px]"
              >
                <div className="relative">
                  <Photo
                    src={attractionImage(a)}
                    alt={L(a.name, lang)}
                    fallback={MUST_SEE_FALLBACKS[a.id]}
                    className="h-44"
                  />
                  <div className="absolute left-3 top-3 flex flex-wrap gap-1.5 pr-24">
                    {a.type === 'day_trip' && <DayTripBadge />}
                    <span className="inline-flex items-center rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-navy-800 shadow-sm backdrop-blur">
                      {t(`city.sights.cat_${a.category}`)}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="clamp-2 font-display text-base font-bold leading-snug text-navy-800">
                    {L(a.name, lang)}
                  </h3>
                  <p className="clamp-2 mt-1.5 text-[13px] leading-relaxed text-navy-500">{L(a.short, lang)}</p>
                  <div className="mt-3 flex items-center justify-between text-xs font-bold text-navy-400">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={13} className="text-teal-600" aria-hidden="true" />
                      {visitLabel(a.visit_min, lang)}
                    </span>
                    <span className={cn('text-teal-700 transition-transform', 'group-hover:translate-x-0.5')}>
                      {t('home.mustsee_more')}
                      <ArrowRight size={12} className="ml-0.5 inline" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 3. ҚАЗАҚША ҮЙRENІП КӨРІҢІЗ ================= */}
      <section className="container-page mt-16 sm:mt-24">
        <SectionHeading title={t('homePhrases.title')} subtitle={t('homePhrases.subtitle')} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {randomPhrases.map((p) => (
            <PhraseCard key={p.id} phrase={p} lang={lang} compact />
          ))}
        </div>
        <Link to="/city/kyzylorda/phrases" className="btn-ghost mt-6">
          {t('homePhrases.view_all')}
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </section>

      {/* ================= 4. ЖИ-ГИД ҚАЛАЙ ЖҰМЫС ІСТЕЙДІ ================= */}
      <section className="container-page mt-16 sm:mt-24">
        <SectionHeading title={t('home.how_title')} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {HOW_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <article key={i} className="card group relative overflow-hidden p-6">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-1 -top-4 select-none font-display text-7xl font-bold leading-none text-teal-600/[0.08]"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-600 transition-colors duration-300 group-hover:bg-teal-600 group-hover:text-white">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-navy-800">{t(step.titleKey)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-500">{t(step.textKey)}</p>
              </article>
            );
          })}
        </div>
        <div className="mt-6">
          <Link to="/guide" className="btn-primary">
            <Sparkles size={16} aria-hidden="true" />
            {t('hero.cta_guide')}
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <OrnamentDivider className="container-page mt-16" />
    </div>
  );
}
