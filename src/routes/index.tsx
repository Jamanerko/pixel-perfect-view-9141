import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";

import { AdminPanel } from "@/components/AdminPanel";
import { AuthScreen } from "@/components/AuthScreen";
import { CashTracker } from "@/components/CashTracker";
import { OrderCard } from "@/components/OrderCard";
import { OrderForm } from "@/components/OrderForm";
import { PayModal } from "@/components/PayModal";
import { ProfilePanel } from "@/components/ProfilePanel";
import { cloudAuth } from "@/lib/cloud.functions";
import { t, type Lang } from "@/lib/i18n";
import { districtBreakdown, mapLinks, optimize, sortForDisplay } from "@/lib/route-optimizer";
import { usePersistentState } from "@/lib/storage";
import { ADMIN_PHONE, FREE_LIMIT, type Driver, type Order } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Аралық жеткізу — маршрут пен касса жүргізушіге" },
      {
        name: "description",
        content:
          "Мобильді қосымша: тапсырыстарды жылдам қосу, маршрутты оңтайландыру, қолма-қол ақшаны бақылау және 2GIS/Yandex навигациясы.",
      },
      { property: "og:title", content: "Аралық жеткізу / Межгород Логистика" },
      {
        property: "og:description",
        content:
          "Оптимизация маршрута, учёт наличных и навигация 2GIS/Яндекс для междугородних водителей.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: App,
});

type Tab = "route" | "add" | "profile" | "admin";

