import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { OrnamentDivider } from './Ornament';

interface Props {
  id?: string;
  kicker?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

export default function SectionHeading({ id, kicker, title, subtitle, children, className }: Props) {
  const { t } = useTranslation();
  void t;
  return (
    <div id={id} className={cn('mb-8', className)}>
      <div className="flex flex-col items-start gap-2">
        {kicker && (
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
            {kicker}
          </span>
        )}
        <h2 className="font-display text-2xl font-bold tracking-tight text-navy-800 sm:text-3xl">
          {title}
        </h2>
        {subtitle && (
          <p className="max-w-2xl text-sm leading-relaxed text-navy-500 sm:text-base">{subtitle}</p>
        )}
      </div>
      {children}
      <OrnamentDivider className="mt-6 max-w-md" />
    </div>
  );
}
