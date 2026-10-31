import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";

export const PHYSICS_BOOKS_ROOT = path.join(process.cwd(), "Books", "Physics");
const INDEX_ROOT = path.join(process.cwd(), "data", "physics-index");
/** Bump when extraction/normalization changes so cached indexes rebuild. */
const INDEX_VERSION = 2;

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

function indexFilePath(classId: string, bookId: string): string {
  return path.join(INDEX_ROOT, classId, `${bookId}.json`);
}

export async function listPhysicsBooks(): Promise<PhysicsBookRef[]> {
  const entries = await fs.readdir(PHYSICS_BOOKS_ROOT, { withFileTypes: true });
  const classes = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, "el"));

  const books: PhysicsBookRef[] = [];
  for (const className of classes) {
    const classDir = path.join(PHYSICS_BOOKS_ROOT, className);
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
  classId: string
): Promise<PhysicsBookRef | null> {
  const books = await listPhysicsBooks();
  return (
    books.find(
      (book) => book.classId === classId && book.kind === "analytical-program"
    ) ?? null
  );
}

export async function resolvePhysicsBook(
  classId: string,
  bookId: string
): Promise<PhysicsBookRef | null> {
  const books = await listPhysicsBooks();
  return (
    books.find((book) => book.classId === classId && book.bookId === bookId) ??
    null
  );
}

export function absoluteBookPath(book: PhysicsBookRef): string {
  return path.join(PHYSICS_BOOKS_ROOT, book.relativePath);
}

/**
 * Rebuild readable text from PDF.js glyph items.
 * Many Physics PDFs emit letters like "μ" as separate items; joining with spaces
 * produced broken words ("Σφάλ μ α"). Use horizontal gaps to decide word breaks.
 */
function reconstructPageText(items: Array<PdfTextItem | { type?: string }>): string {
  const fragments: TextFragment[] = [];

  for (const item of items) {
    if (!("str" in item) || typeof item.str !== "string") continue;
    const transform = item.transform;
    if (!transform || transform.length < 6) continue;
    const x = transform[4];
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

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = reconstructPageText(
      content.items as Array<PdfTextItem | { type?: string }>
    );
    pages.push({ page: pageNumber, text });
  }

  return pages;
}

