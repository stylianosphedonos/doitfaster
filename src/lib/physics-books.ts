import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";

export type BookSubject = "physics" | "maths";

const SUBJECT_ROOTS: Record<BookSubject, { books: string; index: string }> = {
  physics: {
    books: path.join(process.cwd(), "Books", "Physics"),
    index: path.join(process.cwd(), "data", "physics-index"),
  },
  maths: {
    books: path.join(process.cwd(), "Books", "Maths"),
    index: path.join(process.cwd(), "data", "maths-index"),
  },
};

export const PHYSICS_BOOKS_ROOT = SUBJECT_ROOTS.physics.books;
/** Bump when extraction/normalization changes so cached indexes rebuild. */
const INDEX_VERSION = 4;

type PdfTextItem = {
  str: string;
  width: number;
  transform: number[];
  hasEOL?: boolean;
};

interface TextFragment {
  str: string;
  x: number;
  y: number;
  end: number;
  height: number;
}

export type PhysicsBookKind = "textbook" | "analytical-program";

export interface PhysicsBookRef {
  classId: string;
  className: string;
  bookId: string;
  bookName: string;
  fileName: string;
  relativePath: string;
  kind: PhysicsBookKind;
}

export interface PhysicsCatalogClass {
  id: string;
  name: string;
  books: {
    id: string;
    name: string;
    fileName: string;
    pageCount: number | null;
    kind: PhysicsBookKind;
  }[];
}

export interface IndexedPage {
  page: number;
  text: string;
  /** AP tables only: first-column (δείκτες επιτυχίας) text, excluding col 2–3. */
  leftColumnText?: string;
}

export interface BookIndex {
  version?: number;
  classId: string;
  bookId: string;
  fileName: string;
  relativePath: string;
  pageCount: number;
  mtimeMs: number;
  size: number;
  pages: IndexedPage[];
}

export interface PhysicsSearchHit {
  classId: string;
  className: string;
  bookId: string;
  bookName: string;
  fileName: string;
  kind: PhysicsBookKind;
  page: number;
  snippet: string;
  score: number;
}

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9Α-ωά-ώΆ-Ώ]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "item";
}

export function isAnalyticalProgramFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return (
    lower.startsWith("ap_") ||
    lower.includes("eparkeias") ||
    lower.includes("epitychias") ||
    lower.includes("epitycdhias") ||
    lower.includes("deiktes") ||
    lower.includes("eiktes")
  );
}

function bookDisplayName(fileName: string, className: string): string {
  if (isAnalyticalProgramFile(fileName)) {
    return `Αναλυτικό Πρόγραμμα — Δείκτες επάρκειας & επιτυχίας (${className})`;
  }
  return fileName
    .replace(/\.pdf$/i, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stableBookId(className: string, fileName: string): string {
  const hash = createHash("sha1")
    .update(`${className}/${fileName}`)
    .digest("hex")
    .slice(0, 10);
  return `${slugify(fileName)}-${hash}`;
}

function indexFilePath(
  classId: string,
  bookId: string,
  subject: BookSubject = "physics"
): string {
  return path.join(SUBJECT_ROOTS[subject].index, classId, `${bookId}.json`);
}

export async function listPhysicsBooks(
  subject: BookSubject = "physics"
): Promise<PhysicsBookRef[]> {
  const booksRoot = SUBJECT_ROOTS[subject].books;
  const entries = await fs.readdir(booksRoot, { withFileTypes: true });
  const classes = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, "el"));

  const books: PhysicsBookRef[] = [];
  for (const className of classes) {
    const classDir = path.join(booksRoot, className);
    const classId = slugify(className);
    const files = await fs.readdir(classDir, { withFileTypes: true });
    for (const file of files) {
      if (!file.isFile() || !file.name.toLowerCase().endsWith(".pdf")) continue;
      const kind: PhysicsBookKind = isAnalyticalProgramFile(file.name)
        ? "analytical-program"
        : "textbook";
      books.push({
        classId,
        className,
        bookId: stableBookId(className, file.name),
        bookName: bookDisplayName(file.name, className),
        fileName: file.name,
        relativePath: path.join(className, file.name),
        kind,
      });
    }
  }

  return books.sort((a, b) => {
    if (a.className !== b.className) {
      return a.className.localeCompare(b.className, "el");
    }
    if (a.kind !== b.kind) {
      return a.kind === "analytical-program" ? -1 : 1;
    }
    return a.bookName.localeCompare(b.bookName, "el");
  });
}

export async function findAnalyticalProgramForClass(
  classId: string,
  subject: BookSubject = "physics"
): Promise<PhysicsBookRef | null> {
  const books = await listPhysicsBooks(subject);
  return (
    books.find(
      (book) => book.classId === classId && book.kind === "analytical-program"
    ) ?? null
  );
}

export async function resolvePhysicsBook(
  classId: string,
  bookId: string,
  subject: BookSubject = "physics"
): Promise<PhysicsBookRef | null> {
  const books = await listPhysicsBooks(subject);
  return (
    books.find((book) => book.classId === classId && book.bookId === bookId) ??
    null
  );
}

export function absoluteBookPath(
  book: PhysicsBookRef,
  subject: BookSubject = "physics"
): string {
  return path.join(SUBJECT_ROOTS[subject].books, book.relativePath);
}

type PositionedText = {
  str: string;
  x: number;
  y: number;
  height: number;
};

function positionedTextItems(
  items: Array<PdfTextItem | { type?: string }>
): PositionedText[] {
  const out: PositionedText[] = [];
  for (const item of items) {
    if (!("str" in item) || typeof item.str !== "string") continue;
    const transform = item.transform;
    if (!transform || transform.length < 6) continue;
    const trimmed = item.str.trim();
    if (!trimmed) continue;
    const height =
      Math.hypot(transform[2] ?? 0, transform[3] ?? 0) ||
      Math.hypot(transform[0] ?? 0, transform[1] ?? 0) ||
      10;
    out.push({ str: trimmed, x: transform[4], y: transform[5], height });
  }
  return out;
}

/**
 * AP 3-column tables (δείκτες | διδακτέα | δραστηριότητες).
 * Return the x cutoff so only the first column is kept.
 * Works on header pages and continuation pages (no "Διδακτέα" label).
 */
