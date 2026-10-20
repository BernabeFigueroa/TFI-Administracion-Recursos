# RTL — Reserva Tu Lugar

Aplicación web para reservar canchas deportivas y administrar complejos. Incluye un panel para cada club y un panel exclusivo de RTL para gestionar las suscripciones al servicio.

Proyecto académico de Administración de Recursos — UTN, 2026.

## Tecnologías

- **Frontend:** React y Vite.
- **Backend:** Node.js, con su servidor HTTP integrado.
- **Base de datos:** SQLite mediante `node:sqlite`.
- **Autenticación:** sesiones en cookies HttpOnly y contraseñas protegidas con scrypt.

## Instalación y ejecución

Requiere **Node.js 22.13 o superior**, con npm. Se verificó con Node.js 22.20.0. En esta versión de Node, SQLite puede mostrar una advertencia de módulo experimental.

```sh
git clone https://github.com/BernabeFigueroa/TFI-Administracion-Recursos.git
cd TFI-Administracion-Recursos
npm install
npm start
```

El servidor inicia en `http://127.0.0.1:3000`. Para detenerlo, presionar **Ctrl+C** en la terminal.

| Ruta | Destinatario | Propósito |
| --- | --- | --- |
| `/` | Clientes | Buscar complejos, reservar y consultar sus reservas |
| `/admin/` | Administradores de clubes | Gestionar únicamente su complejo y sus canchas |
| `/superadmin/` | Equipo de RTL | Administrar complejos, cuentas y suscripciones |

El frontend y la API funcionan en el mismo servidor. Se debe usar `npm start`: abrir el HTML directamente o usar Live Server no permite trabajar con el backend.

La primera ejecución crea `data/rtl.sqlite` con nueve complejos de referencia y tres canchas por complejo. Los reinicios conservan los cambios. **La base local y sus cuentas no se incluyen en Git:** cada instalación debe crear sus propios accesos.

## Crear los accesos

No hay usuarios ni contraseñas predeterminados. Desde la carpeta del proyecto, crear la primera cuenta del equipo RTL:

```sh
npm run superadmin:create -- responsable@ejemplo.com
```

El comando genera una contraseña aleatoria y la muestra una sola vez. Guardarla en un lugar seguro. No modifica una cuenta existente.

Con ese acceso, ingresar a `/superadmin/` y usar **Nuevo complejo** para crear un club, sus canchas y su primera cuenta administradora. **Complejos → Crear cuenta** agrega otro administrador al mismo club.

También se puede crear una cuenta para un complejo inicial desde la terminal:

```sh
npm run admin:create -- padel-3 administrador@ejemplo.com
```

`padel-3` corresponde a MAD Pádel Club. Otros identificadores iniciales: `soccer-1`, `soccer-2`, `soccer-3`, `padel-1`, `padel-2`, `basketball-1`, `basketball-2` y `basketball-3`.

Ambos comandos admiten `ADMIN_PASSWORD` para definir una contraseña propia de entre 12 y 256 caracteres. No guardar contraseñas en el repositorio.

## Funcionalidades

### Clientes

- Búsqueda por complejo, localidad y deporte.
- Selección de cancha física, fecha y horario disponible.
- Creación, consulta y cancelación de reservas propias.
- Consulta de información de RTL, planes y datos de contacto.

Las reservas del cliente se vinculan a una cookie de ese navegador durante 30 días. No hay registro de cuentas de clientes: borrar cookies o cambiar de navegador impide recuperar ese listado personal. El club conserva su historial.

### Administración del club

| Apartado | Función |
| --- | --- |
| Panel de control | Resumen de ocupación y tareas por revisar |
| Reservas | Agenda por cancha, listado, historial y exportación CSV |
| Mis canchas | Alta y edición de foto, tarifa, superficie, capacidad y habilitación |
| Clientes | Directorio, búsqueda e historial por titular |
| Pagos e ingresos | Turnos pagados y por cobrar, con filtros y registro manual de pago |
| Reportes | Comparación mensual de reservas e importes |
| Inventario | Productos, precios, existencias y filtros de stock |
| Auditoría | Consulta y búsqueda de movimientos del complejo |
| Mi suscripción | Plan, vigencia y herramientas habilitadas |

Cada cuenta accede únicamente a los datos de su complejo. Las canchas físicas tienen disponibilidad independiente. El servidor valida horarios, tarifas y superposiciones antes de guardar una reserva.

