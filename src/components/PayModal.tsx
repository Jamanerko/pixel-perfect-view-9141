import { useState } from "react";
import { formatKzt, t, type Lang } from "@/lib/i18n";
import { ADMIN_PHONE, PRO_PRICE } from "@/lib/types";

const BANKS = ["Kaspi Gold", "Halyk Bank", "Freedom Bank"];

export function PayModal({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    void navigator.clipboard?.writeText(ADMIN_PHONE).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/80 px-4 pb-4 backdrop-blur-sm">
      <div className="w-full max-w-md animate-slide-in rounded-2xl bg-frost p-5 ring-1 ring-edge">
        <p className="num text-[11px] uppercase tracking-[0.18em] text-mute">
          {t("payTitle", lang)}
        </p>
        <p className="num mt-2 text-3xl font-bold text-gold">{formatKzt(PRO_PRICE)} ₸</p>
        <p className="mt-1 text-sm text-mute">{t("payHint", lang)}</p>

        <div className="mt-4 space-y-2">
          {BANKS.map((b) => (
            <div
              key={b}
              className="flex items-center justify-between rounded-xl bg-ink/50 px-4 py-3 ring-1 ring-edge"
            >
              <span className="text-sm font-semibold">{b}</span>
              <span className="num text-sm text-gold">{ADMIN_PHONE}</span>
            </div>
          ))}
        </div>

        <button
          onClick={copy}
          className="mt-3 min-h-14 w-full rounded-xl bg-ice/15 text-sm font-bold text-ice ring-1 ring-ice/30"
        >
          {copied ? t("copied", lang) : ADMIN_PHONE}
        </button>
        <button
          onClick={onClose}
          className="mt-2 min-h-12 w-full rounded-xl bg-panel text-sm font-semibold text-mute ring-1 ring-edge"
        >
          {t("close", lang)}
        </button>
      </div>
    </div>
  );
}
