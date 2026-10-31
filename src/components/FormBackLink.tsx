"use client";

import Link from "next/link";
import { useLocale } from "./LocaleProvider";

interface FormBackLinkProps {
  href?: string;
}

export function FormBackLink({ href = "/" }: FormBackLinkProps) {
  const { t } = useLocale();

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-6 transition-colors"
    >
      {t.form.backToForms}
    </Link>
  );
}
