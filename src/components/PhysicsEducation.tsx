"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { PhysicsLessonPlanPreview } from "@/components/PhysicsLessonPlanPreview";
import { useLocale } from "@/components/LocaleProvider";
import { COLOR_MAP } from "@/lib/constants";
import { translateForm } from "@/lib/i18n";
import { downloadPhysicsLessonPlanDocx } from "@/lib/physics-lesson-plan-docx";
import {
  downloadPhysicsLessonPlanPdf,
  generatePhysicsLessonPlanPdfFromElement,
  getPhysicsLessonPlanPdfBlobUrlFromElement,
} from "@/lib/physics-lesson-plan-pdf";
import type { FormComponent } from "@/lib/types";

type Mode = "search" | "lesson" | "test" | null;

interface CatalogBook {
  id: string;
  name: string;
  fileName: string;
  pageCount: number | null;
  kind?: "textbook" | "analytical-program";
}

interface CatalogClass {
  id: string;
  name: string;
  books: CatalogBook[];
}

interface SearchHit {
  classId: string;
  className: string;
  bookId: string;
  bookName: string;
  fileName: string;
  kind?: "textbook" | "analytical-program";
  page: number;
  snippet: string;
  score: number;
}

interface LessonPlanActivityBlock {
  objective: string;
  activityPath: string;
  assessment: string;
  teacherRole: string;
  materials: string;
}

interface LessonPlanResult {
  title: string;
  className: string;
  classLabel: string;
  bookName: string;
  pages: number[];
  durationMinutes: number;
  unit: string;
  chapter: string;
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

interface TestResult {
  className: string;
  bookName: string;
  pages: number[];
  title: string;
  multipleChoice: {
    question: string;
    options: string[];
    answerIndex: number;
    sourcePage: number;
  }[];
  shortAnswer: { question: string; sampleAnswer: string; sourcePage: number }[];
  problems: { prompt: string; sourcePage: number }[];
  analyticalProgram?: {
    bookName: string;
    indicators: string[];
  };
}

interface PhysicsEducationProps {
  form: FormComponent;
}

function bookPdfUrl(classId: string, bookId: string, page?: number): string {
  const base = `/api/physics/file?classId=${encodeURIComponent(classId)}&bookId=${encodeURIComponent(bookId)}`;
  return page ? `${base}#page=${page}` : base;
}

function parsePagesInput(value: string, pageCount: number): number[] {
  const pages = new Set<number>();
  for (const part of value.split(/[,\s]+/)) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const range = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
      const from = Math.min(start, end);
      const to = Math.max(start, end);
      for (let p = from; p <= to; p += 1) {
        if (p >= 1 && p <= pageCount) pages.add(p);
      }
      continue;
    }
    const n = Number(trimmed);
    if (Number.isInteger(n) && n >= 1 && n <= pageCount) pages.add(n);
  }
  return [...pages].sort((a, b) => a - b);
}

