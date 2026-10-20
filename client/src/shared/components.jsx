import React, { useEffect, useRef, useState } from 'react';
import { request } from './api.js';

export function Icon({ name, ...props }) { return <i className={`fa-solid fa-${({ calendar: 'calendar-days', court: 'table-cells', wallet: 'wallet', dashboard: 'table-cells-large', users: 'users', plus: 'plus', close: 'xmark', arrow: 'arrow-right-from-bracket', download: 'download', clock: 'clock', check: 'check', leaf: 'leaf', menu: 'bars', edit: 'pen', left: 'chevron-left', right: 'chevron-right', info: 'circle-info', search: 'magnifying-glass' })[name] || name}`} aria-hidden="true" {...props} />; }
export function Modal({ title, children, onClose, className = '' }) {
  const ref = useRef(null);
  useEffect(() => { const dialog = ref.current; dialog.showModal(); return () => dialog.close(); }, []);
  return <dialog ref={ref} className={className} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === ref.current) onClose(); }} aria-label={title}><div className="dialog-heading"><h2>{title}</h2><button type="button" className="icon-button" aria-label="Cerrar" onClick={onClose}><Icon name="close" /></button></div>{children}</dialog>;
}
export function ErrorMessage({ error }) { return error ? <p className="form-error" role="alert">{error.message || error}</p> : null; }
export function useCatalog() {
  const [catalog, setCatalog] = useState({ complexes: [], courts: [] });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { const controller = new AbortController(); request('/catalog', { signal: controller.signal }).then(setCatalog).catch(error => { if (error.name !== 'AbortError') setError(error); }).finally(() => { if (!controller.signal.aborted) setLoading(false); }); return () => controller.abort(); }, []);
  return { catalog, setCatalog, error, loading };
}
