import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

import { fetchCargoPrefill } from './api'

type TablePrefillConfig = {
  key: string
  makeRow: () => Record<string, string>
  setRows: (rows: Record<string, string>[]) => void
}

type UseCargoPrefillOptions = {
  formType: string
  formRef: RefObject<HTMLFormElement | null>
  tableConfig?: TablePrefillConfig
}

function getFileNameFromUrl(value: string) {
  const segment = value.split('/').pop() ?? value
  const trimmed = segment.includes('_') ? segment.split('_').slice(1).join('_') : segment
  return decodeURIComponent(trimmed)
}

function setControlValue(form: HTMLFormElement, name: string, value: unknown) {
  const element = form.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    `[name="${name}"]`,
  )

  if (!element) {
    return
  }

  const nextValue = String(value ?? '')
  element.value = nextValue

  if (element.classList.contains('attach-hidden')) {
    const attachField = element.closest('.attach-field')
    const displayInput = attachField?.querySelector<HTMLInputElement>('.attach-display')
    if (displayInput) {
      displayInput.value = nextValue ? getFileNameFromUrl(nextValue) : ''
    }
  }
}

function normalizeRows(rows: unknown, makeRow: () => Record<string, string>) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [makeRow()]
  }

  return rows.map((row) => {
    if (!row || typeof row !== 'object') {
      return makeRow()
    }

    const record = row as Record<string, unknown>
    return Object.entries(record).reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = String(value ?? '')
      return acc
    }, {})
  })
}

export function useCargoPrefill({ formType, formRef, tableConfig }: UseCargoPrefillOptions) {
  const lastLoadedCargoRef = useRef('')

  useEffect(() => {
    const form = formRef.current
    if (!form) {
      return
    }

    const cargoInput = form.querySelector<HTMLInputElement>('[name="cargo_no"]')
    if (!cargoInput) {
      return
    }

    let timerId = 0

    const loadPrefill = async () => {
      const cargoNo = cargoInput.value.trim()
      if (!cargoNo) {
        lastLoadedCargoRef.current = ''
        return
      }

      if (cargoNo === lastLoadedCargoRef.current) {
        return
      }

      try {
        const payload = await fetchCargoPrefill(formType, cargoNo)
        if (cargoInput.value.trim() !== cargoNo) {
          return
        }

        Object.entries(payload.fields).forEach(([name, value]) => {
          setControlValue(form, name, value)
        })

        if (tableConfig) {
          const rows = payload.extra[tableConfig.key]
          if (rows) {
            tableConfig.setRows(normalizeRows(rows, tableConfig.makeRow))
          }
        }

        lastLoadedCargoRef.current = cargoNo
      } catch {
        // Ignore prefill errors so manual entry remains available.
      }
    }

    const queueLoad = () => {
      if (!cargoInput.value.trim()) {
        lastLoadedCargoRef.current = ''
      }

      window.clearTimeout(timerId)
      timerId = window.setTimeout(() => {
        void loadPrefill()
      }, 350)
    }

    cargoInput.addEventListener('input', queueLoad)
    cargoInput.addEventListener('change', queueLoad)

    return () => {
      window.clearTimeout(timerId)
      cargoInput.removeEventListener('input', queueLoad)
      cargoInput.removeEventListener('change', queueLoad)
    }
  }, [formType, formRef, tableConfig])
}

