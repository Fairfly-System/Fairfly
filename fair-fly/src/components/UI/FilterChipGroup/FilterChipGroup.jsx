import React from 'react';
import './filter-chip-group.css';

/**
 * FilterChipGroup Component
 *
 * @param {Object} props
 * @param {Array<string|{value: string, label: React.ReactNode, id?: string}>} props.chips - Array of chip names or option objects.
 * @param {string} props.activeChip - Currently selected/active chip value.
 * @param {Function} props.onChipChange - Callback function triggered on chip click: (chipValue) => void.
 * @param {string} [props.className] - Optional container class name.
 */
export default function FilterChipGroup({
  chips = [],
  activeChip,
  onChipChange,
  className = '',
}) {
  return (
    <div className={`filter-chips ${className}`.trim()}>
      {chips.map((chip, index) => {
        const value = typeof chip === 'object' && chip !== null ? (chip.value ?? chip.id) : chip;
        const label = typeof chip === 'object' && chip !== null ? chip.label : chip;
        const isActive = String(activeChip).toLowerCase() === String(value).toLowerCase();

        return (
          <button
            key={value || index}
            type="button"
            className={`filter-chip ${isActive ? 'active' : ''}`}
            onClick={() => onChipChange && onChipChange(value)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
