import React, { useState } from 'react';
import { Metrics, Search } from '../shared/SectionUI.jsx';
import { money, localDate } from '../shared/api.js';

const statuses = { active: 'Activa', trial: 'En prueba', past_due: 'Vencida', suspended: 'Suspendida' };
const statusBadge = s => <span className={`badge ${s === 'past_due' ? 'pending' : s === 'suspended' ? 'cancelled' : ''}`}>{statuses[s]}</span>;
const stamp = value => value?.slice(0, 19).replace('T', ' ');

export default function PlatformSections({ view, data, audit, onModal, refresh }) {
  const [query, setQuery] = useState(''), [filter, setFilter] = useState('all'), [plan, setPlan] = useState('all'), [month, setMonth] = useState('');
  const findComplex = id => data.complexes.find(c => c.id === id);
  const search = value => String(value || '').toLowerCase().includes(query.toLowerCase());
  const dueSoon = c => {
    const end = new Date(`${localDate()}T12:00:00`); end.setDate(end.getDate() + 7);
    return ['active','trial'].includes(c.subscription?.effectiveStatus) && c.subscription.paid_until <= localDate(end);
  };
  const complexes = data.complexes.filter(c => search(`${c.name} ${c.location} ${c.admins.map(a => a.email).join(' ')}`));
  const subscriptions = complexes.filter(c => (filter === 'all' || (filter === 'soon' ? dueSoon(c) : c.subscription?.effectiveStatus === filter)) && (plan === 'all' || c.subscription?.plan === plan));
  const receipts = data.payments.filter(p => (!month || p.created_at.startsWith(month)) && search(`${findComplex(p.complex_id)?.name} ${p.reference}`));
  const requests = data.requests.filter(r => search(`${r.clubName} ${r.owner} ${r.email}`));
  const events = audit.filter(a => search(`${a.action} ${a.actor} ${findComplex(a.complex_id)?.name}`) && (filter === 'all' || a.complex_id === filter));
  const paid = data.payments.filter(p => !month || p.created_at.startsWith(month));
  const metrics = {
    complexes: [
      ['Complejos registrados', data.complexes.length, 'Organizaciones que usan RTL', 'court'],
      ['Canchas físicas', data.complexes.reduce((n,c) => n + c.courtCount, 0), 'Espacios dentro de los complejos', 'court'],
      ['Cuentas administradoras', data.complexes.reduce((n,c) => n + c.admins.length, 0), 'Acceso exclusivo a su complejo', 'users'],
      ['Sin administrador', data.complexes.filter(c => !c.admins.length).length, 'Complejos que necesitan una cuenta', 'clock']
    ],
    subscriptions: [
      ['Suscripciones vigentes', data.complexes.filter(c => ['active','trial'].includes(c.subscription?.effectiveStatus)).length, 'Activas o en período de prueba', 'check'],
      ['Vencen en 7 días', data.complexes.filter(dueSoon).length, 'Prepará el próximo recordatorio', 'calendar'],
      ['Suscripciones vencidas', data.complexes.filter(c => c.subscription?.effectiveStatus === 'past_due').length, 'Requieren seguimiento de renovación', 'clock'],
      ['Abonos mensuales vigentes', money(data.complexes.filter(c => ['active','trial'].includes(c.subscription?.effectiveStatus)).reduce((n,c) => n + c.subscription.monthly_fee, 0)), 'Importe contratado; no equivale a cobros', 'wallet']
    ],
    payments: [
      ['Cobros registrados', money(paid.reduce((n,p) => n + p.amount, 0)), month || 'Últimos 100 registros disponibles', 'wallet'],
      ['Comprobantes', paid.length, 'Según el período seleccionado', 'check'],
      ['Complejos con pagos', new Set(paid.map(p => p.complex_id)).size, 'Con al menos un cobro registrado', 'court'],
      ['Último registro', paid[0]?.created_at.slice(0,10) || 'Sin cobros', 'Fecha de carga del comprobante', 'calendar']
    ]
  };

  return <>
    {metrics[view] && <Metrics items={metrics[view]} />}
    {view === 'complexes' && <section className="panel"><div className="panel-heading"><div><h2>Directorio de complejos</h2><p>Administrá los espacios registrados y las personas que pueden gestionarlos.</p></div><button className="button secondary" onClick={refresh}>Actualizar directorio</button></div><div className="toolbar"><Search label="Buscar complejo, localidad o cuenta" value={query} onChange={setQuery} /></div>
      <div className="table-scroll"><table className="data-table"><thead><tr><th>COMPLEJO</th><th>DEPORTE</th><th>CANCHAS</th><th>ADMINISTRADORES</th><th></th></tr></thead><tbody>{complexes.map(c => <tr key={c.id}><td>{c.name}<small>{c.location}</small></td><td>{c.sportLabel}</td><td>{c.courtCount}</td><td>{c.admins.length ? c.admins.map(a => <small className="account-email" key={a.id}>{a.email}</small>) : <span className="badge pending">Sin cuenta</span>}</td><td><button className="button secondary" onClick={() => onModal({type:'account',complex:c})}>Crear cuenta</button></td></tr>)}</tbody></table></div>{!complexes.length && <p className="empty">No hay complejos para esta búsqueda.</p>}
      <p className="section-note">Cada cuenta administra únicamente las canchas de su complejo. Los planes y renovaciones se gestionan en Suscripciones.</p>
    </section>}

    {view === 'subscriptions' && <>
      <section className="panel"><div className="panel-heading"><div><h2>Planes y renovaciones</h2><p>Controlá la vigencia, el abono acordado y el contacto de cada complejo.</p></div><button className="button secondary" onClick={refresh}>Actualizar suscripciones</button></div><div className="toolbar"><Search label="Buscar suscripción de un complejo" value={query} onChange={setQuery} /><select aria-label="Estado de suscripción" className="super-filter" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Todos los estados</option><option value="soon">Vencen en 7 días</option>{Object.entries(statuses).map(([id,title]) => <option key={id} value={id}>{title}</option>)}</select><select className="super-filter" aria-label="Plan de suscripción" value={plan} onChange={e => setPlan(e.target.value)}><option value="all">Todos los planes</option>{Object.entries(data.plans).map(([id,p]) => <option key={id} value={id}>{p.name}</option>)}</select></div>
        <div className="table-scroll"><table className="data-table"><thead><tr><th>COMPLEJO / CONTACTO</th><th>PLAN</th><th>ESTADO</th><th>VENCIMIENTO</th><th>ABONO MENSUAL</th><th>RENOVACIÓN</th></tr></thead><tbody>{subscriptions.map(c => <tr key={c.id}><td>{c.name}<small>{c.subscription?.contact_email || c.subscription?.contact_phone || 'Contacto por completar'}</small></td><td>{c.subscription?.planName}</td><td>{statusBadge(c.subscription?.effectiveStatus)}</td><td>{c.subscription?.paid_until}{dueSoon(c) && <small>Próximo a vencer</small>}</td><td>{money(c.subscription?.monthly_fee)}</td><td><div className="super-actions"><button className="text-button" onClick={() => onModal({type:'subscription',complex:c})}>Editar plan</button><button className="text-button" onClick={() => onModal({type:'payment',complex:c})}>Registrar cobro</button><button className="text-button" onClick={() => onModal({type:'reminder',complex:c})}>Preparar recordatorio</button></div></td></tr>)}</tbody></table></div>{!subscriptions.length && <p className="empty">No hay suscripciones para estos filtros.</p>}
      </section>
      <section className="panel section-followup"><div className="panel-heading"><div><h2>Recordatorios preparados</h2><p>Últimos 100 borradores guardados. Preparar un mensaje no significa que se haya enviado.</p></div></div><div className="table-scroll"><table className="data-table"><thead><tr><th>COMPLEJO</th><th>FECHA</th><th>CANAL / DESTINO</th><th></th></tr></thead><tbody>{data.reminders.filter(r => subscriptions.some(c => c.id === r.complex_id)).map(r => <tr key={r.id}><td>{findComplex(r.complex_id)?.name}</td><td>{stamp(r.created_at)}</td><td>{r.channel === 'email' ? 'Correo' : 'WhatsApp'}<small>{r.destination}</small></td><td><button className="text-button" onClick={() => onModal({type:'reminder-preview',record:r})}>Revisar borrador</button></td></tr>)}</tbody></table></div>{!data.reminders.some(r => subscriptions.some(c => c.id === r.complex_id)) && <p className="empty">No hay recordatorios preparados para estos complejos.</p>}</section>
    </>}

    {view === 'payments' && <section className="panel"><div className="panel-heading"><div><h2>Historial de cobros de RTL</h2><p>Últimos 100 comprobantes registrados, con su responsable y período de vigencia.</p></div><label className="inline-field">Mes de registro<input aria-label="Mes de registro del cobro" type="month" value={month} onChange={e => setMonth(e.target.value)} /></label></div><div className="toolbar"><Search label="Buscar complejo o comprobante" value={query} onChange={setQuery} /></div><div className="table-scroll"><table className="data-table"><thead><tr><th>REGISTRADO EL</th><th>COMPLEJO</th><th>IMPORTE</th><th>VIGENTE HASTA</th><th>REFERENCIA</th><th>REGISTRADO POR</th></tr></thead><tbody>{receipts.map(p => <tr key={p.id}><td>{stamp(p.created_at)}</td><td>{findComplex(p.complex_id)?.name}</td><td>{money(p.amount)}</td><td>{p.paid_until}</td><td>{p.reference}</td><td>{p.actor}</td></tr>)}</tbody></table></div>{!receipts.length && <p className="empty">No hay cobros para estos filtros.</p>}<p className="section-note">Para registrar un abono y actualizar su vencimiento, abrí la suscripción del complejo. Este historial no procesa dinero.</p></section>}

    {view === 'requests' && <section className="panel"><div className="panel-heading"><div><h2>Interesados en contratar RTL</h2><p>Revisá el contacto y usá sus datos para iniciar el alta del complejo.</p></div><span className="badge">{data.requests.length} solicitudes recientes</span></div><div className="toolbar"><Search label="Buscar solicitud o responsable" value={query} onChange={setQuery} /></div><div className="table-scroll"><table className="data-table"><thead><tr><th>RECIBIDA</th><th>COMPLEJO</th><th>RESPONSABLE</th><th>CONTACTO</th><th>PLAN SOLICITADO</th><th></th></tr></thead><tbody>{requests.map(r => <tr key={r.id}><td>{r.createdAt.slice(0,10)}</td><td>{r.clubName}<small>{r.courts} canchas</small></td><td>{r.owner}</td><td>{r.email}<small>{r.phone}</small></td><td>{r.plan}</td><td>{data.complexes.some(c => c.admins.some(a => a.email.toLowerCase() === r.email.toLowerCase())) ? <span className="badge">Cuenta existente</span> : <button className="text-button" onClick={() => onModal({type:'create',request:r})}>Iniciar alta</button>}</td></tr>)}</tbody></table></div>{!requests.length && <p className="empty">No hay solicitudes para esta búsqueda.</p>}</section>}

    {view === 'audit' && <section className="panel"><div className="panel-heading"><div><h2>Trazabilidad de la plataforma</h2><p>Últimos 150 movimientos. Consultá qué cambió, cuándo y quién lo registró.</p></div></div><div className="toolbar"><Search label="Buscar acción o responsable" value={query} onChange={setQuery} /><select className="super-filter" aria-label="Complejo de la actividad" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Todos los complejos</option>{data.complexes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div className="table-scroll"><table className="data-table"><thead><tr><th>FECHA</th><th>COMPLEJO</th><th>ACCIÓN</th><th>RESPONSABLE</th></tr></thead><tbody>{events.map(a => <tr key={a.id}><td>{stamp(a.created_at)}</td><td>{findComplex(a.complex_id)?.name}</td><td>{a.action}</td><td>{a.actor}</td></tr>)}</tbody></table></div>{!events.length && <p className="empty">No hay movimientos para estos filtros.</p>}</section>}
  </>;
}
