"use client";

import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { COLOR_GRADIENT, COLORS, ICONS } from "@/lib/constants";
import type { FieldType, FormComponent, FormField, FormGroup } from "@/lib/types";

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Long text" },
  { value: "date", label: "Date" },
  { value: "email", label: "Email" },
];

const EMPTY_FORM = {
  groupId: "",
  title: "",
  description: "",
  icon: "📋",
  color: "slate",
  fields: [] as FormField[],
};

export function FormsAdmin() {
  const [forms, setForms] = useState<FormComponent[]>([]);
  const [groups, setGroups] = useState<FormGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FormComponent | null>(null);
  const [draft, setDraft] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showEditor, setShowEditor] = useState(false);

  const inputClass =
    "w-full px-4 py-2.5 sm:py-3 rounded-xl border border-zinc-200 bg-white text-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 text-base";
  const fieldInputClass =
    "w-full px-3 py-2.5 sm:py-2 rounded-lg border border-zinc-200 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10";

  const loadData = useCallback(async () => {
    const [formsRes, groupsRes] = await Promise.all([
      fetch("/api/forms", { credentials: "include" }),
      fetch("/api/groups", { credentials: "include" }),
    ]);
    const formsData = await formsRes.json();
    const groupsData = await groupsRes.json();
    setForms(formsData);
    setGroups(groupsData);
    setDraft((current) => ({
      ...current,
      groupId: current.groupId || groupsData[0]?.id || "",
    }));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function startNew() {
    setEditing(null);
    setDraft({
      ...EMPTY_FORM,
      fields: [],
      groupId: groups[0]?.id ?? "",
    });
    setError("");
    setShowEditor(true);
  }

  function startEdit(form: FormComponent) {
    setEditing(form);
    setDraft({
      groupId: form.groupId,
      title: form.title,
      description: form.description,
      icon: form.icon,
      color: form.color,
      fields: [...form.fields],
    });
    setError("");
    setShowEditor(true);
  }

  function closeEditor() {
    setShowEditor(false);
    setEditing(null);
    setDraft({ ...EMPTY_FORM, groupId: groups[0]?.id ?? "", fields: [] });
    setError("");
  }

  function addField() {
    setDraft((d) => ({
      ...d,
      fields: [
        ...d.fields,
        { id: uuidv4(), label: "New Field", type: "text" as FieldType },
      ],
    }));
  }

  function updateField(index: number, updates: Partial<FormField>) {
    setDraft((d) => ({
      ...d,
      fields: d.fields.map((f, i) => (i === index ? { ...f, ...updates } : f)),
    }));
  }

  function removeField(index: number) {
    setDraft((d) => ({
      ...d,
      fields: d.fields.filter((_, i) => i !== index),
    }));
  }

  function moveField(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= draft.fields.length) return;
    setDraft((d) => {
      const fields = [...d.fields];
      [fields[index], fields[newIndex]] = [fields[newIndex], fields[index]];
      return { ...d, fields };
    });
  }

  async function handleSave() {
    if (!draft.title.trim() || !draft.groupId) {
      setError(
        !draft.groupId
          ? "Select a group for this form."
          : "Title is required."
      );
      return;
    }
    setSaving(true);
    setError("");

    const payload = {
      groupId: draft.groupId,
      title: draft.title.trim(),
      description: draft.description.trim(),
      icon: draft.icon,
      color: draft.color,
      fields: draft.fields,
    };

    const res = editing
      ? await fetch(`/api/forms/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        })
      : await fetch("/api/forms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });

    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to save form");
      return;
    }

    setShowEditor(false);
    setEditing(null);
    setDraft({ ...EMPTY_FORM, groupId: groups[0]?.id ?? "", fields: [] });
    await loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this form? This cannot be undone.")) return;
    const res = await fetch(`/api/forms/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to delete form");
      return;
    }
    if (editing?.id === id) {
      closeEditor();
    }
    await loadData();
  }

  function getGroupTitle(groupId: string) {
    return groups.find((g) => g.id === groupId)?.title ?? "Unknown group";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-400">
        <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading...
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-12 sm:py-16 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50">
        <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>
        <p className="text-zinc-500 font-medium">Create a group first</p>
        <p className="text-sm text-zinc-400 mt-1">Switch to the Groups tab to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-5 lg:gap-8">
      {/* Forms List */}
      <div className={`lg:col-span-2 ${showEditor ? "hidden lg:block" : ""}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900">Forms</h2>
          <button
            type="button"
            onClick={startNew}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl bg-zinc-900 text-white hover:bg-zinc-700 active:bg-zinc-800 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New</span>
          </button>
        </div>

        {forms.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm text-zinc-500 font-medium">No forms yet</p>
            <p className="text-xs text-zinc-400 mt-1">Create your first form</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {forms.map((form) => (
              <li
                key={form.id}
                className={`flex items-center gap-3 p-3.5 sm:p-3 rounded-xl border transition-all cursor-pointer active:scale-[0.99] ${
                  editing?.id === form.id
                    ? "border-zinc-900 bg-zinc-50 shadow-sm"
                    : "border-zinc-200 hover:border-zinc-300 hover:shadow-sm bg-white"
                }`}
                onClick={() => startEdit(form)}
              >
                <span className="text-xl flex-shrink-0">{form.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-900 truncate">{form.title}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {getGroupTitle(form.groupId)} · {form.fields.length} field
                    {form.fields.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(form.id);
                  }}
                  className="text-zinc-300 hover:text-red-500 active:text-red-600 transition-colors p-2 -mr-1 rounded-lg hover:bg-red-50"
                  aria-label="Delete form"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Editor Panel */}
      <div className={`lg:col-span-3 ${!showEditor ? "hidden lg:block" : ""}`}>
        {/* Mobile back button */}
        <button
          type="button"
          onClick={closeEditor}
          className="lg:hidden flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 mb-4 -mt-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to list
        </button>

        <h2 className="text-lg font-semibold text-zinc-900 mb-4">
          {editing ? "Edit Form" : "New Form"}
        </h2>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-900 mb-1.5">
                Group
              </label>
              <select
                value={draft.groupId}
                onChange={(e) => setDraft((d) => ({ ...d, groupId: e.target.value }))}
                className={inputClass}
              >
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.icon} {group.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-900 mb-1.5">
                Title
              </label>
              <input
                type="text"
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="e.g. Invoice, Certificate..."
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-900 mb-1.5">
                Description
              </label>
              <textarea
                value={draft.description}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, description: e.target.value }))
                }
                placeholder="Brief description shown on the card"
                rows={2}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Icon
                </label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, icon }))}
                      className={`w-10 h-10 sm:w-9 sm:h-9 rounded-lg text-lg flex items-center justify-center border-2 transition-all active:scale-95 ${
                        draft.icon === icon
                          ? "border-zinc-900 bg-zinc-50 shadow-sm"
                          : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, color }))}
                      className={`w-10 h-10 sm:w-9 sm:h-9 rounded-lg border-2 transition-all active:scale-95 bg-gradient-to-br ${COLOR_GRADIENT[color]} ${
                        draft.color === color ? "border-zinc-900 shadow-sm ring-2 ring-zinc-900/10" : "border-transparent hover:border-zinc-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Fields Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-zinc-700">Fields</label>
              <button
                type="button"
                onClick={addField}
                className="flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-900 px-3 py-1.5 rounded-lg hover:bg-zinc-100 active:bg-zinc-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add field
              </button>
            </div>

            {draft.fields.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
                <p className="text-sm text-zinc-400">Add fields that users will fill in</p>
              </div>
            ) : (
              <div className="space-y-3">
                {draft.fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="p-3 sm:p-4 rounded-xl border border-zinc-100 bg-zinc-50"
                  >
                    {/* Field Header - Mobile */}
                    <div className="flex items-center justify-between mb-3 sm:hidden">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => moveField(index, -1)}
                          disabled={index === 0}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => moveField(index, 1)}
                          disabled={index === draft.fields.length - 1}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <span className="text-xs text-zinc-400 font-medium">Field {index + 1}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeField(index)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex gap-2 items-start">
                      {/* Desktop move buttons */}
                      <div className="hidden sm:flex flex-col gap-1 pt-2">
                        <button
                          type="button"
                          onClick={() => moveField(index, -1)}
                          disabled={index === 0}
                          className="text-zinc-300 hover:text-zinc-600 disabled:opacity-30 text-xs p-1"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => moveField(index, 1)}
                          disabled={index === draft.fields.length - 1}
                          className="text-zinc-300 hover:text-zinc-600 disabled:opacity-30 text-xs p-1"
                        >
                          ▼
                        </button>
                      </div>

                      {/* Field inputs */}
                      <div className="flex-1 space-y-2 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-2">
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) =>
                            updateField(index, { label: e.target.value })
                          }
                          placeholder="Label"
                          className={fieldInputClass}
                        />
                        <select
                          value={field.type}
                          onChange={(e) =>
                            updateField(index, { type: e.target.value as FieldType })
                          }
                          className={fieldInputClass}
                        >
                          {FIELD_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={field.placeholder ?? ""}
                          onChange={(e) =>
                            updateField(index, { placeholder: e.target.value })
                          }
                          placeholder="Placeholder (optional)"
                          className={fieldInputClass}
                        />
                      </div>

                      {/* Required checkbox & delete - Desktop */}
                      <div className="hidden sm:flex items-center gap-2">
                        <label className="flex items-center gap-1.5 text-xs text-zinc-500 pt-2 shrink-0">
                          <input
                            type="checkbox"
                            checked={field.required ?? false}
                            onChange={(e) =>
                              updateField(index, { required: e.target.checked })
                            }
                            className="rounded"
                          />
                          Required
                        </label>

                        <button
                          type="button"
                          onClick={() => removeField(index)}
                          className="text-zinc-300 hover:text-red-500 transition-colors pt-2 p-1"
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    {/* Required checkbox - Mobile */}
                    <div className="sm:hidden mt-3 pt-3 border-t border-zinc-200">
                      <label className="flex items-center gap-2 text-sm text-zinc-600">
                        <input
                          type="checkbox"
                          checked={field.required ?? false}
                          onChange={(e) =>
                            updateField(index, { required: e.target.checked })
                          }
                          className="rounded w-4 h-4"
                        />
                        Required field
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !draft.title.trim() || !draft.groupId}
              className="w-full sm:w-auto px-6 py-3 sm:py-2.5 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-700 active:bg-zinc-800 disabled:opacity-50 transition-colors shadow-sm"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </span>
              ) : editing ? "Update Form" : "Create Form"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={closeEditor}
                className="w-full sm:w-auto px-6 py-3 sm:py-2.5 rounded-xl border border-zinc-300 text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
