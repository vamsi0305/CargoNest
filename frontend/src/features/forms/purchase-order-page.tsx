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

const financialYears = ['2025 - 2026', '2026 - 2027', '2027 - 2028', '2028 - 2029', '2029 - 2030']

const tableColumns = [
  { key: 'brand', label: 'Brand' },
  { key: 'product', label: 'Product' },
  { key: 'packing', label: 'Packing' },
  { key: 'glaze', label: 'Glaze' },
  { key: 'grade', label: 'Grade' },
  { key: 'no_of_mc', label: 'No of MC' },
  { key: 'qty_in_kg', label: 'QTY in KG' },
  { key: 'price', label: 'Price' },
]

const makeRow = () =>
  tableColumns.reduce<Record<string, string>>((acc, column) => {
    acc[column.key] = ''
    return acc
  }, {})

export function PurchaseOrderPage() {
  const [rows, setRows] = useState<Record<string, string>[]>([makeRow()])

  const { formRef, notice, isSaving, dismissNotice, handleClear, handleSave } = useFormActions({
    formType: 'purchase_order',
    getExtraPayload: () => ({ product_rows: rows }),
    resetExtraPayload: () => setRows([makeRow()]),
  })

  useCargoPrefill({
    formType: 'purchase_order',
    formRef,
    tableConfig: {
      key: 'product_rows',
      setRows,
      makeRow,
    },
  })

  return (
    <main className="page-canvas">
      <FormPageHeader title="Purchase Order" />

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
            <Field label="CARGO NO" name="cargo_no" placeholder="Cargo identification no" />
            <Field
              label="PLANT"
              name="plant"
              as="select"
              placeholder="Select plant"
              options={['Plant 1', 'Plant 2']}
            />
            <Field
              label="YEAR"
              name="year"
              as="select"
              placeholder="Select financial year"
              options={financialYears}
            />
            <Field
              label="BUYER"
              name="buyer"
              as="select"
              placeholder="Select buyer"
              options={['BlueWave Imports', 'Nordic Ocean Foods', 'Pacific Table Co.']}
            />
            <Field
              label="AGENT"
              name="agent"
              as="select"
              placeholder="Select Agent Company"
              options={['Arjun Cold Chain', 'Skyline Exports', 'Harborline Agency']}
            />
            <Field label="INVOICE NO" name="invoice_no" placeholder="Invoice number" />
            <Field label="PO NO" name="po_no" placeholder="Purchase order number" />
            <Field label="PI DATE" name="pi_date" placeholder="DD-MM-YYYY" />
            <div />
            <Field label="PI NO" name="pi_no" placeholder="Proforma invoice number" />
            <Field label="PO DATE" name="po_date" placeholder="DD-MM-YYYY" />
            <div />
            <Field
              label="PO RECEIVED"
              name="po_received"
              as="select"
              placeholder="Receive by / status"
              options={['Pending', 'Received', 'On Hold']}
            />
            <Field
              label="PO VALIDITY"
              name="po_validity"
              as="select"
              placeholder="Select validity"
              options={['30 Days', '60 Days', '90 Days']}
            />
            <div />
          </div>

          <div className="form-grid form-grid--3 spaced-block">
            <Field
              label="PAYMENT MODE"
              name="payment_mode"
              as="select"
              placeholder="Select payment mode"
              options={['L/C', 'TT', 'CAD']}
            />
            <Field
              label="PAYMENT TERM"
              name="payment_term"
              as="select"
              placeholder="Select payment term"
              options={['Net 15', 'Net 30', 'Net 45']}
            />
            <div />
            <Field
              label="POD TERM"
              name="pod_term"
              as="select"
              placeholder="Select pod term"
              options={['FOB', 'CIF', 'CFR']}
            />
            <Field
              label="POD"
              name="pod"
              as="select"
              placeholder="Select port of discharge"
              options={['Tokyo', 'Oslo', 'Rotterdam', 'Los Angeles']}
            />
            <div />
            <Field
              label="COUNTRY"
              name="country"
              as="select"
              placeholder="Select recipient country"
              options={['Japan', 'Norway', 'Netherlands', 'United States']}
            />
            <Field
              label="REGION"
              name="region"
              as="select"
              placeholder="Select geographic region"
              options={['Asia', 'Europe', 'North America']}
            />
            <Field label="FINAL DESTINATION" name="final_destination" placeholder="City / Warehouse" />
          </div>

          <div className="form-grid form-grid--1 spaced-block">
            <Field
              label="OTHER INFO"
              name="other_info"
              placeholder="Additional logistics or compliance notes..."
              as="textarea"
            />
            <Field
              label="REGION NOTES"
              name="region_notes"
              placeholder="Geographic country"
              as="textarea"
            />
          </div>

          <div className="section-block">
            <h2>Product &amp; Brand</h2>
            <EditableTable tableName="product_rows" columns={tableColumns} rows={rows} onRowsChange={setRows} />
          </div>

          <div className="purchase-footer">
            <ActionButtons
              saveLabel="SAVE PURCHASE ORDER"
              onSave={() => void handleSave()}
              onClear={handleClear}
              isSaving={isSaving}
            />
          </div>
        </form>
      </FormSheet>
    </main>
  )
}
