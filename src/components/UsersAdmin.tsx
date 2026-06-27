"use client";

import { useCallback, useEffect, useState } from "react";
import { AccessRequestsPanel } from "@/components/AccessRequestsPanel";
import {
  ROLE_LABELS,
  type UserRole,
} from "@/lib/auth-types";

interface SafeUser {
  id: string;
  username: string;
  email: string;
  phone?: string;
  address?: string;
  role: UserRole;
  createdAt: string;
}

interface UsersAdminProps {
  currentUserId: string;
}

export function UsersAdmin({ currentUserId }: UsersAdminProps) {
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [loading, setLoading] = useState(true);

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

  async function handleRoleChange(userId: string, role: UserRole) {
    const res = await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) await loadUsers();
    else {
      const data = await res.json();
      alert(data.error ?? "Failed to update role");
    }
  }

  async function handleDelete(userId: string) {
    if (!confirm("Delete this user?")) return;
    const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
    if (res.ok) await loadUsers();
    else {
      const data = await res.json();
      alert(data.error ?? "Failed to delete user");
    }
  }

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

      <section>
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">
          Registered users
        </h2>

        {users.length === 0 ? (
          <p className="text-sm text-zinc-400 py-8 text-center border border-dashed border-zinc-200 rounded-xl">
            No users registered yet.
          </p>
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50 text-left">
                  <th className="px-4 py-3 font-medium text-zinc-600">User</th>
                  <th className="px-4 py-3 font-medium text-zinc-600">Email</th>
                  <th className="px-4 py-3 font-medium text-zinc-600">Access</th>
                  <th className="px-4 py-3 font-medium text-zinc-600 w-20" />
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-zinc-50 last:border-0">
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {user.username}
                      {user.id === currentUserId && (
                        <span className="ml-2 text-xs text-zinc-400">(you)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">{user.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        disabled={user.id === currentUserId}
                        onChange={(e) =>
                          handleRoleChange(user.id, e.target.value as UserRole)
                        }
                        className="px-2 py-1 rounded-lg border border-zinc-200 text-sm disabled:opacity-50"
                      >
                        {(["admin", "superuser", "user"] as UserRole[]).map(
                          (role) => (
                            <option key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </option>
                          )
                        )}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {user.id !== currentUserId && (
                        <button
                          type="button"
                          onClick={() => handleDelete(user.id)}
                          className="text-zinc-300 hover:text-red-500 transition-colors"
                          aria-label="Delete user"
                        >
                          🗑
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

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
      </section>
    </div>
  );
}
