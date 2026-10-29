import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-teal-600 text-white">
        <Compass size={28} aria-hidden="true" />
      </span>
      <p className="mt-6 font-display text-5xl font-bold text-navy-300">404</p>
      <h1 className="mt-3 font-display text-2xl font-bold text-navy-800">{t('common.not_found_title')}</h1>
      <p className="mt-2 max-w-md text-sm text-navy-500">{t('common.not_found_text')}</p>
      <Link to="/" className="btn-primary mt-8">
        {t('common.back_home')}
      </Link>
    </div>
  );
}
