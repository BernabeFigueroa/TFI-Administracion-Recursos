import React from "react";
export default function Footer({ onNavigate }) {
 const switchTab = onNavigate;
 const switchAboutSubtab = () => onNavigate("about", "plans");
 return (<footer className="rtl-mini-footer">
      <div className="mini-footer-container">
        
        <div className="mini-footer-brand" onClick={() => { switchTab('find'); }} style={{"cursor": "pointer"}} title="Ir al inicio">
          <div className="mini-footer-logo-wrap">
            <img src="/assets/logo.png" alt="RTL Logo" className="mini-footer-logo" />
          </div>
          <div className="mini-footer-brand-text">
            <strong>RTL • Reserva Tu Lugar</strong>
            <p>Tu lugar en la cancha, reservado en segundos.</p>
          </div>
        </div>

        <address className="mini-footer-contact" aria-label="Información de contacto">
          <h2>Hablemos de tu próximo partido</h2>
          <p>¿Tenés una consulta? Estamos para ayudarte.</p>
          <div className="footer-contact-links">
            <a href="tel:+543865658984" className="footer-contact-link">
              <span className="footer-contact-icon"><i className="fa-solid fa-phone" aria-hidden="true"></i></span>
              <span><small>Teléfono de contacto</small><strong>3865658984</strong></span>
            </a>
            <a href="mailto:Lionelmessi91218@gmail.com" className="footer-contact-link">
              <span className="footer-contact-icon"><i className="fa-regular fa-envelope" aria-hidden="true"></i></span>
              <span><small>Correo electrónico</small><strong>Lionelmessi91218@gmail.com</strong></span>
            </a>
          </div>
          <a className="footer-whatsapp-link" href="https://wa.me/5493865658984" target="_blank" rel="noopener noreferrer">
            <i className="fa-brands fa-whatsapp" aria-hidden="true"></i> Escribinos por WhatsApp <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
          </a>
        </address>

        
        <nav className="mini-footer-nav" aria-label="Navegación secundaria">
          <button type="button" className="mini-footer-link" onClick={() => { switchTab('find'); }}>Buscar Canchas</button>
          <span className="mini-footer-dot">•</span>
          <button type="button" className="mini-footer-link" onClick={() => { switchTab('bookings'); }}>Mis Reservas</button>
          <span className="mini-footer-dot">•</span>
          <button type="button" className="mini-footer-link" onClick={() => { switchTab('about'); switchAboutSubtab('company');; }}>Sobre Nosotros</button>
          <span className="mini-footer-dot">•</span>
          <button type="button" className="mini-footer-link" onClick={() => { switchTab('about'); switchAboutSubtab('plans');; }}>Planes para Clubes</button>
        </nav>

        
        <div className="mini-footer-copy">
          <p>&copy; 2026 <strong>RTL (Reserva Tu Lugar)</strong>. Todos los derechos reservados. San Miguel de Tucumán, Argentina.</p>
        </div>
      </div>
    </footer>);
}
