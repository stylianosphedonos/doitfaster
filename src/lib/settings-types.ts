export interface BrandingSettings {
  appName: string;
  pageTitle: string;
  pageSubtitle: string;
  logoUrl: string | null;
  bannerUrl: string | null;
}

export interface AppSettings {
  branding: BrandingSettings;
  updatedAt: string;
}

export const DEFAULT_BRANDING: BrandingSettings = {
  appName: "FormDocs",
  pageTitle: "Form Groups",
  pageSubtitle: "Choose a group to browse and fill in its forms.",
  logoUrl: null,
  bannerUrl: null,
};
