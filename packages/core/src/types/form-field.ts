// ─── Form field types ──────────────────────────────────────────────────────────

export type FormFieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'number'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'heading'
  | 'paragraph'
  | 'divider'

export interface FormFieldDef {
  id:           string
  type:         FormFieldType
  label:        string
  name:         string
  placeholder?: string
  required?:    boolean
  options?:     string[]               // dla type: 'select' | 'radio'
  width?:       'full' | 'half' | 'third'
  validation?: {
    minLength?: number
    maxLength?: number
    min?:       number
    max?:       number
    pattern?:   string
  }
}

export interface FormSettings {
  submitLabel?:    string
  successMessage?: string
  redirectUrl?:    string
  notifyEmails?:   string[]
}

export interface FormDefinition {
  id:        string
  name:      string
  slug:      string
  fields:    FormFieldDef[]
  settings:  FormSettings
  createdAt: string
  updatedAt: string
}
