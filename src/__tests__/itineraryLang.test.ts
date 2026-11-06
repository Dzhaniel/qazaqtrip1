/**
 * Тіл тесттері (brief 2026-11-06): бірдей маршрут kk/en/ru/ko-да —
 *  орындар (place_id) мен бағалар бірдей, мәтін тілі әртүрлі,
 *  қазақ фразалары әрқашан кириллицада, корей атаулары «ко (қазақ)».
 */
import { describe, it, expect } from 'vitest';
import { getCity } from '../data/cities';
import type { Lang } from '../data/types';
import {
  buildDemoItinerary,
  type GuideForm,
  type Itinerary,
} from '../lib/demoItinerary';
import { localizeItinerary } from '../lib/itineraryLocalize';
import { extractAiTexts, applyAiTexts } from '../lib/useItineraryLang';
import { resolveLang } from '../../server/guide-core';

const data = getCity('kyzylorda');
expect(data, 'city data').toBeTruthy();
const city = data!;

const CYRILLIC = /[\u0400-\u04FF]/;
const HANGUL = /[\uAC00-\uD7A3]/;

function makeForm(lang: Lang): GuideForm {
  return {
    arrival: '2026-11-18',
    departure: '2026-11-20',
    travelers: 2,
    budgetLevel: 'medium',
    interests: ['history', 'nature'],
    language: lang,
  };
}

function buildLocalized(lang: Lang): Itinerary {
  const demo = buildDemoItinerary(city, makeForm(lang));
  return localizeItinerary(demo.itinerary, city, lang);
}

function placeIds(it: Itinerary): string[] {
  const ids: string[] = [];
  for (const d of it.days) for (const item of d.items) if (item.placeId) ids.push(item.placeId);
  return ids;
}

function budgetSig(it: Itinerary): string {
  return it.budget
    .map((b) => `${b.kind}:${b.known ? b.kzt ?? b.rub : 'x'}`)
    .sort()
    .join('|');
}

describe('resolveLang (server whitelist)', () => {
  it('kk/en/ru/ko — өтеді; tr/basqa/undefined — kk', () => {
    expect(resolveLang('kk')).toBe('kk');
    expect(resolveLang('en')).toBe('en');
    expect(resolveLang('ru')).toBe('ru');
    expect(resolveLang('ko')).toBe('ko');
    expect(resolveLang('tr')).toBe('kk');
    expect(resolveLang('xx')).toBe('kk');
    expect(resolveLang(undefined)).toBe('kk');
    expect(resolveLang(42)).toBe('kk');
  });
});

