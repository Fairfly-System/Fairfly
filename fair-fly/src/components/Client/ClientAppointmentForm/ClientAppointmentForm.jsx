import BaseModal from '../../UI/ModalBase/BaseModal';
import './client-appointment-form.css';

export default function ClientAppointmentForm({ isOpen, onClose }) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="500px"
      title="Request Service Appointment"
      subtitle="Fill out the form below to schedule a face-to-face meeting with our branch"
    >
      <form className="appointmentForm form-column" onSubmit={(e) => e.preventDefault()}>
        <div className="form-grid-2">
          <div className="form-column">
            <label className="form-label">Service Type</label>
            <select className="form-select">
              <option>Tour Package</option>
              <option>Passport Processing</option>
              <option>VISA Assistance</option>
              <option>PSA Documents</option>
              <option>Airline Tickets</option>
            </select>
          </div>

          <div className="form-column">
            <label className="form-label">Branch</label>
            <select className="form-select">
              <option>Fairfly Baliuag</option>
            </select>
          </div>
        </div>

        <div className="form-column">
          <label className="form-label">Email Address</label>
          <input
            type="email"
            placeholder="example@email.com"
            className="form-input"
          />
        </div>

        <div className="form-grid-2">
          <div className="form-column">
            <label className="form-label">Preferred Date</label>
            <input type="date" className="form-input" />
          </div>

          <div className="form-column">
            <label className="form-label">Preferred Time</label>
            <input type="time" className="form-input" />
          </div>
        </div>

        <div className="form-column">
          <label className="form-label">Additional Information</label>
          <textarea rows="4" className="form-textarea" />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            onClick={(e) => {
              e.preventDefault();
              onClose();
            }}
          >
            <i className="fa-regular fa-paper-plane"></i> Submit Request
          </button>
        </div>
      </form>
    </BaseModal>
  );
}