/** Локализованный текст (контент из JSON-файла города). */
export interface L10n {
  kk: string;
  en: string;
  ru: string;
}

export type Lang = 'kk' | 'en' | 'ru';

export interface Meta {
  schema_version: string;
  last_checked: string;
  currency: string;
  language_primary: string;
  sources: string[];
  disclaimer: L10n;
  data_rules: {
    null_means: string;
    coords_approx_true_means: string;
    duration_min_and_interests: string;
  };
}

export type GettingThereType = 'air' | 'train' | 'bus';

export interface GettingThere {
  type: GettingThereType;
  name: L10n;
  distance_to_center_km?: number | string | null;
  hours?: string | null;
  address?: string;
  note?: L10n;
  verified?: boolean;
}

export interface CityInfo {
  id: string;
  name: L10n;
  region: L10n;
  /** Опциональное фото (например, /images/city-kyzylorda.jpg). Отсутствует в данных — градиент-фолбэк. */
  image?: string;
  center: { lat: number; lng: number; approx?: boolean };
  description: L10n;
  getting_there: GettingThere[];
}

export type AttractionType = 'city' | 'day_trip';

export type AttractionCategory =
  | 'history'
  | 'monument'
  | 'nature'
  | 'theatre'
  | 'museum'
  | 'religious'
  | 'market'
  | 'park'
  | 'space';

export interface Ticket {
  /** Цена взрослого билета в KZT. null = не указано, 0 = бесплатно (по данным). */
  adult_kzt?: number | null;
  student_kzt?: number | null;
  child_kzt?: number | null;
  /** Для Байконура цены в RUB — конвертировать нельзя. */
  currency?: 'KZT' | 'RUB';
  museum_audio_guide_rub?: number;
  cosmodrome_group_tour_rub?: number;
  note?: string;
  verified?: boolean;
}

export interface Permit {
  required: boolean;
  kk: string;
  en: string;
  ru: string;
  official_museum_site?: string;
  recommendation?: string;
  verified?: boolean;
}

export interface Attraction {
  id: string;
  type: AttractionType;
  category: AttractionCategory;
  name: L10n;
  short: L10n;
  /** Опциональное фото (например, /images/theater.jpg). Отсутствует в данных — градиент-фолбэк. */
  image?: string;
  address: string;
  map_query: string;
  lat: number | null;
  lng: number | null;
  coords_approx: boolean;
  distance_from_center_km?: string | number | null;
  travel_note?: L10n;
  hours: string | L10n | null;
  ticket: Ticket;
  visit_min: number;
  interests: string[];
  notes?: L10n;
  phone?: string | null;
  restricted?: boolean;
  permit?: Permit;
  warnings?: L10n;
  etiquette?: L10n;
  verified: boolean;
  source?: string;
}

export interface HotelRating {
  score: number;
  scale: number;
  reviews: number;
  source: string;
}

export interface Hotel {
  id: string;
  name: L10n;
  /** Опциональное фото. Отсутствует в данных — карточка без фото. */
  image?: string;
  stars: number | null;
  price_from_kzt: number | null;
  price_to_kzt: number | null;
  price_usd_from?: number | null;
  price_note?: string;
  rating: HotelRating | null;
  breakfast_included: boolean | null;
  address: string;
  district: L10n | null;
  map_query: string;
  lat: number | null;
  lng: number | null;
  coords_approx: boolean;
  phone?: string | null;
  verified: boolean;
  source?: string;
}

export interface LocalFood {
  note: string;
  items: L10n[];
  verified: boolean;
}

export interface KazakhPhrase {
  id: string;
  kk: string;
  translit: string;
  en: string;
  ru: string;
  context: string;
}

export interface InterestOption {
  id: string;
  kk: string;
  en: string;
  ru: string;
}

export interface CityData {
  meta: Meta;
  city: CityInfo;
  attractions: Attraction[];
  hotels: Hotel[];
  local_food: LocalFood;
  kazakh_phrases: KazakhPhrase[];
  interest_options: InterestOption[];
}
