import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { OrnamentMark } from '../Ornament';
import LangSwitcher from '../LangSwitcher';

const NAV: Array<{ to: string; key: string; end?: boolean }> = [
  { to: '/', key: 'home', end: true },
  { to: '/city/kyzylorda', key: 'city' },
  { to: '/guide', key: 'guide' },
  { to: '/about', key: 'about' },
];

function Logo() {
  const { t } = useTranslation();
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label={t('app.name')}>
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-600 text-gold-300 shadow-card transition-transform duration-300 group-hover:-rotate-6">
        <OrnamentMark className="h-5 w-9" />
      </span>
      <span className="leading-tight">
        <span className="block font-display text-lg font-bold tracking-tight text-navy-800">
          {t('app.name')}
        </span>
        <span className="hidden text-[11px] font-bold text-teal-700 sm:block">
          {t('app.slogan')}
        </span>
      </span>
    </Link>
  );
}

/** Жарық, «ауаға толы» шапка: жылы ақ фон + blur. */
export default function Header() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-navy-100/70 bg-cream-0/90 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex" aria-label="main">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'rounded-full px-4 py-2 text-sm font-bold transition-colors',
                  isActive ? 'bg-teal-50 text-teal-800' : 'text-navy-500 hover:bg-navy-50 hover:text-navy-800',
                )
              }
            >
              {t(`nav.${item.key}`)}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LangSwitcher compact />
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full border border-navy-200 bg-white text-navy-600 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? t('nav.close') : t('nav.menu')}
          >
            {open ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          className="border-t border-navy-100 bg-cream-0/97 px-4 pb-4 pt-2 backdrop-blur-md md:hidden"
          aria-label="mobile"
        >
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  'mt-1 block rounded-2xl px-4 py-3.5 text-[15px] font-bold',
                  isActive ? 'bg-teal-50 text-teal-800' : 'text-navy-600 hover:bg-navy-50',
                )
              }
            >
              {t(`nav.${item.key}`)}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
