import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { BookOpen, Volume2, VolumeX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getCity } from '../../data/cities';
import type { Lang } from '../../data/types';
import { L, cn } from '../../lib/utils';
import { speakKazakh, stopSpeech } from '../../lib/speech';
import { ALPHABET } from '../../lib/alphabet';
import PageHero from '../../components/PageHero';
import CitySubNav from '../../components/CitySubNav';
import NotFoundPage from '../NotFoundPage';
import { OrnamentDivider } from '../../components/Ornament';

export default function CityAlphabet() {
  const { t, i18n } = useTranslation();
  const { cityId } = useParams();
  const lang = i18n.resolvedLanguage as Lang;
  const city = getCity(cityId ?? 'kyzylorda');
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  if (!city) return <NotFoundPage />;

  async function play(kk: string, id: string) {
    if (speakingId === id) {
      stopSpeech();
      setSpeakingId(null);
      return;
    }
    setSpeakingId(id);
    await speakKazakh(kk);
    setSpeakingId(null);
  }

  return (
    <div>
      <PageHero
        city={city}
        lang={lang}
        crumb={t('city.sections.learn')}
        title={t('learn.alphabet_title')}
        subtitle={t('learn.alphabet_subtitle')}
        Icon={BookOpen}
      />
      <CitySubNav city={city} />

      <section className="container-page py-10 sm:py-12">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ALPHABET.map((lt) => (
            <article key={lt.letter} className="card flex flex-col p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
              <div className="flex items-start justify-between gap-3">
                <p className="font-display text-5xl font-bold leading-none text-navy-800">{lt.letter}</p>
                <span className="rounded-full bg-teal-50 px-2.5 py-1 font-mono text-xs font-bold text-teal-700">→ {lt.latin}</span>
              </div>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-navy-500">{lang === 'ru' ? lt.hintRu : lt.hintEn}</p>
              <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-cream-50 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-bold text-navy-800">{lt.example.kk}</p>
                  <p className="truncate text-xs text-navy-400">
                    {lt.example.translit} · {L(lt.example.meaning, lang)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void play(lt.example.kk, lt.letter)}
                  aria-label={t('city.phrases.listen')}
                  className={cn(
                    'grid h-11 w-11 shrink-0 place-items-center rounded-full border transition-colors',
                    speakingId === lt.letter
                      ? 'animate-pulse-soft border-teal-600 bg-teal-600 text-white'
                      : 'border-navy-200 bg-white text-teal-700 hover:bg-teal-600 hover:text-white',
                  )}
                >
                  {speakingId === lt.letter ? <VolumeX size={17} aria-hidden="true" /> : <Volume2 size={17} aria-hidden="true" />}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <OrnamentDivider className="container-page mb-4" />
    </div>
  );
}
