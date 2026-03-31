import { useRef, useState } from 'react'

import { saveFormSubmission } from './api'

type NoticeType = 'success' | 'error' | 'info'

type Notice = {
  type: NoticeType
  text: string
}

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

function clearInvalidState(form: HTMLFormElement) {
  form
    .querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('.field-control--invalid')
    .forEach((element) => {
      element.classList.remove('field-control--invalid')
    })
}

function getValidationTarget(
  element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
): HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  if (element.classList.contains('attach-hidden')) {
    const attachField = element.closest('.attach-field')
    const displayInput = attachField?.querySelector<HTMLInputElement>('.attach-display')
    if (displayInput) {
      return displayInput
    }
  }

  return element
}

function markInvalid(
  target: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
) {
  target.classList.add('field-control--invalid')

  const clearHighlight = () => {
    target.classList.remove('field-control--invalid')
  }

  target.addEventListener('input', clearHighlight, { once: true })
  target.addEventListener('change', clearHighlight, { once: true })
}

export function useFormActions({
  formType,
  getExtraPayload,
  resetExtraPayload,
}: UseFormActionsOptions) {
  const formRef = useRef<HTMLFormElement | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const setTimedNotice = (nextNotice: Notice) => {
    setNotice(nextNotice)
    window.setTimeout(() => setNotice(null), 2800)
  }

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
        markInvalid(target)
        target.scrollIntoView({ behavior: 'smooth', block: 'center' })
        window.setTimeout(() => target.focus(), 120)
        setTimedNotice({ type: 'error', text: 'Please fill all required fields.' })
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
      setTimedNotice({ type: 'info', text: 'No data in form.' })
      return
    }

    clearInvalidState(form)
    form.reset()
    clearAttachmentInputs(form)
    resetExtraPayload?.()
    setTimedNotice({ type: 'success', text: 'Form cleared.' })
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
      setTimedNotice({ type: 'success', text: 'Form saved successfully.' })
    } catch {
      setTimedNotice({ type: 'error', text: 'Could not save data to database.' })
    } finally {
      setIsSaving(false)
    }
  }

  return {
    formRef,
    notice,
    isSaving,
    handleClear,
    handleSave,
  }
}
