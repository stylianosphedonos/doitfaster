import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { buildLessonPlanHtml } from "./lesson-plan-html";
import type { FormValues } from "./types";

function findLessonPlanElement(root: ParentNode): HTMLElement {
  const element = root.querySelector(".lesson-plan-doc");
  if (!element) {
    throw new Error("Lesson plan preview element not found");
  }
  return element as HTMLElement;
}

async function renderLessonPlanPdf(element: HTMLElement): Promise<jsPDF> {
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

export async function generateLessonPlanPdfFromElement(
  root: HTMLElement
): Promise<jsPDF> {
  return renderLessonPlanPdf(findLessonPlanElement(root));
}

export async function generateLessonPlanPdf(values: FormValues): Promise<jsPDF> {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "0";
  container.style.top = "0";
  container.style.width = "794px";
  container.style.zIndex = "-1";
  container.style.opacity = "0";
  container.style.pointerEvents = "none";
  container.style.overflow = "hidden";
  container.innerHTML = buildLessonPlanHtml(values);
  document.body.appendChild(container);

  try {
    return await renderLessonPlanPdf(findLessonPlanElement(container));
  } finally {
    document.body.removeChild(container);
  }
}

export async function downloadLessonPlanPdf(
  values: FormValues,
  filename = "sxedio-mathimatos"
): Promise<void> {
  const doc = await generateLessonPlanPdf(values);
  doc.save(`${filename}.pdf`);
}

export async function getLessonPlanPdfBlobUrlFromElement(
  root: HTMLElement
): Promise<string> {
  const doc = await generateLessonPlanPdfFromElement(root);
  const blob = doc.output("blob");
  return URL.createObjectURL(blob);
}

export async function getLessonPlanPdfBlobUrl(values: FormValues): Promise<string> {
  const doc = await generateLessonPlanPdf(values);
  const blob = doc.output("blob");
  return URL.createObjectURL(blob);
}
