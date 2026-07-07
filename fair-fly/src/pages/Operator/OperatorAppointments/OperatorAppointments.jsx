import './operator-appointments.css';

const APPOINTMENTS = [
  {
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@email.com',
    phone: '+63 917 555 1234',
    service: 'Passport Processing',
    date: 'March 28, 2026',
    time: '10:00 AM',
    purpose: 'Need to renew passport for upcoming business trip to Singapore',
    requested: 'March 26, 2026 - 8:30 AM',
    status: 'Pending',
  },
  {
    name: 'Elena Torres',
    email: 'elena.torres@email.com',
    phone: '+63 918 555 5678',
    service: 'VISA Assistance',
    date: 'March 29, 2026',
    time: '2:00 PM',
    purpose: 'Applying for US tourist visa, need consultation on requirements',
    requested: 'March 26, 2026 - 9:15 AM',
    status: 'Pending',
  },
  {
    name: 'Roberto Lim',
    email: 'roberto.lim@email.com',
    phone: '+63 919 555 9012',
    service: 'Package Tour',
    date: 'March 30, 2026',
    time: '11:00 AM',
    purpose: 'Interested in Boracay tour package for family vacation',
    requested: 'March 26, 2026 - 10:00 AM',
    status: 'Pending',
  },
];

export default function OperatorAppointments() {
  return (
    <div className="card op-appointments">
      <div className="op-appointments-header">
        <div className="op-appointments-title">
          <i className="fa-regular fa-calendar" style={{ color: '#f97316' }}></i>
          <div>
            <h2>Appointment Requests</h2>
            <p>Clients requesting face-to-face consultations</p>
          </div>
        </div>
        <span className="op-appointments-badge">{APPOINTMENTS.length} Active</span>
      </div>

      <div className="op-appt-list">
        {APPOINTMENTS.map((a) => (
          <div key={a.name} className="op-appt-card">
            <div className="op-appt-top">
              <div className="op-appt-left">
                <div className="op-avatar">{a.name[0]}</div>
                <div>
                  <p className="op-appt-name">{a.name}</p>
                  <p className="op-appt-email">
                    <i className="fa-regular fa-envelope"></i> {a.email}
                  </p>
                </div>
              </div>
              <div className="op-appt-actions">
                <span className="op-appt-status">{a.status}</span>
                <button className="op-appt-btn confirm">
                  <i className="fa-solid fa-circle-check"></i> Confirm
                </button>
                <button className="op-appt-btn cancel">
                  <i className="fa-solid fa-xmark"></i> Cancel
                </button>
                <button className="op-appt-btn details">
                  <i className="fa-solid fa-check-double"></i> Details
                </button>
              </div>
            </div>

            <div className="op-appt-grid">
              <span>
                <i className="fa-solid fa-phone" style={{ color: '#5b63ff' }}></i> {a.phone}
              </span>
              <span>
                <i className="fa-regular fa-file-lines" style={{ color: '#3b82f6' }}></i> {a.service}
              </span>
              <span>
                <i className="fa-regular fa-calendar" style={{ color: '#f97316' }}></i> {a.date}
              </span>
              <span>
                <i className="fa-regular fa-clock" style={{ color: '#f97316' }}></i> {a.time}
              </span>
            </div>

            <p className="op-appt-purpose">
              <strong>Purpose:</strong> {a.purpose}
            </p>
            <p className="op-appt-requested">Requested: {a.requested}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
