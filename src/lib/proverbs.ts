/**
 * «Күннің мақалы» — тек бұл 3 мақалдан күн бойынша айналады.
 * Басқа мақал қосу тек иелесуші рұқсатымен.
 */
export const PROVERBS: Array<{ kk: string; en: string; ru: string }> = [
  {
    kk: 'Жеті рет өлшеп, бір рет кес.',
    en: 'Measure seven times, cut once.',
    ru: 'Семь раз отмерь, один раз отрежь.',
  },
  {
    kk: 'Еңбек түбі – береке.',
    en: 'Hard work ends in abundance.',
    ru: 'В труде — изобилие.',
  },
  {
    kk: 'Бірлік бар жерде тірлік бар.',
    en: 'Where there is unity, there is prosperity.',
    ru: 'Где единство — там и благополучие.',
  },
];

/** Бүгінгі мақал (жыл ішіндегі күн бойынша тұрақты). */
export function proverbOfTheDay(): (typeof PROVERBS)[number] {
  const start = new Date(new Date().getFullYear(), 0, 0).getTime();
  const day = Math.floor((Date.now() - start) / 86400000);
  return PROVERBS[day % PROVERBS.length];
}
