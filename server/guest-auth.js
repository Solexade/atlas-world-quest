import {randomBytes,createHash} from 'node:crypto';
import {fail} from './game.js';
export function explorerName(value){
 const name=typeof value==='string'?value.trim().replace(/\s+/g,' '):'';
 if(!/^[a-zA-Z0-9][a-zA-Z0-9 _-]{2,19}$/.test(name))fail('Choose 3–20 letters, numbers, spaces, underscores or hyphens.');
 return name;
}
export const recoveryIdentity=key=>'guest:'+createHash('sha256').update(key).digest('hex');
export async function createExplorer(store,name){
 name=explorerName(name);
 const recoveryCode='AQ-'+randomBytes(32).toString('hex'),identity=recoveryIdentity(recoveryCode);
 // Names are display labels, never authentication credentials or unique account keys.
 await store.putIfAbsent('explorer:'+identity,{name,created:Date.now()});
 await store.putIfAbsent('player:'+identity,{address:identity,name,total:0,completed:0,stamps:[],rounds:[]});
 return {identity,recoveryCode};
}
export async function recoverExplorer(store,key){
 if(typeof key!=='string'||!/^AQ-[a-f0-9]{64}$/.test(key.trim()))fail('Enter the complete private recovery code.',401);
 const identity=recoveryIdentity(key.trim());
 if(!await store.get('explorer:'+identity))fail('Recovery code was not found. Check it and retry.',401);
 return identity;
}
