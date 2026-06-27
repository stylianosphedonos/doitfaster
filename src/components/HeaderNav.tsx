"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { canAccessAdmin, type SessionUser } from "@/lib/auth-types";
import type { BrandingSettings } from "@/lib/settings-types";

interface HeaderNavProps {
  branding: BrandingSettings;
  user: SessionUser | null;
}

export function HeaderNav({ branding, user }: HeaderNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const onAdmin = pathname.startsWith("/admin");

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
    router.push("/");
  }

  const navLinkClass =
    "px-3 py-1.5 rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-50 transition-colors";
  const navLinkActiveClass =
    "px-3 py-1.5 rounded-lg bg-zinc-900 text-white hover:bg-zinc-700 transition-colors";

  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-zinc-900">
          {branding.logoUrl ? (
            <Image
              src={branding.logoUrl}
              alt={branding.appName}
              width={28}
              height={28}
              className="h-7 w-auto object-contain"
              unoptimized
            />
          ) : (
            <span className="text-xl">📋</span>
          )}
          <span>{branding.appName}</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="text-zinc-500 hidden sm:inline">
                {user.username}
              </span>
              <Link
                href="/"
                className={onAdmin ? navLinkClass : navLinkActiveClass}
                aria-current={!onAdmin ? "page" : undefined}
              >
                Home
              </Link>
              {canAccessAdmin(user.role) && (
                <Link
                  href="/admin"
                  className={onAdmin ? navLinkActiveClass : navLinkClass}
                  aria-current={onAdmin ? "page" : undefined}
                >
                  Admin
                </Link>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className={navLinkClass}
              >
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className={navLinkActiveClass}>
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
