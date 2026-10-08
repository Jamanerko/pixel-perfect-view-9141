import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useState } from "react";

import { cloudAdminAction, cloudAuth, cloudDrivers } from "@/lib/cloud.functions";
import { t, type Lang } from "@/lib/i18n";
import { ADMIN_PHONE, FREE_LIMIT, type Driver } from "@/lib/types";

type Filter = "all" | "pro" | "free" | "limit" | "blocked";
type Action = Parameters<typeof cloudAdminAction>[0]["data"]["action"];

export function AdminPanel({
  lang,
  admin,
  localDrivers,
}: {
  lang: Lang;
  admin: Driver;
  localDrivers: Driver[];
}) {
  const L = (kk: string, ru: string) => (lang === "kk" ? kk : ru);
  const auth = useServerFn(cloudAuth);
  const list = useServerFn(cloudDrivers);
  const act = useServerFn(cloudAdminAction);

  const [drivers, setDrivers] = useState<Driver[]>(localDrivers);
  const [online, setOnline] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const creds = { phone: admin.phone, pin: admin.pin };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await auth({ data: { ...creds, name: admin.name } });
      const r = await list({ data: creds });
      if (r.status === "ok") {
        setDrivers(r.drivers);
        setOnline(true);
      } else setOnline(false);
    } catch {
      setOnline(false);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin.phone, admin.pin]);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(target: string, action: Action, okMsg: string) {
    try {
      const r = await act({ data: { ...creds, target, action } });
      if (r.status === "ok") {
        setToast(okMsg);
        await load();
      } else if (r.status === "forbidden") {
        setToast(L("Әкімшіге қолдануға болмайды", "Нельзя применить к админу"));
      } else setToast(L("Қате", "Ошибка"));
    } catch {
      setToast(L("Интернет жоқ", "Нет интернета"));
    }
    setTimeout(() => setToast(""), 2500);
  }

  const now = Date.now();
  const isPro = (d: Driver) => d.proUntil !== null && d.proUntil > now;
  const fmt = (ts: number) => new Date(ts).toLocaleDateString("ru-RU");
  const fmtFull = (ts: number) =>
    new Date(ts).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" });

  const stats = useMemo(
    () => ({
      total: drivers.length,
      pro: drivers.filter(isPro).length,
      blocked: drivers.filter((d) => d.blocked).length,
      active: drivers.filter((d) => d.lastSeen && now - d.lastSeen < 7 * 864e5).length,
      revenue: drivers.filter((d) => isPro(d) && d.phone !== ADMIN_PHONE).length * 1500,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [drivers],
  );

  const shown = useMemo(() => {
    const digits = query.replace(/\D/g, "");
    const text = query.trim().toLowerCase();
    return drivers
      .filter((d) => {
        if (!text) return true;
        if (digits && d.phone.replace(/\D/g, "").includes(digits)) return true;
        return d.name.toLowerCase().includes(text);
      })
      .filter((d) => {
        if (filter === "pro") return isPro(d);
        if (filter === "free") return !isPro(d);
        if (filter === "limit") return !isPro(d) && d.ordersTotal >= FREE_LIMIT;
        if (filter === "blocked") return !!d.blocked;
        return true;
      })
      .sort((a, b) => (b.lastSeen ?? b.createdAt) - (a.lastSeen ?? a.createdAt));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drivers, query, filter]);

  const filters: [Filter, string][] = [
    ["all", L("Барлығы", "Все")],
    ["pro", "PRO"],
    ["free", "FREE"],
    ["limit", L("Лимит", "Лимит")],
    ["blocked", L("Бұғатталған", "Заблок.")],
  ];

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="num text-[11px] uppercase tracking-[0.18em] text-mute">
          {t("drivers", lang)}
        </p>
        <button
          onClick={() => void load()}
          className="num min-h-9 rounded-lg bg-frost px-3 text-[11px] text-mute ring-1 ring-edge"
        >
          {loading ? "…" : online === false ? L("Офлайн ↻", "Офлайн ↻") : L("Жаңарту ↻", "Обновить ↻")}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[
          [L("Барлығы", "Всего"), stats.total],
          ["PRO", stats.pro],
          [L("7 күн", "Актив 7д"), stats.active],
          [L("Блок", "Блок"), stats.blocked],
        ].map(([label, v]) => (
          <div key={label} className="rounded-xl bg-panel/60 p-2.5 text-center ring-1 ring-edge">
            <p className="num text-lg font-bold">{v}</p>
            <p className="num text-[9px] uppercase tracking-wider text-dim">{label}</p>
          </div>
        ))}
      </div>
      <p className="num text-[11px] text-dim">
        {L("Ай сайынғы түсім", "Доход в месяц")}:{" "}
        <span className="text-mint">{stats.revenue.toLocaleString("ru-RU")} ₸</span>
      </p>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        inputMode="search"
        placeholder={L("Телефон немесе аты бойынша іздеу", "Поиск по телефону или имени")}
        className="min-h-14 w-full rounded-xl bg-ink/60 px-4 text-base ring-1 ring-edge outline-none focus:ring-ice/50"
      />

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {filters.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`min-h-10 shrink-0 rounded-full px-3.5 text-xs font-bold ring-1 ${
              filter === k ? "bg-ice/20 text-ice ring-ice/40" : "bg-frost text-mute ring-edge"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {drivers.some((d) => d.activated === false) && (
        <div className="space-y-2 rounded-2xl bg-gold/10 p-3 ring-1 ring-gold/30">
          <p className="num text-[11px] uppercase tracking-[0.18em] text-gold">
            {L("Жаңа өтінімдер", "Новые заявки")} · {drivers.filter((d) => d.activated === false).length}
          </p>
          {drivers
            .filter((d) => d.activated === false)
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((d) => {
              const msg = L(
                `Сәлеметсіз бе, ${d.name}! Кіру үшін құпия сөз: ${d.invitePin}\nНөмір: ${d.phone}\n${typeof window !== "undefined" ? window.location.origin : ""}`,
                `Здравствуйте, ${d.name}! Ваш пароль для входа: ${d.invitePin}\nНомер: ${d.phone}\n${typeof window !== "undefined" ? window.location.origin : ""}`,
              );
              return (
                <div key={d.phone} className="rounded-xl bg-ink/60 p-3 ring-1 ring-edge">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{d.name}</p>
                      <p className="num text-xs text-ice">{d.phone}</p>
                    </div>
                    <p className="num text-2xl font-bold tracking-[0.3em] text-gold">
                      {d.invitePin ?? "—"}
                    </p>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        void navigator.clipboard?.writeText(d.invitePin ?? "");
                        setToast(L("Көшірілді", "Скопировано"));
                        setTimeout(() => setToast(""), 1500);
                      }}
                      className="min-h-12 rounded-xl bg-panel text-sm font-bold ring-1 ring-edge"
                    >
                      {L("Көшіру", "Копировать")}
                    </button>
                    <a
                      href={`https://wa.me/${d.phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-h-12 items-center justify-center rounded-xl bg-mint/20 text-sm font-bold text-mint ring-1 ring-mint/40"
                    >
                      WhatsApp
                    </a>
                  </div>
                  <button
                    onClick={() =>
                      void run(d.phone, { kind: "new_invite" }, L("Жаңа құпия сөз", "Новый пароль создан"))
                    }
                    className="mt-2 min-h-10 w-full rounded-xl text-xs text-mute ring-1 ring-edge"
                  >
                    {L("Жаңа құпия сөз ↻", "Сгенерировать новый ↻")}
                  </button>
                </div>
              );
            })}
        </div>
      )}

      {shown.length === 0 && (
        <p className="rounded-2xl bg-frost/40 p-6 text-center text-sm text-dim ring-1 ring-edge">
          {t("noDrivers", lang)}
        </p>
      )}

      {shown.map((d) => {
        const pro = isPro(d);
        const expanded = open === d.phone;
        return (
          <article
            key={d.phone}
            className={`rounded-2xl p-4 ring-1 backdrop-blur-xl ${
              d.blocked ? "bg-lava/10 ring-lava/30" : "bg-frost/50 ring-edge"
            }`}
          >
            <button
              onClick={() => setOpen(expanded ? null : d.phone)}
              className="flex w-full items-start justify-between gap-2 text-left"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{d.name}</p>
                <a
                  href={`tel:${d.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="num mt-0.5 block text-xs text-ice"
                >
                  {d.phone}
                </a>
              </div>
              <div className="flex shrink-0 gap-1">
                {d.blocked && (
                  <span className="num rounded-md bg-lava/20 px-2 py-1 text-[11px] font-bold text-lava ring-1 ring-lava/30">
                    BLOCK
                  </span>
                )}
                <span
                  className={`num rounded-md px-2 py-1 text-[11px] font-bold ring-1 ${
                    pro ? "bg-mint/15 text-mint ring-mint/30" : "bg-panel text-dim ring-edge"
                  }`}
                >
                  {pro ? "PRO" : "FREE"}
                </span>
              </div>
            </button>

            <div className="num mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-dim">
              <span>
                {t("regDate", lang)}: <span className="text-pale">{fmt(d.createdAt)}</span>
              </span>
              <span>
                {t("ordersCount", lang)}:{" "}
                <span className={!pro && d.ordersTotal >= FREE_LIMIT ? "text-lava" : "text-pale"}>
                  {d.ordersTotal}
                </span>
              </span>
              {d.lastSeen && (
                <span>
                  {L("Соңғы кіру", "Был")}: <span className="text-pale">{fmtFull(d.lastSeen)}</span>
                </span>
              )}
            </div>
            {pro && d.proUntil && (
              <p className="num mt-1 text-[11px] text-mint">
                {t("proUntil", lang)} {fmt(d.proUntil)}
              </p>
            )}
            {d.adminNote && <p className="mt-1 text-xs text-gold">📝 {d.adminNote}</p>}

            {expanded && (
              <DriverActions
                d={d}
                L={L}
                online={online === true}
                run={(a, msg) => run(d.phone, a, msg)}
              />
            )}

            {!expanded && (
              <button
                onClick={() => setOpen(d.phone)}
                className="mt-3 min-h-12 w-full rounded-xl bg-panel text-sm font-semibold text-pale ring-1 ring-edge"
              >
                {L("Басқару ▾", "Управление ▾")}
              </button>
            )}
          </article>
        );
      })}

      {toast && (
        <div className="fixed inset-x-0 bottom-28 z-50 mx-auto w-fit rounded-xl bg-panel px-4 py-3 text-sm font-semibold ring-1 ring-edge">
          {toast}
        </div>
      )}
    </section>
  );
}

function DriverActions({
  d,
  L,
  online,
  run,
}: {
  d: Driver;
  L: (kk: string, ru: string) => string;
  online: boolean;
  run: (a: Action, okMsg: string) => void;
}) {
  const [until, setUntil] = useState(
    d.proUntil ? new Date(d.proUntil).toISOString().slice(0, 10) : "",
  );
  const [pin, setPin] = useState("");
  const [name, setName] = useState(d.name);
  const [note, setNote] = useState(d.adminNote ?? "");
  const isAdmin = d.phone === ADMIN_PHONE;
  const btn = "min-h-12 rounded-xl text-sm font-bold ring-1 disabled:opacity-40";
  const done = L("Сақталды", "Сохранено");

  if (!online) {
    return (
      <p className="mt-3 rounded-xl bg-panel p-3 text-xs text-dim ring-1 ring-edge">
        {L("Басқару үшін интернет қажет", "Для управления нужен интернет")}
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-4 border-t border-edge pt-4">
      <div className="space-y-2">
        <p className="num text-[10px] uppercase tracking-wider text-dim">
          {L("Жазылым", "Подписка")}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[7, 30, 90].map((n) => (
            <button
              key={n}
              onClick={() => run({ kind: "extend", days: n }, done)}
              className={`${btn} bg-gold/15 text-gold ring-gold/30`}
            >
              +{n} {L("күн", "дн")}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={until}
            onChange={(e) => setUntil(e.target.value)}
            className="min-h-12 flex-1 rounded-xl bg-ink/60 px-3 text-sm ring-1 ring-edge"
          />
          <button
            disabled={!until}
            onClick={() =>
              run({ kind: "set_until", until: new Date(`${until}T23:59:59`).getTime() }, done)
            }
            className={`${btn} bg-panel px-4 text-pale ring-edge`}
          >
            {L("Орнату", "Задать")}
          </button>
        </div>
        <button
          disabled={!d.proUntil}
          onClick={() => run({ kind: "set_until", until: null }, done)}
          className={`${btn} w-full bg-panel text-mute ring-edge`}
        >
          {L("Pro-ны алып тастау", "Отключить Pro")}
        </button>
        <button
          onClick={() => run({ kind: "reset_orders" }, done)}
          className={`${btn} w-full bg-panel text-mute ring-edge`}
        >
          {L("Тапсырыс санауышын нөлдеу", "Сбросить счётчик заказов")}
        </button>
      </div>

      <div className="space-y-2">
        <p className="num text-[10px] uppercase tracking-wider text-dim">
          {L("Аккаунт", "Аккаунт")}
        </p>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="min-h-12 flex-1 rounded-xl bg-ink/60 px-3 text-sm ring-1 ring-edge"
          />
          <button
            disabled={!name.trim() || name === d.name}
            onClick={() => run({ kind: "rename", name }, done)}
            className={`${btn} bg-panel px-4 text-pale ring-edge`}
          >
            OK
          </button>
        </div>
        <div className="flex gap-2">
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            placeholder={L("Жаңа PIN", "Новый PIN")}
            className="num min-h-12 flex-1 rounded-xl bg-ink/60 px-3 text-sm ring-1 ring-edge"
          />
          <button
            disabled={pin.length !== 4}
            onClick={() => {
              run({ kind: "reset_pin", newPin: pin }, L("PIN өзгертілді", "PIN изменён"));
              setPin("");
            }}
            className={`${btn} bg-panel px-4 text-pale ring-edge`}
          >
            {L("PIN ауыстыру", "Сменить PIN")}
          </button>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder={L("Әкімші жазбасы", "Заметка админа")}
          className="w-full rounded-xl bg-ink/60 px-3 py-2 text-sm ring-1 ring-edge"
        />
        <button
          disabled={note === (d.adminNote ?? "")}
          onClick={() => run({ kind: "note", note }, done)}
          className={`${btn} w-full bg-panel text-pale ring-edge`}
        >
          {L("Жазбаны сақтау", "Сохранить заметку")}
        </button>
      </div>

      {!isAdmin && (
        <div className="grid grid-cols-2 gap-2">
          {d.blocked ? (
            <button
              onClick={() => run({ kind: "unblock" }, L("Бұғаттан шығарылды", "Разблокирован"))}
              className={`${btn} bg-mint/15 text-mint ring-mint/30`}
            >
              {L("Бұғаттан шығару", "Разблокировать")}
            </button>
          ) : (
            <button
              onClick={() => {
                if (confirm(L("Жүргізушіні бұғаттау?", "Заблокировать водителя?")))
                  run({ kind: "block" }, L("Бұғатталды", "Заблокирован"));
              }}
              className={`${btn} bg-lava/15 text-lava ring-lava/30`}
            >
              {L("Бұғаттау", "Заблокировать")}
            </button>
          )}
          <button
            onClick={() => {
              if (
                confirm(
                  L(
                    "Жүргізуші мен оның барлық тапсырыстарын жою?",
                    "Удалить водителя и все его заказы безвозвратно?",
                  ),
                )
              )
                run({ kind: "delete" }, L("Жойылды", "Удалён"));
            }}
            className={`${btn} bg-panel text-lava ring-lava/30`}
          >
            {L("Жою", "Удалить")}
          </button>
        </div>
      )}
    </div>
  );
}
