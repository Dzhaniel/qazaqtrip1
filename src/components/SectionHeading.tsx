import { cn } from '../lib/utils';
import { OrnamentDivider } from './Ornament';

interface Props {
  id?: string;
  kicker?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
  /** Декоративті «ghost» нөмір (01, 02…) — editorial стиль. */
  num?: string;
}

/**
 * Editorial бөлім тақырыбы: алтын kicker-сызықша, үлкен display-тақырып,
 * оң жақтағы жеңіл ghost-нөмір, астында қошқар мүйіз бөліндіші.
 */
export default function SectionHeading({ id, kicker, title, subtitle, children, className, num }: Props) {
  return (
    <div id={id} className={cn('relative mb-8', className)}>
      {num && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-6 right-0 select-none font-display text-6xl font-bold leading-none text-navy-800/[0.06] sm:text-7xl"
        >
          {num}
        </span>
      )}
      <div className="flex flex-col items-start gap-2">
        {kicker && <span className="kicker text-teal-700">{kicker}</span>}
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
