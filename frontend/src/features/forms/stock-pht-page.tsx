import { useState } from 'react'

import {
  ActionButtons,
  AttachField,
  EditableTable,
  Field,
  FormPageHeader,
  FormSheet,
  NoticeBanner,
} from './common'
import { useCargoPrefill } from './use-cargo-prefill'
import { useFormActions } from './use-form-actions'

const columns = [
  { key: 'brand', label: 'Brand', editable: false },
  { key: 'product', label: 'Product', editable: false },
  { key: 'packing', label: 'Packing', editable: false },
  { key: 'glaze', label: 'Glaze', editable: false },
  { key: 'grade', label: 'Grade', editable: false },
  { key: 'no_of_mc', label: 'No.of.MC', editable: false },
  { key: 'qty_in_kg', label: 'QTY in KG', editable: false },
  { key: 'price', label: 'Price', editable: false },
  { key: 'type_of_pht', label: 'Type of PHT' },
  { key: 'if_bap', label: 'If BAP' },
  { key: 'qty_rm', label: 'QTY (RM)' },
  { key: 'pht_no', label: 'PHT No' },
]

const makeRow = () =>
  columns.reduce<Record<string, string>>((acc, column) => {
    acc[column.key] = ''
    return acc
  }, {})

export function StockPhtPage() {
  const [rows, setRows] = useState<Record<string, string>[]>([makeRow()])

  const { formRef, notice, isSaving, dismissNotice, handleClear, handleSave } = useFormActions({
    formType: 'stock_pht',
    getExtraPayload: () => ({ pht_rows: rows }),
    resetExtraPayload: () => setRows([makeRow()]),
  })

  useCargoPrefill({
    formType: 'stock_pht',
    formRef,
    tableConfig: {
      key: 'pht_rows',
      setRows: (nextRows) => setRows(nextRows.map((row) => ({ ...makeRow(), ...row }))),
      makeRow,
    },
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
          <NoticeBanner notice={notice} onDismiss={dismissNotice} />

          <div className="form-grid form-grid--3">
            <Field label="CARGO NO" name="cargo_no" placeholder="Enter cargo number" />
            <Field label="PO NO" name="po_no" placeholder="Enter po number" />
            <Field label="INVOICE NO" name="invoice_no" placeholder="Enter invoice number" />
          </div>

          <div className="section-block section-block--centered">
            <h2>PHT's (PLANT)</h2>
            <EditableTable tableName="pht_rows" columns={columns} rows={rows} onRowsChange={setRows} />
            <div className="inline-actions">
              <AttachField label="TYPE OF PHT FILE" name="type_of_pht_file" placeholder="Attach file" />
            </div>
          </div>

          <ActionButtons
            saveLabel="SAVE PHT"
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
