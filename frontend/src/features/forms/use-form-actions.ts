import { useRef, useState } from 'react'

import { saveFormSubmission } from './api'
import type { Notice } from './common'
import { clearInvalidState, focusInvalidField, getValidationTarget } from './validation'

type UseFormActionsOptions = {
  formType: string
  getExtraPayload?: () => Record<string, unknown>
  resetExtraPayload?: () => void
}

function isValueEmpty(value: unknown): boolean {
  if (value == null) {
    return true
  }

  if (typeof value === 'string') {
    return value.trim().length === 0
  }

  if (Array.isArray(value)) {
    return value.length === 0 || value.every((item) => isValueEmpty(item))
  }

  if (typeof value === 'object') {
    const entries = Object.values(value as Record<string, unknown>)
    return entries.length === 0 || entries.every((entry) => isValueEmpty(entry))
  }

  return false
}

export function useFormActions({
  formType,
  getExtraPayload,
  resetExtraPayload,
}: UseFormActionsOptions) {
  const formRef = useRef<HTMLFormElement | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const collectFields = () => {
    const form = formRef.current
    if (!form) {
      return {}
    }

    const data = new FormData(form)
    const fields: Record<string, unknown> = {}

    data.forEach((value, key) => {
      if (fields[key] != null) {
        const prev = fields[key]
        if (Array.isArray(prev)) {
          prev.push(String(value))
          fields[key] = prev
        } else {
          fields[key] = [prev, String(value)]
        }
      } else {
        fields[key] = String(value)
      }
    })

    return fields
  }

  const hasAnyFormData = () => {
    const fields = collectFields()
    const extra = getExtraPayload?.() ?? {}

    return !isValueEmpty(fields) || !isValueEmpty(extra)
  }

  const validateRequiredFields = () => {
    const form = formRef.current
    if (!form) {
      return false
    }

    clearInvalidState(form)

    const requiredElements = form.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >('[data-required="true"]')

    for (const element of requiredElements) {
      if (element.disabled) {
        continue
      }

      if (element.value.trim().length === 0) {
        const target = getValidationTarget(element)
        focusInvalidField(target)
        setNotice({ type: 'error', title: 'Required Field', text: 'Please fill all required fields.' })
        return false
      }
    }

    return true
  }

  const clearAttachmentInputs = (form: HTMLFormElement) => {
    const displayInputs = form.querySelectorAll<HTMLInputElement>('.attach-display')
    displayInputs.forEach((input) => {
      input.value = ''
    })

    const hiddenInputs = form.querySelectorAll<HTMLInputElement>('.attach-hidden')
    hiddenInputs.forEach((input) => {
      input.value = ''
    })

    const fileInputs = form.querySelectorAll<HTMLInputElement>('.hidden-file-input')
    fileInputs.forEach((input) => {
      input.value = ''
    })
  }

  const handleClear = () => {
    const form = formRef.current
    if (!form) {
      return
    }

    if (!hasAnyFormData()) {
      setNotice({ type: 'info', title: 'No Data', text: 'No data in form.' })
      return
    }

    clearInvalidState(form)
    form.reset()
    clearAttachmentInputs(form)
    resetExtraPayload?.()
    setNotice({ type: 'success', title: 'Form Cleared', text: 'Form cleared.' })
  }

  const handleSave = async () => {
    const form = formRef.current
    if (!form) {
      return
    }

    if (!validateRequiredFields()) {
      return
    }

    const fields = collectFields()
    const extra = getExtraPayload?.() ?? {}

    setIsSaving(true)
    try {
      await saveFormSubmission(formType, { fields, extra })
      setNotice({ type: 'success', title: 'Saved', text: 'Form saved successfully.' })
    } catch (error) {
      setNotice({
        type: 'error',
        title: 'Save Failed',
        text: error instanceof Error ? error.message : 'Could not save data to database.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return {
    formRef,
    notice,
    isSaving,
    dismissNotice: () => setNotice(null),
    handleClear,
    handleSave,
  }
}
