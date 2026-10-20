import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { Mail, ArrowLeft, RotateCw, AlertCircle, CheckCircle2, Building, ShieldCheck, HelpCircle, Lock, Eye, EyeOff } from "lucide-react";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { auth } from "../../../firebase";
import "./reset-password.css";
import logo from "/FairflyLogo.png";
import { useToast } from "../../../components/UI/toast/ToastProvider";
import { requestClientPasswordReset, requestOperatorPasswordReset } from "../../../services/authService";
import toFriendlyMessage from "../../../utils/friendlyErrors";

export default function ResetPassword() {
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get("oobCode");

  // Mode: if oobCode is present, we are in "confirm-reset" mode
  const [isResetMode, setIsResetMode] = useState(Boolean(oobCode));
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [codeVerifying, setCodeVerifying] = useState(Boolean(oobCode));
  const [codeError, setCodeError] = useState("");

  // New Password Form state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);

  const [accountType, setAccountType] = useState("client"); // 'client' | 'operator'
  const [email, setEmail] = useState("");
  const [branchName, setBranchName] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // If oobCode is present, verify code with Firebase on mount
  useEffect(() => {
    if (!oobCode) {
      setIsResetMode(false);
      return;
    }

    let isMounted = true;
    setCodeVerifying(true);
    verifyPasswordResetCode(auth, oobCode)
      .then((userEmail) => {
        if (!isMounted) return;
        setVerifiedEmail(userEmail);
        setIsResetMode(true);
        setCodeVerifying(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("verifyPasswordResetCode error:", err);
        setCodeError(
          err.code === "auth/expired-action-code"
            ? "This password reset link has expired. Please request a new one."
            : err.code === "auth/invalid-action-code"
            ? "This password reset link is invalid or has already been used."
            : "Could not verify reset link. Please request a new one."
        );
        setCodeVerifying(false);
      });

    return () => {
      isMounted = false;
    };
  }, [oobCode]);

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

    if (accountType === "operator") {
      // Operator Password Reset Request -> Super Admin Review Queue
      requestOperatorPasswordReset(
        {
          email: trimmedEmail,
          branchName: branchName.trim(),
          reason: reason.trim()
        },
        (res) => {
          setIsSuccess(true);
          setCountdown(60);
          addToast(
            res?.message || "Password reset request submitted for Super Admin review.",
            "success"
          );
        },
        (err) => {
          const errorMsg = err?.message || "Could not process operator reset request.";
          setError(errorMsg);
          addToast(toFriendlyMessage(err, errorMsg), "error");
        },
        setIsLoading
      );
    } else {
      // Client Password Reset (Direct Firebase Email Link)
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
    }
  };

  const handleResend = () => {
    if (countdown > 0 || isLoading) return;
    handleSubmit();
  };

  const handleConfirmResetSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");

    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!strongPassword.test(newPassword)) {
      setError("Must be 8+ chars with uppercase, lowercase & number");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setIsLoading(false);
      setPasswordResetSuccess(true);
      addToast("Your password has been reset successfully!", "success");
    } catch (err) {
      setIsLoading(false);
      console.error("confirmPasswordReset error:", err);
      const msg =
        err.code === "auth/expired-action-code"
          ? "This password reset link has expired. Please request a new one."
          : err.code === "auth/invalid-action-code"
          ? "This reset link is invalid or has already been used."
          : err.message || "Failed to update password.";
      setError(msg);
      addToast(msg, "error");
    }
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
              <ShieldCheck size={14} />
              <span>{isResetMode ? "Password Security Standards" : accountType === "operator" ? "Franchise Security Protocol" : "Client Account Recovery"}</span>
            </div>

            <h2 className="auth-showcase-title">
              {isResetMode ? (
                <>
                  Set Your New <span className="auth-showcase-title-highlight">Secure Password</span>.
                </>
              ) : accountType === "operator" ? (
                <>
                  Operator <span className="auth-showcase-title-highlight">Identity Verification</span>
                </>
              ) : (
                <>
                  Securely Recover Your <span className="auth-showcase-title-highlight">Client Portal</span>.
                </>
              )}
            </h2>

            <p className="auth-showcase-desc">
              {isResetMode
                ? "Your new password must follow the registration security requirements: at least 8 characters including uppercase, lowercase, and a number."
                : accountType === "operator"
                ? "Franchise operator credential updates require Super Admin verification. Once approved by Head Office, a secure single-use reset link is issued directly to your verified email."
                : "Regain immediate access to your flight itineraries, visa applications, and traveler records. Verified client accounts receive a time-limited reset link directly to their registered email."}
            </p>

            <div className="auth-showcase-benefits">
              <div className="auth-benefit-item">
                <i className="fa-solid fa-circle-check"></i>
                <span>Zero-trust backend verification</span>
              </div>
              <div className="auth-benefit-item">
                <i className="fa-solid fa-circle-check"></i>
                <span>Enforced 8+ char alphanumeric complexity</span>
              </div>
              <div className="auth-benefit-item">
                <i className="fa-solid fa-circle-check"></i>
                <span>Official Firebase Auth password encryption</span>
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

          {isResetMode ? (
            /* Set New Password Mode (from oobCode) */
            codeVerifying ? (
              <div className="reset-success-card">
                <div style={{ textAlign: "center", padding: "2rem 0" }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2rem", color: "var(--purple)" }}></i>
                  <p style={{ marginTop: "1rem", color: "#64748b" }}>Verifying security reset token...</p>
                </div>
              </div>
            ) : codeError ? (
              <div className="reset-success-card">
                <div className="reset-success-icon-badge" style={{ background: "#fee2e2", color: "#dc2626" }}>
                  <AlertCircle size={28} />
                </div>
                <div className="auth-form-header">
                  <h1>Reset Link Invalid</h1>
                  <p>{codeError}</p>
                </div>
                <div className="reset-actions-group">
                  <Link
                    to="/forgot-password"
                    onClick={() => {
                      setIsResetMode(false);
                      setCodeError("");
                    }}
                    className="auth-submit-btn reset-return-btn"
                  >
                    <span>Request New Reset Link</span>
                  </Link>
                </div>
              </div>
            ) : passwordResetSuccess ? (
              <div className="reset-success-card">
                <div className="reset-success-icon-badge">
                  <CheckCircle2 size={28} />
                </div>
                <div className="auth-form-header">
                  <h1>Password Reset Complete</h1>
                  <p>Your account password has been successfully updated according to registration standards.</p>
                </div>
                <div className="reset-actions-group">
                  <Link to="/login" className="auth-submit-btn reset-return-btn">
                    <i className="fa-solid fa-right-to-bracket"></i>
                    <span>Sign In to Your Account</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="reset-form-container">
                <div className="auth-form-header">
                  <div className="reset-header-icon-badge">
                    <Lock size={22} />
                  </div>
                  <h1>Set New Password</h1>
                  <p>
                    {verifiedEmail ? (
                      <>Creating a new secure password for <strong>{verifiedEmail}</strong>.</>
                    ) : (
                      "Enter your new password below."
                    )}
                  </p>
                </div>

                <form onSubmit={handleConfirmResetSubmit} className="auth-form" noValidate>
                  <div className="auth-input-group">
                    <label className="auth-input-label" htmlFor="new-password">
                      New Password <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <div className="auth-input-wrapper">
                      <Lock className="auth-input-icon" size={18} />
                      <input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        className="auth-input"
                        placeholder="Must be 8+ chars with uppercase, lowercase & number"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (error) setError("");
                        }}
                        autoComplete="new-password"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="auth-toggle-pwd"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        aria-label="Toggle password visibility"
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center" }}
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="auth-input-group">
                    <label className="auth-input-label" htmlFor="confirm-new-password">
                      Confirm New Password <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <div className="auth-input-wrapper">
                      <Lock className="auth-input-icon" size={18} />
                      <input
                        id="confirm-new-password"
                        type={showConfirmPassword ? "text" : "password"}
                        className="auth-input"
                        placeholder="Re-enter your new password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (error) setError("");
                        }}
                        autoComplete="new-password"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="auth-toggle-pwd"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label="Toggle password visibility"
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center" }}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="auth-field-error" role="alert" style={{ marginBottom: "0.75rem" }}>
                      <AlertCircle size={14} />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Password Requirements Checklist matching Registration */}
                  <div className="reset-notice-card" style={{ display: "flex", flexDirection: "column", gap: "0.35rem", padding: "0.85rem 1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.8125rem", color: newPassword.length >= 8 ? "#16a34a" : "#64748b" }}>
                      <i className={`fa-solid ${newPassword.length >= 8 ? "fa-circle-check" : "fa-circle-dot"}`} style={{ color: newPassword.length >= 8 ? "#16a34a" : "#94a3b8" }}></i>
                      <span>At least 8 characters in length</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.8125rem", color: /[A-Z]/.test(newPassword) ? "#16a34a" : "#64748b" }}>
                      <i className={`fa-solid ${/[A-Z]/.test(newPassword) ? "fa-circle-check" : "fa-circle-dot"}`} style={{ color: /[A-Z]/.test(newPassword) ? "#16a34a" : "#94a3b8" }}></i>
                      <span>Contains uppercase letter (A-Z)</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.8125rem", color: /[a-z]/.test(newPassword) ? "#16a34a" : "#64748b" }}>
                      <i className={`fa-solid ${/[a-z]/.test(newPassword) ? "fa-circle-check" : "fa-circle-dot"}`} style={{ color: /[a-z]/.test(newPassword) ? "#16a34a" : "#94a3b8" }}></i>
                      <span>Contains lowercase letter (a-z)</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.8125rem", color: /\d/.test(newPassword) ? "#16a34a" : "#64748b" }}>
                      <i className={`fa-solid ${/\d/.test(newPassword) ? "fa-circle-check" : "fa-circle-dot"}`} style={{ color: /\d/.test(newPassword) ? "#16a34a" : "#94a3b8" }}></i>
                      <span>Contains at least one number (0-9)</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.8125rem", color: newPassword && confirmPassword && newPassword === confirmPassword ? "#16a34a" : "#64748b" }}>
                      <i className={`fa-solid ${newPassword && confirmPassword && newPassword === confirmPassword ? "fa-circle-check" : "fa-circle-dot"}`} style={{ color: newPassword && confirmPassword && newPassword === confirmPassword ? "#16a34a" : "#94a3b8" }}></i>
                      <span>Passwords match</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={isLoading || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword) || newPassword !== confirmPassword}
                  >
                    {isLoading ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-shield-halved"></i>
                        <span>Reset Password</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )
          ) : isSuccess ? (
            /* Success State */
            <div className="reset-success-card">
              <div className="reset-success-icon-badge">
                <CheckCircle2 size={28} />
              </div>

              <div className="auth-form-header">
                <h1>{accountType === "operator" ? "Request Submitted" : "Check Your Email"}</h1>
                <p>
                  {accountType === "operator"
                    ? "Your Operator Password Reset Request has been queued for Super Admin review:"
                    : "We have dispatched password reset instructions to:"}
                </p>
              </div>

              <div className="reset-target-email-pill">
                <Mail size={15} />
                <span>{email.trim().toLowerCase()}</span>
              </div>

              <div className="reset-info-box">
                <p>
                  {accountType === "operator"
                    ? "For franchise security, an authorized Super Admin will verify your operator account and branch assignment. Once approved, an official Firebase reset link will be sent directly to this email."
                    : "Click the link in the email to choose a new password. If you don't see it within a minute, please check your spam or junk folder."}
                </p>
              </div>

              <div className="reset-actions-group">
                {accountType === "client" && (
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
                )}

                <Link to="/login" className="auth-submit-btn reset-return-btn">
                  <i className="fa-solid fa-right-to-bracket"></i>
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            /* Request Form */
            <div className="reset-form-container">
              {/* Account Type Selector Tabs */}
              <div className="reset-role-selector" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={accountType === "client"}
                  className={`reset-role-tab ${accountType === "client" ? "active" : ""}`}
                  onClick={() => {
                    setAccountType("client");
                    setError("");
                  }}
                >
                  <i className="fa-solid fa-user"></i>
                  <span>Traveler / Client</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={accountType === "operator"}
                  className={`reset-role-tab ${accountType === "operator" ? "active" : ""}`}
                  onClick={() => {
                    setAccountType("operator");
                    setError("");
                  }}
                >
                  <i className="fa-solid fa-store"></i>
                  <span>Franchise Operator</span>
                </button>
              </div>

              <div className="auth-form-header">
                <div className="reset-header-icon-badge">
                  {accountType === "operator" ? <Building size={22} /> : <Mail size={22} />}
                </div>
                <h1>{accountType === "operator" ? "Operator Password Reset" : "Reset Password"}</h1>
                <p>
                  {accountType === "operator"
                    ? "Submit your verified operator email for Head Office Super Admin review."
                    : "Enter your registered client email to receive a password reset link."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="auth-form" noValidate>
                <div className="auth-input-group">
                  <label className="auth-input-label" htmlFor="reset-email">
                    {accountType === "operator" ? "Registered Operator Email" : "Registered Client Email"}
                  </label>
                  <div className={`auth-input-wrapper ${error ? "has-error" : ""}`}>
                    <Mail className="auth-input-icon" size={18} />
                    <input
                      id="reset-email"
                      type="email"
                      className="auth-input"
                      placeholder={accountType === "operator" ? "operator.branch@fairfly.com" : "client.name@example.com"}
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

                {accountType === "operator" && (
                  <>
                    <div className="auth-input-group">
                      <label className="auth-input-label" htmlFor="reset-branch">
                        Assigned Branch Name (Optional)
                      </label>
                      <div className="auth-input-wrapper">
                        <Building className="auth-input-icon" size={18} />
                        <input
                          id="reset-branch"
                          type="text"
                          className="auth-input"
                          placeholder="e.g. FairFly Cebu Branch"
                          value={branchName}
                          onChange={(e) => setBranchName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="auth-input-group">
                      <label className="auth-input-label" htmlFor="reset-reason">
                        Reason for Reset Request
                      </label>
                      <div className="auth-input-wrapper">
                        <HelpCircle className="auth-input-icon" size={18} />
                        <input
                          id="reset-reason"
                          type="text"
                          className="auth-input"
                          placeholder="e.g. Forgotten password, locked out"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="reset-notice-card">
                  <i className="fa-solid fa-shield-halved"></i>
                  <div>
                    {accountType === "operator" ? (
                      <>
                        <strong>Super Admin Review Policy:</strong> For operational integrity, Operator password resets are not instantaneous. An authorized Super Admin will verify your branch account before issuing an official Firebase reset link.
                      </>
                    ) : (
                      <>
                        <strong>Client Portal Notice:</strong> This reset service delivers an instant, encrypted 60-minute password reset link directly to your registered client inbox.
                      </>
                    )}
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
                      <span>{accountType === "operator" ? "Submitting Request..." : "Verifying & Sending..."}</span>
                    </>
                  ) : (
                    <>
                      <i className={accountType === "operator" ? "fa-solid fa-paper-plane" : "fa-solid fa-paper-plane"}></i>
                      <span>{accountType === "operator" ? "Submit Reset Request" : "Send Reset Link"}</span>
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
