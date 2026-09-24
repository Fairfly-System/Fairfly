import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { ArrowLeft, Mail, ShieldCheck, RotateCw, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import "./verify-email.css";
import logo from "/FairflyLogo.png";
import { auth } from "../../../firebase";
import { signInWithCustomToken } from "firebase/auth";
import { useToast } from "../../../components/UI/toast/ToastProvider";
import { verifyRegistrationCode, resendRegistrationCode } from "../../../services/authService";
import toFriendlyMessage from "../../../utils/friendlyErrors";

const CODE_LENGTH = 6;
const EXPIRY_TOTAL_SECONDS = 600; // 10 minutes

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  // Retrieve email from navigation state or sessionStorage
  const [email, setEmail] = useState(() => {
    return (
      location.state?.email ||
      sessionStorage.getItem("pendingVerificationEmail") ||
      ""
    );
  });

  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(""));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [expiryTime, setExpiryTime] = useState(EXPIRY_TOTAL_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [attemptsLeft, setAttemptsLeft] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isExpired, setIsExpired] = useState(false);
  const [isLockedOut, setIsLockedOut] = useState(false);

  const inputRefs = useRef([]);

  const [isSubmittedPending, setIsSubmittedPending] = useState(false);

  // Auto-focus first input on initial load
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Expiration countdown (10 minutes)
  useEffect(() => {
    let timer;
    if (expiryTime > 0 && !isExpired && !isLockedOut) {
      timer = setInterval(() => {
        setExpiryTime((prev) => {
          if (prev <= 1) {
            setIsExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [expiryTime, isExpired, isLockedOut]);

  // Resend cooldown countdown (60 seconds)
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle single digit input
  const handleDigitChange = (index, value) => {
    // Only accept numeric digits
    const cleaned = value.replace(/[^0-9]/g, "");

    const newDigits = [...digits];
    newDigits[index] = cleaned.slice(-1); // Take the latest character
    setDigits(newDigits);
    setErrorMessage("");

    // Auto-advance to next box
    if (cleaned && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle keyboard navigation (Backspace & Arrows)
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Move back to previous box and clear it
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle pasting 6 digits
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim().replace(/[^0-9]/g, "");
    if (!pasteData) return;

    const newDigits = [...digits];
    for (let i = 0; i < CODE_LENGTH; i++) {
      if (pasteData[i]) {
        newDigits[i] = pasteData[i];
      }
    }
    setDigits(newDigits);
    setErrorMessage("");

    // Focus last filled box or next empty box
    const nextEmptyIndex = newDigits.findIndex((d) => !d);
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
    } else {
      inputRefs.current[CODE_LENGTH - 1]?.focus();
    }
  };

  const isCodeComplete = digits.every((d) => d !== "");

  // Submit verification code
  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (!isCodeComplete || isVerifying || isExpired || isLockedOut) return;

    if (!email) {
      setErrorMessage("No target email found. Please return to registration and try again.");
      return;
    }

    const fullCode = digits.join("");
    setIsVerifying(true);
    setErrorMessage("");

    verifyRegistrationCode(
      { email, code: fullCode },
      async (res) => {
        try {
          sessionStorage.removeItem("pendingVerificationEmail");
          setIsSubmittedPending(true);
          addToast("Email verified successfully! Your application and valid ID have been submitted for administrator review.", "success");
        } finally {
          setIsVerifying(false);
        }
      },
      (err) => {
        setIsVerifying(false);
        const errMsg = err?.message || "Verification failed. Please try again.";
        setErrorMessage(errMsg);

        // Check for remaining attempts or lockout in response
        if (typeof err?.attemptsLeft === "number") {
          setAttemptsLeft(err.attemptsLeft);
          if (err.attemptsLeft <= 0) {
            setIsLockedOut(true);
          }
        }

        if (err?.code === "EXPIRED" || errMsg.toLowerCase().includes("expired")) {
          setIsExpired(true);
        }

        addToast(toFriendlyMessage(err, errMsg), "error");

        // Clear digits on failure and refocus first box
        setDigits(Array(CODE_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      },
      setIsVerifying
    );
  };

  // Resend fresh verification code
  const handleResend = () => {
    if (resendCooldown > 0 || isResending) return;

    if (!email) {
      setErrorMessage("Cannot resend: missing email address.");
      return;
    }

    setIsResending(true);
    setErrorMessage("");

    resendRegistrationCode(
      email,
      (res) => {
        setIsResending(false);
        setDigits(Array(CODE_LENGTH).fill(""));
        setExpiryTime(EXPIRY_TOTAL_SECONDS);
        setResendCooldown(60);
        setIsExpired(false);
        setIsLockedOut(false);
        setAttemptsLeft(5);
        addToast(res?.message || "A fresh 6-digit code has been sent to your email.", "success");
        inputRefs.current[0]?.focus();
      },
      (err) => {
        setIsResending(false);
        const errMsg = err?.message || "Could not resend verification code. Please try again later.";
        setErrorMessage(errMsg);
        addToast(toFriendlyMessage(err, errMsg), "error");
      },
      setIsResending
    );
  };

  return (
    <div className="auth-split-layout">
      {/* 50% Left Side: Visual Showcase */}
      <div className="auth-side-showcase">
        <img
          src="/auth/register-hero.jpg"
          alt="Philippine Travel & Registration Security"
          className="auth-showcase-bg"
          onError={(e) => {
            e.currentTarget.src =
              "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1400&q=80";
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
              <i className="fa-solid fa-shield-check"></i>
              <span>Identity & Account Security</span>
            </div>

            <h2 className="auth-showcase-title">
              Confirm Your <span className="auth-showcase-title-highlight">Email Address</span>.
            </h2>

            <p className="auth-showcase-desc">
              We uphold stringent security standards across our franchise and client network. Verifying your email protects your travel documents, visa applications, and personal records.
            </p>

            <div className="auth-showcase-benefits">
              <div className="auth-benefit-item">
                <i className="fa-solid fa-circle-check"></i>
                <span>Prevents unauthorized account creation</span>
              </div>
              <div className="auth-benefit-item">
                <i className="fa-solid fa-circle-check"></i>
                <span>Guarantees verified notification delivery for filings</span>
              </div>
              <div className="auth-benefit-item">
                <i className="fa-solid fa-circle-check"></i>
                <span>Instant automated sign-in upon confirmation</span>
              </div>
            </div>
          </div>

          <div className="auth-showcase-stats">
            <div className="auth-stat-item">
              <span className="auth-stat-val">100%</span>
              <span className="auth-stat-label">Verified Accounts</span>
            </div>
            <div className="auth-stat-item">
              <span className="auth-stat-val">256-bit</span>
              <span className="auth-stat-label">SHA Encryption</span>
            </div>
            <div className="auth-stat-item">
              <span className="auth-stat-val">ISO:9001</span>
              <span className="auth-stat-label">Secure Architecture</span>
            </div>
          </div>
        </div>
      </div>

      {/* 50% Right Side: Verification Form */}
      <div className="auth-side-form">
        <div className="auth-form-inner">
          <Link to="/register" className="auth-back-link">
            <ArrowLeft size={16} />
            <span>Back to Registration</span>
          </Link>

          {/* Mobile brand header */}
          <div className="auth-mobile-brand">
            <img src={logo} alt="Fairfly Logo" className="auth-mobile-logo" />
            <span className="auth-mobile-name">Fairfly</span>
          </div>

          {isSubmittedPending ? (
            <div className="verify-page-header" style={{ alignItems: 'center', textAlign: 'center' }}>
              <div
                className="verify-icon-badge"
                style={{
                  width: '3.75rem',
                  height: '3.75rem',
                  backgroundColor: '#f0fdf4',
                  color: '#16a34a',
                  margin: '0 auto 0.75rem',
                }}
              >
                <CheckCircle2 size={32} />
              </div>

              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                Application Under Review
              </h1>

              <p className="verify-header-desc" style={{ color: '#475569', fontSize: '0.875rem', lineHeight: '1.55' }}>
                Your email has been verified! Your client account registration and uploaded government ID have been submitted to our administration team for review.
              </p>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  margin: '1.25rem 0',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    color: '#1e293b',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <ShieldCheck size={16} className="text-purple" />
                  What happens next?
                </div>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: '1.25rem',
                    fontSize: '0.8125rem',
                    color: '#64748b',
                    lineHeight: '1.6',
                  }}
                >
                  <li>Our administrators review your ID to protect against spam &amp; bots.</li>
                  <li>Once approved, you'll receive an email notification at <strong>{email}</strong>.</li>
                  <li>You will then be able to log in and access all client features.</li>
                </ul>
              </div>

              <Link
                to="/login"
                className="auth-submit-btn"
                style={{ textDecoration: 'none', justifyContent: 'center', width: '100%' }}
              >
                Go to Sign In
              </Link>
            </div>
          ) : (
            <>
              <div className="verify-page-header">
                <div className="verify-icon-badge">
                  <Mail size={24} className="verify-badge-icon" />
                </div>
                <h1>Check Your Email</h1>
                <p className="verify-header-desc">
                  We have dispatched a 6-digit confirmation code to:
                </p>
                <div className="verify-target-email-pill">
                  <Mail size={14} />
                  <span>{email || "your email address"}</span>
                </div>
              </div>

              {/* Expiration or Lockout Alerts */}
              {isLockedOut ? (
                <div className="verify-alert verify-alert-danger" role="alert">
                  <AlertCircle size={18} />
                  <div>
                    <strong>Security Lockout:</strong> Too many incorrect attempts. This verification code has been invalidated. Please restart registration.
                  </div>
                </div>
              ) : isExpired ? (
                <div className="verify-alert verify-alert-warning" role="alert">
                  <Clock size={18} />
                  <div>
                    <strong>Code Expired:</strong> Your 10-minute verification window has lapsed. Please click below to request a new code.
                  </div>
                </div>
              ) : errorMessage ? (
                <div className="verify-alert verify-alert-danger" role="alert">
                  <AlertCircle size={18} />
                  <div>{errorMessage}</div>
                </div>
              ) : null}

              {/* Verification Form */}
              <form onSubmit={handleVerify} className="verify-form" noValidate>
                <div className="verify-otp-container">
                  <label className="verify-otp-label" htmlFor="otp-digit-0">
                    Enter 6-Digit Code
                  </label>

                  <div className="verify-otp-boxes" onPaste={handlePaste}>
                    {digits.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-digit-${idx}`}
                        ref={(el) => (inputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={1}
                        className={`verify-otp-box ${digit ? "filled" : ""} ${
                          errorMessage ? "has-error" : ""
                        }`}
                        value={digit}
                        disabled={isVerifying || isExpired || isLockedOut}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        aria-label={`Digit ${idx + 1} of 6`}
                      />
                    ))}
                  </div>
                </div>

                {/* Countdown and Status Indicators */}
                <div className="verify-status-bar">
                  <div className="verify-timer-indicator">
                    <Clock size={14} className={expiryTime < 60 ? "urgent" : ""} />
                    <span>
                      {isExpired ? (
                        <strong className="text-expired">Expired</strong>
                      ) : (
                        <>Expires in: <strong>{formatTime(expiryTime)}</strong></>
                      )}
                    </span>
                  </div>

                  {attemptsLeft !== null && attemptsLeft > 0 && !isLockedOut && (
                    <div className="verify-attempts-indicator">
                      <ShieldCheck size={14} />
                      <span>{attemptsLeft} attempts remaining</span>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="auth-submit-btn verify-submit-btn"
                  disabled={!isCodeComplete || isVerifying || isExpired || isLockedOut}
                >
                  {isVerifying ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Submit &amp; Verify Email</span>
                  )}
                </button>
              </form>

              {/* Resend Action */}
              <div className="verify-resend-section">
                <p className="verify-resend-text">Didn't receive the email?</p>
                <button
                  type="button"
                  className="verify-resend-btn"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || isResending}
                >
                  <RotateCw size={14} className={isResending ? "spinning" : ""} />
                  <span>
                    {resendCooldown > 0
                      ? `Resend code in ${resendCooldown}s`
                      : isResending
                      ? "Sending fresh code..."
                      : "Resend verification code"}
                  </span>
                </button>
              </div>

              {/* Footnote Notice */}
              <div className="verify-footer-security">
                <ShieldCheck size={16} />
                <span>
                  Secure multi-factor identity validation. Never share this code with anyone.
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
