"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMobileMenuOpen(false);
    router.refresh();
    router.push("/");
  }

  const navLinkClass =
    "px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-all duration-200";
  const navLinkActiveClass =
    "px-4 py-2 rounded-lg text-sm font-medium bg-zinc-900 text-white shadow-sm hover:bg-zinc-800 transition-all duration-200";

  const mobileNavLinkClass =
    "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 active:bg-zinc-200 transition-all";
  const mobileNavLinkActiveClass =
    "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium bg-zinc-900 text-white shadow-sm";

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

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          <LanguageSwitch />
          {user ? (
            <>
              <div className="flex items-center gap-2 mr-2 px-3 py-1.5 bg-zinc-100 rounded-full">
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

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitch />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 top-16 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Panel */}
      <div
        className={`fixed top-16 left-0 right-0 bg-white border-b border-zinc-200 shadow-lg z-50 md:hidden transform transition-all duration-300 ease-out ${
          mobileMenuOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <nav className="max-w-6xl mx-auto px-4 py-4 space-y-2">
          {user ? (
            <>
              {/* User info */}
              <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-zinc-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-400 to-zinc-600 flex items-center justify-center text-white text-lg font-bold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-zinc-900">{user.username}</p>
                  <p className="text-sm text-zinc-500">Logged in</p>
                </div>
              </div>

              <Link
                href="/"
                className={onAdmin ? mobileNavLinkClass : mobileNavLinkActiveClass}
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {t.nav.home}
              </Link>

              {canAccessAdmin(user.role) && (
                <Link
                  href="/admin"
                  className={onAdmin ? mobileNavLinkActiveClass : mobileNavLinkClass}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {t.nav.admin}
                </Link>
              )}

              <div className="pt-2 mt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-red-600 hover:bg-red-50 active:bg-red-100 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {t.nav.logout}
                </button>
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className={mobileNavLinkActiveClass}
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              {t.nav.login}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
