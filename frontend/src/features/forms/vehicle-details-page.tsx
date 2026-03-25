import { ActionButtons, AttachField, Field, FormPageHeader, FormSheet, NoticeBanner } from './common'
import { useFormActions } from './use-form-actions'

export function VehicleDetailsPage() {
  const { formRef, notice, isSaving, handleClear, handleSave } = useFormActions({
    formType: 'vehicle_details',
  })

  return (
    <main className="page-canvas">
      <FormPageHeader title="Vehicle Details" />

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
            <h2>Vehicle Entry Details</h2>
            <div className="form-grid form-grid--2">
              <Field label="REFERENCE ID" name="reference_id" placeholder="Automatically updated" defaultValue="VEH-98341" />
              <Field
                label="EMPTY / LOAD"
                name="empty_or_load"
                as="select"
                placeholder="Enter status"
                options={['Empty', 'Load']}
                defaultValue="Load"
              />
              <Field
                label="MOVEMENT TYPE"
                name="movement_type"
                as="select"
                placeholder="Enter movement type"
                options={['Inbound', 'Outbound']}
                defaultValue="Outbound"
              />
              <Field label="CONTAINER NO" name="container_no" placeholder="Enter container number" defaultValue="MSCU3928104" />
              <Field label="TRANSPORTER" name="transporter" placeholder="Enter transporter name" defaultValue="Swift Cold Chain" />
              <Field label="DRIVER CONTACT NUMBER" name="driver_contact_number" placeholder="Enter driver number" defaultValue="+91 9876543210" />
              <Field label="VEHICLE NO" name="vehicle_no" placeholder="Enter vehicle registration" defaultValue="TN-22-AQ-7712" />
              <AttachField label="GRI NO" name="gri_attachment" placeholder="Attach GRI file" />
              <Field label="FROM" name="from_location" placeholder="Origin City" defaultValue="Chennai" />
              <Field label="GRI DATE" name="gri_date" placeholder="Enter GRI date" defaultValue="27-03-2026" />
              <Field label="TO" name="to_location" placeholder="Origin City" defaultValue="Chennai Port" />
              <Field label="QTY IN KG" name="qty_in_kg" placeholder="Enter weight in kg" defaultValue="18450" />
              <AttachField label="GATEPASS" name="gatepass_attachment" placeholder="Attach gatepass" />
              <AttachField label="STUFFING SHEET" name="stuffing_sheet_attachment" placeholder="Attach stuffing sheet" />
              <Field
                label="OTHER INFO / REMARKS"
                name="other_info"
                as="textarea"
                placeholder="Enter any additional notes or specific remarks regarding this vehicle type..."
                defaultValue="Driver to report reefer temp every 45 minutes during transit."
              />
              <div />
              <Field label="VEHICLE OUT TEMPERATURE" name="vehicle_out_temperature" placeholder="Enter out temperature" defaultValue="-19 C" />
              <Field label="VEHICLE IN TEMPERATURE" name="vehicle_in_temperature" placeholder="Enter in temperature" defaultValue="-21 C" />
              <Field label="OUT TIME" name="out_time" placeholder="Automatically updated" defaultValue="08:15" />
              <Field label="IN TIME" name="in_time" placeholder="Automatically updated" defaultValue="05:40" />
              <Field label="VEHICLE OUT TIME" name="vehicle_out_time" placeholder="Automatically updated" defaultValue="08:20" />
              <Field label="VEHICLE IN TIME" name="vehicle_in_time" placeholder="Automatically updated" defaultValue="05:35" />
            </div>
          </div>

          <ActionButtons
            saveLabel="SAVE VEHICLE TYPE"
            onSave={() => void handleSave()}
            onClear={handleClear}
            isSaving={isSaving}
          />
        </form>
      </FormSheet>
    </main>
  )
}
