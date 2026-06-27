"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const [branding, setBranding] = useState<BrandingSettings>(DEFAULT_BRANDING);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [removeBanner, setRemoveBanner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Branding</h2>
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
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
            />
            <p className="text-xs text-zinc-400 mt-1">Shown in the header navigation.</p>
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
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
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
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 pt-2">
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

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save branding"}
          </button>
          {saved && (
            <span className="text-sm text-emerald-600">Saved successfully</span>
          )}
        </div>
      </section>
    </div>
  );
}
