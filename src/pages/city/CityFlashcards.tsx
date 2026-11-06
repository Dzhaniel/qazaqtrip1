import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, FlipHorizontal2, RotateCcw, Volume2, VolumeX, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getCity } from '../../data/cities';
import type { Lang } from '../../data/types';
import { cn } from '../../lib/utils';
import { speakKazakh, stopSpeech } from '../../lib/speech';
import { loadLeitner, answerLeitner, loadRouteDeck } from '../../lib/learnStore';
import PageHero from '../../components/PageHero';
import CitySubNav from '../../components/CitySubNav';
import NotFoundPage from '../NotFoundPage';
import { OrnamentDivider } from '../../components/Ornament';
import { Unlock } from 'lucide-react';

interface FlashCard {
  id: string;
  kk: string;
  translit: string;
  en: string;
  ru: string;
  ko?: string;
  topic?: string;
}

type Deck = 'all' | 'route' | string; // 'all' | 'route' | topic

const TOPIC_IDS = ['greetings', 'numbers', 'directions', 'food', 'transport', 'hotel', 'shopping', 'museum', 'emergency'];

export default function CityFlashcards() {
  const { t, i18n } = useTranslation();
  const { cityId } = useParams();
  const lang = i18n.resolvedLanguage as Lang;
  const city = getCity(cityId ?? 'kyzylorda');

  const [deck, setDeck] = useState<Deck>('all');
  const [order, setOrder] = useState<FlashCard[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);
  const [finished, setFinished] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const routeDeck = useMemo(() => {
    return loadRouteDeck().map((p) => ({ id: p.id, kk: p.kk, translit: p.translit, en: p.meaning, ru: p.meaning }));
  }, []);

  // Алғашқы рендерде 'all' deck автоматтық басталады
  useEffect(() => {
    if (city && order.length === 0 && !finished) {
      startDeck(deck === 'route' ? routeDeck : cardsFor(deck));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cards: FlashCard[] = useMemo(() => {
    if (!city) return [];
    if (deck === 'route') return routeDeck;
    if (deck === 'all') {
      return city.kazakh_phrases.map((p) => ({ id: p.id, kk: p.kk, translit: p.translit, en: p.en, ru: p.ru, ko: p.ko, topic: p.topic }));
    }
    return city.kazakh_phrases
      .filter((p) => p.topic === deck)
      .map((p) => ({ id: p.id, kk: p.kk, translit: p.translit, en: p.en, ru: p.ru, ko: p.ko, topic: p.topic }));
  }, [city, deck, routeDeck]);

  // Leitner: box 1 — алдымен (жиі), содан 2, 3
  const startDeck = (list: FlashCard[]) => {
    const st = loadLeitner();
    const sorted = [...list].sort((a, b) => (st[a.id]?.box ?? 1) - (st[b.id]?.box ?? 1));
    setOrder(sorted);
    setIdx(0);
    setFlipped(false);
    setDone(0);
    setFinished(false);
  };

  if (!city) return <NotFoundPage />;

  const card = order[idx];
  const total = order.length;

  const pickDeck = (d: Deck) => {
    setDeck(d);
    startDeck(d === 'route' ? routeDeck : cardsFor(d));
  };

  function cardsFor(d: Deck): FlashCard[] {
    if (d === 'all') return city!.kazakh_phrases.map((p) => ({ id: p.id, kk: p.kk, translit: p.translit, en: p.en, ru: p.ru, ko: p.ko, topic: p.topic }));
    if (d === 'route') return routeDeck;
    return city!.kazakh_phrases.filter((p) => p.topic === d).map((p) => ({ id: p.id, kk: p.kk, translit: p.translit, en: p.en, ru: p.ru, ko: p.ko, topic: p.topic }));
  }

  function answer(knows: boolean) {
    if (!card) return;
    answerLeitner(card.id, knows);
    const nextIdx = idx + 1;
    if (nextIdx >= total) {
      setFinished(true);
    } else {
      setIdx(nextIdx);
      setFlipped(false);
    }
    setDone((d) => d + 1);
  }

  async function play() {
    if (!card) return;
    if (speaking) {
      stopSpeech();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    await speakKazakh(card.kk, { audioSrc: `/audio/${card.id}.mp3` });
    setSpeaking(false);
  }

  const meaning2 =
    lang === 'kk'
      ? [card?.en, card?.ru]
      : lang === 'ko'
        ? [card?.ko ?? card?.en, card?.en]
        : lang === 'en'
          ? [card?.ru]
          : [card?.en];

  return (
    <div>
      <PageHero
        city={city}
        lang={lang}
        crumb={t('city.sections.learn')}
        title={t('learn.flashcards_title')}
        subtitle={t('learn.flashcards_subtitle')}
        Icon={FlipHorizontal2}
      />
      <CitySubNav city={city} />

      <section className="container-page py-10 sm:py-12">
        {/* Deck таңдау */}
        <div className="flex flex-wrap gap-2" role="group" aria-label={t('learn.deck_label')}>
          <button type="button" onClick={() => pickDeck('all')} aria-pressed={deck === 'all'} className={cn('rounded-full border px-4 py-2 text-xs font-bold transition-colors', deck === 'all' ? 'border-teal-600 bg-teal-600 text-white' : 'border-navy-200 bg-white text-navy-500 hover:border-teal-400')}>
            {t('learn.deck_all')}
          </button>
          {routeDeck.length > 0 && (
            <button type="button" onClick={() => pickDeck('route')} aria-pressed={deck === 'route'} className={cn('inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition-colors', deck === 'route' ? 'border-gold-400 bg-gold-100 text-gold-700' : 'border-navy-200 bg-white text-navy-500 hover:border-gold-400')}>
              <Unlock size={13} aria-hidden="true" />
              {t('learn.deck_route')} ({routeDeck.length})
            </button>
          )}
          {TOPIC_IDS.map((tp) => (
            <button key={tp} type="button" onClick={() => pickDeck(tp)} aria-pressed={deck === tp} className={cn('rounded-full border px-4 py-2 text-xs font-bold transition-colors', deck === tp ? 'border-teal-600 bg-teal-600 text-white' : 'border-navy-200 bg-white text-navy-500 hover:border-teal-400')}>
              {t(`city.phrases.topic_${tp}`)}
            </button>
          ))}
        </div>

        {/* Прогресс */}
        {!finished && total > 0 && (
          <div className="mt-6 flex items-center gap-3">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-navy-100" role="progressbar" aria-valuenow={idx} aria-valuemin={0} aria-valuemax={total}>
              <div className="h-full rounded-full bg-teal-600 transition-all duration-300" style={{ width: `${(idx / total) * 100}%` }} />
            </div>
            <span className="text-xs font-bold text-navy-500">
              {idx + 1} / {total}
            </span>
          </div>
        )}

        {finished ? (
          <div className="card mt-6 flex flex-col items-center gap-4 p-10 text-center">
            <p className="font-display text-4xl font-bold text-teal-700">
              {done} / {total}
            </p>
            <p className="text-sm text-navy-500">{t('learn.session_done')}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" className="btn-primary" onClick={() => startDeck(cards)}>
                <RotateCcw size={15} aria-hidden="true" />
                {t('learn.again')}
              </button>
              <Link to={`/city/${city.city.id}/learn`} className="btn-ghost">
                <ArrowLeft size={15} aria-hidden="true" />
                {t('learn.back_hub')}
              </Link>
            </div>
          </div>
        ) : card ? (
          <div className="mt-6 flex flex-col items-center">
            {/* Flip card */}
            <button
              type="button"
              onClick={() => setFlipped((v) => !v)}
              className="flip-card w-full max-w-md cursor-pointer border-0 bg-transparent p-0"
              aria-label={t('learn.flip')}
            >
              <div className={cn('flip-inner relative h-72 w-full', flipped && 'flipped')}>
                <div className="flip-face card flex flex-col items-center justify-center gap-4 p-8">
                  <p className="text-center font-display text-3xl font-bold leading-tight text-navy-800 sm:text-4xl">{card.kk}</p>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      void play();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.stopPropagation();
                        void play();
                      }
                    }}
                    aria-label={t('city.phrases.listen')}
                    className={cn('grid h-12 w-12 place-items-center rounded-full border transition-colors', speaking ? 'animate-pulse-soft border-teal-600 bg-teal-600 text-white' : 'border-navy-200 bg-white text-teal-700 hover:bg-teal-600 hover:text-white')}
                  >
                    {speaking ? <VolumeX size={18} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}
                  </span>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-navy-300">{t('learn.tap_flip')}</p>
                </div>
                <div className="flip-face flip-back card flex flex-col items-center justify-center gap-3 p-8">
                  <p className="text-center text-lg font-bold text-teal-800">{meaning2[0]}</p>
                  {meaning2[1] && <p className="text-center text-sm text-navy-400">{meaning2[1]}</p>}
                  <p className="text-sm italic text-navy-400">{card.translit}</p>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-navy-300">
                    {t('learn.box')}: {loadLeitner()[card.id]?.box ?? 1} / 3
                  </p>
                </div>
              </div>
            </button>

            {/* Жауап батырмалары */}
            <div className="mt-6 flex w-full max-w-md flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => answer(false)} className="btn flex-1 items-center justify-center gap-2 border-2 border-red-300 bg-white px-5 py-3 text-sm font-bold text-red-600 transition-colors hover:bg-red-50">
                <X size={16} aria-hidden="true" />
                {t('learn.dont_know')}
              </button>
              <button type="button" onClick={() => answer(true)} className="btn flex-1 items-center justify-center gap-2 border-2 border-teal-600 bg-teal-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-teal-700">
                <Check size={16} aria-hidden="true" />
                {t('learn.know')}
              </button>
            </div>
            <p className="mt-3 max-w-md text-center text-[11px] leading-snug text-navy-400">{t('learn.leitner_hint')}</p>
          </div>
        ) : (
          <p className="card mt-6 p-8 text-center text-sm text-navy-400">{t('learn.empty_deck')}</p>
        )}
      </section>

      <OrnamentDivider className="container-page mb-4" />
    </div>
  );
}
