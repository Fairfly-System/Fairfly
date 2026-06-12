import './client-appointment-form.css';

export default function ClientAppointmentForm({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modalOverlay">
      <div className="modal">
        <button
          className="closeBtn"
          onClick={onClose}
        >
          <i class="fa-solid fa-circle-xmark"></i>
        </button>

        <h2>Request Service Appointment</h2>

        <p>
          Fill out the form below to schedule an appointment.
        </p>

        <form className="appointmentForm">
          <label>Service Type</label>
          <select>
            <option>Tour Package</option>
            <option>Passport Processing</option>
            <option>VISA Assistance</option>
            <option>PSA Documents</option>
            <option>Airline Tickets</option>
          </select>

          <label>Email Address</label>
          <input
            type="email"
            placeholder="example@email.com"
          />

          <label>Preferred Date</label>
          <input type="date" />

          <label>Preferred Time</label>
          <input type="time" />

          <label>Additional Information</label>
          <textarea rows="4" />

          <button
            type="submit"
            className="submitBtn"
          >
            <i class="fa-regular fa-paper-plane"></i> Submit Request
          </button>
        </form>
      </div>
    </div>
  );
}