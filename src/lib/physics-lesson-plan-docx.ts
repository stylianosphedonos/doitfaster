import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  PageOrientation,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  convertInchesToTwip,
  sectionPageSizeDefaults,
} from "docx";
import type { PhysicsLessonPlanDoc } from "./physics-lesson-plan-html";

const THIN_BORDER = {
  style: BorderStyle.SINGLE,
  size: 8,
  color: "222222",
};

function paragraph(
  text: string,
  options?: { bold?: boolean; size?: number; after?: number; center?: boolean }
): Paragraph {
  return new Paragraph({
    alignment: options?.center ? AlignmentType.CENTER : AlignmentType.LEFT,
    spacing: { after: options?.after ?? 120 },
    children: [
      new TextRun({
        text,
        bold: options?.bold ?? false,
        size: options?.size ?? 20,
        font: "Times New Roman",
      }),
    ],
  });
}

function multiLineCell(
  text: string,
  width: number,
  options?: { bold?: boolean; shading?: string }
): TableCell {
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const content = lines.length ? lines : ["—"];
  return new TableCell({
    borders: {
      top: THIN_BORDER,
      bottom: THIN_BORDER,
      left: THIN_BORDER,
      right: THIN_BORDER,
    },
    width: { size: width, type: WidthType.DXA },
    shading: options?.shading ? { fill: options.shading } : undefined,
    children: content.map(
      (line) =>
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: line,
              bold: options?.bold ?? false,
              size: 16,
              font: "Times New Roman",
            }),
          ],
        })
    ),
  });
}

function metaLine(label: string, value: string): Paragraph {
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({
        text: `${label} `,
        bold: true,
        size: 20,
        font: "Times New Roman",
      }),
      new TextRun({
        text: value || "—",
        size: 20,
        font: "Times New Roman",
      }),
    ],
  });
}

function labeledBlock(label: string, body: string): Paragraph[] {
  return [
    paragraph(label, { bold: true, after: 60 }),
    paragraph(body || "—", { after: 160 }),
  ];
}

function bulletParagraphs(items: string[]): Paragraph[] {
  if (!items.length) return [paragraph("—")];
  return items.map((item) =>
    paragraph(`• ${item}`, { after: 80 })
  );
}

function activityTable(
  block: PhysicsLessonPlanDoc["activityBlocks"][number],
  index: number
): Table {
  // Landscape A4 usable width ≈ 10500–11000 DXA with ~0.55" margins.
  const col = 2100;
  return new Table({
    width: { size: col * 5, type: WidthType.DXA },
    columnWidths: [col, col, col, col, col],
    rows: [
      new TableRow({
        children: [
          multiLineCell("Στόχοι", col, { bold: true, shading: "F3F4F6" }),
          multiLineCell("Πορεία Δραστηριοτήτων", col, {
            bold: true,
            shading: "F3F4F6",
          }),
          multiLineCell("Αξιολόγηση (Συντρέχουσα/Διαμορφωτική)", col, {
            bold: true,
            shading: "F3F4F6",
          }),
          multiLineCell("Ο ρόλος του εκπαιδευτικού / Οργάνωση τάξης", col, {
            bold: true,
            shading: "F3F4F6",
          }),
          multiLineCell("Μέσα / Υλικά", col, { bold: true, shading: "F3F4F6" }),
        ],
      }),
      new TableRow({
        children: [
          multiLineCell(`Στόχος ${index + 1}\n${block.objective}`, col, {
            shading: "FAFAFA",
          }),
          multiLineCell(block.activityPath, col),
          multiLineCell(block.assessment, col),
          multiLineCell(block.teacherRole, col),
          multiLineCell(block.materials, col),
        ],
      }),
    ],
  });
}

export async function buildPhysicsLessonPlanDocx(
  plan: PhysicsLessonPlanDoc
): Promise<Blob> {
  const today =
    plan.date ??
    new Date().toLocaleDateString("el-GR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: plan.title || "Σχέδιο Μαθήματος",
          bold: true,
          size: 32,
          font: "Times New Roman",
        }),
      ],
    }),
    metaLine("Καθηγητής/τρια:", plan.teacherName ?? ""),
    metaLine("Ημερομηνία:", today),
    metaLine("Αρ. Μαθ.:", plan.lessonNumber ?? ""),
    metaLine("Χρόνος:", `${plan.durationMinutes} λεπτά`),
    metaLine("Τάξη:", plan.classLabel),
    metaLine("Βιβλίο:", plan.bookName),
    metaLine("Ενότητα:", plan.unit),
    metaLine("Κεφάλαιο:", plan.chapter),
    new Paragraph({ spacing: { after: 120 }, children: [] }),
    paragraph("Σκοπός Μαθήματος (Δείκτης/ες Επιτυχίας):", {
      bold: true,
      after: 60,
    }),
    ...bulletParagraphs(plan.successIndicators),
    ...labeledBlock(
      "Σημεία έμφασης (π.χ. Έννοιες, Πειράματα, Δεξιότητες):",
      plan.emphasisPoints
    ),
    ...labeledBlock(
      "Απαραίτητες προϋπάρχουσες γνώσεις και δεξιότητες:",
      plan.prerequisites
    ),
    ...labeledBlock(`Αφόρμηση (${plan.hookMinutes}′):`, plan.hook),
  ];

  for (let i = 0; i < plan.activityBlocks.length; i += 1) {
    children.push(
      new Paragraph({ spacing: { before: 160, after: 80 }, children: [] })
    );
    children.push(activityTable(plan.activityBlocks[i], i));
  }

  children.push(
    ...labeledBlock("Ολοκλήρωση μαθήματος:", plan.closure),
    ...labeledBlock("Εργασία για το σπίτι:", plan.homework),
    ...labeledBlock("Βιβλιογραφία:", plan.bibliography),
    paragraph(
      `Πηγή: ${plan.bookName} · Τάξη φακέλου: ${plan.className}`,
      { after: 0 }
    )
  );

  const document = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: sectionPageSizeDefaults.WIDTH,
              height: sectionPageSizeDefaults.HEIGHT,
              orientation: PageOrientation.LANDSCAPE,
            },
            margin: {
              top: convertInchesToTwip(0.5),
              bottom: convertInchesToTwip(0.5),
              left: convertInchesToTwip(0.55),
              right: convertInchesToTwip(0.55),
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBlob(document);
}

export async function downloadPhysicsLessonPlanDocx(
  plan: PhysicsLessonPlanDoc,
  filename = "sxedio-mathimatos-fysiki"
): Promise<void> {
  const blob = await buildPhysicsLessonPlanDocx(plan);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${filename}.docx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
