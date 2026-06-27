import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  buildBusinessDocHtml,
  type BusinessDocKind,
} from "./business-doc-html";
import type { FormValues } from "./types";

function findBusinessDocElement(root: ParentNode): HTMLElement {
  const element = root.querySelector(".business-doc");
  if (!element) {
    throw new Error("Business document preview element not found");
  }
  return element as HTMLElement;
}

async function renderBusinessDocPdf(element: HTMLElement): Promise<jsPDF> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const contentWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * contentWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = margin;

  pdf.addImage(imgData, "PNG", margin, position, contentWidth, imgHeight);
  heightLeft -= pageHeight - margin * 2;

  while (heightLeft > 0) {
    position = margin - (imgHeight - heightLeft);
    pdf.addPage();
    pdf.addImage(imgData, "PNG", margin, position, contentWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;
  }

  return pdf;
}

export async function generateBusinessDocPdfFromElement(
  root: HTMLElement
): Promise<jsPDF> {
  return renderBusinessDocPdf(findBusinessDocElement(root));
}

export async function generateBusinessDocPdf(
  kind: BusinessDocKind,
  values: FormValues
): Promise<jsPDF> {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "0";
  container.style.top = "0";
  container.style.width = "794px";
  container.style.zIndex = "-1";
  container.style.opacity = "0";
  container.style.pointerEvents = "none";
  container.style.overflow = "hidden";
  container.innerHTML = buildBusinessDocHtml(kind, values);
  document.body.appendChild(container);

  try {
    return await renderBusinessDocPdf(findBusinessDocElement(container));
  } finally {
    document.body.removeChild(container);
  }
}

export async function downloadBusinessDocPdf(
  kind: BusinessDocKind,
  values: FormValues,
  filename?: string
): Promise<void> {
  const doc = await generateBusinessDocPdf(kind, values);
  doc.save(`${filename ?? kind}.pdf`);
}

export async function getBusinessDocPdfBlobUrlFromElement(
  root: HTMLElement
): Promise<string> {
  const doc = await generateBusinessDocPdfFromElement(root);
  const blob = doc.output("blob");
  return URL.createObjectURL(blob);
}

export async function getBusinessDocPdfBlobUrl(
  kind: BusinessDocKind,
  values: FormValues
): Promise<string> {
  const doc = await generateBusinessDocPdf(kind, values);
  const blob = doc.output("blob");
  return URL.createObjectURL(blob);
}
