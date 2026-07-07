import './operator-inquiry-forms.css';

export default function OperatorInquiryForms() {
  return (
    <div className="card op-inquiry">
      <div className="op-inquiry-header">
        <div className="op-inquiry-title">
          <i className="fa-solid fa-file-pen" style={{ color: '#5b63ff' }}></i>
          <div>
            <h2>Inquiry Forms</h2>
            <p>Create and manage client inquiry forms</p>
          </div>
        </div>
        <button className="op-inquiry-btn">
          <i className="fa-solid fa-plus"></i>
          Create Inquiry Form
        </button>
      </div>

      <div className="op-inquiry-empty">
        <i className="fa-regular fa-file-lines"></i>
        <h3>No Inquiry Forms Yet</h3>
        <p>Create your first inquiry form to get started</p>
        <button className="op-inquiry-btn">
          <i className="fa-solid fa-plus"></i>
          Create Inquiry Form
        </button>
      </div>
    </div>
  );
}
