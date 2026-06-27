"use client";

import Link from "next/link";
import { COLOR_MAP } from "@/lib/constants";
import { translateForm } from "@/lib/i18n";
import type { FormComponent } from "@/lib/types";
import { useLocale } from "./LocaleProvider";

interface FormCardProps {
  form: FormComponent;
}

export function FormCard({ form }: FormCardProps) {
  const { locale, t } = useLocale();
  const translated = translateForm(form, locale);
  const gradient = COLOR_MAP[form.color] ?? COLOR_MAP.slate;
  const fieldLabel =
    translated.fields.length === 1 ? t.common.field : t.common.fields;

  return (
    <Link
      href={`/forms/${form.id}`}
      className="group block rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-zinc-300 transition-all"
    >
      <div className={`h-2 bg-gradient-to-r ${gradient}`} />
      <div className="p-6">
        <div className="flex items-start gap-4">
          <span className="text-3xl">{form.icon}</span>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-zinc-900 group-hover:text-zinc-700 transition-colors">
              {translated.title}
            </h2>
            {translated.description && (
              <p className="mt-1 text-sm text-zinc-500 line-clamp-2">
                {translated.description}
              </p>
            )}
            <p className="mt-3 text-xs text-zinc-400">
              {translated.fields.length} {fieldLabel}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
