const {Pool,types}=require('pg');
const {AsyncLocalStorage}=require('node:async_hooks');
const {readFileSync}=require('node:fs');
const {resolve}=require('node:path');
const {postgresConfig}=require('./config.cjs');

// Epoch milliseconds, counts and generated IDs remain numbers in the API contract.
types.setTypeParser(20,value=>{const n=Number(value);if(!Number.isSafeInteger(n))throw new Error('Entero PostgreSQL fuera de rango.');return n;});
function parameters(sql){
  let position=0,quoted=false,result='';
  for(let i=0;i<sql.length;i++){
    const c=sql[i];
    if(c==="'"){result+=c;if(quoted&&sql[i+1]==="'"){result+=sql[++i];continue;}quoted=!quoted;}
    else result+=c==='?'&&!quoted?'$'+ ++position:c;
  }
  return result.replace(/\browid\b/g,'created_order');
}
async function openPostgres({initialize=true,schema='rtl'}={}){
  if(!/^rtl(?:_test_[a-f0-9]{24})?$/.test(schema))throw new Error('Esquema PostgreSQL no autorizado.');
  const pool=new Pool({...postgresConfig(),options:`-c search_path=${schema},extensions,public -c statement_timeout=15000 -c idle_in_transaction_session_timeout=30000`}),context=new AsyncLocalStorage();
  pool.on('error',error=>console.error('Conexión PostgreSQL inactiva:',error.code||error.name));
  const db={kind:'postgres',
    async query(sql,args=[]){return (context.getStore()||pool).query(parameters(sql),args);},
    prepare(sql){return {
      get:async(...args)=>(await db.query(sql,args)).rows[0],
      all:async(...args)=>(await db.query(sql,args)).rows,
      run:async(...args)=>({changes:(await db.query(sql,args)).rowCount})
    };},
    exec:sql=>db.query(sql),
    async transaction(fn){
      if(context.getStore())throw new Error('No se permiten transacciones anidadas.');
      const client=await pool.connect();
      try{return await context.run(client,async()=>{await client.query('BEGIN');try{const result=await fn();await client.query('COMMIT');return result;}catch(error){await client.query('ROLLBACK');throw error;}});}
      finally{client.release();}
    },
    close:()=>pool.end()
  };
  try{
    // Each pooled session uses the private application schema, never Supabase's auth tables.
    if(initialize)await db.transaction(async()=>{await db.query("SELECT pg_advisory_xact_lock(726852001)");await db.exec(readFileSync(resolve(__dirname,'postgres.sql'),'utf8').replace(/\brtl\b/g,schema));});
    else await db.query('SELECT 1');
    return db;
  }catch(error){await pool.end();throw error;}
}
async function openConfiguredDatabase(){
  require('./config.cjs').loadEnvironment();
  if(process.env.DATABASE_URL)return openPostgres();
  return require('./database.cjs').openDatabase();
}
module.exports={openPostgres,openConfiguredDatabase,parameters};
