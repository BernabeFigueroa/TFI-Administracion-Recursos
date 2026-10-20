# RTL — Reserva Tu Lugar

Aplicación de reservas deportivas con frontend React y backend Node.js + SQLite. Una cuenta de administrador pertenece a un complejo, que contiene sus propias canchas físicas.

## Requisitos y ejecución

- Node.js 22.13 o superior. Se verificó con Node.js 22.20.0.
- React, React DOM y Vite se instalan mediante npm. El módulo `node:sqlite` es experimental en Node.js 22 y muestra una advertencia al iniciar.

```powershell
npm install
npm start
```

Abrir `http://127.0.0.1:3000` y `http://127.0.0.1:3000/admin/`. En desarrollo, Vite se integra como middleware del mismo servidor Node: no hace falta iniciar otro proceso ni configurar CORS. El servidor sirve tanto React como `/api`; no se debe usar Live Server o el servidor de Python para trabajar con la base de datos.

La primera ejecución crea `data/rtl.sqlite`, nueve complejos y tres canchas de referencia en cada uno. Los reinicios conservan los cambios. La base de datos y los archivos de acceso bajo `data/` están excluidos de Git y no son accesibles por HTTP.

## Crear administradores

No hay contraseñas predeterminadas ni registro público de administradores. Ejecutar desde el directorio del proyecto:

```powershell
npm run admin:create -- padel-3 admin@madpadel.local
```

El comando genera una contraseña aleatoria y la muestra UNA vez. Guardarla para entrar al panel. Para definir una contraseña propia de al menos 12 caracteres se puede usar la variable `ADMIN_PASSWORD`; no incluir contraseñas en Git. Un correo no puede registrarse dos veces. El comando no modifica cuentas existentes.

Identificadores de complejos: `soccer-1`, `soccer-2`, `soccer-3`, `padel-1`, `padel-2`, `padel-3` (MAD Pádel), `basketball-1`, `basketball-2`, `basketball-3`.

## Administración de RTL

`/superadmin/` es el panel exclusivo del equipo RTL. Sus cuentas y sesiones son independientes de las cuentas de los complejos. Para crear la primera cuenta, ejecutar con el correo del responsable:

```powershell
npm run superadmin:create -- responsable@tu-dominio.com
```

El comando muestra una contraseña aleatoria una sola vez; no modifica cuentas existentes. Desde el panel se pueden dar de alta complejos con sus canchas y primera cuenta, crear administradores adicionales, actualizar planes y contactos, registrar cobros y consultar solicitudes comerciales y actividad.

Los complejos existentes reciben inicialmente Básico con 30 días de vigencia y abono configurable en cero. Sus reservas y cuentas se conservan. Pro ($50.000 de referencia) habilita reportes e inventario; Elite ($100.000) agrega auditoría. RTL puede ajustar el abono de cada suscripción. Estos módulos se validan en el servidor: ocultarlos o bloquearlos en el menú no es la protección de acceso.

Una suscripción vencida pierde las funciones premium. La suspensión explícita además oculta el complejo del catálogo público y rechaza nuevas reservas, conservando historial y acceso administrativo. Registrar un cobro reactiva la suscripción hasta el vencimiento indicado. Los cobros son registros manuales, no operaciones de una pasarela de pagos.

Los recordatorios se guardan como borradores y permiten abrir correo o WhatsApp con un mensaje preparado. Una persona debe revisarlo y enviarlo desde esa aplicación. No hay envíos automáticos ni integración con proveedores de mensajería.

La API RTL usa `/api/superadmin/auth/*`, `/api/superadmin/complexes`, `/api/superadmin/accounts`, `/api/superadmin/complexes/:id/subscription`, `/payments`, `/reminders` y `/api/superadmin/audit`. Los módulos del club usan `/api/admin/subscription`, `/reports`, `/inventory` y `/audit`. Un acceso premium denegado devuelve 403 con `code: PLAN_REQUIRED`.

## Permisos de reservas

### Propósito de las pestañas

En `/admin/`, Panel de control resume ocupación y tareas por revisar; Reservas contiene agenda, historial y exportación; Mis canchas configura cada espacio; Clientes reúne contactos e historial por titular; Pagos e ingresos filtra turnos pagados y por cobrar. Reportes compara los meses, Inventario administra existencias, Auditoría permite buscar movimientos y Mi suscripción muestra vigencia y herramientas habilitadas. Los cobros de los turnos se agrupan por fecha del turno, no por fecha de recepción del dinero.

En `/superadmin/`, Complejos es el directorio de espacios y cuentas; Suscripciones concentra planes, vencimientos, renovación y borradores de recordatorios; Cobros registrados conserva comprobantes; Solicitudes de alta permite revisar interesados e iniciar su alta; Actividad muestra la trazabilidad por complejo y responsable. Las métricas y acciones se limitan a cada sección. Los historiales comerciales muestran los últimos 100 registros y la actividad global los últimos 150.

