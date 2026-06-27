import type { FormValues } from "./types";

function val(values: FormValues, key: string): string {
  return values[key]?.trim() ?? "";
}

function normalizeLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s•\-–*]+/, "").trim())
    .filter(Boolean);
}

function contentHtml(text: string): string {
  const lines = normalizeLines(text);
  if (lines.length === 0) return `<p class="detail empty">—</p>`;

  return lines
    .map((line) => `<p class="detail">${escapeHtml(line)}</p>`)
    .join("");
}

function paragraphHtml(text: string): string {
  return contentHtml(text);
}

function bulletListHtml(text: string): string {
  return contentHtml(text);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function headerCell(label: string, value: string, colspan = 1): string {
  return `
    <td colspan="${colspan}">
      <span class="label">${escapeHtml(label)}</span>
      <span class="value">${escapeHtml(value) || "—"}</span>
    </td>
  `;
}

function sectionBlock(title: string, content: string): string {
  return `
    <section class="block">
      <h2>${escapeHtml(title)}</h2>
      <div class="content">${content}</div>
    </section>
  `;
}

export function buildLessonPlanHtml(values: FormValues): string {
  const topic = val(values, "topic") || val(values, "planTitle");
  const subtitle = val(values, "topicSubtitle");

  const topicBar = `
    <section class="topic-bar">
      <div class="topic-title">Θέμα: ${escapeHtml(topic) || "—"}</div>
      ${subtitle ? `<div class="topic-subtitle">(${escapeHtml(subtitle)})</div>` : ""}
    </section>
  `;

  const headerTable = `
    <table class="header-table">
      <tr>
        ${headerCell("Σχολείο:", val(values, "school"))}
        ${headerCell("Τάξη:", val(values, "class"))}
        ${headerCell("Α/Α Μαθήματος:", val(values, "lessonNumber"))}
      </tr>
      <tr>
        ${headerCell("Όνομα Εκπαιδευτικού:", val(values, "teacherName"), 2)}
        ${headerCell("Αριθμός Μαθητών:", val(values, "studentCount"))}
      </tr>
      <tr>
        ${headerCell("Διδακτική Ενότητα:", val(values, "teachingUnit"), 2)}
        ${headerCell("Διδακτική Περίοδος:", val(values, "teachingPeriod"))}
      </tr>
      <tr>
        ${headerCell("Διδακτική Ώρα:", val(values, "teachingHour"), 2)}
        ${headerCell("Θεματικό Πεδίο:", val(values, "thematicField"))}
      </tr>
    </table>
  `;

  const identityExtra = [
    val(values, "planTitle") && val(values, "planTitle") !== topic
      ? sectionBlock("Τίτλος σχεδίου μαθήματος", paragraphHtml(val(values, "planTitle")))
      : "",
    val(values, "gradeLevel")
      ? sectionBlock("Βαθμίδα - Τάξη", paragraphHtml(val(values, "gradeLevel")))
      : "",
    val(values, "cognitiveAreas")
      ? sectionBlock(
          "Εμπλεκόμενες γνωστικές περιοχές και συμβατότητα με ΠΣ",
          paragraphHtml(val(values, "cognitiveAreas"))
        )
      : "",
    val(values, "studentOutcomes")
      ? sectionBlock("Ο/Η μαθητής/τρια να είναι σε θέση", bulletListHtml(val(values, "studentOutcomes")))
      : "",
    val(values, "curriculumReference")
      ? sectionBlock("Αναφορά Αναλυτικού Προγράμματος Σπουδών", paragraphHtml(val(values, "curriculumReference")))
      : "",
    val(values, "duration")
      ? sectionBlock("Χρονική διάρκεια", paragraphHtml(val(values, "duration")))
      : "",
  ].join("");

  const mainSections = [
    sectionBlock(
      "Μαθησιακοί Στόχοι - Αποτελέσματα",
      bulletListHtml(val(values, "learningObjectives"))
    ),
    sectionBlock(
      "Προαπαιτούμενη γνώση & Επιθυμητές δεξιότητες",
      bulletListHtml(val(values, "prerequisites"))
    ),
    sectionBlock(
      "Μέθοδος διδασκαλίας- Διδακτική Προσέγγιση",
      bulletListHtml(val(values, "teachingApproach"))
    ),
    sectionBlock("Αθλητικές εγκαταστάσεις", paragraphHtml(val(values, "facilities"))),
    sectionBlock("Όργανα", paragraphHtml(val(values, "equipment"))),
    sectionBlock("Οργάνωση τάξης", bulletListHtml(val(values, "classOrganization"))),
  ].join("");

  const extendedSections = [
    identityExtra,
    val(values, "rationale")
      ? sectionBlock(
          "Σκεπτικό σχεδίου μαθήματος (και πιθανές αντιλήψεις μαθητών/τριών)",
          paragraphHtml(val(values, "rationale"))
        )
      : "",
    val(values, "organization")
      ? sectionBlock(
          "Οργάνωση της διδασκαλίας & απαιτούμενη υλικοτεχνική υποδομή",
          paragraphHtml(val(values, "organization"))
        )
      : "",
    val(values, "teachingPath")
      ? sectionBlock("Αναλυτική περιγραφή διδακτικής πορείας", paragraphHtml(val(values, "teachingPath")))
      : "",
    val(values, "extensions")
      ? sectionBlock("Πιθανές επεκτάσεις - προσαρμογές σχεδίου μαθήματος", paragraphHtml(val(values, "extensions")))
      : "",
    val(values, "bibliography")
      ? sectionBlock("Βιβλιογραφία – Δικτυογραφία", paragraphHtml(val(values, "bibliography")))
      : "",
    val(values, "appendix")
      ? sectionBlock("Παράρτημα", paragraphHtml(val(values, "appendix")))
      : "",
  ].join("");

  return `
    <style>
      .lesson-plan-doc {
        width: 794px;
        padding: 28px 32px;
        background: #fff;
        color: #111;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 11px;
        line-height: 1.45;
        box-sizing: border-box;
      }
      .lesson-plan-doc * { box-sizing: border-box; }
      .lesson-plan-doc .header-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 0;
      }
      .lesson-plan-doc .header-table td {
        border: 1px solid #111;
        padding: 6px 8px;
        vertical-align: top;
        width: 33.33%;
      }
      .lesson-plan-doc .label {
        display: block;
        font-weight: 700;
        margin-bottom: 2px;
      }
      .lesson-plan-doc .value {
        display: block;
        min-height: 14px;
      }
      .lesson-plan-doc .topic-bar {
        border: 1px solid #111;
        border-top: none;
        background: #ddd9cf;
        text-align: center;
        padding: 10px 12px;
      }
      .lesson-plan-doc .topic-title {
        font-weight: 700;
        font-size: 12px;
      }
      .lesson-plan-doc .topic-subtitle {
        margin-top: 2px;
        font-size: 11px;
      }
      .lesson-plan-doc .block {
        border: 1px solid #111;
        border-top: none;
        padding: 8px 10px;
      }
      .lesson-plan-doc .block h2 {
        margin: 0 0 6px;
        font-size: 11px;
        font-weight: 700;
      }
      .lesson-plan-doc .content {
        padding: 0;
        margin: 0;
      }
      .lesson-plan-doc .content .detail {
        margin: 0 0 3px;
        padding: 0;
        text-indent: 0;
      }
      .lesson-plan-doc .content .detail:last-child {
        margin-bottom: 0;
      }
      .lesson-plan-doc .empty {
        color: #666;
      }
    </style>
    <div class="lesson-plan-doc">
      ${headerTable}
      ${topicBar}
      ${mainSections}
      ${extendedSections}
    </div>
  `;
}
