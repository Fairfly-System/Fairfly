import './franchise-application-form.css';
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';
import { useToast } from '../../UI/toast/ToastProvider';

export default function FranchiseApplicationForm({ isOpen, onClose }) {

  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    preferredBranchLocation: '',
    businessExperience: '',
    investmentCapacity: '',
    preferredMeetingDate: '',
    preferredMeetingTime: '',
    additionalInformation: '',
  });

  const [errors, setErrors] = useState({});
  const [disabled, setDisabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  const handleInputChange = (value, name) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    ApiCaller(
      `${API_BASE_URL}/api/franchise/applications`,
      'POST',
      formData,
      {},
      () => {
        onClose();
        setFormData({
          fullName: '',
          phoneNumber: '',
          email: '',
          preferredBranchLocation: '',
          businessExperience: '',
          investmentCapacity: '',
          preferredMeetingDate: '',
          preferredMeetingTime: '',
          additionalInformation: '',
        });
        addToast('Application submitted successfully!', 'success');
      },
      (error) => {
        addToast('Error submitting application: ' + error.message, 'error');
        console.error('Application submission error:', error);
      },
      setIsLoading
    );
  };

  const validateName = (name) => {
    if (name.trim().length < 2) {
      setErrors((prev) => ({
        ...prev,
        fullName: 'Name must be at least 2 characters',
      }));
    } else {
      setErrors((prev) => {
        const { fullName, ...rest } = prev;
        return rest;
      });
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setErrors((prev) => ({
        ...prev,
        email: 'Invalid email format',
      }));
    } else {
      setErrors((prev) => {
        const { email, ...rest } = prev;
        return rest;
      });
    }
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[0-9+\s-]{8,15}$/;

    if (!phoneRegex.test(phone)) {
      setErrors((prev) => ({
        ...prev,
        phoneNumber: 'Invalid phone number',
      }));
    } else {
      setErrors((prev) => {
        const { phoneNumber, ...rest } = prev;
        return rest;
      });
    }
  };

  const validatePreferredMeetingDate = (date) => {
    if (date < new Date().toISOString().split('T')[0]) {
      setErrors((prev) => ({
        ...prev,
        preferredMeetingDate: 'Date must not be in the past',
      }));
    } else {
      setErrors((prev) => {
        const { preferredMeetingDate, ...rest } = prev;
        return rest;
      });
    }
  };

  const validatePreferredBranchLocation = (location) => {
    if (location.trim().length < 2) {
      setErrors((prev) => ({
        ...prev,
        preferredBranchLocation: 'Location must be at least 2 characters',
      }));
    } else {
      setErrors((prev) => {
        const { preferredBranchLocation, ...rest } = prev;
        return rest;
      });
    }
  };

  useEffect(() => {
    const requiredFields = [
      'fullName',
      'phoneNumber',
      'email',
      'preferredBranchLocation',
      'businessExperience',
      'investmentCapacity',
      'preferredMeetingDate',
      'preferredMeetingTime',
    ];

    //Check if there are any fields that are not filled with .some()
    const isNotFilled = requiredFields.some(
      (field) => !formData[field] || !String(formData[field]).trim()
    );

    //Check if there are any errors by seeing if the errors object is not empty
    const hasErrors = Object.keys(errors).length > 0;

    setDisabled(isNotFilled || hasErrors);
  }, [formData, errors]);

  if (!isOpen) return null;

  return (
    <div className="modalOverlay">
      <div className="modal">
        <button className="closeBtn" onClick={onClose} aria-label="Close modal">
          <i className="fa-solid fa-circle-xmark"></i>
        </button>

        <div className="modalHeader">
          <i
            className="fa-solid fa-briefcase"
            style={{ color: '#ff843d', fontSize: '24px' }}
          ></i>
          <h2>Apply for Fairfly Franchise</h2>
        </div>

        <p className="modalDescription">
          Join our growing family of successful franchisees. Fill out this form to
          schedule a meeting with our franchise development team. We'll contact
          you within 2-3 business days.
        </p>

        <form className="franchiseApplicationForm" onSubmit={handleSubmit}>
          <div className="formRow">
            <div className="formGroup">
              <label>Full Name *</label>
              <input
                type="text"
                placeholder="Juan Dela Cruz"
                onChange={(e) => {
                  validateName(e.target.value);
                  handleInputChange(e.target.value, 'fullName');
                }}
                required
                value={formData.fullName}
              />
              {errors.fullName && <p className="error">{errors.fullName}</p>}
            </div>

            <div className="formGroup">
              <label>Phone Number *</label>
              <input
                type="tel"
                placeholder="+63 912 345 6789"
                onChange={(e) => {
                  validatePhone(e.target.value);
                  handleInputChange(e.target.value, 'phoneNumber');
                }}
                required
                value={formData.phoneNumber}
              />
              {errors.phoneNumber && <p className="error">{errors.phoneNumber}</p>}
            </div>
          </div>

          <div className="formGroup">
            <label>Email Address *</label>
            <input
              type="email"
              placeholder="your.email@example.com"
              onChange={(e) => {
                validateEmail(e.target.value);
                handleInputChange(e.target.value, 'email');
              }}
              required
              value={formData.email}
            />
            {errors.email && <p className="error">{errors.email}</p>}
          </div>

          <div className="formGroup">
            <label>Preferred Branch Location *</label>
            <input
              type="text"
              placeholder="e.g., Quezon City, Makati, Cebu City"
              onChange={(e) => {
                validatePreferredBranchLocation(e.target.value);
                handleInputChange(e.target.value, 'preferredBranchLocation');
              }}
              required
              value={formData.preferredBranchLocation}
            />
            {errors.preferredBranchLocation && (
              <p className="error">{errors.preferredBranchLocation}</p>
            )}
          </div>

          <div className="formGroup">
            <label>Business Experience *</label>
            <select
              defaultValue=""
              required
              onChange={(e) =>
                handleInputChange(e.target.value, 'businessExperience')
              }
              value={formData.businessExperience}
            >
              <option value="" disabled>
                Select your experience level
              </option>
              <option value="0">No prior business experience</option>
              <option value="1">0 - 2 years experience</option>
              <option value="2">3 - 5 years experience</option>
              <option value="3">Over 5 years experience</option>
            </select>
          </div>

          <div className="formGroup">
            <label>Investment Capacity *</label>
            <select
              defaultValue=""
              required
              onChange={(e) =>
                handleInputChange(e.target.value, 'investmentCapacity')
              }
              value={formData.investmentCapacity}
            >
              <option value="" disabled>
                Select investment range
              </option>
              <option value="1">₱500,000 - ₱1,000,000</option>
              <option value="2">₱1,000,000 - ₱3,000,000</option>
              <option value="3">₱3,000,000+</option>
            </select>
          </div>

          <div className="formRow">
            <div className="formGroup">
              <label>Preferred Meeting Date *</label>
              <input
                type="date"
                required
                onChange={(e) => {
                  validatePreferredMeetingDate(e.target.value);
                  handleInputChange(e.target.value, 'preferredMeetingDate');
                }}
                value={formData.preferredMeetingDate}
              />
              {errors.preferredMeetingDate && (
                <p className="error">{errors.preferredMeetingDate}</p>
              )}
            </div>

            <div className="formGroup">
              <label>Preferred Meeting Time *</label>
              <select
                defaultValue=""
                required
                onChange={(e) =>
                  handleInputChange(e.target.value, 'preferredMeetingTime')
                }
                value={formData.preferredMeetingTime}
              >
                <option value="" disabled>
                  Select time
                </option>
                <option value="morning">Morning (9:00 AM - 12:00 PM)</option>
                <option value="afternoon">Afternoon (1:00 PM - 5:00 PM)</option>
              </select>
            </div>
          </div>

          <div className="formGroup">
            <label>Additional Information (Optional)</label>
            <textarea
              rows="3"
              placeholder="Tell us about your business goals..."
              onChange={(e) =>
                handleInputChange(e.target.value, 'additionalInformation')
              }
              value={formData.additionalInformation}
            />
          </div>

          <div className="formActions">
            <button type="submit" className="submitBtn" disabled={disabled || isLoading}>
              Submit Application
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