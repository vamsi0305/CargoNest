import { ActionButtons, Field, FormPageHeader, FormSheet, NoticeBanner } from './common'
import { useCargoPrefill } from './use-cargo-prefill'
import { useFormActions } from './use-form-actions'

export function StockInspectionPage() {
  const { formRef, notice, isSaving, handleClear, handleSave } = useFormActions({
    formType: 'stock_inspection',
  })

  useCargoPrefill({
    formType: 'stock_inspection',
    formRef,
  })

  return (
    <main className="page-canvas">
      <FormPageHeader title="STOCK READINESS (PLANT)" centered />

      <FormSheet>
        <form
          ref={formRef}
          className="module-form"
          onSubmit={(event) => {
            event.preventDefault()
            void handleSave()
          }}
        >
          <NoticeBanner notice={notice} />

          <div className="section-block section-block--centered">
            <h2>Inspection</h2>
            <div className="highlight-panel">
              <div className="form-grid form-grid--3">
                <Field label="CARGO NO" name="cargo_no" placeholder="Enter cargo number" />
                <Field label="PO NO" name="po_no" placeholder="Enter po number" />
                <Field label="INVOICE NO" name="invoice_no" placeholder="Enter invoice number" />
                <Field
                  label="PLANT"
                  name="plant"
                  as="select"
                  placeholder="Select plant"
                  options={['Plant 1', 'Plant 2']}
                />
                <Field
                  label="BUYER NAME"
                  name="buyer_name"
                  as="select"
                  placeholder="Select buyer"
                  options={['BlueWave Imports', 'Nordic Ocean Foods', 'Pacific Table Co.']}
                />
                <Field
                  label="INSPECTION"
                  name="inspection"
                  as="select"
                  placeholder="Select inspection"
                  options={['SGS', 'Bureau Veritas', 'Intertek']}
                />
                <Field label="DATE OF INSPECTION" name="date_of_inspection" placeholder="Enter inspection date" />
                <Field
                  label="INSPECTION STATUS"
                  name="inspection_status"
                  as="select"
                  placeholder="Select inspection status"
                  options={['Pending', 'Pass', 'Fail', 'Conditional']}
                />
                <div />
              </div>
            </div>
          </div>

          <ActionButtons
            saveLabel="SAVE INSPECTION"
            showEdit
            onSave={() => void handleSave()}
            onClear={handleClear}
            isSaving={isSaving}
          />
        </form>
      </FormSheet>
    </main>
  )
}
