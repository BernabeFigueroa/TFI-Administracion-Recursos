import React, { useEffect, useState } from 'react';
import { Modal, ErrorMessage } from '../shared/components.jsx';
import { request, localDate, money, minutes } from '../shared/api.js';

export default function BookingModal({ complex, courts, onClose, onSaved }) {
  const enabled = courts.filter(c => c.complexId === complex.id && c.enabled);
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const [resourceId, setResourceId] = useState(enabled[0]?.id || '');
  const [date, setDate] = useState(localDate(tomorrow));
  const [slot, setSlot] = useState('');
  const [busy, setBusy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const court = enabled.find(c => c.id === resourceId);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setSlot(''); setError(null);
    const load = () => {
      if (document.hidden) return;
      request(`/availability?complexId=${encodeURIComponent(complex.id)}&date=${date}`, { signal: controller.signal }).then(setBusy).catch(error => { if (error.name !== 'AbortError') setError(error); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    };
    load(); const timer = setInterval(load, 15000); window.addEventListener('focus', load);
    return () => { controller.abort(); clearInterval(timer); window.removeEventListener('focus', load); };
  }, [date, complex.id]);
  const occupied = time => busy.some(b => b.resource_id === resourceId && minutes(time) < b.end_min && minutes(time) + 60 > b.start_min);
  useEffect(() => { setSlot(old => old && busy.some(b => b.resource_id === resourceId && minutes(old) < b.end_min && minutes(old) + 60 > b.start_min) ? '' : old); }, [busy, resourceId]);
  async function submit(event) {
    event.preventDefault(); if (saving || !slot || !court) return;
    const form = new FormData(event.currentTarget); setSaving(true); setError(null);
    try { const saved = await request('/bookings', { method: 'POST', body: { resourceId, date, slot, duration: 60, userName: form.get('name'), userPhone: form.get('phone'), userEmail: form.get('email') } }); onSaved(saved); }
    catch (error) { setError(error); if (error.status === 409) { setSlot(''); request(`/availability?complexId=${complex.id}&date=${date}`).then(setBusy).catch(() => {}); } }
    finally { setSaving(false); }
  }
  return <Modal title={complex.name} onClose={onClose} className="react-public-dialog"><form onSubmit={submit}><h3 className="booking-section-title">1. Seleccioná cancha, fecha y horario</h3><label>Cancha del complejo<select className="neumorphic-input" aria-label="Cancha del complejo" value={resourceId} onChange={e => { setResourceId(e.target.value); setSlot(''); }}>{enabled.map(c => <option key={c.id} value={c.id}>{c.name} · {money(c.price)} / hora</option>)}</select></label><label>Fecha del turno<input className="neumorphic-input" type="date" required min={localDate()} value={date} onInput={e => { if (e.currentTarget.value) setDate(e.currentTarget.value); }} onChange={e => { if (e.target.value) setDate(e.target.value); }} /></label>{!court ? <p>No hay canchas habilitadas en este complejo.</p> : <div className="slots-grid" aria-label="Horarios disponibles">{court.availableSlots.map(time => <button type="button" className={`slot-btn ${slot === time ? 'selected' : ''}`} key={time} disabled={loading || saving || occupied(time) || new Date(`${date}T${time}:00-03:00`) <= new Date()} aria-pressed={slot === time} onClick={() => setSlot(time)}>{time}</button>)}</div>}<h3 className="booking-section-title">2. Datos de contacto</h3><label>Nombre completo<input className="neumorphic-input" name="name" autoComplete="name" maxLength={100} required /></label><div className="form-grid"><label>Teléfono / WhatsApp<input className="neumorphic-input" name="phone" type="tel" autoComplete="tel" maxLength={40} required /></label><label>Correo electrónico<input className="neumorphic-input" name="email" type="email" autoComplete="email" maxLength={150} required /></label></div><div className="booking-total"><span>Reserva por una hora</span><strong>{money(court?.price)}</strong></div><ErrorMessage error={error} /><button className="confirm-booking-btn" disabled={!slot || !court || loading || saving}>{saving ? 'Guardando…' : 'Confirmar reserva'}</button></form></Modal>;
}
