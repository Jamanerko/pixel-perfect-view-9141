import { t, type Lang } from "@/lib/i18n";
import { FREE_LIMIT, type Driver } from "@/lib/types";

export function ProfilePanel({
  lang,
  driver,
  homeAddress,
  onHomeChange,
  onBuyPro,
  onLogout,
}: {
  lang: Lang;
  driver: Driver;
  homeAddress: string;
  onHomeChange: (v: string) => void;
  onBuyPro: () => void;
  onLogout: () => void;
}) {
  const isPro = driver.proUntil !== null && driver.proUntil > Date.now();
  const left = Math.max(0, FREE_LIMIT - driver.ordersTotal);

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-frost/50 p-4 ring-1 ring-edge backdrop-blur-xl">
        <p className="num text-[10px] uppercase tracking-wider text-dim">
          {t("finalDest", lang)}
        </p>
        <div className="mt-2 flex items-center gap-2 rounded-xl bg-ink/50 px-3 ring-1 ring-edge focus-within:ring-2 focus-within:ring-ice">
          <span className="size-2 shrink-0 rounded-full bg-lava" />
          <input
            value={homeAddress}
            onChange={(e) => onHomeChange(e.target.value)}
            placeholder={t("finalDestPh", lang)}
            className="min-h-14 w-full bg-transparent text-sm font-semibold outline-none placeholder:text-dim"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-frost/50 p-4 ring-1 ring-edge backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <p className="num text-[10px] uppercase tracking-wider text-dim">{t("plan", lang)}</p>
          <span
            className={`num rounded-md px-2 py-1 text-[11px] font-bold ring-1 ${
              isPro ? "bg-mint/15 text-mint ring-mint/30" : "bg-panel text-dim ring-edge"
            }`}
          >
            {isPro ? t("pro", lang) : t("free", lang)}
          </span>
        </div>
        <p className="mt-2 text-sm font-semibold">{driver.name}</p>
        <p className="num mt-0.5 text-xs text-mute">{driver.phone}</p>

        {isPro ? (
          <p className="num mt-3 text-xs text-mint">
            {t("proUntil", lang)}{" "}
            {new Date(driver.proUntil ?? 0).toLocaleDateString("ru-RU")}
          </p>
        ) : (
          <>
            <p className="num mt-3 text-xs text-gold">
              {left} {t("trialLeft", lang)}
            </p>
            <button
              onClick={onBuyPro}
              className="mt-3 min-h-14 w-full rounded-xl bg-gold text-sm font-bold text-ink"
            >
              {t("buyPro", lang)}
            </button>
          </>
        )}
      </div>

      <button
        onClick={onLogout}
        className="min-h-12 w-full rounded-xl bg-panel text-sm font-semibold text-mute ring-1 ring-edge"
      >
        {t("logout", lang)}
      </button>
    </section>
  );
}
