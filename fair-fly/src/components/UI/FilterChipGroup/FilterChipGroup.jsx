import React from 'react';
import './filter-chip-group.css';

/**
 * FilterChipGroup Component
 *
 * @param {Object} props
 * @param {Array<string|{value: string, label: React.ReactNode, id?: string, count?: number}>} props.chips - Array of chip names or option objects.
 * @param {string} [props.activeChip] - Currently selected/active chip value.
 * @param {string} [props.activeValue] - Alias for activeChip.
 * @param {string} [props.value] - Alias for activeChip.
 * @param {Function} [props.onChipChange] - Callback function triggered on chip click: (chipValue) => void.
 * @param {Function} [props.onChange] - Alias for onChipChange.
 * @param {Function} [props.onSelect] - Alias for onChipChange.
 * @param {string} [props.className] - Optional container class name.
 */
export default function FilterChipGroup({
  chips = [],
  activeChip,
  activeValue,
  activeFilter,
  value: controlledValue,
  onChipChange,
  onChange,
  onSelect,
  onFilterChange,
  className = '',
}) {
  const currentActive = activeChip ?? activeValue ?? activeFilter ?? controlledValue ?? '';
  const handleChange = onChipChange || onChange || onSelect || onFilterChange;

  return (
    <div className={`filter-chips ${className}`.trim()}>
      {chips.map((chip, index) => {
        const val = typeof chip === 'object' && chip !== null ? (chip.value ?? chip.id) : chip;
        let label = typeof chip === 'object' && chip !== null ? chip.label : chip;
        const count = typeof chip === 'object' && chip !== null ? chip.count : undefined;

        if (count !== undefined && typeof label === 'string' && !label.includes('(')) {
          label = `${label} (${count})`;
        }

        const isActive = String(currentActive).toLowerCase() === String(val).toLowerCase();

        return (
          <button
            key={val || index}
            type="button"
            className={`filter-chip ${isActive ? 'active' : ''}`}
            onClick={() => handleChange && handleChange(val)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
