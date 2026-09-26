import { keccak256, toBytes, isAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { CHAIN_ID } from './auth.js';
import { fail } from './game.js';
export const receiptTypes={Score:[{name:'player',type:'address'},{name:'roundId',type:'bytes32'},{name:'day',type:'uint256'},{name:'points',type:'uint256'},{name:'deadline',type:'uint256'}]};
export function receiptConfigured(env=process.env) {return /^0x[a-fA-F0-9]{64}$/.test(env.SCORE_SIGNER_PRIVATE_KEY||'')&&isAddress(env.SCORE_CONTRACT_ADDRESS||'');}
export async function makeReceipt(store,address,roundId,env=process.env,now=Date.now()) {
  if(!receiptConfigured(env))fail('Onchain recording is not enabled yet. Your server-verified points are saved.',503);
  const player=(await store.get(`player:${address}`))?.value;
  const round=player?.rounds.find(r=>r.id===roundId&&r.done);
  if(!round)fail('Complete a ranked expedition before recording it.',404);
  const message={player:address,roundId:keccak256(toBytes(round.id)),day:BigInt(round.day),points:BigInt(round.score),deadline:BigInt(Math.floor(now/1000)+3600)};
  const domain={name:'AtlasWorldQuest',version:'1',chainId:CHAIN_ID,verifyingContract:env.SCORE_CONTRACT_ADDRESS};
  const signature=await privateKeyToAccount(env.SCORE_SIGNER_PRIVATE_KEY).signTypedData({domain,types:receiptTypes,primaryType:'Score',message});
  return {contract:env.SCORE_CONTRACT_ADDRESS,chainId:CHAIN_ID,signature,...Object.fromEntries(Object.entries(message).map(([k,v])=>[k,typeof v==='bigint'?v.toString():v]))};
}
