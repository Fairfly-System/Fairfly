import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Mail, Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";
import "./login.css";
import logo from "/FairflyLogo.png";
import { auth, firestore } from "../../../firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useToast } from '../../../components/UI/toast/ToastProvider';
import toFriendlyMessage from '../../../utils/friendlyErrors';
import TermsPrivacyModal from '../../../components/Shared/TermsPrivacyModal/TermsPrivacyModal';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();

  const serviceName = searchParams.get("serviceName");

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

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!isFormValid || isLoading) return;

    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const uid = userCredential.user.uid;

      // Check Firestore user profile status
      const userSnap = await getDoc(doc(firestore, 'users', uid));
      if (userSnap.exists()) {
        const userData = userSnap.data();

        // If client and status is Pending
        if (userData.role === 'client' && (userData.status === 'Pending' || userData.approvalStatus === 'Pending')) {
          await signOut(auth);
          setIsLoading(false);
          addToast("Your account is currently pending administrator verification. You will be notified via email once approved.", "info");
          return;
        }

        // If client and status is Rejected
        if (userData.role === 'client' && (userData.status === 'Rejected' || userData.approvalStatus === 'Rejected')) {
          await signOut(auth);
          setIsLoading(false);
          const reason = userData.rejectionReason ? ` Reason: ${userData.rejectionReason}` : '';
          addToast(`Your registration was not approved.${reason} Please check your email to re-upload your valid ID.`, "error");
          return;
        }

        // If deactivated
        if (userData.status === 'Deactivated') {
          await signOut(auth);
          setIsLoading(false);
          addToast("Your account has been deactivated. Please contact FairFly support.", "error");
          return;
        }
      }

      setIsLoading(false);
      navigate("/client");
      addToast("Welcome back! You have successfully signed in.", "success");
    } catch (error) {
      setIsLoading(false);
      addToast(toFriendlyMessage(error, "Incorrect email or password. Please double-check and try again."), "error");
    }
  };

  return (
    <div className="auth-split-layout">
      {/* 50% Left Side: Visual Showcase */}
      <div className="auth-side-showcase">
        <img
          src="/auth/login-hero.jpg"
          alt="Philippine Travel & Consular Processing"
          className="auth-showcase-bg"
          onError={(e) => {
            // Elegant fallback if local image isn't yet placed by user
            e.currentTarget.src = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1400&q=80";
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
              <i className="fa-solid fa-shield-halved"></i>
              <span>ISO 9001:2000 Ready QMS</span>
            </div>

            <h2 className="auth-showcase-title">
              The Standard in Philippine <span className="auth-showcase-title-highlight">Travel & Document</span> Services.
            </h2>

            <p className="auth-showcase-desc">
              Securely track appointment schedules, passport expedites, consular filings, and domestic & international itineraries in one verified portal.
            </p>
          </div>

          <div className="auth-showcase-stats">
            <div className="auth-stat-item">
              <span className="auth-stat-val">100%</span>
              <span className="auth-stat-label">Direct Operator SLA</span>
            </div>
            <div className="auth-stat-item">
              <span className="auth-stat-val">50+</span>
              <span className="auth-stat-label">Nationwide Branches</span>
            </div>
            <div className="auth-stat-item">
              <span className="auth-stat-val">24/7</span>
              <span className="auth-stat-label">Document Tracking</span>
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
            <h1>Welcome Back</h1>
            <p>Sign in to access your client portal and track your requests.</p>
          </div>

          {/* Context banner if user came from landing page service card */}
          {serviceName && (
            <div className="auth-service-notice">
              <i className="fa-solid fa-circle-info"></i>
              <span>
                Continuing inquiry for <strong>{serviceName}</strong>. Sign in or create an account to proceed.
              </span>
            </div>
          )}

          <form onSubmit={handleLogin} className="auth-form">
            <div className="auth-input-group">
              <label className="auth-input-label">Email Address</label>
              <div className="auth-input-wrapper">
                <Mail className="auth-input-icon" size={18} />
                <input
                  type="email"
                  className="auth-input"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="auth-input-group">
              <label className="auth-input-label">Password</label>
              <div className="auth-input-wrapper">
                <Lock className="auth-input-icon" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  className="auth-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
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
            </div>

            <div className="auth-form-row">
              <label className="auth-checkbox-label">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>

              <Link to="/forgot-password" className="auth-forgot-link">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <p className="auth-switch-text">
            Don't have an account?{" "}
            <Link to="/register" className="auth-switch-link">
              Create Account
            </Link>
          </p>

          <p className="auth-footer-terms">
            By signing in, you agree to our{" "}
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