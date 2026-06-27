"use client";

import type { Locale } from "@/lib/i18n";
import { buildCertificateHtml } from "@/lib/certificate-html";
import type { FormValues } from "@/lib/types";
import { forwardRef } from "react";

interface CertificatePreviewProps {
  values: FormValues;
  locale?: Locale;
}

export const CertificatePreview = forwardRef<
  HTMLDivElement,
  CertificatePreviewProps
>(function CertificatePreview({ values, locale = "en" }, ref) {
  return (
    <div
      ref={ref}
      className="overflow-auto rounded-xl border border-zinc-200 bg-zinc-100 p-4"
      dangerouslySetInnerHTML={{ __html: buildCertificateHtml(values, locale) }}
    />
  );
});
