const {DatabaseSync,backup}=require('node:sqlite');
const {existsSync,mkdirSync}=require('node:fs');
const {resolve,dirname}=require('node:path');
const {loadEnvironment}=require('./config.cjs');
const {openPostgres}=require('./postgres.cjs');
const tables=['complexes','courts','admins','sessions','platform_admins','platform_sessions','subscriptions','bookings','club_requests','subscription_payments','reminders','inventory','audit_log'];

async function migrate(){
  loadEnvironment();
  const filename=resolve(process.env.DB_PATH||resolve(__dirname,'../data/rtl.sqlite'));
  if(!existsSync(filename))throw new Error('No se encontró SQLite. No se crearon datos de ejemplo ni se modificó Supabase.');
  const source=new DatabaseSync(filename,{readOnly:true});
  let snapshot,remote;
  try{
    const backupPath=resolve(dirname(filename),'backups',`rtl-before-supabase-${new Date().toISOString().replace(/[:.]/g,'-')}.sqlite`);
    mkdirSync(dirname(backupPath),{recursive:true});
    await backup(source,backupPath);
    snapshot=new DatabaseSync(backupPath,{readOnly:true});
    const counts=Object.fromEntries(tables.map(table=>[table,snapshot.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n]));
    remote=await openPostgres();
    const existing=await remote.prepare('SELECT id FROM migration_history WHERE id=?').get('sqlite-import-v1');
    if(existing){console.log('La migración ya fue realizada. No se sobrescribió ningún dato.');return;}
    await remote.transaction(async()=>{
      await remote.query('SELECT pg_advisory_xact_lock(726852001)');
      if(await remote.prepare('SELECT id FROM migration_history WHERE id=?').get('sqlite-import-v1'))throw new Error('Otra migración ya finalizó.');
      for(const table of tables){if((await remote.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get()).n)throw new Error(`La tabla ${table} ya tiene datos. Se canceló la importación para no sobrescribirlos.`);}
      await remote.query("SELECT set_config('rtl.importing','on',true)");
      for(const table of tables){
        const columns=snapshot.prepare(`PRAGMA table_info(${table})`).all().map(c=>c.name);
        const placeholders=columns.map(()=>'?').join(',');
        const insert=remote.prepare(`INSERT INTO ${table}(${columns.join(',')}) VALUES(${placeholders})`);
        for(const row of snapshot.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all())await insert.run(...columns.map(c=>row[c]));
        const actual=(await remote.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get()).n;
        if(actual!==counts[table])throw new Error(`Verificación incompleta en ${table}; se revierte la importación.`);
      }
      await remote.query("SELECT setval(pg_get_serial_sequence('rtl.audit_log','id'),COALESCE((SELECT MAX(id) FROM audit_log),1),(SELECT COUNT(*)>0 FROM audit_log))");
      await remote.prepare('INSERT INTO migration_history(id,created_at,details) VALUES(?,?,?)').run('sqlite-import-v1',new Date().toISOString(),JSON.stringify(counts));
    });
    console.log('Migración a Supabase verificada. SQLite original permanece intacto.');
    console.log('Respaldo guardado en data/backups/ (o junto a DB_PATH si fue personalizado).');
    console.log('Cantidad de registros por tabla:',JSON.stringify(counts));
  }finally{snapshot?.close();source.close();if(remote)await remote.close();}
}
if(require.main===module)migrate().catch(error=>{console.error('Migración cancelada:',error.code||error.message);process.exitCode=1;});
module.exports={migrate,tables};
