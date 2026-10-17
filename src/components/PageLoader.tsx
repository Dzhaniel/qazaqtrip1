import { useTranslation } from 'react-i18next';

export default function PageLoader() {
  const { t } = useTranslation();
  return (
    <div className="container-page py-24" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
        <p className="text-sm text-navy-400">{t('common.loading')}</p>
      </div>
    </div>
  );
}
