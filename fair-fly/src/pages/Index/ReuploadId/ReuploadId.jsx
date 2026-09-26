import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, ShieldAlert, CheckCircle2, Lock } from 'lucide-react';
import logo from '/FairflyLogo.png';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import ValidIdUpload from '../../../components/Shared/ValidIdUpload/ValidIdUpload';
import { reuploadId } from '../../../services/authService';
import { uploadFileToBackend } from '../../../utils/fileUploadApi';
import './reupload-id.css';

export default function ReuploadId() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();

  const emailParam = searchParams.get('email') || '';
  const tokenParam = searchParams.get('token') || '';

  const [idType, setIdType] = useState('');
  const [idFront, setIdFront] = useState(null);
  const [idBack, setIdBack] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const isFormValid = Boolean(idType && idFront && idBack && emailParam && tokenParam);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (idFront?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(idFront.previewUrl);
      }
      if (idBack?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(idBack.previewUrl);
      }
    };
  }, [idFront, idBack]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Upload Front ID only when submit button is clicked
      let finalFrontUrl = idFront.url;
      if (idFront.file) {
        const resFront = await uploadFileToBackend(idFront.file, 'client_ids');
        finalFrontUrl = resFront.url;
      }

      // Upload Back ID only when submit button is clicked
      let finalBackUrl = idBack.url;
      if (idBack.file) {
        const resBack = await uploadFileToBackend(idBack.file, 'client_ids');
        finalBackUrl = resBack.url;
      }

      reuploadId(
        {
          email: emailParam.trim().toLowerCase(),
          token: tokenParam.trim(),
          idType,
          idFrontUrl: finalFrontUrl,
          idBackUrl: finalBackUrl,
          idFrontName: idFront.name || null,
          idBackName: idBack.name || null,
        },
        (res) => {
          setIsSuccess(true);
          addToast(res?.message || 'Government ID re-uploaded successfully!', 'success');
        },
        (err) => {
          addToast(err?.message || 'Failed to re-upload ID. Please make sure the link from your email is valid.', 'error');
        },
        setIsSubmitting
      );
    } catch (err) {
      console.error('Error uploading ID during re-upload:', err);
      setIsSubmitting(false);
      addToast(err?.message || 'Failed to upload ID files. Please try again.', 'error');
    }
  };

  const isMissingParams = !emailParam || !tokenParam;

  return (
    <div className="auth-split-layout">
      {/* 50% Left Showcase */}
      <div className="auth-side-showcase">
        <img
          src="/auth/register-hero.jpg"
          alt="FairFly Document Verification"
          className="auth-showcase-bg"
          onError={(e) => {
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
              <i className="fa-solid fa-id-card-clip"></i>
              <span>Identity Verification</span>
            </div>

            <h2 className="auth-showcase-title">
              Secure Document <span className="auth-showcase-title-highlight">Compliance</span>.
            </h2>

            <p className="auth-showcase-desc">
              Standardized Philippine consular and document processing requires certified traveler verification. Uploading a clear government ID protects your transactions and confirms account authenticity.
            </p>

            <div className="auth-showcase-benefits">
              <div className="auth-benefit-item">
                <i className="fa-solid fa-circle-check"></i>
                <span>Direct review by certified compliance administrators</span>
              </div>
              <div className="auth-benefit-item">
                <i className="fa-solid fa-circle-check"></i>
                <span>Encrypted cloud storage with token-based access</span>
              </div>
              <div className="auth-benefit-item">
                <i className="fa-solid fa-circle-check"></i>
                <span>Immediate account activation upon verification</span>
              </div>
            </div>
          </div>

          <div className="auth-showcase-stats">
            <div className="auth-stat-item">
              <span className="auth-stat-val">100%</span>
              <span className="auth-stat-label">Verified Travelers</span>
            </div>
            <div className="auth-stat-item">
              <span className="auth-stat-val">Zero</span>
              <span className="auth-stat-label">Spam Accounts</span>
            </div>
            <div className="auth-stat-item">
              <span className="auth-stat-val">24hr</span>
              <span className="auth-stat-label">Average Review SLA</span>
            </div>
          </div>
        </div>
      </div>

      {/* 50% Right Form */}
      <div className="auth-side-form">
        <div className="auth-form-inner">
          <Link to="/login" className="auth-back-link">
            <ArrowLeft size={16} />
            <span>Back to Sign In</span>
          </Link>

          <div className="auth-mobile-brand">
            <img src={logo} alt="Fairfly Logo" className="auth-mobile-logo" />
            <span className="auth-mobile-name">Fairfly</span>
          </div>

          {isSuccess ? (
            <div className="reupload-success-panel">
              <div className="reupload-success-badge">
                <CheckCircle2 size={36} />
              </div>
              <h2>ID Resubmitted Successfully!</h2>
              <p>
                Thank you! Your government ID has been received and forwarded to our administration team for priority review.
              </p>
              <div className="reupload-success-meta">
                <span>Notification email will be sent to:</span>
                <strong>{emailParam}</strong>
              </div>
              <Link to="/login" className="auth-submit-btn" style={{ textDecoration: 'none', justifyContent: 'center' }}>
                Return to Sign In
              </Link>
            </div>
          ) : isMissingParams ? (
            <div className="reupload-invalid-panel">
              <div className="reupload-invalid-badge">
                <ShieldAlert size={36} />
              </div>
              <h2>Invalid Re-upload Link</h2>
              <p>
                The link you clicked appears to be incomplete or expired. Please check the email sent by FairFly and click the button or copy the link directly.
              </p>
              <Link to="/login" className="auth-submit-btn" style={{ textDecoration: 'none', justifyContent: 'center' }}>
                Return to Sign In
              </Link>
            </div>
          ) : (
            <>
              <div className="auth-form-header">
                <h1>Re-upload Government ID</h1>
                <p>
                  Submit a clear copy of your valid government ID for account verification.
                </p>
                <div className="reupload-account-pill">
                  <Lock size={13} />
                  <span>Account: <strong>{emailParam}</strong></span>
                </div>
              </div>

              <form className="auth-form" onSubmit={handleSubmit}>
                <ValidIdUpload
                  idType={idType}
                  onChangeIdType={setIdType}
                  idFront={idFront}
                  idBack={idBack}
                  onUploadFront={setIdFront}
                  onUploadBack={setIdBack}
                  onRemoveFront={() => {
                    if (idFront?.previewUrl?.startsWith('blob:')) {
                      URL.revokeObjectURL(idFront.previewUrl);
                    }
                    setIdFront(null);
                  }}
                  onRemoveBack={() => {
                    if (idBack?.previewUrl?.startsWith('blob:')) {
                      URL.revokeObjectURL(idBack.previewUrl);
                    }
                    setIdBack(null);
                  }}
                  disabled={isSubmitting}
                />

                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={!isFormValid || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      <span>Uploading ID & Submitting...</span>
                    </>
                  ) : (
                    <span>Submit ID for Admin Review</span>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
