/**
 * Loading skeleton for the character counter, shown before the client tool mounts
 * (localStorage hydration). Mirrors the live 2-column geometry exactly so replacing
 * it with the real tool causes no layout shift (CLS 0). Decorative → aria-hidden;
 * the surrounding SSR sections (H1/intro/how-to/FAQ) carry the accessible content.
 * The pulse is neutralized by the global prefers-reduced-motion reset.
 */
export function CounterSkeleton() {
  const block = 'bg-surface-muted rounded';

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-5 gap-6 md:items-stretch animate-pulse"
      aria-hidden="true"
    >
      {/* Left: text input placeholder */}
      <div className="md:col-span-3 flex flex-col gap-2">
        <div className="flex-1 min-h-72 rounded-lg border border-hairline bg-surface-muted" />
        <div className={`h-4 w-40 ${block}`} />
      </div>

      {/* Right: limit + metrics + actions */}
      <div className="md:col-span-2 space-y-6">
        {/* Limit: label + preset pills */}
        <div className="space-y-4">
          <div className={`h-3 w-20 ${block}`} />
          <div className="flex flex-wrap gap-2">
            <div className={`h-11 w-32 rounded-lg ${block}`} />
            <div className={`h-11 w-32 rounded-lg ${block}`} />
            <div className={`h-11 w-24 rounded-lg ${block}`} />
            <div className={`h-11 w-20 rounded-lg ${block}`} />
          </div>
        </div>

        {/* Metrics card */}
        <div className="bg-surface rounded-xl border border-hairline p-5 shadow-card space-y-6">
          <div className="space-y-2">
            <div className={`h-3 w-24 ${block}`} />
            <div className={`h-9 w-24 ${block}`} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className={`h-3 w-16 ${block}`} />
                <div className={`h-5 w-12 ${block}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className={`h-11 flex-1 rounded-lg ${block}`} />
          <div className={`h-11 flex-1 rounded-lg ${block}`} />
          <div className={`h-11 flex-1 rounded-lg ${block}`} />
        </div>
      </div>
    </div>
  );
}
