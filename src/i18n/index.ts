import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { Lang } from '../data/types';
import kk from './kk.json';
import en from './en.json';
import ru from './ru.json';
import ko from './ko.json';

export const LANGS: Lang[] = ['kk', 'en', 'ru', 'ko'];

const STORAGE_KEY = 'qazaqtrip-lang';

function detectInitialLang(): Lang {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && (LANGS as string[]).includes(stored)) return stored as Lang;
    }
  } catch {
    /* private mode — default */
  }
  return 'kk'; // основной язык приложения — казахский
}

const initialLang = detectInitialLang();

i18n.use(initReactI18next).init({
  resources: {
    kk: { translation: kk },
    en: { translation: en },
    ru: { translation: ru },
    ko: { translation: ko },
  },
  lng: initialLang,
  // ko-да жоқ кілт — en-нан алынады (кажық key болмауы мүмкін емес, crash жоқ)
  fallbackLng: { ko: ['en'], default: ['kk'] },
  supportedLngs: LANGS,
  interpolation: { escapeValue: false },
  returnNull: false,
});

document.documentElement.lang = initialLang;

export function setAppLanguage(lang: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* private mode — in-memory only */
  }
  document.documentElement.lang = lang;
  void i18n.changeLanguage(lang);
}

export default i18n;
