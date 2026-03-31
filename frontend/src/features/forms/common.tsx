import { useRef, useState } from 'react'

import { uploadAttachment } from './api'

type FormPageHeaderProps = {
  title: string
  centered?: boolean
}

function toFieldName(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function FormPageHeader({ title, centered = false }: FormPageHeaderProps) {
  return (
    <header className={`form-page-header ${centered ? 'form-page-header--centered' : ''}`}>
      <h1>{title}</h1>
    </header>
  )
}

type FormSheetProps = {
  children: React.ReactNode
}

export function FormSheet({ children }: FormSheetProps) {
  return <section className="form-sheet">{children}</section>
}

type FieldProps = {
  label: string
  name?: string
  placeholder?: string
  as?: 'input' | 'textarea' | 'select'
  options?: string[]
  className?: string
  required?: boolean
  defaultValue?: string
}

export function Field({
  label,
  name,
  placeholder,
  as = 'input',
  options = [],
  className,
  required = true,
  defaultValue,
}: FieldProps) {
  const resolvedName = name ?? toFieldName(label)
  const requiredFlag = required ? 'true' : undefined

  return (
    <div className={`field-group ${className ?? ''}`}>
      <label>{label}</label>
      {as === 'textarea' ? (
        <textarea
          name={resolvedName}
          placeholder={placeholder}
          rows={4}
          defaultValue={defaultValue}
          data-required={requiredFlag}
        />
      ) : as === 'select' ? (
        <select name={resolvedName} defaultValue={defaultValue ?? ''} data-required={requiredFlag}>
          <option value="">{placeholder ?? 'Select'}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          name={resolvedName}
          placeholder={placeholder}
          defaultValue={defaultValue}
          data-required={requiredFlag}
        />
      )}
    </div>
  )
}

type AttachFieldProps = {
  label: string
  placeholder: string
  name?: string
  required?: boolean
}

export function AttachField({ label, placeholder, name, required = true }: AttachFieldProps) {
  const resolvedName = name ?? toFieldName(label)
  const pickerRef = useRef<HTMLInputElement | null>(null)
  const displayRef = useRef<HTMLInputElement | null>(null)
  const valueRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)

  const onPick = () => {
    pickerRef.current?.click()
  }

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setUploading(true)
    try {
      const uploaded = await uploadAttachment(file)
      if (displayRef.current) {
        displayRef.current.value = uploaded.file_name
      }
      if (valueRef.current) {
        valueRef.current.value = uploaded.file_url
      }
    } catch {
      if (displayRef.current) {
        displayRef.current.value = ''
      }
      if (valueRef.current) {
        valueRef.current.value = ''
      }
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  return (
    <div className="attach-field">
      <div className="field-group">
        <label>{label}</label>
        <input ref={displayRef} className="attach-display" placeholder={placeholder} readOnly />
        <input
          ref={valueRef}
          type="hidden"
          className="attach-hidden"
          name={resolvedName}
          defaultValue=""
          data-required={required ? 'true' : undefined}
        />
        <input
          ref={pickerRef}
          type="file"
          className="hidden-file-input"
          onChange={onFileChange}
        />
      </div>
      <button type="button" className="btn btn--attach" onClick={onPick}>
        {uploading ? 'UPLOADING...' : 'ATTACH'}
      </button>
    </div>
  )
}

type EditableColumn = {
  key: string
  label: string
  editable?: boolean
}

type EditableTableProps = {
  tableName: string
  columns: EditableColumn[]
  rows: Record<string, string>[]
  onRowsChange: (rows: Record<string, string>[]) => void
}

export function EditableTable({ tableName, columns, rows, onRowsChange }: EditableTableProps) {
  const makeRow = () =>
    columns.reduce<Record<string, string>>((acc, column) => {
      acc[column.key] = ''
      return acc
    }, {})

  const updateCell = (rowIndex: number, key: string, value: string) => {
    const nextRows = rows.map((row, index) =>
      index === rowIndex ? { ...row, [key]: value } : row,
    )
    onRowsChange(nextRows)
  }

  const addRow = () => onRowsChange([...rows, makeRow()])
  const removeRow = () => {
    if (rows.length <= 1) return
    onRowsChange(rows.slice(0, -1))
  }

  return (
    <>
      <div className="table-wrap">
        <table className="plain-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`${tableName}-${rowIndex}`}>
                {columns.map((column) => {
                  const editable = column.editable !== false
                  return (
                    <td key={`${tableName}-${rowIndex}-${column.key}`}>
                      {editable ? (
                        <input
                          name={`${tableName}_${rowIndex}_${column.key}`}
                          value={row[column.key] ?? ''}
                          onChange={(event) => updateCell(rowIndex, column.key, event.target.value)}
                          data-required="true"
                          className="table-input"
                        />
                      ) : (
                        <input
                          value={row[column.key] ?? ''}
                          readOnly
                          tabIndex={-1}
                          className="table-input table-input--readonly"
                        />
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="inline-actions">
        <button type="button" className="btn btn--blue" onClick={addRow}>
          ADD ROW
        </button>
        <button type="button" className="btn btn--attach" onClick={removeRow}>
          REMOVE ROW
        </button>
      </div>
    </>
  )
}

type Notice = {
  type: 'success' | 'error' | 'info'
  text: string
}

type NoticeBannerProps = {
  notice: Notice | null
}

export function NoticeBanner({ notice }: NoticeBannerProps) {
  if (!notice) {
    return null
  }

  return <p className={`form-message form-message--${notice.type}`}>{notice.text}</p>
}

type ActionButtonsProps = {
  saveLabel: string
  showEdit?: boolean
  onSave: () => void
  onClear: () => void
  isSaving?: boolean
}

export function ActionButtons({
  saveLabel,
  showEdit = false,
  onSave,
  onClear,
  isSaving = false,
}: ActionButtonsProps) {
  return (
    <div className="form-actions">
      {showEdit && (
        <button type="button" className="btn btn--blue">
          EDIT
        </button>
      )}
      <button type="button" className="btn btn--attach" onClick={onClear}>
        CLEAR FORM
      </button>
      <button type="button" className="btn btn--red">
        CANCEL
      </button>
      <button type="button" className="btn btn--blue" onClick={onSave} disabled={isSaving}>
        {isSaving ? 'SAVING...' : saveLabel}
      </button>
    </div>
  )
}
