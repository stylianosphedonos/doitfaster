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
  const [processing, setProcessing] = useState<string | null>(null);

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
    setProcessing(id);
    const role = roleByRequest[id] ?? "user";
    const res = await fetch(`/api/access-requests/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setProcessing(null);
    if (res.ok) await loadRequests();
  }

  async function handleReject(id: string) {
    setProcessing(id);
    const res = await fetch(`/api/access-requests/${id}/reject`, {
      method: "POST",
    });
    setProcessing(null);
    if (res.ok) await loadRequests();
  }

  if (loading) return null;
  if (requests.length === 0) return null;

  return (
    <div
      className={`rounded-2xl border border-amber-200 bg-amber-50 ${
        compact ? "p-4 mb-5 sm:mb-6" : "p-4 sm:p-6 mb-6 sm:mb-8"
      }`}
    >
      <div className="flex items-start gap-3 mb-3 sm:mb-4">
        <div className="p-2 rounded-lg bg-amber-100 flex-shrink-0 hidden sm:block">
          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-amber-900">
            Pending access requests ({requests.length})
          </h3>
          <p className="text-sm text-amber-700 mt-0.5">
            Review and register users with the appropriate access level.
          </p>
        </div>
      </div>

      <ul className="space-y-3">
        {requests.map((request) => (
          <li
            key={request.id}
            className={`rounded-xl border border-amber-100 bg-white p-4 transition-opacity ${
              processing === request.id ? "opacity-60" : ""
            }`}
          >
            {/* Desktop layout */}
            <div className="hidden sm:flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium text-zinc-900">{request.username}</p>
                <p className="text-sm text-zinc-500">{request.email}</p>
                {request.phone && (
                  <p className="text-xs text-zinc-400 mt-1">{request.phone}</p>
                )}
                {request.address && (
                  <p className="text-xs text-zinc-400">{request.address}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <select
                  value={roleByRequest[request.id] ?? "user"}
                  onChange={(e) =>
                    setRoleByRequest((prev) => ({
                      ...prev,
                      [request.id]: e.target.value as UserRole,
                    }))
                  }
                  disabled={processing === request.id}
                  className="px-3 py-2 rounded-lg border border-zinc-200 text-sm bg-white"
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
                  disabled={processing === request.id}
                  className="px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700 active:bg-zinc-800 disabled:opacity-50 transition-colors"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(request.id)}
                  disabled={processing === request.id}
                  className="px-4 py-2 rounded-lg border border-zinc-300 text-zinc-700 text-sm font-medium hover:bg-zinc-50 active:bg-zinc-100 disabled:opacity-50 transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>

            {/* Mobile layout */}
            <div className="sm:hidden space-y-3">
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

              <div className="pt-2 border-t border-zinc-100 space-y-2">
                <select
                  value={roleByRequest[request.id] ?? "user"}
                  onChange={(e) =>
                    setRoleByRequest((prev) => ({
                      ...prev,
                      [request.id]: e.target.value as UserRole,
                    }))
                  }
                  disabled={processing === request.id}
                  className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 text-sm bg-white"
                >
                  {assignableRoles.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleApprove(request.id)}
                    disabled={processing === request.id}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700 active:bg-zinc-800 disabled:opacity-50 transition-colors"
                  >
                    {processing === request.id ? "Processing..." : "Approve"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(request.id)}
                    disabled={processing === request.id}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-300 text-zinc-700 text-sm font-medium hover:bg-zinc-50 active:bg-zinc-100 disabled:opacity-50 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
