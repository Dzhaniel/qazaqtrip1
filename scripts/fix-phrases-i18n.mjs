// scripts/fix-phrases-i18n.mjs — «Қазақша сөздер» беті: typo, translit note, жаңа кілттер
import { readFileSync, writeFileSync } from 'node:fs';

const P = {
  kk: {
    topic_numbers: 'Сандар',
    translit_note: 'Оқылуын жеңілдету үшін латын транслитерациясы көрсетілген.',
    translit_about_title: 'Транслитерация туралы',
    translit_about:
      'Транслитерация қазақ әріптерін латын алфавитімен жазуды көрсетеді: ә→ä, ғ→ğ, қ→q, ң→ng, ө→ö, ұ→u, ү→ü, ы→y, і→i, ж→j, ш→sh, ч→ch, х→h. Бұл қысқаша нұсқа — нақты оқылу үшін 🔊 түймесін қолданыңыз.',
    easy_pron_label: 'Жеңіл оқылу',
    play_all: 'Барлығын тыңдау',
    play_stop: 'Тоқтату',
    kicker: 'Қазақстан',
  },
  en: {
    translit_note: 'Latin transliteration is shown to make reading easier.',
    translit_about_title: 'About the transliteration',
    translit_about:
      'Transliteration shows how Kazakh letters are written in Latin script: ә→ä, ғ→ğ, қ→q, ң→ng, ө→ö, ұ→u, ү→ü, ы→y, і→i, ж→j, ш→sh, ч→ch, х→h. This is a simplified version — use the 🔊 button for the exact pronunciation.',
    easy_pron_label: 'Easy pronunciation',
    play_all: 'Play all',
    play_stop: 'Stop',
    kicker: 'Kazakhstan',
  },
  ru: {
    translit_note: 'Латинская транслитерация приведена для облегчения чтения.',
    translit_about_title: 'О транслитерации',
    translit_about:
      'Транслитерация показывает, как казахские буквы пишутся латиницей: ә→ä, ғ→ğ, қ→q, ң→ng, ө→ö, ұ→u, ү→ü, ы→y, і→i, ж→j, ш→sh, ч→ch, х→h. Это упрощённый вариант — для точного произношения используйте кнопку 🔊.',
    easy_pron_label: 'Простое произношение',
    play_all: 'Слушать все',
    play_stop: 'Стоп',
    kicker: 'Казахстан',
  },
};

for (const [lang, entries] of Object.entries(P)) {
  const p = `src/i18n/${lang}.json`;
  const o = JSON.parse(readFileSync(p, 'utf8'));
  const sec = o.city.phrases;
  let changed = 0;
  for (const [k, v] of Object.entries(entries)) {
    if (sec[k] !== v) {
      sec[k] = v;
      changed++;
    }
  }
  writeFileSync(p, JSON.stringify(o, null, 2) + '\n', 'utf8');
  console.log(`${lang}: ${changed} изменено`);
}
