import { formatKzt, t, type Lang } from "@/lib/i18n";
import { mapLinks } from "@/lib/route-optimizer";
import type { Order } from "@/lib/types";

export function OrderCard({
  order,
  index,
  lang,
  active,
  onDeliver,
  onDefer,
}: {
  order: Order;
  index: number;
  lang: Lang;
  active: boolean;
  onDeliver: () => void;
  onDefer: () => void;
}) {
  const links = mapLinks(order.address);
  const num = String(index + 1).padStart(2, "0");

  if (order.delivered) {
    return (
      <article className="flex items-center justify-between rounded-2xl bg-frost/30 p-4 ring-1 ring-edge">
        <div className="flex min-w-0 items-center gap-3">
          <div className="num grid size-11 shrink-0 place-items-center rounded-xl bg-mint/15 text-lg font-bold text-mint ring-1 ring-mint/30">
            ✓
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-mute line-through">
              {order.address}
            </p>
            <p className="num mt-0.5 text-xs text-dim">{t("done", lang)}</p>
          </div>
        </div>
        <button
          onClick={onDeliver}
          className="min-h-11 shrink-0 rounded-xl bg-panel px-3 text-xs font-semibold text-mute ring-1 ring-edge"
        >
          {t("undo", lang)}
        </button>
      </article>
    );
  }

  return (
    <article className="animate-slide-in overflow-hidden rounded-2xl bg-frost/60 ring-1 ring-edge backdrop-blur-xl">
      <div className="flex items-start gap-3 p-4">
        <div
          className={`num grid size-11 shrink-0 place-items-center rounded-xl text-lg font-bold ring-1 ${
            active
              ? "bg-gold/15 text-gold ring-gold/30"
              : "bg-frost text-mute ring-edge"
          }`}
        >
          {num}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold">{order.address}</p>
            <span
              className={`num inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold ring-1 ${
                order.paid
                  ? "bg-mint/15 text-mint ring-mint/30"
                  : "bg-gold/15 text-gold ring-gold/30"
              }`}
            >
              {order.paid
                ? t("paid", lang)
                : `${t("pending", lang)} · ${formatKzt(order.amount)}`}
            </span>
          </div>
          <p className="num mt-1 text-xs text-mute">{order.phone}</p>
          {order.note && <p className="mt-1 text-xs text-lava">{order.note}</p>}

          <div className="mt-3 grid grid-cols-3 gap-2">
            <a
              href={`tel:${order.phone}`}
              className="grid min-h-11 place-items-center rounded-xl bg-ice/15 text-xs font-semibold text-ice ring-1 ring-ice/30"
            >
              {t("call", lang)}
            </a>
            <a
              href={links.dgis}
              target="_blank"
              rel="noreferrer"
              className="grid min-h-11 place-items-center rounded-xl bg-panel text-xs font-semibold text-pale ring-1 ring-edge"
            >
              2GIS
            </a>
            <a
              href={links.yandex}
              target="_blank"
              rel="noreferrer"
              className="grid min-h-11 place-items-center rounded-xl bg-panel text-xs font-semibold text-pale ring-1 ring-edge"
            >
              Yandex
            </a>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              onClick={onDeliver}
              className="min-h-12 rounded-xl bg-mint text-sm font-bold text-ink active:scale-[0.99]"
            >
              {t("markDelivered", lang)}
            </button>
            <button
              onClick={onDefer}
              className="min-h-12 rounded-xl bg-panel text-sm font-semibold text-mute ring-1 ring-edge active:scale-[0.99]"
            >
              {t("pushToEnd", lang)}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
