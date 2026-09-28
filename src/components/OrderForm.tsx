import { useEffect, useState } from "react";
import { t, type Lang } from "@/lib/i18n";
import { usePersistentState } from "@/lib/storage";
import { useVoiceInput } from "@/lib/use-voice-input";

type Draft = { address: string; phone: string; paid: boolean; amount: string; note: string };

const EMPTY: Draft = { address: "", phone: "+7", paid: false, amount: "", note: "" };

export function OrderForm({
  lang,
  blocked,
  onSubmit,
}: {
  lang: Lang;
  blocked: boolean;
  onSubmit: (d: { address: string; phone: string; paid: boolean; amount: number; note: string }) => void;
}) {
  const [draft, setDraft] = usePersistentState<Draft>("ro.draft", EMPTY);
  const [error, setError] = useState<string | null>(null);
  const { listening, supported, toggle } = useVoiceInput(
    lang === "kk" ? "kk-KZ" : "ru-RU",
    (text) => setDraft((d) => ({ ...d, address: `${d.address} ${text}`.trim() })),
  );

  useEffect(() => setError(null), [draft]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.address.trim()) return setError(t("needAddress", lang));
    if (draft.phone.replace(/\D/g, "").length < 11) return setError(t("needPhone", lang));
    onSubmit({
      address: draft.address.trim(),
      phone: draft.phone.trim(),
      paid: draft.paid,
      amount: draft.paid ? 0 : Number(draft.amount.replace(/\D/g, "")) || 0,
      note: draft.note.trim(),
    });
    setDraft(EMPTY);
  }

  const field =
    "min-h-14 w-full rounded-xl bg-ink/50 px-4 text-base ring-1 ring-edge outline-none placeholder:text-dim focus:ring-2 focus:ring-ice";

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl bg-frost/50 p-4 ring-1 ring-edge backdrop-blur-xl"
    >
      <p className="num text-[11px] uppercase tracking-[0.18em] text-mute">
        {t("newOrder", lang)}
      </p>

      <div className="mt-3 space-y-2.5">
        <div className="flex gap-2">
          <input
            value={draft.address}
            onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
            placeholder={t("address", lang)}
            className={field}
          />
          <button
            type="button"
            onClick={toggle}
            aria-label={t("voice", lang)}
            className={`grid size-14 shrink-0 place-items-center rounded-xl text-xl ring-1 ${
              listening
                ? "animate-soft-pulse bg-lava/20 text-lava ring-lava/40"
                : "bg-gold/15 text-gold ring-gold/30"
            }`}
          >
            🎙
          </button>
        </div>
        {listening && <p className="num text-[11px] text-lava">{t("listening", lang)}</p>}
        {!supported && (
          <p className="num text-[11px] text-dim">{t("voiceUnsupported", lang)}</p>
        )}

        <input
          value={draft.phone}
          onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
          inputMode="tel"
          placeholder={t("recipientPhone", lang)}
          className={`num ${field}`}
        />

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setDraft((d) => ({ ...d, paid: true }))}
            className={`min-h-14 rounded-xl text-sm font-bold ring-1 ${
              draft.paid
                ? "bg-mint/20 text-mint ring-mint/40"
                : "bg-ink/50 text-dim ring-edge"
            }`}
          >
            🟢 {t("paid", lang)}
          </button>
          <button
            type="button"
            onClick={() => setDraft((d) => ({ ...d, paid: false }))}
            className={`min-h-14 rounded-xl text-sm font-bold ring-1 ${
              !draft.paid
                ? "bg-lava/20 text-lava ring-lava/40"
                : "bg-ink/50 text-dim ring-edge"
            }`}
          >
            🔴 {t("pending", lang)}
          </button>
        </div>

        {!draft.paid && (
          <input
            value={draft.amount}
            onChange={(e) =>
              setDraft((d) => ({ ...d, amount: e.target.value.replace(/\D/g, "") }))
            }
            inputMode="numeric"
            placeholder={t("amount", lang)}
            className={`num ${field} text-gold`}
          />
        )}

        <input
          value={draft.note}
          onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
          placeholder={`${t("note", lang)} — ${t("notePh", lang)}`}
          className={field}
        />
      </div>

      {error && <p className="mt-2 text-sm font-semibold text-lava">{error}</p>}

      <button
        type="submit"
        disabled={blocked}
        className="mt-3 min-h-14 w-full rounded-xl bg-gold text-sm font-bold text-ink disabled:bg-panel disabled:text-dim"
      >
        {blocked ? t("trialOver", lang) : t("addOrder", lang)}
      </button>

      <p className="num mt-2 text-center text-[10px] leading-relaxed text-dim">
        {t("savedLocally", lang)}
      </p>
    </form>
  );
}
