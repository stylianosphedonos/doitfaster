import type { Locale } from "./i18n";
import {
  downloadBusinessDocPdf,
  generateBusinessDocPdf,
  generateBusinessDocPdfFromElement,
  getBusinessDocPdfBlobUrl,
  getBusinessDocPdfBlobUrlFromElement,
} from "./business-doc-pdf";
import type { FormValues } from "./types";

export async function generateQuotationPdfFromElement(root: HTMLElement) {
  return generateBusinessDocPdfFromElement(root);
}

export async function generateQuotationPdf(values: FormValues, locale: Locale = "en") {
  return generateBusinessDocPdf("quotation", values, locale);
}

export async function downloadQuotationPdf(
  values: FormValues,
  filename = "quotation",
  locale: Locale = "en"
) {
  return downloadBusinessDocPdf("quotation", values, filename, locale);
}

export async function getQuotationPdfBlobUrlFromElement(root: HTMLElement) {
  return getBusinessDocPdfBlobUrlFromElement(root);
}

export async function getQuotationPdfBlobUrl(values: FormValues, locale: Locale = "en") {
  return getBusinessDocPdfBlobUrl("quotation", values, locale);
}
