import { promises as fs } from "fs";
import path from "path";
import {
  DEFAULT_BRANDING,
  type AppSettings,
  type BrandingSettings,
} from "./settings-types";

const DATA_DIR = path.join(process.cwd(), "data");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
const BRANDING_DIR = path.join(process.cwd(), "public", "branding");

const DEFAULT_SETTINGS: AppSettings = {
  branding: DEFAULT_BRANDING,
  updatedAt: new Date().toISOString(),
};

async function ensureSettingsFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(SETTINGS_FILE);
  } catch {
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2));
  }
}

async function readSettings(): Promise<AppSettings> {
  await ensureSettingsFile();
  const raw = await fs.readFile(SETTINGS_FILE, "utf-8");
  const settings = JSON.parse(raw) as AppSettings;
  return {
    ...settings,
    branding: { ...DEFAULT_BRANDING, ...settings.branding },
  };
}

async function writeSettings(settings: AppSettings): Promise<void> {
  await ensureSettingsFile();
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

export async function getSettings(): Promise<AppSettings> {
  return readSettings();
}

export async function getBranding(): Promise<BrandingSettings> {
  const settings = await readSettings();
  return settings.branding;
}

export interface BrandingUpdate {
  appName?: string;
  pageTitle?: string;
  pageSubtitle?: string;
  logoDataUrl?: string | null;
  bannerDataUrl?: string | null;
  removeLogo?: boolean;
  removeBanner?: boolean;
}

function getExtensionFromDataUrl(dataUrl: string): string {
  const match = dataUrl.match(/^data:image\/(\w+);/);
  const ext = match?.[1]?.toLowerCase();
  if (ext === "jpeg") return "jpg";
  if (ext === "svg+xml") return "svg";
  return ext ?? "png";
}

async function saveImageFromDataUrl(
  dataUrl: string,
  filename: string
): Promise<string> {
  const match = dataUrl.match(/^data:image\/\w+;base64,(.+)$/);
  if (!match) throw new Error("Invalid image data");

  await fs.mkdir(BRANDING_DIR, { recursive: true });
  const ext = getExtensionFromDataUrl(dataUrl);
  const filePath = path.join(BRANDING_DIR, `${filename}.${ext}`);
  const buffer = Buffer.from(match[1], "base64");
  await fs.writeFile(filePath, buffer);

  // Remove other extensions of the same asset
  const extensions = ["png", "jpg", "jpeg", "webp", "gif", "svg"];
  for (const oldExt of extensions) {
    if (oldExt === ext) continue;
    try {
      await fs.unlink(path.join(BRANDING_DIR, `${filename}.${oldExt}`));
    } catch {
      // file may not exist
    }
  }

  return `/branding/${filename}.${ext}`;
}

async function removeImage(filename: string): Promise<void> {
  const extensions = ["png", "jpg", "jpeg", "webp", "gif", "svg"];
  for (const ext of extensions) {
    try {
      await fs.unlink(path.join(BRANDING_DIR, `${filename}.${ext}`));
    } catch {
      // file may not exist
    }
  }
}

export async function updateBranding(
  update: BrandingUpdate
): Promise<BrandingSettings> {
  const settings = await readSettings();
  const branding = { ...settings.branding };

  if (update.appName !== undefined) {
    branding.appName = update.appName.trim() || DEFAULT_BRANDING.appName;
  }
  if (update.pageTitle !== undefined) {
    branding.pageTitle = update.pageTitle.trim() || DEFAULT_BRANDING.pageTitle;
  }
  if (update.pageSubtitle !== undefined) {
    branding.pageSubtitle =
      update.pageSubtitle.trim() || DEFAULT_BRANDING.pageSubtitle;
  }

  if (update.removeLogo) {
    await removeImage("logo");
    branding.logoUrl = null;
  } else if (update.logoDataUrl) {
    branding.logoUrl = await saveImageFromDataUrl(update.logoDataUrl, "logo");
  }

  if (update.removeBanner) {
    await removeImage("banner");
    branding.bannerUrl = null;
  } else if (update.bannerDataUrl) {
    branding.bannerUrl = await saveImageFromDataUrl(
      update.bannerDataUrl,
      "banner"
    );
  }

  await writeSettings({
    branding,
    updatedAt: new Date().toISOString(),
  });

  return branding;
}
