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
  settings: {
    languageSyncTitle: string;
    languageSyncDescription: string;
    languageSyncButton: string;
    languageSyncWorking: string;
    languageSyncSuccess: string;
    languageSyncFailed: string;
    languageSyncToEn: string;
    languageSyncToEl: string;
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
    studentsAvgGrades: {
      hint: string;
      newList: string;
      upload: string;
      exportExcel: string;
      name: string;
      grade: string;
      average: string;
      namePlaceholder: string;
      gradePlaceholder: string;
      addStudent: string;
      addGrade: string;
      removeStudent: string;
      removeGrade: string;
      uploadEmpty: string;
      uploadSuccess: string;
      uploadFailed: string;
      exportEmpty: string;
      exampleTitle: string;
      exampleBody: string;
      cardMeta: string;
    };
    physics: {
      cardMeta: string;
      chooseMode: string;
      searchTitle: string;
      searchDescription: string;
      lessonTitle: string;
      lessonDescription: string;
      testTitle: string;
      testDescription: string;
      searchHeading: string;
      searchHint: string;
      analyticalProgramBadge: string;
      searchPlaceholder: string;
      searchButton: string;
      searching: string;
      queryTooShort: string;
      searchFailed: string;
      noResults: string;
      resultsMeta: string;
      page: string;
      pages: string;
      openPdf: string;
      openSelectedPdf: string;
      lessonHeading: string;
      lessonHint: string;
      testHeading: string;
      testHint: string;
      classLabel: string;
      classPlaceholder: string;
      bookLabel: string;
      bookPlaceholder: string;
      pagesLabel: string;
      pagesPlaceholder: string;
      pagesHint: string;
      pagesHintEmpty: string;
      activityPagesLabel: string;
      activityPagesPlaceholder: string;
      activityPagesHint: string;
      activityPagesInvalid: string;
      loadingPages: string;
      catalogFailed: string;
      bookFailed: string;
      selectAll: string;
      pagesInvalid: string;
      generateFailed: string;
      generating: string;
      createLesson: string;
      createTest: string;
      exportWord: string;
      exportingWord: string;
      lessonClass: string;
      lessonDuration: string;
      lessonUnit: string;
      lessonChapter: string;
      targetsNote: string;
      successIndicators: string;
      emphasisPoints: string;
      prerequisites: string;
      hook: string;
      activityObjective: string;
      activityPath: string;
      activityAssessment: string;
      activityTeacherRole: string;
      activityMaterials: string;
      closure: string;
      homework: string;
      bibliography: string;
      analyticalProgram: string;
      analyticalIndicators: string;
      multipleChoice: string;
      shortAnswer: string;
      problems: string;
      answer: string;
      sampleAnswer: string;
    };
  };
}

export interface BusinessDocTemplateStrings {
  title: string;
  metaLeft: { label: string; field: string; format?: "date" }[];
  footerTitle: string;
  footerLines: { label: string; field: string }[];
}
