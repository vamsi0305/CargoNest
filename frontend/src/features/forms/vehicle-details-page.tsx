import { useEffect, useRef, useState } from 'react'

import { ActionButtons, AttachField, Field, FormPageHeader, FormSheet, NoticeBanner } from './common'
import { useCargoPrefill } from './use-cargo-prefill'
import { useFormActions } from './use-form-actions'

function getCurrentTimeValue() {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function VehicleDetailsPage() {
  const { formRef, notice, isSaving, dismissNotice, handleClear, handleSave } = useFormActions({
    formType: 'vehicle_details',
  })
  const outTimeRef = useRef<HTMLInputElement | null>(null)
  const inTimeRef = useRef<HTMLInputElement | null>(null)
  const [outTimeValue, setOutTimeValue] = useState('')
  const [inTimeValue, setInTimeValue] = useState('')

  useCargoPrefill({
    formType: 'vehicle_details',
    formRef,
  })

  useEffect(() => {
    const outInput = outTimeRef.current
    const inInput = inTimeRef.current

    if (!outInput || !inInput) {
      return
    }

    const syncValues = () => {
      setOutTimeValue(outInput.value.trim())
      setInTimeValue(inInput.value.trim())
    }

    syncValues()
    outInput.addEventListener('input', syncValues)
    outInput.addEventListener('change', syncValues)
    inInput.addEventListener('input', syncValues)
    inInput.addEventListener('change', syncValues)

    return () => {
      outInput.removeEventListener('input', syncValues)
      outInput.removeEventListener('change', syncValues)
      inInput.removeEventListener('input', syncValues)
      inInput.removeEventListener('change', syncValues)
    }
  }, [])

  const canSetOutTime = outTimeValue.length === 0
  const canSetInTime = outTimeValue.length > 0 && inTimeValue.length === 0

  const stampTime = (target: 'out' | 'in') => {
    const nextValue = getCurrentTimeValue()
    const input = target === 'out' ? outTimeRef.current : inTimeRef.current
    if (!input) {
      return
    }

    input.value = nextValue
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
  }

  return (
    <main className="page-canvas">
      <FormPageHeader title="Vehicle Details" />

      <FormSheet>
        <form
          ref={formRef}
          className="module-form"
          onSubmit={(event) => {
            event.preventDefault()
            void handleSave()
          }}
        >
          <NoticeBanner notice={notice} onDismiss={dismissNotice} />

          <div className="section-block compact-top">
            <h2>Vehicle Entry Details</h2>
            <div className="form-grid form-grid--3">
              <Field label="CARGO NO" name="cargo_no" placeholder="Enter cargo number" />
              <Field label="PO NO" name="po_no" placeholder="Enter po number" />
              <Field label="INVOICE NO" name="invoice_no" placeholder="Enter invoice number" />
              <Field label="REFERENCE ID" name="reference_id" placeholder="Reference id" />
              <Field
                label="EMPTY / LOAD"
                name="empty_or_load"
                as="select"
                placeholder="Enter status"
                options={['Empty', 'Load']}
              />
              <Field
                label="MOVEMENT TYPE"
                name="movement_type"
                as="select"
                placeholder="Enter movement type"
                options={['Inbound', 'Outbound']}
              />
              <Field label="CONTAINER NO" name="container_no" placeholder="Enter container number" />
              <Field label="TRANSPORTER" name="transporter" placeholder="Enter transporter name" />
              <Field label="DRIVER CONTACT NUMBER" name="driver_contact_number" placeholder="Enter driver number" />
              <Field label="VEHICLE NO" name="vehicle_no" placeholder="Enter vehicle registration" />
              <AttachField label="GRI NO" name="gri_attachment" placeholder="Attach GRI file" />
              <Field label="FROM" name="from_location" placeholder="Origin City" />
              <Field label="GRI DATE" name="gri_date" placeholder="Enter GRI date" />
              <Field label="TO" name="to_location" placeholder="Destination City" />
              <Field label="QTY IN KG" name="qty_in_kg" placeholder="Enter weight in kg" />
              <AttachField label="GATEPASS" name="gatepass_attachment" placeholder="Attach gatepass" />
              <AttachField label="STUFFING SHEET" name="stuffing_sheet_attachment" placeholder="Attach stuffing sheet" />
            </div>
          </div>

          <div className="section-block compact-top">
            <h2>Vehicle Temperature &amp; Timing</h2>
            <div className="form-grid form-grid--2">
              <Field label="VEHICLE OUT TEMPERATURE" name="vehicle_out_temperature" placeholder="Enter out temperature" />
              <Field label="VEHICLE IN TEMPERATURE" name="vehicle_in_temperature" placeholder="Enter in temperature" />
              <div className="field-group field-group--time-action">
                <label>OUT TIME</label>
                <div className="field-action-row">
                  <input
                    ref={outTimeRef}
                    name="out_time"
                    placeholder="Enter out time"
                    data-required="true"
                    readOnly={!canSetOutTime}
                    className={!canSetOutTime ? 'field-control--locked' : ''}
                  />
                  <button
                    type="button"
                    className="btn btn--blue btn--time"
                    onClick={() => stampTime('out')}
                    disabled={!canSetOutTime}
                  >
                    SET NOW
                  </button>
                </div>
              </div>
              <div className="field-group field-group--time-action">
                <label>IN TIME</label>
                <div className="field-action-row">
                  <input
                    ref={inTimeRef}
                    name="in_time"
                    placeholder="Enter in time"
                    readOnly={!canSetInTime}
                    className={!canSetInTime ? 'field-control--locked' : ''}
                  />
                  <button
                    type="button"
                    className="btn btn--blue btn--time"
                    onClick={() => stampTime('in')}
                    disabled={!canSetInTime}
                  >
                    SET NOW
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="section-block compact-top">
            <h2>Other Info</h2>
            <div className="form-grid form-grid--1">
              <Field
                label="OTHER INFO / REMARKS"
                name="other_info"
                as="textarea"
                placeholder="Enter any additional notes or specific remarks regarding this vehicle type..."
              />
            </div>
          </div>

          <ActionButtons
            saveLabel="SAVE VEHICLE DETAILS"
            onSave={() => void handleSave()}
            onClear={handleClear}
            isSaving={isSaving}
          />
        </form>
      </FormSheet>
    </main>
  )
}
