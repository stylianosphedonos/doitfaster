import { el } from "./el";
import { en } from "./en";
import type { FormComponent, FormField, FormGroup, FormTemplate } from "../types";
import type { BusinessDocKind } from "../business-doc-html";
import type { Locale, TranslationDictionary } from "./types";
import { DEFAULT_LOCALE } from "./types";

export { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES } from "./types";
export type { Locale, TranslationDictionary } from "./types";

const dictionaries: Record<Locale, TranslationDictionary> = { en, el };

export function getDictionary(locale: Locale): TranslationDictionary {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "el";
}

export function resolveLocale(value: string | undefined | null): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function translateGroup(group: FormGroup, locale: Locale): FormGroup {
  const tr = getDictionary(locale).groups[group.id];
  if (!tr) return group;
  return { ...group, title: tr.title, description: tr.description };
}

export function translateForm(form: FormComponent, locale: Locale): FormComponent {
  const dict = getDictionary(locale);
  const tr = dict.forms[form.id];
  return {
    ...form,
    title: tr?.title ?? form.title,
    description: tr?.description ?? form.description,
    fields: form.fields.map((field) => translateField(field, locale, form.template)),
  };
}

export function translateField(
  field: FormField,
  locale: Locale,
  template?: FormTemplate
): FormField {
  const dict = getDictionary(locale);
  const tr = dict.fields[field.id];
  if (!tr) return field;

  let label = tr.label ?? field.label;

  if (template === "invoice" && field.id === "client") {
    label = locale === "el" ? "Εκδόθηκε σε" : "Issued To";
  } else if (template === "quotation" && field.id === "client") {
    label = locale === "el" ? "Προσφορά σε" : "Quoted To";
  } else if (template === "receipt" && field.id === "client") {
    label = locale === "el" ? "Ελήφθη από" : "Received From";
  }

  return {
    ...field,
    label,
    placeholder: tr.placeholder ?? field.placeholder,
  };
}

export function translateSectionTitle(
  sectionId: string,
  locale: Locale,
  context: "invoice" | "quotation" | "receipt" | "certificate" | "lesson-plan"
): string {
  const key = `${context}.${sectionId}`;
  return getDictionary(locale).sections[key] ?? sectionId;
}

export function getBusinessDocSections(locale: Locale, kind: BusinessDocKind) {
  const sectionIds = {
    invoice: ["header", "contact", "items", "payment"],
    quotation: ["header", "contact", "items", "terms"],
    receipt: ["header", "contact", "items", "payment"],
  } as const;

  return sectionIds[kind].map((id) => ({
    id,
    title: translateSectionTitle(id, locale, kind),
  }));
}

export function getCertificateSections(locale: Locale) {
  return (["recipient", "body", "footer"] as const).map((id) => ({
    id,
    title: translateSectionTitle(id, locale, "certificate"),
  }));
}

export function getLessonPlanSections(locale: Locale) {
  const ids = [
    "header",
    "topic",
    "identity",
    "rationale",
    "prerequisites",
    "objectives",
    "organization",
    "approach",
    "path",
    "extensions",
    "bibliography",
    "appendix",
  ] as const;

  return ids.map((id) => ({
    id,
    title: translateSectionTitle(id, locale, "lesson-plan"),
  }));
}
