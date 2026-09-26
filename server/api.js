import { randomBytes,createHash } from 'node:crypto';
import { createStore } from './store.js';
import { challenge,verifyLogin,sessionToken,readSession,cookies,cookie } from './auth.js';
import { startRound,answerRound,nextQuestion,leaderboard,passport,fail } from './game.js';
import { PRACTICE } from './questions.js';
import { makeReceipt,receiptConfigured } from './receipt.js';
let storePromise;
const localSecret=randomBytes(32).toString('hex');
const getStore=()=>storePromise ||= createStore().catch(e=>{storePromise=null;throw e;});
function configuration(env) {
  const production=Boolean(env.VERCEL)||env.NODE_ENV==='production';
  const origin=env.APP_ORIGIN||(!production?'http://127.0.0.1:5180':null);
  const secret=env.SESSION_SECRET||(!production?localSecret:null);
  return {production,origin,secret,ready:!!origin&&!!secret&&secret.length>=32&&(!production||!!env.DATABASE_URL)};
}
async function bodyOf(req){
  if(req.body){if(typeof req.body==='string')return JSON.parse(req.body);return req.body;}
  let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>8192)fail('Request too large.',413);}
  try{return raw?JSON.parse(raw):{};}catch{fail('Invalid JSON.');}
}
async function limit(store,key,max,windowMs){
  const bucket=Math.floor(Date.now()/windowMs);const id=`limit:${key}:${bucket}`;
  for(let i=0;i<8;i++){
    const r=await store.get(id);if(r?.value.count>=max)fail('Too many requests. Please try again shortly.',429);
    const value={count:(r?.value.count||0)+1};
    if(r?await store.cas(id,value,r.version):await store.putIfAbsent(id,value,(bucket+2)*windowMs))return;
  }fail('Please wait before trying again.',429);
}
export function createHandler({storeProvider=getStore,env=process.env}={}) {
  return async function handler(req,res){
    res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
    const send=(value,status=200)=>{res.statusCode=status;res.end(JSON.stringify(value));};
    try{
      const path=new URL(req.url,'http://internal').pathname.replace(/\/$/,'');
      const config=configuration(env);
      if(path==='/api/config'&&req.method==='GET')return send({rankedReady:config.ready,onchainReady:config.ready&&receiptConfigured(env),chainId:46630,local:!config.production,faucet:'https://faucet.testnet.chain.robinhood.com/'});
      if(path==='/api/practice'&&req.method==='GET')return send({questions:PRACTICE});
      if(!['GET','POST'].includes(req.method))fail('Method not allowed.',405);
      if(!config.ready)fail('Ranked play is being configured. Practice is open now.',503);
      if(req.method==='POST'&&req.headers.origin!==config.origin)fail('This request must come from the game site.',403);
      if(req.method==='POST'&&!String(req.headers['content-type']||'').startsWith('application/json'))fail('JSON is required.',415);
      let store;try{store=await storeProvider();}catch{fail('The leaderboard service is unavailable. Please try again later.',503);}
      const jar=cookies(req),secure=config.origin.startsWith('https:');
      const address=readSession(jar.atlas_session,config.secret);
      if(req.method==='GET'&&path==='/api/me'){
        if(!address)return send({player:null});
        const p=(await store.get(`player:${address}`))?.value||{address,total:0,completed:0,stamps:[],rounds:[]};return send({player:passport(p)});
      }
      if(req.method==='GET'&&path==='/api/leaderboard'){
        const period=new URL(req.url,'http://internal').searchParams.get('period')==='all'?'all':'week';
        return send({period,players:await leaderboard(store,period),updatedAt:new Date().toISOString()});
      }
      if(req.method!=='POST')fail('Not found.',404);
      const body=await bodyOf(req);
      if(path==='/api/auth/logout'){res.setHeader('Set-Cookie',cookie('atlas_session','',0,secure));return send({ok:true});}
      if(path==='/api/auth/challenge'){
        const ip=config.production?req.headers['x-vercel-forwarded-for']||req.socket?.remoteAddress||'unknown':req.socket?.remoteAddress||'local';
        await limit(store,createHash('sha256').update(String(ip)).digest('hex'),20,60000);
        await store.prune();
        const result=await challenge(store,body.address,config.origin);
        res.setHeader('Set-Cookie',cookie('atlas_nonce',result.nonce,300,secure));return send(result);
      }
      if(path==='/api/auth/verify'){
        if(!jar.atlas_nonce||jar.atlas_nonce!==body.nonce)fail('Sign-in session changed. Please reconnect.',401);
        const wallet=await verifyLogin(store,body.nonce,body.signature);
        res.setHeader('Set-Cookie',[cookie('atlas_session',sessionToken(wallet,config.secret),86400,secure),cookie('atlas_nonce','',0,secure)]);
        return send({address:wallet});
      }
      if(!address)fail('Sign in with your wallet to play ranked.',401);
      await limit(store,address,60,60000);
      if(path==='/api/round/start')return send(await startRound(store,address));
      if(path==='/api/round/answer')return send(await answerRound(store,address,body));
      if(path==='/api/round/next')return send(await nextQuestion(store,address,body.roundId));
      if(path==='/api/round/receipt')return send(await makeReceipt(store,address,body.roundId,env));
      fail('Not found.',404);
    }catch(e){send({error:e.status?e.message:'The service could not complete this request. Please retry.'},e.status||500);}
  };
}
export default createHandler();