function detectLeftColumnMaxX(
  items: Array<PdfTextItem | { type?: string }>
): number | null {
  const positioned = positionedTextItems(items);
  if (positioned.length === 0) return null;

  const candidates: number[] = [];

  // 1) Explicit col2 header.
  let headerX = Infinity;
  for (const item of positioned) {
    if (/^Διδακτέα/.test(item.str)) {
      headerX = Math.min(headerX, item.x);
    }
  }
  if (Number.isFinite(headerX)) {
    let col2Start = headerX;
    for (const item of positioned) {
      if (item.str.length < 2) continue;
      if (item.x >= headerX - 35 && item.x < headerX) {
        col2Start = Math.min(col2Start, item.x);
      }
    }
    candidates.push(col2Start);
  }

  // 2) Continuation pages: on rows that have a δείκτης code (e.g. "1.3"),
  // the next column on that same row is διδακτέα / δραστηριότητα.
  const rows: { y: number; items: PositionedText[] }[] = [];
  for (const item of positioned) {
    const tolerance = Math.max(2.5, item.height * 0.35);
    const row = rows.find((entry) => Math.abs(entry.y - item.y) <= tolerance);
    if (row) {
      row.items.push(item);
      const count = row.items.length;
      row.y = (row.y * (count - 1) + item.y) / count;
    } else {
      rows.push({ y: item.y, items: [item] });
    }
  }

  let rowCol2 = Infinity;
  for (const row of rows) {
    const hasCode = row.items.some(
      (item) => /^\d+\.\d+[α-ω]?$/.test(item.str) && item.x < 200
    );
    if (!hasCode) continue;
    for (const item of row.items) {
      if (item.x >= 250) {
        rowCol2 = Math.min(rowCol2, item.x);
      }
    }
  }
  if (Number.isFinite(rowCol2)) candidates.push(rowCol2);

  // 3) Fallback: leftmost "Δραστηριότητα N.N" is col3 — estimate col2 as
  // the densest start-x cluster between 250 and that marker.
  const drastXs = positioned
    .filter((item) => /^Δραστηριότητα\s*\d/i.test(item.str))
    .map((item) => item.x);
  if (drastXs.length > 0) {
    const col3 = Math.min(...drastXs);
    const midStarts = positioned
      .map((item) => item.x)
      .filter((x) => x >= 250 && x < col3 - 40);
    if (midStarts.length > 0) {
      candidates.push(Math.min(...midStarts));
    } else {
      // Still better than full-page: cut before col3.
      candidates.push(col3);
    }
  }

  if (candidates.length === 0) return null;
  return Math.min(...candidates) - 2;
}

/**
 * Rebuild readable text from PDF.js glyph items.
 * Many Physics PDFs emit letters like "μ" as separate items; joining with spaces
 * produced broken words ("Σφάλ μ α"). Use horizontal gaps to decide word breaks.
 * When maxX is set, only items that start left of that bound are kept (AP col 1).
 */
function reconstructPageText(
  items: Array<PdfTextItem | { type?: string }>,
  maxX?: number | null
): string {
  const fragments: TextFragment[] = [];

  for (const item of items) {
    if (!("str" in item) || typeof item.str !== "string") continue;
    const transform = item.transform;
    if (!transform || transform.length < 6) continue;
    const x = transform[4];
    if (maxX != null && x >= maxX) continue;
    const y = transform[5];
    const height =
      Math.hypot(transform[2] ?? 0, transform[3] ?? 0) ||
      Math.hypot(transform[0] ?? 0, transform[1] ?? 0) ||
      10;
    const width = Number.isFinite(item.width) ? item.width : 0;
    fragments.push({
      str: item.str,
      x,
      y,
      end: x + width,
      height,
    });
  }

  if (fragments.length === 0) return "";

  fragments.sort((a, b) => b.y - a.y || a.x - b.x);

  const lines: { y: number; items: TextFragment[] }[] = [];
  for (const fragment of fragments) {
    const tolerance = Math.max(2.5, fragment.height * 0.35);
    const line = lines.find((entry) => Math.abs(entry.y - fragment.y) <= tolerance);
    if (line) {
      line.items.push(fragment);
      const count = line.items.length;
      line.y = (line.y * (count - 1) + fragment.y) / count;
    } else {
      lines.push({ y: fragment.y, items: [fragment] });
    }
  }

  const lineTexts: string[] = [];
  for (const line of lines) {
    line.items.sort((a, b) => a.x - b.x);
    let text = "";

    for (let i = 0; i < line.items.length; i += 1) {
      const current = line.items[i];
      if (i === 0) {
        text += current.str;
        continue;
      }

      const previous = line.items[i - 1];
      const gap = current.x - previous.end;
      const spaceThreshold = Math.max(previous.height * 0.22, current.height * 0.22, 1.1);

      if (current.str === " ") {
        if (!text.endsWith(" ")) text += " ";
        continue;
      }

      if (previous.str === " ") {
        if (!text.endsWith(" ")) text += " ";
        text += current.str;
        continue;
      }

      if (gap > spaceThreshold) text += " ";
      text += current.str;
    }

    const cleaned = text.replace(/[ \t\u00a0]+/g, " ").trim();
    if (cleaned) lineTexts.push(cleaned);
  }

  return lineTexts.join(" ").replace(/\s+/g, " ").trim();
}

async function extractPdfPages(filePath: string): Promise<IndexedPage[]> {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const buffer = await fs.readFile(filePath);
  const data = new Uint8Array(buffer);
  const doc = await getDocument({ data, useSystemFonts: true }).promise;
  const pages: IndexedPage[] = [];
  let lastLeftMaxX: number | null = null;

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    const items = content.items as Array<PdfTextItem | { type?: string }>;
    const text = reconstructPageText(items);
    const detectedMaxX = detectLeftColumnMaxX(items);
    if (detectedMaxX != null) lastLeftMaxX = detectedMaxX;
    const leftMaxX = detectedMaxX ?? lastLeftMaxX;
    const leftColumnText =
      leftMaxX != null ? reconstructPageText(items, leftMaxX) : undefined;
    pages.push({
      page: pageNumber,
      text,
      ...(leftColumnText ? { leftColumnText } : {}),
    });
  }

  return pages;
}

/** Prefer AP first-column text; never feed multi-column bleed into δείκτες. */
function pageTextForIndicators(page: IndexedPage): string {
  const left = page.leftColumnText?.trim();
  if (left) return left;
  // Last resort: strip everything from the first activity/col2 marker onward.
  return page.text
    .split(/\s+Δραστηριότητα\b/i)[0]
    .split(/\s+Διδακτέα\b/i)[0]
    .trim();
}

export async function getBookIndex(
  book: PhysicsBookRef,
  options?: { force?: boolean; subject?: BookSubject }
): Promise<BookIndex> {
  const subject = options?.subject ?? "physics";
  const filePath = absoluteBookPath(book, subject);
  const stat = await fs.stat(filePath);
  const cachePath = indexFilePath(book.classId, book.bookId, subject);

  if (!options?.force) {
    try {
      const raw = await fs.readFile(cachePath, "utf-8");
      const cached = JSON.parse(raw) as BookIndex;
      if (
        cached.version === INDEX_VERSION &&
        cached.mtimeMs === stat.mtimeMs &&
        cached.size === stat.size &&
        Array.isArray(cached.pages)
      ) {
        return cached;
      }
    } catch {
      // rebuild
    }
  }

  const pages = await extractPdfPages(filePath);
  const index: BookIndex = {
    version: INDEX_VERSION,
    classId: book.classId,
    bookId: book.bookId,
    fileName: book.fileName,
    relativePath: book.relativePath,
    pageCount: pages.length,
    mtimeMs: stat.mtimeMs,
    size: stat.size,
    pages,
  };

  await fs.mkdir(path.dirname(cachePath), { recursive: true });
  await fs.writeFile(cachePath, JSON.stringify(index));
  return index;
}

