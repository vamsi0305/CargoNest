import { ActionButtons, Field, FormPageHeader, FormSheet, NoticeBanner } from './common'
import { useFormActions } from './use-form-actions'

export function ShipmentPage() {
  const { formRef, notice, isSaving, handleClear, handleSave } = useFormActions({
    formType: 'shipment',
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
          <NoticeBanner notice={notice} />

          <div className="section-block compact-top">
            <h2>General Information</h2>
            <div className="form-grid form-grid--3">
              <Field label="CARGO NO" name="cargo_no" placeholder="Enter cargo number" defaultValue="CGN-24091" />
              <Field label="PO NO" name="po_no" placeholder="Enter GRI number" defaultValue="PO-8751" />
              <Field label="TEMP" name="temp" placeholder="Enter temperature details" defaultValue="-20 C" />
              <Field
                label="REEFER"
                name="reefer"
                as="select"
                placeholder="Select reefer"
                options={['-18 C', '-20 C', '-22 C']}
                defaultValue="-20 C"
              />
              <Field label="OCEAN FREIGHT VENDOR" name="ocean_freight_vendor" placeholder="Enter ocean freight vendor name" defaultValue="Sealink Freight" />
              <Field
                label="C&F"
                name="cnf"
                as="select"
                placeholder="Select C&F"
                options={['Inland C&F', 'Port C&F', 'External C&F']}
                defaultValue="Port C&F"
              />
              <Field label="OCEAN FREIGHT" name="ocean_freight" placeholder="Enter ocean freight charges/details" defaultValue="USD 2,450" />
              <Field
                label="LINER"
                name="liner"
                as="select"
                placeholder="Select liner"
                options={['Maersk', 'MSC', 'Hapag-Lloyd', 'ONE']}
                defaultValue="MSC"
              />
              <Field label="BOOKING NO" name="booking_no" placeholder="Enter booking number" defaultValue="BK-778291" />
              <Field label="CONTAINER NO" name="container_no" placeholder="Enter container number" defaultValue="MSCU3928104" />
              <Field
                label="TRANSPORTER"
                name="transporter"
                as="select"
                placeholder="Select transporter"
                options={['Harbor Trucking', 'BlueLine Logistics', 'Swift Cold Chain']}
                defaultValue="Swift Cold Chain"
              />
              <Field label="TRAILER NO" name="trailer_no" placeholder="Enter trailer number" defaultValue="TN-22-TR-6012" />
            </div>
          </div>

          <div className="section-block compact-top">
            <h2>Logistics Timeline</h2>
            <div className="form-grid form-grid--2">
              <Field label="PICKUP DATE" name="pickup_date" placeholder="Automatically updated" defaultValue="27-03-2026" />
              <Field label="PICKED IN" name="picked_in" placeholder="Automatically updated" defaultValue="Chennai Port" />
              <Field label="CONTAINER DATE" name="container_date" placeholder="Automatically updated" defaultValue="28-03-2026" />
              <Field label="STUFFED AT" name="stuffed_at" placeholder="Enter stuffed at location" defaultValue="Plant 1 Dock" />
              <Field label="STUFFING DATE" name="stuffing_date" placeholder="DD-MM-YYYY" defaultValue="28-03-2026" />
              <Field label="OFFLOADED AT" name="offloaded_at" placeholder="Enter offloading location" defaultValue="Tokyo Cold Terminal" />
              <Field label="CONTAINER OUT DATE" name="container_out_date" placeholder="Automatically updated" defaultValue="29-03-2026" />
              <Field label="ETA DATE" name="eta_date" placeholder="DD-MM-YYYY" defaultValue="12-04-2026" />
              <Field label="CONTAINER OFFLOADED AT" name="container_offloaded_at" placeholder="Enter container offloading location" defaultValue="Tokyo Bay Yard" />
              <Field label="CONTAINER PICKED AT" name="container_picked_at" placeholder="Automatically updated" defaultValue="Chennai Yard" />
              <Field label="BL DATE" name="bl_date" placeholder="DD-MM-YYYY (BL date)" defaultValue="30-03-2026" />
              <Field
                label="BL MONTH"
                name="bl_month"
                as="select"
                placeholder="Select month"
                options={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
                defaultValue="Mar"
              />
            </div>
          </div>

          <div className="section-block compact-top">
            <h2>Documentation &amp; Tracking</h2>
            <div className="form-grid form-grid--3">
              <Field label="LINER SEAL" name="liner_seal" placeholder="Enter liner seal number" defaultValue="LS-112934" />
              <Field label="E SEAL NO" name="e_seal_no" placeholder="Enter electronic seal number" defaultValue="ES-290331" />
              <Field label="BL NO" name="bl_no" placeholder="Enter Bill of Lading number" defaultValue="BL-45920012" />
              <Field
                label="STATUS"
                name="status"
                as="select"
                placeholder="Select movement status"
                options={['Pending', 'In Transit', 'Arrived', 'Offloaded']}
                defaultValue="In Transit"
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