describe('AI-маршрут тіл бойынша локализация', () => {
  it('бірдей form → 4 тілде де орындар (place_id) мен бағалар ТОЛЫҚ бірдей', () => {
    const kk = buildLocalized('kk');
    const en = buildLocalized('en');
    const ru = buildLocalized('ru');
    const ko = buildLocalized('ko');

    // Күндер саны және орындар реті бірдей
    expect(kk.days.length).toBeGreaterThan(0);
    expect(en.days.map((d) => d.items.length)).toEqual(kk.days.map((d) => d.items.length));
    expect(ru.days.map((d) => d.items.length)).toEqual(kk.days.map((d) => d.items.length));
    expect(ko.days.map((d) => d.items.length)).toEqual(kk.days.map((d) => d.items.length));

    // place_id реті бірдей (деректерден, AI емес)
    const ref = placeIds(kk);
    expect(ref.length).toBeGreaterThan(0);
    expect(placeIds(en)).toEqual(ref);
    expect(placeIds(ru)).toEqual(ref);
    expect(placeIds(ko)).toEqual(ref);

    // Баға қорытындысы бірдей
    const refBudget = budgetSig(kk);
    expect(budgetSig(en)).toBe(refBudget);
    expect(budgetSig(ru)).toBe(refBudget);
    expect(budgetSig(ko)).toBe(refBudget);
  });

  it('мәтін тілі әртүрлі (kk кириллица / en латын / ko hangul) — атаулардан көрінеді', () => {
    const kk = buildLocalized('kk');
    const en = buildLocalized('en');
    const ko = buildLocalized('ko');
    const anyName = (it: Itinerary) => it.days[0].items.find((i) => i.name)?.name ?? '';
    expect(anyName(kk)).toMatch(CYRILLIC);
    expect(anyName(en)).not.toMatch(CYRILLIC);
    expect(anyName(ko)).toMatch(HANGUL);
    // Тілдер бір-бірінен айырмалы
    expect(anyName(en)).not.toBe(anyName(kk));
  });

  it('каждое место имеет корейское + казахское имя в ko-режиме', () => {
    const ko = buildLocalized('ko');
    const withPlace = ko.days.flatMap((d) => d.items).filter((i) => i.placeId);
    expect(withPlace.length).toBeGreaterThan(0);
    for (const item of withPlace) {
      expect(item.name).toMatch(HANGUL);
      expect(item.name).toMatch(CYRILLIC); // «ко (қазақша)»
      expect(item.name).toContain('(');
    }
  });

  it('қазақ фразалары ӘР ТІЛДЕ кириллицада қалады (translation — UI тілінде)', () => {
    for (const lang of ['kk', 'en', 'ru', 'ko'] as Lang[]) {
      const it = buildLocalized(lang);
      const all = [
        ...it.phrases,
        ...it.days.flatMap((d) => d.items.flatMap((i) => i.phrases ?? [])),
      ];
      expect(all.length, `phrases for ${lang}`).toBeGreaterThan(0);
      for (const p of all) {
        expect(p.kk).toMatch(CYRILLIC); // қазақша мәтін өзгермейді
        expect(p.kk).not.toMatch(HANGUL);
        if (p.meaning) expect(p.meaning.length).toBeGreaterThan(0);
      }
      // ko-да мағына hangul-мен
      if (lang === 'ko') {
        const withMeaning = all.filter((p) => p.meaning);
        expect(withMeaning.length).toBeGreaterThan(0);
        expect(withMeaning.some((p) => p.meaning.match(HANGUL))).toBe(true);
      }
    }
  });

  it('Байқоңыр: RUB бағасы аударылмайды (KZT-ға) және warning бар', () => {
    const form: GuideForm = {
      arrival: '2026-11-18',
      departure: '2026-11-21',
      travelers: 4,
      budgetLevel: 'high',
      interests: ['history', 'space'],
      language: 'kk',
    };
    const it = localizeItinerary(buildDemoItinerary(city, form).itinerary, city, 'kk');
    const b = it.budget.find((x) => x.rub != null);
    expect(b, 'RUB line for Baikonur').toBeTruthy();
    if (b) {
      expect(b.rub).toBeGreaterThan(0);
      expect(b.kzt ?? 0).toBe(0); // KZT-ға аударылмаған
    }
    const warning = it.days.flatMap((d) => d.items).find((i) => i.warning);
    expect(warning, 'Baikonur permit warning').toBeTruthy();
  });

  it('танымалсыз place_id жойылады (AI бұрып ойлаған орын)', () => {
    const base = buildLocalized('kk');
    const tampered: Itinerary = {
      ...base,
      days: base.days.map((d) => ({
        ...d,
        items: [
          ...d.items,
          { kind: 'attraction' as const, name: 'Invented Castle', placeId: 'invented-castle' },
        ],
      })),
    };
    const out = localizeItinerary(tampered, city, 'kk');
    expect(placeIds(out)).not.toContain('invented-castle');
    // Басқа орындар сақталады
    expect(placeIds(out)).toEqual(placeIds(base));
  });

  it('AI жазған атау емес — атау ДЕРЕКТЕРДЕН қайта алынады', () => {
    const base = buildLocalized('en');
    const first = base.days[0].items.find((i) => i.placeId)!;
    const attraction = city.attractions.find((a) => a.id === first.placeId)!;
    const tampered: Itinerary = {
      ...base,
      days: base.days.map((d) => ({
        ...d,
        items: d.items.map((i) =>
          i.placeId === first.placeId ? { ...i, name: 'WRONG NAME FROM AI' } : i,
        ),
      })),
    };
    const out = localizeItinerary(tampered, city, 'en');
    const restored = out.days[0].items.find((i) => i.placeId === first.placeId)!;
    expect(restored.name).not.toBe('WRONG NAME FROM AI');
    expect(restored.name).toBe(attraction.name.en); // data-дан
  });

  it('extractAiTexts/applyAiTexts: AI мәтіндерін аударып қолдану (index-бірлік)', () => {
    const it = buildLocalized('en');
    const texts = extractAiTexts(it);
    expect(texts.dayTitles.length).toBe(it.days.length);
    expect(texts.budgetLabels.length).toBe(it.budget.length);
    // «Аударма» — орнына қойылғанда index бойынша түседі
    const applied = applyAiTexts(it, {
      ...texts,
      summary: 'Translated summary',
      dayTitles: texts.dayTitles.map((_, i) => `Day ${i + 1} (ko)`),
    });
    expect(applied.summary).toBe('Translated summary');
    expect(applied.days[0].title).toBe('Day 1 (ko)');
    // Дерек-өрістер (placeId, name) өзгермейді
    expect(placeIds(applied)).toEqual(placeIds(it));
    expect(applied.days[0].items[0].name).toBe(it.days[0].items[0].name);
  });

  it('3 demo-маршрут (preset) 4 тілде де валид', () => {
    const presets: Array<Partial<GuideForm>> = [
      { arrival: '2026-11-18', departure: '2026-11-19', travelers: 1, budgetLevel: 'economy', interests: ['history'] },
      { arrival: '2026-11-18', departure: '2026-11-20', travelers: 2, budgetLevel: 'medium', interests: ['history', 'nature'] },
      { arrival: '2026-11-18', departure: '2026-11-21', travelers: 4, budgetLevel: 'high', interests: ['history', 'space'] },
    ];
    for (const p of presets) {
      for (const lang of ['kk', 'en', 'ru', 'ko'] as Lang[]) {
        const demo = buildDemoItinerary(city, { language: lang, ...p } as GuideForm);
        const it = localizeItinerary(demo.itinerary, city, lang);
        expect(it.days.length, `preset ${JSON.stringify(p.interests)} ${lang}`).toBeGreaterThan(0);
        expect(it.days.every((d) => d.items.length > 0)).toBe(true);
        // Ешқандай undefined/бос атау
        for (const d of it.days) for (const i of d.items) expect(i.name.length).toBeGreaterThan(0);
      }
    }
  });

  it('localizeItinerary бос/бұзылған input-қа throw-ламайды, fallback қайтарады', () => {
    expect(localizeItinerary(null, city, 'kk').days).toEqual([]);
    expect(localizeItinerary(undefined, city, 'en').days).toEqual([]);
    const broken = localizeItinerary({ days: 'x', budget: null, notes: 5, unknownPrices: {}, phrases: undefined } as unknown as Itinerary, city, 'ru');
    expect(broken.days).toEqual([]);
    expect(broken.notes).toEqual([]);
    expect(broken.unknownPrices).toEqual([]);
    expect(broken.phrases).toEqual([]);
  });
});
