import test from 'node:test';
import assert from 'node:assert/strict';
import {generatePrivateKey,privateKeyToAccount} from 'viem/accounts';
import {challenge,verifyLogin,sessionToken,readSession} from '../server/auth.js';
import {createStore} from '../server/store.js';
test('wallet sign-in challenge is domain-bound and single-use',async t=>{const s=await createStore({filename:':memory:'});t.after(()=>s.close());const a=privateKeyToAccount(generatePrivateKey());const c=await challenge(s,a.address,'https://quest.example');assert.ok(c.message.includes('quest.example wants you'));const sig=await a.signMessage({message:c.message});assert.equal(await verifyLogin(s,c.nonce,sig),a.address.toLowerCase());await assert.rejects(verifyLogin(s,c.nonce,sig));});
test('signature from another wallet is rejected',async t=>{const s=await createStore({filename:':memory:'});t.after(()=>s.close());const a=privateKeyToAccount(generatePrivateKey()),b=privateKeyToAccount(generatePrivateKey());const c=await challenge(s,a.address,'https://quest.example');await assert.rejects(verifyLogin(s,c.nonce,await b.signMessage({message:c.message})));});
test('sessions reject expiry, tampering and wrong secret',()=>{const a='0x1111111111111111111111111111111111111111';const token=sessionToken(a,'secret',1000);assert.equal(readSession(token,'secret',2000),a);assert.equal(readSession(token,'wrong',2000),null);assert.equal(readSession(token,'secret',86401001),null);assert.equal(readSession(`x${token}`,'secret',2000),null);});
