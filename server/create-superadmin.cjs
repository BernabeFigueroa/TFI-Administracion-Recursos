const {
  randomBytes,
  randomUUID
} = require('node:crypto');
const {
  openConfiguredDatabase
} = require('./postgres.cjs');
const {
  hashPassword
} = require('./auth.cjs');
(async () => {
  const email = (process.argv[2] || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Uso: npm run superadmin:create -- tu-correo@rtl.com');
  const db = await openConfiguredDatabase();
  try {
    if (await db.prepare('SELECT id FROM platform_admins WHERE email=?').get(email)) throw new Error('La cuenta RTL ya existe.');
    const password = process.env.ADMIN_PASSWORD || randomBytes(18).toString('base64url');
    if (password.length < 12 || password.length > 256) throw new Error('La contraseña debe tener entre 12 y 256 caracteres.');
    await db.prepare('INSERT INTO platform_admins VALUES(?,?,?)').run(randomUUID(), email, await hashPassword(password));
    console.log(`Cuenta RTL creada: ${email}`);
    if (!process.env.ADMIN_PASSWORD) console.log(`Contraseña generada (guardala ahora): ${password}`);
  } finally {
    await db.close();
  }
})().catch(e => {
  console.error(e.message);
  process.exitCode = 1;
});
