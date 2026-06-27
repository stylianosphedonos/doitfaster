import Image from "next/image";
import type { BrandingSettings } from "@/lib/settings-types";

interface MainBannerProps {
  branding: BrandingSettings;
}

export function MainBanner({ branding }: MainBannerProps) {
  if (!branding.bannerUrl) return null;

  return (
    <div className="w-full border-b border-zinc-200 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="relative w-full h-40 sm:h-52 md:h-64">
          <Image
            src={branding.bannerUrl}
            alt="Banner"
            fill
            className="object-cover"
            priority
            unoptimized
          />
        </div>
      </div>
    </div>
  );
}
