import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {CREW,companion,questionHost,reaction} from '../src/crew.js';
test('twelve companions and rotating hosts are deterministic and cosmetic',()=>{
 assert.equal(CREW.length,12);assert.equal(new Set(CREW.map(v=>v.id)).size,12);
 assert.equal(companion('missing'),CREW[0]);assert.equal(companion('71').name,'Mariner');
 assert.equal(questionHost(1,1),CREW[0]);assert.equal(questionHost(10,5),CREW[1]);
 for(const v of CREW){assert.ok(v.greeting);assert.equal(v.score,undefined);assert.equal(v.answer,undefined);}
 assert.notEqual(reaction(true,1),reaction(false,1));
});
test('all shipped portraits match the source manifest and are WebP images',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../public/vibers/sources.json',import.meta.url),'utf8'));
 for(const v of CREW){const item=manifest.find(a=>a.id===v.id);assert.ok(item);const data=await readFile(new URL('../public'+v.image,import.meta.url));assert.equal(data.toString('ascii',8,12),'WEBP');assert.equal(createHash('sha256').update(data).digest('hex'),item.sha256);}
});