export async function getBookIndex(
  book: PhysicsBookRef,
  options?: { force?: boolean }
): Promise<BookIndex> {
  const filePath = absoluteBookPath(book);
  const stat = await fs.stat(filePath);
  const cachePath = indexFilePath(book.classId, book.bookId);

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

export async function getPhysicsCatalog(): Promise<PhysicsCatalogClass[]> {
  const books = await listPhysicsBooks();
  const byClass = new Map<string, PhysicsCatalogClass>();

  for (const book of books) {
    let group = byClass.get(book.classId);
    if (!group) {
      group = { id: book.classId, name: book.className, books: [] };
      byClass.set(book.classId, group);
    }

    let pageCount: number | null = null;
    try {
      const cachePath = indexFilePath(book.classId, book.bookId);
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
  limit = 40
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

  const books = await listPhysicsBooks();
  const hits: PhysicsSearchHit[] = [];
  let indexedBooks = 0;

  for (const book of books) {
    const index = await getBookIndex(book);
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
  body = body.split(/\s+Δραστηριότητα\b/i)[0] ?? body;
  body = body.split(/\s+Δεξ\./i)[0] ?? body;
  body = body.split(/\s+Δείγματικ/i)[0] ?? body;

  const firstSentence = body.match(/^(.{20,220}?\.)(?:\s|$)/);
  if (firstSentence?.[1]) {
    return firstSentence[1].replace(/[.\s]+$/, "").trim();
  }
  return body.slice(0, 180).replace(/[.,;:\s]+$/, "").trim();
}

function formatSuccessIndicator(code: string, body: string): string {
  const cleaned = cleanIndicatorBody(body);
  const startsWithNa = /^να\s+/i.test(cleaned);
  const rest = startsWithNa
    ? cleaned
    : `να ${cleaned.charAt(0).toLocaleLowerCase("el")}${cleaned.slice(1)}`;
  return `(${code}) Οι μαθητές/τριες ${rest}.`.replace(/\.\.$/, ".");
}

function extractCurriculumIndicatorsDetailed(text: string): CurriculumIndicator[] {
  const indicators: CurriculumIndicator[] = [];
  const pattern =
    /(\d+\.\d+)\s+((?:Ερμηνεύουν|Εξηγούν|Ορίζουν|Αναγνωρίζουν|Αναφέρουν|Συνδέουν|Συγκρίνουν|Υπολογίζουν|Χρησιμοποιούν|Περιγράφουν|Να\s+[α-ωά-ώ]+|[Α-ΩΆΈΉΊΌΎΏ][α-ωά-ώ]+)[\s\S]*?)(?=(?:\d+\.\d+\s)|Δεξ\.|$)/g;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const code = match[1];
    const body = cleanIndicatorBody(match[2]);
    if (body.length < 15 || isChartOrAxisNoise(body)) continue;
    const full = formatSuccessIndicator(code, body);
    if (!isMeaningfulObjective(full)) continue;
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
  };
  return map[className] ?? className;
}

function extractChapterAndUnit(combined: string): {
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
    : chapterTitle ?? "Φυσική";

  const unit =
    activityRefs[0]?.replace(/^Δραστηριότητα\s+/i, "Δραστηριότητα ") ??
    chapterTitle ??
    "Διδακτική ενότητα";

  return { chapter, unit, activityRefs };
}

function extractEmphasisPoints(combined: string, indicators: string[]): string {
  const concepts = uniqueStrings([
    ...[...combined.matchAll(/\b(στερεά|υγρά|αέρια|θερμοκρασία|θερμόμετρο|ενέργεια|δύναμη|ταχύτητα|μάζα|όγκος|σχήμα|μόρια|δομικ\w*|προσομοίωση|πείραμα)\b/gi)].map(
      (m) => m[0].toLocaleLowerCase("el")
    ),
    ...indicators
      .flatMap((item) => item.split(/[(),.]/))
      .map((part) => part.trim())
      .filter((part) => part.length > 4 && part.length < 40),
  ]).slice(0, 8);

  const extras = [
    "χρήση προσομοιώσεων",
    "πειραματικές δεξιότητες",
    "παραδείγματα από την καθημερινή ζωή",
  ];
  return [...concepts, ...extras].join(", ");
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
  limit = 5
): Promise<{ book: PhysicsBookRef; page: number; text: string; score: number }[]> {
  const ap = await findAnalyticalProgramForClass(classId);
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

  const index = await getBookIndex(ap);
  const scored = index.pages
    .map((page) => ({
      book: ap,
      page: page.page,
      text: page.text,
      score: scorePage(page.text, terms.slice(0, 8)),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
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
  if (t.length < 24 || t.length > 340) return false;
  if (isChartOrAxisNoise(t)) return false;
  if (!/[α-ωά-ώ]{4,}/i.test(t)) return false;
  return /(να\s+\w+|ερμηνεύ|εξηγ|ορίζ|αναγνωρ|συγκρίν|υπολογ|συνδέ|διακρίν|περιγράφ|μετρ|εφαρμ|κατατάσ)/i.test(
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
  pages: number[];
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

export async function generateLessonPlanFromSelection(
  input: PhysicsSelectionInput
): Promise<GeneratedLessonPlan> {
  const book = await resolvePhysicsBook(input.classId, input.bookId);
  if (!book) throw new Error("Book not found");
  const index = await getBookIndex(book);
  const pages = parsePageSelection(index.pageCount, input.pages);
  if (pages.length === 0) throw new Error("Select at least one valid page");

  const selected = pages.map((page) => {
    const entry = index.pages.find((p) => p.page === page);
    return { page, text: entry?.text ?? "" };
  });

  const combined = selected.map((s) => s.text).join("\n");
  const combinedNormalized = normalizePdfText(combined);
  const { chapter, unit, activityRefs } = extractChapterAndUnit(combined);
  const activityGoals = extractActivityGoals(combined);
  const activityTitleObjectives = extractActivityTitles(combined);

  const apPassages =
    book.kind === "analytical-program"
      ? selected.map((s) => ({
          book,
          page: s.page,
          text: s.text,
          score: 1,
        }))
      : await findRelatedAnalyticalProgramPassages(
          book.classId,
          combinedNormalized,
          5
        );

  const detailedIndicators = uniqueStrings(
    apPassages.flatMap((passage) =>
      extractCurriculumIndicatorsDetailed(passage.text)
        .map((item) => item.full)
        .filter((item) => isMeaningfulObjective(item))
    )
  );

  // Prefer AP indicators that share codes with selected activities (e.g. 4.1 → 4.1/4.2).
  const activityCodes = activityRefs
    .map((ref) => ref.match(/(\d+\.\d+)/)?.[1])
    .filter((code): code is string => !!code);
  const chapterPrefixes = uniqueStrings(
    activityCodes.map((code) => code.split(".")[0] ?? "").filter(Boolean)
  );
  const rankedIndicators = [
    ...detailedIndicators.filter((item) =>
      activityCodes.some((code) => item.includes(`(${code})`))
    ),
    ...detailedIndicators.filter((item) =>
      chapterPrefixes.some((prefix) => item.includes(`(${prefix}.`))
    ),
    ...detailedIndicators,
  ];

  const successIndicators = uniqueStrings([
    ...rankedIndicators.filter((item) => isMeaningfulObjective(item)),
    ...activityGoals,
    ...activityTitleObjectives,
  ]).slice(0, 3);

  // Safe educational fallbacks — never use chart/axis text as objectives.
  const safeFallbacks = [
    `Οι μαθητές/τριες να διακρίνουν τις βασικές έννοιες της ενότητας «${unit}» και να τις εφαρμόζουν σε απλά παραδείγματα.`,
    `Οι μαθητές/τριες να εξηγούν τα κύρια συμπεράσματα από τις δραστηριότητες των σελίδων ${pages.join(", ")}.`,
    `Οι μαθητές/τριες να συνδέουν το περιεχόμενο του κεφαλαίου «${chapter}» με παραδείγματα από την καθημερινή ζωή.`,
  ].filter((item) => isMeaningfulObjective(item));

  while (successIndicators.length < 2) {
    const next = safeFallbacks[successIndicators.length];
    if (!next) break;
    successIndicators.push(next);
  }
  const finalIndicators = successIndicators
    .filter((item) => isMeaningfulObjective(item))
    .slice(0, 3);

  const emphasisPoints = extractEmphasisPoints(combined, finalIndicators);
  const prerequisites = extractPrerequisites(combined);
  const pageLabel = pages.join(", ");
  const activityLabel =
    activityRefs.slice(0, 2).join(" / ") || `σελ. ${pageLabel}`;

  const hook = `Ως αφόρμηση, ο/η εκπαιδευτικός αξιοποιεί το περιεχόμενο των σελίδων ${pageLabel} του βιβλίου (${activityLabel}). Παρουσιάζει σύντομα το πλαίσιο/σενάριο της δραστηριότητας και ζητά από τους/τις μαθητές/τριες να διατυπώσουν υποθέσεις ή αρχικές ιδέες. Αξιοποιώντας τον διαθέσιμο χρόνο, δίνει τον λόγο σε όσο το δυνατόν περισσότερους μαθητές ώστε να ακουστούν διαφορετικές απόψεις. Το βασικό ερώτημα παραμένει ανοιχτό για να απαντηθεί μετά τη διερεύνηση.`;

  const materialsSummary = `Βιβλίο μαθητή (${book.bookName}), πίνακας, ηλεκτρονικός υπολογιστής, βιντεοπροβολέας, διαδίκτυο${
    /προσομοίωση|PhET|QR/i.test(combined) ? ", προσομοιώσεις" : ""
  }${
    /δοχείο|θερμόμετρο|σύριγγα|μπαλόνι|πειραμα/i.test(combined)
      ? ", πειραματικά υλικά της δραστηριότητας"
      : ""
  }.`;

  const activityBlocks: LessonPlanActivityBlock[] = finalIndicators.map(
    (objective, index) => {
      const relatedPages = selected
        .slice(
          Math.min(index, selected.length - 1),
          Math.min(index + 1, selected.length) + (selected.length > 1 ? 1 : 0)
        )
        .map((s) => s.page);
      const pageHint = relatedPages.length
        ? relatedPages.join(", ")
        : pageLabel;
      const activityRef = activityRefs[index] ?? activityRefs[0] ?? activityLabel;

      return {
        objective,
        activityPath: `Οι μαθητές/τριες εργάζονται στην ολομέλεια ή σε μικρές ομάδες με βάση την ${activityRef} (σελ. ${pageHint}). Ο/Η εκπαιδευτικός καθοδηγεί τη δραστηριότητα βήμα-βήμα, θέτει ερωτήματα παρατήρησης/ερμηνείας και ζητά συμπλήρωση των σχετικών σημείων στο βιβλίο. Στο τέλος της δραστηριότητας διατυπώνονται τα βασικά συμπεράσματα στην ολομέλεια.`,
        assessment: `Στην αφόρμηση διενεργείται διαγνωστική αξιολόγηση των προϋπάρχουσων γνώσεων. Κατά τη δραστηριότητα διενεργείται διαμορφωτική αξιολόγηση μέσω παρατήρησης συμμετοχής, προφορικών απαντήσεων και ελέγχου της ορθότητας των συμπληρώσεων στο βιβλίο. Στο τέλος αξιολογείται αν επιτεύχθηκε ο στόχος: ${objective.replace(/^Οι μαθητές\/τριες να\s+/i, "").slice(0, 140)}`,
        teacherRole: `Ο/Η εκπαιδευτικός έχει προετοιμάσει εκ των προτέρων τα μέσα της δραστηριότητας ώστε το μάθημα των 40′ να κυλήσει χωρίς καθυστερήσεις. Κατευθύνει την πορεία με στοχευμένες ερωτήσεις, διατηρεί την οργάνωση της τάξης, ελέγχει τις απαντήσεις και καταγράφει στον πίνακα τους ορθούς ορισμούς/συμπεράσματα.`,
        materials: materialsSummary,
      };
    }
  );

  const closure = `Ο/Η εκπαιδευτικός πραγματοποιεί σύντομη σύνοψη των βασικών σημείων του μαθήματος, ανακεφαλαιώνοντας τις σημαντικότερες έννοιες που διδάχθηκαν. Στη συνέχεια, οι μαθητές/τριες συμπληρώνουν ατομικά μία κάρτα εξόδου με 2–3 σύντομες ερωτήσεις. Η κάρτα εξόδου λειτουργεί ως εργαλείο τελικής διαμορφωτικής αξιολόγησης για το κατά πόσο επιτεύχθηκαν οι 2–3 στόχοι του 40λεπτου μαθήματος.`;

  const homework = `Επανάληψη από το βιβλίο μαθητή (${book.bookName}), σελ. ${pageLabel}: ολοκλήρωση των ανοικτών σημείων της ${activityLabel} και 1–2 σχετικές ασκήσεις εμπέδωσης.`;

  const bibliographyParts = [
    `Βιβλίο μαθητή: ${book.className} / ${book.fileName}, σελ. ${pageLabel}`,
  ];
  if (apPassages[0]?.book.kind === "analytical-program" || book.kind !== "analytical-program") {
    const apBook =
      apPassages.find((p) => p.book.kind === "analytical-program")?.book ??
      (await findAnalyticalProgramForClass(book.classId));
    if (apBook) {
      bibliographyParts.push(
        `Αναλυτικό Πρόγραμμα: ${apBook.bookName}${
          apPassages.length
            ? `, σελ. ${uniqueStrings(apPassages.map((p) => String(p.page))).join(", ")}`
            : ""
        }`
      );
    }
  }

  return {
    title: "Σχέδιο Μαθήματος",
    className: book.className,
    classLabel: friendlyClassLabel(book.className),
    bookName: book.bookName,
    pages,
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
    analyticalProgram:
      finalIndicators.length > 0
        ? {
            bookName:
              apPassages.find((p) => p.book.kind === "analytical-program")?.book
                .bookName ??
              (await findAnalyticalProgramForClass(book.classId))?.bookName ??
              "Αναλυτικό Πρόγραμμα",
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
  const book = await resolvePhysicsBook(input.classId, input.bookId);
  if (!book) throw new Error("Book not found");
  const index = await getBookIndex(book);
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
    const distractors = [
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
      : await findRelatedAnalyticalProgramPassages(book.classId, seedText, 3);
  const apIndicators = uniqueStrings(
    apPassages.flatMap((passage) => extractCurriculumIndicators(passage.text))
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
  bookId: string
): Promise<{ pageCount: number; book: PhysicsBookRef }> {
  const book = await resolvePhysicsBook(classId, bookId);
  if (!book) throw new Error("Book not found");
  const index = await getBookIndex(book);
  return { pageCount: index.pageCount, book };
}
