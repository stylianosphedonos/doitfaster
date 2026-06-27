"use client";

import { LOCALES } from "@/lib/i18n";
import { useLocale } from "./LocaleProvider";

export function LanguageSwitch() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      className="flex items-center rounded-lg border border-zinc-300 overflow-hidden text-xs"
      role="group"
      aria-label={t.language.label}
    >
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={`px-2.5 py-1.5 font-medium transition-colors ${
            locale === code
              ? "bg-zinc-900 text-white"
              : "bg-white text-zinc-600 hover:bg-zinc-50"
          }`}
          aria-pressed={locale === code}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
