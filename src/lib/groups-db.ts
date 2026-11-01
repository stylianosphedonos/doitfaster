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
    order: 0,
    visible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "group-certificates",
    title: "Certificates",
    description: "Certificates and completion documents",
    icon: "🎓",
    color: "amber",
    order: 1,
    visible: true,
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
  const groups = JSON.parse(raw) as FormGroup[];
  // Ensure backwards compatibility with existing data
  return groups
    .map((g, idx) => ({
      ...g,
      order: g.order ?? idx,
      visible: g.visible ?? true,
    }))
    .sort((a, b) => a.order - b.order);
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
  data: Omit<FormGroup, "id" | "createdAt" | "updatedAt" | "order" | "visible">
): Promise<FormGroup> {
  const groups = await readGroups();
  const now = new Date().toISOString();
  const maxOrder = groups.length > 0 ? Math.max(...groups.map((g) => g.order)) : -1;
  const group: FormGroup = {
    ...data,
    id: uuidv4(),
    order: maxOrder + 1,
    visible: true,
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

export async function saveAllGroups(groups: FormGroup[]): Promise<void> {
  await writeGroups(groups);
}

export async function reorderGroups(orderedIds: string[]): Promise<FormGroup[]> {
  const groups = await readGroups();
  const now = new Date().toISOString();
  
  // Create a map for quick lookup
  const groupMap = new Map(groups.map((g) => [g.id, g]));
  
  // Reorder based on the provided IDs
  const reordered: FormGroup[] = [];
  orderedIds.forEach((id, index) => {
    const group = groupMap.get(id);
    if (group) {
      reordered.push({ ...group, order: index, updatedAt: now });
      groupMap.delete(id);
    }
  });
  
  // Append any groups not in the ordered list (shouldn't happen, but safety)
  let nextOrder = reordered.length;
  for (const group of groupMap.values()) {
    reordered.push({ ...group, order: nextOrder++, updatedAt: now });
  }
  
  await writeGroups(reordered);
  return reordered.sort((a, b) => a.order - b.order);
}
