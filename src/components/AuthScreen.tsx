import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { cloudAuth } from "@/lib/cloud.functions";
import { t, type Lang } from "@/lib/i18n";
import { type Driver } from "@/lib/types";

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
  const L = (kk: string, ru: string) => (lang === "kk" ? kk : ru);
  const auth = useServerFn(cloudAuth);
  const [phone, setPhone] = useState("+7");
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [needName, setNeedName] = useState(false);
  const [pending, setPending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalized = normalizePhone(phone);
  const local = drivers.find((d) => d.phone === normalized);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (normalized.length < 12) return setError(t("badPhone", lang));
    if (needName && !name.trim()) return setError(t("needName", lang));
    if (!needName && !/^\d{4}$/.test(pin)) return setError(t("badPin", lang));
    setBusy(true);
    try {
      const r = await auth({
        data: { phone: normalized, pin: needName ? "" : pin, ...(needName ? { name } : {}) },
      });
      if (r.status === "ok") return onAuth({ ...r.driver, pin }, !local);
      if (r.status === "need_name") return setNeedName(true);
      if (r.status === "pending") return setPending(true);
      if (r.status === "blocked") return setError(L("Аккаунт бұғатталған", "Аккаунт заблокирован"));
      if (r.status === "wrong_pin") return setError(t("wrongPin", lang));
      setError(L("Қате, қайталаңыз", "Ошибка, попробуйте ещё раз"));
    } catch {
      // Offline: allow drivers who already signed in on this phone.
      if (local && local.pin && local.pin === pin) return onAuth(local, false);
      setError(L("Интернет жоқ", "Нет интернета"));
    } finally {
      setBusy(false);
    }
  }

  if (pending) {
    return (
      <div className="mt-10 space-y-4">
        <h1 className="text-2xl font-extrabold tracking-tight">
          {L("Өтінім жіберілді", "Заявка отправлена")}
        </h1>
        <p className="text-sm text-mute">
          {L(
            "Әкімші сізге WhatsApp арқылы құпия сөз жібереді. Оны алған соң осы нөмірмен кіріңіз.",
            "Администратор пришлёт вам пароль в WhatsApp. Получив его, войдите с этим номером.",
          )}
        </p>
        <button
          onClick={() => {
            setPending(false);
            setNeedName(false);
            setPin("");
          }}
          className="min-h-14 w-full rounded-2xl bg-gold text-base font-bold text-ink"
        >
          {L("Құпия сөзбен кіру", "Войти с паролем")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-10 space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{t("authTitle", lang)}</h1>
        <p className="mt-1 text-sm text-mute">
          {needName
            ? L("Жаңа нөмір. Атыңызды енгізіп, өтінім жіберіңіз.", "Новый номер. Введите имя и отправьте заявку.")
            : L("Әкімші WhatsApp-қа жіберген құпия сөзді енгізіңіз.", "Введите пароль, который админ прислал в WhatsApp.")}
        </p>
      </div>

      <label className="block">
        <span className="num text-[10px] uppercase tracking-[0.2em] text-dim">{t("phone", lang)}</span>
        <input
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setNeedName(false);
          }}
          inputMode="tel"
          autoComplete="tel"
          placeholder="+7 701 000 00 00"
          className="num mt-1.5 min-h-14 w-full rounded-xl bg-panel px-4 text-lg ring-1 ring-edge outline-none placeholder:text-dim focus:ring-2 focus:ring-ice"
        />
      </label>

      {needName ? (
        <label className="block animate-slide-in">
          <span className="num text-[10px] uppercase tracking-[0.2em] text-dim">{t("name", lang)}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 min-h-14 w-full rounded-xl bg-panel px-4 text-lg ring-1 ring-edge outline-none focus:ring-2 focus:ring-ice"
          />
        </label>
      ) : (
        <label className="block">
          <span className="num text-[10px] uppercase tracking-[0.2em] text-dim">
            {L("Құпия сөз (4 сан)", "Пароль (4 цифры)")}
          </span>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            placeholder="••••"
            className="num mt-1.5 min-h-14 w-full rounded-xl bg-panel px-4 text-2xl tracking-[0.5em] ring-1 ring-edge outline-none placeholder:text-dim focus:ring-2 focus:ring-ice"
          />
        </label>
      )}

      {error && <p className="text-sm font-semibold text-lava">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="min-h-14 w-full rounded-2xl bg-gold text-base font-bold text-ink active:scale-[0.99] disabled:opacity-60"
      >
        {busy ? "…" : needName ? L("Өтінім жіберу", "Отправить заявку") : t("enter", lang)}
      </button>

      {!needName && (
        <button
          type="button"
          onClick={() => setNeedName(true)}
          className="min-h-12 w-full rounded-2xl bg-frost text-sm font-semibold text-pale ring-1 ring-edge"
        >
          {L("Құпия сөз жоқ — тіркелу", "Нет пароля — зарегистрироваться")}
        </button>
      )}
    </form>
  );
}
