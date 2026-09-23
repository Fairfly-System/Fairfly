import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import { Mail, ArrowLeft, RotateCw, AlertCircle, CheckCircle2 } from "lucide-react";
import "./reset-password.css";
import logo from "/FairflyLogo.png";
import { useToast } from "../../../components/UI/toast/ToastProvider";
import { requestClientPasswordReset } from "../../../services/authService";
import toFriendlyMessage from "../../../utils/friendlyErrors";

export default function ResetPassword() {
  const { addToast } = useToast();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Handle resend countdown timer (60s)
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const validateEmail = (val) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val.trim()) {
      setError("Email address is required.");
      return false;
    }
    if (!emailRegex.test(val.trim())) {
      setError("Please enter a valid email address.");
      return false;
    }
    setError("");
    return true;
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (error) validateEmail(val);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!validateEmail(email)) return;

    const trimmedEmail = email.trim().toLowerCase();

    // Secure Backend API call:
    // Only sends reset email if account is a client.
    // Privileged accounts (admin/operator) are silently suppressed.
    requestClientPasswordReset(
      trimmedEmail,
      (res) => {
        setIsSuccess(true);
        setCountdown(60);
        addToast(
          res?.message || "Password reset instructions have been sent to your email.",
          "success"
        );
      },
      (err) => {
        const errorMsg = err?.message || "Could not process password reset request.";
        setError(errorMsg);
        addToast(toFriendlyMessage(err, errorMsg), "error");
      },
      setIsLoading
    );
  };

  const handleResend = () => {
    if (countdown > 0 || isLoading) return;
    handleSubmit();
  };

  return (
    <div className="auth-split-layout reset-split-page">
      {/* 50% Left Side: Visual Showcase */}
      <div className="auth-side-showcase">
        <img
          src="/auth/login-hero.jpg"
          alt="Philippine Travel & FairFly Portal"
          className="auth-showcase-bg"
          onError={(e) => {
            e.currentTarget.src =
              "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1400&q=80";
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
              <span>Client Account Recovery</span>
            </div>

            <h2 className="auth-showcase-title">
              Securely Recover Your <span className="auth-showcase-title-highlight">Client Portal</span>.
            </h2>

            <p className="auth-showcase-desc">
              Regain immediate access to your flight itineraries, visa applications, and traveler records. Verified client accounts receive a time-limited reset link directly to their registered email.
            </p>

            <div className="auth-showcase-benefits">
              <div className="auth-benefit-item">
                <i className="fa-solid fa-circle-check"></i>
                <span>Encrypted 60-minute single-use reset links</span>
              </div>
              <div className="auth-benefit-item">
                <i className="fa-solid fa-circle-check"></i>
                <span>Protected against credential tampering & enumeration</span>
              </div>
              <div className="auth-benefit-item">
                <i className="fa-solid fa-circle-check"></i>
                <span>Instant automated recovery for verified travelers</span>
              </div>
            </div>
          </div>

          <div className="auth-showcase-stats">
            <div className="auth-stat-item">
              <span className="auth-stat-val">100%</span>
              <span className="auth-stat-label">Secure Access</span>
            </div>
            <div className="auth-stat-item">
              <span className="auth-stat-val">256-bit</span>
              <span className="auth-stat-label">SSL Encrypted</span>
            </div>
            <div className="auth-stat-item">
              <span className="auth-stat-val">ISO:9001</span>
              <span className="auth-stat-label">QMS Certified</span>
            </div>
          </div>
        </div>
      </div>

      {/* 50% Right Side: Form / Success State */}
      <div className="auth-side-form">
        <div className="auth-form-inner">
          <Link to="/login" className="auth-back-link">
            <ArrowLeft size={16} />
            <span>Back to Sign In</span>
          </Link>

          {/* Mobile brand header */}
          <div className="auth-mobile-brand">
            <img src={logo} alt="Fairfly Logo" className="auth-mobile-logo" />
            <span className="auth-mobile-name">Fairfly</span>
          </div>

          {isSuccess ? (
            /* Success State */
            <div className="reset-success-card">
              <div className="reset-success-icon-badge">
                <CheckCircle2 size={28} />
              </div>

              <div className="auth-form-header">
                <h1>Check Your Email</h1>
                <p>We have dispatched password reset instructions to:</p>
              </div>

              <div className="reset-target-email-pill">
                <Mail size={15} />
                <span>{email.trim().toLowerCase()}</span>
              </div>

              <div className="reset-info-box">
                <p>
                  Click the link in the email to choose a new password. If you don't see it within a minute, please check your spam or junk folder.
                </p>
              </div>

              <div className="reset-actions-group">
                <button
                  type="button"
                  className="reset-resend-btn"
                  onClick={handleResend}
                  disabled={countdown > 0 || isLoading}
                >
                  <RotateCw size={14} className={isLoading ? "spinning" : ""} />
                  <span>
                    {countdown > 0
                      ? `Resend link in ${countdown}s`
                      : isLoading
                      ? "Sending..."
                      : "Resend Reset Link"}
                  </span>
                </button>

                <Link to="/login" className="auth-submit-btn reset-return-btn">
                  <i className="fa-solid fa-right-to-bracket"></i>
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            /* Request Form */
            <div className="reset-form-container">
              <div className="auth-form-header">
                <div className="reset-header-icon-badge">
                  <Mail size={22} />
                </div>
                <h1>Reset Password</h1>
                <p>Enter your registered client email to receive a password reset link.</p>
              </div>

              <form onSubmit={handleSubmit} className="auth-form" noValidate>
                <div className="auth-input-group">
                  <label className="auth-input-label" htmlFor="reset-email">
                    Registered Client Email
                  </label>
                  <div className={`auth-input-wrapper ${error ? "has-error" : ""}`}>
                    <Mail className="auth-input-icon" size={18} />
                    <input
                      id="reset-email"
                      type="email"
                      className="auth-input"
                      placeholder="client.name@example.com"
                      value={email}
                      onChange={handleEmailChange}
                      autoComplete="email"
                      required
                    />
                  </div>
                  {error && (
                    <div className="auth-field-error" role="alert">
                      <AlertCircle size={14} />
                      <span>{error}</span>
                    </div>
                  )}
                </div>

                <div className="reset-notice-card">
                  <i className="fa-solid fa-circle-info"></i>
                  <div>
                    <strong>Client Portal Notice:</strong> This password reset service is strictly designated for <em>FairFly Client</em> accounts. Franchise Operators and Administrators must contact Head Office Support directly for credential updates.
                  </div>
                </div>

                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={isLoading || !email.trim()}
                >
                  {isLoading ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      <span>Verifying & Sending...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-paper-plane"></i>
                      <span>Send Reset Link</span>
                    </>
                  )}
                </button>

                <div className="auth-switch-prompt">
                  <span>Remember your password?</span>{" "}
                  <Link to="/login" className="auth-switch-link">
                    Sign In
                  </Link>
                </div>
              </form>
            </div>
          )}

          <div className="auth-legal-footer">
            Don't have a client account?{" "}
            <Link to="/register" className="auth-switch-link">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
