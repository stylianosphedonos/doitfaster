import {
  buildPhysicsLessonPlanHtml,
  type PhysicsLessonPlanActivityBlock,
  type PhysicsLessonPlanDoc,
} from "./physics-lesson-plan-html";
import type { FormValues } from "./types";

function val(values: FormValues, key: string): string {
  return values[key]?.trim() ?? "";
}

function lines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s•\-–*]+/, "").trim())
    .filter(Boolean);
}

function parseMinutes(raw: string, fallback: number): number {
  const match = raw.match(/\d+/);
  if (!match) return fallback;
  const n = Number(match[0]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function activityBlock(
  values: FormValues,
  prefix: "activity1" | "activity2"
): PhysicsLessonPlanActivityBlock | null {
  const objective = val(values, `${prefix}Objective`);
  const activityPath = val(values, `${prefix}Path`);
  const assessment = val(values, `${prefix}Assessment`);
  const teacherRole = val(values, `${prefix}TeacherRole`);
  const materials = val(values, `${prefix}Materials`);

  if (!objective && !activityPath && !assessment && !teacherRole && !materials) {
    return null;
  }

  return { objective, activityPath, assessment, teacherRole, materials };
}

/** Maps the ΣΧΕΔΙΟ-ΜΑΘΗΜΑΤΟΣ form into the inspector lesson-plan document. */
export function formValuesToLessonPlanDoc(
  values: FormValues
): PhysicsLessonPlanDoc {
  const classLabel = val(values, "class");
  const bookName = val(values, "bookName");
  const activityBlocks = (
    ["activity1", "activity2"] as const
  )
    .map((prefix) => activityBlock(values, prefix))
    .filter((block): block is PhysicsLessonPlanActivityBlock => block !== null);

  return {
    title: val(values, "title") || "Σχέδιο Μαθήματος",
    className: classLabel || "—",
    classLabel: classLabel || "—",
    bookName: bookName || "—",
    pages: [],
    durationMinutes: parseMinutes(val(values, "durationMinutes"), 40),
    unit: val(values, "unit"),
    chapter: val(values, "chapter"),
    successIndicators: lines(val(values, "successIndicators")),
    emphasisPoints: val(values, "emphasisPoints"),
    prerequisites: val(values, "prerequisites"),
    hook: val(values, "hook"),
    hookMinutes: parseMinutes(val(values, "hookMinutes"), 5),
    activityBlocks:
      activityBlocks.length > 0
        ? activityBlocks
        : [
            {
              objective: "",
              activityPath: "",
              assessment: "",
              teacherRole: "",
              materials: "",
            },
          ],
    closure: val(values, "closure"),
    homework: val(values, "homework"),
    materialsSummary: "",
    bibliography: val(values, "bibliography"),
    teacherName: val(values, "teacherName"),
    lessonNumber: val(values, "lessonNumber"),
    date: val(values, "date") || undefined,
  };
}

export function buildLessonPlanHtml(values: FormValues): string {
  return buildPhysicsLessonPlanHtml(formValuesToLessonPlanDoc(values));
}
