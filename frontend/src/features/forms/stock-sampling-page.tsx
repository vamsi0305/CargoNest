import { ActionButtons, Field, FormPageHeader, FormSheet, NoticeBanner } from './common'
import { useCargoPrefill } from './use-cargo-prefill'
import { useFormActions } from './use-form-actions'

export function StockSamplingPage() {
  const { formRef, notice, isSaving, handleClear, handleSave } = useFormActions({
    formType: 'stock_sampling',
  })

  useCargoPrefill({
    formType: 'stock_sampling',
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
            <h2>Sampling</h2>
            <div className="highlight-panel">
              <div className="form-grid form-grid--4">
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
                <Field label="LAB NAME" name="lab_name" placeholder="Enter lab name" />
                <Field label="SAMPLE SEND DATE" name="sample_send_date" placeholder="Enter sample send date" />
                <Field
                  label="REPORT RECEIVED DATE"
                  name="report_received_date"
                  placeholder="Enter report received date"
                />
                <Field label="NO.OF DAYS" name="no_of_days" placeholder="Enter number of days" />
              </div>
            </div>
          </div>

          <ActionButtons
            saveLabel="SAVE SAMPLING"
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
