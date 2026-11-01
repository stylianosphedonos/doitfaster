#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

/** Inspector sample (ΣΧΕΔΙΟ ΜΑΘΗΜΑΤΟΣ ΕΠΙΘΕΩΡΗΤΡΙΑ) — default for every lesson plan. */
const fields = [
  {
    id: "title",
    label: "Τίτλος",
    type: "text",
    section: "header",
    placeholder: "Σχέδιο Μαθήματος",
  },
  {
    id: "teacherName",
    label: "Καθηγητής/τρια",
    type: "text",
    section: "header",
  },
  {
    id: "date",
    label: "Ημερομηνία",
    type: "text",
    section: "header",
    placeholder: "π.χ. 02/11/2016",
  },
  {
    id: "lessonNumber",
    label: "Αρ. Μαθ.",
    type: "text",
    section: "header",
  },
  {
    id: "durationMinutes",
    label: "Χρόνος (λεπτά)",
    type: "text",
    section: "header",
    placeholder: "40",
  },
  {
    id: "class",
    label: "Τάξη",
    type: "text",
    section: "header",
    placeholder: "π.χ. Γ΄ Γυμνασίου",
  },
  {
    id: "bookName",
    label: "Βιβλίο",
    type: "text",
    section: "header",
  },
  {
    id: "unit",
    label: "Ενότητα",
    type: "text",
    section: "header",
  },
  {
    id: "chapter",
    label: "Κεφάλαιο",
    type: "text",
    section: "header",
  },
  {
    id: "successIndicators",
    label: "Σκοπός μαθήματος (Δείκτης/ες επιτυχίας)",
    type: "textarea",
    section: "purpose",
    placeholder: "Ένας δείκτης ανά γραμμή",
    rows: 6,
  },
  {
    id: "emphasisPoints",
    label: "Σημεία έμφασης (έννοιες, πειράματα, δεξιότητες)",
    type: "textarea",
    section: "emphasis",
    rows: 4,
  },
  {
    id: "prerequisites",
    label: "Απαραίτητες προϋπάρχουσες γνώσεις και δεξιότητες",
    type: "textarea",
    section: "prerequisites",
    rows: 4,
  },
  {
    id: "hook",
    label: "Αφόρμηση",
    type: "textarea",
    section: "hook",
    rows: 8,
  },
  {
    id: "hookMinutes",
    label: "Διάρκεια αφόρμησης (λεπτά)",
    type: "text",
    section: "hook",
    placeholder: "5",
  },
  {
    id: "activity1Objective",
    label: "Στόχοι",
    type: "textarea",
    section: "activity1",
    rows: 4,
  },
  {
    id: "activity1Path",
    label: "Πορεία δραστηριοτήτων",
    type: "textarea",
    section: "activity1",
    rows: 8,
  },
  {
    id: "activity1Assessment",
    label: "Αξιολόγηση (συντρέχουσα / διαμορφωτική)",
    type: "textarea",
    section: "activity1",
    rows: 6,
  },
  {
    id: "activity1TeacherRole",
    label: "Ο ρόλος του εκπαιδευτικού / Οργάνωση τάξης",
    type: "textarea",
    section: "activity1",
    rows: 6,
  },
  {
    id: "activity1Materials",
    label: "Μέσα / Υλικά",
    type: "textarea",
    section: "activity1",
    rows: 4,
  },
  {
    id: "activity2Objective",
    label: "Στόχοι",
    type: "textarea",
    section: "activity2",
    rows: 4,
  },
  {
    id: "activity2Path",
    label: "Πορεία δραστηριοτήτων",
    type: "textarea",
    section: "activity2",
    rows: 8,
  },
  {
    id: "activity2Assessment",
    label: "Αξιολόγηση (συντρέχουσα / διαμορφωτική)",
    type: "textarea",
    section: "activity2",
    rows: 6,
  },
  {
    id: "activity2TeacherRole",
    label: "Ο ρόλος του εκπαιδευτικού / Οργάνωση τάξης",
    type: "textarea",
    section: "activity2",
    rows: 6,
  },
  {
    id: "activity2Materials",
    label: "Μέσα / Υλικά",
    type: "textarea",
    section: "activity2",
    rows: 4,
  },
  {
    id: "closure",
    label: "Ολοκλήρωση μαθήματος",
    type: "textarea",
    section: "closure",
    rows: 5,
  },
  {
    id: "homework",
    label: "Εργασία για το σπίτι",
    type: "textarea",
    section: "homework",
    rows: 3,
  },
  {
    id: "bibliography",
    label: "Βιβλιογραφία",
    type: "textarea",
    section: "bibliography",
    rows: 4,
  },
];

const formsPath = path.join(__dirname, "../data/forms.json");
const forms = JSON.parse(fs.readFileSync(formsPath, "utf8"));

const existingIndex = forms.findIndex((form) => form.id === "sxedio-mathimatos");
const entry = {
  id: "sxedio-mathimatos",
  groupId: "group-education",
  title: "ΣΧΕΔΙΟ-ΜΑΘΗΜΑΤΟΣ",
  description:
    "Πρότυπο σχεδίου μαθήματος επιθεωρήτριας (landscape A4) για κάθε μάθημα",
  icon: "📚",
  color: "green",
  template: "sxedio-mathimatos",
  fields,
  createdAt: "2026-06-27T18:00:00.000Z",
  updatedAt: new Date().toISOString(),
};

if (existingIndex >= 0) {
  forms[existingIndex] = {
    ...forms[existingIndex],
    ...entry,
    createdAt: forms[existingIndex].createdAt ?? entry.createdAt,
  };
} else {
  forms.push(entry);
}

fs.writeFileSync(formsPath, JSON.stringify(forms, null, 2) + "\n");
console.log("Seeded sxedio-mathimatos with inspector lesson-plan fields.");
