import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { CERTIFICATE_FIELDS } from "./certificate-fields";
import {
  INVOICE_FIELDS,
  QUOTATION_FIELDS,
  RECEIPT_FIELDS,
} from "./business-doc-fields";
import { LESSON_PLAN_FIELDS } from "./lesson-plan-fields";
import { ensureGroupsSeeded } from "./migrate";
import type { FormComponent } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "forms.json");

const DEFAULT_FORMS: FormComponent[] = [
  {
    id: "sample-quotation",
    groupId: "group-business",
    title: "Quotation",
    description: "Professional quotation template for client proposals",
    icon: "📝",
    color: "blue",
    template: "quotation",
    fields: QUOTATION_FIELDS,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sample-invoice",
    groupId: "group-business",
    title: "Invoice",
    description: "Professional invoice template for billing clients",
    icon: "📄",
    color: "blue",
    template: "invoice",
    fields: INVOICE_FIELDS,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sample-receipt",
    groupId: "group-business",
    title: "Receipt",
    description: "Professional receipt template for payment confirmation",
    icon: "🧾",
    color: "blue",
    template: "receipt",
    fields: RECEIPT_FIELDS,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sample-certificate",
    groupId: "group-certificates",
    title: "Certificate",
    description: "Certificate of completion template",
    icon: "🏆",
    color: "amber",
    template: "certificate",
    fields: CERTIFICATE_FIELDS,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sxedio-mathimatos",
    groupId: "group-education",
    title: "ΣΧΕΔΙΟ-ΜΑΘΗΜΑΤΟΣ",
    description: "Πρότυπο σχεδίου μαθήματος με όλα τα πεδία του επίσημου εγγράφου",
    icon: "📚",
    color: "green",
    template: "sxedio-mathimatos",
    fields: LESSON_PLAN_FIELDS,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function ensureDataFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const forms = JSON.parse(raw) as FormComponent[];
    if (forms.length > 0) {
      await ensureGroupsSeeded();
      return;
    }
  } catch {
    // file missing — fall through to seed
  }
  await ensureGroupsSeeded();
  await fs.writeFile(DATA_FILE, JSON.stringify(DEFAULT_FORMS, null, 2));
}

async function readForms(): Promise<FormComponent[]> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  const forms = JSON.parse(raw) as FormComponent[];
  return migrateForms(forms);
}

function migrateForms(forms: FormComponent[]): FormComponent[] {
  let changed = false;
  const migrated = forms.map((form) => {
    let next = form;

    if (!form.groupId) {
      changed = true;
      const groupId =
        form.id === "sample-invoice"
          ? "group-business"
          : form.id === "sample-certificate"
            ? "group-certificates"
            : form.id === "sxedio-mathimatos"
              ? "group-education"
              : "group-business";
      next = { ...next, groupId };
    }

    if (form.id === "sample-certificate") {
      changed = true;
      next = {
        ...next,
        template: "certificate",
        fields: CERTIFICATE_FIELDS,
      };
    }

    if (form.id === "sxedio-mathimatos") {
      changed = true;
      next = {
        ...next,
        groupId: "group-education",
        template: "sxedio-mathimatos",
        fields: LESSON_PLAN_FIELDS,
      };
    }

    return next;
  });

  if (!migrated.some((form) => form.id === "sxedio-mathimatos")) {
    changed = true;
    const lessonPlan = DEFAULT_FORMS.find((form) => form.id === "sxedio-mathimatos");
    if (lessonPlan) {
      migrated.push(lessonPlan);
    }
  }

  if (changed) {
    void writeForms(migrated);
  }
  return migrated;
}

async function writeForms(forms: FormComponent[]): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(forms, null, 2));
}

export async function getAllForms(): Promise<FormComponent[]> {
  return readForms();
}

export async function getFormsByGroupId(groupId: string): Promise<FormComponent[]> {
  const forms = await readForms();
  return forms.filter((f) => f.groupId === groupId);
}

export async function getFormById(id: string): Promise<FormComponent | null> {
  const forms = await readForms();
  return forms.find((f) => f.id === id) ?? null;
}

export async function createForm(
  data: Omit<FormComponent, "id" | "createdAt" | "updatedAt">
): Promise<FormComponent> {
  const forms = await readForms();
  const now = new Date().toISOString();
  const form: FormComponent = {
    ...data,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };
  forms.push(form);
  await writeForms(forms);
  return form;
}

export async function updateForm(
  id: string,
  data: Partial<Omit<FormComponent, "id" | "createdAt">>
): Promise<FormComponent | null> {
  const forms = await readForms();
  const index = forms.findIndex((f) => f.id === id);
  if (index === -1) return null;

  const updated: FormComponent = {
    ...forms[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  forms[index] = updated;
  await writeForms(forms);
  return updated;
}

export async function deleteForm(id: string): Promise<boolean> {
  const forms = await readForms();
  const filtered = forms.filter((f) => f.id !== id);
  if (filtered.length === forms.length) return false;
  await writeForms(filtered);
  return true;
}

export async function unassignFormsFromGroup(groupId: string): Promise<void> {
  const forms = await readForms();
  const updated = forms.filter((f) => f.groupId !== groupId);
  if (updated.length !== forms.length) {
    await writeForms(updated);
  }
}
