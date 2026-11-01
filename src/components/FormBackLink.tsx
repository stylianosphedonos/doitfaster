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
      className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 mb-8 transition-colors group"
    >
      <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      {t.form.backToForms}
    </Link>
  );
}
