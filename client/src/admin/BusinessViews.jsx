import React, { useState } from 'react';
import { Metrics, Search } from '../shared/SectionUI.jsx';
import { money } from '../shared/api.js';

export function Clients({ bookings, onDetail }) {
  const [query, setQuery] = useState(''), [selected, setSelected] = useState(null);
  const groups = new Map();
  for (const b of bookings) {
    const key = (b.userEmail || b.userPhone || b.userName).toLowerCase();
    const client = groups.get(key) || { key, name: b.userName, email: b.userEmail, phone: b.userPhone, bookings: [] };
    client.bookings.push(b); groups.set(key, client);
  }
  const clients = [...groups.values()], list = clients.filter(c => `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(query.toLowerCase()));
  const current = groups.get(selected);
  return <>
    <Metrics items={[
      ['Clientes registrados', clients.length, 'Titulares con historial de reservas', 'users'],
      ['Clientes recurrentes', clients.filter(c => c.bookings.filter(b => b.status !== 'cancelled').length > 1).length, 'Más de una reserva no cancelada', 'check'],
      ['Con correo de contacto', clients.filter(c => c.email).length, 'Datos aportados al reservar', 'users'],
      ['Reservas del historial', bookings.length, 'Incluye turnos cancelados', 'calendar']
    ]} />
    <section className="panel"><div className="panel-heading"><div><h2>Directorio de clientes</h2><p>Contactos e historial de quienes reservaron en tu complejo.</p></div></div><div className="toolbar"><Search label="Buscar nombre, correo o teléfono" value={query} onChange={setQuery} /></div>
      <div className="table-scroll"><table className="data-table"><thead><tr><th>CLIENTE</th><th>CONTACTO</th><th>RESERVAS</th><th>ÚLTIMO TURNO</th><th></th></tr></thead><tbody>{list.map(c => <tr key={c.key}><td>{c.name}</td><td>{c.email || 'Sin correo'}<small>{c.phone || 'Sin teléfono'}</small></td><td>{c.bookings.filter(b => b.status !== 'cancelled').length}<small>No canceladas</small></td><td>{c.bookings.map(b => b.date).sort().at(-1)}</td><td><button className="text-button" onClick={() => setSelected(c.key)}>Ver historial</button></td></tr>)}</tbody></table></div>{!list.length && <p className="empty">No hay clientes para esta búsqueda.</p>}
    </section>
    {current && <section className="panel section-followup"><div className="panel-heading"><div><h2>Historial de {current.name}</h2><p>Reservas y cancelaciones de este cliente.</p></div><button className="text-button" onClick={() => setSelected(null)}>Cerrar historial</button></div><div className="table-scroll"><table className="data-table"><thead><tr><th>FECHA</th><th>CANCHA</th><th>ESTADO</th><th></th></tr></thead><tbody>{[...current.bookings].sort((a,b) => `${b.date}${b.slot}`.localeCompare(`${a.date}${a.slot}`)).map(b => <tr key={b.id}><td>{b.date}<small>{b.slot}</small></td><td>{b.courtName}</td><td>{b.status === 'cancelled' ? 'Cancelada' : b.status === 'pending' ? 'Pendiente' : 'Confirmada'}</td><td><button className="text-button" onClick={() => onDetail(b.id)}>Ver reserva</button></td></tr>)}</tbody></table></div></section>}
  </>;
}

export function Payments({ bookings, onDetail }) {
  const [filter, setFilter] = useState('unpaid'), [month, setMonth] = useState(''), [query, setQuery] = useState('');
  const period = bookings.filter(b => !month || b.date.startsWith(month));
  const paid = period.filter(b => b.paid), unpaid = period.filter(b => !b.paid);
  const total = rows => rows.reduce((n,b) => n + b.price, 0);
  const list = period.filter(b => (filter === 'all' || (filter === 'paid' ? b.paid : !b.paid)) && `${b.userName} ${b.id}`.toLowerCase().includes(query.toLowerCase())).sort((a,b) => `${b.date}${b.slot}`.localeCompare(`${a.date}${a.slot}`));
  return <>
    <Metrics items={[
      ['Cobrado', money(total(paid)), 'Pagos registrados para estos turnos', 'wallet'],
      ['Por cobrar', money(total(unpaid)), 'Reservas sin pago registrado', 'clock'],
      ['Reservas pagadas', paid.length, month ? `Turnos de ${month}` : 'Todas las fechas', 'check'],
      ['Pagos pendientes', unpaid.length, 'No incluye reservas canceladas', 'calendar']
    ]} />
    <section className="panel"><div className="panel-heading"><div><h2>Control de cobros</h2><p>Revisá los importes y registrá el pago desde el detalle de cada turno.</p></div><label className="inline-field">Mes del turno<input aria-label="Mes de los turnos" type="month" value={month} onChange={e => setMonth(e.target.value)} /></label></div><div className="toolbar"><Search label="Buscar cliente o código de reserva" value={query} onChange={setQuery} /><div className="segmented">{[['unpaid','Por cobrar'],['paid','Pagados'],['all','Todos']].map(([id,title]) => <button key={id} className={filter === id ? 'active' : ''} onClick={() => setFilter(id)}>{title}</button>)}</div></div>
      <div className="table-scroll"><table className="data-table"><thead><tr><th>CLIENTE / TURNO</th><th>FECHA DEL TURNO</th><th>IMPORTE</th><th>COBRO</th><th></th></tr></thead><tbody>{list.map(b => <tr key={b.id}><td>{b.userName}<small>{b.courtName}</small></td><td>{b.date}<small>{b.slot} · {b.id}</small></td><td>{money(b.price)}</td><td><span className={`badge ${b.paid ? '' : 'pending'}`}>{b.paid ? 'Pagado' : 'Por cobrar'}</span></td><td><button className="text-button" onClick={() => onDetail(b.id)}>{b.paid ? 'Revisar pago' : 'Registrar pago'}</button></td></tr>)}</tbody></table></div>{!list.length && <p className="empty">No hay cobros para estos filtros.</p>}
      <p className="section-note">El período corresponde a la fecha del turno. Los pagos se registran manualmente; esta vista no procesa dinero.</p>
    </section>
  </>;
}
