import { t, type Lang } from "@/lib/i18n";
import type { Driver } from "@/lib/types";

export function AdminPanel({
  lang,
  drivers,
  onActivate,
}: {
  lang: Lang;
  drivers: Driver[];
  onActivate: (phone: string) => void;
}) {
  const fmt = (ts: number) => new Date(ts).toLocaleDateString("ru-RU");
  const now = Date.now();

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="num text-[11px] uppercase tracking-[0.18em] text-mute">
          {t("drivers", lang)}
        </p>
        <p className="num text-[11px] text-dim">{drivers.length}</p>
      </div>

      {drivers.length === 0 && (
        <p className="rounded-2xl bg-frost/40 p-6 text-center text-sm text-dim ring-1 ring-edge">
          {t("noDrivers", lang)}
        </p>
      )}

      {drivers.map((d) => {
        const isPro = d.proUntil !== null && d.proUntil > now;
        return (
          <article
            key={d.phone}
            className="rounded-2xl bg-frost/50 p-4 ring-1 ring-edge backdrop-blur-xl"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{d.name}</p>
                <p className="num mt-0.5 text-xs text-mute">{d.phone}</p>
              </div>
              <span
                className={`num shrink-0 rounded-md px-2 py-1 text-[11px] font-bold ring-1 ${
                  isPro
                    ? "bg-mint/15 text-mint ring-mint/30"
                    : "bg-panel text-dim ring-edge"
                }`}
              >
                {isPro ? "PRO" : "FREE"}
              </span>
            </div>

            <div className="num mt-3 flex gap-4 text-[11px] text-dim">
              <span>
                {t("regDate", lang)}: <span className="text-pale">{fmt(d.createdAt)}</span>
              </span>
              <span>
                {t("ordersCount", lang)}: <span className="text-pale">{d.ordersTotal}</span>
              </span>
            </div>

            {isPro && d.proUntil && (
              <p className="num mt-1 text-[11px] text-mint">
                {t("proUntil", lang)} {fmt(d.proUntil)}
              </p>
            )}

            <button
              onClick={() => onActivate(d.phone)}
              className="mt-3 min-h-12 w-full rounded-xl bg-gold text-sm font-bold text-ink"
            >
              {t("activatePro", lang)}
            </button>
          </article>
        );
      })}
    </section>
  );
}
