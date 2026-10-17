/** Карточка-скелетоны (жүктеу кезіндегі «premium» сезім). */

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card overflow-hidden" aria-hidden="true">
      <div className="skeleton h-28 w-full rounded-none" />
      <div className="space-y-3 p-5">
        <div className="skeleton h-5 w-3/4" />
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="skeleton h-3.5" style={{ width: `${90 - i * 14}%` }} />
        ))}
        <div className="flex gap-2 pt-2">
          <div className="skeleton h-8 w-28 rounded-full" />
          <div className="skeleton h-8 w-24 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} lines={i % 2 === 0 ? 3 : 2} />
      ))}
    </div>
  );
}
