"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { canAccessAdmin, type SessionUser } from "@/lib/auth-types";
import type { BrandingSettings } from "@/lib/settings-types";
import { LanguageSwitch } from "./LanguageSwitch";
import { useLocale } from "./LocaleProvider";

interface HeaderNavProps {
  branding: BrandingSettings;
  user: SessionUser | null;
}

export function HeaderNav({ branding, user }: HeaderNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const onAdmin = pathname.startsWith("/admin");
  const { t } = useLocale();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
    router.push("/");
  }

  const navLinkClass =
    "px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-all duration-200";
  const navLinkActiveClass =
    "px-4 py-2 rounded-lg text-sm font-medium bg-zinc-900 text-white shadow-sm hover:bg-zinc-800 transition-all duration-200";

  return (
    <header className="border-b border-zinc-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          {branding.logoUrl ? (
            <Image
              src={branding.logoUrl}
              alt={branding.appName}
              width={36}
              height={36}
              className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
              unoptimized
            />
          ) : (
            <span className="text-2xl">📋</span>
          )}
          <span className="font-bold text-lg text-zinc-900 group-hover:text-zinc-700 transition-colors">
            {branding.appName}
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <LanguageSwitch />
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 mr-2 px-3 py-1.5 bg-zinc-100 rounded-full">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-zinc-400 to-zinc-600 flex items-center justify-center text-white text-xs font-bold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-zinc-700">
                  {user.username}
                </span>
              </div>
              <Link
                href="/"
                className={onAdmin ? navLinkClass : navLinkActiveClass}
                aria-current={!onAdmin ? "page" : undefined}
              >
                {t.nav.home}
              </Link>
              {canAccessAdmin(user.role) && (
                <Link
                  href="/admin"
                  className={onAdmin ? navLinkActiveClass : navLinkClass}
                  aria-current={onAdmin ? "page" : undefined}
                >
                  {t.nav.admin}
                </Link>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
              >
                {t.nav.logout}
              </button>
            </>
          ) : (
            <Link href="/login" className={navLinkActiveClass}>
              {t.nav.login}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
