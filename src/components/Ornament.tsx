import { cn } from '../lib/utils';

/**
 * Қошқар мүйіз (ram's horn) — қазақ ою-өрнегінің жеңіл, декоративті нұсқасы.
 * Тек бөліндіштер мен hero-фон ретінде, ешқашан шулы емес.
 */

const HORN_PATH =
  'M6 22 C6 10 14 5 20 7 C26 9 26 17 21 19 C17 21 14 18 15 14 C15.5 11.5 18 11 18.5 13';

export function OrnamentMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 26" fill="none" className={cn('h-6 w-11', className)} aria-hidden="true">
      <path
        d={HORN_PATH}
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        transform="translate(1,0)"
      />
      <path
        d={HORN_PATH}
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        transform="translate(47,0) scale(-1,1)"
      />
      <path d="M24 3 L27.5 8 L24 13 L20.5 8 Z" fill="currentColor" opacity="0.85" />
    </svg>
  );
}

/** Горизонтальный бөліндіш: сызық — ою — сызық. */
export function OrnamentDivider({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 text-gold-500', className)} aria-hidden="true">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gold-300 to-gold-400" />
      <OrnamentMark className="h-5 w-9 shrink-0" />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent via-gold-300 to-gold-400" />
    </div>
  );
}

/**
 * Фон-плитка оюмен (data-URI SVG) — hero және басқа үлкен беттерге.
 * opacity-ні сырттан реттеңіз (мыс., opacity-[0.06]).
 */
const TILE_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><g fill='none' stroke='#E0A526' stroke-width='2' stroke-linecap='round'><path d='M36 118 C36 84 56 74 70 78 C86 83 86 104 74 109 C64 113 58 106 59.5 100 C60.5 96 64 95 64.5 98'/><path d='M124 118 C124 84 104 74 90 78 C74 83 74 104 86 109 C96 113 102 106 100.5 100 C99.5 96 96 95 95.5 98'/><path d='M80 30 L85 38 L80 46 L75 38 Z' fill='#E0A526' stroke='none' opacity='0.8'/><path d='M0 172 C0 145 15 137 26 140 C38 144 38 160 29 164'/><path d='M160 172 C160 145 145 137 134 140 C122 144 122 160 131 164'/></g></svg>`;

export function OrnamentPattern({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0', className)}
      style={{
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(TILE_SVG)}")`,
        backgroundSize: '160px 160px',
        backgroundRepeat: 'repeat',
      }}
    />
  );
}
