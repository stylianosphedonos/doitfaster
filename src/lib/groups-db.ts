import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
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

async function ensureGroupsFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(GROUPS_FILE, "utf-8");
    const groups = JSON.parse(raw) as FormGroup[];
    if (groups.length > 0) return;
  } catch {
    // file missing — fall through to seed
  }
  await fs.writeFile(GROUPS_FILE, JSON.stringify(DEFAULT_GROUPS, null, 2));
}

async function readGroups(): Promise<FormGroup[]> {
  await ensureGroupsFile();
  const raw = await fs.readFile(GROUPS_FILE, "utf-8");
  return JSON.parse(raw) as FormGroup[];
}

async function writeGroups(groups: FormGroup[]): Promise<void> {
  await ensureGroupsFile();
  await fs.writeFile(GROUPS_FILE, JSON.stringify(groups, null, 2));
}

export async function getAllGroups(): Promise<FormGroup[]> {
  return readGroups();
}

export async function getGroupById(id: string): Promise<FormGroup | null> {
  const groups = await readGroups();
  return groups.find((g) => g.id === id) ?? null;
}

export async function createGroup(
  data: Omit<FormGroup, "id" | "createdAt" | "updatedAt">
): Promise<FormGroup> {
  const groups = await readGroups();
  const now = new Date().toISOString();
  const group: FormGroup = {
    ...data,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };
  groups.push(group);
  await writeGroups(groups);
  return group;
}

export async function updateGroup(
  id: string,
  data: Partial<Omit<FormGroup, "id" | "createdAt">>
): Promise<FormGroup | null> {
  const groups = await readGroups();
  const index = groups.findIndex((g) => g.id === id);
  if (index === -1) return null;

  const updated: FormGroup = {
    ...groups[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  groups[index] = updated;
  await writeGroups(groups);
  return updated;
}

export async function deleteGroup(id: string): Promise<boolean> {
  const groups = await readGroups();
  const filtered = groups.filter((g) => g.id !== id);
  if (filtered.length === groups.length) return false;
  await writeGroups(filtered);
  return true;
}
