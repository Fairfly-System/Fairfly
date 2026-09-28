import './form-response-list.css';
import { formatFormResponseValue, getFormResponseEntries } from './formResponseUtils';

function ResponseValue({ value }) {
  if (Array.isArray(value)) {
    return <span>{value.map((item, index) => <ResponseValue key={`${index}-${formatFormResponseValue(item)}`} value={item} />)}</span>;
  }
  if (value && typeof value === 'object' && value.url) {
    return <a href={value.url} target="_blank" rel="noreferrer">{value.fileName || value.name || 'View attachment'}</a>;
  }
  return <span>{formatFormResponseValue(value) || '—'}</span>;
}

export default function FormResponseList({ snapshot, values, title = 'Additional form details' }) {
  const entries = getFormResponseEntries(snapshot, values);
  if (!entries.length) return null;

  return (
    <section className="form-response-list">
      <h3>{title}</h3>
      <dl>
        {entries.map(entry => (
          <div className="form-response-item" key={entry.id}>
            <dt>{entry.label}</dt>
            <dd><ResponseValue value={entry.value} /></dd>
          </div>
        ))}
      </dl>
    </section>
  );
}