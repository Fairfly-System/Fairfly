import React, { useState } from "react";
import ServiceRequirementsModal from "./ServiceRequirementsModal";
import ServiceWorkflowsModal from "./ServiceWorkflowsModal";

// Maps the stored label back to the <select> value used in the unit dropdown
const LABEL_TO_UNIT = {
  "day/s": "days",
  "week/s": "weeks",
  "month/s": "months",
};

// Parses "7-10 Day/s" or "3 Day/s" -> { min: '7', max: '10', unit: 'days' }
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

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    price: initialData?.price || "",
    processingTime: parseProcessingTime(initialData?.processingTime)
  });

  const [requirements, setRequirements] = useState(
    initialData?.requirements || initialData?.actions || []
  );
  const [workflowIds, setWorkflowIds] = useState(
    initialData?.workflowIds || []
  );

  const [isRequirementsModalOpen, setIsRequirementsModalOpen] = useState(false);
  const [isWorkflowsModalOpen, setIsWorkflowsModalOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, requirements, workflowIds });
  };

  return (
    <>
      <form className="modalForm" onSubmit={handleSubmit}>
        <div className="formGroup">
          <label>Service Name</label>
          <input
            type="text"
            className="modalInput"
            placeholder="e.g., PSA Birth Certificate"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="formGroup">
          <label>Price</label>
          <input
            type="text"
            className="modalInput"
            placeholder="e.g., ₱365"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: e.target.value })
            }
            required
          />
        </div>

        <div className="formGroup">
          <label>Processing Time</label>
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
              style={{ width: "4.375rem" }}
              required
            />
            <span>-</span>
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
              style={{ width: "4.375rem" }}
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
              style={{ flex: 1 }}>
              <option value="days">Day/s</option>
              <option value="weeks">Week/s</option>
              <option value="months">Month/s</option>
            </select>
          </div>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "var(--text-light)" }}>
            Leave Max empty for a single value (e.g. 3 Days).
          </p>
        </div>

        {/* Requirements & Workflows Selection Row */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            className="modalSubmitBtn btnLightBlue"
            style={{ flex: 1 }}
            onClick={() => setIsRequirementsModalOpen(true)}>
            <span style={{ color: "var(--purple)" }}>
              <i className="fa-regular fa-clipboard" style={{ marginRight: "0.375rem" }}></i>
              {requirements.length > 0 ? `Requirements (${requirements.length})` : "Add Requirements"}
            </span>
          </button>

          <button
            type="button"
            className="modalSubmitBtn btnLightBlue"
            style={{ flex: 1 }}
            onClick={() => setIsWorkflowsModalOpen(true)}>
            <span style={{ color: "var(--orange)" }}>
              <i className="fa-solid fa-diagram-project" style={{ marginRight: "0.375rem" }}></i>
              {workflowIds.length > 0 ? `Workflows (${workflowIds.length})` : "Attach Workflow"}
            </span>
          </button>
        </div>

        <button
          type="submit"
          className="modalSubmitBtn btnBlue"
          disabled={isLoading}>
          {isLoading
            ? isEditMode
              ? "Updating Service..."
              : "Adding Service..."
            : isEditMode
              ? "Update Service"
              : "Add Service"}
        </button>
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
