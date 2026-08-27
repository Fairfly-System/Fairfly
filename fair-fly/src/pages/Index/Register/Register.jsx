import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Mail, Lock, User, Phone, ArrowLeft, Eye, EyeOff } from "lucide-react";
import "./register.css";
import logo from "/FairflyLogo.png";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { auth, firestore } from "../../../firebase";
import { useToast } from "../../../components/UI/toast/ToastProvider";
import { useAuthContext } from "../../../context/AuthContext";
import toFriendlyMessage from "../../../utils/friendlyErrors";
import TermsPrivacyModal from "../../../components/Shared/TermsPrivacyModal/TermsPrivacyModal";

export default function Register() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { setIsRegistering } = useAuthContext();

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
        email: "Invalid email format",
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
        phone: "Invalid phone number",
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
        password: "Must be 8+ chars, include uppercase, lowercase & number",
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
    if (disabled) return;

    setIsRegistering(true);

    createUserWithEmailAndPassword(auth, formData.email, formData.password)
      .then(async () => {
        const { password, confirmPassword, ...userWithoutPassword } = formData;

        await setDoc(doc(firestore, "users", auth.currentUser.uid), {
          ...userWithoutPassword,
          createdAt: new Date().toISOString(),
          role: "client",
        });

        await signOut(auth);
        setIsRegistering(false);
        navigate("/login");
        addToast("Registration successful! Please sign in.", "success");
      })
      .catch((error) => {
        setIsRegistering(false);
        addToast(toFriendlyMessage(error, "Could not create your account. Please check your details and try again."), "error");
      });
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <Link to="/" className="back-button">
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <div className="register-card">
          <div className="register-header">
            <img src={logo} alt="logo" className="logo" />
            <h1>Create Account</h1>
            <p>Start your journey</p>
          </div>

          <form className="register-form" onSubmit={handleSubmit}>
            {/* FULL NAME */}
            <div className="input-group">
              <label>Full Name</label>
              <div className="input-wrapper">
                <User size={18} className="icon" />
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => {
                    handleInputChange(e.target.value, "fullName");
                    validateFullName(e.target.value);
                  }}
                  placeholder="Your Name"
                />
              </div>
              {errors.fullName && <p className="error">{errors.fullName}</p>}
            </div>

            {/* EMAIL */}
            <div className="input-group">
              <label>Email</label>
              <div className="input-wrapper">
                <Mail size={18} className="icon" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    handleInputChange(e.target.value, "email");
                    validateEmail(e.target.value);
                  }}
                  placeholder="youremail@example.com"
                />
              </div>
              {errors.email && <p className="error">{errors.email}</p>}
            </div>

            {/* PHONE */}
            <div className="input-group">
              <label>Phone</label>
              <div className="input-wrapper">
                <Phone size={18} className="icon" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    handleInputChange(e.target.value, "phone");
                    validatePhone(e.target.value);
                  }}
                  placeholder="+63 123 456 7890"
                />
              </div>
              {errors.phone && <p className="error">{errors.phone}</p>}
            </div>

            {/* PASSWORD */}
            <div className="input-group">
              <label>Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => {
                    handleInputChange(e.target.value, "password");
                    validatePassword(e.target.value);
                  }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="error">{errors.password}</p>}
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="input-group">
              <label>Confirm Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="icon" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    handleInputChange(e.target.value, "confirmPassword");
                    validateConfirmPassword(e.target.value);
                  }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="error">{errors.confirmPassword}</p>
              )}
            </div>

            <button type="submit" className="submit-button" disabled={disabled}>
              Create Account
            </button>
          </form>

          <div className="switch-link">
            Already have an account? <Link to="/login">Sign In</Link>
          </div>
        </div>

        <div className="footer-text">
          By signing up, you agree to{" "}
          <button
            type="button"
            className="legal-link-btn"
            onClick={() => openLegalModal("terms")}
          >
            Terms
          </button>{" "}
          &{" "}
          <button
            type="button"
            className="legal-link-btn"
            onClick={() => openLegalModal("privacy")}
          >
            Privacy Policy
          </button>
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