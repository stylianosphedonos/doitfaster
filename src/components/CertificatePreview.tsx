"use client";

import { buildCertificateHtml } from "@/lib/certificate-html";
import type { FormValues } from "@/lib/types";
import { forwardRef } from "react";

interface CertificatePreviewProps {
  values: FormValues;
}

export const CertificatePreview = forwardRef<
  HTMLDivElement,
  CertificatePreviewProps
>(function CertificatePreview({ values }, ref) {
  return (
    <div
      ref={ref}
      className="overflow-auto rounded-xl border border-zinc-200 bg-zinc-100 p-4"
      dangerouslySetInnerHTML={{ __html: buildCertificateHtml(values) }}
    />
  );
});
