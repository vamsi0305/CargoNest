import { ActionButtons, Field, FormPageHeader, FormSheet, NoticeBanner } from './common'
import { useFormActions } from './use-form-actions'

export function StockInspectionPage() {
  const { formRef, notice, isSaving, handleClear, handleSave } = useFormActions({
    formType: 'stock_inspection',
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
                <Field
                  label="INSPECTION"
                  name="inspection"
                  as="select"
                  placeholder="Select inspection"
                  options={['SGS', 'Bureau Veritas', 'Intertek']}
                  defaultValue="SGS"
                />
                <Field
                  label="DATE OF INSPECTION"
                  name="date_of_inspection"
                  placeholder="Enter inspection date"
                  defaultValue="26-03-2026"
                />
                <Field
                  label="INSPECTION STATUS"
                  name="inspection_status"
                  as="select"
                  placeholder="Select inspection status"
                  options={['Pending', 'Pass', 'Fail', 'Conditional']}
                  defaultValue="Pass"
                />
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
