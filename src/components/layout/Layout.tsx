import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Header from './Header';
import Footer from './Footer';

/** ЖИ-гидке жүзеге жабысқан батырма — барлық бетте. */
function GuideFab() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  // /guide бетінде өзі қажет емес
  if (pathname === '/guide') return null;

  return (
    <Link
      to="/guide"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-gold-500 px-4 py-3.5 font-display text-sm font-bold text-navy-900 shadow-lift transition-transform duration-200 hover:scale-105 active:scale-95"
      aria-label={t('guideFab.label')}
    >
      <Sparkles size={18} aria-hidden="true" />
      <span className="hidden sm:inline">{t('guideFab.label')}</span>
    </Link>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <GuideFab />
      <Footer />
    </div>
  );
}
