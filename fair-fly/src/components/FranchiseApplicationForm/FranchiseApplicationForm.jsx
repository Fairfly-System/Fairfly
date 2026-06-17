import './franchise-application-form.css';

export default function FranchiseApplicationForm({ isOpen, onClose }) {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <div className="modalOverlay">
      <div className="modal">
        {/* Close Button */}
        <button className="closeBtn" onClick={onClose} aria-label="Close modal">
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Header Section */}
        <div className="modalHeader">
          <i className="fa-solid fa-briefcase" style={{ color: '#ff843d', fontSize: '24px' }}></i>
          <h2>Apply for Fairfly Franchise</h2>
        </div>
        
        <p className="modalDescription">
          Join our growing family of successful franchisees. Fill out this form to
          schedule a meeting with our franchise development team. We'll contact
          you within 2-3 business days.
        </p>

        {/* Form Fields */}
        <form className="franchiseApplicationForm" onSubmit={handleSubmit}>
          
          {/* Full Name & Phone Number */}
          <div className="formRow">
            <div className="formGroup">
              <label>Full Name *</label>
              <input type="text" placeholder="Juan Dela Cruz" required />
            </div>
            <div className="formGroup">
              <label>Phone Number *</label>
              <input type="tel" placeholder="+63 912 345 6789" required />
            </div>
          </div>

          {/* Email Address */}
          <div className="formGroup">
            <label>Email Address *</label>
            <input type="email" placeholder="your.email@example.com" required />
          </div>

          {/* Preferred Branch Location */}
          <div className="formGroup">
            <label>Preferred Branch Location *</label>
            <input type="text" placeholder="e.g., Quezon City, Makati, Cebu City" required />
          </div>

          {/* Business Experience */}
          <div className="formGroup">
            <label>Business Experience *</label>
            <select defaultValue="" required>
              <option value="" disabled hidden>Select your experience level</option>
              <option value="0">No prior business experience</option>
              <option value="1">0 - 2 years experience</option>
              <option value="2">3 - 5 years experience</option>
              <option value="3">Over 5 years experience</option>
            </select>
          </div>

          {/* Investment Capacity */}
          <div className="formGroup">
            <label>Investment Capacity *</label>
            <select defaultValue="" required>
              <option value="" disabled hidden>Select investment range</option>
              <option value="1">₱500,000 - ₱1,000,000</option>
              <option value="2">₱1,000,000 - ₱3,000,000</option>
              <option value="3">₱3,000,000+</option>
            </select>
          </div>

          {/* Preferred Meeting Date & Time */}
          <div className="formRow">
            <div className="formGroup">
              <label>Preferred Meeting Date *</label>
              <input type="date" required />
            </div>
            <div className="formGroup">
              <label>Preferred Meeting Time *</label>
              <select defaultValue="" required>
                <option value="" disabled hidden>Select time</option>
                <option value="morning">Morning (9:00 AM - 12:00 PM)</option>
                <option value="afternoon">Afternoon (1:00 PM - 5:00 PM)</option>
              </select>
            </div>
          </div>

          {/* Additional Information */}
          <div className="formGroup">
            <label>Additional Information (Optional)</label>
            <textarea 
              rows="3" 
              placeholder="Tell us about your business goals, why you're interested in Fairfly franchise, or any questions you have..."
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="formActions">
            <button type="submit" className="submitBtn">
              <i className="fa-regular fa-paper-plane"></i> Submit Franchise Application
            </button>
            <button type="button" className="cancelBtn" onClick={onClose}>
              Cancel
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}