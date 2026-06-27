"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { LessonPlanPreview } from "@/components/LessonPlanPreview";
import { LESSON_PLAN_SECTIONS } from "@/lib/lesson-plan-fields";
import {
  downloadLessonPlanPdf,
  generateLessonPlanPdfFromElement,
  getLessonPlanPdfBlobUrlFromElement,
} from "@/lib/lesson-plan-pdf";
import { downloadPdf, getPdfBlobUrl } from "@/lib/pdf";
import type { FormComponent, FormField, FormValues } from "@/lib/types";

interface FormFillerProps {
  form: FormComponent;
  canExport: boolean;
}

export function FormFiller({ form, canExport }: FormFillerProps) {
  const [values, setValues] = useState<FormValues>({});
  const [showPreview, setShowPreview] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [exporting, setExporting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const isLessonPlan = form.template === "sxedio-mathimatos";

  const groupedFields = useMemo(() => {
    if (!isLessonPlan) return null;

    return LESSON_PLAN_SECTIONS.map((section) => ({
      ...section,
      fields: form.fields.filter((field) => field.section === section.id),
    })).filter((section) => section.fields.length > 0);
  }, [form.fields, isLessonPlan]);

  useEffect(() => {
    if (!showPreview) {
      setPdfUrl(null);
      setPreviewError("");
      setPreviewLoading(false);
      return;
    }

    if (!canExport) {
      setPdfUrl(null);
      setPreviewError("");
      setPreviewLoading(false);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    async function loadPreview() {
      setPreviewLoading(true);
      setPreviewError("");
      setPdfUrl(null);

      try {
        if (isLessonPlan) {
          await new Promise<void>((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
          });
          if (cancelled) return;

          const root = previewRef.current;
          if (!root) {
            throw new Error("Preview is not ready yet. Close and try again.");
          }

          const url = await getLessonPlanPdfBlobUrlFromElement(root);

          if (cancelled) {
            URL.revokeObjectURL(url);
            return;
          }

          objectUrl = url;
          setPdfUrl(url);
        } else {
          const url = getPdfBlobUrl(form, values);
          if (cancelled) return;
          objectUrl = url;
          setPdfUrl(url);
        }
      } catch (error) {
        if (!cancelled) {
          setPreviewError(
            error instanceof Error ? error.message : "Failed to generate PDF preview"
          );
        }
      } finally {
        if (!cancelled) {
          setPreviewLoading(false);
        }
      }
    }

    void loadPreview();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [showPreview, form, values, canExport, isLessonPlan]);

  function handleChange(fieldId: string, value: string) {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  }

  function closePreview() {
    setShowPreview(false);
  }

  async function handleExport() {
    if (!canExport || exporting) return;

    setExporting(true);
    try {
      if (isLessonPlan) {
        const root = previewRef.current;
        if (root) {
          const doc = await generateLessonPlanPdfFromElement(root);
          doc.save("sxedio-mathimatos.pdf");
        } else {
          await downloadLessonPlanPdf(values, "sxedio-mathimatos");
        }
      } else {
        downloadPdf(form, values);
      }
    } catch (error) {
      setPreviewError(
        error instanceof Error ? error.message : "Failed to export PDF"
      );
      setShowPreview(true);
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <div className={isLessonPlan ? "space-y-8" : "grid lg:grid-cols-2 gap-8"}>
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{form.icon}</span>
              <h1 className="text-2xl font-bold text-zinc-900">{form.title}</h1>
            </div>
            {form.description && (
              <p className="text-zinc-500">{form.description}</p>
            )}
          </div>

          {groupedFields ? (
            <div className="space-y-8">
              {groupedFields.map((section) => (
                <section key={section.id} className="space-y-4">
                  <h2 className="text-base font-semibold text-zinc-900 border-b border-zinc-200 pb-2">
                    {section.title}
                  </h2>
                  <div className="space-y-5">
                    {section.fields.map((field) => (
                      <FieldInput
                        key={field.id}
                        field={field}
                        value={values[field.id] ?? ""}
                        onChange={(v) => handleChange(field.id, v)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              {form.fields.map((field) => (
                <FieldInput
                  key={field.id}
                  field={field}
                  value={values[field.id] ?? ""}
                  onChange={(v) => handleChange(field.id, v)}
                />
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2 items-center">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="px-5 py-2.5 rounded-xl border border-zinc-300 text-zinc-700 font-medium hover:bg-zinc-50 transition-colors"
            >
              Preview PDF
            </button>
            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={!canExport || exporting}
              className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${
                canExport && !exporting
                  ? "bg-zinc-900 text-white hover:bg-zinc-700"
                  : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
              }`}
            >
              {exporting ? "Exporting…" : "Export PDF"}
            </button>
            {!canExport && (
              <p className="text-sm text-zinc-500">
                <Link href="/login" className="text-zinc-700 underline hover:no-underline">
                  Log in
                </Link>{" "}
                to export PDFs.
              </p>
            )}
          </div>
        </div>

        {showPreview && !isLessonPlan && (
          <div className="lg:sticky lg:top-20 h-fit">
            <PreviewPanel
              canExport={canExport}
              previewLoading={previewLoading}
              previewError={previewError}
              pdfUrl={pdfUrl}
              onClose={closePreview}
            />
          </div>
        )}
      </div>

      {showPreview && isLessonPlan && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 sm:p-8 overflow-y-auto"
          onClick={closePreview}
        >
          <div
            className="relative w-full max-w-5xl my-4 sm:my-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="rounded-2xl border border-zinc-200 bg-white shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50">
                <span className="text-sm font-medium text-zinc-700">ΣΧΕΔΙΟ ΜΑΘΗΜΑΤΟΣ — Preview</span>
                <button
                  type="button"
                  onClick={closePreview}
                  className="text-zinc-400 hover:text-zinc-600 text-lg leading-none px-2"
                  aria-label="Close preview"
                >
                  ×
                </button>
              </div>

              <div className="p-4 space-y-4 max-h-[85vh] overflow-y-auto">
                <LessonPlanPreview ref={previewRef} values={values} />

                {canExport ? (
                  <PreviewPanel
                    canExport={canExport}
                    previewLoading={previewLoading}
                    previewError={previewError}
                    pdfUrl={pdfUrl}
                    onClose={closePreview}
                    embedded
                  />
                ) : (
                  <p className="text-sm text-zinc-500 px-1">
                    <Link href="/login" className="text-zinc-700 underline hover:no-underline">
                      Log in
                    </Link>{" "
                    }to generate the PDF preview and export.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PreviewPanel({
  canExport,
  previewLoading,
  previewError,
  pdfUrl,
  onClose,
  embedded = false,
}: {
  canExport: boolean;
  previewLoading: boolean;
  previewError: string;
  pdfUrl: string | null;
  onClose: () => void;
  embedded?: boolean;
}) {
  return (
    <div className={embedded ? "" : "rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden"}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50">
        <span className="text-sm font-medium text-zinc-700">PDF Preview</span>
        {!embedded && (
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 text-lg leading-none"
            aria-label="Close preview"
          >
            ×
          </button>
        )}
      </div>
      {previewLoading && (
        <div className="flex items-center justify-center h-[300px] bg-zinc-50 text-sm text-zinc-500">
          Generating PDF preview…
        </div>
      )}
      {!previewLoading && previewError && (
        <div className="flex items-center justify-center h-[300px] bg-red-50 text-sm text-red-700 px-4 text-center">
          {previewError}
        </div>
      )}
      {!previewLoading && !previewError && pdfUrl && canExport && (
        <iframe
          src={pdfUrl}
          title="PDF Preview"
          className="w-full h-[600px] bg-zinc-100"
        />
      )}
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: string;
  onChange: (value: string) => void;
}) {
  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-colors";

  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 mb-1.5">
        {field.label}
        {field.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {field.type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={field.rows ?? 4}
          className={inputClass}
        />
      ) : (
        <input
          type={field.type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={inputClass}
        />
      )}
    </div>
  );
}
