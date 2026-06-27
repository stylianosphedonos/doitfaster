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

export async function generateReceiptPdf(values: FormValues) {
  return generateBusinessDocPdf("receipt", values);
}

export async function downloadReceiptPdf(values: FormValues, filename = "receipt") {
  return downloadBusinessDocPdf("receipt", values, filename);
}

export async function getReceiptPdfBlobUrlFromElement(root: HTMLElement) {
  return getBusinessDocPdfBlobUrlFromElement(root);
}

export async function getReceiptPdfBlobUrl(values: FormValues) {
  return getBusinessDocPdfBlobUrl("receipt", values);
}