export async function getPhysicsCatalog(
  subject: BookSubject = "physics"
): Promise<PhysicsCatalogClass[]> {
  const books = await listPhysicsBooks(subject);
  const byClass = new Map<string, PhysicsCatalogClass>();

  for (const book of books) {
    let group = byClass.get(book.classId);
    if (!group) {
      group = { id: book.classId, name: book.className, books: [] };
      byClass.set(book.classId, group);
    }

    let pageCount: number | null = null;
    try {
      const cachePath = indexFilePath(book.classId, book.bookId, subject);
      const raw = await fs.readFile(cachePath, "utf-8");
      const cached = JSON.parse(raw) as BookIndex;
      pageCount = cached.pageCount ?? cached.pages?.length ?? null;
    } catch {
      pageCount = null;
    }

    group.books.push({
      id: book.bookId,
      name: book.bookName,
      fileName: book.fileName,
      pageCount,
      kind: book.kind,
    });
  }

  return [...byClass.values()].map((group) => ({
    ...group,
    books: group.books.sort((a, b) => {
      if (a.kind !== b.kind) {
        return a.kind === "analytical-program" ? -1 : 1;
      }
      return a.name.localeCompare(b.name, "el");
    }),
  }));
}

function normalizeSearch(text: string): string {
  return text
    .toLocaleLowerCase("el")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSnippet(text: string, query: string, radius = 110): string {
  const lower = text.toLocaleLowerCase("el");
  const q = query.toLocaleLowerCase("el");
  const idx = lower.indexOf(q);
  if (idx < 0) {
    return text.slice(0, radius * 2).trim() + (text.length > radius * 2 ? "…" : "");
  }
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + q.length + radius);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";
  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}

function scorePage(text: string, terms: string[]): number {
  const normalized = normalizeSearch(text);
  if (!normalized) return 0;
  let score = 0;
  for (const term of terms) {
    if (!term) continue;
    let from = 0;
    let count = 0;
    while (true) {
      const idx = normalized.indexOf(term, from);
      if (idx < 0) break;
      count += 1;
      from = idx + term.length;
      if (count > 20) break;
    }
    if (count === 0) return 0;
    score += count * (term.length > 4 ? 3 : 2);
    if (normalized.includes(` ${term} `) || normalized.startsWith(`${term} `)) {
      score += 2;
    }
  }
  return score;
}

export async function searchPhysicsBooks(
  query: string,
  limit = 40,
  subject: BookSubject = "physics"
): Promise<{ hits: PhysicsSearchHit[]; indexedBooks: number; totalBooks: number }> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return { hits: [], indexedBooks: 0, totalBooks: 0 };
  }

  const terms = normalizeSearch(trimmed)
    .split(" ")
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
  if (terms.length === 0) {
    return { hits: [], indexedBooks: 0, totalBooks: 0 };
  }

  const books = await listPhysicsBooks(subject);
  const hits: PhysicsSearchHit[] = [];
  let indexedBooks = 0;

  for (const book of books) {
    const index = await getBookIndex(book, { subject });
    indexedBooks += 1;
    for (const page of index.pages) {
      let score = scorePage(page.text, terms);
      if (score <= 0) continue;
      // Keep analytical-program (δείκτες επάρκειας/επιτυχίας) visible in results.
      if (book.kind === "analytical-program") score += 4;
      hits.push({
        classId: book.classId,
        className: book.className,
        bookId: book.bookId,
        bookName: book.bookName,
        fileName: book.fileName,
        kind: book.kind,
        page: page.page,
        snippet: buildSnippet(page.text, trimmed),
        score,
      });
    }
  }

  hits.sort(
    (a, b) =>
      b.score - a.score ||
      (a.kind === "analytical-program" ? 0 : 1) -
        (b.kind === "analytical-program" ? 0 : 1) ||
      a.page - b.page
  );
  return {
    hits: hits.slice(0, limit),
    indexedBooks,
    totalBooks: books.length,
  };
}

export interface CurriculumIndicator {
  code: string;
  text: string;
  full: string;
}

function cleanIndicatorBody(raw: string): string {
  let body = raw.replace(/\s+/g, " ").trim();
  // Safety cuts if any residual col2/col3 text still leaked in.
  body = body.split(/\s+Δραστηριότητα\b/i)[0] ?? body;
  body = body.split(/\s+Δεξ\./i)[0] ?? body;
  body = body.split(/\s+Δείγματικ/i)[0] ?? body;
  body = body.split(/\s+Πληροφορίες,\s*Έννοιες/i)[0] ?? body;
  body = body.split(/\s+Έννοιες\s*\/\s*Πληροφορίες/i)[0] ?? body;
  body = body.split(/\s+Διδακτέα\b/i)[0] ?? body;
  body = body.split(/\s+Μορφές\s+ενέργειας\b/i)[0] ?? body;
  body = body.split(/\s+Δεξιότητες\s*\/\s*Στρατηγικές/i)[0] ?? body;

  // Keep original wording; prefer ending on a full stop when present.
  const firstSentence = body.match(/^(.{20,400}?\.)(?:\s|$)/);
  if (firstSentence?.[1]) {
    return firstSentence[1].replace(/\s+/g, " ").trim();
  }
  return `${body.slice(0, 360).replace(/[.,;:\s]+$/, "")}.`.replace(/\.\.$/, ".");
}

/** Keep δείκτες exactly as written in the Analytical Program (no rephrasing). */
function formatSuccessIndicator(_code: string, body: string): string {
  const cleaned = cleanIndicatorBody(body).replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  return /[.!;;]$/.test(cleaned) ? cleaned : `${cleaned}.`;
}

function extractCurriculumIndicatorsDetailed(text: string): CurriculumIndicator[] {
  const indicators: CurriculumIndicator[] = [];
  const pattern =
    /(\d+\.\d+)\s+((?:Ερμηνεύουν|Εξηγούν|Ορίζουν|Αναγνωρίζουν|Αναφέρουν|Συνδέουν|Συγκρίνουν|Υπολογίζουν|Χρησιμοποιούν|Περιγράφουν|Εφαρμόζουν|Διακρίνουν|Επιχειρηματολογούν|Αξιολογούν|Αιτιολογούν|Αξιοποιούν|Να\s+[α-ωά-ώ]+|[Α-ΩΆΈΉΊΌΎΏ][α-ωά-ώ]+)[\s\S]*?)(?=(?:\d+\.\d+\s)|Δεξ\.|Δραστηριότητα\b|$)/g;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const code = match[1];
    const body = cleanIndicatorBody(match[2]);
    if (body.length < 15 || isChartOrAxisNoise(body)) continue;
    // Hard reject any residual column-2/3 leakage.
    if (
      /Δραστηριότητα|Διδακτέα|Δεξ\.|Μορφές\s+ενέργειας|Πληροφορίες,\s*Έννοιες/i.test(
        body
      )
    ) {
      continue;
    }
    const full = formatSuccessIndicator(code, body);
    if (!full || !isMeaningfulObjective(full)) continue;
    if (/Δραστηριότητα/i.test(full)) continue;
    indicators.push({
      code,
      text: body,
      full,
    });
    if (indicators.length >= 20) break;
  }

  return indicators;
}

