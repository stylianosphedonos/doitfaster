import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type { FormValues, SavedFormTemplate } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const SAVES_FILE = path.join(DATA_DIR, "form-saves.json");

async function ensureSavesFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(SAVES_FILE);
  } catch {
    await fs.writeFile(SAVES_FILE, "[]");
  }
}

async function readSaves(): Promise<SavedFormTemplate[]> {
  await ensureSavesFile();
  const raw = await fs.readFile(SAVES_FILE, "utf-8");
  return JSON.parse(raw) as SavedFormTemplate[];
}

async function writeSaves(saves: SavedFormTemplate[]): Promise<void> {
  await ensureSavesFile();
  await fs.writeFile(SAVES_FILE, JSON.stringify(saves, null, 2));
}

export async function getFormSaveForUser(
  userId: string,
  formId: string
): Promise<SavedFormTemplate | null> {
  const saves = await readSaves();
  return saves.find((save) => save.userId === userId && save.formId === formId) ?? null;
}

export async function upsertFormSaveForUser(
  userId: string,
  formId: string,
  values: FormValues
): Promise<SavedFormTemplate> {
  const saves = await readSaves();
  const index = saves.findIndex(
    (save) => save.userId === userId && save.formId === formId
  );
  const now = new Date().toISOString();

  if (index === -1) {
    const created: SavedFormTemplate = {
      id: uuidv4(),
      userId,
      formId,
      values,
      createdAt: now,
      updatedAt: now,
    };
    saves.push(created);
    await writeSaves(saves);
    return created;
  }

  const updated: SavedFormTemplate = {
    ...saves[index],
    values,
    updatedAt: now,
  };
  saves[index] = updated;
  await writeSaves(saves);
  return updated;
}

export async function deleteFormSaveForUser(
  userId: string,
  formId: string
): Promise<boolean> {
  const saves = await readSaves();
  const filtered = saves.filter(
    (save) => !(save.userId === userId && save.formId === formId)
  );
  if (filtered.length === saves.length) return false;
  await writeSaves(filtered);
  return true;
}
