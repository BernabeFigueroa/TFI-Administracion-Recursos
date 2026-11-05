const {test}=require('node:test');
const assert=require('node:assert/strict');
const {once}=require('node:events');
const {randomBytes}=require('node:crypto');
const {openPostgres,parameters}=require('../postgres.cjs');
const {openDatabase}=require('../database.cjs');
const {hashPassword}=require('../auth.cjs');
const {createApp}=require('../index.cjs');

test('PostgreSQL parameter conversion preserves SQL string literals',()=>{
  assert.equal(parameters("SELECT '?' AS literal FROM courts WHERE id=? AND data!='it''s ?' ORDER BY rowid"),"SELECT '?' AS literal FROM courts WHERE id=$1 AND data!='it''s ?' ORDER BY created_order");
});

test('PostgreSQL integration: scoped accounts, atomic booking conflicts, transactions and premium permissions', {skip:process.env.TEST_POSTGRES!=='true'},async t=>{
  require('../config.cjs').loadEnvironment();
  const schema='rtl_test_'+randomBytes(12).toString('hex');
  const db=await openPostgres({schema});
  t.after(async()=>{try{assert.match(schema,/^rtl_test_[a-f0-9]{24}$/);await db.exec(`DROP SCHEMA ${schema} CASCADE`);}finally{await db.close();}});
  const sqlite=openDatabase(':memory:');
  try{
    for(const name of ['complexes','courts','subscriptions']){
      const columns=sqlite.prepare(`PRAGMA table_info(${name})`).all().map(c=>c.name);
      for(const row of sqlite.prepare(`SELECT * FROM ${name}`).all())await db.prepare(`INSERT INTO ${name}(${columns.join(',')}) VALUES(${columns.map(()=>'?').join(',')})`).run(...columns.map(c=>row[c]));
    }
  }finally{sqlite.close();}
  const password='Disposable-pg-test-1234',hash=await hashPassword(password);
  await db.prepare('INSERT INTO platform_admins VALUES(?,?,?)').run('rtl','rtl@example.test',hash);
  for(const [id,email,complex] of [['a','a@example.test','padel-3'],['b','b@example.test','padel-1']])await db.prepare('INSERT INTO admins VALUES(?,?,?,?)').run(id,email,hash,complex);
  const {server}=createApp({db});server.listen(0,'127.0.0.1');await once(server,'listening');
  t.after(async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));});
  const base=`http://127.0.0.1:${server.address().port}/api`;
  function client(){const jar=new Map();return async(path,method='GET',body)=>{const r=await fetch(base+path,{method,headers:{Cookie:[...jar].map(([k,v])=>k+'='+v).join('; '),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});for(const h of r.headers.getSetCookie()){const [k,v]=h.split(';')[0].split('=');jar.set(k,v);}return {status:r.status,body:await r.json()};};}
  const guest=client(),other=client(),club=client(),rtl=client();
  assert.equal((await guest('/catalog')).body.complexes.length,9);
  await guest('/bookings/mine');await other('/bookings/mine');
  const date=new Date(Date.now()+2*86400000).toISOString().slice(0,10);
  const booking={resourceId:'padel-3-court-1',date,slot:'18:00',duration:60,userName:'Test',userPhone:'3810000000',userEmail:'guest@example.test'};
  const concurrent=await Promise.all([guest('/bookings','POST',booking),other('/bookings','POST',booking)]);
  assert.deepEqual(concurrent.map(r=>r.status).sort(),[201,409]);
  assert.equal((await club('/auth/login','POST',{email:'a@example.test',password})).status,200);
  assert.equal((await club('/admin/bookings')).body.length,1);
  assert.equal((await club('/superadmin/complexes')).status,401);
  assert.equal((await club('/admin/reports')).status,403);
  assert.equal((await rtl('/superadmin/auth/login','POST',{email:'rtl@example.test',password})).status,200);
  const until=new Date(Date.now()+60*86400000).toISOString().slice(0,10);
  assert.equal((await rtl('/superadmin/complexes/padel-3/subscription','PUT',{plan:'pro',status:'active',paidUntil:until,monthlyFee:50000,contactEmail:'club@example.test',contactPhone:''})).status,200);
  assert.equal((await club('/admin/reports')).status,200);
  assert.equal((await club('/admin/audit')).status,403);
  assert.equal((await club('/admin/inventory','POST',{name:'Test',price:1000,stock:3})).status,201);
  const created=await rtl('/superadmin/complexes','POST',{name:'Temporary PG club',location:'Test',sport:'padel',courtCount:2,courtPrice:19000,adminEmail:'new@example.test',plan:'basic',status:'active',paidUntil:until,monthlyFee:0,contactEmail:'',contactPhone:''});
  assert.equal(created.status,201);
  const newClub=client();assert.equal((await newClub('/auth/login','POST',created.body.credentials)).body.complexId,created.body.complex.id);
  assert.equal((await newClub('/admin/bookings')).body.length,0);
  const receipt={amount:50000,paidUntil:until,reference:'Test receipt',idempotencyKey:'test-pg'};
  const receipts=await Promise.all([rtl('/superadmin/complexes/padel-3/payments','POST',receipt),rtl('/superadmin/complexes/padel-3/payments','POST',receipt)]);
  assert.deepEqual(receipts.map(r=>r.status).sort(),[200,201]);
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM subscription_payments').get()).n,1);
  assert.equal((await rtl('/superadmin/complexes/padel-3/reminders','POST',{channel:'email'})).body.status,'draft');
  // Mixed guest/admin/RTL cookies in one browser remain independently readable.
  await guest('/auth/login','POST',{email:'a@example.test',password});
  await guest('/superadmin/auth/login','POST',{email:'rtl@example.test',password});
  assert.equal((await guest('/auth/me')).body.complexId,'padel-3');
  assert.equal((await guest('/superadmin/auth/me')).body.role,'superadmin');
  await assert.rejects(db.transaction(async()=>{await db.prepare('INSERT INTO inventory VALUES(?,?,?,?,?)').run('rollback','padel-3','Rollback test',1,1);throw new Error('rollback');}),/rollback/);
  assert.equal(await db.prepare('SELECT id FROM inventory WHERE id=?').get('rollback'),undefined);
});
