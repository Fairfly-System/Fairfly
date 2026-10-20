import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/UI/toast/ToastProvider';
import Breadcrumbs from '../../../components/UI/Breadcrumbs/Breadcrumbs';
import ProfileEditModal from '../../../components/Shared/ProfileEditModal/ProfileEditModal';
import {
  fetchUserProfile,
  updateUserProfile,
  changePasswordApi
} from '../../../services/authService';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../../../firebase';
import './profile.css';

/**
 * ProfilePage — System-wide View Profile & Edit Information view.
 * Dynamically tailored for Admin, Operator, and Client roles.
 */
export default function ProfilePage() {
  const { user, userDetails, userToken } = useAuthContext();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Change Password State
  const [passwordStep, setPasswordStep] = useState(1); // 1 = Verify Current, 2 = Set New
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const role = userDetails?.role || 'client';
  const isOperator = role === 'operator' || role === 'branch_operator';
  const isAdmin = role === 'admin';

  // Breadcrumbs configuration
  const breadcrumbs = [
    { label: isAdmin ? 'Admin' : isOperator ? 'Operator' : 'Home', to: `/${role}` },
    { label: 'My Profile' }
  ];

  // Fetch full user profile
  const loadProfile = useCallback(async () => {
    let token = userToken;
    if (!token && auth.currentUser) {
      try {
        token = await auth.currentUser.getIdToken();
      } catch (err) {
        console.warn('Could not fetch token:', err);
      }
    }

    if (!token) {
      setLoading(false);
      return;
    }

    fetchUserProfile(
      token,
      (data) => {
        if (data) setProfileData(data);
        setLoading(false);
      },
      (error) => {
        console.warn('Profile fetch notice:', error);
        // Fallback to AuthContext details
        setProfileData(userDetails || null);
        setLoading(false);
      },
      setLoading
    );
  }, [userToken, userDetails]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Derive initials for avatar fallback
  const getInitials = () => {
    const name = profileData?.fullName || profileData?.branchName || profileData?.name || user?.displayName;
    if (name) {
      return name
        .split(' ')
        .filter(Boolean)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email ? user.email[0].toUpperCase() : 'U';
  };

  // Derive human-readable role title
  const getRoleTitle = () => {
    if (isAdmin) {
      const isSuper = profileData?.isSuperAdmin === true || profileData?.email === 'admin@gmail.com' || user?.email === 'admin@gmail.com';
      return isSuper ? 'Super Administrator' : 'Support Administrator';
    }
    if (isOperator) {
      return 'Authorized Branch Operator';
    }
    return 'Registered Traveler / Client';
  };

  // Derive human-readable role icon
  const getRoleIcon = () => {
    if (isAdmin) {
      const isSuper = profileData?.isSuperAdmin === true || profileData?.email === 'admin@gmail.com' || user?.email === 'admin@gmail.com';
      return isSuper ? 'fa-solid fa-crown' : 'fa-solid fa-user-shield';
    }
    if (isOperator) {
      return 'fa-solid fa-building-user';
    }
    return 'fa-solid fa-user-check';
  };

  // Save basic profile edits
  const handleSaveProfile = async (formData) => {
    let token = userToken;
    if (!token && auth.currentUser) {
      token = await auth.currentUser.getIdToken();
    }

    updateUserProfile(
      token,
      formData,
      (response) => {
        addToast(response?.message || 'Profile updated successfully!', 'success');
        setIsEditModalOpen(false);
        loadProfile();
      },
      (error) => {
        console.error('Error updating profile:', error);
        addToast(error?.message || 'Failed to update profile details', 'error');
      },
      setIsSavingProfile
    );
  };

  // Step 1: Verify Current Password via Firebase Auth client SDK
  const handleVerifyCurrentPassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!currentPassword) {
      setPasswordError('Please enter your current password to continue.');
      return;
    }

    if (!auth.currentUser || !auth.currentUser.email) {
      setPasswordError('Authentication session not found. Please log in again.');
      return;
    }

    setIsVerifyingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Force fresh token refresh so backend gets recent auth_time
      await auth.currentUser.getIdToken(true);

      setIsVerifyingPassword(false);
      setPasswordStep(2);
      addToast('Current password verified successfully. You may now set your new password.', 'success');
    } catch (err) {
      setIsVerifyingPassword(false);
      console.error('Password verification error:', err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPasswordError('The current password you entered is incorrect. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setPasswordError('Too many failed attempts. Please wait a few moments before trying again.');
      } else {
        setPasswordError('Verification failed: ' + (err.message || 'Please check your password.'));
      }
    }
  };

  // Step 2 & 3: Submit New Password via backend API
  const handleSubmitNewPassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!newPassword || !strongPasswordRegex.test(newPassword)) {
      setPasswordError('New password must be at least 8 characters and include uppercase, lowercase, and a number.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('The new password and password confirmation do not match.');
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError('Your new password must be different from your current password.');
      return;
    }

    setIsSubmittingPassword(true);
    try {
      // Get fresh token with updated auth_time
      const freshToken = await auth.currentUser.getIdToken();

      changePasswordApi(
        freshToken,
        { newPassword, confirmPassword },
        (res) => {
          setIsSubmittingPassword(false);
          addToast(res?.message || 'Password changed successfully!', 'success');
          // Reset password form state
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setPasswordStep(1);
          setPasswordError('');
          setActiveTab('overview');
        },
        (err) => {
          setIsSubmittingPassword(false);
          console.error('Error updating password:', err);
          setPasswordError(err?.message || 'Failed to update password. Please verify current credentials again.');
        },
        setIsSubmittingPassword
      );
    } catch (tokenErr) {
      setIsSubmittingPassword(false);
      setPasswordError('Failed to refresh authentication token: ' + tokenErr.message);
    }
  };

  // Reset password form
  const handleCancelPasswordChange = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordStep(1);
    setPasswordError('');
    setActiveTab('overview');
  };

  // Display fields fallback helper
  const displayVal = (val, fallback = 'Not specified') => {
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      return String(val);
    }
    return <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>{fallback}</span>;
  };

  const displayName = profileData?.fullName || profileData?.branchName || profileData?.name || userDetails?.fullName || userDetails?.name || user?.displayName || 'User Profile';
  const displayEmail = profileData?.email || user?.email || 'No email associated';
  const displayPhone = profileData?.phone || profileData?.contactNumber || userDetails?.phone || userDetails?.contactNumber;
  const displayAddress = profileData?.address || userDetails?.address;
  const accountStatus = profileData?.status || userDetails?.status || 'Active';
  const createdAtFormatted = profileData?.createdAt ? new Date(profileData.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Established';

  return (
    <div className="profile-page-wrapper page-fade-in">

      {/* Breadcrumbs for non-client users */}
      {userDetails.role !== 'client' && <Breadcrumbs items={breadcrumbs} />}

      {/* ── Top Profile Header Card ───────────────────────────────── */}
      <header className="profile-header-card">
        <div className="profile-header-left">
          <div className="profile-avatar-circle" aria-label="Profile Avatar">
            {getInitials()}
          </div>
          <div className="profile-header-titles">
            <h1 className="profile-title-name">{displayName}</h1>
            <div className="profile-role-badge-row">
              <span className="status-pill status-pill-active" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <i className={getRoleIcon()}></i>
                {getRoleTitle()}
              </span>
              <span className={`status-pill ${accountStatus.toLowerCase() === 'active' ? 'status-pill-active' : 'status-pill-pending'}`}>
                {accountStatus}
              </span>
              {isOperator && profileData?.isQualified && (
                <span className="status-pill status-pill-info" title="Qualified for specialized travel services">
                  <i className="fa-solid fa-certificate"></i> Qualified Partner
                </span>
              )}
            </div>
            <div className="profile-sub-contact">
              <span className="profile-sub-contact-item">
                <i className="fa-regular fa-envelope"></i> {displayEmail}
              </span>
              {displayPhone && (
                <span className="profile-sub-contact-item">
                  <i className="fa-solid fa-phone"></i> {displayPhone}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="profile-header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setIsEditModalOpen(true)}
            id="btn-edit-profile"
          >
            <i className="fa-solid fa-pen-to-square"></i>
            <span>Edit Information</span>
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setActiveTab('security');
              setPasswordStep(1);
            }}
            id="btn-change-password-tab"
          >
            <i className="fa-solid fa-lock"></i>
            <span>Change Password</span>
          </button>
        </div>
      </header>

      {/* ── Tabs Navigation Bar ───────────────────────────────────── */}
      <nav className="profile-tabs-bar" aria-label="Profile Sections">
        <button
          type="button"
          className={`profile-tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <i className="fa-regular fa-id-card"></i>
          <span>Overview & Personal Info</span>
        </button>
        <button
          type="button"
          className={`profile-tab-button ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <i className="fa-solid fa-shield-halved"></i>
          <span>Security & Password</span>
        </button>
      </nav>

      {/* ── TAB 1: OVERVIEW & PERSONAL INFO ────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="profile-cards-grid">
          {/* Card 1: Basic Information */}
          <section className="profile-content-card">
            <div className="profile-card-header">
              <h2 className="profile-card-title">
                <i className="fa-solid fa-address-book"></i>
                <span>Basic Contact Information</span>
              </h2>
              <button
                type="button"
                className="icon-btn edit"
                title="Edit basic information"
                onClick={() => setIsEditModalOpen(true)}
              >
                <i className="fa-solid fa-pen"></i>
              </button>
            </div>

            <div className="profile-fields-list">
              <div className="profile-field-row">
                <span className="profile-field-label">
                  {isOperator ? 'Branch Name' : 'Full Name'}
                </span>
                <span className="profile-field-value" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span>{displayVal(displayName)}</span>
                  {isOperator && (
                    <span
                      className="status-pill status-pill-neutral"
                      style={{
                        fontSize: '0.6875rem',
                        padding: '0.125rem 0.45rem',
                        lineHeight: 1.2,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                      title="Branch name is assigned and managed exclusively by Head Office Administrators"
                    >
                      <i className="fa-solid fa-lock" style={{ fontSize: '0.625rem' }}></i>
                      Admin Managed
                    </span>
                  )}
                </span>
              </div>

              {isOperator && profileData?.fullName && (
                <div className="profile-field-row">
                  <span className="profile-field-label">Representative Name</span>
                  <span className="profile-field-value">{displayVal(profileData.fullName)}</span>
                </div>
              )}

              {!isOperator && (profileData?.firstName || profileData?.lastName) && (
                <>
                  <div className="profile-field-row">
                    <span className="profile-field-label">First Name</span>
                    <span className="profile-field-value">{displayVal(profileData?.firstName)}</span>
                  </div>
                  <div className="profile-field-row">
                    <span className="profile-field-label">Middle Name / M.I.</span>
                    <span className="profile-field-value">{displayVal(profileData?.middleName || profileData?.middleInitial, 'None')}</span>
                  </div>
                  <div className="profile-field-row">
                    <span className="profile-field-label">Last Name</span>
                    <span className="profile-field-value">{displayVal(profileData?.lastName)}</span>
                  </div>
                </>
              )}

              <div className="profile-field-row">
                <span className="profile-field-label">Email Address</span>
                <span className="profile-field-value">
                  {displayEmail}{' '}
                  {profileData?.emailVerified && (
                    <i className="fa-solid fa-circle-check" style={{ color: 'var(--complete-green)', marginLeft: '0.25rem' }} title="Verified Email"></i>
                  )}
                </span>
              </div>

              <div className="profile-field-row">
                <span className="profile-field-label">Contact Phone</span>
                <span className="profile-field-value">{displayVal(displayPhone, 'None on file')}</span>
              </div>

              <div className="profile-field-row">
                <span className="profile-field-label">
                  {isOperator ? 'Branch Location' : isAdmin ? 'Location' : 'Mailing Address'}
                </span>
                <span className="profile-field-value">{displayVal(displayAddress, 'No address registered')}</span>
              </div>
            </div>
          </section>

          {/* Card 2: Account & System Identity */}
          <section className="profile-content-card">
            <div className="profile-card-header">
              <h2 className="profile-card-title">
                <i className="fa-solid fa-shield-halved"></i>
                <span>Account & Access Level</span>
              </h2>
            </div>

            <div className="profile-fields-list">
              <div className="profile-field-row">
                <span className="profile-field-label">Access Level</span>
                <span className="profile-field-value" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                  <i className={getRoleIcon()} style={{ color: 'var(--purple)', fontSize: '0.875rem' }}></i>
                  <strong>{getRoleTitle()}</strong>
                </span>
              </div>

              <div className="profile-field-row">
                <span className="profile-field-label">Account Status</span>
                <span className="profile-field-value">
                  <span className={`status-pill ${accountStatus.toLowerCase() === 'active' ? 'status-pill-active' : 'status-pill-pending'}`}>
                    {accountStatus}
                  </span>
                </span>
              </div>

              <div className="profile-field-row">
                <span className="profile-field-label">Member Since</span>
                <span className="profile-field-value">{createdAtFormatted}</span>
              </div>

              {profileData?.updatedAt && (
                <div className="profile-field-row">
                  <span className="profile-field-label">Last Updated</span>
                  <span className="profile-field-value">
                    {new Date(profileData.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}

              <div className="profile-field-row">
                <span className="profile-field-label">System Account ID</span>
                <span className="profile-field-value mono">
                  {user?.uid || profileData?.id || '—'}
                </span>
              </div>
            </div>
          </section>

          {/* Card 3: Role-Specific Operational Details */}
          {isAdmin && (
            <section className="profile-content-card full-width-card">
              <div className="profile-card-header">
                <h2 className="profile-card-title">
                  <i className="fa-solid fa-user-shield"></i>
                  <span>Administrative Scope & Operational Duties</span>
                </h2>
              </div>
              <div className="profile-fields-list">
                <div className="profile-field-row">
                  <span className="profile-field-label">Administration Tier</span>
                  <span className="profile-field-value">
                    {profileData?.isSuperAdmin ? 'Super Administrator (Full System Authority)' : 'Support Administrator'}
                  </span>
                </div>
                <div className="profile-field-row">
                  <span className="profile-field-label">Branch Assignments</span>
                  <span className="profile-field-value">
                    {profileData?.isSuperAdmin
                      ? 'System-wide oversight across all branch franchises'
                      : Array.isArray(profileData?.assignedOperators) && profileData.assignedOperators.length > 0
                        ? `${profileData.assignedOperators.length} assigned branch operator(s)`
                        : 'Unrestricted regional support'}
                  </span>
                </div>
                <div className="profile-field-row">
                  <span className="profile-field-label">Security Protocol</span>
                  <span className="profile-field-value">
                    Active zero-trust token session with automatic privilege validation
                  </span>
                </div>
              </div>
            </section>
          )}

          {isOperator && (
            <section className="profile-content-card full-width-card">
              <div className="profile-card-header">
                <h2 className="profile-card-title">
                  <i className="fa-solid fa-store"></i>
                  <span>Franchise Branch Operational Details</span>
                </h2>
              </div>
              <div className="profile-fields-list">
                <div className="profile-field-row">
                  <span className="profile-field-label">Qualification Status</span>
                  <span className="profile-field-value">
                    {profileData?.isQualified ? (
                      <span className="status-pill status-pill-active">
                        <i className="fa-solid fa-check"></i> Certified for Special Travel Procedures
                      </span>
                    ) : (
                      <span className="status-pill status-pill-warning">
                        Standard Procedural Catalog
                      </span>
                    )}
                  </span>
                </div>
                <div className="profile-field-row">
                  <span className="profile-field-label">Branch Authority</span>
                  <span className="profile-field-value">
                    Authorized to schedule consultations, draft service quotations, and finalize e-receipt fulfillment.
                  </span>
                </div>
                <div className="profile-field-row">
                  <span className="profile-field-label">Branch Governance</span>
                  <span className="profile-field-value" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span>Registered Branch: <strong>{profileData?.branchName || displayName}</strong></span>
                    <span
                      className="status-pill status-pill-neutral"
                      style={{
                        fontSize: '0.6875rem',
                        padding: '0.125rem 0.45rem',
                        lineHeight: 1.2,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                      title="Branch name is assigned and managed exclusively by Head Office Administrators"
                    >
                      <i className="fa-solid fa-lock" style={{ fontSize: '0.625rem' }}></i>
                      Admin Managed (Read-Only)
                    </span>
                  </span>
                </div>
                <div className="profile-field-row">
                  <span className="profile-field-label">Public Directory</span>
                  <span className="profile-field-value">
                    Displayed in FairFly "Our Branches" directory with customer contact links.
                  </span>
                </div>
              </div>
            </section>
          )}

          {!isAdmin && !isOperator && (
            <section className="profile-content-card full-width-card">
              <div className="profile-card-header">
                <h2 className="profile-card-title">
                  <i className="fa-solid fa-id-badge"></i>
                  <span>Identity Verification & Document Status</span>
                </h2>
              </div>
              <div className="profile-fields-list">
                <div className="profile-field-row">
                  <span className="profile-field-label">Document Type</span>
                  <span className="profile-field-value">
                    {displayVal(profileData?.idType, 'Government Issued ID')}
                  </span>
                </div>
                <div className="profile-field-row">
                  <span className="profile-field-label">Verification Status</span>
                  <span className="profile-field-value">
                    <span className={`status-pill ${
                      (profileData?.approvalStatus || '').toLowerCase() === 'rejected'
                        ? 'status-pill-disabled'
                        : (profileData?.approvalStatus || '').toLowerCase() === 'pending'
                        ? 'status-pill-pending'
                        : 'status-pill-active'
                    }`}>
                      {profileData?.approvalStatus || 'Approved & Verified'}
                    </span>
                  </span>
                </div>
                {profileData?.idSubmittedAt && (
                  <div className="profile-field-row">
                    <span className="profile-field-label">Submission Date</span>
                    <span className="profile-field-value">
                      {new Date(profileData.idSubmittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                )}
                <div className="profile-field-row">
                  <span className="profile-field-label">Client Portal Access</span>
                  <span className="profile-field-value">
                    Full self-service access to request service workflows, schedule branch appointments, and track fulfillments.
                  </span>
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      {/* ── TAB 2: SECURITY & PASSWORD WORKFLOW ─────────────────────── */}
      {activeTab === 'security' && (
        <div className="security-workflow-card">
          <section className="profile-content-card">
            <div className="profile-card-header">
              <h2 className="profile-card-title">
                <i className="fa-solid fa-lock"></i>
                <span>Change Account Password</span>
              </h2>
            </div>

            {passwordError && (
              <div className="status-pill status-pill-error" style={{ padding: '0.625rem 0.875rem', lineHeight: '1.4' }}>
                <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '0.35rem' }}></i>
                {passwordError}
              </div>
            )}

            {/* Step indicator banner */}
            <div className="security-step-banner">
              <div className="security-step-number-pill">
                {passwordStep}
              </div>
              <div>
                <strong>
                  {passwordStep === 1 ? 'Step 1: Verify Current Password' : 'Step 2: Enter New Password'}
                </strong>
                <p style={{ margin: '0.125rem 0 0', fontSize: '0.8125rem', opacity: 0.9 }}>
                  {passwordStep === 1
                    ? 'To safeguard your account, confirm your current password before creating a new one.'
                    : 'Current password verified! Enter your new password below.'}
                </p>
              </div>
            </div>

            {/* STEP 1: Current Password Verification Form */}
            {passwordStep === 1 && (
              <form className="form-column" onSubmit={handleVerifyCurrentPassword} style={{ gap: '1.25rem' }}>
                <div className="form-column">
                  <label className="form-label" htmlFor="current-password-input">
                    Current Password <span style={{ color: 'var(--error-red)' }}>*</span>
                  </label>
                  <div className="password-input-group">
                    <input
                      id="current-password-input"
                      type={showCurrentPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Enter your current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      disabled={isVerifyingPassword}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                    >
                      <i className={showCurrentPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}></i>
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleCancelPasswordChange}
                    disabled={isVerifyingPassword}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isVerifyingPassword || !currentPassword.trim()}
                    id="btn-verify-current-pwd"
                  >
                    {isVerifyingPassword ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-arrow-right"></i>
                        <span>Verify & Continue</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: New Password Form (Only rendered after Step 1 passes) */}
            {passwordStep === 2 && (
              <form className="form-column" onSubmit={handleSubmitNewPassword} style={{ gap: '1.25rem' }}>
                <div className="form-column">
                  <label className="form-label" htmlFor="new-password-input">
                    New Password <span style={{ color: 'var(--error-red)' }}>*</span>
                  </label>
                  <div className="password-input-group">
                    <input
                      id="new-password-input"
                      type={showNewPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Enter new password (8+ chars, upper, lower, number)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      disabled={isSubmittingPassword}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                    >
                      <i className={showNewPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}></i>
                    </button>
                  </div>
                </div>

                <div className="form-column">
                  <label className="form-label" htmlFor="confirm-new-password-input">
                    Confirm New Password <span style={{ color: 'var(--error-red)' }}>*</span>
                  </label>
                  <div className="password-input-group">
                    <input
                      id="confirm-new-password-input"
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isSubmittingPassword}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
                    >
                      <i className={showConfirmPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}></i>
                    </button>
                  </div>
                </div>

                <div className="password-policy-box">
                  <div className={`policy-item ${newPassword.length >= 8 ? 'ok' : 'pending'}`}>
                    <i className={`fa-solid ${newPassword.length >= 8 ? 'fa-circle-check' : 'fa-circle-dot'}`}></i>
                    <span>At least 8 characters in length</span>
                  </div>
                  <div className={`policy-item ${/[A-Z]/.test(newPassword) ? 'ok' : 'pending'}`}>
                    <i className={`fa-solid ${/[A-Z]/.test(newPassword) ? 'fa-circle-check' : 'fa-circle-dot'}`}></i>
                    <span>Contains uppercase letter (A-Z)</span>
                  </div>
                  <div className={`policy-item ${/[a-z]/.test(newPassword) ? 'ok' : 'pending'}`}>
                    <i className={`fa-solid ${/[a-z]/.test(newPassword) ? 'fa-circle-check' : 'fa-circle-dot'}`}></i>
                    <span>Contains lowercase letter (a-z)</span>
                  </div>
                  <div className={`policy-item ${/\d/.test(newPassword) ? 'ok' : 'pending'}`}>
                    <i className={`fa-solid ${/\d/.test(newPassword) ? 'fa-circle-check' : 'fa-circle-dot'}`}></i>
                    <span>Contains at least one number (0-9)</span>
                  </div>
                  <div className={`policy-item ${newPassword && confirmPassword && newPassword === confirmPassword ? 'ok' : 'pending'}`}>
                    <i className={`fa-solid ${newPassword && confirmPassword && newPassword === confirmPassword ? 'fa-circle-check' : 'fa-circle-dot'}`}></i>
                    <span>Password confirmation matches</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleCancelPasswordChange}
                    disabled={isSubmittingPassword}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSubmittingPassword || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword) || newPassword !== confirmPassword}
                    id="btn-submit-new-pwd"
                  >
                    {isSubmittingPassword ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-shield-halved"></i>
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}

      {/* ── Edit Profile Modal ────────────────────────────────────── */}
      <ProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialData={profileData || userDetails}
        role={role}
        onSave={handleSaveProfile}
        isLoading={isSavingProfile}
      />
    </div>
  );
}
