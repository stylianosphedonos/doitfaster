"use client";

import { useCallback, useEffect, useState } from "react";
import { COLOR_GRADIENT, COLORS, ICONS } from "@/lib/constants";
import type { FormGroup } from "@/lib/types";

const EMPTY_GROUP = {
  title: "",
  description: "",
  icon: "📁",
  color: "slate",
};

export function GroupsAdmin() {
  const [groups, setGroups] = useState<FormGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FormGroup | null>(null);
  const [draft, setDraft] = useState(EMPTY_GROUP);
  const [saving, setSaving] = useState(false);

  const loadGroups = useCallback(async () => {
    const res = await fetch("/api/groups");
    const data = await res.json();
    setGroups(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  function startNew() {
    setEditing(null);
    setDraft(EMPTY_GROUP);
  }

  function startEdit(group: FormGroup) {
    setEditing(group);
    setDraft({
      title: group.title,
      description: group.description,
      icon: group.icon,
      color: group.color,
    });
  }

  async function handleSave() {
    if (!draft.title.trim()) return;
    setSaving(true);

    const payload = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      icon: draft.icon,
      color: draft.color,
    };

    if (editing) {
      await fetch(`/api/groups/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setSaving(false);
    setEditing(null);
    setDraft(EMPTY_GROUP);
    await loadGroups();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this group? Forms in this group will also be removed.")) return;
    await fetch(`/api/groups/${id}`, { method: "DELETE" });
    if (editing?.id === id) {
      setEditing(null);
      setDraft(EMPTY_GROUP);
    }
    await loadGroups();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-5 gap-8">
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900">Groups</h2>
          <button
            type="button"
            onClick={startNew}
            className="text-sm px-3 py-1.5 rounded-lg bg-zinc-900 text-white hover:bg-zinc-700 transition-colors"
          >
            + New
          </button>
        </div>

        {groups.length === 0 ? (
          <p className="text-sm text-zinc-400 py-8 text-center border border-dashed border-zinc-200 rounded-xl">
            No groups yet. Create your first one.
          </p>
        ) : (
          <ul className="space-y-2">
            {groups.map((group) => (
              <li
                key={group.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                  editing?.id === group.id
                    ? "border-zinc-900 bg-zinc-50"
                    : "border-zinc-200 hover:border-zinc-300 bg-white"
                }`}
                onClick={() => startEdit(group)}
              >
                <span className="text-xl">{group.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-900 truncate">{group.title}</p>
                  {group.description && (
                    <p className="text-xs text-zinc-400 truncate">{group.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(group.id);
                  }}
                  className="text-zinc-300 hover:text-red-500 transition-colors p-1"
                  aria-label="Delete group"
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
          {editing ? "Edit Group" : "New Group"}
        </h2>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="e.g. Business, HR, Legal..."
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Description
            </label>
            <textarea
              value={draft.description}
              onChange={(e) =>
                setDraft((d) => ({ ...d, description: e.target.value }))
              }
              placeholder="Brief description shown on the group card"
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
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

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !draft.title.trim()}
              className="px-5 py-2.5 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : editing ? "Update Group" : "Create Group"}
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
