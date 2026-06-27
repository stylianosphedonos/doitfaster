export type FieldType = "text" | "textarea" | "date" | "email";

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  section?: string;
  rows?: number;
}

export type FormTemplate =
  | "default"
  | "sxedio-mathimatos"
  | "invoice"
  | "quotation"
  | "receipt"
  | "certificate";

export interface FormGroup {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface FormComponent {
  id: string;
  groupId: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  template?: FormTemplate;
  fields: FormField[];
  createdAt: string;
  updatedAt: string;
}

export type FormValues = Record<string, string>;

export interface SavedFormTemplate {
  id: string;
  userId: string;
  formId: string;
  values: FormValues;
  createdAt: string;
  updatedAt: string;
}
