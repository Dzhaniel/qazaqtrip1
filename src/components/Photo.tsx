import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  /** /images/... ; ешкі жақпаған жағдайда gradient-фолбэк. */
  src?: string;
  alt: string;
  /** Контейнер өлшемі (h-48, absolute inset-0 және т.б.). */
  className?: string;
  imgClassName?: string;
  /** Gradient-фолбэк түстері: "from-x via-y to-z". */
  fallback?: string;
  /** Gradient-фолбэк ортасындағы иконка. */
  icon?: LucideIcon;
  /** Беттің бірінші экранындағы суреттер — лени жоқ. */
  eager?: boolean;
  grayscale?: boolean;
}

/**
 * Сурет + gradient-фолбэк. Файл табылмаса (404) немесе src болмаса —
 * санат градиенті + иконка. Hover zoom — group-hover арқылы (group карточкада).
 */
export default function Photo({
  src,
  alt,
  className,
  imgClassName,
  fallback = 'from-teal-400 via-teal-600 to-navy-700',
  icon: Icon,
  eager = false,
  grayscale = false,
}: Props) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        aria-hidden="true"
        className={cn('relative flex items-center justify-center overflow-hidden bg-gradient-to-br', fallback, className)}
      >
        {Icon && <Icon size={44} strokeWidth={1.4} className={cn('text-white/85', grayscale && 'grayscale')} />}
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden bg-teal-50', className)}>
      <img
        src={src}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        onError={() => setFailed(true)}
        className={cn(
          'h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]',
          grayscale && 'grayscale',
          imgClassName,
        )}
      />
    </div>
  );
}
