export {
  BUSINESS_DOC_SECTIONS,
  INVOICE_FIELDS,
  QUOTATION_FIELDS,
  RECEIPT_FIELDS,
} from "./business-doc-fields";

export const INVOICE_SECTIONS = [
  { id: "header", title: "Invoice details" },
  { id: "contact", title: "Contact info" },
  { id: "items", title: "Line items" },
  { id: "payment", title: "Payment info" },
] as const;

export const QUOTATION_SECTIONS = [
  { id: "header", title: "Quotation details" },
  { id: "contact", title: "Contact info" },
  { id: "items", title: "Line items" },
  { id: "terms", title: "Terms & notes" },
] as const;

export const RECEIPT_SECTIONS = [
  { id: "header", title: "Receipt details" },
  { id: "contact", title: "Contact info" },
  { id: "items", title: "Line items" },
  { id: "payment", title: "Payment info" },
] as const;
