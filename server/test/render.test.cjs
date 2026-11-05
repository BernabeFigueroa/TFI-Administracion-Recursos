const {test}=require('node:test');
const assert=require('node:assert/strict');
const {once}=require('node:events');
const {createApp}=require('../index.cjs');

test('Render URL is accepted as the production origin and other origins remain blocked',async t=>{
  const old=Object.fromEntries(['NODE_ENV','APP_ORIGIN','RENDER_EXTERNAL_URL'].map(key=>[key,process.env[key]]));
  let server;
  try{
    process.env.NODE_ENV='production';delete process.env.APP_ORIGIN;
    process.env.RENDER_EXTERNAL_URL='https://rtl-render.example.test';
    assert.throws(()=>createApp({db:{},secure:false}),/COOKIE_SECURE/);
    server=createApp({db:{},secure:true}).server;
  }finally{for(const [key,value]of Object.entries(old)){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
  server.listen(0,'127.0.0.1');await once(server,'listening');
  t.after(async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));});
  const base=`http://127.0.0.1:${server.address().port}`;
  assert.equal((await fetch(base+'/api/health',{headers:{Origin:'https://rtl-render.example.test'}})).status,200);
  assert.equal((await fetch(base+'/api/health',{headers:{Origin:'https://other.example.test'}})).status,403);
});
