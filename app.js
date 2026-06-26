// Mock Database of Sports Courts
const COURTS_DATA = [
  {
    id: 'soccer-1',
    name: 'El Kaiser Fútbol 5',
    sport: 'futbol',
    sportLabel: 'Fútbol 5',
    location: 'Yerba Buena',
    price: 24000,
    rating: 4.8,
    image: 'assets/kaiser_futbol.png',
    features: ['Césped Sintético', 'Luz LED', 'Estacionamiento', 'Bar Deportivo'],
    availableSlots: ['16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00']
  },
  {
    id: 'soccer-2',
    name: 'SB5 Fútbol',
    sport: 'futbol',
    sportLabel: 'Fútbol 7',
    location: 'Yerba Buena',
    price: 34000,
    rating: 4.6,
    image: 'assets/sb5_futbol.png',
    features: ['Césped Sintético F7', 'Reflectores LED', 'Vestuarios', 'Bar & Parrilla'],
    availableSlots: ['17:00', '18:00', '19:00', '20:00', '21:00', '22:00']
  },
  {
    id: 'soccer-3',
    name: 'Complejo Las Cañas Fútbol',
    sport: 'futbol',
    sportLabel: 'Fútbol 11',
    location: 'Yerba Buena',
    price: 48000,
    rating: 4.9,
    image: 'assets/las_canas_futbol.png',
    features: ['Césped Profesional F11', 'Tribunas', 'Estacionamiento Amplio', 'Tercer Tiempo'],
    availableSlots: ['18:00', '19:00', '20:00', '21:00', '22:00']
  },
  {
    id: 'padel-1',
    name: 'Las Cañas Pádel',
    sport: 'padel',
    sportLabel: 'Pádel',
    location: 'Yerba Buena',
    price: 18000,
    rating: 4.9,
    image: 'assets/las_canas_padel.png',
    features: ['Vidrio Templado Panorámico', 'Césped Azul WPT', 'Palas de Alquiler', 'Bar y Vestuarios'],
    availableSlots: ['16:00', '17:30', '19:00', '20:30', '22:00']
  },
  {
    id: 'padel-2',
    name: 'Padel Point',
    sport: 'padel',
    sportLabel: 'Pádel',
    location: 'Yerba Buena',
    price: 16000,
    rating: 4.7,
    image: 'assets/padel_point.png',
    features: ['Cancha de Blindex', 'Césped Sintético', 'Iluminación LED', 'Reserva Directa'],
    availableSlots: ['16:00', '17:30', '19:00', '20:30', '22:00']
  },
  {
    id: 'padel-3',
    name: 'MAD Pádel Club',
    sport: 'padel',
    sportLabel: 'Pádel',
    location: 'Yerba Buena',
    price: 19000,
    rating: 4.8,
    image: 'assets/mad_padel.png',
    features: ['Canchas Techadas', 'Césped Sintético Pro', 'Escuela de Pádel', 'Estacionamiento'],
    availableSlots: ['15:00', '16:30', '18:00', '19:30', '21:00']
  },
  {
    id: 'basketball-1',
    name: 'Club Talleres de Tafí Viejo',
    sport: 'basquet',
    sportLabel: 'Básquetbol',
    location: 'Tafí Viejo',
    price: 22000,
    rating: 4.9,
    image: 'assets/talleres_tafi.png',
    features: ['Piso de Parquet Flotante', 'Tableros de Vidrio Templado', 'Estadio Techado', 'Colores Oficiales'],
    availableSlots: ['16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00']
  },
  {
    id: 'basketball-2',
    name: 'Club Atlético Tucumán BB',
    sport: 'basquet',
    sportLabel: 'Básquetbol',
    location: 'San Miguel de Tucumán',
    price: 18000,
    rating: 4.5,
    image: 'assets/tucuman_bb.png',
    features: ['Madera Parquet Pintado', 'Aros Profesionales', 'Techado Completo', 'Luz LED'],
    availableSlots: ['15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00']
  },
  {
    id: 'basketball-3',
    name: 'Club Belgrano Cultural y Deportivo',
    sport: 'basquet',
    sportLabel: 'Básquetbol',
    location: 'San Miguel de Tucumán',
    price: 16000,
    rating: 4.3,
    image: 'assets/club_belgrano.png',
    features: ['Madera Parquet Histórica', 'Luces LED Deportivas', 'Estacionamiento', 'Buffet del Club'],
    availableSlots: ['16:00', '17:00', '18:00', '19:00', '20:00', '21:00']
  }
];

