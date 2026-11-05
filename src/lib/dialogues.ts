import type { L10n } from '../data/types';

/**
 * Жағдаяттық диалогтар (A4).
 * Ескерту: reviewed: false — қазақша мәтінді тіл иелі адаммен тексеру керек.
 * Tourist жолында 3 нұсқа (1 дұрыс) — пайдаланушы дұрысын таңдайды.
 */

export interface DialogueLine {
  speaker: 'local' | 'tourist';
  /** local жолы — мәтін; tourist жолы — options + correct */
  text?: string;
  options?: string[];
  correct?: number; // options индексі
}

export interface Dialogue {
  id: string;
  title: L10n;
  place: L10n;
  lines: DialogueLine[];
  /** Тіл иелі адам тексергенше false */
  reviewed: boolean;
}

export const DIALOGUES: Dialogue[] = [
  {
    id: 'dialogue-restaurant',
    title: { kk: 'Мейрамханада', en: 'At the restaurant', ru: 'В ресторане' },
    place: { kk: 'Тамақтану', en: 'Food', ru: 'Еда' },
    reviewed: false,
    lines: [
      { speaker: 'local', text: 'Қош келдіңіз! Не алғыңыз келеді?' },
      {
        speaker: 'tourist',
        options: ['Мәзір беріңіз, өтінемін.', 'Қайда барасыз?', 'Сау болыңыз.'],
        correct: 0,
      },
      { speaker: 'local', text: 'Міне, мәзір.' },
      {
        speaker: 'tourist',
        options: [
          'Мына тағам қанша тұрады?',
          'Мен үйге барамын.',
          'Бүгін жауын бар.',
        ],
        correct: 0,
      },
      { speaker: 'local', text: 'Үш мың теңге.' },
      {
        speaker: 'tourist',
        options: [
          'Есеп беріңіз, өтінемін.',
          'Сәлеметсіз бе!',
          'Сағат қанша?',
        ],
        correct: 0,
      },
    ],
  },
  {
    id: 'dialogue-taxi',
    title: { kk: 'Таксиде', en: 'In a taxi', ru: 'В такси' },
    place: { kk: 'Көлік', en: 'Transport', ru: 'Транспорт' },
    reviewed: false,
    lines: [
      {
        speaker: 'tourist',
        options: [
          'Сәлеметсіз бе! Мені Бәйтерекке апарыңыз.',
          'Менің атым қалай?',
          'Ауа райы қалай?',
        ],
        correct: 0,
      },
      { speaker: 'local', text: 'Жақсы, отырыңыз.' },
      {
        speaker: 'tourist',
        options: ['Қанша тұрады?', 'Сіз қайдан келдіңіз?', 'Бүгін жексенбі ме?'],
        correct: 0,
      },
      { speaker: 'local', text: 'Екі мың теңге.' },
      {
        speaker: 'tourist',
        options: ['Рақмет!', 'Жоқ, рақмет, бармаймын.', 'Кім сизбен сөйлескісі келеді?'],
        correct: 0,
      },
    ],
  },
  {
    id: 'dialogue-museum',
    title: { kk: 'Музейде', en: 'At the museum', ru: 'В музее' },
    place: { kk: 'Мәдениет', en: 'Culture', ru: 'Культура' },
    reviewed: false,
    lines: [
      {
        speaker: 'tourist',
        options: [
          'Билет қанша тұрады?',
          'Мұражай қашан ашылды?',
          'Маған су беріңіз.',
        ],
        correct: 0,
      },
      { speaker: 'local', text: 'Бір мың бес жүз теңге.' },
      {
        speaker: 'tourist',
        options: [
          'Суретке түсіуге бола ма?',
          'Ерте шығып кетемін бе?',
          'Мұражайда мұра бар ма?',
        ],
        correct: 0,
      },
      { speaker: 'local', text: 'Иә, болады.' },
    ],
  },
];
