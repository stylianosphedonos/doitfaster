"use client";

import { useState, useRef, useEffect } from "react";
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

const TAB_CONFIG: Record<AdminTab, { icon: string; iconSvg: React.ReactNode }> = {
  groups: {
    icon: "📁",
    iconSvg: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
  },
  forms: {
    icon: "📄",
    iconSvg: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  users: {
    icon: "👥",
    iconSvg: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  settings: {
    icon: "⚙️",
    iconSvg: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
};

export function AdminPanel({ userRole, userId }: AdminPanelProps) {
  const [tab, setTab] = useState<AdminTab>("groups");
  const navRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const tabs: { id: AdminTab; label: string }[] = [
    { id: "groups", label: "Groups" },
    { id: "forms", label: "Forms" },
    ...(canManageUsers(userRole)
      ? [{ id: "users" as const, label: "Users" }]
      : []),
    { id: "settings", label: "Settings" },
  ];

  // Check for scroll overflow
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const checkOverflow = () => {
      const hasOverflow = nav.scrollWidth > nav.clientWidth;
      setShowLeftFade(hasOverflow && nav.scrollLeft > 0);
      setShowRightFade(hasOverflow && nav.scrollLeft < nav.scrollWidth - nav.clientWidth - 1);
    };

    checkOverflow();
    nav.addEventListener("scroll", checkOverflow);
    window.addEventListener("resize", checkOverflow);

    return () => {
      nav.removeEventListener("scroll", checkOverflow);
      window.removeEventListener("resize", checkOverflow);
    };
  }, []);

  return (
    <div>
      {canReviewAccessRequests(userRole) && !canManageUsers(userRole) && (
        <AccessRequestsPanel reviewerRole={userRole} compact />
      )}

      {/* Admin Navigation */}
      <div className="mb-6 sm:mb-8 -mx-4 sm:mx-0 relative">
        {/* Left fade indicator */}
        {showLeftFade && (
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none sm:hidden" />
        )}
        {/* Right fade indicator */}
        {showRightFade && (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none sm:hidden" />
        )}

        <nav
          ref={navRef}
          className="flex gap-1.5 sm:gap-2 p-1.5 sm:rounded-2xl bg-zinc-100/80 sm:w-fit overflow-x-auto scrollbar-hide px-4 sm:px-1.5"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap min-w-fit ${
                tab === id
                  ? "bg-white text-zinc-900 shadow-md"
                  : "text-zinc-500 hover:text-zinc-700 hover:bg-white/50 active:bg-white/70"
              }`}
            >
              <span className="hidden sm:inline">{TAB_CONFIG[id].icon}</span>
              <span className="sm:hidden">{TAB_CONFIG[id].iconSvg}</span>
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
