import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Mail, ArrowLeft, CheckCircle2, RotateCw } from 'lucide-react';
import './reset-password.css';
import logo from '/FairflyLogo.png';
import { auth } from '../../../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import { requestClientPasswordReset } from '../../../services/authService';
import toFriendlyMessage from '../../../utils/friendlyErrors';

export default function ResetPassword() {
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Handle resend countdown timer
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
      setError('Email address is required.');
      return false;
    }
    if (!emailRegex.test(val.trim())) {
      setError('Please enter a valid email address.');
      return false;
    }
    setError('');
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

    // 1. Verify Client role via secure Backend API first
    requestClientPasswordReset(
      trimmedEmail,
      async (backendRes) => {
        try {
          // 2. Dispatch official Firebase password reset verification email
          await sendPasswordResetEmail(auth, trimmedEmail);
          setIsSuccess(true);
          setCountdown(60); // 60s cooldown
          addToast('Verification email sent! Please check your inbox.', 'success');
        } catch (firebaseErr) {
          console.error('Firebase reset error:', firebaseErr);
          // If already verified by backend, we still acknowledge or report friendly message
          setIsSuccess(true);
          setCountdown(60);
          addToast('Verification request processed. Please check your inbox.', 'success');
        }
      },
      (backendErr) => {
        const errorMsg = backendErr?.message || 'Could not verify account for password reset.';
        setError(errorMsg);
        addToast(toFriendlyMessage(backendErr, errorMsg), 'error');
      },
      setIsLoading
    );
  };

  const handleResend = () => {
    if (countdown > 0 || isLoading) return;
    handleSubmit();
  };

  return (
    <main className="reset-page page-fade-in">
      <div className="reset-container">
        <Link to="/login" className="back-button">
          <ArrowLeft size={16} />
          <span>Back to Sign In</span>
        </Link>

        <div className="reset-card card">
          <div className="reset-header">
            <Link to="/home">
              <img src={logo} alt="FairFly Logo" className="logo" />
            </Link>

            <div className="reset-role-badge">
              <i className="fa-solid fa-shield-halved"></i>
              <span>Client Account Recovery</span>
            </div>

            <h1>{isSuccess ? 'Verification Email Sent' : 'Reset Password'}</h1>
            <p>
              {isSuccess
                ? 'Check your inbox for your secure verification link'
                : 'Enter your registered client email to receive a password reset link'}
            </p>
          </div>

          {isSuccess ? (
            /* Success State */
            <div className="reset-success-view">
              <div className="success-icon-wrap">
                <i className="fa-solid fa-envelope-circle-check"></i>
              </div>

              <div className="success-message-box">
                <p className="success-lead">
                  We have sent an email verification button to:
                </p>
                <p className="success-email-highlight">{email.trim().toLowerCase()}</p>
                <p className="success-instructions">
                  Click the password reset button in the email to securely choose a new password. If you don't see it within a few moments, please check your spam or junk folder.
                </p>
              </div>

              <div className="reset-actions">
                <button
                  type="button"
                  className="resend-button"
                  onClick={handleResend}
                  disabled={countdown > 0 || isLoading}
                >
                  <RotateCw size={15} className={isLoading ? 'spinning' : ''} />
                  <span>
                    {countdown > 0
                      ? `Resend Email in ${countdown}s`
                      : isLoading
                      ? 'Sending...'
                      : 'Resend Verification Email'}
                  </span>
                </button>

                <Link to="/login" className="btn-primary full-width reset-login-cta">
                  <i className="fa-solid fa-right-to-bracket"></i> Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            /* Request Form */
            <form onSubmit={handleSubmit} className="reset-form" noValidate>
              <div className="input-group">
                <label htmlFor="reset-email">Registered Client Email</label>
                <div className={`input-wrapper ${error ? 'has-error' : ''}`}>
                  <Mail className="icon" size={18} />
                  <input
                    id="reset-email"
                    type="email"
                    placeholder="client.name@example.com"
                    value={email}
                    onChange={handleEmailChange}
                    autoComplete="email"
                    required
                  />
                </div>
                {error && (
                  <p className="error-message" role="alert">
                    <i className="fa-solid fa-circle-exclamation"></i> {error}
                  </p>
                )}
              </div>

              <div className="client-notice-callout">
                <i className="fa-solid fa-circle-info"></i>
                <div>
                  <strong>Client Portal Notice:</strong> This password reset service is strictly designated for <em>FairFly Client</em> accounts. Franchise Operators and Administrators must contact Head Office Support directly for credential updates.
                </div>
              </div>

              <button
                type="submit"
                className="reset-submit-button"
                disabled={isLoading || !email.trim()}
              >
                {isLoading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Verifying & Sending...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane"></i> Send Verification Email
                  </>
                )}
              </button>

              <div className="reset-footer-links">
                <span>Remember your password?</span>{' '}
                <Link to="/login" className="reset-link-accent">
                  Sign In
                </Link>
              </div>
            </form>
          )}

          <div className="signup-switch-text">
            Don't have a client account?{' '}
            <Link to="/register">Create Account</Link>
          </div>
        </div>

        <div className="footer-text">
          FairFly Travel & Tours • Standardized Cloud Platform
        </div>
      </div>
    </main>
  );
}
