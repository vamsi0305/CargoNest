import { ActionButtons, Field, FormPageHeader, FormSheet, NoticeBanner } from './common'
import { useFormActions } from './use-form-actions'

export function StockSamplingPage() {
  const { formRef, notice, isSaving, handleClear, handleSave } = useFormActions({
    formType: 'stock_sampling',
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
                <Field label="LAB NAME" name="lab_name" placeholder="Enter lab name" defaultValue="MarineLab Chennai" />
                <Field label="SAMPLE SEND DATE" name="sample_send_date" placeholder="Enter sample send date" defaultValue="20-03-2026" />
                <Field
                  label="REPORT RECEIVED DATE"
                  name="report_received_date"
                  placeholder="Enter report received date"
                  defaultValue="24-03-2026"
                />
                <Field label="NO.OF DAYS" name="no_of_days" placeholder="Enter number of days" defaultValue="4" />
              </div>
            </div>
          </div>

          <ActionButtons
            saveLabel="SAVE PURCHASE ORDER"
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
