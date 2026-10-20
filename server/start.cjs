const {createApp}=require('./index.cjs');
const {attachFrontend}=require('./frontend.cjs');
async function start(){
  const app=createApp();
  let frontend;
  try { frontend=await attachFrontend(app.server); }
  catch(error){app.db.close();throw error;}
  app.setFrontend(frontend.handle);
  const host=process.env.HOST||'127.0.0.1',port=Number(process.env.PORT||3000);
  app.server.on('error',async error=>{console.error(error.code==='EADDRINUSE'?`El puerto ${port} está ocupado. Detené el servidor anterior antes de ejecutar npm start.`:error.message);await frontend.close();app.db.close();process.exitCode=1;});
  app.server.listen(port,host,()=>console.log(`RTL (React + API) disponible en http://${host}:${port}`));
  let closing=false;
  const stop=async()=>{if(closing)return;closing=true;await frontend.close();app.server.close(()=>{app.db.close();process.exit(0);});};
  process.on('SIGINT',stop);process.on('SIGTERM',stop);
  return app;
}
if(require.main===module)start().catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={start};
