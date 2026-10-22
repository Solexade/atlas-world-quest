// ATLAS roles and dialogue are fictional; artwork IDs refer to the public raider gallery.
export const CREW = [
 [6,'Scout','First steps','Every great expedition begins with one curious question.'],
 [10,'Metro','City guide','The world is full of stories. Let’s find your next one.'],
 [32,'Beacon','Landmark spotter','Take a breath. Read the question. Make your call.'],
 [31,'Spark','Trail captain','Bring the curiosity. I’ll bring the energy.'],
 [42,'Canopy','Regional explorer','From coastlines to capitals, there is always more to discover.'],
 [48,'Rotor','Map strategist','Slow down and look at every option. You’ve got this.'],
 [63,'Pulse','Infrastructure scout','Ports, roads and power connect our world.'],
 [71,'Mariner','Trade route guide','Set your course. The next discovery is yours.'],
 [103,'Aurum','Asset investigator','Good explorers ask questions before drawing conclusions.'],
 [123,'Nova','Global specialist','A fresh perspective can take you a long way.'],
 [141,'Cipher','Evidence keeper','Stay curious. Evidence makes a better compass than a guess.'],
 [142,'Atlas envoy','Mastery host','One question at a time. Every attempt is part of the journey.'],
].map(([id,name,role,greeting])=>({id,name,role,greeting,image:`/vibers/viber-${id}.webp`}));
export function companion(id){return CREW.find(v=>v.id===Number(id))||CREW[0];}
export function questionHost(level=1,number=1){return CREW[(Math.max(1,Number(level)||1)-1+Math.max(1,Number(number)||1)-1)%CREW.length];}
export const CHEERS=['Brilliant navigation!','The crew is cheering you on!','Discovery secured!','That’s explorer energy!','Another step around the world!'];
export function reaction(correct,number=1){return correct?CHEERS[(Math.max(1,number)-1)%CHEERS.length]:'A detour, not the end. Keep exploring.';}
