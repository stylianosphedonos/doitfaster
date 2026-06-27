import { promises as fs } from "fs";
import path from "path";
import type { FormGroup } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const GROUPS_FILE = path.join(DATA_DIR, "groups.json");

const DEFAULT_GROUPS: FormGroup[] = [
  {
    id: "group-business",
    title: "Business",
    description: "Invoices, receipts, and business documents",
    icon: "💼",
    color: "blue",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "group-certificates",
    title: "Certificates",
    description: "Certificates and completion documents",
    icon: "🎓",
    color: "amber",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "group-education",
    title: "Εκπαίδευση",
    description: "Σχέδια μαθήματος και εκπαιδευτικά έγγραφα",
    icon: "📚",
    color: "green",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function ensureGroupsSeeded(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  let groups: FormGroup[] = [];
  try {
    const raw = await fs.readFile(GROUPS_FILE, "utf-8");
    groups = JSON.parse(raw) as FormGroup[];
  } catch {
    groups = [];
  }

  if (groups.length === 0) {
    await fs.writeFile(GROUPS_FILE, JSON.stringify(DEFAULT_GROUPS, null, 2));
    return;
  }

  let changed = false;
  for (const defaultGroup of DEFAULT_GROUPS) {
    if (!groups.some((group) => group.id === defaultGroup.id)) {
      groups.push(defaultGroup);
      changed = true;
    }
  }

  if (changed) {
    await fs.writeFile(GROUPS_FILE, JSON.stringify(groups, null, 2));
  }
}