// App State
let state = {
  currentTab: 'find', // 'find' or 'bookings'
  selectedSport: 'all',
  searchQuery: '',
  selectedLocation: 'all',
  bookings: JSON.parse(localStorage.getItem('sports_bookings') || '[]'),
  
  // Booking Form State
  bookingCourt: null,
  bookingDate: '',
  bookingSlot: '',
};

// DOM Elements
const elements = {
  tabFindBtn: document.getElementById('tab-find-btn'),
  tabBookingsBtn: document.getElementById('tab-bookings-btn'),
  viewFind: document.getElementById('view-find'),
  viewBookings: document.getElementById('view-bookings'),
  
  // Filters
  searchInput: document.getElementById('search-input'),
  locationSelect: document.getElementById('location-select'),
  sportCategories: document.getElementById('sport-categories'),
  courtsGrid: document.getElementById('courts-grid'),
  
  // Bookings list
  bookingsList: document.getElementById('bookings-list'),
  noBookingsView: document.getElementById('no-bookings-view'),
  
  // Booking Modal
  bookingModal: document.getElementById('booking-modal'),
  closeBookingBtn: document.getElementById('close-booking-btn'),
  modalCourtSport: document.getElementById('modal-court-sport'),
  modalCourtTitle: document.getElementById('modal-court-title'),
  bookingDateInput: document.getElementById('booking-date'),
  slotsContainer: document.getElementById('slots-container'),
  summarySubtotal: document.getElementById('summary-subtotal'),
  summaryTotal: document.getElementById('summary-total'),
  bookingForm: document.getElementById('booking-form'),
  confirmBookingBtn: document.getElementById('confirm-booking-btn'),
  
  // Success Modal
  successModal: document.getElementById('success-modal'),
  closeSuccessBtn: document.getElementById('close-success-btn'),
  ticketCode: document.getElementById('ticket-code'),
  ticketCourt: document.getElementById('ticket-court'),
  ticketLocation: document.getElementById('ticket-location'),
  ticketDate: document.getElementById('ticket-date'),
  ticketHour: document.getElementById('ticket-hour'),
  ticketPrice: document.getElementById('ticket-price'),
  ticketUser: document.getElementById('ticket-user')
};

// Initialize App
function init() {
  setupEventListeners();
  renderCourts();
  renderBookings();
  
  // Set tomorrow as minimum date for datepicker
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  elements.bookingDateInput.min = tomorrowStr;
  elements.bookingDateInput.value = tomorrowStr;
  state.bookingDate = tomorrowStr;
}

// Event Listeners Setup
function setupEventListeners() {
  // Tabs Navigation
  elements.tabFindBtn.addEventListener('click', () => switchTab('find'));
  elements.tabBookingsBtn.addEventListener('click', () => switchTab('bookings'));
  
  // Search and Filters
  elements.searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.toLowerCase().trim();
    renderCourts();
  });
  
  elements.locationSelect.addEventListener('change', (e) => {
    state.selectedLocation = e.target.value;
    renderCourts();
  });
  
  // Category buttons
  elements.sportCategories.addEventListener('click', (e) => {
    const categoryBtn = e.target.closest('.category-pill');
    if (!categoryBtn) return;
    
    // Clear active class from all pills
    document.querySelectorAll('.category-pill').forEach(btn => btn.classList.remove('active'));
    categoryBtn.classList.add('active');
    
    state.selectedSport = categoryBtn.dataset.sport;
    renderCourts();
  });
  
  // Close Modals
  elements.closeBookingBtn.addEventListener('click', closeBookingModal);
  elements.closeSuccessBtn.addEventListener('click', () => {
    elements.successModal.classList.remove('open');
  });
  
  // Date change handler in modal
  elements.bookingDateInput.addEventListener('change', (e) => {
    state.bookingDate = e.target.value;
    state.bookingSlot = ''; // Reset selected slot when date changes
    renderTimeSlots();
    updateConfirmButtonState();
  });
  
  // Booking Form Submission
  elements.bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    processBooking();
  });
}

