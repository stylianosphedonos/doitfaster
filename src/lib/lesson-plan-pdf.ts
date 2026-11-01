import { formValuesToLessonPlanDoc } from "./lesson-plan-html";
import {
  downloadPhysicsLessonPlanPdf,
  generatePhysicsLessonPlanPdf,
  generatePhysicsLessonPlanPdfFromElement,
  getPhysicsLessonPlanPdfBlobUrl,
  getPhysicsLessonPlanPdfBlobUrlFromElement,
} from "./physics-lesson-plan-pdf";
import type { FormValues } from "./types";

export async function generateLessonPlanPdfFromElement(
  root: HTMLElement
): Promise<Awaited<ReturnType<typeof generatePhysicsLessonPlanPdfFromElement>>> {
  return generatePhysicsLessonPlanPdfFromElement(root);
}

export async function generateLessonPlanPdf(values: FormValues) {
  return generatePhysicsLessonPlanPdf(formValuesToLessonPlanDoc(values));
}

export async function downloadLessonPlanPdf(
  values: FormValues,
  filename = "sxedio-mathimatos"
): Promise<void> {
  await downloadPhysicsLessonPlanPdf(
    formValuesToLessonPlanDoc(values),
    filename
  );
}

export async function getLessonPlanPdfBlobUrlFromElement(
  root: HTMLElement
): Promise<string> {
  return getPhysicsLessonPlanPdfBlobUrlFromElement(root);
}

export async function getLessonPlanPdfBlobUrl(
  values: FormValues
): Promise<string> {
  return getPhysicsLessonPlanPdfBlobUrl(formValuesToLessonPlanDoc(values));
}
