"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { BusinessDocPreview } from "@/components/BusinessDocPreview";
import { CertificatePreview } from "@/components/CertificatePreview";
import { LessonPlanPreview } from "@/components/LessonPlanPreview";
import { CERTIFICATE_SECTIONS } from "@/lib/certificate-fields";
import {
  downloadCertificatePdf,
  generateCertificatePdfFromElement,
  getCertificatePdfBlobUrlFromElement,
} from "@/lib/certificate-pdf";
import type { BusinessDocKind } from "@/lib/business-doc-html";
import {
  BUSINESS_DOC_SECTIONS,
} from "@/lib/business-doc-fields";
import {
  downloadInvoicePdf,
  generateInvoicePdfFromElement,
  getInvoicePdfBlobUrlFromElement,
} from "@/lib/invoice-pdf";
import {
  downloadQuotationPdf,
  generateQuotationPdfFromElement,
  getQuotationPdfBlobUrlFromElement,
} from "@/lib/quotation-pdf";
import {
  downloadReceiptPdf,
  generateReceiptPdfFromElement,
  getReceiptPdfBlobUrlFromElement,
} from "@/lib/receipt-pdf";
import { LESSON_PLAN_SECTIONS } from "@/lib/lesson-plan-fields";
import {
  downloadLessonPlanPdf,
  generateLessonPlanPdfFromElement,
  getLessonPlanPdfBlobUrlFromElement,
} from "@/lib/lesson-plan-pdf";
import { downloadPdf, getPdfBlobUrl } from "@/lib/pdf";
import type { FormComponent, FormField, FormTemplate, FormValues, SavedFormTemplate } from "@/lib/types";

interface FormFillerProps {
  form: FormComponent;
  canExport: boolean;
  canSave?: boolean;
  initialSavedTemplate?: SavedFormTemplate | null;
}

function isBusinessDocTemplate(
  template?: FormTemplate
): template is BusinessDocKind {
  return template === "invoice" || template === "quotation" || template === "receipt";
}

const BUSINESS_DOC_EXPORT = {
  invoice: {
    filename: "invoice.pdf",
    download: downloadInvoicePdf,
    generateFromElement: generateInvoicePdfFromElement,
    getBlobUrlFromElement: getInvoicePdfBlobUrlFromElement,
  },
  quotation: {
    filename: "quotation.pdf",
    download: downloadQuotationPdf,
    generateFromElement: generateQuotationPdfFromElement,
    getBlobUrlFromElement: getQuotationPdfBlobUrlFromElement,
  },
  receipt: {
    filename: "receipt.pdf",
    download: downloadReceiptPdf,
    generateFromElement: generateReceiptPdfFromElement,
    getBlobUrlFromElement: getReceiptPdfBlobUrlFromElement,
  },
} as const;

const PREVIEW_TITLES: Partial<Record<FormTemplate, string>> = {
  invoice: "Invoice — Preview",
  quotation: "Quotation — Preview",
  receipt: "Receipt — Preview",
  certificate: "Certificate — Preview",
  "sxedio-mathimatos": "ΣΧΕΔΙΟ ΜΑΘΗΜΑΤΟΣ — Preview",
};

