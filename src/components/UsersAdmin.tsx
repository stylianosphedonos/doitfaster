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
      if (editing?.id === userId) startNew();
      await loadUsers();
    } else {
      const data = await res.json();
      alert(data.error ?? "Failed to delete user");
    }
  }

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AccessRequestsPanel reviewerRole="admin" />

      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900">Users</h2>
            <button
              type="button"
              onClick={startNew}
              className="text-sm px-3 py-1.5 rounded-lg bg-zinc-900 text-white hover:bg-zinc-700 transition-colors"
            >
              + New
            </button>
          </div>

          {users.length === 0 ? (
            <p className="text-sm text-zinc-400 py-8 text-center border border-dashed border-zinc-200 rounded-xl">
              No users yet. Create your first one.
            </p>
          ) : (
            <ul className="space-y-2">
              {users.map((user) => (
                <li
                  key={user.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                    editing?.id === user.id
                      ? "border-zinc-900 bg-zinc-50"
                      : user.disabled
                        ? "border-zinc-200 bg-zinc-50 opacity-70"
                        : "border-zinc-200 hover:border-zinc-300 bg-white"
                  }`}
                  onClick={() => startEdit(user)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-900 truncate">
                      {user.username}
                      {user.id === currentUserId && (
                        <span className="ml-2 text-xs text-zinc-400">(you)</span>
                      )}
                    </p>
                    <p className="text-xs text-zinc-400 truncate">
                      {ROLE_LABELS[user.role]}
                      {user.disabled ? " · Disabled" : ""}
                    </p>
                  </div>
                  {user.id !== currentUserId && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(user.id);
                      }}
                      className="text-zinc-300 hover:text-red-500 transition-colors p-1"
                      aria-label="Delete user"
                    >
                      🗑
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lg:col-span-3">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">
            {editing ? "Edit user" : "New user"}
          </h2>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4">
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
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

              <div className="sm:col-span-2">
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

              <div className="sm:col-span-2">
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
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 text-sm text-zinc-900">
                    <input
                      type="checkbox"
                      checked={draft.disabled}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, disabled: e.target.checked }))
                      }
                    />
                    Disabled (user cannot log in)
                  </label>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors"
              >
                {saving
                  ? "Saving..."
                  : editing
                    ? "Update user"
                    : "Create user"}
              </button>
              {editing && (
                <>
                  <button
                    type="button"
                    onClick={startNew}
                    className="px-5 py-2.5 rounded-xl border border-zinc-300 text-zinc-700 hover:bg-zinc-50 transition-colors"
                  >
                    Cancel
                  </button>
                  {editing.id !== currentUserId && (
                    <button
                      type="button"
                      onClick={() => handleToggleDisabled(editing)}
                      className="px-5 py-2.5 rounded-xl border border-zinc-300 text-zinc-700 hover:bg-zinc-50 transition-colors"
                    >
                      {editing.disabled ? "Enable user" : "Disable user"}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-600 space-y-2">
            <p className="font-medium text-zinc-800">Access levels</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-500">
              <li>
                <strong>Admin</strong> — Full access to main and admin, including Users
              </li>
              <li>
                <strong>Super user</strong> — Full admin access except the Users tab
              </li>
              <li>
                <strong>User</strong> — Can preview and export forms when logged in
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
