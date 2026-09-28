import { useState } from "react";
import { t, type Lang } from "@/lib/i18n";
import { ADMIN_PHONE, type Driver } from "@/lib/types";

function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const body = digits.startsWith("8") ? `7${digits.slice(1)}` : digits;
  return `+${body}`;
}

export function AuthScreen({
  lang,
  drivers,
  onAuth,
}: {
  lang: Lang;
  drivers: Driver[];
  onAuth: (driver: Driver, isNew: boolean) => void;
}) {
  const [phone, setPhone] = useState("+7");
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const normalized = normalizePhone(phone);
  const existing = drivers.find((d) => d.phone === normalized);
  const isNew = normalized.length >= 12 && !existing;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (normalized.length < 12) return setError(t("badPhone", lang));
    if (!/^\d{4}$/.test(pin)) return setError(t("badPin", lang));
    if (existing) {
      if (existing.pin !== pin) return setError(t("wrongPin", lang));
      return onAuth(existing, false);
    }
    if (!name.trim()) return setError(t("needName", lang));
    onAuth(
      {
        phone: normalized,
        name: name.trim(),
        pin,
        createdAt: Date.now(),
        ordersTotal: 0,
        proUntil: normalized === ADMIN_PHONE ? Date.now() + 3650 * 864e5 : null,
      },
      true,
    );
  }

  return (
    <form onSubmit={submit} className="mt-10 space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{t("authTitle", lang)}</h1>
        <p className="mt-1 text-sm text-mute">{t("authHint", lang)}</p>
      </div>

      <label className="block">
        <span className="num text-[10px] uppercase tracking-[0.2em] text-dim">
          {t("phone", lang)}
        </span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          autoComplete="tel"
          placeholder="+7 701 000 00 00"
          className="num mt-1.5 min-h-14 w-full rounded-xl bg-panel px-4 text-lg ring-1 ring-edge outline-none placeholder:text-dim focus:ring-2 focus:ring-ice"
        />
      </label>

      {isNew && (
        <label className="block animate-slide-in">
          <span className="num text-[10px] uppercase tracking-[0.2em] text-dim">
            {t("name", lang)}
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 min-h-14 w-full rounded-xl bg-panel px-4 text-lg ring-1 ring-edge outline-none placeholder:text-dim focus:ring-2 focus:ring-ice"
          />
        </label>
      )}

      <label className="block">
        <span className="num text-[10px] uppercase tracking-[0.2em] text-dim">
          {t("pin", lang)}
        </span>
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          inputMode="numeric"
          placeholder="••••"
          className="num mt-1.5 min-h-14 w-full rounded-xl bg-panel px-4 text-2xl tracking-[0.5em] ring-1 ring-edge outline-none placeholder:text-dim focus:ring-2 focus:ring-ice"
        />
      </label>

      {error && <p className="text-sm font-semibold text-lava">{error}</p>}

      <button
        type="submit"
        className="min-h-14 w-full rounded-2xl bg-gold text-base font-bold text-ink active:scale-[0.99]"
      >
        {t("enter", lang)}
      </button>

      <p className="num text-center text-[11px] leading-relaxed text-dim">
        {t("savedLocally", lang)}
      </p>
    </form>
  );
}
