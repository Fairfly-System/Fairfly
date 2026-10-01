import React from 'react';
import './split-name-input.css';

/**
 * Reusable 3-Column Split Name Input component (First Name, M.I., Last Name)
 */
export default function SplitNameInput({
  firstName = '',
  middleInitial = '',
  lastName = '',
  onChange,
  errors = {},
  disabled = false,
  required = true,
  idPrefix = 'split-name',
  firstLabel = 'First Name',
  miLabel = 'M.I.',
  lastLabel = 'Last Name',
  firstPlaceholder = 'Juan',
  miPlaceholder = 'D.',
  lastPlaceholder = 'Dela Cruz'
}) {
  const handleMiChange = (e) => {
    let val = e.target.value.toUpperCase();
    if (val.length > 3) val = val.slice(0, 3);
    onChange('middleInitial', val);
  };

  return (
    <div className="split-name-row">
      {/* First Name */}
      <div className={`split-name-group ${errors.firstName ? 'has-error' : ''}`}>
        <label htmlFor={`${idPrefix}-first`}>
          {firstLabel} {required && <span className="req-star">*</span>}
        </label>
        <input
          id={`${idPrefix}-first`}
          type="text"
          placeholder={firstPlaceholder}
          value={firstName}
          onChange={(e) => onChange('firstName', e.target.value)}
          disabled={disabled}
          required={required}
          autoComplete="given-name"
        />
        {errors.firstName && <p className="split-name-error">{errors.firstName}</p>}
      </div>

      {/* Middle Initial */}
      <div className="split-name-group split-name-group--mi">
        <label htmlFor={`${idPrefix}-mi`}>
          {miLabel} <span className="optional-badge">(Opt)</span>
        </label>
        <input
          id={`${idPrefix}-mi`}
          type="text"
          placeholder={miPlaceholder}
          maxLength={3}
          value={middleInitial}
          onChange={handleMiChange}
          disabled={disabled}
          autoComplete="additional-name"
        />
      </div>

      {/* Last Name */}
      <div className={`split-name-group ${errors.lastName ? 'has-error' : ''}`}>
        <label htmlFor={`${idPrefix}-last`}>
          {lastLabel} {required && <span className="req-star">*</span>}
        </label>
        <input
          id={`${idPrefix}-last`}
          type="text"
          placeholder={lastPlaceholder}
          value={lastName}
          onChange={(e) => onChange('lastName', e.target.value)}
          disabled={disabled}
          required={required}
          autoComplete="family-name"
        />
        {errors.lastName && <p className="split-name-error">{errors.lastName}</p>}
      </div>
    </div>
  );
}
