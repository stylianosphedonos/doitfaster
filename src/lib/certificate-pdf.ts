import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { buildCertificateHtml } from "./certificate-html";
import type { FormValues } from "./types";

function findCertificateElement(root: ParentNode): HTMLElement {
  const element = root.querySelector(".certificate-doc");
  if (!element) {
    throw new Error("Certificate preview element not found");
  }
  return element as HTMLElement;
}

async function renderCertificatePdf(element: HTMLElement): Promise<jsPDF> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 0;
  const contentWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * contentWidth) / canvas.width;
  const yOffset = (pageHeight - imgHeight) / 2;

  pdf.addImage(
    imgData,
    "PNG",
    margin,
    Math.max(margin, yOffset),
    contentWidth,
    imgHeight
  );

  return pdf;
}

export async function generateCertificatePdfFromElement(
  root: HTMLElement
): Promise<jsPDF> {
  return renderCertificatePdf(findCertificateElement(root));
}

export async function generateCertificatePdf(
  values: FormValues
): Promise<jsPDF> {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "0";
  container.style.top = "0";
  container.style.width = "1123px";
  container.style.zIndex = "-1";
  container.style.opacity = "0";
  container.style.pointerEvents = "none";
  container.style.overflow = "hidden";
  container.innerHTML = buildCertificateHtml(values);
  document.body.appendChild(container);

  try {
    return await renderCertificatePdf(findCertificateElement(container));
  } finally {
    document.body.removeChild(container);
  }
}

export async function downloadCertificatePdf(
  values: FormValues,
  filename = "certificate"
): Promise<void> {
  const doc = await generateCertificatePdf(values);
  doc.save(`${filename}.pdf`);
}

export async function getCertificatePdfBlobUrlFromElement(
  root: HTMLElement
): Promise<string> {
  const doc = await generateCertificatePdfFromElement(root);
  const blob = doc.output("blob");
  return URL.createObjectURL(blob);
}

export async function getCertificatePdfBlobUrl(
  values: FormValues
): Promise<string> {
  const doc = await generateCertificatePdf(values);
  const blob = doc.output("blob");
  return URL.createObjectURL(blob);
}