function extractCurriculumIndicators(text: string): string[] {
  const detailed = extractCurriculumIndicatorsDetailed(text);
  if (detailed.length > 0) {
    return uniqueStrings(detailed.map((item) => item.full)).slice(0, 8);
  }

  return uniqueStrings(
    extractSentences(text, 8).filter((s) =>
      /(να είναι σε θέση|ερμηνεύουν|ορίζουν|υπολογίζουν|μετρούν|εφαρμόζουν|αναγνωρίζουν)/i.test(
        s
      )
    )
  ).slice(0, 8);
}

function friendlyClassLabel(className: string): string {
  const map: Record<string, string> = {
    "A Koinos Kormos": "Α΄ Λυκείου — Κοινός Κορμός",
    "A Prosanatolismou": "Α΄ Λυκείου — Προσανατολισμός",
    "B Gym": "Β΄ Γυμνασίου",
    "B Kateuthinsi": "Β΄ Λυκείου — Κατεύθυνση",
    "B Koinou Kormou": "Β΄ Λυκείου — Κοινού Κορμού",
    "G Gym": "Γ΄ Γυμνασίου",
    "G Katefthinsi": "Γ΄ Λυκείου — Κατεύθυνση",
    "G Koinou Kormou": "Γ΄ Λυκείου — Κοινού Κορμού",
    "Gym A": "Α΄ Γυμνασίου",
    "Gym B": "Β΄ Γυμνασίου",
    "Gym C": "Γ΄ Γυμνασίου",
    "Lyk A kk": "Α΄ Λυκείου — Κοινός Κορμός",
    "Lyk A pros": "Α΄ Λυκείου — Προσανατολισμός",
    "Lyk B kk": "Β΄ Λυκείου — Κοινός Κορμός",
    "Lyk B kateu": "Β΄ Λυκείου — Κατεύθυνση",
    "Lyk C kk": "Γ΄ Λυκείου — Κοινός Κορμός",
    "Lyk C kateu": "Γ΄ Λυκείου — Κατεύθυνση",
    Propara: "Προπαρασκευαστική",
    Epaggelmatiki: "Επαγγελματική",
    Metanasteftiki: "Μεταναστευτική",
  };
  return map[className] ?? className;
}

function subjectLabel(subject: BookSubject): string {
  return subject === "maths" ? "Μαθηματικά" : "Φυσική";
}

function extractChapterAndUnit(
  combined: string,
  fallbackChapter = "Φυσική"
): {
  chapter: string;
  unit: string;
  activityRefs: string[];
} {
  const chapterMatch =
    combined.match(/ΚΕΦΑΛΑΙΟ\s+(\d+)/i) ||
    combined.match(/\bCHAPTER\s+(\d+)/i);
  const titleMatch = combined.match(
    /\b(ΥΛΗ ΚΑΙ ΕΝΕΡΓΕΙΑ|ΚΙΝΗΣΕΙΣ|ΔΥΝΑΜΕΙΣ|ΕΝΕΡΓΕΙΑ|ΟΠΤΙΚΗ|ΗΛΕΚΤΡΙΣΜΟΣ|ΘΕΡΜΟΤΗΤΑ)[^\n.]{0,40}/i
  );
  const activityRefs = uniqueStrings(
    [...combined.matchAll(/Δραστηριότητα\s+(\d+\.\d+[α-ω]?)/gi)].map(
      (m) => m[0].replace(/\s+/g, " ")
    )
  );

  const chapterNumber = chapterMatch?.[1];
  const chapterTitle = titleMatch?.[1] ?? titleMatch?.[0];
  const chapter = chapterNumber
    ? chapterTitle
      ? `Κεφάλαιο ${chapterNumber}: ${chapterTitle}`
      : `Κεφάλαιο ${chapterNumber}`
    : chapterTitle ?? fallbackChapter;

  const unit =
    activityRefs[0]?.replace(/^Δραστηριότητα\s+/i, "Δραστηριότητα ") ??
    chapterTitle ??
    "Διδακτική ενότητα";

  return { chapter, unit, activityRefs };
}

/**
 * Σημεία έμφασης come only from the selected book pages.
 * If nothing relevant is found, return empty — never invent generic fillers.
 */
function extractEmphasisPoints(combined: string): string {
  const normalized = normalizePdfText(combined);
  if (!normalized || isChartOrAxisNoise(normalized)) return "";

  const points: string[] = [];

  // Explicit emphasis / goal lines from the book.
  for (const match of normalized.matchAll(
    /(?:Σημεία έμφασης|Έμφαση|Στόχος της δραστηριότητας[^.]{0,40}?είναι να)\s*[:：]?\s*(.{12,140}?)(?:\.|$)/gi
  )) {
    const value = normalizePdfText(match[1] ?? "");
    if (value && !isChartOrAxisNoise(value)) points.push(value);
  }

  // Activity titles as topical emphasis.
  for (const match of normalized.matchAll(
    /Δραστηριότητα\s+\d+\.\d+[α-ω]?[:：]?\s*«([^»]{6,80})»/gi
  )) {
    const title = normalizePdfText(match[1] ?? "");
    if (title && !isChartOrAxisNoise(title)) points.push(title);
  }
  for (const match of normalized.matchAll(
    /Δραστηριότητα\s+\d+\.\d+[α-ω]?[:：]\s*([Α-ΩΆΈΉΊΌΎΏA-Z][^.]{6,70})/g
  )) {
    const title = normalizePdfText(match[1] ?? "");
    if (title && !isChartOrAxisNoise(title) && !/^Να\s+/i.test(title)) {
      points.push(title);
    }
  }

  // Concept terms that actually appear in the selected book text.
  const conceptPattern =
    /\b(στερε[άα]|υγρ[άα]|αέρι\w*|θερμοκρασί\w*|θερμόμετρ\w*|θερμότητα|ενέργει\w*|δύναμ\w*|ταχύτητ\w*|επιτάχυνσ\w*|μάζα|όγκο\w*|σχήμα|μόρι\w*|δομικ\w*\s+λίθ\w*|πυκνότητ\w*|πίεσ\w*|ρεύμα|τάση|αντίστασ\w*|μαγνητικ\w*|φωτ\w*|ήχο\w*|κύματ\w*|προσομοίωσ\w*|πείραμα|πειραματικ\w*)\b/gi;
  for (const match of normalized.matchAll(conceptPattern)) {
    const term = normalizePdfText(match[0] ?? "").toLocaleLowerCase("el");
    if (term.length >= 4) points.push(term);
  }

  // Skills / materials only when the book itself mentions them.
  if (/προσομοίωσ/i.test(normalized)) points.push("χρήση προσομοιώσεων");
  if (/πείραμα|πειραματικ|δοχείο ζέσεως|θερμόμετρο|σύριγγα/i.test(normalized)) {
    points.push("πειραματικές δεξιότητες");
  }
  if (/καθημεριν|παράδειγμ/i.test(normalized)) {
    points.push("παραδείγματα από την καθημερινή ζωή");
  }

  const cleaned = uniqueStrings(points)
    .filter((item) => item.length >= 4 && item.length <= 120 && !isChartOrAxisNoise(item))
    .slice(0, 10);

  return cleaned.join(", ");
}

