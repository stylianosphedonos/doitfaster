"use client";

import Link from "next/link";
import { COLOR_MAP } from "@/lib/constants";
import { translateGroup } from "@/lib/i18n";
import type { FormGroup } from "@/lib/types";
import { useLocale } from "./LocaleProvider";

interface GroupPageHeaderProps {
  group: FormGroup;
}

export function GroupPageHeader({ group }: GroupPageHeaderProps) {
  const { locale, t } = useLocale();
  const translated = translateGroup(group, locale);
  const gradient = COLOR_MAP[group.color] ?? COLOR_MAP.slate;

  return (
    <>
      {/* Breadcrumb */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 mb-8 transition-colors group"
      >
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        {t.group.backToGroups}
      </Link>

      {/* Group Header */}
      <div className="mb-10 rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
        <div className={`h-2 bg-gradient-to-r ${gradient}`} />
        <div className="p-6 sm:p-8 flex items-start gap-5">
          <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-zinc-50 flex items-center justify-center">
            <span className="text-4xl">{group.icon}</span>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">{translated.title}</h1>
            {translated.description && (
              <p className="mt-2 text-zinc-500 text-lg">{translated.description}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export function GroupEmptyState() {
  const { t } = useLocale();

  return (
    <div className="text-center py-16 sm:py-20 px-6 border-2 border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-100 mb-5">
        <svg className="w-7 h-7 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-zinc-700 mb-2">{t.group.noForms}</h3>
      <p className="text-zinc-500 text-sm max-w-sm mx-auto">{t.group.noFormsHint}</p>
    </div>
  );
}
