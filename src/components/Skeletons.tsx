/** Карточка-скелетоны (жүктеу кезіндегі «premium» сезім) — image-first. */

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card overflow-hidden" aria-hidden="true">
      <div className="skeleton h-48 w-full rounded-none sm:h-56" />
      <div className="space-y-3 p-5">
        <div className="skeleton h-4 w-24" />
        <div className="skeleton h-5 w-3/4" />
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="skeleton h-3.5" style={{ width: `${90 - i * 14}%` }} />
        ))}
        <div className="flex gap-2 pt-2">
          <div className="skeleton h-9 w-32 rounded-full" />
          <div className="skeleton h-9 w-28 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} lines={i % 2 === 0 ? 3 : 2} />
      ))}
    </div>
  );
}