function extractPrerequisites(combined: string): string {
  const hints = uniqueStrings(
    [
      ...[...combined.matchAll(/\b(στερεά|υγρά|αέρια|ύλη|σωματίδια|μόρια|θερμό|κρύο|μάζα|όγκος|σχήμα)\b/gi)].map(
        (m) => m[0].toLocaleLowerCase("el")
      ),
      "βασική χρήση οργάνων μέτρησης",
      "παρατήρηση και καταγραφή αποτελεσμάτων",
      "χρήση προσομοιώσεων",
    ]
  ).slice(0, 8);
  return hints.join(", ");
}

async function findRelatedAnalyticalProgramPassages(
  classId: string,
  seedText: string,
  limit = 5,
  subject: BookSubject = "physics"
): Promise<{ book: PhysicsBookRef; page: number; text: string; score: number }[]> {
  const ap = await findAnalyticalProgramForClass(classId, subject);
  if (!ap) return [];

  const terms = uniqueStrings(
    normalizeSearch(seedText)
      .split(" ")
      .map((t) => t.trim())
      .filter(
        (t) =>
          t.length >= 5 &&
          !/^\d+[.,]?\d*$/.test(t) &&
          !/^(min|cm|kg|sec|θερμοκρασια|χρονος)$/i.test(t)
      )
  ).slice(0, 12);

  if (terms.length === 0) return [];

  const index = await getBookIndex(ap, { subject });
  const scored = index.pages
    .map((page) => ({
      book: ap,
      page: page.page,
      text: page.text,
      leftColumnText: page.leftColumnText,
      score: scorePage(pageTextForIndicators(page), terms.slice(0, 8)),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}

function seedTermsFromText(seedText: string): string[] {
  return uniqueStrings(
    normalizeSearch(seedText)
      .split(" ")
      .map((t) => t.trim())
      .filter(
        (t) =>
          t.length >= 4 &&
          !/^\d+[.,]?\d*$/.test(t) &&
          !/^(min|cm|kg|sec|και|των|της|του|στις|απο|για)$/i.test(t)
      )
  ).slice(0, 16);
}

function scoreIndicatorAgainstSeed(
  indicator: CurriculumIndicator,
  terms: string[],
  activityCodes: string[]
): number {
  let score = scorePage(`${indicator.code} ${indicator.text}`, terms);
  if (activityCodes.some((code) => code === indicator.code)) score += 40;
  if (
    activityCodes.some((code) => {
      const chapter = code.split(".")[0];
      return chapter && indicator.code.startsWith(`${chapter}.`);
    })
  ) {
    score += 12;
  }
  return score;
}

/**
 * Pull δείκτες επιτυχίας directly from the class Analytical Program,
 * ranked against the selected textbook content. Returns at most `limit` items.
 */
async function selectAnalyticalProgramTargets(
  classId: string,
  seedText: string,
  activityCodes: string[],
  limit = 3,
  subject: BookSubject = "physics"
): Promise<{ book: PhysicsBookRef; indicators: CurriculumIndicator[] } | null> {
  const ap = await findAnalyticalProgramForClass(classId, subject);
  if (!ap) return null;

  const index = await getBookIndex(ap, { subject });
  const all = index.pages.flatMap((page) =>
    extractCurriculumIndicatorsDetailed(pageTextForIndicators(page))
  );
  const unique = new Map<string, CurriculumIndicator>();
  for (const item of all) {
    if (!unique.has(item.code)) unique.set(item.code, item);
  }

  const terms = seedTermsFromText(seedText);
  const ranked = [...unique.values()]
    .map((indicator) => ({
      indicator,
      score: scoreIndicatorAgainstSeed(indicator, terms, activityCodes),
    }))
    .filter((entry) => entry.score > 0 || activityCodes.includes(entry.indicator.code))
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.indicator.code.localeCompare(b.indicator.code, "el", { numeric: true })
    );

  // Prefer scored matches; if nothing scored, take first chapter-related codes.
  let picked = ranked
    .filter((entry) => entry.score > 0)
    .slice(0, limit)
    .map((entry) => entry.indicator);

  if (picked.length < 2 && activityCodes.length > 0) {
    const chapter = activityCodes[0]?.split(".")[0];
    const seen = new Set(picked.map((item) => item.code));
    for (const item of unique.values()) {
      if (picked.length >= limit) break;
      if (seen.has(item.code)) continue;
      if (chapter && item.code.startsWith(`${chapter}.`)) {
        picked.push(item);
        seen.add(item.code);
      }
    }
  }

  if (picked.length === 0) {
    picked = [...unique.values()].slice(0, limit);
  }

  return {
    book: ap,
    indicators: picked.slice(0, limit),
  };
}

function normalizePdfText(text: string): string {
  return text
    .replace(/(\p{L})-\s+(\p{L})/gu, "$1$2")
    .replace(/\s+/g, " ")
    .trim();
}

/** Reject graph axes, tick labels, and other non-objective PDF noise. */
function isChartOrAxisNoise(text: string): boolean {
  const t = normalizePdfText(text);
  if (
    /[℃°]|Χρόνος\s*\(|Θερμοκρασία\s*\(|\(min\)|\(m\)|\(s\)|άξονας|γραφική παράσταση/i.test(
      t
    )
  ) {
    return true;
  }
  const digitTokens = t.match(/\d+[.,]?\d*/g) ?? [];
  const wordTokens = t.match(/[A-Za-zΑ-Ωα-ωΆ-Ώά-ώ]{3,}/g) ?? [];
  if (digitTokens.length >= 5 && digitTokens.length >= wordTokens.length) {
    return true;
  }
  if (/(?:\d+\s+){4,}\d+/.test(t)) return true;
  return false;
}

function isMeaningfulObjective(text: string): boolean {
  const t = normalizePdfText(text);
  if (t.length < 20 || t.length > 420) return false;
  if (isChartOrAxisNoise(t)) return false;
  if (!/[α-ωά-ώ]{4,}/i.test(t)) return false;
  // Accept AP verb forms as-is ("Ερμηνεύουν…") and "να …" forms.
  return /(να\s+\w+|ερμηνεύ|εξηγ|ορίζ|αναγνωρ|συγκρίν|υπολογ|συνδέ|διακρίν|περιγράφ|μετρ|εφαρμ|κατατάσ|αναφέρ|επιχειρηματολογ|αξιολογ|αξιοποι|αιτιολογ|χρησιμοποι)/i.test(
    t
  );
}

function extractActivityGoals(text: string): string[] {
  const normalized = normalizePdfText(text);
  const goals: string[] = [];
  const patterns = [
    /Στόχος της δραστηριότητας[^.]{0,100}?είναι να\s+(.+?)(?:\.|$)/gi,
    /Στόχος[:：]\s*(?:να\s+)?(.+?)(?:\.|$)/gi,
  ];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(normalized)) !== null) {
      const goal = normalizePdfText(match[1] ?? "");
      if (!goal || isChartOrAxisNoise(goal)) continue;
      const full = goal.startsWith("να ")
        ? `Οι μαθητές/τριες ${goal}.`
        : `Οι μαθητές/τριες να ${goal}.`;
      if (isMeaningfulObjective(full)) goals.push(full.replace(/\.\.$/, "."));
    }
  }
  return uniqueStrings(goals);
}

function extractActivityTitles(text: string): string[] {
  const normalized = normalizePdfText(text);
  return uniqueStrings(
    [...normalized.matchAll(/Δραστηριότητα\s+(\d+\.\d+[α-ω]?)[:：]?\s*«?([^»."…]{8,90})»?/gi)]
      .map((match) => {
        const code = match[1];
        const title = normalizePdfText(match[2] ?? "").replace(/^[-–—\s]+/, "");
        if (!title || isChartOrAxisNoise(title)) return "";
        return `Οι μαθητές/τριες να ολοκληρώνουν τη Δραστηριότητα ${code} («${title}») και να εξηγούν τα βασικά συμπεράσματά της.`;
      })
      .filter(Boolean)
  );
}

function extractHeadings(text: string): string[] {
  const candidates = text
    .split(/(?<=[.!;:])\s+|\s{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  const headings: string[] = [];
  for (const part of candidates) {
    if (part.length < 8 || part.length > 120) continue;
    if (isChartOrAxisNoise(part)) continue;
    const looksLikeHeading =
      /^(κεφάλαιο|ενότητα|δραστηριότ|άσκηση|θεωρία|\d+(\.\d+)*)/i.test(part) ||
      (/[Α-ΩΆΈΉΊΌΎΏ]{4,}/.test(part) &&
        part.split(" ").length <= 12 &&
        !/\d+\s+\d+\s+\d+/.test(part));
    if (looksLikeHeading) headings.push(part);
    if (headings.length >= 8) break;
  }
  return headings;
}

function extractSentences(text: string, max = 12): string[] {
  return text
    .split(/(?<=[.!;?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 40 && s.length <= 280)
    .slice(0, max);
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const key = normalizeSearch(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

export interface PhysicsSelectionInput {
  classId: string;
  bookId: string;
  /** Theory / content pages from the book. */
  pages: number[];
  /** Activity pages (often different from theory pages). */
  activityPages?: number[];
  subject?: BookSubject;
}

export interface LessonPlanActivityBlock {
  objective: string;
  activityPath: string;
  assessment: string;
  teacherRole: string;
  materials: string;
}

/** Matches the inspector sample: ΣΧΕΔΙΟ ΜΑΘΗΜΑΤΟΣ ΕΠΙΘΕΩΡΗΤΡΙΑ.docx */
export interface GeneratedLessonPlan {
  title: string;
  className: string;
  classLabel: string;
  bookName: string;
  pages: number[];
  activityPages: number[];
  durationMinutes: number;
  unit: string;
  chapter: string;
  /** 2–3 success indicators (δείκτες επιτυχίας) for a 40' lesson */
  successIndicators: string[];
  emphasisPoints: string;
  prerequisites: string;
  hook: string;
  hookMinutes: number;
  activityBlocks: LessonPlanActivityBlock[];
  closure: string;
  homework: string;
  materialsSummary: string;
  bibliography: string;
  analyticalProgram?: {
    bookName: string;
    indicators: string[];
  };
}

export interface GeneratedTestSuggestion {
  className: string;
  bookName: string;
  pages: number[];
  title: string;
  multipleChoice: {
    question: string;
    options: string[];
    answerIndex: number;
    sourcePage: number;
    fromAnalyticalProgram?: boolean;
  }[];
  shortAnswer: {
    question: string;
    sampleAnswer: string;
    sourcePage: number;
    fromAnalyticalProgram?: boolean;
  }[];
  problems: { prompt: string; sourcePage: number }[];
  analyticalProgram?: {
    bookName: string;
    indicators: string[];
  };
}

function parsePageSelection(
  pageCount: number,
  pages: number[]
): number[] {
  const unique = [...new Set(pages)]
    .filter((p) => Number.isInteger(p) && p >= 1 && p <= pageCount)
    .sort((a, b) => a - b);
  return unique;
}

function textbookFallbackIndicators(text: string): string[] {
  const fromGoals = uniqueStrings([
    ...extractActivityGoals(text),
    ...extractActivityTitles(text),
  ]);
  if (fromGoals.length) return fromGoals;

  const sentences = extractSentences(text, 6).filter(isMeaningfulObjective);
  if (sentences.length) return sentences;

  return extractHeadings(text)
    .slice(0, 3)
    .map(
      (heading) =>
        `Οι μαθητές/τριες να αναγνωρίζουν και να εξηγούν: ${heading}.`
    )
    .filter(isMeaningfulObjective);
}

export async function generateLessonPlanFromSelection(
  input: PhysicsSelectionInput
): Promise<GeneratedLessonPlan> {
  const subject = input.subject ?? "physics";
  const label = subjectLabel(subject);
  const book = await resolvePhysicsBook(input.classId, input.bookId, subject);
  if (!book) throw new Error("Book not found");
  const index = await getBookIndex(book, { subject });
  const pages = parsePageSelection(index.pageCount, input.pages);
  const activityPages = parsePageSelection(
    index.pageCount,
    input.activityPages ?? []
  );
  if (pages.length === 0 && activityPages.length === 0) {
    throw new Error("Select at least one theory or activity page");
  }

  const theorySelected = (pages.length ? pages : activityPages).map((page) => {
    const entry = index.pages.find((p) => p.page === page);
    return {
      page,
      text: entry?.text ?? "",
      leftColumnText: entry?.leftColumnText,
    };
  });
  const activitySelected = (activityPages.length ? activityPages : pages).map(
    (page) => {
      const entry = index.pages.find((p) => p.page === page);
      return {
        page,
        text: entry?.text ?? "",
        leftColumnText: entry?.leftColumnText,
      };
    }
  );

  const theoryText = theorySelected.map((s) => s.text).join("\n");
  const activityText = activitySelected.map((s) => s.text).join("\n");
  const combined = [theoryText, activityText].filter(Boolean).join("\n");
  const combinedNormalized = normalizePdfText(combined);

  const fromActivity = extractChapterAndUnit(activityText, label);
  const fromTheory = extractChapterAndUnit(theoryText, label);
  const chapter = fromTheory.chapter !== label ? fromTheory.chapter : fromActivity.chapter;
  const unit = fromActivity.activityRefs[0]
    ? fromActivity.unit
    : fromActivity.unit !== "Διδακτική ενότητα"
      ? fromActivity.unit
      : fromTheory.unit;
  const activityRefs =
    fromActivity.activityRefs.length > 0
      ? fromActivity.activityRefs
      : fromTheory.activityRefs;
  const activityCodes = activityRefs
    .map((ref) => ref.match(/(\d+\.\d+)/)?.[1])
    .filter((code): code is string => !!code);

  const apTargets =
    book.kind === "analytical-program"
      ? {
          book,
          indicators: (() => {
            const seen = new Set<string>();
            const list: CurriculumIndicator[] = [];
            for (const page of [...theorySelected, ...activitySelected]) {
              for (const item of extractCurriculumIndicatorsDetailed(
                pageTextForIndicators(page)
              )) {
                if (seen.has(item.code)) continue;
                seen.add(item.code);
                list.push(item);
                if (list.length >= 3) return list;
              }
            }
            return list;
          })(),
        }
      : await selectAnalyticalProgramTargets(
          book.classId,
          combinedNormalized,
          activityCodes,
          3,
          subject
        );

  // Targets come only from Αναλυτικό Πρόγραμμα δείκτες επιτυχίας (2–3 max).
  let finalIndicators = (apTargets?.indicators ?? [])
    .map((item) => item.full)
    .filter(
      (item) =>
        isMeaningfulObjective(item) &&
        !/Δραστηριότητα|Διδακτέα|Δεξ\./i.test(item)
    )
    .slice(0, 3);

  if (finalIndicators.length === 0 && subject === "maths") {
    finalIndicators = textbookFallbackIndicators(combinedNormalized).slice(0, 3);
  }

  if (finalIndicators.length === 0) {
    throw new Error(
      "Δεν βρέθηκαν δείκτες επιτυχίας στο Αναλυτικό Πρόγραμμα για αυτή την τάξη/επιλογή."
    );
  }

  const emphasisPoints = extractEmphasisPoints(theoryText || combined);
  const prerequisites = extractPrerequisites(theoryText || combined);
  const activityLabel =
    activityRefs.slice(0, 2).join(" / ") || unit || chapter;

  const hook = `Ως αφόρμηση, ο/η εκπαιδευτικός αξιοποιεί το πλαίσιο της ${activityLabel}. Παρουσιάζει σύντομα το σενάριο/ερώτημα της δραστηριότητας και ζητά από τους/τις μαθητές/τριες να διατυπώσουν υποθέσεις ή αρχικές ιδέες. Αξιοποιώντας τον διαθέσιμο χρόνο, δίνει τον λόγο σε όσο το δυνατόν περισσότερους μαθητές ώστε να ακουστούν διαφορετικές απόψεις. Το βασικό ερώτημα παραμένει ανοιχτό για να απαντηθεί μετά τη διερεύνηση.`;

  const materialsSource = activityText || combined;
  const materialsSummary = `Βιβλίο μαθητή (${book.bookName}), πίνακας, ηλεκτρονικός υπολογιστής, βιντεοπροβολέας, διαδίκτυο${
    /προσομοίωση|PhET|QR/i.test(materialsSource) ? ", προσομοιώσεις" : ""
  }${
    /δοχείο|θερμόμετρο|σύριγγα|μπαλόνι|πειραμα/i.test(materialsSource)
      ? ", πειραματικά υλικά της δραστηριότητας"
      : ""
  }.`;

  const activityBlocks: LessonPlanActivityBlock[] = finalIndicators.map(
    (objective, index) => {
      const activityRef = activityRefs[index] ?? activityRefs[0] ?? activityLabel;

      return {
        objective,
        activityPath: `Οι μαθητές/τριες εργάζονται στην ολομέλεια ή σε μικρές ομάδες με βάση την ${activityRef}. Ο/Η εκπαιδευτικός καθοδηγεί τη δραστηριότητα βήμα-βήμα, θέτει ερωτήματα παρατήρησης/ερμηνείας και ζητά συμπλήρωση των σχετικών σημείων στο βιβλίο. Στο τέλος της δραστηριότητας διατυπώνονται τα βασικά συμπεράσματα στην ολομέλεια.`,
        assessment: `Στην αφόρμηση διενεργείται διαγνωστική αξιολόγηση των προϋπάρχουσων γνώσεων. Κατά τη δραστηριότητα διενεργείται διαμορφωτική αξιολόγηση μέσω παρατήρησης συμμετοχής, προφορικών απαντήσεων και ελέγχου της ορθότητας των συμπληρώσεων στο βιβλίο. Στο τέλος αξιολογείται αν επιτεύχθηκε ο δείκτης επιτυχίας.`,
        teacherRole: `Ο/Η εκπαιδευτικός έχει προετοιμάσει εκ των προτέρων τα μέσα της δραστηριότητας ώστε το μάθημα των 40′ να κυλήσει χωρίς καθυστερήσεις. Κατευθύνει την πορεία με στοχευμένες ερωτήσεις, διατηρεί την οργάνωση της τάξης, ελέγχει τις απαντήσεις και καταγράφει στον πίνακα τους ορθούς ορισμούς/συμπεράσματα.`,
        materials: materialsSummary,
      };
    }
  );

  const closure = `Ο/Η εκπαιδευτικός πραγματοποιεί σύντομη σύνοψη των βασικών σημείων του μαθήματος, ανακεφαλαιώνοντας τις σημαντικότερες έννοιες που διδάχθηκαν. Στη συνέχεια, οι μαθητές/τριες συμπληρώνουν ατομικά μία κάρτα εξόδου με 2–3 σύντομες ερωτήσεις. Η κάρτα εξόδου λειτουργεί ως εργαλείο τελικής διαμορφωτικής αξιολόγησης για το κατά πόσο επιτεύχθηκαν οι δείκτες επιτυχίας του 40λεπτου μαθήματος.`;

  const homework = `Επανάληψη από το βιβλίο μαθητή (${book.bookName}): ολοκλήρωση των ανοικτών σημείων της ${activityLabel} και 1–2 σχετικές ασκήσεις εμπέδωσης.`;

  const bibliographyParts = [
    `Βιβλίο μαθητή: ${book.bookName}`,
  ];
  if (apTargets?.book) {
    bibliographyParts.push(`Αναλυτικό Πρόγραμμα: ${apTargets.book.bookName}`);
  }

  return {
    title: "Σχέδιο Μαθήματος",
    className: book.className,
    classLabel: friendlyClassLabel(book.className),
    bookName: book.bookName,
    pages: pages.length ? pages : activityPages,
    activityPages: activityPages.length ? activityPages : pages,
    durationMinutes: 40,
    unit,
    chapter,
    successIndicators: finalIndicators,
    emphasisPoints,
    prerequisites,
    hook,
    hookMinutes: 5,
    activityBlocks,
    closure,
    homework,
    materialsSummary,
    bibliography: bibliographyParts.join(" · "),
    analyticalProgram: apTargets
      ? {
          bookName: apTargets.book.bookName,
          indicators: finalIndicators,
        }
      : undefined,
  };
}

function pickDefinitionLike(sentences: string[]): string[] {
  return sentences.filter((s) =>
    /(είναι|ονομάζεται|καλείται|ορίζεται|σημαίνει|ισούται)/i.test(s)
  );
}

export async function generateTestFromSelection(
  input: PhysicsSelectionInput
): Promise<GeneratedTestSuggestion> {
  const subject = input.subject ?? "physics";
  const book = await resolvePhysicsBook(input.classId, input.bookId, subject);
  if (!book) throw new Error("Book not found");
  const index = await getBookIndex(book, { subject });
  const pages = parsePageSelection(index.pageCount, input.pages);
  if (pages.length === 0) throw new Error("Select at least one valid page");

  const selected = pages.map((page) => {
    const entry = index.pages.find((p) => p.page === page);
    return { page, text: entry?.text ?? "" };
  });

  const headings = uniqueStrings(selected.flatMap((s) => extractHeadings(s.text)));
  const sentences = uniqueStrings(
    selected.flatMap((s) => extractSentences(s.text, 20))
  );
  const definitions = pickDefinitionLike(sentences);

  const multipleChoice = definitions.slice(0, 4).map((sentence, i) => {
    const source =
      selected.find((s) => s.text.includes(sentence.slice(0, 40)))?.page ??
      pages[0];
    const topicHint = headings[i % Math.max(headings.length, 1)] ?? "την έννοια";
    const stem = sentence.length > 160 ? `${sentence.slice(0, 157)}…` : sentence;
    const distractors =
      subject === "maths"
        ? [
            "Δεν σχετίζεται με τα Μαθηματικά του κεφαλαίου.",
            `Αφορά μόνο γενική περιγραφή χωρίς σχέση με ${topicHint}.`,
            "Ισχύει μόνο ως αριθμητικό παράδειγμα χωρίς αιτιολόγηση.",
          ]
        : [
            "Δεν σχετίζεται με τη Φυσική του κεφαλαίου.",
            `Αφορά μόνο μαθηματικό ορισμό χωρίς σχέση με ${topicHint}.`,
            "Ισχύει μόνο σε συνθήκες κενού και όχι στην καθημερινότητα.",
          ];
    return {
      question: `Ποια από τις παρακάτω δηλώσεις είναι σωστή με βάση το βιβλίο;\n«${stem}»`,
      options: [stem, ...distractors].map((opt, idx) =>
        idx === 0 ? "Η παραπάνω δήλωση όπως δίνεται στο βιβλίο" : opt
      ),
      answerIndex: 0,
      sourcePage: source,
    };
  });

  while (multipleChoice.length < Math.min(3, Math.max(1, headings.length))) {
    const heading = headings[multipleChoice.length] ?? book.bookName;
    const source = pages[multipleChoice.length % pages.length];
    multipleChoice.push({
      question: `Τι εξετάζει / εισάγει η ενότητα «${heading}»;`,
      options: [
        `Βασικές έννοιες και παραδείγματα σχετικά με «${heading}»`,
        "Ιστορία της τέχνης",
        "Κανόνες γραμματικής",
        "Γεωγραφία της Κύπρου",
      ],
      answerIndex: 0,
      sourcePage: source,
    });
  }

  const shortAnswer: GeneratedTestSuggestion["shortAnswer"] = (
    definitions.length ? definitions : sentences
  )
    .slice(0, 4)
    .map((sentence) => {
      const source =
        selected.find((s) => s.text.includes(sentence.slice(0, 40)))?.page ??
        pages[0];
      const concept =
        extractHeadings(sentence)[0] ||
        sentence.split(/[,:]/)[0]?.slice(0, 60) ||
        "την κύρια έννοια";
      return {
        question: `Εξήγησε με δικά σου λόγια: ${concept}`,
        sampleAnswer: sentence.slice(0, 220),
        sourcePage: source,
      };
    });

  const problems = selected
    .flatMap((entry) => {
      const hasNumbers = /\d+[.,]?\d*\s*(m|cm|km|s|kg|N|J|W|V|A|°C)?/i.test(
        entry.text
      );
      const hasExercise = /(άσκηση|υπολογ|πρόβλημα|ερώτηση)/i.test(entry.text);
      if (!hasNumbers && !hasExercise) return [];
      return [
        {
          prompt: `Με βάση τη σελίδα ${entry.page}, διατύπωσε και επίλυσε ένα πρόβλημα υπολογισμού ή εφαρμογής από το περιεχόμενο (μονάδες, τύποι, αποτέλεσμα).`,
          sourcePage: entry.page,
        },
      ];
    })
    .slice(0, 3);

  if (problems.length === 0) {
    problems.push({
      prompt: `Επίλεξε μία βασική έννοια από τις σελίδες ${pages.join(", ")} και δώσε ένα αριθμητικό παράδειγμα εφαρμογής της.`,
      sourcePage: pages[0],
    });
  }

  const seedText = selected.map((s) => s.text).join(" ");
  const apPassages =
    book.kind === "analytical-program"
      ? []
      : await findRelatedAnalyticalProgramPassages(
          book.classId,
          seedText,
          3,
          subject
        );
  const apIndicators = uniqueStrings(
    apPassages.flatMap((passage) =>
      extractCurriculumIndicators(pageTextForIndicators(passage))
    )
  ).slice(0, 5);

  for (const indicator of apIndicators.slice(0, 2)) {
    shortAnswer.push({
      question: `Με βάση το Αναλυτικό Πρόγραμμα: ${indicator.slice(0, 160)}`,
      sampleAnswer: indicator.slice(0, 220),
      sourcePage: apPassages[0]?.page ?? pages[0],
      fromAnalyticalProgram: true,
    });
  }

  return {
    className: book.className,
    bookName: book.bookName,
    pages,
    title: `Πρόταση διαγωνίσματος — ${book.className} / ${book.bookName}`,
    multipleChoice,
    shortAnswer: shortAnswer.slice(0, 6),
    problems,
    analyticalProgram:
      apIndicators.length > 0 && apPassages[0]
        ? {
            bookName: apPassages[0].book.bookName,
            indicators: apIndicators,
          }
        : undefined,
  };
}

export async function ensureBookPageCount(
  classId: string,
  bookId: string,
  subject: BookSubject = "physics"
): Promise<{ pageCount: number; book: PhysicsBookRef }> {
  const book = await resolvePhysicsBook(classId, bookId, subject);
  if (!book) throw new Error("Book not found");
  const index = await getBookIndex(book, { subject });
  return { pageCount: index.pageCount, book };
}
