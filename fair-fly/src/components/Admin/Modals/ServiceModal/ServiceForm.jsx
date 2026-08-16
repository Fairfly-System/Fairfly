import React, { useState, useRef } from "react";
import ServiceRequirementsModal from "../ServiceRequirementsModal/ServiceRequirementsModal";
import ServiceWorkflowsModal from "../ServiceWorkflowsModal/ServiceWorkflowsModal";

const LABEL_TO_UNIT = {
  "day/s": "days",
  "week/s": "weeks",
  "month/s": "months",
};

const DEFAULT_CATEGORIES = [
  "Visa & Embassy Assistance",
  "Passport Processing",
  "PSA & Civil Documents",
  "Airline Ticketing",
  "Tour Packages",
  "Travel Insurance & Hotels",
  "Authentication & Legalization",
  "Other"
];

const SUGGESTED_TAGS = [
  "Visa",
  "Passport",
  "DFA",
  "PSA",
  "Express",
  "Flight",
  "Tour",
  "Authentication",
  "Popular",
  "Rush"
];

function parseProcessingTime(processingTime) {
  const fallback = { min: "", max: "", unit: "days" };

  if (!processingTime) return fallback;
  if (typeof processingTime === "object") return processingTime;

  const match = processingTime.match(/^(\d+)(?:-(\d+))?\s+(.+)$/);
  if (!match) return fallback;

  const [ ,min, max, labelRaw] = match;
  const unit = LABEL_TO_UNIT[labelRaw.trim().toLowerCase()] || "days";

  return {
    min: min || "",
    max: max || min || "",
    unit,
  };
}

