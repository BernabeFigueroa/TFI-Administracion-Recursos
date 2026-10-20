import React, { useState } from "react";
export default function About({ onFind, onPlan, initialTab = "company" }) {
 const [subtab, switchAboutSubtab] = useState(initialTab);
 const goToFind = onFind;
 const openClubModal = (name, price) => onPlan({name,price});
 return (<section id="view-about" className="view-container active" aria-labelledby="tab-about-btn">
        
        <div className="about-subtabs-nav" role="tablist" aria-label="Secciones de Sobre Nosotros">
          <button type="button" id="subtab-about-company-btn" className={`about-subtab-btn ${subtab === "company" ? "active" : ""}`} role="tab" aria-selected={subtab === "company"} aria-controls="about-subview-company" onClick={() => { switchAboutSubtab('company'); }}>
            <i className="fa-solid fa-building-columns"></i>
            <span>Sobre RTL</span>
          </button>
          <button type="button" id="subtab-about-plans-btn" className={`about-subtab-btn ${subtab === "plans" ? "active" : ""}`} role="tab" aria-selected={subtab === "plans"} aria-controls="about-subview-plans" onClick={() => { switchAboutSubtab('plans'); }}>
            <i className="fa-solid fa-trophy"></i>
            <span>Planes para Clubes</span>
            <span className="subtab-pill-badge">Para Clubes</span>
          </button>
        </div>

        
        <div id="about-subview-company" className={`about-subview ${subtab === "company" ? "active" : ""}`}>
          
          <div className="about-hero-card">
            <div className="about-badge-row">
              <span className="about-badge"><i className="fa-solid fa-bolt"></i> Start-up Deportiva 2026</span>
              <span className="about-badge secondary"><i className="fa-solid fa-location-dot"></i> Sede Tucumán, Argentina</span>
              <div className="about-status-indicator">
                <span className="status-dot"></span>
                <span>AWS Cloud • 99.9% Uptime</span>
              </div>
            </div>
            <h2 className="about-hero-title">RTL <span>| Reserva Tu Lugar</span></h2>
            <p className="about-hero-description">
              Plataforma tecnológica diseñada para digitalizar, simplificar y potenciar la gestión y reserva en tiempo real de canchas y complejos deportivos en Argentina.
            </p>
          </div>

          
          <div className="about-grid-two">
            <div className="about-card highlight">
              <div className="about-card-icon"><i className="fa-solid fa-bullseye"></i></div>
              <div className="about-card-content">
                <h3>Nuestra Misión</h3>
                <p>
                  Conectar personas con complejos deportivos y de recreación mediante una plataforma que simplifica reservas, administración y conexión con clientes, optimizando la gestión de las PyMEs del sector y promoviendo un estilo de vida activo.
                </p>
              </div>
            </div>

            <div className="about-card highlight">
              <div className="about-card-icon"><i className="fa-solid fa-mountain-sun"></i></div>
              <div className="about-card-content">
                <h3>Nuestra Visión</h3>
                <p>
                  En los próximos 10 años, RTL será la plataforma líder en Argentina para la gestión de complejos deportivos y de entretenimiento, reconocida por impulsar el crecimiento de las PyMEs del sector y fomentar una cultura más activa en la sociedad.
                </p>
              </div>
            </div>
          </div>

          
          <div className="about-section-block">
            <h3 className="about-section-title"><i className="fa-solid fa-chart-line"></i> Objetivos Estratégicos & Métricas</h3>
            <div className="about-stats-grid">
              <div className="about-stat-card">
                <span className="stat-number">-30%</span>
                <span className="stat-title">Deserción de Turnos</span>
                <p>Reducción del ausentismo mediante seña online obligatoria y recordatorios automáticos de WhatsApp 24h y 2h antes.</p>
              </div>
              <div className="about-stat-card">
                <span className="stat-number">+20%</span>
                <span className="stat-title">Base de Clientes</span>
                <p>Aumento de clientes para complejos mediante estrategias de visibilización digital, sistema de referidos y promociones.</p>
              </div>
              <div className="about-stat-card">
                <span className="stat-number">100%</span>
                <span className="stat-title">Auditoría en Caja</span>
                <p>Módulo de auditoría de caja en tiempo real para dueños (control anti-fraude) y facturación electrónica homologada con ARCA.</p>
              </div>
              <div className="about-stat-card">
                <span className="stat-number">300 Mbps</span>
                <span className="stat-title">Conectividad Dedicada</span>
                <p>Fibra óptica simétrica corporativa Claro con enlace de respaldo secundario (CCC) y red local Ubiquiti UniFi.</p>
              </div>
            </div>
          </div>

          
          <div className="about-section-block">
            <h3 className="about-section-title"><i className="fa-solid fa-layer-group"></i> Propuesta de Valor para el Sector</h3>
            <div className="about-grid-two">
              <div className="about-card">
                <h4 className="card-subtitle"><i className="fa-solid fa-users"></i> Para los Deportistas</h4>
                <ul className="about-list">
                  <li><i className="fa-solid fa-check"></i> Búsqueda ágil por zona, deporte y servicios.</li>
                  <li><i className="fa-solid fa-check"></i> Reserva y confirmación inmediata con cupos en vivo.</li>
                  <li><i className="fa-solid fa-check"></i> Notificaciones y comprobante digital inmediato.</li>
                  <li><i className="fa-solid fa-check"></i> Reprogramación rápida ante contingencias climáticas.</li>
                </ul>
              </div>
              <div className="about-card">
                <h4 className="card-subtitle"><i className="fa-solid fa-briefcase"></i> Para los Complejos (PyMEs)</h4>
                <ul className="about-list">
                  <li><i className="fa-solid fa-check"></i> Reducción drástica de turnos caídos e impagos.</li>
                  <li><i className="fa-solid fa-check"></i> Control total de ingresos y arqueo de turnos en vivo.</li>
                  <li><i className="fa-solid fa-check-check"></i> Integración administrativa y contable simplificada.</li>
                  <li><i className="fa-solid fa-check"></i> Encuestas de satisfacción post-turno para mejorar reputación.</li>
                </ul>
              </div>
            </div>
          </div>

          
          <div className="club-invite-banner">
            <div className="club-invite-content">
              <h4><i className="fa-solid fa-trophy" style={{"color": "var(--accent-dark)", "marginRight": "0.5rem"}}></i> ¿Administrás un complejo o club deportivo?</h4>
              <p>Digitalizá turnos, reducí ausentismo y gestioná caja y stock con la app pensada para clubes argentinos.</p>
            </div>
            <button type="button" className="club-invite-cta" onClick={() => { switchAboutSubtab('plans'); }}>
              Ver Planes para Clubes <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>

          
          <div className="about-section-block">
            <h3 className="about-section-title"><i className="fa-solid fa-users"></i> Equipo Fundador de RTL</h3>
            <div className="team-cards-grid">
              <div className="student-card">
                <div className="student-avatar"><i className="fa-solid fa-user"></i></div>
                <div className="student-details">
                  <strong>Aybar Barrera, Lucas Facundo</strong>
                </div>
              </div>
              <div className="student-card">
                <div className="student-avatar"><i className="fa-solid fa-user"></i></div>
                <div className="student-details">
                  <strong>Castillo, Lautaro</strong>
                </div>
              </div>
              <div className="student-card">
                <div className="student-avatar"><i className="fa-solid fa-user"></i></div>
                <div className="student-details">
                  <strong>Figueroa, Cesar Bernabe</strong>
                </div>
              </div>
              <div className="student-card">
                <div className="student-avatar"><i className="fa-solid fa-user"></i></div>
                <div className="student-details">
                  <strong>Garcia, Cristian Nahuel</strong>
                </div>
              </div>
              <div className="student-card">
                <div className="student-avatar"><i className="fa-solid fa-user"></i></div>
                <div className="student-details">
                  <strong>Khouri, Jose Nicolas</strong>
                </div>
              </div>
              <div className="student-card">
                <div className="student-avatar"><i className="fa-solid fa-user"></i></div>
                <div className="student-details">
                  <strong>Molina Navarro, Juan Martin</strong>
                </div>
              </div>
              <div className="student-card">
                <div className="student-avatar"><i className="fa-solid fa-user"></i></div>
                <div className="student-details">
                  <strong>Svaldi, Luisina María</strong>
                </div>
              </div>
            </div>
          </div>

          
          <div className="about-cta-container">
            <button className="go-book-btn" onClick={() => { goToFind(); }}>
              <i className="fa-solid fa-magnifying-glass"></i> Explorar Canchas Disponibles
            </button>
          </div>
        </div>

        
        <div id="about-subview-plans" className={`about-subview ${subtab === "plans" ? "active" : ""}`}>
          <div className="plans-hero-header">
            <h2 className="plans-main-title">Elegí el plan perfecto para tu club</h2>
            <p className="plans-main-subtitle">Planes flexibles que se adaptan a las necesidades de tu club.</p>
          </div>

          <div className="club-pricing-grid">
            
            <div className="club-pricing-card featured-plan">
              <div className="plan-popular-badge">Más Popular</div>
              <div className="plan-card-body">
                <div className="plan-header">
                  <h3 className="plan-name">Pro</h3>
                  <div className="plan-price-row">
                    <span className="plan-amount">$50.000</span>
                    <span className="plan-period">/mes</span>
                  </div>
                  <p className="plan-description">Ideal para clubes medianos con múltiples necesidades.</p>
                </div>

                <ul className="plan-features-list">
                  <li><i className="fa-solid fa-check"></i> <span>Turnos y reservas</span></li>
                  <li><i className="fa-solid fa-check"></i> <span>Control de stock</span></li>
                  <li><i className="fa-solid fa-check"></i> <span>App para jugadores</span></li>
                  <li><i className="fa-solid fa-check"></i> <span>Torneos y rankings</span></li>
                  <li><i className="fa-solid fa-check"></i> <span>Estadísticas avanzadas</span></li>
                  <li><i className="fa-solid fa-check"></i> <span>Roles y permisos</span></li>
                  <li><i className="fa-solid fa-check"></i> <span>POS para cantina</span></li>
                  <li><i className="fa-solid fa-check"></i> <span>Arqueo de caja y movimientos</span></li>
                </ul>

                <button type="button" className="plan-cta-btn" onClick={() => { openClubModal('Pro', '$50.000 /mes'); }}>
                  Suscribirse Ahora
                </button>
              </div>
            </div>

            
            <div className="club-pricing-card">
              <div className="plan-card-body">
                <div className="plan-header">
                  <h3 className="plan-name">Elite</h3>
                  <div className="plan-price-row">
                    <span className="plan-amount">$100.000</span>
                    <span className="plan-period">/mes</span>
                  </div>
                  <p className="plan-description">Solución completa para grandes complejos deportivos.</p>
                </div>

                <ul className="plan-features-list">
                  <li><i className="fa-solid fa-check"></i> <span>Todo lo de Pro</span></li>
                  <li><i className="fa-solid fa-check"></i> <span>Multi-sede</span></li>
                  <li><i className="fa-solid fa-check"></i> <span>Reportes avanzados</span></li>
                  <li><i className="fa-solid fa-check"></i> <span>Soporte prioritario</span></li>
                  <li><i className="fa-solid fa-check"></i> <span>Gerente de cuenta dedicado</span></li>
                </ul>

                <button type="button" className="plan-cta-btn" onClick={() => { openClubModal('Elite', '$100.000 /mes'); }}>
                  Suscribirse Ahora
                </button>
              </div>
            </div>
          </div>

          
          <div className="plans-guarantee-card">
            <div className="guarantee-icon"><i className="fa-solid fa-shield-halved"></i></div>
            <div className="guarantee-text">
              <h4>14 días de prueba bonificados en todos los planes</h4>
              <p>Te asistimos con la configuración inicial y carga de canchas en menos de 24 horas. Sin costos ocultos.</p>
            </div>
            <button type="button" className="guarantee-btn" onClick={() => { openClubModal('Personalizado', 'A convenir'); }}>
              <i className="fa-solid fa-headset"></i> Hablar con Asesor
            </button>
          </div>
        </div>
      </section>);
}
