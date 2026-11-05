import type { L10n } from '../data/types';

/**
 * Қазақ әліпбиі (A5): шетелдіктерге қиын 9 әріп.
 * review: тіл иелі адам тексергенше reviewed: false.
 */

export interface AlphabetLetter {
  letter: string; // үлкен + кіші
  /** 2021 латын баламасы (ақпарат ретінде) */
  latin: string;
  /** Шамадағы дыбыс — English hint */
  hintEn: string;
  /** Шамадағы дыбыс — Russian hint */
  hintRu: string;
  /** Мысал сөз */
  example: { kk: string; translit: string; meaning: L10n };
  reviewed: boolean;
}

export const ALPHABET: AlphabetLetter[] = [
  {
    letter: 'Ә ә',
    latin: 'ä',
    hintEn: 'Like the "a" in "father" — open and relaxed.',
    hintRu: 'Как "а" в слове "отец" — открытый, расслабленный.',
    example: { kk: 'әке', translit: 'äke', meaning: { kk: 'ата-ана', en: 'father', ru: 'отец' } },
    reviewed: false,
  },
  {
    letter: 'Ғ ғ',
    latin: 'ğ',
    hintEn: 'A soft "g" with a breath, like "h" in "huge".',
    hintRu: 'Мягкий "г" с придыханием, близкий к "х".',
    example: { kk: 'ғажап', translit: 'ğajap', meaning: { kk: 'таңғаларлық', en: 'wonderful', ru: 'прекрасный, удивительный' } },
    reviewed: false,
  },
  {
    letter: 'Қ қ',
    latin: 'q',
    hintEn: 'A deep, hard "k", as at the end of "back".',
    hintRu: 'Глубокий, твёрдый "к", как в конце английского "back".',
    example: { kk: 'қала', translit: 'qala', meaning: { kk: 'қала', en: 'city', ru: 'город' } },
    reviewed: false,
  },
  {
    letter: 'Ң ң',
    latin: 'ń',
    hintEn: 'Like the "ng" in "sing".',
    hintRu: 'Как "нг" в английском "sing".',
    example: { kk: 'аң', translit: 'ań', meaning: { kk: 'жұрт', en: 'beast, animal', ru: 'зверь, дикое животное' } },
    reviewed: false,
  },
  {
    letter: 'Ө ө',
    latin: 'ö',
    hintEn: 'Like "o" in French "moi" — round your lips and say "e".',
    hintRu: 'Как "о" во французском "moi": губы округлены, звук "е".',
    example: { kk: 'өсу', translit: 'ösu', meaning: { kk: 'өсу', en: 'to grow', ru: 'расти' } },
    reviewed: false,
  },
  {
    letter: 'Ұ ұ',
    latin: 'u',
    hintEn: 'A short "u", like in "put".',
    hintRu: 'Короткий "у", как в английском "put".',
    example: { kk: 'ұя', translit: 'uja', meaning: { kk: 'ұя', en: 'nest', ru: 'гнездо' } },
    reviewed: false,
  },
  {
    letter: 'Ү ү',
    latin: 'ü',
    hintEn: 'Like "u" in French "lune".',
    hintRu: 'Как "ю" во французском "lune".',
    example: { kk: 'үй', translit: 'üj', meaning: { kk: 'үй', en: 'house, home', ru: 'дом' } },
    reviewed: false,
  },
  {
    letter: 'І і',
    latin: 'i',
    hintEn: 'A soft "i", like in "polite" — do not glide into "y".',
    hintRu: 'Мягкий "и", как в конце английского "polite" — без перехода в "й".',
    example: { kk: 'іс', translit: 'ıs', meaning: { kk: 'іс', en: 'work, affair', ru: 'дело, работа' } },
    reviewed: false,
  },
  {
    letter: 'Һ һ',
    latin: 'h',
    hintEn: 'Like "h" in "house" — a breath of air.',
    hintRu: 'Как "h" в английском "house" — придыхание.',
    example: { kk: 'һал', translit: 'hâl', meaning: { kk: 'жағдай', en: 'state, condition', ru: 'состояние, положение' } },
    reviewed: false,
  },
];
