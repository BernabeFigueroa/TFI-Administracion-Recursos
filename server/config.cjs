const {existsSync}=require('node:fs');
const {resolve}=require('node:path');
function loadEnvironment(){const path=resolve(__dirname,'../.env');if(existsSync(path))process.loadEnvFile(path);}
function postgresConfig(){
  if(!process.env.DATABASE_URL)throw new Error('Falta DATABASE_URL en .env.');
  let url;try{url=new URL(process.env.DATABASE_URL);}catch{throw new Error('DATABASE_URL no tiene un formato válido.');}
  if(!['postgres:','postgresql:'].includes(url.protocol)||!url.password||url.password.includes('[YOUR-PASSWORD]'))throw new Error('Revisá la conexión y la contraseña de DATABASE_URL.');
  // Keep certificate verification enabled, regardless of connection-string SSL shortcuts.
  for(const key of ['ssl','sslmode','sslcert','sslkey','sslrootcert'])url.searchParams.delete(key);
  const ssl={rejectUnauthorized:true};
  const caFile=process.env.DATABASE_CA_FILE||resolve(__dirname,'certs/supabase-ca.crt');
  if(!existsSync(resolve(caFile)))throw new Error('Falta el certificado CA: descargalo de Database Settings > SSL Configuration en Supabase y guardalo en server/certs/supabase-ca.crt.');
  ssl.ca=require('node:fs').readFileSync(resolve(caFile),'utf8');
  return {connectionString:url.toString(),ssl,connectionTimeoutMillis:15000,max:5};
}
module.exports={loadEnvironment,postgresConfig};
