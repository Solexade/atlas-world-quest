import test from 'node:test';
import assert from 'node:assert/strict';
import {watchWallets,walletError} from '../src/wallet.js';
import {api} from '../src/api.js';
import {challenge,verifyLogin} from '../server/auth.js';
import {createStore} from '../server/store.js';
import {generatePrivateKey,privateKeyToAccount} from 'viem/accounts';

test('Rabby can be selected independently of another injected wallet; listeners are cleaned up',()=>{
 const target=new EventTarget(),rabby={request(){},isRabby:true},other={request(){},isMetaMask:true};target.ethereum=other;
 const announce=()=>{const event=new Event('eip6963:announceProvider');event.detail={provider:rabby,info:{uuid:'rabby',name:'Rabby Wallet'}};target.dispatchEvent(event);};
 target.addEventListener('eip6963:requestProvider',announce);let wallets=[];
 const stop=watchWallets(target,list=>wallets=list);
 assert.equal(wallets.length,2);assert.equal(wallets.find(w=>w.id==='rabby').provider,rabby);
 announce();assert.equal(wallets.length,2);stop();const prior=wallets;announce();assert.equal(wallets,prior);
});
test('sign-in uses the selected wallet chain without requiring testnet for login',async t=>{
 const store=await createStore({filename:':memory:'});t.after(()=>store.close());const account=privateKeyToAccount(generatePrivateKey());
 const c=await challenge(store,account.address,'https://quest.example',Date.now(),1);
 assert.match(c.message,/Chain ID: 1\n/);assert.equal(await verifyLogin(store,c.nonce,await account.signMessage({message:c.message})),account.address.toLowerCase());
 await assert.rejects(challenge(store,account.address,'https://quest.example',Date.now(),-1));
});
test('plain-text hosting failures produce a useful HTTP error, not a JSON syntax error',async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response('NOT_FOUND',{status:404}));
 await assert.rejects(api('auth/challenge',{}),/HTTP 404/);
});
test('wallet rejection and pending requests show actionable messages',()=>{
 assert.match(walletError({code:-32002}),/already open/);assert.match(walletError({code:4001}),/cancelled/);
});
