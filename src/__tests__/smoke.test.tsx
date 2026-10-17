/**
 * Смоук-тесты: каждая страница рендерится в jsdom (client rendering)
 * и показывает ключевой контент на казахском (по умолчанию).
 * npm test
 */
import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '../i18n';
import { getCity } from '../data/cities';
import HomePage from '../pages/HomePage';
import CityPage from '../pages/CityPage';
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
          <Route path="/city/:cityId" element={<CityPage />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </MemoryRouter>,
    );
  });
  // ждём скелетоны / эффекты
  await act(async () => {
    await new Promise((r) => setTimeout(r, waitMs));
  });
  return container!.innerHTML;
}

describe('страницы рендерятся (по умолчанию — казахский)', () => {
  it('Главная: заголовок, города, «Жақында», «Неге Қазақстан?»', async () => {
    const html = await renderClient('/', 100);
    expect(html).toContain('Қазақстанды ашыңыз');
    expect(html).toContain('Қызылорда');
    expect(html).toContain('Жақында');
    expect(html).toContain('Неге Қазақстан?');
    expect(html).toContain('Астана');
    expect(html).toContain('Алматы');
    expect(html).toContain('Түркістан');
    expect(html).toContain('Шымкент');
    expect(html).toContain('Ақтау');
    expect(html).toContain('Қазақша үйреніп көріңіз');
  });

  it('Город: секции, сущности из JSON, правила null/verified', async () => {
    const html = await renderClient('/city/kyzylorda');
    // sticky-навигация
    expect(html).toContain('Көрікті жерлер');
    expect(html).toContain('Қонақүйлер');
    expect(html).toContain('Карта');
    expect(html).toContain('Қазақша сөздер');
    expect(html).toContain('ЖИ-гид');
    // контент из kyzylorda.json
    expect(html).toContain('Қорқыт ата');
    expect(html).toContain('Сырдария');
    expect(html).toContain('Қызылорда облыстық тарихи-өлкетану мұражайы');
    // правила данных: null -> «нақтыланбаған»
    expect(html).toContain('Баға нақтыланбаған');
    // verified:false -> «деректі тексеріңіз»
    expect(html).toContain('деректі тексеріңіз');
    // day trips
    expect(html).toContain('Қаладан тыс');
    // Байқоңыр: рұқсат-предупреждение + RUB без конвертации
    expect(html).toContain('Рұқсат қажет!');
    expect(html).toContain('400 ₽');
    expect(html).toContain('7 000 ₽');
    // фразы
    expect(html).toContain('Сәлеметсіз бе!');
    expect(html).toContain('Sälemetsiz be!');
    // getting there
    expect(html).toContain('Қорқыт ата әуежайы');
    // карта сгенерирована (leaflet)
    expect(container!.querySelector('.leaflet-container')).toBeTruthy();
  }, 20000);

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
