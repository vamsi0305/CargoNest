import { useEffect, useRef, useState } from 'react'

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

export type Notice = {
  type: 'success' | 'error' | 'info'
  text: string
  title?: string
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

type EditableChoiceFieldProps = {
  label: string
  name?: string
  placeholder?: string
  options?: string[]
  className?: string
  required?: boolean
  defaultValue?: string
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
}

export function EditableChoiceField({
  label,
  name,
  placeholder,
  options = [],
  className,
  required = true,
  defaultValue,
  value,
  onChange,
  disabled = false,
}: EditableChoiceFieldProps) {
  const resolvedName = name ?? toFieldName(label)
  const requiredFlag = required ? 'true' : undefined
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const isControlled = value !== undefined
  const [isOpen, setIsOpen] = useState(false)
  const [draftValue, setDraftValue] = useState(defaultValue ?? '')

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

  const currentValue = isControlled ? value ?? '' : draftValue
  const normalizedFilter = currentValue.trim().toLowerCase()
  const filteredOptions = normalizedFilter
    ? options.filter((option) => option.toLowerCase().includes(normalizedFilter))
    : options

  const syncUncontrolledValue = (nextValue: string) => {
    setDraftValue(nextValue)
    if (inputRef.current) {
      inputRef.current.value = nextValue
      inputRef.current.dispatchEvent(new Event('input', { bubbles: true }))
      inputRef.current.dispatchEvent(new Event('change', { bubbles: true }))
    }
  }

  const handleInputValue = (nextValue: string) => {
    setIsOpen(true)
    if (isControlled) {
      onChange?.(nextValue)
      return
    }

    setDraftValue(nextValue)
  }

  const handleSelectOption = (option: string) => {
    if (isControlled) {
      onChange?.(option)
    } else {
      syncUncontrolledValue(option)
    }

    setIsOpen(false)
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleToggle = () => {
    if (disabled) {
      return
    }

    if (!isControlled) {
      setDraftValue(inputRef.current?.value ?? '')
    }

    setIsOpen((open) => !open)
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }

  return (
    <div className={`field-group ${className ?? ''}`}>
      <label>{label}</label>
      <div ref={wrapperRef} className="editable-choice">
        <div className={`editable-choice__control ${isOpen ? 'editable-choice__control--open' : ''}`}>
          <input
            ref={inputRef}
            name={resolvedName}
            placeholder={placeholder}
            data-required={requiredFlag}
            autoComplete="off"
            disabled={disabled}
            onFocus={() => {
              if (!isControlled) {
                setDraftValue(inputRef.current?.value ?? '')
              }
            }}
            {...(isControlled
              ? {
                  value: value ?? '',
                  onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
                    handleInputValue(event.target.value),
                }
              : {
                  defaultValue: defaultValue ?? '',
                  onInput: (event: React.FormEvent<HTMLInputElement>) =>
                    handleInputValue(event.currentTarget.value),
                })}
          />
          <button
            type="button"
            className="editable-choice__toggle"
            onClick={handleToggle}
            tabIndex={-1}
            aria-label="Toggle options"
          >
            <span className="editable-choice__toggle-icon" aria-hidden="true" />
          </button>
        </div>

        {isOpen ? (
          <div className="editable-choice__menu">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className="editable-choice__option"
                  onClick={() => handleSelectOption(option)}
                >
                  {option}
                </button>
              ))
            ) : (
              <div className="editable-choice__empty">No matching options. You can type your own value.</div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
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

  if (as === 'select') {
    return (
      <EditableChoiceField
        label={label}
        name={resolvedName}
        placeholder={placeholder}
        options={options}
        className={className}
        required={required}
        defaultValue={defaultValue}
      />
    )
  }

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
  const updateCell = (rowIndex: number, key: string, value: string) => {
    const nextRows = rows.map((row, index) =>
      index === rowIndex ? { ...row, [key]: value } : row,
    )
    onRowsChange(nextRows)
  }

  return (
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
  )
}

type NoticeBannerProps = {
  notice: Notice | null
  onDismiss: () => void
}

export function NoticeBanner({ notice, onDismiss }: NoticeBannerProps) {
  if (!notice) {
    return null
  }

  const titleByType = {
    success: 'Success',
    error: 'Validation',
    info: 'Notice',
  } as const

  return (
    <div className="dialog-backdrop" role="presentation">
      <div className={`dialog-card dialog-card--${notice.type}`} role="alertdialog" aria-modal="true">
        <h3>{notice.title ?? titleByType[notice.type]}</h3>
        <p>{notice.text}</p>
        <div className="dialog-actions">
          <button type="button" className="btn btn--blue" onClick={onDismiss}>
            OK
          </button>
        </div>
      </div>
    </div>
  )
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
