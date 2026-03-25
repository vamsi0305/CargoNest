import { useState } from 'react'

import {
  ActionButtons,
  AttachField,
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
  { key: 'type_of_pht', label: 'Type of PHT' },
  { key: 'if_bap', label: 'If BAP' },
  { key: 'qty_rm', label: 'QTY (RM)' },
  { key: 'pht_no', label: 'PHT No' },
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
    type_of_pht: 'Heat Treatment',
    if_bap: 'Yes',
    qty_rm: '2500',
    pht_no: 'PHT-68241',
  },
]

const makeRow = () =>
  columns.reduce<Record<string, string>>((acc, column) => {
    acc[column.key] = ''
    return acc
  }, {})

export function StockPhtPage() {
  const [rows, setRows] = useState<Record<string, string>[]>(sampleRows)

  const { formRef, notice, isSaving, handleClear, handleSave } = useFormActions({
    formType: 'stock_pht',
    getExtraPayload: () => ({ pht_rows: rows }),
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
            <h2>PHT's (PLANT)</h2>
            <EditableTable tableName="pht_rows" columns={columns} rows={rows} onRowsChange={setRows} />
            <div className="inline-actions">
              <AttachField label="TYPE OF PHT FILE" name="type_of_pht_file" placeholder="Attach file" />
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
