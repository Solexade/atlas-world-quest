// Uses a disposable, unfunded wallet. Never completes a round or adds a leaderboard score.
import assert from 'node:assert/strict';
import {generatePrivateKey,privateKeyToAccount} from 'viem/accounts';
const base=process.argv[2];
if(!base||new URL(base).protocol!=='https:')throw new Error('Pass the canonical HTTPS game origin.');
const account=privateKeyToAccount(generatePrivateKey());const jar=new Map();
async function call(path,data){
 const res=await fetch(`${base}/api/${path}`,{method:data===undefined?'GET':'POST',headers:{Origin:base,'Content-Type':'application/json',Cookie:[...jar].map(([k,v])=>`${k}=${v}`).join('; ')},body:data===undefined?undefined:JSON.stringify(data),signal:AbortSignal.timeout(25000)});
 for(const c of res.headers.getSetCookie()){const part=c.split(';')[0],i=part.indexOf('=');jar.set(part.slice(0,i),part.slice(i+1));}
 assert.match(res.headers.get('content-type')||'',/application\/json/,`${path}: expected JSON, HTTP ${res.status}`);
 const result=await res.json();console.log(path,res.status);return {status:res.status,result};
}
assert.equal((await call('config')).result.rankedReady,true);
assert.equal((await call('round/start',{})).status,401);
const c=await call('auth/challenge',{address:account.address,chainId:1});assert.equal(c.status,200);assert.match(c.result.message,/Chain ID: 1\n/);
const signed=await account.signMessage({message:c.result.message});assert.equal((await call('auth/verify',{nonce:c.result.nonce,signature:signed})).status,200);
assert.equal((await call('me')).result.player.address,account.address.toLowerCase());
const first=await call('round/start',{});assert.equal(first.status,200);assert.equal(first.result.question.answer,undefined);
const answered=await call('round/answer',{roundId:first.result.id,number:1,choice:-1});assert.equal(answered.status,200);assert.equal(answered.result.score,0);
assert.equal((await call('round/next',{roundId:first.result.id})).status,200);
assert.equal((await call('auth/logout',{})).status,200);assert.equal((await call('me')).result.player,null);
assert.equal((await call('leaderboard')).result.players.some(p=>p.address===account.address.toLowerCase()),false);
console.log('Production wallet login, session, ranked endpoints and logout passed. No leaderboard entry created.');
