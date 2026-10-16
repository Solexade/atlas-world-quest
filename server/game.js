import { randomInt, randomUUID } from 'node:crypto';
import { RANKED } from './questions.js';
import {LEVELS,LEVEL_QUESTIONS} from './levels.js';
import { updatePlayer } from './store.js';
export const ROUND_SIZE=5, QUESTION_MS=25000, MAX_SCORE=650;
export const dayOf = now => Math.floor(now/86400000);
export function weekOf(now) { const d=new Date(now); const days=(d.getUTCDay()+6)%7; return dayOf(now)-days; }
export function shuffle(values) { const a=[...values]; for(let i=a.length-1;i>0;i--){const j=randomInt(i+1);[a[i],a[j]]=[a[j],a[i]];} return a; }
export function fail(message,status=400) { const e=new Error(message);e.status=status;throw e; }
const findQ=id=>[...RANKED,...LEVEL_QUESTIONS].find(q=>q.id===id);
export const levelProgress=p=>({cleared:p.levelsCleared||[],unlocked:Math.min(10,(p.levelsCleared||[]).length+1),complete:(p.levelsCleared||[]).length===10});
function activeQuestion(round) {
  if(round.done||round.awaitingNext) return null;
  const q=findQ(round.questions[round.index]);
  return {id:q.id,region:q.region,category:q.category,prompt:q.prompt,options:round.orders[round.index].map(i=>q.options[i]),number:round.index+1,deadline:round.deadline};
}
export function publicRound(r,now=Date.now()) {
  return {id:r.id,day:r.day,score:r.score,correct:r.correct,index:r.index,done:r.done,awaitingNext:!!r.awaitingNext&&!r.done,question:activeQuestion(r),serverNow:now,feedback:r.feedback?{correct:r.feedback.correct,timedOut:r.feedback.timedOut,points:r.feedback.points}:null,stamps:r.stamps||[],size:ROUND_SIZE,level:r.level||null,mode:r.mode||"daily",accuracy:r.correct/ROUND_SIZE*100,passed:r.done&&r.correct/ROUND_SIZE>=.9,awarded:r.awarded??(r.done?r.score:0)};
}
export async function startRound(store,address,now=Date.now()) {
  return updatePlayer(store,address,p=>{
    const today=dayOf(now);
    const current=p.rounds.find(r=>r.day===today);
    if(current) return publicRound(current,now);
    // Abandoned runs expire without earning points. A new UTC day gets a fresh run.
    p.rounds=p.rounds.filter(r=>r.day>=today-90);
    const questions=shuffle(RANKED).slice(0,ROUND_SIZE);
    const r={id:randomUUID(),day:today,questions:questions.map(q=>q.id),orders:questions.map(()=>shuffle([0,1,2,3])),index:0,score:0,correct:0,streak:0,deadline:now+QUESTION_MS,done:false,feedback:null,stamps:[]};
    p.rounds.push(r); return publicRound(r,now);
  });
}
// One current campaign attempt, independent of daily legacy runs. Progress never expires.
export async function startLevel(store,address,level,now=Date.now()) {
  return updatePlayer(store,address,p=>{
    const progress=levelProgress(p),target=level??progress.unlocked;
    if(!Number.isInteger(target)||target<1||target>10)fail('Choose a level from 1 to 10.');
    if(target>progress.unlocked)fail('Pass the previous level with at least 90% accuracy first.',403);
    const previous=p.rounds.filter(r=>r.mode==='levels'&&r.level===target);
    if(progress.cleared.includes(target)){
      const result=previous.findLast(r=>r.done&&r.correct===ROUND_SIZE);
      if(result)return publicRound(result,now);
      fail('This level is already cleared. Continue to the next level.',409);
    }
    const active=previous.findLast(r=>!r.done);
    if(active)return publicRound(active,now);
    const questions=shuffle(LEVEL_QUESTIONS.filter(q=>q.level===target)).slice(0,ROUND_SIZE);
    const r={id:randomUUID(),mode:'levels',level:target,day:dayOf(now),questions:questions.map(q=>q.id),orders:questions.map(()=>shuffle([0,1,2,3])),index:0,score:0,correct:0,streak:0,deadline:now+QUESTION_MS,done:false,feedback:null,stamps:[],awarded:0};
    // Keep successful clears and legacy history; cap failed-attempt history per level.
    const failed=previous.filter(r=>r.done&&r.correct<ROUND_SIZE).slice(0,-9).map(r=>r.id);
    p.rounds=p.rounds.filter(r=>!failed.includes(r.id));p.rounds.push(r);
    return publicRound(r,now);
  });
}
export async function answerRound(store,address,input,now=Date.now()) {
  return updatePlayer(store,address,p=>{
    const r=p.rounds.find(r=>r.id===input.roundId);
    if(!r) fail('Expedition not found.',404);
    if(r.done) return publicRound(r,now);
    if(r.awaitingNext) return publicRound(r,now);
    if(r.mode!=='levels'&&r.day!==dayOf(now)) fail('This expedition has expired. Start today\'s expedition.',409);
    if(input.number!==r.index+1) return publicRound(r,now); // Retried answers never award twice.
    if(!Number.isInteger(input.choice)||input.choice < -1||input.choice>3) fail('Choose one of the four answers.');
    const q=findQ(r.questions[r.index]);
    const timedOut=now>r.deadline;
    const correct=!timedOut && input.choice>=0 && r.orders[r.index][input.choice]===q.answer;
    r.streak=correct?r.streak+1:0;
    const points=correct?100+Math.min(r.streak,5)*10:0;
    r.score+=points;r.correct+=Number(correct);
    if(correct&&!r.stamps.includes(q.region))r.stamps.push(q.region);
    r.feedback={correct,timedOut,points};
    // Wait for explicit Next, so reading feedback does not consume the next timer.
    r.awaitingNext=true;
    r.index++;
    if(r.index===ROUND_SIZE){
      r.done=true;r.finishedAt=now;if(r.mode==='levels')r.day=dayOf(now);
      const passed=r.correct/ROUND_SIZE>=.9;
      const award=r.mode!=='levels'||(passed&&!(p.levelsCleared||[]).includes(r.level));
      r.awarded=award?r.score:0;
      if(award){p.total+=r.awarded;p.completed++;p.stamps=[...new Set([...p.stamps,...r.stamps])];}
      if(r.mode==='levels'&&passed)p.levelsCleared=[...new Set([...(p.levelsCleared||[]),r.level])].sort((a,b)=>a-b);
    }
    r.deadline=null;
    return {...publicRound(r,now),question:null,awaitingNext:!r.done};
  });
}
export async function nextQuestion(store,address,roundId,now=Date.now()) {
  return updatePlayer(store,address,p=>{
    const r=p.rounds.find(r=>r.id===roundId);
    if(!r)fail('Expedition not found.',404);
    if(r.mode!=='levels'&&r.day!==dayOf(now))fail('This expedition has expired.',409);
    if(r.awaitingNext&&!r.done){r.awaitingNext=false;r.feedback=null;r.deadline=now+QUESTION_MS;}
    return publicRound(r,now);
  });
}
export function passport(p,now=Date.now()) {
  return {progress:levelProgress(p),levels:LEVELS,address:p.address,name:p.name||null,total:p.total,completed:p.completed,stamps:p.stamps,rounds:p.rounds.filter(r=>r.done).slice(-7).reverse().map(r=>({id:r.id,day:r.day,score:r.awarded??r.score,correct:r.correct,level:r.level||null,passed:r.correct===5})),today:p.rounds.find(r=>r.day===dayOf(now))?.done||false};
}
export async function leaderboard(store,period,now=Date.now()) {
  const players=await store.players();const week=weekOf(now);
  return players.map(p=>({address:p.address,name:p.name||null,points:period==='all'?p.total:p.rounds.filter(r=>r.done&&r.day>=week).reduce((s,r)=>s+(r.awarded??r.score),0),completed:period==='all'?p.completed:p.rounds.filter(r=>r.done&&r.day>=week&&(r.mode!=='levels'||r.awarded>0)).length})).filter(p=>p.completed>0).sort((a,b)=>b.points-a.points||a.address.localeCompare(b.address)).slice(0,100).map((p,i)=>({...p,rank:i+1}));
}