export function PhysicsEducation({ form: rawForm }: PhysicsEducationProps) {
  const { locale, t } = useLocale();
  const form = useMemo(() => translateForm(rawForm, locale), [rawForm, locale]);
  const strings = t.templates.physics;
  const gradient = COLOR_MAP[form.color] ?? COLOR_MAP.green;

  const [mode, setMode] = useState<Mode>(null);
  const [catalog, setCatalog] = useState<CatalogClass[]>([]);
  const [catalogError, setCatalogError] = useState("");
  const [catalogLoading, setCatalogLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searchMeta, setSearchMeta] = useState<{ indexed: number; total: number } | null>(null);

  const [classId, setClassId] = useState("");
  const [bookId, setBookId] = useState("");
  const [pagesInput, setPagesInput] = useState("");
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [bookLoading, setBookLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [lessonPlan, setLessonPlan] = useState<LessonPlanResult | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportingWord, setExportingWord] = useState(false);
  const [exportError, setExportError] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCatalogLoading(true);
      setCatalogError("");
      try {
        const res = await fetch("/api/physics/catalog");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? strings.catalogFailed);
        if (!cancelled) setCatalog(data.classes ?? []);
      } catch (error) {
        if (!cancelled) {
          setCatalogError(
            error instanceof Error ? error.message : strings.catalogFailed
          );
        }
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [strings.catalogFailed]);

  const selectedClass = catalog.find((c) => c.id === classId) ?? null;
  const selectedBook = selectedClass?.books.find((b) => b.id === bookId) ?? null;

  useEffect(() => {
    if (!classId || !bookId) {
      setPageCount(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setBookLoading(true);
      setGenerateError("");
      try {
        const res = await fetch(
          `/api/physics/book?classId=${encodeURIComponent(classId)}&bookId=${encodeURIComponent(bookId)}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? strings.bookFailed);
        if (!cancelled) {
          setPageCount(data.pageCount ?? null);
          setCatalog((current) =>
            current.map((cls) =>
              cls.id !== classId
                ? cls
                : {
                    ...cls,
                    books: cls.books.map((book) =>
                      book.id === bookId
                        ? { ...book, pageCount: data.pageCount ?? book.pageCount }
                        : book
                    ),
                  }
            )
          );
        }
      } catch (error) {
        if (!cancelled) {
          setPageCount(null);
          setGenerateError(
            error instanceof Error ? error.message : strings.bookFailed
          );
        }
      } finally {
        if (!cancelled) setBookLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [classId, bookId, strings.bookFailed]);

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSearchError(strings.queryTooShort);
      return;
    }
    setSearching(true);
    setSearchError("");
    setHits([]);
    setSearchMeta(null);
    try {
      const res = await fetch("/api/physics/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? strings.searchFailed);
      setHits(data.hits ?? []);
      setSearchMeta({
        indexed: data.indexedBooks ?? 0,
        total: data.totalBooks ?? 0,
      });
      if (!(data.hits ?? []).length) setSearchError(strings.noResults);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : strings.searchFailed);
    } finally {
      setSearching(false);
    }
  }

  async function handleGenerate() {
    if (!classId || !bookId || !pageCount) {
      setGenerateError(strings.selectAll);
      return;
    }
    const pages = parsePagesInput(pagesInput, pageCount);
    if (!pages.length) {
      setGenerateError(strings.pagesInvalid);
      return;
    }

    setGenerateLoading(true);
    setGenerateError("");
    setExportError("");
    closePreview();
    setLessonPlan(null);
    setTestResult(null);

    try {
      const endpoint =
        mode === "lesson" ? "/api/physics/lesson-plan" : "/api/physics/test";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, bookId, pages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? strings.generateFailed);
      if (mode === "lesson") setLessonPlan(data.lessonPlan);
      else setTestResult(data.test);
    } catch (error) {
      setGenerateError(
        error instanceof Error ? error.message : strings.generateFailed
      );
    } finally {
      setGenerateLoading(false);
    }
  }

  function selectMode(next: Mode) {
    setMode(next);
    setGenerateError("");
    setSearchError("");
    setExportError("");
    closePreview();
    if (next !== "lesson") setLessonPlan(null);
    if (next !== "test") setTestResult(null);
  }

  function closePreview() {
    setShowPreview(false);
    setPreviewLoading(false);
    setPreviewError("");
    setPdfUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  }

  useEffect(() => {
    if (!showPreview || !lessonPlan) return;

    let cancelled = false;
    let createdUrl: string | null = null;

    (async () => {
      setPreviewLoading(true);
      setPreviewError("");
      try {
        let root: HTMLDivElement | null = null;
        for (let attempt = 0; attempt < 20; attempt += 1) {
          await new Promise<void>((resolve) => {
            requestAnimationFrame(() => resolve());
          });
          root = previewRef.current;
          if (root?.querySelector(".physics-lesson-plan-doc .plan-source .plan-block")) {
            break;
          }
        }
        if (!root?.querySelector(".physics-lesson-plan-doc")) {
          throw new Error(t.common.previewNotReady);
        }
        createdUrl = await getPhysicsLessonPlanPdfBlobUrlFromElement(root);
        if (cancelled) {
          URL.revokeObjectURL(createdUrl);
          return;
        }
        setPdfUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return createdUrl;
        });
      } catch (error) {
        if (!cancelled) {
          setPreviewError(
            error instanceof Error ? error.message : t.common.previewFailed
          );
        }
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [showPreview, lessonPlan, t.common.previewFailed, t.common.previewNotReady]);

  async function handleDownloadPdf() {
    if (!lessonPlan) return;
    setExporting(true);
    setExportError("");
    try {
      const root = previewRef.current;
      if (showPreview && root?.querySelector(".physics-lesson-plan-doc")) {
        const doc = await generatePhysicsLessonPlanPdfFromElement(root);
        doc.save("sxedio-mathimatos-fysiki.pdf");
      } else {
        await downloadPhysicsLessonPlanPdf(
          lessonPlan,
          "sxedio-mathimatos-fysiki"
        );
      }
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : t.common.exportFailed
      );
    } finally {
      setExporting(false);
    }
  }

  async function handleDownloadWord() {
    if (!lessonPlan) return;
    setExportingWord(true);
    setExportError("");
    try {
      await downloadPhysicsLessonPlanDocx(
        lessonPlan,
        "sxedio-mathimatos-fysiki"
      );
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : t.common.exportFailed
      );
    } finally {
      setExportingWord(false);
    }
  }

  const modes: {
    id: Exclude<Mode, null>;
    title: string;
    description: string;
    icon: string;
  }[] = [
    {
      id: "search",
      title: strings.searchTitle,
      description: strings.searchDescription,
      icon: "🔍",
    },
    {
      id: "lesson",
      title: strings.lessonTitle,
      description: strings.lessonDescription,
      icon: "📘",
    },
    {
      id: "test",
      title: strings.testTitle,
      description: strings.testDescription,
      icon: "✏️",
    },
  ];

  return (
    <>
    <div className="space-y-8">
      <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
        <div className={`h-2 bg-gradient-to-r ${gradient}`} />
        <div className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="text-4xl">{form.icon}</span>
            <div>
              <h1 className="text-3xl font-bold text-zinc-900">{form.title}</h1>
              {form.description && (
                <p className="mt-2 text-zinc-500 max-w-2xl">{form.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {modes.map((item) => {
          const active = mode === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => selectMode(item.id)}
              className={`text-left rounded-2xl border p-5 transition-all ${
                active
                  ? "border-emerald-500 bg-emerald-50 shadow-md ring-2 ring-emerald-200"
                  : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm"
              }`}
            >
              <div className="text-2xl mb-3">{item.icon}</div>
              <h2 className="text-lg font-semibold text-zinc-900">{item.title}</h2>
              <p className="mt-2 text-sm text-zinc-500 leading-relaxed">
                {item.description}
              </p>
            </button>
          );
        })}
      </div>

      {!mode && (
        <p className="text-center text-zinc-400 py-6">{strings.chooseMode}</p>
      )}

      {mode === "search" && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 space-y-5">
          <div>
            <h3 className="text-xl font-semibold text-zinc-900">
              {strings.searchHeading}
            </h3>
            <p className="mt-1 text-sm text-zinc-500">{strings.searchHint}</p>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={strings.searchPlaceholder}
              className="flex-1 rounded-xl border border-zinc-300 px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={searching}
              className="rounded-xl bg-zinc-900 text-white px-5 py-3 font-medium hover:bg-zinc-700 disabled:opacity-60"
            >
              {searching ? strings.searching : strings.searchButton}
            </button>
          </form>

          {searchError && (
            <p className="text-sm text-rose-600">{searchError}</p>
          )}
          {searchMeta && !searchError && (
            <p className="text-sm text-zinc-500">
              {strings.resultsMeta
                .replace("{count}", String(hits.length))
                .replace("{indexed}", String(searchMeta.indexed))
                .replace("{total}", String(searchMeta.total))}
            </p>
          )}

          <div className="space-y-3">
            {hits.map((hit) => (
              <article
                key={`${hit.classId}-${hit.bookId}-${hit.page}-${hit.score}`}
                className="rounded-xl border border-zinc-200 p-4 hover:border-emerald-300 transition-colors"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 mb-2">
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-700">
                    {hit.className}
                  </span>
                  {hit.kind === "analytical-program" && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-800">
                      {strings.analyticalProgramBadge}
                    </span>
                  )}
                  <span>{hit.bookName}</span>
                  <span>·</span>
                  <span>
                    {strings.page} {hit.page}
                  </span>
                </div>
                <p className="text-sm text-zinc-800 leading-relaxed">{hit.snippet}</p>
                <a
                  href={bookPdfUrl(hit.classId, hit.bookId, hit.page)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex mt-3 text-sm font-medium text-emerald-700 hover:text-emerald-900"
                >
                  {strings.openPdf}
                </a>
              </article>
            ))}
          </div>
        </section>
      )}

      {(mode === "lesson" || mode === "test") && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 space-y-5">
          <div>
            <h3 className="text-xl font-semibold text-zinc-900">
              {mode === "lesson" ? strings.lessonHeading : strings.testHeading}
            </h3>
            <p className="mt-1 text-sm text-zinc-500">
              {mode === "lesson" ? strings.lessonHint : strings.testHint}
            </p>
          </div>

          {catalogLoading ? (
            <p className="text-sm text-zinc-500">{t.common.loading}</p>
          ) : catalogError ? (
            <p className="text-sm text-rose-600">{catalogError}</p>
          ) : (
            <div className="grid sm:grid-cols-3 gap-4">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-zinc-700">
                  {strings.classLabel}
                </span>
                <select
                  value={classId}
                  onChange={(e) => {
                    setClassId(e.target.value);
                    setBookId("");
                    setPagesInput("");
                    setPageCount(null);
                  }}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 bg-white"
                >
                  <option value="">{strings.classPlaceholder}</option>
                  {catalog.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-zinc-700">
                  {strings.bookLabel}
                </span>
                <select
                  value={bookId}
                  onChange={(e) => {
                    setBookId(e.target.value);
                    setPagesInput("");
                  }}
                  disabled={!selectedClass}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 bg-white disabled:bg-zinc-50"
                >
                  <option value="">{strings.bookPlaceholder}</option>
                  {selectedClass?.books.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.kind === "analytical-program"
                        ? `[ΑΠ] ${book.name}`
                        : book.name}
                      {book.pageCount ? ` (${book.pageCount})` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-zinc-700">
                  {strings.pagesLabel}
                </span>
                <input
                  value={pagesInput}
                  onChange={(e) => setPagesInput(e.target.value)}
                  disabled={!selectedBook || bookLoading}
                  placeholder={strings.pagesPlaceholder}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 disabled:bg-zinc-50"
                />
                <span className="text-xs text-zinc-400">
                  {bookLoading
                    ? strings.loadingPages
                    : pageCount
                      ? strings.pagesHint.replace("{count}", String(pageCount))
                      : strings.pagesHintEmpty}
                </span>
              </label>
            </div>
          )}

          {selectedBook && classId && bookId && (
            <a
              href={bookPdfUrl(classId, bookId)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex text-sm font-medium text-emerald-700 hover:text-emerald-900"
            >
              {strings.openSelectedPdf}
            </a>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generateLoading || bookLoading || !classId || !bookId}
              className="rounded-xl bg-zinc-900 text-white px-5 py-3 font-medium hover:bg-zinc-700 disabled:opacity-60"
            >
              {generateLoading
                ? strings.generating
                : mode === "lesson"
                  ? strings.createLesson
                  : strings.createTest}
            </button>
            {generateError && (
              <p className="text-sm text-rose-600">{generateError}</p>
            )}
          </div>

          {lessonPlan && mode === "lesson" && (
            <div className="rounded-2xl border border-emerald-200 bg-white p-5 sm:p-6 space-y-5 shadow-sm">
              <div className="border-b border-zinc-200 pb-4">
                <h4 className="text-2xl font-semibold text-zinc-900">
                  {lessonPlan.title}
                </h4>
                <div className="mt-3 grid sm:grid-cols-2 gap-2 text-sm text-zinc-700">
                  <p>
                    <span className="font-medium">{strings.lessonClass}:</span>{" "}
                    {lessonPlan.classLabel}
                  </p>
                  <p>
                    <span className="font-medium">{strings.lessonDuration}:</span>{" "}
                    {lessonPlan.durationMinutes}′
                  </p>
                  <p>
                    <span className="font-medium">{strings.lessonUnit}:</span>{" "}
                    {lessonPlan.unit}
                  </p>
                  <p>
                    <span className="font-medium">{strings.lessonChapter}:</span>{" "}
                    {lessonPlan.chapter}
                  </p>
                  <p className="sm:col-span-2 text-zinc-500">
                    {lessonPlan.bookName}
                  </p>
                </div>
              </div>

              <ResultBlock title={strings.successIndicators}>
                <ul className="list-disc pl-5 space-y-2">
                  {lessonPlan.successIndicators.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-zinc-500">
                  {strings.targetsNote.replace(
                    "{minutes}",
                    String(lessonPlan.durationMinutes)
                  )}
                </p>
              </ResultBlock>

              <ResultBlock title={strings.emphasisPoints}>
                <p>{lessonPlan.emphasisPoints}</p>
              </ResultBlock>

              <ResultBlock title={strings.prerequisites}>
                <p>{lessonPlan.prerequisites}</p>
              </ResultBlock>

              <ResultBlock title={`${strings.hook} (${lessonPlan.hookMinutes}′)`}>
                <p>{lessonPlan.hook}</p>
              </ResultBlock>

              <div className="space-y-4">
                {lessonPlan.activityBlocks.map((block, index) => (
                  <div
                    key={`${block.objective}-${index}`}
                    className="rounded-xl border border-zinc-200 overflow-hidden"
                  >
                    <div className="bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900">
                      {strings.activityObjective} {index + 1}
                    </div>
                    <div className="p-4 space-y-3 text-sm">
                      <p className="font-medium text-zinc-900">{block.objective}</p>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-1">
                          {strings.activityPath}
                        </p>
                        <p className="text-zinc-700">{block.activityPath}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-1">
                          {strings.activityAssessment}
                        </p>
                        <p className="text-zinc-700">{block.assessment}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-1">
                          {strings.activityTeacherRole}
                        </p>
                        <p className="text-zinc-700">{block.teacherRole}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-1">
                          {strings.activityMaterials}
                        </p>
                        <p className="text-zinc-700">{block.materials}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <ResultBlock title={strings.closure}>
                <p>{lessonPlan.closure}</p>
              </ResultBlock>

              <ResultBlock title={strings.homework}>
                <p>{lessonPlan.homework}</p>
              </ResultBlock>

              <ResultBlock title={strings.bibliography}>
                <p>{lessonPlan.bibliography}</p>
              </ResultBlock>

              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  className="rounded-xl border border-zinc-300 px-5 py-2.5 font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  {t.form.previewPdf}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDownloadPdf()}
                  disabled={exporting || exportingWord}
                  className="rounded-xl bg-zinc-900 px-5 py-2.5 font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
                >
                  {exporting ? t.form.exporting : t.form.exportPdf}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDownloadWord()}
                  disabled={exporting || exportingWord}
                  className="rounded-xl border border-zinc-300 bg-white px-5 py-2.5 font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
                >
                  {exportingWord
                    ? strings.exportingWord
                    : strings.exportWord}
                </button>
                {exportError && (
                  <p className="text-sm text-rose-600">{exportError}</p>
                )}
              </div>
            </div>
          )}

          {testResult && mode === "test" && (
            <div className="rounded-2xl border border-sky-200 bg-sky-50/40 p-5 sm:p-6 space-y-5">
              <div>
                <h4 className="text-2xl font-semibold text-zinc-900">
                  {testResult.title}
                </h4>
                <p className="text-sm text-zinc-500 mt-2">
                  {testResult.className} · {testResult.bookName} · {strings.pages}{" "}
                  {testResult.pages.join(", ")}
                </p>
              </div>

              <ResultBlock title={strings.multipleChoice}>
                <div className="space-y-4">
                  {testResult.multipleChoice.map((q, index) => (
                    <div key={`${q.sourcePage}-${index}`} className="space-y-2">
                      <p className="font-medium text-zinc-900 whitespace-pre-wrap">
                        {index + 1}. {q.question}
                      </p>
                      <ul className="space-y-1 pl-1">
                        {q.options.map((option, optIndex) => (
                          <li
                            key={option}
                            className={`text-sm rounded-lg px-3 py-2 ${
                              optIndex === q.answerIndex
                                ? "bg-emerald-100 text-emerald-900"
                                : "bg-white border border-zinc-200 text-zinc-700"
                            }`}
                          >
                            {String.fromCharCode(65 + optIndex)}. {option}
                            {optIndex === q.answerIndex ? ` (${strings.answer})` : ""}
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-zinc-500">
                        {strings.page} {q.sourcePage}
                      </p>
                    </div>
                  ))}
                </div>
              </ResultBlock>

              <ResultBlock title={strings.shortAnswer}>
                <div className="space-y-4">
                  {testResult.shortAnswer.map((q, index) => (
                    <div key={`${q.question}-${index}`}>
                      <p className="font-medium text-zinc-900">
                        {index + 1}. {q.question}
                      </p>
                      <p className="mt-1 text-sm text-zinc-600">
                        <span className="font-medium">{strings.sampleAnswer}:</span>{" "}
                        {q.sampleAnswer}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {strings.page} {q.sourcePage}
                      </p>
                    </div>
                  ))}
                </div>
              </ResultBlock>

              <ResultBlock title={strings.problems}>
                <ol className="list-decimal pl-5 space-y-2">
                  {testResult.problems.map((item) => (
                    <li key={item.prompt}>
                      {item.prompt}{" "}
                      <span className="text-xs text-zinc-500">
                        ({strings.page} {item.sourcePage})
                      </span>
                    </li>
                  ))}
                </ol>
              </ResultBlock>

              {testResult.analyticalProgram && (
                <ResultBlock title={strings.analyticalProgram}>
                  <p className="text-sm text-zinc-600 mb-3">
                    {testResult.analyticalProgram.bookName}
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">
                    {strings.analyticalIndicators}
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    {testResult.analyticalProgram.indicators.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </ResultBlock>
              )}
            </div>
          )}
        </section>
      )}
    </div>

    {showPreview && lessonPlan && (
      <div
        className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 sm:p-8 overflow-y-auto"
        onClick={closePreview}
      >
        <div
          className="relative w-full max-w-6xl my-4 sm:my-8"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50">
              <span className="text-sm font-medium text-zinc-700">
                {t.common.pdfPreview} · A4 landscape
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleDownloadPdf()}
                  disabled={exporting || exportingWord}
                  className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
                >
                  {exporting ? t.form.exporting : t.form.exportPdf}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDownloadWord()}
                  disabled={exporting || exportingWord}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
                >
                  {exportingWord
                    ? strings.exportingWord
                    : strings.exportWord}
                </button>
                <button
                  type="button"
                  onClick={closePreview}
                  className="text-zinc-400 hover:text-zinc-600 text-lg leading-none px-2"
                  aria-label={t.common.closePreview}
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4 max-h-[85vh] overflow-y-auto">
              <PhysicsLessonPlanPreview ref={previewRef} plan={lessonPlan} />

              {previewLoading && (
                <div className="flex items-center justify-center h-[280px] rounded-xl bg-zinc-50 text-sm text-zinc-500">
                  {t.common.generatingPreview}
                </div>
              )}
              {!previewLoading && previewError && (
                <div className="flex items-center justify-center h-[280px] rounded-xl bg-rose-50 text-sm text-rose-700 px-4 text-center">
                  {previewError}
                </div>
              )}
              {!previewLoading && !previewError && pdfUrl && (
                <iframe
                  src={pdfUrl}
                  title={t.common.pdfPreview}
                  className="w-full h-[70vh] min-h-[640px] rounded-xl border border-zinc-200 bg-zinc-100"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

function ResultBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h5 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 mb-2">
        {title}
      </h5>
      <div className="text-sm text-zinc-800 leading-relaxed">{children}</div>
    </div>
  );
}
