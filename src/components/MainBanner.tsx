import Image from "next/image";
import type { BrandingSettings } from "@/lib/settings-types";

interface MainBannerProps {
  branding: BrandingSettings;
}

export function MainBanner({ branding }: MainBannerProps) {
  if (!branding.bannerUrl) return null;

  return (
    <div className="w-full bg-white border-b border-zinc-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <div className="relative w-full h-36 sm:h-48 md:h-56 rounded-2xl overflow-hidden shadow-sm">
          <Image
            src={branding.bannerUrl}
            alt="Banner"
            fill
            className="object-cover"
            priority
            unoptimized
          />
          {/* Subtle gradient overlay for better visual depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
        </div>
      </div>
    </div>
  );
}
