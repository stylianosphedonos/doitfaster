import type { FormField } from "./types";
import type { BusinessDocKind } from "./business-doc-html";

const LINE_ITEMS_PLACEHOLDER =
  "One item per line: Description | Qty | Price\nPhotography service | 1 | 500\nVideography service | 1 | 1000\nVideo editing | 2 | 250\nTransportation fee | 1 | 100";

const CONTACT_FIELDS: FormField[] = [
  {
    id: "email",
    label: "Email",
    type: "email",
    section: "contact",
    placeholder: "hello@reallygreatsite.com",
  },
  {
    id: "phone",
    label: "Phone",
    type: "text",
    section: "contact",
    placeholder: "+123-456-7890",
  },
  {
    id: "socialHandle",
    label: "Social Handle",
    type: "text",
    section: "contact",
    placeholder: "@reallygreatsite",
  },
];

const ITEM_FIELDS: FormField[] = [
  {
    id: "items",
    label: "Line Items",
    type: "textarea",
    section: "items",
    placeholder: LINE_ITEMS_PLACEHOLDER,
    rows: 6,
  },
  {
    id: "taxRate",
    label: "Tax Rate (%)",
    type: "text",
    section: "items",
    placeholder: "10",
  },
];

export const BUSINESS_DOC_SECTIONS: Record<
  BusinessDocKind,
  { id: string; title: string }[]
> = {
  invoice: [
    { id: "header", title: "Invoice details" },
    { id: "contact", title: "Contact info" },
    { id: "items", title: "Line items" },
    { id: "payment", title: "Payment info" },
  ],
  quotation: [
    { id: "header", title: "Quotation details" },
    { id: "contact", title: "Contact info" },
    { id: "items", title: "Line items" },
    { id: "terms", title: "Terms & notes" },
  ],
  receipt: [
    { id: "header", title: "Receipt details" },
    { id: "contact", title: "Contact info" },
    { id: "items", title: "Line items" },
    { id: "payment", title: "Payment info" },
  ],
};

export const INVOICE_FIELDS: FormField[] = [
  {
    id: "invoiceNumber",
    label: "Invoice Number",
    type: "text",
    section: "header",
    placeholder: "e.g. 01234",
    required: true,
  },
  {
    id: "date",
    label: "Date Issued",
    type: "date",
    section: "header",
    required: true,
  },
  {
    id: "client",
    label: "Issued To",
    type: "text",
    section: "header",
    placeholder: "Client name",
    required: true,
  },
  ...CONTACT_FIELDS,
  ...ITEM_FIELDS,
  {
    id: "bankName",
    label: "Bank Name",
    type: "text",
    section: "payment",
    placeholder: "Rimberio",
  },
  {
    id: "accountNo",
    label: "Account No",
    type: "text",
    section: "payment",
    placeholder: "0123 4567 8901",
  },
  {
    id: "accountName",
    label: "Account Name",
    type: "text",
    section: "payment",
    placeholder: "Hannah Morales",
  },
];

export const QUOTATION_FIELDS: FormField[] = [
  {
    id: "quotationNumber",
    label: "Quotation Number",
    type: "text",
    section: "header",
    placeholder: "e.g. Q-01234",
    required: true,
  },
  {
    id: "date",
    label: "Date Issued",
    type: "date",
    section: "header",
    required: true,
  },
  {
    id: "validUntil",
    label: "Valid Until",
    type: "date",
    section: "header",
    required: true,
  },
  {
    id: "client",
    label: "Quoted To",
    type: "text",
    section: "header",
    placeholder: "Client name",
    required: true,
  },
  ...CONTACT_FIELDS,
  ...ITEM_FIELDS,
  {
    id: "terms",
    label: "Terms & Notes",
    type: "textarea",
    section: "terms",
    placeholder: "Quote valid for 30 days. Prices exclude additional revisions.",
    rows: 4,
  },
];

export const RECEIPT_FIELDS: FormField[] = [
  {
    id: "receiptNumber",
    label: "Receipt Number",
    type: "text",
    section: "header",
    placeholder: "e.g. R-01234",
    required: true,
  },
  {
    id: "date",
    label: "Date Issued",
    type: "date",
    section: "header",
    required: true,
  },
  {
    id: "client",
    label: "Received From",
    type: "text",
    section: "header",
    placeholder: "Client name",
    required: true,
  },
  ...CONTACT_FIELDS,
  ...ITEM_FIELDS,
  {
    id: "paymentMethod",
    label: "Payment Method",
    type: "text",
    section: "payment",
    placeholder: "Bank transfer",
  },
  {
    id: "paymentReference",
    label: "Reference No",
    type: "text",
    section: "payment",
    placeholder: "TXN-987654",
  },
  {
    id: "amountPaid",
    label: "Amount Paid",
    type: "text",
    section: "payment",
    placeholder: "Leave blank to use grand total",
  },
];

export const BUSINESS_DOC_FIELDS: Record<BusinessDocKind, FormField[]> = {
  invoice: INVOICE_FIELDS,
  quotation: QUOTATION_FIELDS,
  receipt: RECEIPT_FIELDS,
};
