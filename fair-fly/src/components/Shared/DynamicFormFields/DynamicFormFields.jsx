import { useId } from 'react';
import './dynamic-form-fields.css';

const getOptions = (options = []) => options.map(option => (
  typeof option === 'string' ? { label: option, value: option } : option
));

function DynamicField({ field, value, onChange, disabled, idPrefix }) {
  const fieldId = `${idPrefix}-${field.id}`;
  const commonProps = {
    id: fieldId,
    name: field.id,
    required: field.required === true,
    disabled,
    placeholder: field.placeholder || '',
    onChange: event => onChange(field.id, event.target.value)
  };

  if (field.type === 'checkbox') {
    return (
      <label className="dynamic-form-checkbox" htmlFor={fieldId}>
        <input {...commonProps} type="checkbox" checked={value === true} onChange={event => onChange(field.id, event.target.checked)} />
        <span>{field.label}{field.required && <b aria-hidden="true"> *</b>}</span>
      </label>
    );
  }

  if (field.type === 'checkboxGroup') {
    const selected = Array.isArray(value) ? value : [];
    return (
      <fieldset className="dynamic-form-choice-group">
        <legend>{field.label}{field.required && <b aria-hidden="true"> *</b>}</legend>
        {getOptions(field.options).map(option => (
          <label key={option.value}>
            <input
              type="checkbox"
              checked={selected.includes(option.value)}
              disabled={disabled}
              onChange={event => onChange(field.id, event.target.checked ? [...selected, option.value] : selected.filter(item => item !== option.value))}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </fieldset>
    );
  }

  return (
    <label className="dynamic-form-field" htmlFor={fieldId}>
      <span>{field.label}{field.required && <b aria-hidden="true"> *</b>}</span>
      {field.type === 'textarea' ? (
        <textarea {...commonProps} rows={field.rows || 3} value={value ?? ''} />
      ) : field.type === 'select' ? (
        <select {...commonProps} value={value ?? ''}>
          <option value="">Select an option</option>
          {getOptions(field.options).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : field.type === 'file' || field.type === 'image' ? (
        <input
          id={fieldId}
          name={field.id}
          type="file"
          accept={field.accept || (field.type === 'image' ? 'image/*' : undefined)}
          multiple={field.multiple === true}
          required={field.required === true && !value}
          disabled={disabled}
          onChange={event => onChange(field.id, field.multiple ? Array.from(event.target.files || []) : event.target.files?.[0] || null)}
        />
      ) : (
        <input {...commonProps} type={field.type} value={value ?? ''} min={field.min} max={field.max} />
      )}
      {field.helpText && <small>{field.helpText}</small>}
    </label>
  );
}

export default function DynamicFormFields({ schema, values = {}, onChange, disabled = false, excludeReserved = true, className = '' }) {
  const idPrefix = useId();
  const sections = (schema?.sections || []).map(section => ({
    ...section,
    fields: (section.fields || []).filter(field => !excludeReserved || (!field.reserved && !field.anchorKey))
  })).filter(section => section.fields.length > 0);

  if (!sections.length) return null;

  return (
    <div className={`dynamic-form-fields ${className}`}>
      {sections.map(section => (
        <section className="dynamic-form-section" key={section.id}>
          <h3>{section.title}</h3>
          <div className="dynamic-form-grid">
            {section.fields.map(field => (
              <DynamicField
                key={field.id}
                field={field}
                value={values[field.id]}
                onChange={onChange}
                disabled={disabled}
                idPrefix={idPrefix}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}