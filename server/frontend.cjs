const {readFile} = require('node:fs/promises');
const {resolve,extname} = require('node:path');

async function attachFrontend(server, {production=process.env.NODE_ENV==='production'}={}) {
  const root=resolve(__dirname,'../client');
  const vite=production?null:await (await import('vite')).createServer({
    configFile:resolve(__dirname,'../vite.config.mjs'),
    appType:'custom',server:{middlewareMode:true,hmr:{server},fs:{strict:true,allow:[root,resolve(__dirname,'../node_modules')]}}
  });
  const handle=async(req,res,next)=>{
    try {
      const path=new URL(req.url,'http://localhost').pathname;
      if(['/','/index.html','/admin/','/superadmin/'].includes(path)) {
        let html=await readFile(resolve(root,production?'dist/index.html':'index.html'),'utf8');
        if(vite)html=await vite.transformIndexHtml(req.url,html);
        res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache'});
        res.end(req.method==='HEAD'?undefined:html);return;
      }
      if(vite && (/^\/src\//.test(path)||/^\/@(?:vite|id|fs)\//.test(path)||/^\/node_modules\/\.vite\//.test(path))) {
        vite.middlewares(req,res,next);return;
      }
      if(production&&/^\/ui-assets\/[a-zA-Z0-9_.-]+\.(js|css|woff2?|svg|png|webp)$/.test(path)) {
        const data=await readFile(resolve(root,'dist',path.slice(1)));
        const mime={'.js':'text/javascript','.css':'text/css','.woff':'font/woff','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
        res.writeHead(200,{'Content-Type':mime[extname(path)],'Cache-Control':'public, max-age=31536000, immutable'});res.end(req.method==='HEAD'?undefined:data);return;
      }
      next();
    }catch(error){vite?.ssrFixStacktrace(error);console.error(error.message);if(!res.headersSent){res.writeHead(500,{'Content-Type':'text/plain; charset=utf-8'});res.end('No se pudo cargar la interfaz. Revisá la terminal del servidor.');}}
  };
  return {handle,close:()=>vite?.close()};
}
module.exports={attachFrontend};
