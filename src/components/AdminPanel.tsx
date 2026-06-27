"use client";

import { useState } from "react";
import { AccessRequestsPanel } from "@/components/AccessRequestsPanel";
import { FormsAdmin } from "@/components/FormsAdmin";
import { GroupsAdmin } from "@/components/GroupsAdmin";
import { SettingsAdmin } from "@/components/SettingsAdmin";
import { UsersAdmin } from "@/components/UsersAdmin";
import {
  canManageUsers,
  canReviewAccessRequests,
  type UserRole,
} from "@/lib/auth-types";

type AdminTab = "groups" | "forms" | "users" | "settings";

interface AdminPanelProps {
  userRole: UserRole;
  userId: string;
}

export function AdminPanel({ userRole, userId }: AdminPanelProps) {
  const [tab, setTab] = useState<AdminTab>("groups");

  const tabs: { id: AdminTab; label: string }[] = [
    { id: "groups", label: "Groups" },
    { id: "forms", label: "Forms" },
    ...(canManageUsers(userRole)
      ? [{ id: "users" as const, label: "Users" }]
      : []),
    { id: "settings", label: "Settings" },
  ];

  return (
    <div>
      {canReviewAccessRequests(userRole) && !canManageUsers(userRole) && (
        <AccessRequestsPanel reviewerRole={userRole} compact />
      )}

      <div className="flex gap-1 p-1 rounded-xl bg-zinc-100 w-fit mb-8 flex-wrap">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === id
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "groups" && <GroupsAdmin />}
      {tab === "forms" && <FormsAdmin />}
      {tab === "users" && canManageUsers(userRole) && (
        <UsersAdmin currentUserId={userId} />
      )}
      {tab === "settings" && <SettingsAdmin />}
    </div>
  );
}
