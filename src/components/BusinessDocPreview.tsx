"use client";

import { buildBusinessDocHtml, type BusinessDocKind } from "@/lib/business-doc-html";
import type { FormValues } from "@/lib/types";
import { forwardRef } from "react";

interface BusinessDocPreviewProps {
  kind: BusinessDocKind;
  values: FormValues;
}

export const BusinessDocPreview = forwardRef<HTMLDivElement, BusinessDocPreviewProps>(
  function BusinessDocPreview({ kind, values }, ref) {
    return (
      <div
        ref={ref}
        className="overflow-auto rounded-xl border border-zinc-200 bg-zinc-100 p-4"
        dangerouslySetInnerHTML={{ __html: buildBusinessDocHtml(kind, values) }}
      />
    );
  }
);
