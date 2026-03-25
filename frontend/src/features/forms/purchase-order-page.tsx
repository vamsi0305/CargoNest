import { useState } from 'react'
import { Link } from 'react-router-dom'

import {
  ActionButtons,
  EditableTable,
  Field,
  FormPageHeader,
  FormSheet,
  NoticeBanner,
} from './common'
import { useFormActions } from './use-form-actions'

const stockLinks = [
  { to: '/stock-reglazing', label: 'REGLAZING' },
  { to: '/stock-repacking', label: 'REPACKING' },
  { to: '/stock-sampling', label: 'SAMPLING' },
  { to: '/stock-inspection', label: 'INSPECTION' },
]

const financialYears = ['2025 - 2026', '2026 - 2027', '2027 - 2028', '2028 - 2029', '2029 - 2030']

const tableColumns = [
  { key: 'brand', label: 'Brand' },
  { key: 'product', label: 'Product' },
  { key: 'packing', label: 'Packing' },
  { key: 'glaze', label: 'Glaze' },
  { key: 'grade', label: 'Grade' },
  { key: 'no_of_mc', label: 'No of MC' },
  { key: 'price', label: 'Price' },
]

const sampleRows: Record<string, string>[] = [
  {
    brand: 'OceanPure',
    product: 'Vannamei Shrimp',
    packing: '1 x 10kg',
    glaze: '10%',
    grade: '26/30',
    no_of_mc: '1250',
    price: '8.25',
  },
  {
    brand: 'BlueCatch',
    product: 'Tiger Prawn',
    packing: '20 x 500g',
    glaze: '8%',
    grade: '16/20',
    no_of_mc: '840',
    price: '10.4',
  },
]

const makeRow = () =>
  tableColumns.reduce<Record<string, string>>((acc, column) => {
    acc[column.key] = ''
    return acc
  }, {})

export function PurchaseOrderPage() {
  const [rows, setRows] = useState<Record<string, string>[]>(sampleRows)

  const { formRef, notice, isSaving, handleClear, handleSave } = useFormActions({
    formType: 'purchase_order',
    getExtraPayload: () => ({ product_rows: rows }),
    resetExtraPayload: () => setRows([makeRow()]),
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
          <NoticeBanner notice={notice} />

          <div className="form-grid form-grid--3">
            <Field label="CARGO NO" name="cargo_no" placeholder="Cargo identification no" defaultValue="CGN-24091" />
            <Field
              label="PLANT"
              name="plant"
              as="select"
              placeholder="Select plant"
              options={['Plant 1', 'Plant 2']}
              defaultValue="Plant 1"
            />
            <Field
              label="YEAR"
              name="year"
              as="select"
              placeholder="Select financial year"
              options={financialYears}
              defaultValue="2026 - 2027"
            />
            <Field
              label="BUYER"
              name="buyer"
              as="select"
              placeholder="Select buyer"
              options={['BlueWave Imports', 'Nordic Ocean Foods', 'Pacific Table Co.']}
              defaultValue="BlueWave Imports"
            />
            <Field
              label="AGENT"
              name="agent"
              as="select"
              placeholder="Select Agent Company"
              options={['Arjun Cold Chain', 'Skyline Exports', 'Harborline Agency']}
              defaultValue="Arjun Cold Chain"
            />
            <div />
            <Field label="PO NO" name="po_no" placeholder="Purchase order number" defaultValue="PO-8751" />
            <Field label="PI DATE" name="pi_date" placeholder="DD-MM-YYYY" defaultValue="15-03-2026" />
            <div />
            <Field label="PI NO" name="pi_no" placeholder="Proforma invoice number" defaultValue="PI-3329" />
            <Field label="PO DATE" name="po_date" placeholder="DD-MM-YYYY" defaultValue="18-03-2026" />
            <div />
            <Field
              label="PO RECEIVED"
              name="po_received"
              as="select"
              placeholder="Receive by / status"
              options={['Pending', 'Received', 'On Hold']}
              defaultValue="Received"
            />
            <Field
              label="PO VALIDITY"
              name="po_validity"
              as="select"
              placeholder="Select validity"
              options={['30 Days', '60 Days', '90 Days']}
              defaultValue="90 Days"
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
              defaultValue="L/C"
            />
            <Field
              label="PAYMENT TERM"
              name="payment_term"
              as="select"
              placeholder="Select payment term"
              options={['Net 15', 'Net 30', 'Net 45']}
              defaultValue="Net 30"
            />
            <div />
            <Field
              label="POD TERM"
              name="pod_term"
              as="select"
              placeholder="Select pod term"
              options={['FOB', 'CIF', 'CFR']}
              defaultValue="CIF"
            />
            <Field
              label="POD"
              name="pod"
              as="select"
              placeholder="Select port of discharge"
              options={['Tokyo', 'Oslo', 'Rotterdam', 'Los Angeles']}
              defaultValue="Tokyo"
            />
            <div />
            <Field
              label="COUNTRY"
              name="country"
              as="select"
              placeholder="Select recipient country"
              options={['Japan', 'Norway', 'Netherlands', 'United States']}
              defaultValue="Japan"
            />
            <Field
              label="REGION"
              name="region"
              as="select"
              placeholder="Select geographic region"
              options={['Asia', 'Europe', 'North America']}
              defaultValue="Asia"
            />
            <Field label="FINAL DESTINATION" name="final_destination" placeholder="City / Warehouse" defaultValue="Tokyo Central Cold Hub" />
          </div>

          <div className="form-grid form-grid--1 spaced-block">
            <Field
              label="OTHER INFO"
              name="other_info"
              placeholder="Additional logistics or compliance notes..."
              as="textarea"
              defaultValue="Buyer requested strict temperature log and SGS pre-shipment report."
            />
            <Field label="REGION NOTES" name="region_notes" placeholder="Geographic country" as="textarea" defaultValue="Shipment routed via Chennai -> Singapore -> Tokyo." />
          </div>

          <div className="section-block">
            <h2>Product &amp; Brand</h2>
            <EditableTable
              tableName="product_rows"
              columns={tableColumns}
              rows={rows}
              onRowsChange={setRows}
            />
          </div>

          <div className="purchase-footer">
            <div className="stock-nav-buttons">
              {stockLinks.map((item) => (
                <Link key={item.to} to={item.to} className="stock-nav-button">
                  {item.label}
                </Link>
              ))}
            </div>

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
