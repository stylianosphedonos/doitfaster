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

export async function generateQuotationPdf(values: FormValues) {
  return generateBusinessDocPdf("quotation", values);
}

export async function downloadQuotationPdf(values: FormValues, filename = "quotation") {
  return downloadBusinessDocPdf("quotation", values, filename);
}

export async function getQuotationPdfBlobUrlFromElement(root: HTMLElement) {
  return getBusinessDocPdfBlobUrlFromElement(root);
}

export async function getQuotationPdfBlobUrl(values: FormValues) {
  return getBusinessDocPdfBlobUrl("quotation", values);
}
