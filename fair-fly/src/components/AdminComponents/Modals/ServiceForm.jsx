import React, { useState, useEffect } from "react";
import ServiceStepsModal from "./ServiceStepsModal";
import {firestore} from "../../../firebase";

// Maps the stored label back to the <select> value used in the unit dropdown
const LABEL_TO_UNIT = {
  "day/s": "days",
  "week/s": "weeks",
  "month/s": "months",
};

// Parses "7-10 Day/s" or "3 Day/s" -> { min: '7', max: '10', unit: 'days' }
// Falls back to a blank object if the string doesn't match the expected shape (or if it's already an object/empty)
function parseProcessingTime(processingTime) {
  const fallback = { min: "", max: "", unit: "days" };

  if (!processingTime) return fallback;
  if (typeof processingTime === "object") return processingTime; // already in the right shape

  // Match patterns like "7-10 Day/s" or "3 Day/s"
  const match = processingTime.match(/^(\d+)(?:-(\d+))?\s+(.+)$/);
  if (!match) return fallback; // If it doesn't match the expected pattern, return fallback

  // Destructure the match results
  const [ ,min, max, labelRaw] = match;
  const unit = LABEL_TO_UNIT[labelRaw.trim().toLowerCase()] || "days"; // Default to "days" if the label isn't recognized

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

  const [steps, setSteps] = useState(initialData?.actions || []);
  const [isStepsModalOpen, setIsStepsModalOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    //Attach the steps to the formData before submitting in the actions field
    onSubmit({ ...formData, actions: steps });
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
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
              style={{ width: "70px" }}
              required
            />
            <span>-</span>
            <input
              type="number"
              min="0"
              className="modalInput"
              placeholder="Max (optional)"
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
              style={{ width: "70px" }}
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
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#9ca3af" }}>
            Leave Max empty for a single value (e.g. just enter 3 for "3 Days").
          </p>
        </div>

        <button
          type="button"
          className="modalSubmitBtn btnLightBlue"
          onClick={() => setIsStepsModalOpen(true)}>
          <span style={{ color: "#5865f2" }}>
            {steps.length > 0 ? `Edit Steps (${steps.length})` : "Add Step/s"}
          </span>
        </button>

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
      <ServiceStepsModal
        isOpen={isStepsModalOpen}
        onClose={() => setIsStepsModalOpen(false)}
        initialSteps={steps}
        onSaveSteps={(updatedSteps) => setSteps(updatedSteps)}
      />
    </>
  );
}
