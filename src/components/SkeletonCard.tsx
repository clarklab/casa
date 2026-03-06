export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden animate-pulse">
      <div className="aspect-[16/10] bg-slate-200 dark:bg-slate-800" />
      <div className="p-3.5 space-y-2.5">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-32" />
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-48" />
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-40" />
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-56" />
      </div>
    </div>
  );
}
