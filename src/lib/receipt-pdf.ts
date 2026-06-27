import type { Locale } from "./i18n";
import {
  downloadBusinessDocPdf,
  generateBusinessDocPdf,
  generateBusinessDocPdfFromElement,
  getBusinessDocPdfBlobUrl,
  getBusinessDocPdfBlobUrlFromElement,
} from "./business-doc-pdf";
import type { FormValues } from "./types";

export async function generateReceiptPdfFromElement(root: HTMLElement) {
  return generateBusinessDocPdfFromElement(root);
}

export async function generateReceiptPdf(values: FormValues, locale: Locale = "en") {
  return generateBusinessDocPdf("receipt", values, locale);
}

export async function downloadReceiptPdf(
  values: FormValues,
  filename = "receipt",
  locale: Locale = "en"
) {
  return downloadBusinessDocPdf("receipt", values, filename, locale);
}

export async function getReceiptPdfBlobUrlFromElement(root: HTMLElement) {
  return getBusinessDocPdfBlobUrlFromElement(root);
}

export async function getReceiptPdfBlobUrl(values: FormValues, locale: Locale = "en") {
  return getBusinessDocPdfBlobUrl("receipt", values, locale);
}
