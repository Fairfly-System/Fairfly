import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Mail, Lock, User, Phone, ArrowLeft } from "lucide-react";
import "./register.css";
import logo from "/FairflyLogo.png";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../firebase";
import { setToDatabase } from "../../../utils/firebaseutils";
import { useToast } from "../../../components/UI/toast/ToastProvider";

export default function Register() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [disabled, setDisabled] = useState(true);

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

    createUserWithEmailAndPassword(auth, formData.email, formData.password)
      .then(() => {
        const { password, confirmPassword, ...userWithoutPassword } = formData;

        setToDatabase("users/" + auth.currentUser.uid, {
          ...userWithoutPassword,
          createdAt: new Date().toISOString(),
          role: "client",
        });

        navigate("/home");
        addToast("Registration successful!", "success");
      })
      .catch((error) => {
        addToast(error.message, "error");
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
                  type="password"
                  value={formData.password}
                  onChange={(e) => {
                    handleInputChange(e.target.value, "password");
                    validatePassword(e.target.value);
                  }}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="error">{errors.password}</p>}
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="input-group">
              <label>Confirm Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="icon" />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    handleInputChange(e.target.value, "confirmPassword");
                    validateConfirmPassword(e.target.value);
                  }}
                  placeholder="••••••••"
                />
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
          By signing up, you agree to Terms & Privacy Policy
        </div>
      </div>
    </div>
  );
}