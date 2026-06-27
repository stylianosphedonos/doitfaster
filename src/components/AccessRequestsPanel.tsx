"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ROLE_LABELS,
  type AccessRequest,
  type UserRole,
} from "@/lib/auth-types";

interface AccessRequestsPanelProps {
  reviewerRole: UserRole;
  compact?: boolean;
}

export function AccessRequestsPanel({
  reviewerRole,
  compact = false,
}: Omit<AccessRequestsPanelProps, "reviewerId">) {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleByRequest, setRoleByRequest] = useState<Record<string, UserRole>>(
    {}
  );

  const assignableRoles: UserRole[] =
    reviewerRole === "admin"
      ? ["admin", "superuser", "user"]
      : reviewerRole === "superuser"
        ? ["superuser", "user"]
        : [];

  const loadRequests = useCallback(async () => {
    const res = await fetch("/api/access-requests");
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data = await res.json();
    const pending = data.filter(
      (r: AccessRequest) => r.status === "pending"
    );
    setRequests(pending);
    setRoleByRequest(
      Object.fromEntries(pending.map((r: AccessRequest) => [r.id, "user"]))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  async function handleApprove(id: string) {
    const role = roleByRequest[id] ?? "user";
    const res = await fetch(`/api/access-requests/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) await loadRequests();
  }

  async function handleReject(id: string) {
    const res = await fetch(`/api/access-requests/${id}/reject`, {
      method: "POST",
    });
    if (res.ok) await loadRequests();
  }

  if (loading) return null;
  if (requests.length === 0) return null;

  return (
    <div
      className={`rounded-2xl border border-amber-200 bg-amber-50 ${
        compact ? "p-4 mb-6" : "p-6 mb-8"
      }`}
    >
      <h3 className="font-semibold text-amber-900 mb-1">
        Pending access requests ({requests.length})
      </h3>
      <p className="text-sm text-amber-700 mb-4">
        Review and register users with the appropriate access level.
      </p>
      <ul className="space-y-3">
        {requests.map((request) => (
          <li
            key={request.id}
            className="rounded-xl border border-amber-100 bg-white p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-zinc-900">{request.username}</p>
                <p className="text-sm text-zinc-500">{request.email}</p>
                {request.phone && (
                  <p className="text-xs text-zinc-400 mt-1">{request.phone}</p>
                )}
                {request.address && (
                  <p className="text-xs text-zinc-400">{request.address}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={roleByRequest[request.id] ?? "user"}
                  onChange={(e) =>
                    setRoleByRequest((prev) => ({
                      ...prev,
                      [request.id]: e.target.value as UserRole,
                    }))
                  }
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 text-sm"
                >
                  {assignableRoles.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleApprove(request.id)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-sm hover:bg-zinc-700 transition-colors"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(request.id)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-300 text-zinc-700 text-sm hover:bg-zinc-50 transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