function App() {
  const [lang, setLang] = usePersistentState<Lang>("ro.lang", "ru");
  const [drivers, setDrivers] = usePersistentState<Driver[]>("ro.drivers", []);
  const [sessionPhone, setSessionPhone] = usePersistentState<string | null>("ro.session", null);
  const [orders, setOrders] = usePersistentState<Order[]>("ro.orders", []);
  const [home, setHome] = usePersistentState<string>("ro.home", "");
  const [tab, setTab] = useState<Tab>("route");
  const [payOpen, setPayOpen] = useState(false);

  const driver = drivers.find((d) => d.phone === sessionPhone) ?? null;
  const checkCloud = useServerFn(cloudAuth);

  // Blocked drivers are signed out as soon as the device is online.
  useEffect(() => {
    if (!driver?.pin) return;
    checkCloud({ data: { phone: driver.phone, pin: driver.pin, name: driver.name } })
      .then((r) => {
        if (r.status === "blocked") {
          alert(lang === "kk" ? "Аккаунт бұғатталған" : "Аккаунт заблокирован администратором");
          setSessionPhone(null);
        } else if (r.status === "ok") {
          patchDriver(driver.phone, { proUntil: r.driver.proUntil, name: r.driver.name });
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driver?.phone]);
  const isAdmin = driver?.phone === ADMIN_PHONE;
  const isPro = !!driver?.proUntil && driver.proUntil > Date.now();
  const blocked = !!driver && !isPro && driver.ordersTotal >= FREE_LIMIT;

  const visible = useMemo(() => sortForDisplay(orders), [orders]);
  const districts = useMemo(() => districtBreakdown(orders), [orders]);
  const pending = orders.filter((o) => !o.delivered);
  const totalCash = orders.filter((o) => !o.paid).reduce((s, o) => s + o.amount, 0);
  const collected = orders
    .filter((o) => !o.paid && o.delivered)
    .reduce((s, o) => s + o.amount, 0);

  function patchDriver(phone: string, patch: Partial<Driver>) {
    setDrivers((list) => list.map((d) => (d.phone === phone ? { ...d, ...patch } : d)));
  }

  function addOrder(d: {
    address: string;
    phone: string;
    paid: boolean;
    amount: number;
    note: string;
  }) {
    if (!driver || blocked) return;
    setOrders((list) => [
      ...list,
      {
        id: `${Date.now()}-${list.length}`,
        ...d,
        delivered: false,
        deferred: false,
        createdAt: Date.now(),
        seq: list.length,
      },
    ]);
    patchDriver(driver.phone, { ordersTotal: driver.ordersTotal + 1 });
    setTab("route");
  }

  if (!driver) {
    return (
      <Shell lang={lang} setLang={setLang}>
        <AuthScreen
          lang={lang}
          drivers={drivers}
          onAuth={(d, isNew) => {
            if (isNew) setDrivers((list) => [...list, d]);
            setSessionPhone(d.phone);
          }}
        />
      </Shell>
    );
  }

  return (
    <Shell lang={lang} setLang={setLang} subtitle={driver.name}>
      {tab === "route" && (
        <div className="space-y-4">
          <CashTracker
            lang={lang}
            total={totalCash}
            collected={collected}
            stopsLeft={pending.length}
          />

          <div className="flex items-center justify-between gap-3 rounded-xl bg-panel/50 px-4 py-3 ring-1 ring-edge backdrop-blur-md">
            <div className="min-w-0">
              <p className="num text-[10px] uppercase tracking-wider text-dim">
                {t("districts", lang)}
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold">
                {districts.length
                  ? districts
                      .slice(0, 3)
                      .map((d) => `${d.name} · ${d.count}`)
                      .join("  ")
                  : "—"}
              </p>
            </div>
            <button
              onClick={() => setOrders((list) => optimize(list))}
              className="min-h-11 shrink-0 rounded-xl bg-ice/15 px-4 text-sm font-semibold text-ice ring-1 ring-ice/30"
            >
              {t("optimize", lang)}
            </button>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="num text-[11px] uppercase tracking-[0.18em] text-mute">
                {t("roadbook", lang)}
              </p>
              <p className="num text-[11px] text-dim">
                {pending.length} / {orders.length} {t("ofOrders", lang)}
              </p>
            </div>

            {orders.length === 0 && (
              <p className="rounded-2xl bg-frost/40 p-6 text-center text-sm text-dim ring-1 ring-edge">
                {t("emptyRoute", lang)}
              </p>
            )}

            <div className="space-y-3">
              {visible.map((o, i) => (
                <OrderCard
                  key={o.id}
                  order={o}
                  index={i}
                  lang={lang}
                  active={!o.delivered && i === 0}
                  onDeliver={() =>
                    setOrders((list) =>
                      list.map((x) =>
                        x.id === o.id
                          ? { ...x, delivered: !x.delivered, deferred: false }
                          : x,
                      ),
                    )
                  }
                  onDefer={() =>
                    setOrders((list) =>
                      optimize(
                        list.map((x) => (x.id === o.id ? { ...x, deferred: true } : x)),
                      ),
                    )
                  }
                />
              ))}
            </div>
          </div>

          {home.trim() && (
            <section className="rounded-2xl bg-panel/50 p-4 ring-1 ring-edge backdrop-blur-md">
              <p className="num text-[10px] uppercase tracking-wider text-dim">
                {t("finalDest", lang)}
              </p>
              <div className="mt-2 flex items-center gap-2 rounded-xl bg-ink/50 px-3 py-3 ring-1 ring-edge">
                <span className="size-2 shrink-0 rounded-full bg-lava" />
                <p className="truncate text-sm font-semibold">{home}</p>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <a
                  href={mapLinks(home).dgis}
                  target="_blank"
                  rel="noreferrer"
                  className="grid min-h-11 place-items-center rounded-xl bg-panel text-xs font-semibold text-pale ring-1 ring-edge"
                >
                  2GIS
                </a>
                <a
                  href={mapLinks(home).yandex}
                  target="_blank"
                  rel="noreferrer"
                  className="grid min-h-11 place-items-center rounded-xl bg-panel text-xs font-semibold text-pale ring-1 ring-edge"
                >
                  Yandex
                </a>
              </div>
            </section>
          )}

          {orders.some((o) => o.delivered) && (
            <button
              onClick={() => setOrders((list) => list.filter((o) => !o.delivered))}
              className="min-h-12 w-full rounded-xl bg-panel text-sm font-semibold text-mute ring-1 ring-edge"
            >
              {t("clearDone", lang)}
            </button>
          )}
        </div>
      )}

      {tab === "add" && (
        <OrderForm
          lang={lang}
          blocked={blocked}
          onSubmit={addOrder}
        />
      )}

      {tab === "profile" && (
        <ProfilePanel
          lang={lang}
          driver={driver}
          homeAddress={home}
          onHomeChange={setHome}
          onBuyPro={() => setPayOpen(true)}
          onLogout={() => setSessionPhone(null)}
        />
      )}

      {tab === "admin" && isAdmin && (
        <AdminPanel lang={lang} admin={driver} localDrivers={drivers} />
      )}

      {payOpen && <PayModal lang={lang} onClose={() => setPayOpen(false)} />}

      <nav className="fixed inset-x-0 bottom-0 z-40 bg-ink/80 ring-1 ring-edge backdrop-blur-2xl">
        <div className="mx-auto flex max-w-md gap-2 px-4 pt-2 pb-4">
          {(
            [
              ["route", t("tabRoute", lang)],
              ["add", t("tabAdd", lang)],
              ["profile", t("tabProfile", lang)],
              ...(isAdmin ? ([["admin", t("tabAdmin", lang)]] as const) : []),
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`min-h-14 flex-1 rounded-2xl text-sm font-bold ${
                tab === key
                  ? "bg-gold text-ink"
                  : "bg-frost text-mute ring-1 ring-edge"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>
    </Shell>
  );
}

function Shell({
  lang,
  setLang,
  subtitle,
  children,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-ink text-pale selection:bg-ice/30">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-[420px] w-[120%] -translate-x-1/2 rounded-full bg-ice/15 blur-[90px]" />
        <div className="absolute top-1/3 -right-24 size-[300px] rounded-full bg-gold/10 blur-[80px]" />
        <div className="absolute bottom-0 left-0 size-[280px] rounded-full bg-mint/10 blur-[80px]" />
      </div>

      <div className="mx-auto max-w-md px-4 pb-40">
        <header className="sticky top-0 z-30 -mx-4 bg-ink/60 px-4 pt-4 pb-3 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="num grid size-9 place-items-center rounded-lg bg-frost text-sm font-bold text-gold ring-1 ring-edge">
                KZ
              </div>
              <div className="leading-none">
                <p className="text-[13px] font-semibold tracking-tight">{t("appName", lang)}</p>
                <p className="num mt-0.5 text-[10px] text-mute">
                  {subtitle ?? t("tagline", lang)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-frost/80 p-0.5 ring-1 ring-edge">
              {(["kk", "ru"] as const).map((code) => (
                <button
                  key={code}
                  onClick={() => setLang(code)}
                  className={`min-h-9 rounded-full px-3 text-xs font-bold ${
                    lang === code ? "bg-ice/20 text-ice" : "text-mute"
                  }`}
                >
                  {code === "kk" ? "KZ" : "RU"}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="mt-4">{children}</main>
      </div>
    </div>
  );
}
