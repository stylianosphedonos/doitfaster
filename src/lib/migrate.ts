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
];

export async function ensureGroupsSeeded(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(GROUPS_FILE, "utf-8");
    const groups = JSON.parse(raw) as FormGroup[];
    if (groups.length > 0) return;
  } catch {
    // file missing
  }
  await fs.writeFile(GROUPS_FILE, JSON.stringify(DEFAULT_GROUPS, null, 2));
}
