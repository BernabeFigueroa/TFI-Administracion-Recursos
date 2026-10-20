// Disposable browser QA only: in-memory database, never the application database.
const {randomUUID}=require('node:crypto');
const {openDatabase}=require('../database.cjs');
const {hashPassword}=require('../auth.cjs');
const {createApp}=require('../index.cjs');
const {attachFrontend}=require('../frontend.cjs');
(async()=>{
  const db=openDatabase(':memory:');
  const password='Temporary-browser-test-123';
  db.prepare('INSERT INTO admins(id,email,password_hash,complex_id) VALUES(?,?,?,?)').run(randomUUID(),'qa@example.test',await hashPassword(password),'padel-3');
  db.prepare('INSERT INTO platform_admins VALUES(?,?,?)').run(randomUUID(),'rtl@example.test',await hashPassword(password));
  const {server,setFrontend}=createApp({db});
  const frontend=await attachFrontend(server);setFrontend(frontend.handle);
  server.listen(3001,'127.0.0.1',()=>console.log('Disposable QA: http://127.0.0.1:3001 · qa@example.test · Temporary-browser-test-123'));
  const stop=async()=>{await frontend.close();server.close(()=>{db.close();process.exit(0);});};
  process.on('SIGINT',stop);process.on('SIGTERM',stop);
})().catch(error=>{console.error(error.message);process.exitCode=1;});
