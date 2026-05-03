export type ValidatableControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

export function clearInvalidState(scope: ParentNode) {
  scope
    .querySelectorAll<ValidatableControl>('.field-control--invalid')
    .forEach((element) => {
      element.classList.remove('field-control--invalid')
    })
}

export function getValidationTarget(element: ValidatableControl): ValidatableControl {
  if (element.classList.contains('attach-hidden')) {
    const attachField = element.closest('.attach-field')
    const displayInput = attachField?.querySelector<HTMLInputElement>('.attach-display')
    if (displayInput) {
      return displayInput
    }
  }

  return element
}

export function markInvalid(target: ValidatableControl) {
  target.classList.add('field-control--invalid')

  const clearHighlight = () => {
    target.classList.remove('field-control--invalid')
  }

  target.addEventListener('input', clearHighlight, { once: true })
  target.addEventListener('change', clearHighlight, { once: true })
}

export function focusInvalidField(target: ValidatableControl) {
  markInvalid(target)
  target.scrollIntoView({ behavior: 'smooth', block: 'center' })
  window.setTimeout(() => target.focus(), 120)
}
