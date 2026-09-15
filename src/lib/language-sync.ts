import { getAllForms, saveAllForms } from "./db";
import { getAllGroups, saveAllGroups } from "./groups-db";
import { getDictionary, type Locale } from "./i18n";
import { getSettings, updateContentLocale, updateBrandingTexts } from "./settings-db";
import type { BrandingSettings } from "./settings-types";
import type { FormComponent, FormField, FormGroup } from "./types";

const BRANDING_TEXT: Record<
  Locale,
  Pick<BrandingSettings, "appName" | "pageTitle" | "pageSubtitle">
> = {
  en: {
    appName: "FormDocs",
    pageTitle: "Form Groups",
    pageSubtitle: "Choose a group to browse and fill in its forms.",
  },
  el: {
    appName: "FormDocs",
    pageTitle: "Ομάδες φορμών",
    pageSubtitle: "Επιλέξτε μια ομάδα για να δείτε και να συμπληρώσετε τις φόρμες της.",
  },
};

function collectStringPairs(
  a: unknown,
  b: unknown,
  pairs: Map<string, string>
): void {
  if (typeof a === "string" && typeof b === "string") {
    if (a && b && a !== b) {
      pairs.set(a, b);
    }
    return;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i += 1) {
      collectStringPairs(a[i], b[i], pairs);
    }
    return;
  }

  if (
    a &&
    b &&
    typeof a === "object" &&
    typeof b === "object" &&
    !Array.isArray(a) &&
    !Array.isArray(b)
  ) {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    for (const key of Object.keys(aObj)) {
      if (key in bObj) {
        collectStringPairs(aObj[key], bObj[key], pairs);
      }
    }
  }
}

function buildLexicon(from: Locale, to: Locale): Map<string, string> {
  const pairs = new Map<string, string>();
  collectStringPairs(getDictionary(from), getDictionary(to), pairs);

  const fromBranding = BRANDING_TEXT[from];
  const toBranding = BRANDING_TEXT[to];
  pairs.set(fromBranding.pageTitle, toBranding.pageTitle);
  pairs.set(fromBranding.pageSubtitle, toBranding.pageSubtitle);

  return pairs;
}

function translateText(value: string | undefined, lexicon: Map<string, string>): string | undefined {
  if (value === undefined) return undefined;
  return lexicon.get(value) ?? value;
}

function translateField(field: FormField, to: Locale, lexicon: Map<string, string>): FormField {
  const dictField = getDictionary(to).fields[field.id];
  return {
    ...field,
    label: dictField?.label ?? translateText(field.label, lexicon) ?? field.label,
    placeholder:
      dictField?.placeholder ??
      translateText(field.placeholder, lexicon) ??
      field.placeholder,
  };
}

function translateFormComponent(
  form: FormComponent,
  to: Locale,
  lexicon: Map<string, string>
): FormComponent {
  const dictForm = getDictionary(to).forms[form.id];
  return {
    ...form,
    title: dictForm?.title ?? translateText(form.title, lexicon) ?? form.title,
    description:
      dictForm?.description ??
      translateText(form.description, lexicon) ??
      form.description,
    fields: form.fields.map((field) => translateField(field, to, lexicon)),
    updatedAt: new Date().toISOString(),
  };
}

function translateGroup(
  group: FormGroup,
  to: Locale,
  lexicon: Map<string, string>
): FormGroup {
  const dictGroup = getDictionary(to).groups[group.id];
  return {
    ...group,
    title: dictGroup?.title ?? translateText(group.title, lexicon) ?? group.title,
    description:
      dictGroup?.description ??
      translateText(group.description, lexicon) ??
      group.description,
    updatedAt: new Date().toISOString(),
  };
}

export function oppositeLocale(locale: Locale): Locale {
  return locale === "en" ? "el" : "en";
}

const GREEK_PATTERN = /[Α-Ωα-ωΆΈΉΊΌΎΏάέήίόύώ]/;

function hasGreek(value: string | undefined): boolean {
  return !!value && GREEK_PATTERN.test(value);
}

function detectContentLocale(forms: FormComponent[], groups: FormGroup[]): Locale {
  for (const group of groups) {
    if (hasGreek(group.title) || hasGreek(group.description)) return "el";
  }
  for (const form of forms) {
    if (hasGreek(form.title) || hasGreek(form.description)) return "el";
    for (const field of form.fields) {
      if (hasGreek(field.label) || hasGreek(field.placeholder)) return "el";
    }
  }
  return "en";
}

export async function syncLanguageContent(preferredFromLocale?: Locale): Promise<{
  targetLocale: Locale;
  fromLocale: Locale;
  formsUpdated: number;
  groupsUpdated: number;
}> {
  const [forms, groups, settings] = await Promise.all([
    getAllForms(),
    getAllGroups(),
    getSettings(),
  ]);

  const fromLocale =
    settings.contentLocale ??
    detectContentLocale(forms, groups) ??
    preferredFromLocale ??
    "en";
  const targetLocale = oppositeLocale(fromLocale);
  const lexicon = buildLexicon(fromLocale, targetLocale);

  const nextForms = forms.map((form) =>
    translateFormComponent(form, targetLocale, lexicon)
  );
  const nextGroups = groups.map((group) =>
    translateGroup(group, targetLocale, lexicon)
  );

  const branding = settings.branding;
  const nextBrandingTexts = {
    appName: translateText(branding.appName, lexicon) ?? branding.appName,
    pageTitle: translateText(branding.pageTitle, lexicon) ?? branding.pageTitle,
    pageSubtitle:
      translateText(branding.pageSubtitle, lexicon) ?? branding.pageSubtitle,
  };

  // If branding still matches the source defaults, force target defaults.
  const sourceBranding = BRANDING_TEXT[fromLocale];
  if (
    branding.pageTitle === sourceBranding.pageTitle ||
    branding.pageSubtitle === sourceBranding.pageSubtitle
  ) {
    nextBrandingTexts.pageTitle = BRANDING_TEXT[targetLocale].pageTitle;
    nextBrandingTexts.pageSubtitle = BRANDING_TEXT[targetLocale].pageSubtitle;
  }

  await Promise.all([
    saveAllForms(nextForms),
    saveAllGroups(nextGroups),
    updateBrandingTexts(nextBrandingTexts),
    updateContentLocale(targetLocale),
  ]);

  return {
    targetLocale,
    fromLocale,
    formsUpdated: nextForms.length,
    groupsUpdated: nextGroups.length,
  };
}
