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

  const loadData = useCallback(async () => {
    const [formsRes, groupsRes] = await Promise.all([
      fetch("/api/forms"),
      fetch("/api/groups"),
    ]);
    const formsData = await formsRes.json();
    const groupsData = await groupsRes.json();
    setForms(formsData);
    setGroups(groupsData);
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
    if (!draft.title.trim() || !draft.groupId) return;
    setSaving(true);

    const payload = {
      groupId: draft.groupId,
      title: draft.title.trim(),
      description: draft.description.trim(),
      icon: draft.icon,
      color: draft.color,
      fields: draft.fields,
    };

    if (editing) {
      await fetch(`/api/forms/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setSaving(false);
    setEditing(null);
    setDraft({ ...EMPTY_FORM, groupId: groups[0]?.id ?? "", fields: [] });
    await loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this form? This cannot be undone.")) return;
    await fetch(`/api/forms/${id}`, { method: "DELETE" });
    if (editing?.id === id) {
      setEditing(null);
      setDraft({ ...EMPTY_FORM, groupId: groups[0]?.id ?? "", fields: [] });
    }
    await loadData();
  }

  function getGroupTitle(groupId: string) {
    return groups.find((g) => g.id === groupId)?.title ?? "Unknown group";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-400">
        Loading...
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-zinc-200 rounded-2xl">
        <p className="text-zinc-500">Create a group first before adding forms.</p>
        <p className="text-sm text-zinc-400 mt-1">Switch to the Groups tab to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-5 gap-8">
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900">Forms</h2>
          <button
            type="button"
            onClick={startNew}
            className="text-sm px-3 py-1.5 rounded-lg bg-zinc-900 text-white hover:bg-zinc-700 transition-colors"
          >
            + New
          </button>
        </div>

        {forms.length === 0 ? (
          <p className="text-sm text-zinc-400 py-8 text-center border border-dashed border-zinc-200 rounded-xl">
            No forms yet. Create your first one.
          </p>
        ) : (
          <ul className="space-y-2">
            {forms.map((form) => (
              <li
                key={form.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                  editing?.id === form.id
                    ? "border-zinc-900 bg-zinc-50"
                    : "border-zinc-200 hover:border-zinc-300 bg-white"
                }`}
                onClick={() => startEdit(form)}
              >
                <span className="text-xl">{form.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-900 truncate">{form.title}</p>
                  <p className="text-xs text-zinc-400">
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
                  className="text-zinc-300 hover:text-red-500 transition-colors p-1"
                  aria-label="Delete form"
                >
                  🗑
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="lg:col-span-3">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">
          {editing ? "Edit Form" : "New Form"}
        </h2>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                Group
              </label>
              <select
                value={draft.groupId}
                onChange={(e) => setDraft((d) => ({ ...d, groupId: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
              >
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.icon} {group.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                Title
              </label>
              <input
                type="text"
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="e.g. Invoice, Certificate..."
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                Description
              </label>
              <textarea
                value={draft.description}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, description: e.target.value }))
                }
                placeholder="Brief description shown on the card"
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                Icon
              </label>
              <div className="flex flex-wrap gap-2">
                {ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, icon }))}
                    className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border transition-colors ${
                      draft.icon === icon
                        ? "border-zinc-900 bg-zinc-50"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                Color
              </label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, color }))}
                    className={`w-9 h-9 rounded-lg border-2 transition-colors bg-gradient-to-br ${COLOR_GRADIENT[color]} ${
                      draft.color === color ? "border-zinc-900" : "border-transparent"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-zinc-700">Fields</label>
              <button
                type="button"
                onClick={addField}
                className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                + Add field
              </button>
            </div>

            {draft.fields.length === 0 ? (
              <p className="text-sm text-zinc-400 py-6 text-center border border-dashed border-zinc-200 rounded-xl">
                Add fields that users will fill in
              </p>
            ) : (
              <div className="space-y-3">
                {draft.fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex gap-2 items-start p-3 rounded-xl border border-zinc-100 bg-zinc-50"
                  >
                    <div className="flex flex-col gap-1 pt-2">
                      <button
                        type="button"
                        onClick={() => moveField(index, -1)}
                        disabled={index === 0}
                        className="text-zinc-300 hover:text-zinc-600 disabled:opacity-30 text-xs"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveField(index, 1)}
                        disabled={index === draft.fields.length - 1}
                        className="text-zinc-300 hover:text-zinc-600 disabled:opacity-30 text-xs"
                      >
                        ▼
                      </button>
                    </div>

                    <div className="flex-1 grid sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) =>
                          updateField(index, { label: e.target.value })
                        }
                        placeholder="Label"
                        className="px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                      />
                      <select
                        value={field.type}
                        onChange={(e) =>
                          updateField(index, { type: e.target.value as FieldType })
                        }
                        className="px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
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
                        className="px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                      />
                    </div>

                    <label className="flex items-center gap-1 text-xs text-zinc-500 pt-2.5 shrink-0">
                      <input
                        type="checkbox"
                        checked={field.required ?? false}
                        onChange={(e) =>
                          updateField(index, { required: e.target.checked })
                        }
                      />
                      Req.
                    </label>

                    <button
                      type="button"
                      onClick={() => removeField(index)}
                      className="text-zinc-300 hover:text-red-500 transition-colors pt-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !draft.title.trim() || !draft.groupId}
              className="px-5 py-2.5 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : editing ? "Update Form" : "Create Form"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={startNew}
                className="px-5 py-2.5 rounded-xl border border-zinc-300 text-zinc-700 hover:bg-zinc-50 transition-colors"
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
