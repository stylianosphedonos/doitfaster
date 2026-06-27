"use client";

import { BusinessDocPreview } from "@/components/BusinessDocPreview";
import type { FormValues } from "@/lib/types";
import { forwardRef } from "react";

interface InvoicePreviewProps {
  values: FormValues;
}

export const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(
  function InvoicePreview({ values }, ref) {
    return <BusinessDocPreview ref={ref} kind="invoice" values={values} />;
  }
);
