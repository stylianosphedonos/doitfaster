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

const TAB_ICONS: Record<AdminTab, string> = {
  groups: "📁",
  forms: "📄",
  users: "👥",
  settings: "⚙️",
};

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

      {/* Admin Navigation */}
      <div className="mb-8">
        <nav className="flex gap-2 p-1.5 rounded-2xl bg-zinc-100/80 w-fit flex-wrap">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                tab === id
                  ? "bg-white text-zinc-900 shadow-md"
                  : "text-zinc-500 hover:text-zinc-700 hover:bg-white/50"
              }`}
            >
              <span>{TAB_ICONS[id]}</span>
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in duration-200">
        {tab === "groups" && <GroupsAdmin />}
        {tab === "forms" && <FormsAdmin />}
        {tab === "users" && canManageUsers(userRole) && (
          <UsersAdmin currentUserId={userId} />
        )}
        {tab === "settings" && <SettingsAdmin />}
      </div>
    </div>
  );
}
