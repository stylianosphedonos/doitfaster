"use client";

import Link from "next/link";
import { useLocale } from "./LocaleProvider";

export function FormBackLink() {
  const { t } = useLocale();

  return (
    <Link
      href="/"
      className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-6 transition-colors"
    >
      {t.form.backToForms}
    </Link>
  );
}
