import type { FormField } from "./types";

export const CERTIFICATE_SECTIONS = [
  { id: "recipient", title: "Recipient" },
  { id: "body", title: "Certificate text" },
  { id: "footer", title: "Date & signature" },
] as const;

export const CERTIFICATE_FIELDS: FormField[] = [
  {
    id: "recipient",
    label: "Recipient Name",
    type: "text",
    section: "recipient",
    placeholder: "Enter name here",
    required: true,
  },
  {
    id: "body",
    label: "Body Text",
    type: "textarea",
    section: "body",
    placeholder:
      "You can write your text here. Click here to edit this paragraph. You can write your text here.",
    rows: 4,
    required: true,
  },
  {
    id: "date",
    label: "Date",
    type: "date",
    section: "footer",
    required: true,
  },
  {
    id: "instructor",
    label: "Signature",
    type: "text",
    section: "footer",
    placeholder: "Instructor or signatory name",
  },
];
