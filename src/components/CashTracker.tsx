import { formatKzt, t, type Lang } from "@/lib/i18n";

export function CashTracker({
  lang,
  total,
  collected,
  stopsLeft,
}: {
  lang: Lang;
  total: number;
  collected: number;
  stopsLeft: number;
}) {
  const remaining = Math.max(0, total - collected);
  const pct = total > 0 ? Math.round((collected / total) * 100) : 0;

  return (
    <section className="rounded-2xl bg-frost/60 p-4 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.8)] ring-1 ring-edge backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <p className="num text-[11px] uppercase tracking-[0.18em] text-mute">
          {t("cashTracker", lang)}
        </p>
        <span className="num inline-flex items-center gap-1.5 text-[11px] text-mint">
          <span className="size-1.5 animate-soft-pulse rounded-full bg-mint" />
          LIVE
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3">
        <div className="pr-3">
          <p className="num text-[10px] uppercase tracking-wider text-dim">{t("total", lang)}</p>
          <p className="num mt-1.5 text-[24px] leading-none font-bold">{formatKzt(total)}</p>
          <p className="num mt-1 text-[10px] text-dim">₸</p>
        </div>
        <div className="border-l border-edge/60 px-3">
          <p className="num text-[10px] uppercase tracking-wider text-mint">
            {t("collected", lang)}
          </p>
          <p className="num mt-1.5 text-[24px] leading-none font-bold text-mint">
            {formatKzt(collected)}
          </p>
          <p className="num mt-1 text-[10px] text-dim">₸</p>
        </div>
        <div className="border-l border-edge/60 pl-3">
          <p className="num text-[10px] uppercase tracking-wider text-gold">
            {t("remaining", lang)}
          </p>
          <p className="num mt-1.5 text-[24px] leading-none font-bold text-gold">
            {formatKzt(remaining)}
          </p>
          <p className="num mt-1 text-[10px] text-dim">₸</p>
        </div>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-ink/60">
        <div
          className="h-full rounded-full bg-mint/80 transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="num mt-1.5 flex justify-between text-[10px] text-dim">
        <span>
          {pct}% {t("pctCollected", lang)}
        </span>
        <span>
          {stopsLeft} {t("stopsLeft", lang)}
        </span>
      </div>
    </section>
  );
}
