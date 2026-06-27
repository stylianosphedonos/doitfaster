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

export async function generateInvoicePdf(values: FormValues) {
  return generateBusinessDocPdf("invoice", values);
}

export async function downloadInvoicePdf(values: FormValues, filename = "invoice") {
  return downloadBusinessDocPdf("invoice", values, filename);
}

export async function getInvoicePdfBlobUrlFromElement(root: HTMLElement) {
  return getBusinessDocPdfBlobUrlFromElement(root);
}

export async function getInvoicePdfBlobUrl(values: FormValues) {
  return getBusinessDocPdfBlobUrl("invoice", values);
}
