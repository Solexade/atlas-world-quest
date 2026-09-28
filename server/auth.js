import { randomBytes, createHmac, timingSafeEqual } from 'node:crypto';
import { getAddress, verifyMessage } from 'viem';
import { fail } from './game.js';
export const CHAIN_ID=46630;
export function normalizeAddress(a) {try{return getAddress(a).toLowerCase();}catch{fail('Enter a valid EVM wallet address.');}}
export async function challenge(store,address,origin,now=Date.now(),chainId=CHAIN_ID) {
  address=normalizeAddress(address);
  if(!Number.isSafeInteger(chainId)||chainId<=0)fail('Invalid wallet network. Select an EVM network and reconnect.');
  const nonce=randomBytes(24).toString('hex');
  const domain=new URL(origin).host;
  const message=`${domain} wants you to sign in with your Ethereum account:\n${getAddress(address)}\n\nSign in to ATLAS World Quest. No transaction or token approval. Ranked scores and your wallet address are public.\n\nURI: ${origin}\nVersion: 1\nChain ID: ${chainId}\nNonce: ${nonce}\nIssued At: ${new Date(now).toISOString()}\nExpiration Time: ${new Date(now+300000).toISOString()}`;
  await store.putIfAbsent(`nonce:${nonce}`,{address,message},now+300000);
  return {nonce,message};
}
export async function verifyLogin(store,nonce,signature,now=Date.now()) {
  if(!/^[a-f0-9]{48}$/.test(nonce||'')||typeof signature!=='string'||signature.length>4096)fail('Invalid sign-in request.',401);
  const entry=await store.take(`nonce:${nonce}`);
  if(!entry)fail('Sign-in expired or already used. Please reconnect.',401);
  let valid=false;
  try{valid=await verifyMessage({address:entry.address,message:entry.message,signature});}catch{}
  if(!valid)fail('Wallet signature did not match.',401);
  return entry.address;
}
export function sessionToken(address,secret,now=Date.now()) {
  const payload=Buffer.from(JSON.stringify({address,exp:now+86400000})).toString('base64url');
  return `${payload}.${createHmac('sha256',secret).update(payload).digest('base64url')}`;
}
export function readSession(token,secret,now=Date.now()) {
  try{
    const [payload,sig,...extra]=(token||'').split('.');if(extra.length||!payload||!sig)return null;
    const expected=createHmac('sha256',secret).update(payload).digest();const actual=Buffer.from(sig,'base64url');
    if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return null;
    const data=JSON.parse(Buffer.from(payload,'base64url'));
    return data.exp>now&&/^0x[a-f0-9]{40}$/.test(data.address)?data.address:null;
  }catch{return null;}
}
export function cookies(req) {return Object.fromEntries((req.headers.cookie||'').split(';').map(v=>{const at=v.indexOf('=');return [v.slice(0,at).trim(),v.slice(at+1)];}));}
export const cookie=(name,value,seconds,secure)=>`${name}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${seconds}${secure?'; Secure':''}`;
