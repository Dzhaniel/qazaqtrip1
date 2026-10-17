import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { Lang } from '../data/types';
import kk from './kk.json';
import en from './en.json';
import ru from './ru.json';

export const LANGS: Lang[] = ['kk', 'en', 'ru'];

const STORAGE_KEY = 'qazaqtrip-lang';

function detectInitialLang(): Lang {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (LANGS as string[]).includes(stored)) return stored as Lang;
  }
  return 'kk'; // основной язык приложения — казахский
}

const initialLang = detectInitialLang();

i18n.use(initReactI18next).init({
  resources: {
    kk: { translation: kk },
    en: { translation: en },
    ru: { translation: ru },
  },
  lng: initialLang,
  fallbackLng: 'kk',
  supportedLngs: LANGS,
  interpolation: { escapeValue: false },
  returnNull: false,
});

document.documentElement.lang = initialLang;

export function setAppLanguage(lang: Lang): void {
  localStorage.setItem(STORAGE_KEY, lang);
  document.documentElement.lang = lang;
  void i18n.changeLanguage(lang);
}

export default i18n;
