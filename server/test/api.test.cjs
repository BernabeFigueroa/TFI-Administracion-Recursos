const {test}=require('node:test');
const assert=require('node:assert/strict');
const {once}=require('node:events');
const {mkdtempSync,rmSync}=require('node:fs');
const {join}=require('node:path');
const {tmpdir}=require('node:os');
const {openDatabase}=require('../database.cjs');
const {createApp}=require('../index.cjs');
const {hashPassword}=require('../auth.cjs');
const password='Test-only-password-123';
const day=new Date(Date.now()+2*86400000).toISOString().slice(0,10);
const payload=(resourceId='padel-3-court-1')=>({resourceId,date:day,slot:'18:00',duration:60,userName:'Cliente de prueba',userPhone:'3810000000',userEmail:'test@example.com'});
async function fixture(t){
  const folder=mkdtempSync(join(tmpdir(),'rtl-api-')),filename=join(folder,'test.sqlite');
  const db=openDatabase(filename),hashed=await hashPassword(password);
  for(const [id,email,complex]of [['one','one@example.com','padel-3'],['two','two@example.com','padel-1']])db.prepare('INSERT INTO admins(id,email,password_hash,complex_id) VALUES(?,?,?,?)').run(id,email,hashed,complex);
  const {server}=createApp({db});server.listen(0,'127.0.0.1');await once(server,'listening');
  t.after(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));db.close();rmSync(folder,{recursive:true,force:true});});
  const base=`http://127.0.0.1:${server.address().port}`;
  function client(){const jar=new Map();return async(path,method='GET',data,extraHeaders={})=>{
    const response=await fetch(base+path,{method,headers:{...(data?{'Content-Type':'application/json'}:{}),Cookie:[...jar].map(([k,v])=>`${k}=${v}`).join('; '),...extraHeaders},body:data?JSON.stringify(data):undefined,redirect:'manual'});
    for(const header of response.headers.getSetCookie()){const [entry]=header.split(';');const i=entry.indexOf('=');jar.set(entry.slice(0,i),entry.slice(i+1));}
    const raw=await response.text();let body;try{body=JSON.parse(raw);}catch{body=raw;}
    return {status:response.status,body,headers:response.headers};
  };}
  return {db,filename,client,base};
}
test('Guest ownership, private availability, authoritative prices, and atomic overlap rejection',async t=>{
  const {client}=await fixture(t),guest=client(),stranger=client();
  const init=await guest('/api/bookings/mine');assert.equal(init.status,200);assert.match(init.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);
  const first=await guest('/api/bookings','POST',{...payload(),duration:120,price:1,paid:true,status:'pending'});
  assert.equal(first.status,201);assert.equal(first.body.price,38000);assert.equal(first.body.paid,false);assert.equal(first.body.status,'confirmed');
  const results=await Promise.all([guest('/api/bookings','POST',payload('padel-3-court-2')),guest('/api/bookings','POST',payload('padel-3-court-2'))]);
  assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);
  assert.equal((await guest('/api/bookings','POST',{...payload(),slot:'19:30'})).status,409);
  assert.equal((await stranger('/api/bookings/mine')).body.length,0);
  assert.equal((await stranger(`/api/bookings/${first.body.id}/cancel`,'POST',{})).status,404);
  const availability=await stranger(`/api/availability?complexId=padel-3&date=${day}`);
  assert.equal(availability.status,200);assert.ok(!JSON.stringify(availability.body).includes('test@example.com'));assert.ok(!JSON.stringify(availability.body).includes('Cliente de prueba'));
  assert.equal((await guest(`/api/bookings/${first.body.id}/cancel`,'POST',{})).status,200);
  assert.equal((await guest('/api/bookings','POST',payload())).status,201);
});
test('Admin authorization scopes bookings, court edits, payments and creation to the assigned complex',async t=>{
  const {client}=await fixture(t),one=client(),two=client(),guest=client();
  assert.equal((await one('/api/admin/bookings')).status,401);
  assert.equal((await one('/api/auth/login','POST',{email:'one@example.com',password:'wrong'})).status,401);
  assert.equal((await one('/api/auth/login','POST',{email:'one@example.com',password:` ${password}`})).status,401);
  assert.equal((await one('/api/auth/login','POST',{email:'one@example.com',password})).status,200);
  await two('/api/auth/login','POST',{email:'two@example.com',password});
  const created=await one('/api/admin/bookings','POST',{...payload(),status:'pending'});assert.equal(created.status,201);
  assert.equal((await two('/api/admin/bookings')).body.length,0);
  assert.equal((await two(`/api/admin/bookings/${created.body.id}`,'PATCH',{paid:true})).status,404);
  assert.equal((await two(`/api/bookings/${created.body.id}/cancel`,'POST',{})).status,404);
  assert.equal((await one('/api/admin/bookings','POST',payload('padel-1-court-1'))).status,403);
  const catalog=(await guest('/api/catalog')).body;
  const foreign=catalog.courts.find(c=>c.id==='padel-1-court-1');
  assert.equal((await one(`/api/admin/courts/${foreign.id}`,'PUT',{...foreign,price:1})).status,404);
  const own=catalog.courts.find(c=>c.id==='padel-3-court-1');
  const updated=await one(`/api/admin/courts/${own.id}`,'PUT',{...own,enabled:false,complexId:'padel-1',price:23000});
  assert.equal(updated.status,200);assert.equal(updated.body.complexId,'padel-3');
  const paid=await one(`/api/admin/bookings/${created.body.id}`,'PATCH',{paid:true,status:'confirmed'});assert.equal(paid.body.paid,true);
  assert.equal((await one(`/api/admin/bookings/${created.body.id}`,'PATCH',{price:1})).status,400);
  const added=await one('/api/admin/courts','POST',{...own,name:'Cancha nueva',complexId:'padel-1'});assert.equal(added.status,201);assert.equal(added.body.complexId,'padel-3');
  await guest('/api/bookings/mine');assert.equal((await guest('/api/bookings','POST',{...payload(),slot:'21:00'})).status,400);
  assert.equal((await one('/api/auth/logout','POST',{})).status,200);assert.equal((await one('/api/admin/bookings')).status,401);
});
test('Validation, CSRF origin checks, static-file allowlist and persistent storage',async t=>{
  const {client,filename,db}=await fixture(t),guest=client();
  await guest('/api/bookings/mine');
  assert.equal((await guest('/api/bookings','POST',{...payload(),date:'2027-02-30'})).status,400);
  assert.equal((await guest('/api/bookings','POST',{...payload(),duration:75})).status,400);
  assert.equal((await guest('/api/bookings','POST',{...payload(),date:'2020-01-01'})).status,400);
  assert.equal((await guest('/api/bookings','POST',payload(),{Origin:'https://other.example'})).status,403);
  assert.equal((await guest('/api/bookings','POST',payload(),{'Content-Type':'text/plain'})).status,415);
  for(const path of ['/server/index.cjs','/data/rtl.sqlite','/.env','/.git/config','/package.json'])assert.equal((await guest(path)).status,404);
  assert.equal((await guest('/admin')).status,308);assert.equal((await guest('/admin/')).status,200);
  const created=await guest('/api/bookings','POST',payload());assert.equal(created.status,201);
  const second=openDatabase(filename);try{assert.equal(second.prepare('SELECT id FROM bookings WHERE id=?').get(created.body.id).id,created.body.id);}finally{second.close();}
  const club=await guest('/api/club-requests','POST',{clubName:'Club de prueba',owner:'Responsable',phone:'3810000000',email:'club@example.com',courts:3,plan:'Pro'});assert.equal(club.status,201);assert.equal(db.prepare('SELECT COUNT(*) as n FROM club_requests').get().n,1);
});
test('Guest reservations remain owned after administrator login and logout in the same browser',async t=>{
  const {client}=await fixture(t),browser=client();
  await browser('/api/bookings/mine');const created=await browser('/api/bookings','POST',payload());
  await browser('/api/auth/login','POST',{email:'one@example.com',password});
  assert.equal((await browser('/api/bookings/mine')).body[0].id,created.body.id);
  await browser('/api/auth/logout','POST',{});
  assert.equal((await browser('/api/bookings/mine')).body[0].id,created.body.id);
});
test('Repeated failed logins are rate limited',async t=>{
  const {client}=await fixture(t),browser=client();
  for(let n=0;n<15;n++)assert.equal((await browser('/api/auth/login','POST',{email:'missing@example.com',password:'incorrect-password'})).status,401);
  assert.equal((await browser('/api/auth/login','POST',{email:'one@example.com',password})).status,429);
});
