import React from 'react';
import { Icon } from './components.jsx';

export function Metrics({ items }) {
  return <section className="metrics" aria-label="Resumen de esta sección">{items.map(([title, value, note, icon = 'dashboard']) => <article className="metric" key={title}><div className="metric-top"><span>{title}</span><span className="metric-icon"><Icon name={icon} /></span></div><strong>{value}</strong>{note && <small>{note}</small>}</article>)}</section>;
}

export function Search({ label, value, onChange }) {
  return <label className="search section-search"><Icon name="search" /><input aria-label={label} placeholder={label} value={value} onChange={e => onChange(e.target.value)} /></label>;
}
