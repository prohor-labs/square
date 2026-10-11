export interface ScorePoint {
  readonly label: string;
  readonly percent: number;
  readonly score: number;
}

/** Green when the score is good, amber in the middle, red when it is weak. */
function barColour(percent: number): string {
  if (percent >= 70) return "#34d399";
  if (percent >= 40) return "#fbbf24";
  return "#f87171";
}

/**
 * Score per exam, drawn as bars on a dark screen.
 *
 * Plain CSS bars rather than a chart library: the panel is fixed height, so a
 * chart package would only add weight and a client-side measurement step.
 */
export function ScoreChart({ data }: { readonly data: readonly ScorePoint[] }) {
  return (
    <div className="rounded-2xl bg-slate-950 p-4 shadow-inner ring-1 ring-white/10">
      <p className="pb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
        পরীক্ষা ভিত্তিক স্কোর
      </p>

      <div className="flex h-52 items-end gap-1.5 sm:h-64 sm:gap-2">
        {data.map((point) => (
          <div
            key={point.label}
            className="flex h-full flex-1 flex-col items-center justify-end gap-1"
          >
            <span className="text-[11px] font-bold tabular-nums text-white">
              {point.percent}%
            </span>
            <div
              className="w-full rounded-t-md"
              style={{
                /* A floor of 2% keeps a zero score visible as a sliver. */
                height: `${Math.max(point.percent, 2)}%`,
                backgroundColor: barColour(point.percent),
              }}
            />
          </div>
        ))}
      </div>

      <div className="mt-2 flex gap-1.5 border-t border-white/10 pt-2 sm:gap-2">
        {data.map((point) => (
          <span
            key={point.label}
            title={point.label}
            className="min-w-0 flex-1 truncate text-center text-[10px] text-slate-400"
          >
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
}
