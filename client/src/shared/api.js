export async function request(path, { body, ...options } = {}) {
  const response = await fetch(`/api${path}`, {
    ...options, credentials: 'same-origin',
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data;
  try { data = await response.json(); }
  catch { throw new Error('No se pudo conectar con el backend. Iniciá el proyecto con npm start.'); }
  if (!response.ok) { const error = new Error(data.error || 'No se pudo completar la operación.'); error.status = response.status; error.code = data.code; error.requiredPlan = data.requiredPlan; throw error; }
  return data;
}

export const money = value => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value || 0);
export function localDate(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
export function friendly(date) { return new Date(`${date}T12:00:00-03:00`).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }); }
export function minutes(time) { const [h, m] = time.split(':').map(Number); return h * 60 + m; }
export const resourceId = b => b.resourceId || `${b.courtId}-court-1`;
export function overlaps(bookings, id, date, slot, duration = 60) { const start = minutes(slot); return bookings.some(b => b.status !== 'cancelled' && resourceId(b) === id && b.date === date && start < minutes(b.slot) + Number(b.duration || 60) && start + duration > minutes(b.slot)); }
export function imageSource(value) { return /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(value || '') ? value : `/${/^assets\/[a-z0-9_.-]+$/i.test(value || '') ? value : 'assets/padel.png'}`; }
export const labels = { confirmed: 'Confirmada', pending: 'Pendiente', cancelled: 'Cancelada' };
