"use client";

import { useCallback, useEffect, useState } from "react";
import { AccessRequestsPanel } from "@/components/AccessRequestsPanel";
import { ROLE_LABELS, type UserRole } from "@/lib/auth-types";

interface SafeUser {
  id: string;
  username: string;
  email: string;
  phone?: string;
  address?: string;
  role: UserRole;
  disabled: boolean;
  createdAt: string;
}

interface UserDraft {
  username: string;
  password: string;
  email: string;
  phone: string;
  address: string;
  role: UserRole;
  disabled: boolean;
}

const EMPTY_DRAFT: UserDraft = {
  username: "",
  password: "",
  email: "",
  phone: "",
  address: "",
  role: "user",
  disabled: false,
};

interface UsersAdminProps {
  currentUserId: string;
}

export function UsersAdmin({ currentUserId }: UsersAdminProps) {
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SafeUser | null>(null);
  const [draft, setDraft] = useState<UserDraft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showEditor, setShowEditor] = useState(false);

  const loadUsers = useCallback(async () => {
    const res = await fetch("/api/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function startNew() {
    setEditing(null);
    setDraft(EMPTY_DRAFT);
    setError("");
    setShowEditor(true);
  }

  function startEdit(user: SafeUser) {
    setEditing(user);
    setDraft({
      username: user.username,
      password: "",
      email: user.email,
      phone: user.phone ?? "",
      address: user.address ?? "",
      role: user.role,
      disabled: user.disabled,
    });
    setError("");
    setShowEditor(true);
  }

  function closeEditor() {
    setShowEditor(false);
    setEditing(null);
    setDraft(EMPTY_DRAFT);
    setError("");
  }

  async function handleSave() {
    setError("");
    if (!draft.username.trim() || !draft.email.trim()) {
      setError("Username and email are required.");
      return;
    }
    if (!editing && !draft.password) {
      setError("Password is required for new users.");
      return;
    }

    setSaving(true);

    const payload: Record<string, unknown> = {
      username: draft.username.trim(),
      email: draft.email.trim(),
      phone: draft.phone,
      address: draft.address,
      role: draft.role,
      disabled: draft.disabled,
    };

    if (draft.password) {
      payload.password = draft.password;
    }

    const res = editing
      ? await fetch(`/api/users/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to save user");
      return;
    }

    setShowEditor(false);
    setEditing(null);
    setDraft(EMPTY_DRAFT);
    await loadUsers();
  }

  async function handleToggleDisabled(user: SafeUser) {
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disabled: !user.disabled }),
    });
    if (res.ok) await loadUsers();
    else {
      const data = await res.json();
      alert(data.error ?? "Failed to update user");
    }
  }

  async function handleDelete(userId: string) {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
    if (res.ok) {
      if (editing?.id === userId) closeEditor();
      await loadUsers();
    } else {
      const data = await res.json();
      alert(data.error ?? "Failed to delete user");
    }
  }

  const inputClass =
    "w-full px-4 py-2.5 sm:py-3 rounded-xl border border-zinc-200 bg-white text-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 text-base";

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
    <div className="space-y-6 sm:space-y-8">
      <AccessRequestsPanel reviewerRole="admin" />

      <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-5 lg:gap-8">
        {/* Users List */}
        <div className={`lg:col-span-2 ${showEditor ? "hidden lg:block" : ""}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900">Users</h2>
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

          {users.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50">
              <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-sm text-zinc-500 font-medium">No users yet</p>
              <p className="text-xs text-zinc-400 mt-1">Create your first user</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {users.map((user) => (
                <li
                  key={user.id}
                  className={`flex items-center gap-3 p-3.5 sm:p-3 rounded-xl border transition-all cursor-pointer active:scale-[0.99] ${
                    editing?.id === user.id
                      ? "border-zinc-900 bg-zinc-50 shadow-sm"
                      : user.disabled
                        ? "border-zinc-200 bg-zinc-50 opacity-70"
                        : "border-zinc-200 hover:border-zinc-300 hover:shadow-sm bg-white"
                  }`}
                  onClick={() => startEdit(user)}
                >
                  {/* User Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
                    user.disabled 
                      ? "bg-zinc-300" 
                      : "bg-gradient-to-br from-zinc-500 to-zinc-700"
                  }`}>
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-900 truncate">
                      {user.username}
                      {user.id === currentUserId && (
                        <span className="ml-2 text-xs bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded-full">(you)</span>
                      )}
                    </p>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">
                      {ROLE_LABELS[user.role]}
                      {user.disabled && (
                        <span className="ml-1 text-red-400">· Disabled</span>
                      )}
                    </p>
                  </div>
                  {user.id !== currentUserId && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(user.id);
                      }}
                      className="text-zinc-300 hover:text-red-500 active:text-red-600 transition-colors p-2 -mr-1 rounded-lg hover:bg-red-50"
                      aria-label="Delete user"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
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
            {editing ? "Edit user" : "New user"}
          </h2>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 space-y-4">
            {error && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-900 mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    value={draft.username}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, username: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-900 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={draft.email}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, email: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900 mb-1.5">
                  Password{editing ? " (leave blank to keep current)" : ""}
                </label>
                <input
                  type="password"
                  value={draft.password}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, password: e.target.value }))
                  }
                  minLength={editing ? undefined : 6}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-900 mb-1.5">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={draft.phone}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, phone: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-900 mb-1.5">
                    Access level
                  </label>
                  <select
                    value={draft.role}
                    disabled={editing?.id === currentUserId}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, role: e.target.value as UserRole }))
                    }
                    className={inputClass}
                  >
                    {(["admin", "superuser", "user"] as UserRole[]).map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900 mb-1.5">
                  Address
                </label>
                <textarea
                  value={draft.address}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, address: e.target.value }))
                  }
                  rows={2}
                  className={inputClass}
                />
              </div>

              {editing && editing.id !== currentUserId && (
                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                  <label className="flex items-center gap-3 text-sm text-zinc-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.disabled}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, disabled: e.target.checked }))
                      }
                      className="w-4 h-4 rounded"
                    />
                    <div>
                      <span className="font-medium">Disabled</span>
                      <p className="text-xs text-zinc-500 mt-0.5">User will not be able to log in</p>
                    </div>
                  </label>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
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
                ) : editing ? "Update user" : "Create user"}
              </button>
              {editing && (
                <>
                  <button
                    type="button"
                    onClick={closeEditor}
                    className="w-full sm:w-auto px-6 py-3 sm:py-2.5 rounded-xl border border-zinc-300 text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 transition-colors"
                  >
                    Cancel
                  </button>
                  {editing.id !== currentUserId && (
                    <button
                      type="button"
                      onClick={() => handleToggleDisabled(editing)}
                      className={`w-full sm:w-auto px-6 py-3 sm:py-2.5 rounded-xl border transition-colors ${
                        editing.disabled
                          ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          : "border-amber-300 text-amber-700 hover:bg-amber-50"
                      }`}
                    >
                      {editing.disabled ? "Enable user" : "Disable user"}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Access levels info */}
          <div className="mt-6 rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-600 space-y-3">
            <p className="font-medium text-zinc-800 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Access levels
            </p>
            <ul className="space-y-2 text-zinc-500">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 mt-1.5 flex-shrink-0"></span>
                <span><strong className="text-zinc-700">Admin</strong> — Full access to main and admin, including Users</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 mt-1.5 flex-shrink-0"></span>
                <span><strong className="text-zinc-700">Super user</strong> — Full admin access except the Users tab</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 mt-1.5 flex-shrink-0"></span>
                <span><strong className="text-zinc-700">User</strong> — Can preview and export forms when logged in</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
