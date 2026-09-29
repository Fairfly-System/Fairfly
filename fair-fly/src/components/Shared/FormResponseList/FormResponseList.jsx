import React from 'react';
import './form-response-list.css';
import { formatFormResponseValue, getFormResponseEntries } from './formResponseUtils';
import { useLightbox, isImageUrl } from '../../UI/ImageLightbox/ImageLightbox';

function ResponseValue({ value, onImageClick }) {
  if (Array.isArray(value)) {
    return (
      <span>
        {value.map((item, index) => (
          <ResponseValue
            key={`${index}-${formatFormResponseValue(item)}`}
            value={item}
            onImageClick={onImageClick}
          />
        ))}
      </span>
    );
  }
  if (value && typeof value === 'object' && value.url) {
    const isImg = isImageUrl(value.url, value.fileName || value.name);
    if (isImg) {
      return (
        <button
          type="button"
          className="form-response-img-btn"
          onClick={() => onImageClick?.({ url: value.url, title: value.fileName || value.name || 'Form Attachment' })}
          title="Click to view image"
        >
          <i className="fa-regular fa-image" style={{ marginRight: '0.375rem' }}></i>
          {value.fileName || value.name || 'View attached image'}
        </button>
      );
    }
    return <a href={value.url} target="_blank" rel="noreferrer">{value.fileName || value.name || 'View attachment'}</a>;
  }
  return <span>{formatFormResponseValue(value) || '—'}</span>;
}

export default function FormResponseList({ snapshot, values, title = 'Additional form details' }) {
  const { openLightbox } = useLightbox();
  const entries = getFormResponseEntries(snapshot, values);
  if (!entries.length) return null;

  return (
    <section className="form-response-list">
      <h3>{title}</h3>
      <dl>
        {entries.map(entry => (
          <div className="form-response-item" key={entry.id}>
            <dt>{entry.label}</dt>
            <dd><ResponseValue value={entry.value} onImageClick={openLightbox} /></dd>
          </div>
        ))}
      </dl>
    </section>
  );
}