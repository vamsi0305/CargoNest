import { ActionButtons, Field, FormPageHeader, FormSheet, NoticeBanner } from './common'
import { useCargoPrefill } from './use-cargo-prefill'
import { useFormActions } from './use-form-actions'

export function ShipmentPage() {
  const { formRef, notice, isSaving, dismissNotice, handleClear, handleSave } = useFormActions({
    formType: 'shipment',
  })

  useCargoPrefill({
    formType: 'shipment',
    formRef,
  })

  return (
    <main className="page-canvas">
      <FormPageHeader title="SHIPMENT" />

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

          <div className="section-block compact-top">
            <h2>General Information</h2>
            <div className="form-grid form-grid--3">
              <Field label="CARGO NO" name="cargo_no" placeholder="Enter cargo number" />
              <Field label="PO NO" name="po_no" placeholder="Enter po number" />
              <Field label="INVOICE NO" name="invoice_no" placeholder="Enter invoice number" />
              <Field label="TEMP" name="temp" placeholder="Enter temperature details" />
              <Field
                label="REEFER"
                name="reefer"
                as="select"
                placeholder="Select reefer"
                options={['-18 C', '-20 C', '-22 C']}
              />
              <Field label="OCEAN FREIGHT VENDOR" name="ocean_freight_vendor" placeholder="Enter ocean freight vendor name" />
              <Field
                label="C&F"
                name="cnf"
                as="select"
                placeholder="Select C&F"
                options={['Inland C&F', 'Port C&F', 'External C&F']}
              />
              <Field label="OCEAN FREIGHT" name="ocean_freight" placeholder="Enter ocean freight charges/details" />
              <Field
                label="LINER"
                name="liner"
                as="select"
                placeholder="Select liner"
                options={['Maersk', 'MSC', 'Hapag-Lloyd', 'ONE']}
              />
              <Field label="BOOKING NO" name="booking_no" placeholder="Enter booking number" />
              <Field label="CONTAINER NO" name="container_no" placeholder="Enter container number" />
              <Field
                label="TRANSPORTER"
                name="transporter"
                as="select"
                placeholder="Select transporter"
                options={['Harbor Trucking', 'BlueLine Logistics', 'Swift Cold Chain']}
              />
              <Field label="TRAILER NO" name="trailer_no" placeholder="Enter trailer number" />
            </div>
          </div>

          <div className="section-block compact-top">
            <h2>Logistics Timeline</h2>
            <div className="form-grid form-grid--2">
              <Field label="PICKUP DATE" name="pickup_date" placeholder="Enter pickup date" />
              <Field label="PICKED IN" name="picked_in" placeholder="Enter picked in location" />
              <Field label="CONTAINER DATE" name="container_date" placeholder="Enter container date" />
              <Field label="STUFFED AT" name="stuffed_at" placeholder="Enter stuffed at location" />
              <Field label="STUFFING DATE" name="stuffing_date" placeholder="DD-MM-YYYY" />
              <Field label="OFFLOADED AT" name="offloaded_at" placeholder="Enter offloading location" />
              <Field label="CONTAINER OUT DATE" name="container_out_date" placeholder="Enter container out date" />
              <Field label="ETA DATE" name="eta_date" placeholder="DD-MM-YYYY" />
              <Field label="CONTAINER OFFLOADED AT" name="container_offloaded_at" placeholder="Enter container offloading location" />
              <Field label="CONTAINER PICKED AT" name="container_picked_at" placeholder="Enter container picked at location" />
              <Field label="BL DATE" name="bl_date" placeholder="DD-MM-YYYY (BL date)" />
              <Field
                label="BL MONTH"
                name="bl_month"
                as="select"
                placeholder="Select month"
                options={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
              />
            </div>
          </div>

          <div className="section-block compact-top">
            <h2>Documentation &amp; Tracking</h2>
            <div className="form-grid form-grid--3">
              <Field label="LINER SEAL" name="liner_seal" placeholder="Enter liner seal number" />
              <Field label="E SEAL NO" name="e_seal_no" placeholder="Enter electronic seal number" />
              <Field label="BL NO" name="bl_no" placeholder="Enter Bill of Lading number" />
              <Field
                label="STATUS"
                name="status"
                as="select"
                placeholder="Select movement status"
                options={['Pending', 'In Transit', 'Arrived', 'Offloaded']}
              />
              <div />
              <div />
            </div>
          </div>

          <ActionButtons
            saveLabel="SAVE SHIPMENT"
            onSave={() => void handleSave()}
            onClear={handleClear}
            isSaving={isSaving}
          />
        </form>
      </FormSheet>
    </main>
  )
}