### Administración de RTL

| Apartado | Función |
| --- | --- |
| Complejos | Directorio de clubes, cantidad de canchas y cuentas administradoras |
| Suscripciones | Planes, contactos, vencimientos, renovaciones y borradores de recordatorios |
| Cobros registrados | Historial de abonos recibidos, referencias y responsables |
| Solicitudes de alta | Revisión de clubes interesados e inicio de su alta |
| Actividad | Consulta de movimientos por complejo, acción o responsable |

Las sesiones de RTL y de los clubes son independientes. Una cuenta de club no puede acceder al panel de RTL.

### Planes y suscripciones

| Plan | Herramientas |
| --- | --- |
| Básico | Agenda, canchas, clientes y control de cobros |
| Pro | Gestión básica, reportes e inventario |
| Elite | Todo lo de Pro y auditoría |

Pro y Elite tienen abonos de referencia de $50.000 y $100.000 mensuales. RTL puede ajustar el importe de cada suscripción. Los complejos iniciales reciben Básico con 30 días de vigencia y abono en cero.

Las funciones premium se validan también en el servidor. Una suscripción vencida pierde ese acceso; la suspensión explícita además oculta el complejo del catálogo y rechaza nuevas reservas. El historial y el acceso administrativo se conservan. Registrar un cobro reactiva el servicio hasta el vencimiento indicado.

## Alcance actual

- Los pagos son **registros manuales**: la aplicación no cobra dinero ni emite facturas fiscales.
- Los recordatorios se guardan como **borradores**. Se puede abrir correo o WhatsApp con el mensaje preparado, pero una persona debe revisarlo y enviarlo.
- Los importes de las reservas en reportes se agrupan por fecha del turno, no por fecha de recepción del dinero.
- Los historiales comerciales de RTL muestran hasta 100 registros recientes; su actividad global muestra hasta 150 movimientos.
- No incluye recuperación de contraseñas ni envíos automáticos de mensajes.
- Las fotos se guardan en SQLite como imágenes comprimidas.

## Estructura del proyecto

```text
assets/                 Imágenes de referencia y marca
client/
  index.html            Entrada de la aplicación React
  src/
    public/             Catálogo, reservas e información pública
    admin/              Gestión de cada complejo
    superadmin/         Gestión de RTL y suscripciones
    shared/             Componentes y cliente HTTP compartidos
    styles/             Estilos de los paneles y del sitio público
server/                 API, autenticación, base de datos y arranque
  test/                 Pruebas automatizadas y entorno de revisión temporal
courts.js               Catálogo inicial utilizado al crear la base
.env.example            Ejemplo de configuración sin credenciales
```

## Pruebas

```sh
npm test
```

Las pruebas cubren permisos entre complejos y roles, propiedad de reservas, tarifas, superposiciones, validaciones, persistencia, suscripciones, cobros sin duplicados, bloqueo de funciones y carga de módulos React. Utilizan bases aisladas y servidores temporales; no modifican la base local de la aplicación ni ejecutan un build.

## Configuración

`.env.example` documenta las variables disponibles:

| Variable | Uso |
| --- | --- |
| `HOST` | Dirección del servidor; por defecto `127.0.0.1` |
| `PORT` | Puerto; por defecto `3000` |
| `DB_PATH` | Ubicación alternativa de SQLite |
| `COOKIE_SECURE` | Cookies solo por HTTPS cuando vale `true` |
| `APP_ORIGIN` | Origen HTTPS exacto de la aplicación en producción |

Los archivos `.env` no se cargan automáticamente. Si se utiliza uno, iniciar con:

```sh
node --env-file=.env server/start.cjs
```

## Datos y despliegue

`data/`, `node_modules/`, `.env` y `client/dist/` están excluidos del repositorio. Para respaldar SQLite, detener el servidor y copiar el directorio `data/` completo. No copiar solo el archivo principal mientras hay escrituras activas.

El proyecto requiere un servidor Node y disco persistente para SQLite; no funciona como una publicación puramente estática en GitHub Pages. El modo de producción sirve los archivos de `client/dist/`, generados mediante el script `npm run build`. Antes de desplegar corresponde verificar esa salida y configurar `NODE_ENV=production`, HTTPS, `COOKIE_SECURE=true` y `APP_ORIGIN`.
