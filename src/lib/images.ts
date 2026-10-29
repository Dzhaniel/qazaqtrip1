import type { Attraction, Hotel } from '../data/types';

/**
 * Дизайн-фото реестрі (public/images, Wikimedia Commons — CREDITS.md).
 * JSON-файл кейін `image` өзіні алатын болса, ол бұл картадан жоғары тұрады:
 * attractionImage() / hotelImage() алдымен JSON мәнін қайтарады.
 */
const ATTRACTION_IMAGES: Record<string, string> = {
  'regional-history-museum': '/images/museum.jpg',
  'central-square-drama-theatre': '/images/central-square.jpg',
  'first-president-park-embankment': '/images/syrdarya.jpg',
  'aitbay-mosque': '/images/aitbay-mosque.jpg',
  'korkyt-ata-memorial': '/images/korkyt-ata.jpg',
  baikonur: '/images/baikonur.jpg',
};

export const CITY_IMAGES: Record<string, string> = {
  kyzylorda: '/images/city-kyzylorda.jpg',
};

export const COMING_SOON_IMAGES: Record<string, string> = {
  astana: '/images/astana.jpg',
  almaty: '/images/almaty.jpg',
  turkistan: '/images/turkistan.jpg',
  shymkent: '/images/shymkent.jpg',
  aktau: '/images/aktau.jpg',
};

export const HERO_IMAGE = '/images/hero.jpg';

export function attractionImage(a: Attraction): string | undefined {
  return a.image ?? ATTRACTION_IMAGES[a.id];
}

/** Қонақүйлерге жергілікті фото әзірге жоқ — тек JSON image-і оқылмайды. */
export function hotelImage(h: Hotel): string | undefined {
  return h.image;
}

export function cityImage(id: string): string | undefined {
  return CITY_IMAGES[id];
}

export function comingSoonImage(id: string): string | undefined {
  return COMING_SOON_IMAGES[id];
}
