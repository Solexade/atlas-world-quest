import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {privateKeyToAccount,generatePrivateKey} from 'viem/accounts';
import {createHandler} from '../server/api.js';
import {createStore} from '../server/store.js';
test('HTTP wallet login, cookies, origin enforcement and ranked persistence',async t=>{
 const store=await createStore({filename:':memory:'});
 const env={SESSION_SECRET:'test-secret-with-at-least-thirty-two-characters',APP_ORIGIN:'http://game.test'};
 const server=createServer(createHandler({storeProvider:async()=>store,env}));await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(async()=>{await new Promise(r=>server.close(r));await store.close();});
 const base=`http://127.0.0.1:${server.address().port}/api/`;let jar='';
 async function call(path,data,origin=env.APP_ORIGIN){const r=await fetch(base+path,{method:data===undefined?'GET':'POST',headers:{Origin:origin,'Content-Type':'application/json',Cookie:jar},body:data===undefined?undefined:JSON.stringify(data)});const set=r.headers.getSetCookie();if(set.length)jar=set.map(c=>c.split(';')[0]).join('; ');return {status:r.status,body:await r.json()};}
 assert.equal((await call('round/start',{})).status,401);
 assert.equal((await call('auth/challenge',{address:'bad'},'https://evil.test')).status,403);
 const account=privateKeyToAccount(generatePrivateKey());const c=(await call('auth/challenge',{address:account.address})).body;
 assert.ok(!jar.includes('atlas_session'));
 const login=await call('auth/verify',{nonce:c.nonce,signature:await account.signMessage({message:c.message})});assert.equal(login.status,200);
 assert.ok(jar.includes('atlas_session='));
 assert.equal((await call('me')).body.player.address,account.address.toLowerCase());
 const r=(await call('round/start',{})).body;assert.ok(r.id);assert.equal(r.question.answer,undefined);
 const answer=await call('round/answer',{roundId:r.id,number:1,choice:0,score:999999});assert.equal(answer.status,200);assert.ok(answer.body.score<=110);
 assert.equal((await call('round/receipt',{roundId:r.id})).status,503);
 await call('auth/logout',{});assert.equal((await call('me')).body.player,null);
});
