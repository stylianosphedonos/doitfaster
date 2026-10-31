export interface PhysicsLessonPlanActivityBlock {
  objective: string;
  activityPath: string;
  assessment: string;
  teacherRole: string;
  materials: string;
}

export interface PhysicsLessonPlanDoc {
  title: string;
  className: string;
  classLabel: string;
  bookName: string;
  pages: number[];
  durationMinutes: number;
  unit: string;
  chapter: string;
  successIndicators: string[];
  emphasisPoints: string;
  prerequisites: string;
  hook: string;
  hookMinutes: number;
  activityBlocks: PhysicsLessonPlanActivityBlock[];
  closure: string;
  homework: string;
  materialsSummary: string;
  bibliography: string;
  teacherName?: string;
  lessonNumber?: string;
  date?: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paragraph(text: string): string {
  const value = text.trim();
  if (!value) return `<p class="empty">—</p>`;
  return `<p>${escapeHtml(value)}</p>`;
}

function bullets(items: string[]): string {
  if (!items.length) return `<p class="empty">—</p>`;
  return `<ul>${items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("")}</ul>`;
}

function metaRow(
  leftLabel: string,
  leftValue: string,
  rightLabel: string,
  rightValue: string
): string {
  return `
    <tr>
      <td>
        <span class="label">${escapeHtml(leftLabel)}</span>
        <span class="value">${escapeHtml(leftValue) || "—"}</span>
      </td>
      <td>
        <span class="label">${escapeHtml(rightLabel)}</span>
        <span class="value">${escapeHtml(rightValue) || "—"}</span>
      </td>
    </tr>
  `;
}

function activityTable(
  block: PhysicsLessonPlanActivityBlock,
  index: number
): string {
  return `
    <div class="plan-block" data-block="activity-${index + 1}">
      <table class="activity-table">
        <thead>
          <tr>
            <th>Στόχοι</th>
            <th>Πορεία Δραστηριοτήτων</th>
            <th>Αξιολόγηση (Συντρέχουσα/Διαμορφωτική)</th>
            <th>Ο ρόλος του εκπαιδευτικού / Οργάνωση τάξης</th>
            <th>Μέσα / Υλικά</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="objective-cell">
              <div class="objective-index">Στόχος ${index + 1}</div>
              ${paragraph(block.objective)}
            </td>
            <td>${paragraph(block.activityPath)}</td>
            <td>${paragraph(block.assessment)}</td>
            <td>${paragraph(block.teacherRole)}</td>
            <td>${paragraph(block.materials)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

function sectionBlock(title: string, bodyHtml: string, key: string): string {
  return `
    <div class="plan-block section" data-block="${escapeHtml(key)}">
      <div class="section-title">${escapeHtml(title)}</div>
      ${bodyHtml}
    </div>
  `;
}

/** A4 width / height at 96dpi. */
export const PHYSICS_LESSON_PLAN_A4_WIDTH_PX = 794;
export const PHYSICS_LESSON_PLAN_A4_HEIGHT_PX = 1123;
export const PHYSICS_LESSON_PLAN_PAGE_PADDING_PX = 28;

export function buildPhysicsLessonPlanStyles(): string {
  return `
    .physics-lesson-plan-doc {
      width: ${PHYSICS_LESSON_PLAN_A4_WIDTH_PX}px;
      margin: 0 auto;
      color: #111;
      font-family: "Times New Roman", Times, Georgia, serif;
      font-size: 12px;
      line-height: 1.45;
      box-sizing: border-box;
    }
    .physics-lesson-plan-doc * { box-sizing: border-box; }
    .physics-lesson-plan-doc .plan-source {
      display: none;
    }
    .physics-lesson-plan-doc .plan-pages {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .physics-lesson-plan-doc .plan-page {
      width: ${PHYSICS_LESSON_PLAN_A4_WIDTH_PX}px;
      height: ${PHYSICS_LESSON_PLAN_A4_HEIGHT_PX}px;
      min-height: ${PHYSICS_LESSON_PLAN_A4_HEIGHT_PX}px;
      padding: ${PHYSICS_LESSON_PLAN_PAGE_PADDING_PX}px 32px ${PHYSICS_LESSON_PLAN_PAGE_PADDING_PX + 8}px;
      background: #fff;
      border: 1px solid #e4e4e7;
      overflow: hidden;
      position: relative;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }
    .physics-lesson-plan-doc .plan-page-inner {
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    .physics-lesson-plan-doc h1 {
      margin: 0 0 14px;
      text-align: center;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 0.02em;
    }
    .physics-lesson-plan-doc .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    .physics-lesson-plan-doc .meta-table td {
      width: 50%;
      vertical-align: top;
      padding: 3px 6px 3px 0;
    }
    .physics-lesson-plan-doc .label {
      display: inline;
      font-weight: 700;
      margin-right: 4px;
    }
    .physics-lesson-plan-doc .value { display: inline; }
    .physics-lesson-plan-doc .plan-block {
      margin: 0 0 10px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .physics-lesson-plan-doc .section-title {
      font-weight: 700;
      margin: 0 0 4px;
    }
    .physics-lesson-plan-doc p { margin: 0 0 6px; }
    .physics-lesson-plan-doc ul {
      margin: 0;
      padding-left: 18px;
    }
    .physics-lesson-plan-doc li { margin-bottom: 4px; }
    .physics-lesson-plan-doc .empty { color: #888; }
    .physics-lesson-plan-doc .activity-table {
      width: 100%;
      border-collapse: collapse;
      margin: 0;
      table-layout: fixed;
    }
    .physics-lesson-plan-doc .activity-table th,
    .physics-lesson-plan-doc .activity-table td {
      border: 1px solid #222;
      padding: 7px 6px;
      vertical-align: top;
      font-size: 10.5px;
      line-height: 1.4;
    }
    .physics-lesson-plan-doc .activity-table th {
      background: #f3f4f6;
      font-weight: 700;
      text-align: center;
    }
    .physics-lesson-plan-doc .objective-index {
      font-weight: 700;
      margin-bottom: 4px;
    }
    .physics-lesson-plan-doc .objective-cell { background: #fafafa; }
    .physics-lesson-plan-doc .footer-note {
      margin-top: 4px;
      font-size: 11px;
      color: #333;
    }
    .physics-lesson-plan-doc .page-number {
      position: absolute;
      right: 32px;
      bottom: 12px;
      font-size: 10px;
      color: #666;
    }
  `;
}

export function buildPhysicsLessonPlanHtml(plan: PhysicsLessonPlanDoc): string {
  const today =
    plan.date ??
    new Date().toLocaleDateString("el-GR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  const pages = plan.pages.join(", ");

  const blocks = [
    `<div class="plan-block" data-block="title"><h1>${escapeHtml(
      plan.title || "Σχέδιο Μαθήματος"
    )}</h1></div>`,
    `<div class="plan-block" data-block="meta">
      <table class="meta-table">
        ${metaRow(
          "Καθηγητής/τρια:",
          plan.teacherName ?? "",
          "Ημερομηνία:",
          today
        )}
        ${metaRow(
          "Αρ. Μαθ.:",
          plan.lessonNumber ?? "",
          "Χρόνος:",
          `${plan.durationMinutes} λεπτά`
        )}
        ${metaRow("Τάξη:", plan.classLabel, "Σελίδες βιβλίου:", pages)}
        ${metaRow("Ενότητα:", plan.unit, "Κεφάλαιο:", plan.chapter)}
      </table>
    </div>`,
    sectionBlock(
      "Σκοπός Μαθήματος (Δείκτης/ες Επιτυχίας):",
      bullets(plan.successIndicators),
      "success-indicators"
    ),
    sectionBlock(
      "Σημεία έμφασης (π.χ. Έννοιες, Πειράματα, Δεξιότητες):",
      paragraph(plan.emphasisPoints),
      "emphasis"
    ),
    sectionBlock(
      "Απαραίτητες προϋπάρχουσες γνώσεις και δεξιότητες:",
      paragraph(plan.prerequisites),
      "prerequisites"
    ),
    sectionBlock(
      `Αφόρμηση (${plan.hookMinutes}′):`,
      paragraph(plan.hook),
      "hook"
    ),
    ...plan.activityBlocks.map((block, index) => activityTable(block, index)),
    sectionBlock(
      "Ολοκλήρωση μαθήματος:",
      paragraph(plan.closure),
      "closure"
    ),
    sectionBlock(
      "Εργασία για το σπίτι:",
      paragraph(plan.homework),
      "homework"
    ),
    sectionBlock(
      "Βιβλιογραφία:",
      paragraph(plan.bibliography),
      "bibliography"
    ),
    `<div class="plan-block footer-note" data-block="footer">Πηγή: ${escapeHtml(
      plan.bookName
    )} · Τάξη φακέλου: ${escapeHtml(plan.className)}</div>`,
  ];

  return `
    <style>${buildPhysicsLessonPlanStyles()}</style>
    <div class="physics-lesson-plan-doc" data-paginated="false">
      <div class="plan-source">
        ${blocks.join("")}
      </div>
      <div class="plan-pages"></div>
    </div>
  `;
}
