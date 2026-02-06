// Custom registration form types

export type FieldType = 
  | 'text' 
  | 'email' 
  | 'phone' 
  | 'number' 
  | 'dropdown' 
  | 'checkbox' 
  | 'radio' 
  | 'file';

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For dropdown and radio
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
  conditional?: {
    fieldId: string;
    value: any;
  };
}

export interface RegistrationForm {
  fields: FormField[];
  consentText?: string;
  consentRequired: boolean;
}

export interface FormFieldOption {
  value: string;
  label: string;
}
