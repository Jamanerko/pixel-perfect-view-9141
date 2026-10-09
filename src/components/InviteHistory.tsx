import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { cloudInviteHistory } from "@/lib/cloud.functions";
import type { Lang } from "@/lib/i18n";

type Item = Awaited<ReturnType<typeof cloudInviteHistory>>["items"][number];
type F = "all" | "pending" | "used" | "revoked";

export function InviteHistory({
  lang,
  creds,
  refreshKey,
}: {
  lang: Lang;
  creds: { phone: string; pin: string };
  refreshKey: unknown;
}) {
  const L = (kk: string, ru: string) => (lang === "kk" ? kk : ru);
  const fetchHistory = useServerFn(cloudInviteHistory);
  const [items, setItems] = useState<Item[] | null>(null);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<F>("all");

  useEffect(() => {
    fetchHistory({ data: creds })
      .then((r) => setItems(r.items))
      .catch(() => setItems(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const label: Record<Item["status"], [string, string]> = {
    pending: [L("Кіруді күтуде", "Ожидает входа"), "bg-gold/15 text-gold ring-gold/40"],
    used: [L("Қолданылды", "Использовано"), "bg-mint/15 text-mint ring-mint/40"],
    revoked: [L("Қайтарылды", "Отозвано"), "bg-lava/15 text-lava ring-lava/40"],
  };
  const fmt = (ms: number) =>
    new Date(ms).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  const shown = (items ?? []).filter((i) => f === "all" || i.status === f);

  return (
    <div className="rounded-2xl bg-panel/60 p-3 ring-1 ring-edge">
      <button onClick={() => setOpen(!open)} className="flex min-h-10 w-full items-center justify-between">
        <span className="num text-[11px] uppercase tracking-[0.18em] text-mute">
          {L("Шақырулар тарихы", "История приглашений")} · {items?.length ?? "—"}
        </span>
        <span className="text-mute">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {(["all", "pending", "used", "revoked"] as F[]).map((k) => (
              <button
                key={k}
                onClick={() => setF(k)}
                className={`min-h-9 shrink-0 rounded-full px-3 text-xs font-bold ring-1 ${
                  f === k ? "bg-ice/20 text-ice ring-ice/40" : "bg-frost text-mute ring-edge"
                }`}
              >
                {k === "all" ? L("Барлығы", "Все") : label[k][0]}
              </button>
            ))}
          </div>
          {items === null && <p className="text-xs text-dim">{L("Интернет қажет", "Нужен интернет")}</p>}
          {items && shown.length === 0 && <p className="text-xs text-dim">{L("Жазба жоқ", "Записей нет")}</p>}
          {shown.map((i) => (
            <div key={i.id} className="rounded-xl bg-ink/60 p-3 ring-1 ring-edge">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{i.name || "—"}</p>
                  <p className="num text-xs text-ice">{i.phone}</p>
                </div>
                <span className={`num shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${label[i.status][1]}`}>
                  {label[i.status][0]}
                </span>
              </div>
              <div className="num mt-2 flex flex-wrap justify-between gap-x-3 text-[11px] text-dim">
                <span>{L("Берілді", "Выдан")}: {fmt(i.issuedAt)}</span>
                <span className="tracking-[0.2em] text-mute">{i.pin}</span>
              </div>
              {i.resolvedAt && (
                <p className="num text-[11px] text-dim">
                  {i.status === "used" ? L("Кірді", "Вход") : L("Қайтарылды", "Отозван")}: {fmt(i.resolvedAt)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
