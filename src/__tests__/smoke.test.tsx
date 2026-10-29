/**
 * Смоук-тесттер: әр бет jsdom-да рендерленеді (client rendering)
 * және негізгі контент қазақша (default) көрсетіледі.
 * npm test
 */
import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '../i18n';
import { getCity } from '../data/cities';
import HomePage from '../pages/HomePage';
import CityOverview from '../pages/city/CityOverview';
import CitySights from '../pages/city/CitySights';
import CityHotels from '../pages/city/CityHotels';
import CityMap from '../pages/city/CityMap';
import CityPhrases from '../pages/city/CityPhrases';
import GuidePage from '../pages/GuidePage';
import AboutPage from '../pages/AboutPage';
import NotFoundPage from '../pages/NotFoundPage';

let root: Root | null = null;
let container: HTMLDivElement | null = null;

beforeAll(() => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  if (root) {
    act(() => root!.unmount());
    root = null;
  }
  container?.remove();
  container = null;
});

async function renderClient(path: string, waitMs = 750): Promise<string> {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/city/:cityId" element={<CityOverview />} />
          <Route path="/city/:cityId/sights" element={<CitySights />} />
          <Route path="/city/:cityId/hotels" element={<CityHotels />} />
          <Route path="/city/:cityId/map" element={<CityMap />} />
          <Route path="/city/:cityId/phrases" element={<CityPhrases />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </MemoryRouter>,
    );
  });
  await act(async () => {
    await new Promise((r) => setTimeout(r, waitMs));
  });
  return container!.innerHTML;
}

describe('страницы рендерятся (по умолчанию — казахский)', () => {
  it('Главная: hero фото, planner, города, must-see, фразы, ЖИ-гид шаги', async () => {
    const html = await renderClient('/', 100);
    // title: соңғы сөз алтын градиенттік span-мен бөлініп тұрады
    expect(html).toContain('Қазақстанды');
    expect(html).toContain('ашыңыз');
    expect(html).toContain('Қызылорда');
    // floating planner — ЖИ-гидке кіреберіс
    expect(html).toContain('Жолыңызды жоспарлаңыз');
    expect(html).toContain('Маршрут құру');
    expect(html).toContain('Келу күні');
    expect(html).toContain('Кету күні');
    // Қалалар: белсенді + Жақында
    expect(html).toContain('Қазір');
    expect(html).toContain('Жақында');
    expect(html).toContain('Астана');
    expect(html).toContain('Алматы');
    expect(html).toContain('Түркістан');
    expect(html).toContain('Шымкент');
    expect(html).toContain('Ақтау');
    // Міндетті түрде көріңіз (горизонтальная лента)
    expect(html).toContain('Міндетті түрде көріңіз');
    expect(html).toContain('Қорқыт ата');
    // Фразы + ЖИ-гид қадамдары
    expect(html).toContain('Қазақша үйреніп көріңіз');
    expect(html).toContain('ЖИ-гид қалай жұмыс істейді');
    expect(html).toContain('Дайын маршрут');
    // фото hero жүктеледі
    expect(html).toContain('/images/hero.jpg');
  });

  it('Қала (overview): hero, бөлімдер, қалай жету', async () => {
    const html = await renderClient('/city/kyzylorda', 100);
    expect(html).toContain('Қызылорда');
    expect(html).toContain('Қаланың бөлімдері');
    // ссылки на все разделы
    expect(html).toContain('/city/kyzylorda/sights');
    expect(html).toContain('/city/kyzylorda/hotels');
    expect(html).toContain('/city/kyzylorda/map');
    expect(html).toContain('/city/kyzylorda/phrases');
    expect(html).toContain('/guide');
    // как добраться
    expect(html).toContain('Қорқыт ата әуежайы');
    expect(html).toContain('Қызылорда вокзалы');
    expect(html).toContain('Қызылорда автовокзалы');
    // CTA band
    expect(html).toContain('Жеке маршрут керек пе?');
  });

  it('Көрікті жерлер: сущности из JSON, правила null/verified/Baikonur', async () => {
    const html = await renderClient('/city/kyzylorda/sights');
    expect(html).toContain('Көрікті жерлер');
    expect(html).toContain('Қорқыт ата');
    expect(html).toContain('Сырдария');
    expect(html).toContain('Қызылорда облыстық тарихи-өлкетану мұражайы');
    // null -> «нақтыланбаған»
    expect(html).toContain('Баға нақтыланбаған');
    // verified:false -> «деректі тексеріңіз»
    expect(html).toContain('деректі тексеріңіз');
    // day trips — отдельный список
    expect(html).toContain('Қаладан тыс');
    // Байқоңыр: предупреждение о пропуске + RUB без конвертации
    expect(html).toContain('Рұқсат қажет!');
    expect(html).toContain('400 ₽');
    expect(html).toContain('7 000 ₽');
  }, 20000);

  it('Қонақүйлер: карточки, цены, завтрак', async () => {
    const html = await renderClient('/city/kyzylorda/hotels');
    expect(html).toContain('Қонақүйлер');
    expect(html).toContain('«Сырдария» қонақүйі');
    expect(html).toContain('12 000 ₸');
    expect(html).toContain('Баға нақтыланбаған'); // Meruert Hostel
    expect(html).toContain('Таңғы ас қоса');
    expect(html).toContain('деректі тексеріңіз');
  });

  it('Карта: Leaflet инициализируется', async () => {
    await renderClient('/city/kyzylorda/map');
    expect(container!.querySelector('.leaflet-container')).toBeTruthy();
    // пины созданы (attractions + hotels с координатами)
    expect(container!.querySelectorAll('.qt-marker').length).toBeGreaterThan(0);
  }, 20000);

  it('Сөздер: фразы + транслит + еда', async () => {
    const html = await renderClient('/city/kyzylorda/phrases', 200);
    expect(html).toContain('Қазақша сөздер');
    expect(html).toContain('Сәлеметсіз бе!');
    expect(html).toContain('Sälemetsiz be!');
    expect(html).toContain('Рақмет!');
    expect(html).toContain('Не татып көруге болады');
    expect(html).toContain('Бесбармақ');
  });

  it('Гид: форма, бюджет-уровни, интересы из данных', async () => {
    const html = await renderClient('/guide', 100);
    expect(html).toContain('ЖИ-гид');
    expect(html).toContain('Келу күні');
    expect(html).toContain('Кету күні');
    expect(html).toContain('үнемді');
    expect(html).toContain('орташа');
    expect(html).toContain('жоғары');
    expect(html).toContain('Маршрут құру');
    expect(html).toContain('Тарих');
    expect(html).toContain('Ғарыш');
  });

  it('About: цели, технологии, источники, last_checked', async () => {
    const html = await renderClient('/about', 100);
    expect(html).toContain('QazaqTrip туралы');
    expect(html).toContain('Мақсаты');
    expect(html).toContain('Технологиялар');
    expect(html).toContain('Дереккөздер');
    expect(html).toContain(getCity('kyzylorda')!.meta.last_checked);
    expect(html).toContain('welcome.kz');
  });

  it('404', async () => {
    const html = await renderClient('/no-such-page', 100);
    expect(html).toContain('404');
    expect(html).toContain('Бет табылмады');
  });
});
