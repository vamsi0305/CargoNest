import { useState } from 'react'

import {
  ActionButtons,
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
  { key: 'repacking', label: 'Repacking' },
  { key: 'repacking_done', label: 'Repacking Done' },
  { key: 'repacking_balance', label: 'Repacking Balance' },
  { key: 'stock_location_repacked', label: 'Stock location to be repacked' },
  { key: 'repacked_at', label: 'Repacked At' },
]

const makeRow = () =>
  columns.reduce<Record<string, string>>((acc, column) => {
    acc[column.key] = ''
    return acc
  }, {})

export function StockRepackingPage() {
  const [rows, setRows] = useState<Record<string, string>[]>([makeRow()])

  const { formRef, notice, isSaving, dismissNotice, handleClear, handleSave } = useFormActions({
    formType: 'stock_repacking',
    getExtraPayload: () => ({ repacking_rows: rows }),
    resetExtraPayload: () => setRows([makeRow()]),
  })

  useCargoPrefill({
    formType: 'stock_repacking',
    formRef,
    tableConfig: {
      key: 'repacking_rows',
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
              label="ASSORTMENT"
              name="assortment"
              as="select"
              placeholder="Select assortment"
              options={['Assorted Mix', 'Premium Cut', 'Standard Bulk']}
            />
          </div>

          <div className="section-block section-block--centered">
            <h2>Repacking</h2>
            <EditableTable tableName="repacking_rows" columns={columns} rows={rows} onRowsChange={setRows} />
          </div>

          <ActionButtons
            saveLabel="SAVE REPACKING"
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
