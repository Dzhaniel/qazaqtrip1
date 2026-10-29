import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';
import type { Attraction, Hotel, Lang } from '../data/types';
import {
  L as L10n,
  cn,
  formatKzt,
  formatRub,
  hotelPriceLabel,
  mapsUrl,
  ticketDisplay,
} from '../lib/utils';

export type MapTarget =
  | { kind: 'attraction'; id: string }
  | { kind: 'hotel'; id: string };

interface Props {
  center: [number, number];
  centerApprox?: boolean;
  attractions: Attraction[]; // только городские, с координатами
  hotels: Hotel[]; // только с координатами
  selected: MapTarget | null;
  onSelect: (t: MapTarget) => void;
  lang: Lang;
}

const TEAL = '#1BA3B8';
const GOLD = '#E0A526';

function pinIcon(color: string, approx: boolean): L.DivIcon {
  const dash = approx ? ' stroke-dasharray="4 3"' : '';
  return L.divIcon({
    className: 'qt-marker',
    html: `<svg viewBox="0 0 24 26" width="34" height="36" aria-hidden="true">
      <path d="M12 1.5C7.6 1.5 4.2 5 4.2 9.3c0 5.8 7.8 15.2 7.8 15.2s7.8-9.4 7.8-15.2C19.8 5 16.4 1.5 12 1.5z"
        fill="${color}" stroke="white" stroke-width="1.8"${dash}></path>
      <circle cx="12" cy="9.6" r="3" fill="white" opacity="0.95"></circle>
    </svg>`,
    iconSize: [34, 36],
    iconAnchor: [17, 35],
    popupAnchor: [0, -32],
  });
}

function attractionTicketLine(a: Attraction, t: (k: string) => string): string {
  const tk = a.ticket;
  const display = ticketDisplay(tk);
  if (display.kind === 'rub') {
    const parts: string[] = [];
    if (tk.museum_audio_guide_rub != null) parts.push(`${formatRub(tk.museum_audio_guide_rub)} ₽`);
    if (tk.cosmodrome_group_tour_rub != null) parts.push(`${formatRub(tk.cosmodrome_group_tour_rub)} ₽`);
    return parts.join(' · ') || t('common.price_unknown');
  }
  if (display.kind === 'free') return t('city.sights.free');
  if (display.kind === 'unknown') return t('common.price_unknown');
  return formatKzt(display.kzt ?? 0);
}

/**
 * Карта (Leaflet + OSM, без API-ключа) + синхронный список.
 * Көрікті орындар — teal, қонақүйлер — gold.
 * coords_approx === true -> пунктирная обводка + «шамамен» в попапе.
 */
export default function MapView({
  center,
  centerApprox,
  attractions,
  hotels,
  selected,
  onSelect,
  lang,
}: Props) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  const sights = useMemo(
    () => attractions.filter((a) => a.lat != null && a.lng != null),
    [attractions],
  );
  const hotelsWithCoords = useMemo(() => hotels.filter((h) => h.lat != null && h.lng != null), [hotels]);

  /* Создание карты и маркеров (пересоздаём при смене языка) */
  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current, {
      center,
      zoom: 14,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const markers = new Map<string, L.Marker>();

    for (const a of sights) {
      const pos: [number, number] = [a.lat!, a.lng!];
      const m = L.marker(pos, { icon: pinIcon(TEAL, a.coords_approx), title: L10n(a.name, lang) })
        .addTo(map)
        .on('click', () => onSelect({ kind: 'attraction', id: a.id }));
      m.bindPopup(
        `<div style="min-width:190px">
          <div style="font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#0E7C8F">${t(`city.sights.cat_${a.category}`)}</div>
          <div style="font-weight:800;font-size:14px;color:#0F2A3D;margin-top:2px">${L10n(a.name, lang)}</div>
          <div style="font-size:12px;color:#4E7389;margin-top:3px">${attractionTicketLine(a, t)}</div>
          ${a.coords_approx ? `<div style="font-size:11px;font-style:italic;color:#9A6E16;margin-top:3px">· ${t('city.map.approx')}</div>` : ''}
          <a href="${mapsUrl(a.map_query)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:8px;font-size:12px;font-weight:800;color:#0E7C8F">${t('city.sights.directions')} ↗</a>
        </div>`,
      );
      markers.set(`a:${a.id}`, m);
    }

    for (const h of hotelsWithCoords) {
      const pos: [number, number] = [h.lat!, h.lng!];
      const m = L.marker(pos, { icon: pinIcon(GOLD, h.coords_approx), title: L10n(h.name, lang) })
        .addTo(map)
        .on('click', () => onSelect({ kind: 'hotel', id: h.id }));
      m.bindPopup(
        `<div style="min-width:190px">
          <div style="font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#9A6E16">${t('city.map.legend_hotels')}</div>
          <div style="font-weight:800;font-size:14px;color:#0F2A3D;margin-top:2px">${L10n(h.name, lang)}</div>
          <div style="font-size:12px;color:#4E7389;margin-top:3px">${hotelPriceLabel(h, t as (k: string) => string)}</div>
          ${h.rating ? `<div style="font-size:11px;color:#4E7389;margin-top:2px">★ ${h.rating.score.toFixed(1)} / ${h.rating.scale} · ${h.rating.reviews}</div>` : ''}
          ${h.coords_approx ? `<div style="font-size:11px;font-style:italic;color:#9A6E16;margin-top:3px">· ${t('city.map.approx')}</div>` : ''}
          <a href="${mapsUrl(h.map_query)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:8px;font-size:12px;font-weight:800;color:#0E7C8F">${t('city.sights.directions')} ↗</a>
        </div>`,
      );
      markers.set(`h:${h.id}`, m);
    }

    markersRef.current = markers;
    mapRef.current = map;

    // fit to city pins
    const all = [...sights, ...hotelsWithCoords].map((p) => [p.lat!, p.lng!] as [number, number]);
    if (all.length > 0) {
      map.fitBounds(L.latLngBounds(all).pad(0.18));
    }

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = new Map();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, center[0], center[1], sights, hotelsWithCoords]);

  /* Выбор из списка -> flyTo + popup */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selected) return;
    const key = selected.kind === 'attraction' ? `a:${selected.id}` : `h:${selected.id}`;
    const marker = markersRef.current.get(key);
    if (!marker) return;
    map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 15), { duration: 0.7 });
    window.setTimeout(() => marker.openPopup(), 450);
  }, [selected]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_290px]">
      <div className="card relative overflow-hidden p-1.5">
        <div
          ref={containerRef}
          className="h-[420px] w-full overflow-hidden rounded-[20px] sm:h-[520px]"
          role="application"
          aria-label={t('city.map.title')}
        />

        {/* Легенда */}
        <div className="absolute bottom-4 left-4 z-[500] flex flex-col gap-1.5 rounded-xl bg-white/95 px-3.5 py-2.5 text-xs font-semibold text-navy-600 shadow-card backdrop-blur">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full border-2 border-white shadow" style={{ background: TEAL }} aria-hidden="true" />
            {t('city.map.legend_sights')}
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full border-2 border-white shadow" style={{ background: GOLD }} aria-hidden="true" />
            {t('city.map.legend_hotels')}
          </span>
        </div>

        {centerApprox && (
          <div className="absolute right-4 top-4 z-[500] rounded-full bg-navy-800/90 px-3 py-1.5 text-[11px] font-semibold text-cream-100 shadow">
            {t('city.map.center_approx')}
          </div>
        )}
      </div>

      {/* Синхронный список */}
      <div className="card flex max-h-[520px] flex-col overflow-hidden">
        <MapList
          sights={sights}
          hotels={hotelsWithCoords}
          hotelsWithout={hotels.filter((h) => h.lat == null || h.lng == null)}
          selected={selected}
          onSelect={onSelect}
          lang={lang}
        />
      </div>
    </div>
  );
}

