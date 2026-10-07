import React, { useState, useEffect, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../../firebase';
import Steps from './Steps/Steps';
import { useLightbox } from '../../UI/ImageLightbox/ImageLightbox';
import { useSubmittedRequirements } from '../../../hooks/useSubmittedRequirements';
import './service-tracker.css';

const CATEGORY_ICON_MAP = {
  'visa & embassy assistance': 'fa-solid fa-passport',
  'visa assistance': 'fa-solid fa-passport',
  'passport processing': 'fa-solid fa-id-card',
  'psa & civil documents': 'fa-regular fa-file-lines',
  'psa documents': 'fa-regular fa-file-lines',
  'airline ticketing': 'fa-solid fa-plane-departure',
  'airline tickets': 'fa-solid fa-plane-departure',
  'tour packages': 'fa-solid fa-map-location-dot',
  'travel insurance & hotels': 'fa-solid fa-hotel',
  'authentication & legalization': 'fa-solid fa-certificate',
  'other': 'fa-solid fa-boxes-stacked',
  'general services': 'fa-solid fa-concierge-bell'
};

export default function ClientServiceTracker({ service, onOpenReceipt }) {
  const { openLightbox } = useLightbox();
  const [showSteps, setShowSteps] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);
  const [inquiryRequirements, setInquiryRequirements] = useState([]);

  // Primary: Targeted single-document hook for normalized submittedRequirements
  const reqRefId = service?.submittedRequirementsId || null;
  const { requirements: hookedReqs } = useSubmittedRequirements(
    reqRefId,
    service?.submittedRequirements || service?.requirements || []
  );

  // Fallback: If legacy activeService document has no submittedRequirementsId or attached files, fetch from originating inquiry/quotation
  useEffect(() => {
    if (!service || reqRefId) return;

    const hasUploadedFiles = (list) => {
      if (!Array.isArray(list) || list.length === 0) return false;
      return list.some((r) => {
        if (!r || typeof r !== 'object') return false;
        const f = r.file;
        return !!(f?.url || (typeof f === 'string' && f.length > 0) || r.fileUrl || r.url || (typeof r.value === 'string' && r.value.startsWith('http')));
      });
    };

    const alreadyHasFiles = hasUploadedFiles(service.submittedRequirements) || hasUploadedFiles(service.requirements);
    if (alreadyHasFiles) return;

    const extractReqs = (data) => {
      if (Array.isArray(data?.requirements) && data.requirements.length > 0) return data.requirements;
      if (Array.isArray(data?.submittedRequirements) && data.submittedRequirements.length > 0) return data.submittedRequirements;
      return null;
    };

    let isMounted = true;

    const resolveFallbackReqs = async () => {
      try {
        if (service.inquiryId) {
          const inqSnap = await getDoc(doc(firestore, 'inquiries', service.inquiryId));
          if (inqSnap.exists()) {
            const reqs = extractReqs(inqSnap.data());
            if (reqs && reqs.length > 0) {
              if (isMounted) setInquiryRequirements(reqs);
              return;
            }
          }
        }

        if (service.quotationId) {
          const quoteSnap = await getDoc(doc(firestore, 'quotations', service.quotationId));
          if (quoteSnap.exists()) {
            const quoteData = quoteSnap.data();
            const quoteReqs = extractReqs(quoteData);
            if (quoteReqs && quoteReqs.length > 0) {
              if (isMounted) setInquiryRequirements(quoteReqs);
              return;
            }
          }
        }
      } catch (err) {
        console.warn('[ClientServiceTracker] Could not fetch fallback inquiry requirements:', err);
      }
    };

    resolveFallbackReqs();

    return () => {
      isMounted = false;
    };
  }, [service, reqRefId]);

  const requirementsList = useMemo(() => {
    if (Array.isArray(hookedReqs) && hookedReqs.length > 0) {
      return hookedReqs;
    }
    const hasUploadedFiles = (list) => {
      if (!Array.isArray(list) || list.length === 0) return false;
      return list.some((r) => {
        if (!r || typeof r !== 'object') return false;
        const f = r.file;
        return !!(f?.url || (typeof f === 'string' && f.length > 0) || r.fileUrl || r.url || (typeof r.value === 'string' && r.value.startsWith('http')));
      });
    };

    if (hasUploadedFiles(service?.submittedRequirements)) {
      return service.submittedRequirements;
    }
    if (hasUploadedFiles(service?.requirements)) {
      return service.requirements;
    }
    if (inquiryRequirements.length > 0) {
      return inquiryRequirements;
    }
    if (Array.isArray(service?.submittedRequirements) && service.submittedRequirements.length > 0) {
      return service.submittedRequirements;
    }
    if (Array.isArray(service?.requirements) && service.requirements.length > 0) {
      return service.requirements;
    }
    return [];
  }, [service, hookedReqs, inquiryRequirements]);

  if (!service) return null;

  const toggleSteps = () => setShowSteps(!showSteps);
  const toggleRequirements = () => setShowRequirements(!showRequirements);

  const stepsList = service.steps || [
    { status: 'Completed', title: 'Submit Service Request' },
    { status: 'Ongoing', title: 'Branch Document Review & Verification' },
    { status: 'Todo', title: 'Embassy / Agency Submission' },
    { status: 'Todo', title: 'Service Fulfillment & Document Release' }
  ];

  const completedCount = Array.isArray(service.steps)
    ? service.steps.filter((s) => s.status === 'Completed' || s.completed === true).length
    : 0;

  const totalSteps = Array.isArray(service.steps) ? service.steps.length : stepsList.length;
  const progressPct = service.progress !== undefined
    ? service.progress
    : totalSteps > 0
    ? Math.round((completedCount / totalSteps) * 100)
    : 0;

  const serviceTitle = service.serviceName || service.serviceType || service.title || 'Travel Service Request';
  const branchName = service.branchName || service.preferredBranchLocation || 'Assigned Branch';
  const branchAddress = service.branchAddress ? ` (${service.branchAddress})` : '';
  const dateFormatted = service.startedAt || service.createdAt
    ? new Date(service.startedAt || service.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : service.dateRequested || 'Recently';

  const isCompleted = service.status === 'Completed';
  const coverUrl = service.coverImage || service.coverPhoto || service.coverPhotoUrl;
  const category = service.category || 'General Services';
  const categoryIcon = CATEGORY_ICON_MAP[category.toLowerCase()] || 'fa-solid fa-concierge-bell';

  // Format steps for Steps child component
  const formattedSteps = stepsList.map((s, idx) => ({
    status:
      s.status === 'Completed' || s.completed === true
        ? 'completed'
        : s.status === 'Currently Processing' || s.status === 'Ongoing' || s.status === 'in-progress'
        ? 'in-progress'
        : 'todo',
    description: s.title || s.description || `Step ${idx + 1}`
  }));

  return (
    <article className="service-tracker">
      {/* Top Header Row with Media Thumbnail */}
      <div className="service-tracker-top">
        {/* Service Thumbnail / Icon */}
        <div className="tracker-thumbnail-box">
          {coverUrl ? (
            <img src={coverUrl} alt={serviceTitle} className="tracker-thumbnail-img" />
          ) : (
            <div className="tracker-thumbnail-fallback">
              <i className={`${categoryIcon}`}></i>
            </div>
          )}
        </div>

        {/* Title & Metadata */}
        <div className="service-tracker-title-box">
          <div className="tracker-title-top">
            <h3 className="tracker-service-name">{serviceTitle}</h3>
            <span
              className={`service-tracker-status ${
                isCompleted ? 'completed' : service.status === 'Cancelled' ? 'cancelled' : 'in-progress'
              }`}
            >
              <i
                className={`fa-solid ${
                  isCompleted
                    ? 'fa-circle-check'
                    : service.status === 'Cancelled'
                    ? 'fa-circle-xmark'
                    : 'fa-spinner fa-spin'
                }`}
                style={{ marginRight: '0.25rem' }}
              ></i>
              {service.status || 'In Progress'}
            </span>
          </div>

          {/* Subtitle & Badges */}
          <div className="tracker-meta-pills">
            <span className="tracker-category-pill">
              <i className={categoryIcon} style={{ marginRight: '0.25rem' }}></i>
              {category}
            </span>

            <span className="tracker-branch-pill">
              <i className="fa-solid fa-building" style={{ marginRight: '0.25rem', color: 'var(--purple)' }}></i>
              {branchName}{branchAddress}
            </span>

            <span className="tracker-date-pill">
              <i className="fa-regular fa-calendar" style={{ marginRight: '0.25rem' }}></i>
              Requested: {dateFormatted}
            </span>

            {service.serviceCode && (
              <span className="tracker-tag-pill" style={{ background: '#dcfce7', color: '#15803d', borderColor: '#bbf7d0', fontWeight: 700, fontFamily: 'monospace' }}>
                <i className="fa-solid fa-qrcode" style={{ marginRight: '0.25rem' }}></i>
                {service.serviceCode}
              </span>
            )}

            {Array.isArray(service.tags) && service.tags.slice(0, 3).map((t, idx) => (
              <span key={idx} className="tracker-tag-pill">
                #{t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Bar Section */}
      <div className="service-tracker-progress">
        <div className="progress-bar-header">
          <h4>
            <i className="fa-solid fa-list-check" style={{ color: 'var(--purple)', marginRight: '0.35rem' }}></i>
            Fulfillment Progress ({completedCount} of {totalSteps} steps completed)
          </h4>
          <span className="progress-pct-val">{progressPct}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progressPct}%` }}></div>
        </div>
        {service.estimatedCompletion && (
          <p className="estimated-completion">
            <i className="fa-regular fa-clock" style={{ marginRight: '0.25rem', color: 'var(--purple)' }}></i>
            Estimated Completion: <strong>{service.estimatedCompletion}</strong>
          </p>
        )}
      </div>

      {/* Accordion Action Buttons */}
      <div className="tracker-actions-row">
        <button
          type="button"
          className={`service-steps-show ${showSteps ? 'active' : ''}`}
          onClick={toggleSteps}
        >
          <i className={`fa-solid ${showSteps ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
          {showSteps ? 'Hide Step Checklist' : `View Step Checklist (${totalSteps})`}
        </button>

        {requirementsList.length > 0 && (
          <button
            type="button"
            className={`service-steps-show ${showRequirements ? 'active' : ''}`}
            onClick={toggleRequirements}
            style={{ marginLeft: '1rem' }}
          >
            <i className={`fa-solid ${showRequirements ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
            {showRequirements ? 'Hide Uploaded Documents' : `Submitted Requirements (${requirementsList.length})`}
          </button>
        )}

        {onOpenReceipt && (
          <button
            type="button"
            className="service-steps-show"
            onClick={() => onOpenReceipt(service)}
            style={{ marginLeft: 'auto', background: '#f0fdf4', color: '#15803d', borderColor: '#86efac' }}
            title="View and download official ADF-07-002 E-Receipt"
          >
            <i className="fa-solid fa-receipt"></i>
            <span>Official E-Receipt</span>
          </button>
        )}
      </div>

      {/* Step Pipeline Checklist View */}
      {showSteps && (
        <div className="tracker-steps-drawer">
          <Steps steps={formattedSteps} />
        </div>
      )}

      {/* Submitted Requirements Checklist View */}
      {showRequirements && requirementsList.length > 0 && (
        <div className="tracker-reqs-drawer">
          <h5 className="tracker-reqs-title">
            <i className="fa-solid fa-clipboard-check" style={{ color: 'var(--purple)', marginRight: '0.35rem' }}></i>
            Submitted Information & Files
          </h5>
          <div className="tracker-reqs-grid">
            {requirementsList.map((req, rIdx) => {
              const name = typeof req === 'string' ? req : req.name || req.title || `Requirement ${rIdx + 1}`;
              const fileObj = typeof req === 'object' ? req.file : null;
              const fileUrl = typeof req === 'object'
                ? (fileObj?.url || (typeof fileObj === 'string' ? fileObj : null) || req.fileUrl || req.url || (typeof req.value === 'string' && req.value.startsWith('http') ? req.value : null))
                : null;
              const fileName = typeof req === 'object'
                ? (fileObj?.fileName || req.fileName || '')
                : '';
              const inputType = typeof req === 'object' ? req.inputType : null;
              const isFile = typeof req === 'object' && (inputType === 'file' || inputType === 'image' || fileObj || req.fileUrl || req.url);
              const textVal = typeof req === 'object' ? (req.value || req.textValue || '') : '';
              const isImage = inputType === 'image' || (fileUrl && /\.(png|jpg|jpeg|webp|gif)/i.test(fileName || fileUrl));

              return (
                <div key={rIdx} className="tracker-req-item">
                  <span className="tracker-req-name">{name}</span>
                  {fileUrl ? (
                    <div className="tracker-req-file-box">
                      {isImage && (
                        <button
                          type="button"
                          className="tracker-img-thumb-link"
                          title={`View in Lightbox: ${fileName || name}`}
                          onClick={() =>
                            openLightbox({
                              imageUrl: fileUrl,
                              title: fileName || name,
                              subtitle: `Service Requirement · ${service.serviceTitle || service.serviceType || 'Ongoing Service'}`
                            })
                          }
                        >
                          <img src={fileUrl} alt={fileName || name} className="tracker-img-thumb" />
                        </button>
                      )}
                      {isImage ? (
                        <button
                          type="button"
                          className="tracker-file-link"
                          title={`View in Lightbox: ${fileName || name}`}
                          onClick={() =>
                            openLightbox({
                              imageUrl: fileUrl,
                              title: fileName || name,
                              subtitle: `Service Requirement · ${service.serviceTitle || service.serviceType || 'Ongoing Service'}`
                            })
                          }
                        >
                          <i className="fa-regular fa-image" style={{ marginRight: '0.35rem' }}></i>
                          <span>{fileName || 'View Attached Image'}</span>
                        </button>
                      ) : (
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tracker-file-link"
                          title={fileName ? `Open ${fileName}` : 'View Attached File'}
                        >
                          <i className="fa-solid fa-file-arrow-down" style={{ marginRight: '0.35rem' }}></i>
                          <span>{fileName || 'View Attached Document'}</span>
                        </a>
                      )}
                    </div>
                  ) : isFile ? (
                    <span className="tracker-req-pending">
                      <i className="fa-regular fa-clock" style={{ marginRight: '0.25rem' }}></i> Pending Upload
                    </span>
                  ) : (
                    <span className="tracker-req-val">{textVal || 'Provided'}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </article>
  );
}