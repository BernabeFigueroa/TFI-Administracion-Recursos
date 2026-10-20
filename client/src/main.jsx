import React, { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';

const App = location.pathname.startsWith('/superadmin')
  ? lazy(() => import('./superadmin/SuperAdminApp.jsx'))
  : location.pathname.startsWith('/admin')
  ? lazy(() => import('./admin/AdminApp.jsx'))
  : lazy(() => import('./public/PublicApp.jsx'));

class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) return <main role="alert"><h1>No se pudo abrir la aplicación</h1><p>Recargá la página. Si el error continúa, verificá que el servidor esté funcionando.</p><button onClick={() => location.reload()}>Recargar</button></main>;
    return this.props.children;
  }
}
createRoot(document.getElementById('root')).render(<React.StrictMode><ErrorBoundary><Suspense fallback={<p role="status">Cargando RTL…</p>}><App /></Suspense></ErrorBoundary></React.StrictMode>);
