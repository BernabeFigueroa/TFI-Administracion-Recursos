const { randomBytes, scrypt, timingSafeEqual, createHash } = require('node:crypto');
const { promisify } = require('node:util');
const derive = promisify(scrypt);
const options = { N:32768, r:8, p:1, maxmem:64*1024*1024 };
const hashToken = token => createHash('sha256').update(token).digest('hex');
async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await derive(password,salt,64,options);
  return `${salt}:${key.toString('hex')}`;
}
async function verifyPassword(password, stored) {
  const [salt,key] = stored.split(':');
  const actual = await derive(password,salt,64,options);
  const expected = Buffer.from(key,'hex');
  return expected.length===actual.length && timingSafeEqual(actual,expected);
}
function sessionFor(db, req, kind='admin') {
  const name=kind==='superadmin'?'rtl_super_session':kind==='guest'?'rtl_guest_session':'rtl_admin_session';
  const token = new RegExp(`(?:^|;\\s*)${name}=([a-f0-9]{64})(?:;|$)`).exec(req.headers.cookie || '')?.[1];
  if (!token) return null;
  const tokenHash = hashToken(token);
  if(kind==='superadmin')return db.prepare('SELECT s.*,a.email FROM platform_sessions s JOIN platform_admins a ON a.id=s.platform_admin_id WHERE s.token_hash=? AND s.expires_at>?').get(tokenHash,Date.now())||null;
  const row = db.prepare(`SELECT s.*, a.complex_id, a.email FROM sessions s
    LEFT JOIN admins a ON a.id=s.admin_id WHERE s.token_hash=? AND s.expires_at>?`).get(tokenHash,Date.now());
  return row || null;
}
function createPlatformSession(db,res,id,secure=false){const token=randomBytes(32).toString('hex'),hash=hashToken(token);db.prepare('DELETE FROM platform_sessions WHERE expires_at<?').run(Date.now());db.prepare('INSERT INTO platform_sessions VALUES(?,?,?)').run(hash,id,Date.now()+8*3600000);res.setHeader('Set-Cookie',`rtl_super_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800${secure?'; Secure':''}`);}
function createSession(db, res, adminId=null, secure=false) {
  const token=randomBytes(32).toString('hex'), tokenHash=hashToken(token);
  const ttl=adminId?8*60*60:30*24*60*60;
  // Expired session rows referenced by bookings are retained to preserve ownership history.
  db.prepare('DELETE FROM sessions WHERE expires_at<? AND token_hash NOT IN (SELECT owner_hash FROM bookings)').run(Date.now());
  db.prepare('INSERT INTO sessions(token_hash,admin_id,expires_at) VALUES(?,?,?)').run(tokenHash,adminId,Date.now()+ttl*1000);
  const name=adminId?'rtl_admin_session':'rtl_guest_session';
  res.setHeader('Set-Cookie',`${name}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${ttl}${secure?'; Secure':''}`);
  return {token_hash:tokenHash,admin_id:adminId};
}
module.exports={hashPassword,verifyPassword,sessionFor,createSession,createPlatformSession};
