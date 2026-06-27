"use client";

import type { Locale } from "@/lib/i18n";
import { buildBusinessDocHtml, type BusinessDocKind } from "@/lib/business-doc-html";
import type { FormValues } from "@/lib/types";
import { forwardRef } from "react";

interface BusinessDocPreviewProps {
  kind: BusinessDocKind;
  values: FormValues;
  locale?: Locale;
}

export const BusinessDocPreview = forwardRef<HTMLDivElement, BusinessDocPreviewProps>(
  function BusinessDocPreview({ kind, values, locale = "en" }, ref) {
    return (
      <div
        ref={ref}
        className="overflow-auto rounded-xl border border-zinc-200 bg-zinc-100 p-4"
        dangerouslySetInnerHTML={{ __html: buildBusinessDocHtml(kind, values, locale) }}
      />
    );
  }
);