// Switch between Find Courts and My Bookings tabs
function switchTab(tab) {
  state.currentTab = tab;
  if (tab === 'find') {
    elements.tabFindBtn.classList.add('active');
    elements.tabBookingsBtn.classList.remove('active');
    elements.viewFind.classList.add('active');
    elements.viewBookings.classList.remove('active');
  } else {
    elements.tabFindBtn.classList.remove('active');
    elements.tabBookingsBtn.classList.add('active');
    elements.viewFind.classList.remove('active');
    elements.viewBookings.classList.add('active');
    renderBookings();
  }
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0
  }).format(amount);
}

// Format Date to friendly Spanish string (e.g. Viernes, 12 de Junio)
function formatFriendlyDate(dateStr) {
  const parts = dateStr.split('-');
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return date.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

// Render Courts Grid based on active filters
function renderCourts() {
  const filtered = COURTS_DATA.filter(court => {
    const matchesSport = state.selectedSport === 'all' || court.sport === state.selectedSport;
    const matchesLocation = state.selectedLocation === 'all' || court.location.includes(state.selectedLocation);
    const matchesSearch = court.name.toLowerCase().includes(state.searchQuery) || 
                          court.features.some(f => f.toLowerCase().includes(state.searchQuery)) ||
                          court.location.toLowerCase().includes(state.searchQuery);
    return matchesSport && matchesLocation && matchesSearch;
  });
  
  if (filtered.length === 0) {
    elements.courtsGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem;">
        <i class="fa-regular fa-face-frown" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
        <h3 style="font-weight: 800; font-size: 1.3rem; margin-bottom: 0.5rem;">No se encontraron canchas</h3>
        <p style="color: var(--text-secondary); font-size: 0.95rem;">Prueba cambiando los filtros o buscando otro término.</p>
      </div>
    `;
    return;
  }
  
  elements.courtsGrid.innerHTML = filtered.map(court => {
    const featuresHTML = court.features.map(feat => `<span class="feature-tag">${feat}</span>`).join('');
    
    return `
      <article class="court-card" data-id="${court.id}">
        <div class="court-image-wrapper">
          <img class="court-image" src="${court.image}" alt="${court.name}">
          <span class="sport-badge ${court.sport}">
            <i class="fa-solid ${getSportIcon(court.sport)}"></i> ${court.sportLabel}
          </span>
        </div>
        <div class="court-info">
          <div class="court-header">
            <h2 class="court-title">${court.name}</h2>
            <div class="court-rating">
              <i class="fa-solid fa-star"></i>
              <span>${court.rating}</span>
            </div>
          </div>
          <div class="court-location">
            <i class="fa-solid fa-location-dot"></i>
            <span>${court.location}</span>
          </div>
          <div class="court-features">
            ${featuresHTML}
          </div>
        </div>
        <div class="court-footer">
          <div class="court-price">
            <span class="price-lbl">Precio por hora</span>
            <span class="price-val">${formatCurrency(court.price)} <span>/ hr</span></span>
          </div>
          <button class="book-btn" onclick="openBookingModal('${court.id}')">
            Reservar <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </article>
    `;
  }).join('');
}

// Get Sport icon for UI badge
function getSportIcon(sport) {
  switch (sport) {
    case 'futbol': return 'fa-soccer-ball';
    case 'padel': return 'fa-table-tennis-paddle-ball';
    case 'basquet': return 'fa-basketball';
    default: return 'fa-dumbbell';
  }
}

// Open Booking Modal for specific court
function openBookingModal(courtId) {
  const court = COURTS_DATA.find(c => c.id === courtId);
  if (!court) return;
  
  state.bookingCourt = court;
  // Retain selected date (or defaults to tomorrow)
  state.bookingSlot = '';
  
  // Set texts in Modal
  elements.modalCourtSport.innerText = court.sportLabel;
  elements.modalCourtTitle.innerText = court.name;
  
  // Set prices
  elements.summarySubtotal.innerText = formatCurrency(court.price);
  elements.summaryTotal.innerText = formatCurrency(court.price);
  
  // Render slots
  renderTimeSlots();
  updateConfirmButtonState();
  
  // Open modal animation
  elements.bookingModal.classList.add('open');
}

function closeBookingModal() {
  elements.bookingModal.classList.remove('open');
  elements.bookingForm.reset();
  state.bookingCourt = null;
  state.bookingSlot = '';
}

// Check if a slot is already booked for this court on the selected date
function isSlotBooked(courtId, date, slot) {
  return state.bookings.some(booking => 
    booking.courtId === courtId && 
    booking.date === date && 
    booking.slot === slot
  );
}

// Render dynamic slots with availability checking
function renderTimeSlots() {
  if (!state.bookingCourt) return;
  
  const slots = state.bookingCourt.availableSlots;
  const courtId = state.bookingCourt.id;
  const date = state.bookingDate;
  
  elements.slotsContainer.innerHTML = slots.map(slot => {
    const isBooked = isSlotBooked(courtId, date, slot);
    const classes = `slot-btn ${isBooked ? 'disabled' : ''} ${state.bookingSlot === slot ? 'selected' : ''}`;
    const onclickAttr = isBooked ? '' : `onclick="selectSlot('${slot}')"`;
    
    return `
      <button type="button" class="${classes}" ${onclickAttr} data-slot="${slot}">
        ${slot}
      </button>
    `;
  }).join('');
}

// Select a specific slot in modal
window.selectSlot = function(slot) {
  // Clear previous selected
  document.querySelectorAll('.slot-btn').forEach(btn => {
    if (!btn.classList.contains('disabled')) {
      btn.classList.remove('selected');
    }
  });
  
  state.bookingSlot = slot;
  
  // Highlight the current one
  const btn = document.querySelector(`.slot-btn[data-slot="${slot}"]`);
  if (btn) btn.classList.add('selected');
  
  updateConfirmButtonState();
};

// Enable/Disable Confirm Booking Button based on slot selection
function updateConfirmButtonState() {
  elements.confirmBookingBtn.disabled = !state.bookingSlot;
}

// Process court booking simulation
function processBooking() {
  if (!state.bookingCourt || !state.bookingSlot || !state.bookingDate) return;
  
  const name = document.getElementById('client-name').value.trim();
  const phone = document.getElementById('client-phone').value.trim();
  const email = document.getElementById('client-email').value.trim();
  
  if (!name || !phone || !email) {
    alert('Por favor, completa todos los campos del formulario.');
    return;
  }
  
  // Generate random booking code
  const codeNum = Math.floor(1000 + Math.random() * 9000);
  const codeChar = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const bookingCode = `RES-${codeChar}${codeNum}`;
  
  const newBooking = {
    id: bookingCode,
    courtId: state.bookingCourt.id,
    courtName: state.bookingCourt.name,
    sportLabel: state.bookingCourt.sportLabel,
    sport: state.bookingCourt.sport,
    location: state.bookingCourt.location,
    date: state.bookingDate,
    slot: state.bookingSlot,
    price: state.bookingCourt.price,
    userName: name,
    userPhone: phone,
    userEmail: email,
    createdAt: new Date().toISOString()
  };
  
  // Save booking
  state.bookings.push(newBooking);
  localStorage.setItem('sports_bookings', JSON.stringify(state.bookings));
  
  // Close booking modal
  closeBookingModal();
  
  // Open success modal
  showSuccessModal(newBooking);
  
  // Refresh views
  renderCourts();
  renderBookings();
}

// Load success details into confirmation ticket modal
function showSuccessModal(booking) {
  elements.ticketCode.innerText = booking.id;
  elements.ticketCourt.innerText = booking.courtName;
  elements.ticketLocation.innerText = booking.location;
  elements.ticketDate.innerText = formatFriendlyDate(booking.date);
  elements.ticketHour.innerText = booking.slot + ' hs';
  elements.ticketPrice.innerText = formatCurrency(booking.price);
  elements.ticketUser.innerText = booking.userName;
  
  elements.successModal.classList.add('open');
}

// Render "My Bookings" list
function renderBookings() {
  if (state.bookings.length === 0) {
    elements.noBookingsView.style.display = 'flex';
    elements.bookingsList.style.display = 'none';
    return;
  }
  
  elements.noBookingsView.style.display = 'none';
  elements.bookingsList.style.display = 'grid';
  
  // Sort bookings by date and time (newest first)
  const sortedBookings = [...state.bookings].sort((a, b) => {
    const dateTimeA = new Date(a.date + 'T' + a.slot.split(':')[0] + ':00');
    const dateTimeB = new Date(b.date + 'T' + b.slot.split(':')[0] + ':00');
    return dateTimeB - dateTimeA;
  });
  
  elements.bookingsList.innerHTML = sortedBookings.map(booking => {
    return `
      <article class="booking-item-card">
        <div class="booking-item-header">
          <h3 class="booking-item-title">${booking.courtName}</h3>
          <span class="booking-status-badge">Confirmado</span>
        </div>
        <div class="booking-item-body">
          <div class="booking-item-row">
            <span class="booking-item-lbl">Código de reserva:</span>
            <span class="booking-item-val" style="color: var(--accent-dark); font-family: monospace;">${booking.id}</span>
          </div>
          <div class="booking-item-row">
            <span class="booking-item-lbl">Deporte:</span>
            <span class="booking-item-val">${booking.sportLabel}</span>
          </div>
          <div class="booking-item-row">
            <span class="booking-item-lbl">Fecha:</span>
            <span class="booking-item-val">${formatFriendlyDate(booking.date)}</span>
          </div>
          <div class="booking-item-row">
            <span class="booking-item-lbl">Horario:</span>
            <span class="booking-item-val">${booking.slot} hs</span>
          </div>
          <div class="booking-item-row">
            <span class="booking-item-lbl">Titular:</span>
            <span class="booking-item-val">${booking.userName}</span>
          </div>
          <div class="booking-item-row">
            <span class="booking-item-lbl">Total pagado:</span>
            <span class="booking-item-val">${formatCurrency(booking.price)}</span>
          </div>
        </div>
        <button class="cancel-booking-btn" onclick="cancelBooking('${booking.id}')">
          <i class="fa-solid fa-trash-can"></i> Cancelar Reserva
        </button>
      </article>
    `;
  }).join('');
}

// Cancel Booking Handler
window.cancelBooking = function(bookingId) {
  if (confirm('¿Estás seguro de que deseas cancelar esta reserva?')) {
    state.bookings = state.bookings.filter(b => b.id !== bookingId);
    localStorage.setItem('sports_bookings', JSON.stringify(state.bookings));
    renderBookings();
    renderCourts(); // Refresh court card booking state if modal is opened later
  }
};

// Helper for switching tabs from placeholder CTA button
window.goToBookings = function() {
  switchTab('bookings');
};

window.goToFind = function() {
  switchTab('find');
};

// Start the application on DOM Content Loaded
document.addEventListener('DOMContentLoaded', init);
