#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const fields = [
  { id: "school", label: "Σχολείο", type: "text", section: "header" },
  { id: "class", label: "Τάξη", type: "text", section: "header" },
  { id: "lessonNumber", label: "Α/Α Μαθήματος", type: "text", section: "header" },
  { id: "teacherName", label: "Όνομα Εκπαιδευτικού", type: "text", section: "header" },
  { id: "studentCount", label: "Αριθμός Μαθητών", type: "text", section: "header" },
  { id: "teachingUnit", label: "Διδακτική Ενότητα", type: "text", section: "header" },
  { id: "teachingPeriod", label: "Διδακτική Περίοδος", type: "text", section: "header" },
  { id: "teachingHour", label: "Διδακτική Ώρα", type: "text", section: "header" },
  { id: "thematicField", label: "Θεματικό Πεδίο", type: "text", section: "header" },
  {
    id: "topic",
    label: "Θέμα",
    type: "text",
    section: "topic",
    placeholder: "π.χ. Η έννοια της δύναμης, 2 σημαντικές δυνάμεις στη φύση",
  },
  {
    id: "topicSubtitle",
    label: "Υπότιτλος (προαιρετικό)",
    type: "text",
    section: "topic",
    placeholder: "π.χ. (The Overhand Tennis Serve)",
  },
  { id: "planTitle", label: "Τίτλος σχεδίου μαθήματος", type: "text", section: "identity" },
  {
    id: "gradeLevel",
    label: "Βαθμίδα - Τάξη",
    type: "text",
    section: "identity",
    placeholder: "π.χ. Γυμνάσιο – Β' Γυμνασίου",
  },
  {
    id: "cognitiveAreas",
    label: "Εμπλεκόμενες γνωστικές περιοχές και συμβατότητα με ΠΣ",
    type: "textarea",
    section: "identity",
    rows: 3,
  },
  {
    id: "studentOutcomes",
    label: "Ο/Η μαθητής/τρια να είναι σε θέση",
    type: "textarea",
    section: "identity",
    placeholder: "Ένας στόχος ανά γραμμή",
    rows: 6,
  },
  {
    id: "curriculumReference",
    label: "Αναφορά Αναλυτικού Προγράμματος Σπουδών",
    type: "textarea",
    section: "identity",
    rows: 2,
  },
  {
    id: "duration",
    label: "Χρονική διάρκεια",
    type: "text",
    section: "identity",
    placeholder: "π.χ. Δύο - τρεις διδακτικές ώρες",
  },
  {
    id: "rationale",
    label: "Σκεπτικό (και πιθανές αντιλήψεις μαθητών/τριών)",
    type: "textarea",
    section: "rationale",
    rows: 6,
  },
  {
    id: "prerequisites",
    label: "Προαπαιτούμενη γνώση & επιθυμητές δεξιότητες",
    type: "textarea",
    section: "prerequisites",
    placeholder: "Μία γραμμή ανά δεξιότητα ή γνώση",
    rows: 6,
  },
  {
    id: "learningObjectives",
    label: "Μαθησιακοί στόχοι - Αποτελέσματα",
    type: "textarea",
    section: "objectives",
    placeholder: "Ένας στόχος ανά γραμμή",
    rows: 6,
  },
  {
    id: "facilities",
    label: "Αθλητικές εγκαταστάσεις / Χώρος διεξαγωγής",
    type: "textarea",
    section: "organization",
    rows: 2,
  },
  {
    id: "equipment",
    label: "Όργανα / Εξοπλισμός",
    type: "textarea",
    section: "organization",
    rows: 2,
  },
  {
    id: "classOrganization",
    label: "Οργάνωση τάξης",
    type: "textarea",
    section: "organization",
    rows: 4,
  },
  {
    id: "organization",
    label: "Οργάνωση της διδασκαλίας & απαιτούμενη υλικοτεχνική υποδομή",
    type: "textarea",
    section: "organization",
    rows: 6,
  },
  {
    id: "teachingApproach",
    label: "Μέθοδος διδασκαλίας - Διδακτική προσέγγιση",
    type: "textarea",
    section: "approach",
    rows: 6,
  },
  {
    id: "teachingPath",
    label: "Αναλυτική περιγραφή διδακτικής πορείας",
    type: "textarea",
    section: "path",
    rows: 10,
  },
  {
    id: "extensions",
    label: "Πιθανές επεκτάσεις - προσαρμογές σχεδίου μαθήματος",
    type: "textarea",
    section: "extensions",
    rows: 4,
  },
  {
    id: "bibliography",
    label: "Βιβλιογραφία – Δικτυογραφία",
    type: "textarea",
    section: "bibliography",
    rows: 6,
  },
  {
    id: "appendix",
    label: "Παράρτημα",
    type: "textarea",
    section: "appendix",
    rows: 8,
  },
];

const formsPath = path.join(__dirname, "../data/forms.json");
const forms = JSON.parse(fs.readFileSync(formsPath, "utf8"));

const existingIndex = forms.findIndex((form) => form.id === "sxedio-mathimatos");
const entry = {
  id: "sxedio-mathimatos",
  groupId: "group-education",
  title: "ΣΧΕΔΙΟ-ΜΑΘΗΜΑΤΟΣ",
  description: "Πρότυπο σχεδίου μαθήματος με όλα τα πεδία του επίσημου εγγράφου",
  icon: "📚",
  color: "green",
  template: "sxedio-mathimatos",
  fields,
  createdAt: "2026-06-27T18:00:00.000Z",
  updatedAt: "2026-06-27T18:00:00.000Z",
};

if (existingIndex >= 0) {
  forms[existingIndex] = entry;
} else {
  forms.push(entry);
}

fs.writeFileSync(formsPath, JSON.stringify(forms, null, 2) + "\n");
