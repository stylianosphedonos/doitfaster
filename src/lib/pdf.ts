import jsPDF from "jspdf";
import type { FormComponent, FormValues } from "./types";

export function generateFormPdf(
  form: FormComponent,
  values: FormValues
): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 25;

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(form.title, margin, y);
  y += 10;

  if (form.description) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    const descLines = doc.splitTextToSize(form.description, contentWidth);
    doc.text(descLines, margin, y);
    y += descLines.length * 5 + 5;
  }

  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;
  doc.setTextColor(0);

  for (const field of form.fields) {
    if (y > 260) {
      doc.addPage();
      y = 25;
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60);
    doc.text(field.label.toUpperCase(), margin, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(0);
    doc.setFontSize(12);
    const value = values[field.id]?.trim() || "—";
    const lines = doc.splitTextToSize(value, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 7 + 10;
  }

  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    `Generated on ${new Date().toLocaleDateString()}`,
    margin,
    footerY
  );

  return doc;
}

export function getPdfBlobUrl(form: FormComponent, values: FormValues): string {
  const doc = generateFormPdf(form, values);
  const blob = doc.output("blob");
  return URL.createObjectURL(blob);
}

export function downloadPdf(
  form: FormComponent,
  values: FormValues,
  filename?: string
): void {
  const doc = generateFormPdf(form, values);
  const safeName = (filename ?? form.title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  doc.save(`${safeName || "form"}.pdf`);
}
