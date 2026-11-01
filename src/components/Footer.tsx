"use client";

import { useLocale } from "./LocaleProvider";

export function Footer() {
  const { locale } = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-200/80 bg-white/50 backdrop-blur-sm mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <p>
            © {year} FormDocs.{" "}
            {locale === "el" ? "Με επιφύλαξη παντός δικαιώματος." : "All rights reserved."}
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {locale === "el" ? "Σύστημα ενεργό" : "System operational"}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
