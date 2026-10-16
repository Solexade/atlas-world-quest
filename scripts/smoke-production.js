// Creates a disposable guest passport and unfinished round, never a leaderboard score.
import assert from 'node:assert/strict';
const base=process.argv[2];
if(!base||new URL(base).protocol!=='https:')throw new Error('Pass the canonical HTTPS game origin.');
const jar=new Map();
async function call(path,data){
 const res=await fetch(`${base}/api/${path}`,{method:data===undefined?'GET':'POST',headers:{Origin:base,'Content-Type':'application/json',Cookie:[...jar].map(([k,v])=>`${k}=${v}`).join('; ')},body:data===undefined?undefined:JSON.stringify(data),signal:AbortSignal.timeout(25000)});
 for(const c of res.headers.getSetCookie()){const part=c.split(';')[0],i=part.indexOf('=');jar.set(part.slice(0,i),part.slice(i+1));}
 assert.match(res.headers.get('content-type')||'',/application\/json/,`${path}: expected JSON, HTTP ${res.status}`);
 const result=await res.json();console.log(path,res.status);return {status:res.status,result};
}
assert.equal((await call('config')).result.rankedReady,true);
assert.equal((await call('round/start',{})).status,401);
const created=await call('auth/create',{name:'Release Check'});assert.equal(created.status,200);
const recoveryCode=created.result.recoveryCode;assert.match(recoveryCode,/^AQ-[a-f0-9]{64}$/);
const me=await call('me');assert.equal(me.result.player.name,'Release Check');const identity=me.result.player.address;
const first=await call('round/start',{});assert.equal(first.status,200);assert.equal(first.result.question.answer,undefined);
const answered=await call('round/answer',{roundId:first.result.id,number:1,choice:-1});assert.equal(answered.status,200);assert.equal(answered.result.score,0);
assert.equal((await call('auth/logout',{})).status,200);assert.equal((await call('me')).result.player,null);
assert.equal((await call('auth/recover',{recoveryCode})).status,200);
assert.equal((await call('me')).result.player.address,identity);
assert.equal((await call('round/start',{})).result.id,first.result.id);
assert.equal((await call('leaderboard')).result.players.some(p=>p.address===identity),false);
assert.equal((await call('auth/logout',{})).status,200);
console.log('Guest passport, session, recovery, ranked routes and logout passed. No leaderboard result created.');
