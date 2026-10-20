const { randomBytes, randomUUID } = require('node:crypto');
const { openDatabase } = require('./database.cjs');
const { hashPassword } = require('./auth.cjs');
(async()=>{
  const [complexId,emailArg]=process.argv.slice(2);
  if(!complexId||!emailArg)throw new Error('Uso: npm run admin:create -- padel-3 admin@tuclub.com');
  const email=emailArg.trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Correo inválido');
  const db=openDatabase();
  try {
    if(!db.prepare('SELECT id FROM complexes WHERE id=?').get(complexId))throw new Error('Complejo inexistente');
    const password=process.env.ADMIN_PASSWORD || randomBytes(18).toString('base64url');
    if(password.length<12||password.length>256)throw new Error('La contraseña debe tener entre 12 y 256 caracteres');
    const hash=await hashPassword(password);
    db.prepare('INSERT INTO admins(id,email,password_hash,complex_id) VALUES(?,?,?,?)').run(randomUUID(),email,hash,complexId);
    console.log(`Administrador creado: ${email}\nComplejo: ${complexId}`);
    if(!process.env.ADMIN_PASSWORD)console.log(`Contraseña generada (guardala ahora): ${password}`);
  } finally {db.close();}
})().catch(error=>{console.error(error.message.includes('UNIQUE')?'El administrador ya existe.':error.message);process.exitCode=1;});
