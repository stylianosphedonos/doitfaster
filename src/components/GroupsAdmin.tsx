"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const [error, setError] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragSourceRef = useRef<string | null>(null);

  const inputClass =
    "w-full px-4 py-2.5 sm:py-3 rounded-xl border border-zinc-200 bg-white text-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 text-base";

  const loadGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/groups");
      if (!res.ok) {
        console.error("Failed to load groups:", res.status);
        setGroups([]);
        return;
      }
      const data = await res.json();
      setGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load groups:", err);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  function startNew() {
    setEditing(null);
    setDraft(EMPTY_GROUP);
    setError("");
    setShowEditor(true);
  }

  function startEdit(group: FormGroup) {
    setEditing(group);
    setDraft({
      title: group.title,
      description: group.description,
      icon: group.icon,
      color: group.color,
    });
    setError("");
    setShowEditor(true);
  }

  function closeEditor() {
    setShowEditor(false);
    setEditing(null);
    setDraft(EMPTY_GROUP);
    setError("");
  }

  async function handleSave() {
    if (!draft.title.trim()) return;
    setSaving(true);
    setError("");

    const payload = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      icon: draft.icon,
      color: draft.color,
    };

    const res = editing
      ? await fetch(`/api/groups/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        })
      : await fetch("/api/groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });

    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to save group");
      return;
    }

    setShowEditor(false);
    setEditing(null);
    setDraft(EMPTY_GROUP);
    await loadGroups();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this group? Forms in this group will also be removed.")) return;
    const res = await fetch(`/api/groups/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to delete group");
      return;
    }
    if (editing?.id === id) {
      closeEditor();
    }
    await loadGroups();
  }

  async function handleToggleVisibility(id: string, currentVisible: boolean) {
    const res = await fetch(`/api/groups/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ visible: !currentVisible }),
    });
    if (res.ok) {
      await loadGroups();
    }
  }

  function handleDragStart(e: React.DragEvent, groupId: string) {
    dragSourceRef.current = groupId;
    setDraggingId(groupId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", groupId);
  }

  function handleDragOver(e: React.DragEvent, groupId: string) {
    e.preventDefault();
    if (dragSourceRef.current && dragSourceRef.current !== groupId) {
      setDragOverId(groupId);
    }
  }

  function handleDragLeave() {
    setDragOverId(null);
  }

  async function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    const sourceId = dragSourceRef.current;
    setDraggingId(null);
    setDragOverId(null);
    dragSourceRef.current = null;

    if (!sourceId || sourceId === targetId) return;

    // Reorder locally first for immediate feedback
    const sourceIndex = groups.findIndex((g) => g.id === sourceId);
    const targetIndex = groups.findIndex((g) => g.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const newGroups = [...groups];
    const [moved] = newGroups.splice(sourceIndex, 1);
    newGroups.splice(targetIndex, 0, moved);
    setGroups(newGroups);

    // Persist to server
    const orderedIds = newGroups.map((g) => g.id);
    await fetch("/api/groups", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ orderedIds }),
    });
    await loadGroups();
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverId(null);
    dragSourceRef.current = null;
  }

  async function moveGroup(id: string, direction: "up" | "down") {
    const index = groups.findIndex((g) => g.id === id);
    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === groups.length - 1) return;

    const newGroups = [...groups];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newGroups[index], newGroups[targetIndex]] = [newGroups[targetIndex], newGroups[index]];
    setGroups(newGroups);

    const orderedIds = newGroups.map((g) => g.id);
    await fetch("/api/groups", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ orderedIds }),
    });
    await loadGroups();
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

  return (
    <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-5 lg:gap-8">
      {/* Groups List */}
      <div className={`lg:col-span-2 ${showEditor ? "hidden lg:block" : ""}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900">Groups</h2>
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

        {groups.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <p className="text-sm text-zinc-500 font-medium">No groups yet</p>
            <p className="text-xs text-zinc-400 mt-1">Create your first group to get started</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {groups.map((group, index) => (
              <li
                key={group.id}
                draggable
                onDragStart={(e) => handleDragStart(e, group.id)}
                onDragOver={(e) => handleDragOver(e, group.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, group.id)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-2 p-3.5 sm:p-3 rounded-xl border transition-all ${
                  draggingId === group.id
                    ? "opacity-50 border-zinc-300 bg-zinc-100"
                    : dragOverId === group.id
                      ? "border-zinc-400 bg-zinc-50 shadow-md"
                      : editing?.id === group.id
                        ? "border-zinc-900 bg-zinc-50 shadow-sm"
                        : "border-zinc-200 hover:border-zinc-300 hover:shadow-sm bg-white"
                } ${!group.visible ? "opacity-60" : ""}`}
              >
                {/* Drag handle */}
                <div className="cursor-grab active:cursor-grabbing text-zinc-300 hover:text-zinc-500 flex-shrink-0">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm8-12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                  </svg>
                </div>

                {/* Up/Down arrows for mobile */}
                <div className="flex flex-col gap-0.5 sm:hidden flex-shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveGroup(group.id, "up");
                    }}
                    disabled={index === 0}
                    className="text-zinc-400 hover:text-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed p-0.5"
                    aria-label="Move up"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveGroup(group.id, "down");
                    }}
                    disabled={index === groups.length - 1}
                    className="text-zinc-400 hover:text-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed p-0.5"
                    aria-label="Move down"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                <span className="text-xl sm:text-xl flex-shrink-0">{group.icon}</span>
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => startEdit(group)}
                >
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-zinc-900 truncate">{group.title}</p>
                    {!group.visible && (
                      <span className="text-xs bg-zinc-200 text-zinc-500 px-1.5 py-0.5 rounded">Hidden</span>
                    )}
                  </div>
                  {group.description && (
                    <p className="text-xs text-zinc-400 truncate mt-0.5">{group.description}</p>
                  )}
                </div>

                {/* Visibility toggle */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleVisibility(group.id, group.visible);
                  }}
                  className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                    group.visible
                      ? "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
                      : "text-zinc-300 hover:text-zinc-500 hover:bg-zinc-100"
                  }`}
                  aria-label={group.visible ? "Hide group" : "Show group"}
                  title={group.visible ? "Hide from homepage" : "Show on homepage"}
                >
                  {group.visible ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(group.id);
                  }}
                  className="text-zinc-300 hover:text-red-500 active:text-red-600 transition-colors p-2 -mr-1 rounded-lg hover:bg-red-50 flex-shrink-0"
                  aria-label="Delete group"
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
          {editing ? "Edit Group" : "New Group"}
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
          <div>
            <label className="block text-sm font-medium text-zinc-900 mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="e.g. Business, HR, Legal..."
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
              placeholder="Brief description shown on the group card"
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

          <div className="flex flex-col sm:flex-row gap-3 pt-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !draft.title.trim()}
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
              ) : editing ? "Update Group" : "Create Group"}
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
