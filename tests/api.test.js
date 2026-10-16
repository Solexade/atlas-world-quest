import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createHandler} from '../server/api.js';
import {createStore} from '../server/store.js';
import {LEVEL_QUESTIONS as RANKED} from '../server/levels.js';
import {createExplorer,recoverExplorer} from '../server/guest-auth.js';
import {sessionToken} from '../server/auth.js';

test('username passport, recovery, private cookies and persistent server scores',async t=>{
 const store=await createStore({filename:':memory:'});
 const env={SESSION_SECRET:'test-secret-with-at-least-thirty-two-characters',APP_ORIGIN:'http://game.test'};
 const server=createServer(createHandler({storeProvider:async()=>store,env}));await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(async()=>{await new Promise(r=>server.close(r));await store.close();});
 const base=`http://127.0.0.1:${server.address().port}/api/`;let jar='';
 async function call(path,data,origin=env.APP_ORIGIN){const r=await fetch(base+path,{method:data===undefined?'GET':'POST',headers:{Origin:origin,'Content-Type':'application/json',Cookie:jar},body:data===undefined?undefined:JSON.stringify(data)});const set=r.headers.getSetCookie();if(set.length){assert.ok(set.every(c=>c.includes('HttpOnly')&&c.includes('SameSite=Strict')));jar=set.map(c=>c.split(';')[0]).join('; ');}return {status:r.status,body:await r.json()};}
 assert.equal((await call('config')).body.authProvider,'guest');
 const practice=(await call('practice')).body.questions;assert.equal(practice.length,5);assert.ok(practice.every(q=>!('answer' in q)&&!('explanation' in q)));
 const feedback=(await call('practice',{id:practice[0].id,choice:0})).body;assert.deepEqual(Object.keys(feedback),['correct']);
 assert.equal((await call('round/start',{})).status,401);
 assert.equal((await call('auth/challenge',{address:'0x123'})).status,410);
 assert.equal((await call('auth/create',{name:'Explorer'},'https://evil.test')).status,403);
 assert.equal((await call('auth/create',{name:'<script>'})).status,400);
 const created=await call('auth/create',{name:'Voyager One'});assert.equal(created.status,200);const recovery=created.body.recoveryCode;
 const profile=(await call('me')).body.player;assert.match(profile.address,/^guest:[a-f0-9]{64}$/);assert.equal(profile.name,'Voyager One');
 assert.equal((await call('auth/create',{name:'Different'})).body.recoveryCode,undefined);
 let round=(await call('round/start',{})).body;
 for(let i=0;i<5;i++){
  const q=RANKED.find(q=>q.id===round.question.id),choice=round.question.options.indexOf(q.options[q.answer]);
  round=(await call('round/answer',{roundId:round.id,number:round.question.number,choice,score:999999})).body;
  assert.equal(round.feedback.answer,undefined);assert.equal(round.feedback.explanation,undefined);
  if(i<4)round=(await call('round/next',{roundId:round.id})).body;
 }
 assert.equal(round.score,650);assert.equal((await call('me')).body.player.total,650);
 const board=(await call('leaderboard?period=all')).body.players;assert.equal(board[0].points,650);assert.equal(board[0].name,'Voyager One');assert.ok(!JSON.stringify(board).includes(recovery));
 await call('round/answer',{roundId:round.id,number:5,choice:0});assert.equal((await call('me')).body.player.total,650);
 assert.equal((await call('round/receipt',{roundId:round.id})).status,410);
 await call('auth/logout',{});assert.equal((await call('me')).body.player,null);
 assert.equal((await call('auth/recover',{recoveryCode:'Voyager One'})).status,401);
 assert.equal((await call('auth/recover',{recoveryCode:recovery})).status,200);
 assert.equal((await call('me')).body.player.total,650);assert.equal((await call('round/start',{})).body.level,2);assert.equal((await call('me')).body.player.progress.cleared[0],1);
 jar='atlas_session='+sessionToken('0x'+'a'.repeat(40),env.SESSION_SECRET);assert.equal((await call('me')).body.player,null);
});
test('same username cannot claim another passport; recovery requires its private secret',async()=>{
 const store=await createStore({filename:':memory:'});
 try{
  const a=await createExplorer(store,'Same Name'),b=await createExplorer(store,'Same Name');assert.notEqual(a.identity,b.identity);
  assert.equal(await recoverExplorer(store,a.recoveryCode),a.identity);
  await assert.rejects(recoverExplorer(store,'AQ-'+'a'.repeat(64)),/not found/);
  assert.ok(!JSON.stringify((await store.get('explorer:'+a.identity)).value).includes(a.recoveryCode));
 }finally{await store.close();}
});
