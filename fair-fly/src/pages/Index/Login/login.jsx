import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Mail, Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";
import "./login.css";
import logo from "/FairflyLogo.png";
import {auth} from "../../../firebase";
import {signInWithEmailAndPassword} from "firebase/auth";
import { useToast } from '../../../components/UI/toast/ToastProvider';
import toFriendlyMessage from '../../../utils/friendlyErrors';
import TermsPrivacyModal from '../../../components/Shared/TermsPrivacyModal/TermsPrivacyModal';

export default function Login() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState("terms");

  const openLegalModal = (tab = "terms") => {
    setLegalTab(tab);
    setIsLegalModalOpen(true);
  };

  const isFormValid = Boolean(email.trim() && password);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!isFormValid || isLoading) return;

    setIsLoading(true);
    signInWithEmailAndPassword(auth, email.trim(), password)
      .then(() => {
        setIsLoading(false);
        navigate("/client");
        addToast("Welcome back! You have successfully signed in.", "success");
      })
      .catch((error) => {
        setIsLoading(false);
        addToast(toFriendlyMessage(error, "Incorrect email or password. Please double-check and try again."), "error");
      });
  };

  return (
    <div className="login-page">
      <div className="login-container">

        <Link to="/home" className="back-button">
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <div className="login-card">

          <div className="login-header">
            <img src={logo} alt="logo" className="logo" />
            <h1>Welcome Back</h1>
            <p>Sign in to access your account</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">

            <div className="input-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <Mail className="icon" size={18} />
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="input-wrapper">
                <Lock className="icon" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
            </div>

            <div className="form-row">
              <label className="checkbox">
                <input type="checkbox" />
                Remember me
              </label>

              <Link to="/forgot-password" className="forgot">
                Forgot password?
              </Link>
            </div>

            <button type="submit" className="login-button" disabled={!isFormValid || isLoading}>
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="signup-text">
            Don't have an account?{" "}
            <Link to="/register">Create Account</Link>
          </div>

        </div>

        <div className="footer-text">
          By signing in, you agree to{" "}
          <button
            type="button"
            className="legal-link-btn"
            onClick={() => openLegalModal("terms")}
          >
            Terms
          </button>{" "}
          and{" "}
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