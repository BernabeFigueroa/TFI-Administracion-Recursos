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


