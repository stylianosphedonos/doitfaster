"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (showPreview) {
      const url = getPdfBlobUrl(form, values);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPdfUrl(null);
  }, [showPreview, form, values]);

  function handleChange(fieldId: string, value: string) {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  }

  function handleExport() {
    if (!canExport) return;
    downloadPdf(form, values);
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
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

        <div className="flex flex-wrap gap-3 pt-2 items-center">
          <button
            type="button"
            onClick={() => canExport && setShowPreview(true)}
            disabled={!canExport}
            className={`px-5 py-2.5 rounded-xl border font-medium transition-colors ${
              canExport
                ? "border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                : "border-zinc-200 text-zinc-400 bg-zinc-100 cursor-not-allowed"
            }`}
          >
            Preview PDF
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={!canExport}
            className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${
              canExport
                ? "bg-zinc-900 text-white hover:bg-zinc-700"
                : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
            }`}
          >
            Export PDF
          </button>
          {!canExport && (
            <p className="text-sm text-zinc-500">
              <Link href="/login" className="text-zinc-700 underline hover:no-underline">
                Log in
              </Link>{" "}
              to preview and export PDFs.
            </p>
          )}
        </div>
      </div>

      {showPreview && (
        <div className="lg:sticky lg:top-20 h-fit">
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50">
              <span className="text-sm font-medium text-zinc-700">PDF Preview</span>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="text-zinc-400 hover:text-zinc-600 text-lg leading-none"
                aria-label="Close preview"
              >
                ×
              </button>
            </div>
            {pdfUrl && (
              <iframe
                src={pdfUrl}
                title="PDF Preview"
                className="w-full h-[600px] bg-zinc-100"
              />
            )}
          </div>
        </div>
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
          rows={4}
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
