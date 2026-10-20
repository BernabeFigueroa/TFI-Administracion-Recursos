const { DatabaseSync } = require('node:sqlite');
const { mkdirSync, readFileSync } = require('node:fs');
const { dirname, resolve } = require('node:path');
const { runInNewContext } = require('node:vm');

function openDatabase(filename = process.env.DB_PATH || resolve(__dirname, '../data/rtl.sqlite')) {
  if (filename !== ':memory:') mkdirSync(dirname(resolve(filename)), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS complexes(id TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS courts(
      id TEXT PRIMARY KEY, complex_id TEXT NOT NULL REFERENCES complexes(id), data TEXT NOT NULL,
      UNIQUE(id, complex_id)
    );
    CREATE TABLE IF NOT EXISTS admins(
      id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
      complex_id TEXT NOT NULL REFERENCES complexes(id)
    );
    CREATE TABLE IF NOT EXISTS sessions(
      token_hash TEXT PRIMARY KEY, admin_id TEXT REFERENCES admins(id), expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS session_expiry ON sessions(expires_at);
    CREATE TABLE IF NOT EXISTS bookings(
      id TEXT PRIMARY KEY, complex_id TEXT NOT NULL, resource_id TEXT NOT NULL,
      owner_hash TEXT NOT NULL REFERENCES sessions(token_hash), date TEXT NOT NULL,
      start_min INTEGER NOT NULL CHECK(start_min>=0 AND start_min<1440),
      end_min INTEGER NOT NULL CHECK(end_min>start_min AND end_min<=1440),
      status TEXT NOT NULL CHECK(status IN ('confirmed','pending','cancelled')),
      data TEXT NOT NULL,
      FOREIGN KEY(resource_id,complex_id) REFERENCES courts(id,complex_id)
    );
    CREATE INDEX IF NOT EXISTS booking_availability ON bookings(resource_id,date,status,start_min,end_min);
    CREATE INDEX IF NOT EXISTS booking_complex ON bookings(complex_id,date);
    CREATE TRIGGER IF NOT EXISTS prevent_booking_overlap_insert BEFORE INSERT ON bookings
    WHEN NEW.status != 'cancelled' AND EXISTS(
      SELECT 1 FROM bookings b WHERE b.resource_id=NEW.resource_id AND b.date=NEW.date
      AND b.status!='cancelled' AND NEW.start_min<b.end_min AND NEW.end_min>b.start_min
    ) BEGIN SELECT RAISE(ABORT,'booking_overlap'); END;
    CREATE TRIGGER IF NOT EXISTS prevent_booking_overlap_update BEFORE UPDATE ON bookings
    WHEN NEW.status != 'cancelled' AND EXISTS(
      SELECT 1 FROM bookings b WHERE b.id!=NEW.id AND b.resource_id=NEW.resource_id AND b.date=NEW.date
      AND b.status!='cancelled' AND NEW.start_min<b.end_min AND NEW.end_min>b.start_min
    ) BEGIN SELECT RAISE(ABORT,'booking_overlap'); END;
    CREATE TABLE IF NOT EXISTS club_requests(id TEXT PRIMARY KEY, created_at TEXT NOT NULL, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS platform_admins(id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS platform_sessions(token_hash TEXT PRIMARY KEY,platform_admin_id TEXT NOT NULL REFERENCES platform_admins(id),expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS subscriptions(complex_id TEXT PRIMARY KEY REFERENCES complexes(id),plan TEXT NOT NULL CHECK(plan IN ('basic','pro','elite')),status TEXT NOT NULL CHECK(status IN ('active','trial','suspended')),paid_until TEXT NOT NULL,monthly_fee INTEGER NOT NULL CHECK(monthly_fee>=0),contact_email TEXT NOT NULL DEFAULT '',contact_phone TEXT NOT NULL DEFAULT '',updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS subscription_payments(id TEXT PRIMARY KEY,complex_id TEXT NOT NULL REFERENCES complexes(id),amount INTEGER NOT NULL CHECK(amount>0),paid_until TEXT NOT NULL,reference TEXT NOT NULL,created_at TEXT NOT NULL,actor TEXT NOT NULL,idempotency_key TEXT NOT NULL UNIQUE);
    CREATE TABLE IF NOT EXISTS reminders(id TEXT PRIMARY KEY,complex_id TEXT NOT NULL REFERENCES complexes(id),channel TEXT NOT NULL CHECK(channel IN ('email','whatsapp')),destination TEXT NOT NULL,message TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'draft' CHECK(status='draft'),created_at TEXT NOT NULL,actor TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS inventory(id TEXT PRIMARY KEY,complex_id TEXT NOT NULL REFERENCES complexes(id),name TEXT NOT NULL,price INTEGER NOT NULL CHECK(price>=0),stock INTEGER NOT NULL CHECK(stock>=0));
    CREATE TABLE IF NOT EXISTS audit_log(id INTEGER PRIMARY KEY AUTOINCREMENT,complex_id TEXT REFERENCES complexes(id),action TEXT NOT NULL,actor TEXT NOT NULL DEFAULT 'Sistema',created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
    CREATE INDEX IF NOT EXISTS audit_complex ON audit_log(complex_id,id);
    CREATE TRIGGER IF NOT EXISTS audit_booking_insert AFTER INSERT ON bookings BEGIN INSERT INTO audit_log(complex_id,action) VALUES(NEW.complex_id,'Reserva creada: '||NEW.id); END;
    CREATE TRIGGER IF NOT EXISTS audit_booking_update AFTER UPDATE ON bookings BEGIN INSERT INTO audit_log(complex_id,action) VALUES(NEW.complex_id,CASE WHEN NEW.status='cancelled' THEN 'Reserva cancelada: ' ELSE 'Reserva actualizada: ' END||NEW.id); END;
    CREATE TRIGGER IF NOT EXISTS audit_court_update AFTER UPDATE ON courts BEGIN INSERT INTO audit_log(complex_id,action) VALUES(NEW.complex_id,'Cancha actualizada: '||NEW.id); END;
    PRAGMA user_version=2;
  `);
  const catalog = runInNewContext(readFileSync(resolve(__dirname, '../courts.js'), 'utf8') + '\nCOURTS_DATA');
  const insertComplex = db.prepare('INSERT OR IGNORE INTO complexes(id,data) VALUES(?,?)');
  const insertCourt = db.prepare('INSERT OR IGNORE INTO courts(id,complex_id,data) VALUES(?,?,?)');
  db.exec('BEGIN IMMEDIATE');
  try {
    for (const complex of catalog) {
      const inserted = insertComplex.run(complex.id, JSON.stringify(complex));
      // Seed once per complex; never recreate disabled/renamed courts on restart.
      if (!inserted.changes) continue;
      for (let n=1; n<=3; n++) {
        const court = { ...complex, id:`${complex.id}-court-${n}`, complexId:complex.id,
          complexName:complex.name, name:`Cancha ${n}`, enabled:true, lighting:true,
          type:complex.features.some(f=>/techad/i.test(f))?'Cubierta':'Descubierta',
          surface:complex.sport==='basquet'?'Parquet':'Césped sintético',
          capacity:complex.sport==='padel'?4:complex.sport==='basquet'?10:/11/.test(complex.sportLabel)?22:/7/.test(complex.sportLabel)?14:10 };
        insertCourt.run(court.id,complex.id,JSON.stringify(court));
      }
    }
    db.prepare("INSERT OR IGNORE INTO subscriptions(complex_id,plan,status,paid_until,monthly_fee,updated_at) SELECT id,'basic','active',date('now','+30 days'),0,? FROM complexes").run(new Date().toISOString());
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); db.close(); throw error; }
  return db;
}
module.exports = { openDatabase };
