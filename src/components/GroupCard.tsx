"use client";

import Link from "next/link";
import { COLOR_MAP } from "@/lib/constants";
import { translateGroup } from "@/lib/i18n";
import type { FormGroup } from "@/lib/types";
import { useLocale } from "./LocaleProvider";

interface GroupCardProps {
  group: FormGroup;
  formCount: number;
}

export function GroupCard({ group, formCount }: GroupCardProps) {
  const { locale, t } = useLocale();
  const translated = translateGroup(group, locale);
  const gradient = COLOR_MAP[group.color] ?? COLOR_MAP.slate;
  const formLabel = formCount === 1 ? t.common.form : t.common.forms;

  return (
    <Link
      href={`/groups/${group.id}`}
      className="group relative block rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm hover:shadow-lg hover:border-zinc-300 hover:-translate-y-1 transition-all duration-300"
    >
      <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-zinc-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <span className="text-3xl">{group.icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-zinc-900 group-hover:text-zinc-700 transition-colors">
              {translated.title}
            </h2>
            {translated.description && (
              <p className="mt-1.5 text-sm text-zinc-500 line-clamp-2 leading-relaxed">
                {translated.description}
              </p>
            )}
            <div className="mt-4 flex items-center justify-between">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600">
                {formCount} {formLabel}
              </span>
              <span className="text-zinc-400 group-hover:text-zinc-600 transition-colors">
                →
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