- Complejo y cancha física tienen identificadores distintos: `courtId` identifica el complejo en el contrato existente de la interfaz y `resourceId` identifica la cancha física.
- Cada administrador consulta y modifica únicamente su complejo. El servidor deriva la pertenencia desde la sesión; cambiar IDs en el navegador no concede acceso.
- Las canchas permiten editar nombre, superficie, tipo, capacidad, precio, foto y habilitación. Deshabilitar una cancha impide nuevas reservas y conserva su historial.
- Las reservas se validan contra el horario y tarifa guardados en el servidor. Una restricción en SQLite rechaza turnos superpuestos, incluso si llegan solicitudes simultáneas. Cada cancha tiene disponibilidad independiente.
- Los clientes pueden reservar sin cuenta. Sus reservas se vinculan a una cookie privada de ese navegador durante 30 días. Borrar cookies o usar otro navegador impide recuperar ese listado. El administrador sigue conservando los registros. No es un sistema de cuentas de clientes.
- Las sesiones de administrador duran ocho horas; las contraseñas usan scrypt con sal aleatoria y las cookies son HttpOnly y SameSite=Strict. La base de datos guarda hashes de tokens, no tokens de sesión en texto plano.
- Las cookies de cliente y administrador son distintas: iniciar o cerrar sesión administrativa conserva las reservas personales del navegador.
- La disponibilidad pública no expone nombres, contactos ni códigos de reservas ajenas. Los datos personales solo están disponibles al titular de la sesión de cliente y al administrador del complejo.
- Los cambios se actualizan al enfocar la ventana y cada 15 segundos. No hay WebSockets. El servidor siempre valida disponibilidad al guardar.

Los registros previos de `localStorage` no se importan automáticamente. Los navegadores nuevos usan la base de datos del servidor; el almacenamiento local anterior queda intacto.

## API

Las escrituras requieren `Content-Type: application/json`. Los errores devuelven `{ "error": "mensaje" }` con estado HTTP correspondiente.

| Método | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/health` | Estado del servidor |
| GET | `/api/catalog` | Complejos y sus canchas |
| POST | `/api/auth/login` | Acceso con correo y contraseña |
| GET | `/api/auth/me` | Administrador autenticado o `null` |
| POST | `/api/auth/logout` | Invalidar sesión administrativa |
| GET | `/api/availability?complexId=padel-3&date=2026-10-20` | Bloques ocupados sin datos personales |
| GET | `/api/bookings/mine` | Crear sesión de cliente si es necesario y consultar sus reservas |
| POST | `/api/bookings` | Reserva del cliente; requiere cookie obtenida en `mine` |
| POST | `/api/bookings/:id/cancel` | Cancelar reserva propia o del complejo administrado |
| GET | `/api/admin/bookings` | Reservas e historial del complejo autenticado |
| POST | `/api/admin/bookings` | Crear reserva administrativa |
| PATCH | `/api/admin/bookings/:id` | Confirmar o registrar/revertir un pago manual |
| POST | `/api/admin/courts` | Agregar cancha al complejo autenticado |
| PUT | `/api/admin/courts/:id` | Actualizar cancha del complejo autenticado |
| POST | `/api/club-requests` | Guardar solicitud de alta de club |

Crear reserva: `{ resourceId, date, slot, duration, userName, userPhone, userEmail }`. `duration` admite 60, 90 o 120 minutos; la fecha debe ser futura y estar dentro de los próximos 366 días. Los horarios se interpretan en Argentina, UTC−03:00. El servidor calcula el precio. Solo la ruta administrativa admite estado pendiente y registro manual de pago.

## Pruebas

```powershell
npm test
```

Usan servidores locales y bases temporales aisladas. Una prueba adicional comprueba las entradas React, la transformación de todos los módulos JSX/CSS y que Vite no exponga los archivos del backend. Cubren permisos entre complejos, propiedad de reservas, precios, horarios superpuestos, solicitudes simultáneas, validaciones, cookies, persistencia, protección de archivos privados y límites de intentos de acceso. No ejecutan compilaciones ni modifican la base de la aplicación.

## Configuración y alcance

Variables: `HOST` (por defecto `127.0.0.1`), `PORT` (3000), `DB_PATH`, `COOKIE_SECURE` y `APP_ORIGIN`. `.env.example` documenta los valores; `.env` no se carga automáticamente. Si se crea un `.env`, iniciar con `node --env-file=.env server/start.cjs`.

La interfaz React está en `client/src/`: `public/` contiene catálogo, reservas, información institucional, planes y contacto; `admin/` contiene acceso, agenda, canchas, clientes y pagos; `shared/` contiene el cliente HTTP y componentes reutilizables. El panel de RTL se encuentra en `superadmin/`. Las vistas se eligen por las rutas `/`, `/admin/` y `/superadmin/`; los formularios y modales usan estado de React. Los scripts anteriores que manipulaban el DOM fueron retirados. `courts.js` se conserva únicamente como catálogo inicial para SQLite.

Este es un backend local funcional. Para alojarlo se necesita un proceso Node con disco persistente para SQLite. No se puede desplegar como un sitio puramente estático. Para una publicación futura, el script `npm run build` genera `client/dist/`; no se ejecutó ninguna compilación durante la migración, según las instrucciones del proyecto. El arranque en producción sirve esos archivos generados y no inicia Vite. Esa salida de producción debe generarse y verificarse antes de desplegar. En producción, definir `NODE_ENV=production`, `COOKIE_SECURE=true` y `APP_ORIGIN` con la URL HTTPS exacta, detrás de un proxy que termine HTTPS. No se confía automáticamente en cabeceras de IP enviadas por proxies; limitar intentos también en el proxy si se publica.

Para respaldar los datos, detener el servidor y copiar el directorio `data/` completo a una ubicación protegida. No copiar solo el archivo principal mientras SQLite está escribiendo en WAL.

El registro de pagos es manual: no procesa dinero. No incluye recuperación de contraseña, facturación fiscal ni despliegue en la nube. Las altas de administradores por web y las solicitudes comerciales requieren el acceso exclusivo de RTL. Las fotos se guardan en la base de datos como imágenes comprimidas; para un volumen mayor corresponde usar almacenamiento de archivos dedicado.