export function FormFiller({
  form,
  canExport,
  canSave = false,
  initialSavedTemplate = null,
}: FormFillerProps) {
  const [values, setValues] = useState<FormValues>(
    initialSavedTemplate?.values ?? {}
  );
  const [showPreview, setShowPreview] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(
    initialSavedTemplate?.updatedAt ?? null
  );
  const [hasSavedTemplate, setHasSavedTemplate] = useState(!!initialSavedTemplate);
  const previewRef = useRef<HTMLDivElement>(null);
  const isLessonPlan = form.template === "sxedio-mathimatos";
  const businessDocKind = isBusinessDocTemplate(form.template) ? form.template : null;
  const isBusinessDoc = businessDocKind !== null;
  const isCertificate = form.template === "certificate";
  const isStyledTemplate = isLessonPlan || isBusinessDoc || isCertificate;

  const groupedFields = useMemo(() => {
    if (!isStyledTemplate) return null;

    const sections = businessDocKind
      ? BUSINESS_DOC_SECTIONS[businessDocKind]
      : isCertificate
        ? CERTIFICATE_SECTIONS
        : LESSON_PLAN_SECTIONS;
    return sections
      .map((section) => ({
        ...section,
        fields: form.fields.filter((field) => field.section === section.id),
      }))
      .filter((section) => section.fields.length > 0);
  }, [form.fields, businessDocKind, isCertificate, isStyledTemplate]);

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
        if (isStyledTemplate) {
          await new Promise<void>((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
          });
          if (cancelled) return;

          const root = previewRef.current;
          if (!root) {
            throw new Error("Preview is not ready yet. Close and try again.");
          }

          const url = businessDocKind
            ? await BUSINESS_DOC_EXPORT[businessDocKind].getBlobUrlFromElement(root)
            : isCertificate
              ? await getCertificatePdfBlobUrlFromElement(root)
              : await getLessonPlanPdfBlobUrlFromElement(root);

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
  }, [showPreview, form, values, canExport, businessDocKind, isCertificate, isStyledTemplate]);

  function handleChange(fieldId: string, value: string) {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    setSaveMessage("");
    setSaveError("");
  }

  async function handleSaveTemplate() {
    if (!canSave || saving) return;

    setSaving(true);
    setSaveMessage("");
    setSaveError("");

    try {
      const res = await fetch(`/api/forms/${form.id}/save`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ values }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to save template");
      }

      setSavedAt(data.updatedAt);
      setHasSavedTemplate(true);
      setSaveMessage("Template saved.");
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to save template"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleClearSavedTemplate() {
    if (!canSave || saving || !hasSavedTemplate) return;

    const confirmed = window.confirm(
      "Clear your saved template for this form? This cannot be undone."
    );
    if (!confirmed) return;

    setSaving(true);
    setSaveMessage("");
    setSaveError("");

    try {
      const res = await fetch(`/api/forms/${form.id}/save`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to clear saved template");
      }

      setValues({});
      setSavedAt(null);
      setHasSavedTemplate(false);
      setSaveMessage("Saved template cleared.");
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to clear saved template"
      );
    } finally {
      setSaving(false);
    }
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
      } else if (businessDocKind) {
        const exportConfig = BUSINESS_DOC_EXPORT[businessDocKind];
        const root = previewRef.current;
        if (root) {
          const doc = await exportConfig.generateFromElement(root);
          doc.save(exportConfig.filename);
        } else {
          await exportConfig.download(values, businessDocKind);
        }
      } else if (isCertificate) {
        const root = previewRef.current;
        if (root) {
          const doc = await generateCertificatePdfFromElement(root);
          doc.save("certificate.pdf");
        } else {
          await downloadCertificatePdf(values, "certificate");
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
      <div className={isStyledTemplate ? "space-y-8" : "grid lg:grid-cols-2 gap-8"}>
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
            {canSave && (
              <>
                <button
                  type="button"
                  onClick={() => void handleSaveTemplate()}
                  disabled={saving}
                  className={`px-5 py-2.5 rounded-xl border font-medium transition-colors ${
                    saving
                      ? "border-zinc-200 text-zinc-400 bg-zinc-100 cursor-not-allowed"
                      : "border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                  }`}
                >
                  {saving ? "Saving…" : "Save template"}
                </button>
                {hasSavedTemplate && (
                  <button
                    type="button"
                    onClick={() => void handleClearSavedTemplate()}
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl border border-zinc-300 text-zinc-700 font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50"
                  >
                    Clear saved
                  </button>
                )}
              </>
            )}
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
            {canSave && savedAt && !saveMessage && !saveError && (
              <p className="text-sm text-zinc-500">
                Last saved {new Date(savedAt).toLocaleString()}
              </p>
            )}
            {saveMessage && (
              <p className="text-sm text-emerald-700">{saveMessage}</p>
            )}
            {saveError && <p className="text-sm text-red-600">{saveError}</p>}
            {!canExport && (
              <p className="text-sm text-zinc-500">
                <Link href="/login" className="text-zinc-700 underline hover:no-underline">
                  Log in
                </Link>{" "}
                to export PDFs.
              </p>
            )}
            {!canSave && (
              <p className="text-sm text-zinc-500">
                <Link href="/login" className="text-zinc-700 underline hover:no-underline">
                  Log in
                </Link>{" "}
                to save your template.
              </p>
            )}
          </div>
        </div>

        {showPreview && !isStyledTemplate && (
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

      {showPreview && isStyledTemplate && (
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
                <span className="text-sm font-medium text-zinc-700">
                  {form.template ? PREVIEW_TITLES[form.template] ?? "Preview" : "Preview"}
                </span>
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
                {businessDocKind ? (
                  <BusinessDocPreview ref={previewRef} kind={businessDocKind} values={values} />
                ) : isCertificate ? (
                  <CertificatePreview ref={previewRef} values={values} />
                ) : (
                  <LessonPlanPreview ref={previewRef} values={values} />
                )}

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
