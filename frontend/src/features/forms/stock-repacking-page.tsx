import { useState } from 'react'

import {
  ActionButtons,
  EditableTable,
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
  { key: 'repacking', label: 'Repacking' },
  { key: 'repacking_done', label: 'Repacking Done' },
  { key: 'repacking_balance', label: 'Repacking Balance' },
  { key: 'stock_location_repacked', label: 'Stock location to be repacked' },
  { key: 'repacked_at', label: 'Repacked At' },
]

const sampleRows: Record<string, string>[] = [
  {
    brand: 'BlueCatch',
    product: 'Tiger Prawn',
    packing: '20 x 500g',
    glaze: '8%',
    grade: '16/20',
    no_of_mc: '840',
    qty_in_kg: '8400',
    repacking: '6000',
    repacking_done: '4200',
    repacking_balance: '1800',
    stock_location_repacked: 'Cold Room B',
    repacked_at: 'Plant 2 Line A',
  },
]

const makeRow = () =>
  columns.reduce<Record<string, string>>((acc, column) => {
    acc[column.key] = ''
    return acc
  }, {})

export function StockRepackingPage() {
  const [rows, setRows] = useState<Record<string, string>[]>(sampleRows)

  const { formRef, notice, isSaving, handleClear, handleSave } = useFormActions({
    formType: 'stock_repacking',
    getExtraPayload: () => ({ repacking_rows: rows }),
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

          <div className="section-block section-block--centered">
            <h2>Repacking</h2>
            <EditableTable tableName="repacking_rows" columns={columns} rows={rows} onRowsChange={setRows} />
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
