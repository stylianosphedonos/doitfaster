"use client";

import Link from "next/link";
import { useLocale } from "./LocaleProvider";

export function HomeEmptyState() {
  const { t } = useLocale();

  return (
    <div className="text-center py-16 sm:py-24 px-6 border-2 border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-100 mb-6">
        <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-zinc-700 mb-2">{t.home.noGroups}</h3>
      <p className="text-zinc-500 text-sm max-w-sm mx-auto mb-6">{t.home.noGroupsHint}</p>
      <Link 
        href="/admin"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        {t.nav.admin}
      </Link>
    </div>
  );
}
