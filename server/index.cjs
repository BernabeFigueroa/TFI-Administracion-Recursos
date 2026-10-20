const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const { resolve, extname } = require('node:path');
const { randomUUID } = require('node:crypto');
const {subscriptionsAPI,subscriptionFor}=require('./subscriptions.cjs');
const { openDatabase } = require('./database.cjs');
const { sessionFor, createSession, verifyPassword, hashPassword } = require('./auth.cjs');

class HttpError extends Error {constructor(status,message){super(message);this.status=status;}}
const fail=(status,message)=>{throw new HttpError(status,message);};
const text=(value,name,max=100)=>{if(typeof value!=='string'||!value.trim()||value.trim().length>max)fail(400,`${name}: valor inválido.`);return value.trim();};
const integer=(value,min,max,name)=>{if(!Number.isInteger(value)||value<min||value>max)fail(400,`${name}: valor inválido.`);return value;};
const boolean=(value,name)=>{if(typeof value!=='boolean')fail(400,`${name}: valor inválido.`);return value;};
const minutes=slot=>{if(typeof slot!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(slot))fail(400,'Horario inválido.');const [h,m]=slot.split(':').map(Number);return h*60+m;};
function validDate(date){if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T12:00:00Z'))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)fail(400,'Fecha inválida.');return date;}
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
async function body(req){
  if(!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']||''))fail(415,'Se requiere JSON.');
  let length=0;const chunks=[];
  for await(const chunk of req){length+=chunk.length;if(length>3*1024*1024)fail(413,'La solicitud es demasiado grande.');chunks.push(chunk);}
  try {const data=JSON.parse(Buffer.concat(chunks).toString());if(!data||Array.isArray(data)||typeof data!=='object')throw new Error();return data;}
  catch {fail(400,'JSON inválido.');}
}
function createApp({db=openDatabase(),secure=process.env.COOKIE_SECURE==='true',origin=process.env.APP_ORIGIN,frontend=null}={}){
  if(process.env.NODE_ENV==='production'&&(!secure||!origin))throw new Error('Producción requiere APP_ORIGIN y COOKIE_SECURE=true detrás de HTTPS.');
  const limits=new Map();
  const dummyPassword=hashPassword(randomUUID());
  function limit(key,max,windowMs){const now=Date.now();if(limits.size>10000){for(const [k,v]of limits)if(v.until<now)limits.delete(k);if(limits.size>10000)fail(429,'Intentá de nuevo más tarde.');}let entry=limits.get(key);if(!entry||entry.until<now){entry={count:0,until:now+windowMs};limits.set(key,entry);}if(++entry.count>max)fail(429,'Demasiadas solicitudes. Intentá de nuevo más tarde.');}
  const complex=id=>{const row=db.prepare('SELECT data FROM complexes WHERE id=?').get(id);return row?JSON.parse(row.data):null;};
  const court=id=>{const row=db.prepare('SELECT data FROM courts WHERE id=?').get(id);return row?JSON.parse(row.data):null;};
  const session=req=>sessionFor(db,req);
  const admin=req=>{const s=session(req);if(!s?.admin_id)fail(401,'Iniciá sesión para administrar tu complejo.');return s;};
  function scopedCourt(req,id){const s=admin(req),c=court(id);if(!c||c.complexId!==s.complex_id)fail(404,'Cancha no encontrada.');return {s,c};}
  function courtInput(data,base){
    const image=text(data.image,'Foto',2400000);
    if(!/^assets\/[a-z0-9_.-]+$/i.test(image)&&!/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(image))fail(400,'Foto inválida.');
    if(!['Cubierta','Semicubierta','Descubierta'].includes(data.type))fail(400,'Tipo de cancha inválido.');
    return {...base,name:text(data.name,'Nombre',60),surface:text(data.surface,'Superficie',60),type:data.type,image,
      capacity:integer(data.capacity,1,100,'Capacidad'),price:integer(data.price,1,10000000,'Precio'),enabled:boolean(data.enabled,'Habilitación'),lighting:boolean(data.lighting,'Iluminación')};
  }
  function record(row){return {...JSON.parse(row.data),status:row.status};}
  const subscriptionRoutes=subscriptionsAPI({db,body,json,fail,text,integer,validDate,admin,limit,secure,dummyPassword});
  async function handler(req,res){
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','same-origin');
    try {
      const url=new URL(req.url,'http://localhost');const path=url.pathname;
      if(path.startsWith('/api/')){
        const expected=origin || `http://${req.headers.host}`;
        if(req.headers.origin&&req.headers.origin!==expected)fail(403,'Origen no autorizado.');
        if(req.headers['sec-fetch-site']==='cross-site')fail(403,'Origen no autorizado.');
        const ip=req.socket.remoteAddress || 'unknown';limit(`all:${ip}`,600,60000);
        if(await subscriptionRoutes(req,res,path,url))return;
        if(path==='/api/health'&&req.method==='GET')return json(res,200,{ok:true});
        if(path==='/api/catalog'&&req.method==='GET'){
          const all=db.prepare('SELECT id,data FROM complexes ORDER BY rowid').all();const current=session(req);
          const visible=all.filter(c=>subscriptionFor(db,c.id)?.effectiveStatus!=='suspended'||current?.complex_id===c.id);
          const ids=new Set(visible.map(c=>c.id));
          return json(res,200,{complexes:visible.map(r=>JSON.parse(r.data)),courts:db.prepare('SELECT complex_id,data FROM courts ORDER BY rowid').all().filter(c=>ids.has(c.complex_id)).map(r=>JSON.parse(r.data))});
        }
        if(path==='/api/auth/me'&&req.method==='GET'){const s=session(req);return json(res,200,s?.admin_id?{email:s.email,complexId:s.complex_id,subscription:subscriptionFor(db,s.complex_id)}:null);}
        if(path==='/api/auth/login'&&req.method==='POST'){
          limit(`login:${ip}`,15,15*60000);const data=await body(req);const email=text(data.email,'Correo',150).toLowerCase();
          if(typeof data.password!=='string'||!data.password.length||data.password.length>256)fail(400,'Contraseña inválida.');
          const password=data.password;
          const a=db.prepare('SELECT * FROM admins WHERE email=?').get(email);
          const valid=await verifyPassword(password,a?.password_hash||await dummyPassword);
          if(!a||!valid)fail(401,'Correo o contraseña incorrectos.');
          const prior=session(req);if(prior?.admin_id)db.prepare('UPDATE sessions SET expires_at=0 WHERE token_hash=?').run(prior.token_hash);
          createSession(db,res,a.id,secure);return json(res,200,{email:a.email,complexId:a.complex_id,subscription:subscriptionFor(db,a.complex_id)});
        }
        if(path==='/api/auth/logout'&&req.method==='POST'){
          await body(req);const s=session(req);if(s)db.prepare('UPDATE sessions SET expires_at=0 WHERE token_hash=?').run(s.token_hash);
          res.setHeader('Set-Cookie',`rtl_admin_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure?'; Secure':''}`);return json(res,200,{ok:true});
        }
        if(path==='/api/availability'&&req.method==='GET'){
          const id=url.searchParams.get('complexId'),date=validDate(url.searchParams.get('date'));if(!complex(id))fail(404,'Complejo no encontrado.');
          // No names, contact details, prices or reservation IDs on this public endpoint.
          return json(res,200,db.prepare("SELECT resource_id,date,start_min,end_min FROM bookings WHERE complex_id=? AND date=? AND status!='cancelled'").all(id,date));
        }
        if(path==='/api/bookings/mine'&&req.method==='GET'){
          const s=sessionFor(db,req,'guest')||createSession(db,res,null,secure);return json(res,200,db.prepare("SELECT * FROM bookings WHERE owner_hash=? AND status!='cancelled' ORDER BY date DESC,start_min DESC").all(s.token_hash).map(record));
        }
        if(path==='/api/admin/bookings'&&req.method==='GET'){
          const s=admin(req);return json(res,200,db.prepare('SELECT * FROM bookings WHERE complex_id=? ORDER BY date DESC,start_min DESC').all(s.complex_id).map(record));
        }
        if(['/api/bookings','/api/admin/bookings'].includes(path)&&req.method==='POST'){
          limit(`booking:${ip}`,60,3600000);const data=await body(req);const c=court(text(data.resourceId,'Cancha'));
          if(!c||!c.enabled)fail(400,'La cancha no está habilitada.');
          if(subscriptionFor(db,c.complexId)?.effectiveStatus==='suspended')fail(403,'El complejo está suspendido para nuevas reservas.');
          const s=path==='/api/admin/bookings'?admin(req):sessionFor(db,req,'guest');if(!s)fail(401,'Recargá la página antes de reservar.');if(s.admin_id&&s.complex_id!==c.complexId)fail(403,'Esta cancha pertenece a otro complejo.');
          const day=validDate(data.date),start=minutes(data.slot),duration=data.duration===undefined?60:integer(data.duration,60,120,'Duración');
          if(![60,90,120].includes(duration)||start+duration>1440||!c.availableSlots.includes(data.slot))fail(400,'Horario o duración inválidos.');
          const startsAt=Date.parse(`${day}T${data.slot}:00-03:00`);
          if(startsAt<=Date.now()||startsAt>Date.now()+366*86400000)fail(400,'La reserva debe ser futura y estar dentro del próximo año.');
          const email=text(data.userEmail,'Correo',150);if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail(400,'Correo inválido.');
          const userName=text(data.userName,'Nombre',100),userPhone=text(data.userPhone,'Teléfono',40);
          const owner=s || createSession(db,res,null,secure);
          const bookingStatus=s?.admin_id?(data.status||'confirmed'):'confirmed';if(!['pending','confirmed'].includes(bookingStatus))fail(400,'Estado inválido.');
          const b={id:`RES-${randomUUID().toUpperCase()}`,courtId:c.complexId,resourceId:c.id,courtName:`${c.complexName} · ${c.name}`,sport:c.sport,sportLabel:c.sportLabel,location:c.location,date:day,slot:data.slot,duration,price:c.price*duration/60,userName,userPhone,userEmail:email,status:bookingStatus,paid:s?.admin_id?data.paid===true:false,createdAt:new Date().toISOString(),source:s?.admin_id?'admin':'public'};
          try{db.prepare('INSERT INTO bookings(id,complex_id,resource_id,owner_hash,date,start_min,end_min,status,data) VALUES(?,?,?,?,?,?,?,?,?)').run(b.id,c.complexId,c.id,owner.token_hash,day,start,start+duration,bookingStatus,JSON.stringify(b));}
          catch(error){if(error.message.includes('booking_overlap'))fail(409,'El horario acaba de reservarse. Elegí otro turno.');throw error;}
          return json(res,201,b);
        }
        const cancelMatch=path.match(/^\/api\/bookings\/([^/]+)\/cancel$/);
        if(cancelMatch&&req.method==='POST'){
          await body(req);const a=session(req),g=sessionFor(db,req,'guest');if(!a&&!g)fail(401,'No tenés acceso a esta reserva.');
          const row=db.prepare('SELECT * FROM bookings WHERE id=?').get(cancelMatch[1]);
          if(!row||!(a?.admin_id&&row.complex_id===a.complex_id)&&row.owner_hash!==g?.token_hash)fail(404,'Reserva no encontrada.');
          const b={...record(row),status:'cancelled',cancelledAt:new Date().toISOString()};
          db.prepare("UPDATE bookings SET status='cancelled',data=? WHERE id=?").run(JSON.stringify(b),row.id);return json(res,200,b);
        }
        const bookingMatch=path.match(/^\/api\/admin\/bookings\/([^/]+)$/);
        if(bookingMatch&&req.method==='PATCH'){
          const s=admin(req),data=await body(req),row=db.prepare('SELECT * FROM bookings WHERE id=? AND complex_id=?').get(bookingMatch[1],s.complex_id);
          if(!row)fail(404,'Reserva no encontrada.');if(row.status==='cancelled')fail(409,'La reserva está cancelada.');
          if(Object.keys(data).some(k=>!['paid','status'].includes(k)))fail(400,'Solo se permite actualizar pago y estado.');
          const b=record(row);if(data.paid!==undefined)b.paid=boolean(data.paid,'Pago');if(data.status!==undefined){if(!['confirmed','pending'].includes(data.status))fail(400,'Estado inválido.');b.status=data.status;}
          db.prepare('UPDATE bookings SET status=?,data=? WHERE id=?').run(b.status,JSON.stringify(b),row.id);return json(res,200,b);
        }
        if(path==='/api/admin/courts'&&req.method==='POST'){
          const s=admin(req),data=await body(req),parent=complex(s.complex_id);
          if(db.prepare('SELECT COUNT(*) as n FROM courts WHERE complex_id=?').get(s.complex_id).n>=50)fail(409,'El complejo alcanzó el máximo de 50 canchas.');
          const c=courtInput(data,{...parent,id:`${s.complex_id}-court-${randomUUID()}`,complexId:s.complex_id,complexName:parent.name});
          const duplicate=db.prepare('SELECT data FROM courts WHERE complex_id=?').all(s.complex_id).some(r=>JSON.parse(r.data).name.toLowerCase()===c.name.toLowerCase());if(duplicate)fail(409,'Ya existe una cancha con ese nombre.');
          db.prepare('INSERT INTO courts(id,complex_id,data) VALUES(?,?,?)').run(c.id,s.complex_id,JSON.stringify(c));return json(res,201,c);
        }
        const courtMatch=path.match(/^\/api\/admin\/courts\/([^/]+)$/);
        if(courtMatch&&req.method==='PUT'){
          const {s,c}=scopedCourt(req,courtMatch[1]),data=await body(req),updated=courtInput(data,c);
          const duplicate=db.prepare('SELECT id,data FROM courts WHERE complex_id=? AND id!=?').all(s.complex_id,c.id).some(r=>JSON.parse(r.data).name.toLowerCase()===updated.name.toLowerCase());if(duplicate)fail(409,'Ya existe una cancha con ese nombre.');
          db.prepare('UPDATE courts SET data=? WHERE id=? AND complex_id=?').run(JSON.stringify(updated),c.id,s.complex_id);return json(res,200,updated);
        }
        if(path==='/api/club-requests'&&req.method==='POST'){
          limit(`club:${ip}`,10,3600000);const data=await body(req);
          const record={clubName:text(data.clubName,'Complejo',150),owner:text(data.owner,'Responsable',100),phone:text(data.phone,'Teléfono',40),email:text(data.email,'Correo',150),courts:integer(data.courts,1,100,'Cantidad de canchas'),plan:text(data.plan,'Plan',40)};
          if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email))fail(400,'Correo inválido.');
          db.prepare('INSERT INTO club_requests(id,created_at,data) VALUES(?,?,?)').run(randomUUID(),new Date().toISOString(),JSON.stringify(record));return json(res,201,{ok:true});
        }
        fail(404,'Ruta no encontrada.');
      }
      if(!['GET','HEAD'].includes(req.method))fail(405,'Método no permitido.');
      if(['/admin','/superadmin'].includes(path)){res.writeHead(308,{Location:path+'/'});return res.end();}
      if(frontend&&!/^\/assets\//.test(path))return frontend(req,res,()=>json(res,404,{error:'Archivo no encontrado.'}));
      const relative=['/','/index.html','/admin/','/superadmin/'].includes(path)?'/client/index.html':path;
      if(relative!=='/client/index.html'&&!/^\/assets\/[a-z0-9_.-]+\.(png|jpe?g|webp|svg)$/i.test(relative))fail(404,'Archivo no encontrado.');
      const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};
      let content;try{content=await readFile(resolve(__dirname,'..',relative.slice(1)));}catch{fail(404,'Archivo no encontrado.');}
      res.writeHead(200,{'Content-Type':mime[extname(relative)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:content);
    }catch(error){if(res.headersSent){res.end();return;}if(!error.status)console.error('Request failed:',error.code||error.name);json(res,error.status||500,{error:error.status?error.message:'Ocurrió un error al procesar la solicitud.',...(error.code==='PLAN_REQUIRED'?{code:error.code,requiredPlan:error.requiredPlan}:{})});}
  }
  const server=createServer(handler);server.requestTimeout=15000;server.headersTimeout=10000;
  return {server,db,setFrontend:handler=>{frontend=handler;}};
}
module.exports={createApp};
if(require.main===module)require('./start.cjs').start().catch(error=>{console.error(error.message);process.exitCode=1;});