interface ListProps {
  sights: Attraction[];
  hotels: Hotel[];
  hotelsWithout: Hotel[];
  selected: MapTarget | null;
  onSelect: (t: MapTarget) => void;
  lang: Lang;
}

function MapList({ sights, hotels, hotelsWithout, selected, onSelect, lang }: ListProps) {
  const { t } = useTranslation();

  return (
    <>
      <p className="border-b border-navy-100 px-4 py-3 text-xs font-bold uppercase tracking-wider text-navy-400">
        {t('city.map.list_sights')}
      </p>
      <div className="thin-scroll flex-1 overflow-y-auto p-2">
        {sights.map((a) => {
          const active = selected?.kind === 'attraction' && selected.id === a.id;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onSelect({ kind: 'attraction', id: a.id })}
              className={cn(
                'mb-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition-colors',
                active ? 'bg-teal-50 text-teal-800' : 'text-navy-600 hover:bg-navy-50',
              )}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: TEAL }} aria-hidden="true" />
              <span className="clamp-1 flex-1">{L10n(a.name, lang)}</span>
              {a.coords_approx && (
                <span className="shrink-0 text-[10px] font-bold text-gold-600">{t('city.map.approx')}</span>
              )}
            </button>
          );
        })}
      </div>

      <p className="border-y border-navy-100 px-4 py-3 text-xs font-bold uppercase tracking-wider text-navy-400">
        {t('city.map.list_hotels')}
      </p>
      <div className="thin-scroll max-h-56 overflow-y-auto p-2">
        {hotels.map((h) => {
          const active = selected?.kind === 'hotel' && selected.id === h.id;
          return (
            <button
              key={h.id}
              type="button"
              onClick={() => onSelect({ kind: 'hotel', id: h.id })}
              className={cn(
                'mb-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition-colors',
                active ? 'bg-gold-100 text-gold-700' : 'text-navy-600 hover:bg-navy-50',
              )}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: GOLD }} aria-hidden="true" />
              <span className="clamp-1 flex-1">{L10n(h.name, lang)}</span>
              {h.coords_approx && (
                <span className="shrink-0 text-[10px] font-bold text-gold-600">{t('city.map.approx')}</span>
              )}
            </button>
          );
        })}
        {hotelsWithout.map((h) => (
          <div
            key={h.id}
            className="mb-1 flex w-full items-center gap-2.5 rounded-xl bg-navy-50/60 px-3 py-2.5 text-[13px] text-navy-400"
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-navy-200" aria-hidden="true" />
            <span className="clamp-1 flex-1">{L10n(h.name, lang)}</span>
            <span className="shrink-0 text-[10px] italic text-navy-300" title={t('city.map.no_pin')}>
              {t('city.map.no_pin')}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
