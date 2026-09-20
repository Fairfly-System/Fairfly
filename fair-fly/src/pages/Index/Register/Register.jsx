import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Mail, Lock, User, Phone, ArrowLeft, Eye, EyeOff } from "lucide-react";
import "./register.css";
import logo from "/FairflyLogo.png";
import { useToast } from "../../../components/UI/toast/ToastProvider";
import { initiateRegistration } from "../../../services/authService";
import TermsPrivacyModal from "../../../components/Shared/TermsPrivacyModal/TermsPrivacyModal";

export default function Register() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [disabled, setDisabled] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState("terms");

  const openLegalModal = (tab = "terms") => {
    setLegalTab(tab);
    setIsLegalModalOpen(true);
  };

  // -----------------------
  // INPUT HANDLER
  // -----------------------
  const handleInputChange = (value, name) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // -----------------------
  // VALIDATION FUNCTIONS
  // -----------------------
  const validateFullName = (name) => {
    if (name.trim().length < 2) {
      setErrors((prev) => ({
        ...prev,
        fullName: "Name must be at least 2 characters",
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
        email: "Please enter a valid email address",
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
        phone: "Invalid phone number format",
      }));
    } else {
      setErrors((prev) => {
        const { phone, ...rest } = prev;
        return rest;
      });
    }
  };

  const validatePassword = (password) => {
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (!strongPassword.test(password)) {
      setErrors((prev) => ({
        ...prev,
        password: "Must be 8+ chars with uppercase, lowercase & number",
      }));
    } else {
      setErrors((prev) => {
        const { password, ...rest } = prev;
        return rest;
      });
    }
  };

  const validateConfirmPassword = (confirmPassword) => {
    if (confirmPassword !== formData.password || confirmPassword === "") {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "Passwords do not match",
      }));
    } else {
      setErrors((prev) => {
        const { confirmPassword, ...rest } = prev;
        return rest;
      });
    }
  };

  // -----------------------
  // DISABLE BUTTON LOGIC
  // -----------------------
  useEffect(() => {
    const hasErrors = Object.keys(errors).length > 0;

    const requiredFields = [
      "fullName",
      "email",
      "phone",
      "password",
      "confirmPassword",
    ];

    const isNotFilled = requiredFields.some(
      (field) => formData[field] === ""
    );

    setDisabled(hasErrors || isNotFilled);
  }, [errors, formData]);

  // -----------------------
  // SUBMIT
  // -----------------------
  const handleSubmit = (e) => {
    e.preventDefault();
    if (disabled || isSubmitting) return;

    const targetEmail = formData.email.trim().toLowerCase();

    initiateRegistration(
      {
        fullName: formData.fullName.trim(),
        email: targetEmail,
        phone: formData.phone.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      },
      (res) => {
        addToast(res?.message || "Verification code sent! Please check your email inbox.", "success");
        try {
          sessionStorage.setItem("pendingVerificationEmail", targetEmail);
        } catch (storageErr) {
          console.warn("Could not save pending email to sessionStorage:", storageErr);
        }
        navigate("/verify-email", { state: { email: targetEmail } });
      },
      (error) => {
        addToast(error?.message || "Could not start registration. Please check your details and try again.", "error");
      },
      setIsSubmitting
    );
  };

  return (
    <div className="auth-split-layout">
      {/* 50% Left Side: Visual Showcase */}
      <div className="auth-side-showcase">
        <img
          src="/auth/register-hero.jpg"
          alt="Philippine Travel & Franchise Community"
          className="auth-showcase-bg"
          onError={(e) => {
            // High quality inspiring travel horizon fallback
            e.currentTarget.src = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1400&q=80";
          }}
        />
        <div className="auth-showcase-overlay" />

        <div className="auth-showcase-content">
          <div className="auth-showcase-header">
            <img src={logo} alt="Fairfly Logo" className="auth-showcase-logo" />
            <span className="auth-showcase-brand">Fairfly System</span>
          </div>

          <div className="auth-showcase-main">
            <div className="auth-showcase-badge">
              <i className="fa-solid fa-user-shield"></i>
              <span>Direct Client & Partner Portal</span>
            </div>

            <h2 className="auth-showcase-title">
              Start Your Journey with <span className="auth-showcase-title-highlight">Fairfly</span>.
            </h2>

            <p className="auth-showcase-desc">
              Join thousands of Filipino travelers and corporate partners enjoying standardized document processing, PSA retrievals, and verified flight itineraries.
            </p>

            <div className="auth-showcase-benefits">
              <div className="auth-benefit-item">
                <i className="fa-solid fa-circle-check"></i>
                <span>Real-time tracking of passport & civil registry filings</span>
              </div>
              <div className="auth-benefit-item">
                <i className="fa-solid fa-circle-check"></i>
                <span>Direct access to certified nationwide franchise operators</span>
              </div>
              <div className="auth-benefit-item">
                <i className="fa-solid fa-circle-check"></i>
                <span>Consolidated promo airfares & visa assistance advisory</span>
              </div>
            </div>
          </div>

          <div className="auth-showcase-stats">
            <div className="auth-stat-item">
              <span className="auth-stat-val">50K+</span>
              <span className="auth-stat-label">Processed Documents</span>
            </div>
            <div className="auth-stat-item">
              <span className="auth-stat-val">99.8%</span>
              <span className="auth-stat-label">On-Time SLA Rate</span>
            </div>
            <div className="auth-stat-item">
              <span className="auth-stat-val">ISO:9001</span>
              <span className="auth-stat-label">Ready Architecture</span>
            </div>
          </div>
        </div>
      </div>

      {/* 50% Right Side: Clean Form */}
      <div className="auth-side-form">
        <div className="auth-form-inner">
          <Link to="/" className="auth-back-link">
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </Link>

          {/* Mobile-only brand badge */}
          <div className="auth-mobile-brand">
            <img src={logo} alt="Fairfly Logo" className="auth-mobile-logo" />
            <span className="auth-mobile-name">Fairfly</span>
          </div>

          <div className="auth-form-header">
            <h1>Create Account</h1>
            <p>Fast registration with zero hidden fees. Start in under a minute.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {/* FULL NAME */}
            <div className="auth-input-group">
              <label className="auth-input-label">Full Name</label>
              <div className={`auth-input-wrapper ${errors.fullName ? 'has-error' : ''}`}>
                <User size={18} className="auth-input-icon" />
                <input
                  type="text"
                  className="auth-input"
                  value={formData.fullName}
                  onChange={(e) => {
                    handleInputChange(e.target.value, "fullName");
                    validateFullName(e.target.value);
                  }}
                  placeholder="Juan Dela Cruz"
                  autoComplete="name"
                  required
                />
              </div>
              {errors.fullName && <p className="auth-input-error">{errors.fullName}</p>}
            </div>

            {/* EMAIL */}
            <div className="auth-input-group">
              <label className="auth-input-label">Email Address</label>
              <div className={`auth-input-wrapper ${errors.email ? 'has-error' : ''}`}>
                <Mail size={18} className="auth-input-icon" />
                <input
                  type="email"
                  className="auth-input"
                  value={formData.email}
                  onChange={(e) => {
                    handleInputChange(e.target.value, "email");
                    validateEmail(e.target.value);
                  }}
                  placeholder="juan@example.com"
                  autoComplete="email"
                  required
                />
              </div>
              {errors.email && <p className="auth-input-error">{errors.email}</p>}
            </div>

            {/* PHONE */}
            <div className="auth-input-group">
              <label className="auth-input-label">Phone Number</label>
              <div className={`auth-input-wrapper ${errors.phone ? 'has-error' : ''}`}>
                <Phone size={18} className="auth-input-icon" />
                <input
                  type="tel"
                  className="auth-input"
                  value={formData.phone}
                  onChange={(e) => {
                    handleInputChange(e.target.value, "phone");
                    validatePhone(e.target.value);
                  }}
                  placeholder="+63 912 345 6789"
                  autoComplete="tel"
                  required
                />
              </div>
              {errors.phone && <p className="auth-input-error">{errors.phone}</p>}
            </div>

            {/* PASSWORD */}
            <div className="auth-input-group">
              <label className="auth-input-label">Password</label>
              <div className={`auth-input-wrapper ${errors.password ? 'has-error' : ''}`}>
                <Lock size={18} className="auth-input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="auth-input"
                  value={formData.password}
                  onChange={(e) => {
                    handleInputChange(e.target.value, "password");
                    validatePassword(e.target.value);
                  }}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="auth-input-error">{errors.password}</p>}
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="auth-input-group">
              <label className="auth-input-label">Confirm Password</label>
              <div className={`auth-input-wrapper ${errors.confirmPassword ? 'has-error' : ''}`}>
                <Lock size={18} className="auth-input-icon" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="auth-input"
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    handleInputChange(e.target.value, "confirmPassword");
                    validateConfirmPassword(e.target.value);
                  }}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="auth-input-error">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={disabled || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>

          <p className="auth-switch-text">
            Already have an account?{" "}
            <Link to="/login" className="auth-switch-link">
              Sign In
            </Link>
          </p>

          <p className="auth-footer-terms">
            By signing up, you agree to our{" "}
            <button
              type="button"
              className="auth-legal-btn"
              onClick={() => openLegalModal("terms")}
            >
              Terms of Service
            </button>{" "}
            and{" "}
            <button
              type="button"
              className="auth-legal-btn"
              onClick={() => openLegalModal("privacy")}
            >
              Privacy Policy
            </button>
            .
          </p>
        </div>
      </div>

      {/* Terms and Privacy Policy Popup Modal */}
      <TermsPrivacyModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialTab={legalTab}
      />
    </div>
  );
}