export default function ServiceForm({ onSubmit, isLoading, initialData }) {
  const isEditMode = Boolean(initialData);
  const fileInputRef = useRef(null);

  // Determine initial category state
  const initialCategory = initialData?.category || "Visa & Embassy Assistance";
  const isDefaultCategory = DEFAULT_CATEGORIES.includes(initialCategory);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    category: isDefaultCategory ? initialCategory : "Other",
    customCategory: isDefaultCategory ? "" : initialCategory,
    price: initialData?.price || "",
    description: initialData?.description || "",
    featured: Boolean(initialData?.featured),
    processingTime: parseProcessingTime(initialData?.processingTime),
    coverImage: initialData?.coverImage || initialData?.coverPhoto || initialData?.coverPhotoUrl || "",
    pendingCoverFile: null,
    coverImagePreview: initialData?.coverImage || initialData?.coverPhoto || initialData?.coverPhotoUrl || ""
  });

  const [tags, setTags] = useState(
    Array.isArray(initialData?.tags) ? initialData.tags : []
  );
  const [tagInput, setTagInput] = useState("");

  const [requirements, setRequirements] = useState(
    initialData?.requirements || initialData?.actions || []
  );
  const [workflowIds, setWorkflowIds] = useState(
    initialData?.workflowIds || []
  );

  const [isRequirementsModalOpen, setIsRequirementsModalOpen] = useState(false);
  const [isWorkflowsModalOpen, setIsWorkflowsModalOpen] = useState(false);

  // Cover Photo Change Handler
  const handleCoverPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPG, JPEG, WebP)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("Cover image file size must not exceed 10MB");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({
      ...prev,
      pendingCoverFile: file,
      coverImagePreview: previewUrl
    }));
  };

  const handleRemoveCoverPhoto = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setFormData((prev) => ({
      ...prev,
      coverImage: "",
      pendingCoverFile: null,
      coverImagePreview: ""
    }));
  };

  // Tag Handlers
  const handleAddTag = (tagToAdd) => {
    const cleanTag = (tagToAdd || tagInput).trim().replace(/^#/, '');
    if (!cleanTag) return;
    if (tags.some((t) => t.toLowerCase() === cleanTag.toLowerCase())) {
      setTagInput("");
      return;
    }
    setTags((prev) => [...prev, cleanTag]);
    setTagInput("");
  };

  const handleRemoveTag = (indexToRemove) => {
    setTags((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalCategory = formData.category === "Other" 
      ? (formData.customCategory.trim() || "Other Services")
      : formData.category;

    const payload = {
      name: formData.name.trim(),
      category: finalCategory,
      price: formData.price.trim(),
      description: formData.description.trim(),
      featured: formData.featured,
      processingTime: formData.processingTime,
      coverImage: formData.coverImage,
      pendingCoverFile: formData.pendingCoverFile,
      tags,
      requirements,
      workflowIds
    };

    onSubmit(payload);
  };

  return (
    <>
      <form className="modalForm form-column" onSubmit={handleSubmit} style={{ gap: '1.25rem' }}>
        
        {/* Cover Photo Dropzone / Preview */}
        <div className="formGroup">
          <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              <i className="fa-regular fa-image" style={{ color: 'var(--purple)', marginRight: '0.375rem' }}></i>
              Service Cover Photo
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 'normal' }}>
              Recommended: 16:9 or 4:3 ratio (Max 10MB)
            </span>
          </label>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleCoverPhotoChange}
            disabled={isLoading}
          />

          {formData.coverImagePreview ? (
            <div
              style={{
                position: 'relative',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                border: '1px solid var(--border-color)',
                maxHeight: '13rem',
                backgroundColor: 'var(--bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img
                src={formData.coverImagePreview}
                alt="Service Cover Preview"
                style={{ width: '100%', maxHeight: '13rem', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(26, 26, 46, 0.45)',
                  opacity: 0,
                  transition: 'opacity 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  padding: '1rem'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
              >
                <button
                  type="button"
                  className="btn-primary"
                  style={{ padding: '0.5rem 0.875rem', fontSize: '0.8125rem' }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  <i className="fa-solid fa-camera" style={{ marginRight: '0.375rem' }}></i>
                  Change Image
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  style={{ padding: '0.5rem 0.875rem', fontSize: '0.8125rem' }}
                  onClick={handleRemoveCoverPhoto}
                  disabled={isLoading}
                >
                  <i className="fa-solid fa-trash" style={{ marginRight: '0.375rem' }}></i>
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => !isLoading && fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem 1rem',
                textAlign: 'center',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                backgroundColor: 'var(--bg)',
                transition: 'border-color 0.2s, background-color 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--purple)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
            >
              <div
                style={{
                  width: '3rem',
                  height: '3rem',
                  borderRadius: '50%',
                  backgroundColor: 'var(--purple-light-2)',
                  color: 'var(--purple)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem'
                }}
              >
                <i className="fa-solid fa-cloud-arrow-up"></i>
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-dark)' }}>
                Click to upload cover photo
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                PNG, JPG, JPEG, WebP up to 10MB
              </span>
            </div>
          )}
        </div>

        {/* Row 1: Service Name & Category */}
        <div className="form-grid-2">
          <div className="formGroup">
            <label className="form-label">Service Name *</label>
            <input
              type="text"
              className="modalInput"
              placeholder="e.g., Japan Single Entry Tourist Visa"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          <div className="formGroup">
            <label className="form-label">Category *</label>
            <select
              className="modalSelect"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              disabled={isLoading}
              required
            >
              {DEFAULT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Category input if 'Other' is chosen */}
        {formData.category === "Other" && (
          <div className="formGroup">
            <label className="form-label">Custom Category Name *</label>
            <input
              type="text"
              className="modalInput"
              placeholder="e.g., Immigration Consulting"
              value={formData.customCategory}
              onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>
        )}

        {/* Row 2: Price & Processing Time */}
        <div className="form-grid-2">
          <div className="formGroup">
            <label className="form-label">Price / Service Fee *</label>
            <input
              type="text"
              className="modalInput"
              placeholder="e.g., ₱1,500 or 1500"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              required
              disabled={isLoading}
            />
          </div>

          <div className="formGroup">
            <label className="form-label">Processing Turnaround *</label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="number"
                min="0"
                className="modalInput"
                placeholder="Min"
                value={formData.processingTime.min}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    processingTime: {
                      ...formData.processingTime,
                      min: e.target.value,
                    },
                  })
                }
                style={{ width: "5.5rem" }}
                required
                disabled={isLoading}
              />
              <span style={{ color: 'var(--text-mid)', fontWeight: 600 }}>-</span>
              <input
                type="number"
                min="0"
                className="modalInput"
                placeholder="Max"
                value={formData.processingTime.max}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    processingTime: {
                      ...formData.processingTime,
                      max: e.target.value,
                    },
                  })
                }
                style={{ width: "5.5rem" }}
                disabled={isLoading}
              />
              <select
                className="modalSelect"
                value={formData.processingTime.unit}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    processingTime: {
                      ...formData.processingTime,
                      unit: e.target.value,
                    },
                  })
                }
                style={{ flex: 1 }}
                disabled={isLoading}
              >
                <option value="days">Day/s</option>
                <option value="weeks">Week/s</option>
                <option value="months">Month/s</option>
              </select>
            </div>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "var(--text-light)" }}>
              Leave Max empty for a single value (e.g. 3 Days).
            </p>
          </div>
        </div>

        {/* Tags Interactive Chip Builder */}
        <div className="formGroup">
          <label className="form-label">
            <i className="fa-solid fa-tags" style={{ color: 'var(--purple)', marginRight: '0.375rem' }}></i>
            Service Tags (for Search & Filtering)
          </label>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="modalInput"
              placeholder="Type tag and press Enter (e.g., Visa, FastTrack)..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              disabled={isLoading}
            />
            <button
              type="button"
              className="btn-secondary"
              style={{ whiteSpace: 'nowrap', padding: '0.625rem 1rem' }}
              onClick={() => handleAddTag()}
              disabled={!tagInput.trim() || isLoading}
            >
              <i className="fa-solid fa-plus" style={{ marginRight: '0.25rem' }}></i>
              Add Tag
            </button>
          </div>

          {/* Active Tags Chips */}
          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.375rem' }}>
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.25rem 0.625rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--purple-light-2)',
                    color: 'var(--purple-dark)',
                    fontSize: '0.8125rem',
                    fontWeight: 600
                  }}
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(idx)}
                    disabled={isLoading}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--purple)',
                      cursor: 'pointer',
                      padding: '0 0.125rem'
                    }}
                  >
                    <i className="fa-solid fa-xmark" style={{ fontSize: '0.75rem' }}></i>
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Suggested Quick Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.375rem', marginTop: '0.375rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginRight: '0.25rem' }}>
              Quick suggestions:
            </span>
            {SUGGESTED_TAGS.map((sug) => {
              const isSelected = tags.includes(sug);
              return (
                <button
                  key={sug}
                  type="button"
                  onClick={() => isSelected ? handleRemoveTag(tags.indexOf(sug)) : handleAddTag(sug)}
                  disabled={isLoading}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.1875rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: isSelected ? 'var(--purple)' : 'var(--card-bg)',
                    color: isSelected ? '#ffffff' : 'var(--text-mid)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isSelected ? `✓ #${sug}` : `+#${sug}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Description Field */}
        <div className="formGroup">
          <label className="form-label">
            <i className="fa-solid fa-align-left" style={{ color: 'var(--purple)', marginRight: '0.375rem' }}></i>
            Service Description & Overview
          </label>
          <textarea
            className="modalInput"
            rows="3"
            placeholder="Provide a comprehensive summary of what this service covers, inclusions, and client guidelines..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            disabled={isLoading}
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Featured Toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg)',
            border: '1px solid var(--border-color)'
          }}
        >
          <input
            type="checkbox"
            id="featuredCheckbox"
            checked={formData.featured}
            onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
            disabled={isLoading}
            style={{ width: '1.125rem', height: '1.125rem', accentColor: 'var(--purple)', cursor: 'pointer' }}
          />
          <label htmlFor="featuredCheckbox" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-dark)' }}>
              <i className="fa-solid fa-star" style={{ color: 'var(--warning-yellow)', marginRight: '0.375rem' }}></i>
              Feature this service on Client Marketplace
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
              Featured services are spotlighted prominently in the client-side shopping catalog.
            </span>
          </label>
        </div>

        {/* Requirements & Workflows Action Triggers */}
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            type="button"
            className="modalSubmitBtn btnLightBlue"
            style={{ flex: 1, margin: 0, justifyContent: 'center' }}
            disabled={isLoading}
            onClick={() => setIsRequirementsModalOpen(true)}>
            <span style={{ color: "var(--purple)", fontWeight: 600 }}>
              <i className="fa-regular fa-clipboard" style={{ marginRight: "0.375rem" }}></i>
              {requirements.length > 0 ? `Requirements (${requirements.length})` : "Add Requirements"}
            </span>
          </button>

          <button
            type="button"
            className="modalSubmitBtn btnLightBlue"
            style={{ flex: 1, margin: 0, justifyContent: 'center' }}
            disabled={isLoading}
            onClick={() => setIsWorkflowsModalOpen(true)}>
            <span style={{ color: "var(--orange)", fontWeight: 600 }}>
              <i className="fa-solid fa-diagram-project" style={{ marginRight: "0.375rem" }}></i>
              {workflowIds.length > 0 ? `Workflows (${workflowIds.length})` : "Attach Workflow"}
            </span>
          </button>
        </div>

        {/* Submit Action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {isLoading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.375rem' }}></i>
                {isEditMode ? "Updating Service..." : "Adding Service..."}
              </>
            ) : (
              isEditMode ? "Update Service" : "Add Service"
            )}
          </button>
        </div>
      </form>

      <ServiceRequirementsModal
        isOpen={isRequirementsModalOpen}
        onClose={() => setIsRequirementsModalOpen(false)}
        initialRequirements={requirements}
        onSaveRequirements={(updatedRequirements) => setRequirements(updatedRequirements)}
      />

      <ServiceWorkflowsModal
        isOpen={isWorkflowsModalOpen}
        onClose={() => setIsWorkflowsModalOpen(false)}
        initialWorkflowIds={workflowIds}
        onSaveWorkflows={(updatedWorkflowIds) => setWorkflowIds(updatedWorkflowIds)}
      />
    </>
  );
}
