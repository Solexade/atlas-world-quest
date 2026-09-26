import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export async function createStore({url = process.env.DATABASE_URL, filename = 'data/world-quest.sqlite'} = {}) {
  if (url) {
    const { default: pg } = await import('pg');
    const pool = new pg.Pool({connectionString:url, max:3, idleTimeoutMillis:10000, connectionTimeoutMillis:10000});
    await pool.query('CREATE TABLE IF NOT EXISTS atlas_quest_records (key TEXT PRIMARY KEY, value TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 0, expires BIGINT NOT NULL DEFAULT 0)');
    return {
      kind:'postgres',
      async get(key) { const {rows} = await pool.query('SELECT value, version FROM atlas_quest_records WHERE key=$1 AND (expires=0 OR expires>$2)',[key,Date.now()]); return rows[0] ? {value:JSON.parse(rows[0].value),version:rows[0].version} : null; },
      async putIfAbsent(key,value,expires=0) { const r = await pool.query('INSERT INTO atlas_quest_records (key,value,expires) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',[key,JSON.stringify(value),expires]); return r.rowCount===1; },
      async cas(key,value,version) { const r = await pool.query('UPDATE atlas_quest_records SET value=$2,version=version+1 WHERE key=$1 AND version=$3',[key,JSON.stringify(value),version]); return r.rowCount===1; },
      async take(key) { const {rows} = await pool.query('DELETE FROM atlas_quest_records WHERE key=$1 RETURNING value,expires',[key]); return rows[0] && (!Number(rows[0].expires)||Number(rows[0].expires)>Date.now()) ? JSON.parse(rows[0].value) : null; },
      async players() { const {rows} = await pool.query("SELECT value FROM atlas_quest_records WHERE key LIKE 'player:%'"); return rows.map(r=>JSON.parse(r.value)); },
      async prune() { await pool.query('DELETE FROM atlas_quest_records WHERE expires>0 AND expires<$1',[Date.now()]); },
      close:()=>pool.end()
    };
  }
  if (process.env.VERCEL || process.env.NODE_ENV==='production') throw new Error('DATABASE_URL is required for hosted ranked play.');
  const { DatabaseSync } = await import('node:sqlite');
  if (filename!==':memory:') mkdirSync(dirname(filename),{recursive:true});
  const db = new DatabaseSync(filename);
  db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS records (key TEXT PRIMARY KEY,value TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 0,expires INTEGER NOT NULL DEFAULT 0)');
  return {
    kind:'sqlite-local',
    async get(key) { const r=db.prepare('SELECT value,version FROM records WHERE key=? AND (expires=0 OR expires>?)').get(key,Date.now()); return r ? {value:JSON.parse(r.value),version:r.version} : null; },
    async putIfAbsent(key,value,expires=0) { return db.prepare('INSERT OR IGNORE INTO records (key,value,expires) VALUES (?,?,?)').run(key,JSON.stringify(value),expires).changes===1; },
    async cas(key,value,version) { return db.prepare('UPDATE records SET value=?,version=version+1 WHERE key=? AND version=?').run(JSON.stringify(value),key,version).changes===1; },
    async take(key) { const r=db.prepare('DELETE FROM records WHERE key=? RETURNING value,expires').get(key); return r && (!r.expires||r.expires>Date.now()) ? JSON.parse(r.value) : null; },
    async players() { return db.prepare("SELECT value FROM records WHERE key LIKE 'player:%'").all().map(r=>JSON.parse(r.value)); },
    async prune() { db.prepare('DELETE FROM records WHERE expires>0 AND expires<?').run(Date.now()); },
    async close() { db.close(); }
  };
}

export async function updatePlayer(store,address,mutate) {
  const key=`player:${address}`;
  for(let i=0;i<8;i++) {
    const record=await store.get(key);
    const state=record?.value || {address,total:0,rounds:[],stamps:[],completed:0};
    const result=mutate(state);
    if(record ? await store.cas(key,state,record.version) : await store.putIfAbsent(key,state)) return result;
  }
  const error=new Error('Another request is still updating your expedition. Retry shortly.'); error.status=409; throw error;
}
