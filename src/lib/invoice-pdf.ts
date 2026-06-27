import type { Locale } from "./i18n";
import {
  downloadBusinessDocPdf,
  generateBusinessDocPdf,
  generateBusinessDocPdfFromElement,
  getBusinessDocPdfBlobUrl,
  getBusinessDocPdfBlobUrlFromElement,
} from "./business-doc-pdf";
import type { FormValues } from "./types";

export async function generateInvoicePdfFromElement(root: HTMLElement) {
  return generateBusinessDocPdfFromElement(root);
}

export async function generateInvoicePdf(values: FormValues, locale: Locale = "en") {
  return generateBusinessDocPdf("invoice", values, locale);
}

export async function downloadInvoicePdf(
  values: FormValues,
  filename = "invoice",
  locale: Locale = "en"
) {
  return downloadBusinessDocPdf("invoice", values, filename, locale);
}

export async function getInvoicePdfBlobUrlFromElement(root: HTMLElement) {
  return getBusinessDocPdfBlobUrlFromElement(root);
}

export async function getInvoicePdfBlobUrl(values: FormValues, locale: Locale = "en") {
  return getBusinessDocPdfBlobUrl("invoice", values, locale);
}
