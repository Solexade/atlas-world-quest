import { randomBytes,createHash } from 'node:crypto';
import { createStore } from './store.js';
import { sessionToken,readSession,cookies,cookie } from './auth.js';
import { startRound,startLevel,answerRound,nextQuestion,leaderboard,passport,fail } from './game.js';
import {LEVELS} from './levels.js';
import { PRACTICE } from './questions.js';
import {createExplorer,recoverExplorer} from './guest-auth.js';
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
      if(path==='/api/config'&&req.method==='GET')return send({rankedReady:config.ready,authProvider:'guest',levels:LEVELS,onchainReady:false,chainId:46630,local:!config.production,faucet:'https://faucet.testnet.chain.robinhood.com/'});
      if(path==='/api/practice'&&req.method==='GET')return send({questions:PRACTICE.map(({answer,explanation,...q})=>q)});
      if(!['GET','POST'].includes(req.method))fail('Method not allowed.',405);
      if(path==='/api/practice'&&req.method==='POST'){
        if(req.headers.origin!==config.origin)fail('This request must come from the game site.',403);
        if(!String(req.headers['content-type']||'').startsWith('application/json'))fail('JSON is required.',415);
        const input=await bodyOf(req),q=PRACTICE.find(q=>q.id===input.id);
        if(!q||!Number.isInteger(input.choice)||input.choice< -1||input.choice>3)fail('Invalid practice answer.');
        return send({correct:input.choice===q.answer});
      }
      if(!config.ready)fail('Ranked play is being configured. Practice is open now.',503);
      if(req.method==='POST'&&req.headers.origin!==config.origin)fail('This request must come from the game site.',403);
      if(req.method==='POST'&&!String(req.headers['content-type']||'').startsWith('application/json'))fail('JSON is required.',415);
      let store;try{store=await storeProvider();}catch{fail('The leaderboard service is unavailable. Please try again later.',503);}
      const jar=cookies(req),secure=config.origin.startsWith('https:');
      const session=readSession(jar.atlas_session,config.secret);
      const address=session?.startsWith('guest:')?session:null;
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
      if(path==='/api/auth/challenge'||path==='/api/auth/verify')fail('Wallet login has been retired. Choose an explorer name instead.',410);
      if(path==='/api/auth/create'||path==='/api/auth/recover'){
        const ip=config.production?req.headers['x-vercel-forwarded-for']||req.socket?.remoteAddress||'unknown':req.socket?.remoteAddress||'local';
        await limit(store,'guest:'+createHash('sha256').update(String(ip)).digest('hex'),10,60000);
        let identity,recoveryCode;
        if(path.endsWith('/create')){
          if(address)return send({ok:true});
          ({identity,recoveryCode}=await createExplorer(store,body.name));
        }else identity=await recoverExplorer(store,body.recoveryCode);
        res.setHeader('Set-Cookie',cookie('atlas_session',sessionToken(identity,config.secret,Date.now(),31536000000),31536000,secure));
        return send({ok:true,...(recoveryCode?{recoveryCode}:{})});
      }
      if(!address)fail('Choose an explorer name to save ranked scores.',401);
      await limit(store,address,60,60000);
      if(path==='/api/round/start')return send(await startLevel(store,address,body.level));
      if(path==='/api/round/answer')return send(await answerRound(store,address,body));
      if(path==='/api/round/next')return send(await nextQuestion(store,address,body.roundId));
      if(path==='/api/round/receipt')fail('Onchain recording is disabled. Your score is saved to your account.',410);
      fail('Not found.',404);
    }catch(e){send({error:e.status?e.message:'The service could not complete this request. Please retry.'},e.status||500);}
  };
}
export default createHandler();
