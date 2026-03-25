import { useState } from 'react'

import {
  ActionButtons,
  EditableTable,
  Field,
  FormPageHeader,
  FormSheet,
  NoticeBanner,
} from './common'
import { useFormActions } from './use-form-actions'

const columns = [
  { key: 'brand', label: 'Brand' },
  { key: 'product', label: 'Product' },
  { key: 'packing', label: 'Packing' },
  { key: 'glaze', label: 'Glaze' },
  { key: 'grade', label: 'Grade' },
  { key: 'no_of_mc', label: 'No.of.MC' },
  { key: 'qty_in_kg', label: 'QTY in KG' },
  { key: 'reglazing_in_qty', label: 'Reglazing in QTY' },
  { key: 'reglazing_done', label: 'Reglazing Done' },
  { key: 'reglazing_balance', label: 'Reglazing Balance' },
  { key: 'location_1_qty', label: 'Location 1 / QTY' },
  { key: 'location_2_qty', label: 'Location 2 / QTY' },
]

const sampleRows: Record<string, string>[] = [
  {
    brand: 'OceanPure',
    product: 'Vannamei Shrimp',
    packing: '1 x 10kg',
    glaze: '10%',
    grade: '26/30',
    no_of_mc: '1250',
    qty_in_kg: '12500',
    reglazing_in_qty: '8000',
    reglazing_done: '6200',
    reglazing_balance: '1800',
    location_1_qty: 'Plant 1 / 4000',
    location_2_qty: 'Plant 2 / 2200',
  },
]

const makeRow = () =>
  columns.reduce<Record<string, string>>((acc, column) => {
    acc[column.key] = ''
    return acc
  }, {})

export function StockReglazingPage() {
  const [rows, setRows] = useState<Record<string, string>[]>(sampleRows)

  const { formRef, notice, isSaving, handleClear, handleSave } = useFormActions({
    formType: 'stock_reglazing',
    getExtraPayload: () => ({ reglazing_rows: rows }),
    resetExtraPayload: () => setRows([makeRow()]),
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

          <div className="form-grid form-grid--3">
            <Field label="CARGO NO" name="cargo_no" placeholder="Enter cargo number" defaultValue="CGN-24091" />
            <Field label="PO NO" name="po_no" placeholder="Enter po number" defaultValue="PO-8751" />
            <Field
              label="PLANT"
              name="plant"
              as="select"
              placeholder="Select plant"
              options={['Plant 1', 'Plant 2']}
              defaultValue="Plant 1"
            />
            <Field
              label="BUYER NAME"
              name="buyer_name"
              as="select"
              placeholder="Select buyer"
              options={['BlueWave Imports', 'Nordic Ocean Foods', 'Pacific Table Co.']}
              defaultValue="BlueWave Imports"
            />
            <Field
              label="ASSORTMENT"
              name="assortment"
              as="select"
              placeholder="Select assortment"
              options={['Assorted Mix', 'Premium Cut', 'Standard Bulk']}
              defaultValue="Premium Cut"
            />
            <div />
          </div>

          <div className="section-block section-block--centered">
            <h2>Reglazing</h2>
            <EditableTable tableName="reglazing_rows" columns={columns} rows={rows} onRowsChange={setRows} />
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
