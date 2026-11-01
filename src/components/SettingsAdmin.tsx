"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { DEFAULT_BRANDING, type BrandingSettings } from "@/lib/settings-types";

const MAX_LOGO_SIZE = 2 * 1024 * 1024;
const MAX_BANNER_SIZE = 5 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ImageUploadField({
  label,
  hint,
  currentUrl,
  previewUrl,
  maxSize,
  onSelect,
  onRemove,
}: {
  label: string;
  hint: string;
  currentUrl: string | null;
  previewUrl: string | null;
  maxSize: number;
  onSelect: (dataUrl: string) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const displayUrl = previewUrl ?? currentUrl;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (file.size > maxSize) {
      alert(`Image must be smaller than ${Math.round(maxSize / 1024 / 1024)}MB.`);
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    onSelect(dataUrl);
    e.target.value = "";
  }

  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 mb-1.5">
        {label}
      </label>
      <p className="text-xs text-zinc-400 mb-3">{hint}</p>

      {displayUrl ? (
        <div className="relative rounded-xl border border-zinc-200 overflow-hidden bg-zinc-50">
          <div className="relative w-full h-32">
            <Image
              src={displayUrl}
              alt={label}
              fill
              className="object-contain p-2"
              unoptimized
            />
          </div>
          <div className="flex gap-2 p-3 border-t border-zinc-100 bg-white">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-sm px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="text-sm px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full py-8 rounded-xl border-2 border-dashed border-zinc-200 text-sm text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 transition-colors"
        >
          Click to upload image
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

export function SettingsAdmin() {
  const { locale, setLocale, t } = useLocale();
  const [branding, setBranding] = useState<BrandingSettings>(DEFAULT_BRANDING);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [removeBanner, setRemoveBanner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [syncError, setSyncError] = useState("");

  const loadSettings = useCallback(async () => {
    const res = await fetch("/api/settings");
    const data = await res.json();
    setBranding(data.branding);
    setLogoPreview(null);
    setBannerPreview(null);
    setRemoveLogo(false);
    setRemoveBanner(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    const payload: Record<string, unknown> = {
      appName: branding.appName,
      pageTitle: branding.pageTitle,
      pageSubtitle: branding.pageSubtitle,
      removeLogo,
      removeBanner,
    };

    if (logoPreview) payload.logoDataUrl = logoPreview;
    if (bannerPreview) payload.bannerDataUrl = bannerPreview;

    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      setBranding(data.branding);
      setLogoPreview(null);
      setBannerPreview(null);
      setRemoveLogo(false);
      setRemoveBanner(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }

    setSaving(false);
  }

  async function handleLanguageSync() {
    setSyncing(true);
    setSyncMessage("");
    setSyncError("");

    try {
      const res = await fetch("/api/settings/language-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fromLocale: locale }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSyncError(data.error ?? t.settings.languageSyncFailed);
        return;
      }

      const languageLabel =
        data.targetLocale === "el"
          ? t.settings.languageSyncToEl
          : t.settings.languageSyncToEn;

      setLocale(data.targetLocale);
      setSyncMessage(
        t.settings.languageSyncSuccess.replace("{language}", languageLabel)
      );
      await loadSettings();
      setTimeout(() => window.location.reload(), 600);
    } catch {
      setSyncError(t.settings.languageSyncFailed);
    } finally {
      setSyncing(false);
    }
  }

  const inputClass =
    "w-full px-4 py-2.5 sm:py-3 rounded-xl border border-zinc-200 bg-white text-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 text-base";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-400">
        <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-5 sm:space-y-6">
      {/* Language Sync Section */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            {t.settings.languageSyncTitle}
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            {t.settings.languageSyncDescription}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            type="button"
            onClick={handleLanguageSync}
            disabled={syncing}
            className="w-full sm:w-auto px-6 py-3 sm:py-2.5 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-700 active:bg-zinc-800 disabled:opacity-50 transition-colors shadow-sm"
          >
            {syncing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t.settings.languageSyncWorking}
              </span>
            ) : t.settings.languageSyncButton}
          </button>
          {syncMessage && (
            <span className="flex items-center gap-2 text-sm text-emerald-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {syncMessage}
            </span>
          )}
          {syncError && (
            <span className="flex items-center gap-2 text-sm text-red-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              {syncError}
            </span>
          )}
        </div>
      </section>

      {/* Branding Section */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 space-y-5 sm:space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            Branding
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            Customize the app name, main page texts, logo, and banner.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              App name
            </label>
            <input
              type="text"
              value={branding.appName}
              onChange={(e) =>
                setBranding((b) => ({ ...b, appName: e.target.value }))
              }
              placeholder="FormDocs"
              className={inputClass}
            />
            <p className="text-xs text-zinc-400 mt-1.5">Shown in the header navigation.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Main page title
            </label>
            <input
              type="text"
              value={branding.pageTitle}
              onChange={(e) =>
                setBranding((b) => ({ ...b, pageTitle: e.target.value }))
              }
              placeholder="Form Groups"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Main page subtitle
            </label>
            <textarea
              value={branding.pageSubtitle}
              onChange={(e) =>
                setBranding((b) => ({ ...b, pageSubtitle: e.target.value }))
              }
              placeholder="Choose a group to browse and fill in its forms."
              rows={2}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 pt-2">
          <ImageUploadField
            label="Logo"
            hint="Shown in the header. Max 2MB."
            currentUrl={removeLogo ? null : branding.logoUrl}
            previewUrl={logoPreview}
            maxSize={MAX_LOGO_SIZE}
            onSelect={(dataUrl) => {
              setLogoPreview(dataUrl);
              setRemoveLogo(false);
            }}
            onRemove={() => {
              setLogoPreview(null);
              setRemoveLogo(true);
            }}
          />

          <ImageUploadField
            label="Banner"
            hint="Shown at the top of the main page. Max 5MB."
            currentUrl={removeBanner ? null : branding.bannerUrl}
            previewUrl={bannerPreview}
            maxSize={MAX_BANNER_SIZE}
            onSelect={(dataUrl) => {
              setBannerPreview(dataUrl);
              setRemoveBanner(false);
            }}
            onRemove={() => {
              setBannerPreview(null);
              setRemoveBanner(true);
            }}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto px-6 py-3 sm:py-2.5 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-700 active:bg-zinc-800 disabled:opacity-50 transition-colors shadow-sm"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </span>
            ) : "Save branding"}
          </button>
          {saved && (
            <span className="flex items-center gap-2 text-sm text-emerald-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved successfully
            </span>
          )}
        </div>
      </section>
    </div>
  );
}
