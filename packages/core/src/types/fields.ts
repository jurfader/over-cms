export type FieldType =
  | 'text'
  | 'textarea'
  | 'richtext'
  | 'number'
  | 'boolean'
  | 'date'
  | 'image'
  | 'file'
  | 'relation'
  | 'repeater'
  | 'select'
  | 'slug'
  | 'color'
  | 'json'

export type FieldDefinition = {
  id: string
  name: string
  label: string
  type: FieldType
  required: boolean
  unique?: boolean
  defaultValue?: unknown
  options?: string[]          // dla type: 'select'
  relationTo?: string         // dla type: 'relation' — slug content type
  fields?: FieldDefinition[]  // dla type: 'repeater'
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}
