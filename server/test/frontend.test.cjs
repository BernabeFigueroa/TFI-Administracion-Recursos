const {test}=require('node:test');
const assert=require('node:assert/strict');
const {once}=require('node:events');
const {readdirSync}=require('node:fs');
const {resolve,join}=require('node:path');
const {openDatabase}=require('../database.cjs');
const {createApp}=require('../index.cjs');
const {attachFrontend}=require('../frontend.cjs');

test('React entry points, JSX modules, API and private-file isolation work together in development',async t=>{
  const db=openDatabase(':memory:'),app=createApp({db});
  const frontend=await attachFrontend(app.server,{production:false});app.setFrontend(frontend.handle);
  app.server.listen(0,'127.0.0.1');await once(app.server,'listening');
  t.after(async()=>{await frontend.close();app.server.closeAllConnections();await new Promise(r=>app.server.close(r));db.close();});
  const base=`http://127.0.0.1:${app.server.address().port}`;
  for(const path of ['/','/admin/','/superadmin/']){
    const result=await fetch(base+path);assert.equal(result.status,200);
    const html=await result.text();assert.match(html,/id="root"/);assert.match(html,/\/src\/main.jsx/);assert.doesNotMatch(html,/src="(?:\.\.\/)?(?:app|admin)\.js"/);
  }
  function modules(folder){return readdirSync(folder,{withFileTypes:true}).flatMap(e=>e.isDirectory()?modules(join(folder,e.name)):/\.(jsx|js|css)$/.test(e.name)?[join(folder,e.name)]:[]);}
  const root=resolve(__dirname,'../../client');
  for(const filename of modules(join(root,'src'))){const path='/'+filename.slice(root.length+1).replaceAll('\\','/');const response=await fetch(base+path);assert.equal(response.status,200,`Module ${path}: ${await response.text()}`);}
  assert.equal((await fetch(base+'/api/health')).status,200);
  for(const path of ['/server/index.cjs','/data/rtl.sqlite','/.env','/.git/config','/app.js'])assert.equal((await fetch(base+path)).status,404,path);
  const serverFile=resolve(__dirname,'../index.cjs').replaceAll('\\','/');
  const denied=await fetch(base+encodeURI('/@fs/'+serverFile));assert.ok([403,404].includes(denied.status),'Vite must not expose backend source via @fs');
});
