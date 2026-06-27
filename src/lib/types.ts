export type FieldType = "text" | "textarea" | "date" | "email";

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
}

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
  fields: FormField[];
  createdAt: string;
  updatedAt: string;
}

export type FormValues = Record<string, string>;
