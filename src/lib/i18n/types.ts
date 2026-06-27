export type Locale = "en" | "el";

export const LOCALES: Locale[] = ["en", "el"];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_COOKIE = "locale";

export interface TranslationDictionary {
  common: {
    loading: string;
    preview: string;
    closePreview: string;
    pdfPreview: string;
    generatingPreview: string;
    previewNotReady: string;
    previewFailed: string;
    exportFailed: string;
    fields: string;
    field: string;
    forms: string;
    form: string;
  };
  nav: {
    home: string;
    admin: string;
    login: string;
    logout: string;
  };
  language: {
    label: string;
    en: string;
    el: string;
  };
  home: {
    noGroups: string;
    noGroupsHint: string;
  };
  group: {
    backToGroups: string;
    noForms: string;
    noFormsHint: string;
  };
  form: {
    backToForms: string;
    saveTemplate: string;
    saving: string;
    clearSaved: string;
    previewPdf: string;
    exportPdf: string;
    exporting: string;
    lastSaved: string;
    templateSaved: string;
    templateCleared: string;
    saveFailed: string;
    clearFailed: string;
    clearConfirm: string;
    loginToExport: string;
    loginToSave: string;
    loginToPreview: string;
    logIn: string;
  };
  previewTitles: {
    invoice: string;
    quotation: string;
    receipt: string;
    certificate: string;
    "sxedio-mathimatos": string;
  };
  groups: Record<string, { title: string; description: string }>;
  forms: Record<string, { title: string; description: string }>;
  fields: Record<string, { label?: string; placeholder?: string }>;
  sections: Record<string, string>;
  templates: {
    businessDoc: {
      contactInfo: string;
      description: string;
      qty: string;
      price: string;
      total: string;
      subtotal: string;
      tax: string;
      grandTotal: string;
      thankYou: string;
      invoice: BusinessDocTemplateStrings;
      quotation: BusinessDocTemplateStrings;
      receipt: BusinessDocTemplateStrings;
    };
    certificate: {
      title: string;
      subtitle: string;
      defaultRecipient: string;
      defaultBody: string;
      defaultBodyWithCourse: string;
      date: string;
      signature: string;
    };
  };
}

export interface BusinessDocTemplateStrings {
  title: string;
  metaLeft: { label: string; field: string; format?: "date" }[];
  footerTitle: string;
  footerLines: { label: string; field: string }[];
}
