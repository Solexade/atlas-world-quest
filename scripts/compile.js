import solc from 'solc';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
export function compile(){
 const root=fileURLToPath(new URL('../',import.meta.url));
 const input={language:'Solidity',sources:{'AtlasWorldQuest.sol':{content:readFileSync(resolve(root,'contracts/AtlasWorldQuest.sol'),'utf8')}},settings:{optimizer:{enabled:true,runs:200},evmVersion:'paris',outputSelection:{'*':{'*':['abi','evm.bytecode.object']}}}};
 const out=JSON.parse(solc.compile(JSON.stringify(input),{import:path=>({contents:readFileSync(resolve(root,'node_modules',path),'utf8')})}));
 const errors=out.errors?.filter(e=>e.severity==='error');if(errors?.length)throw new Error(errors.map(e=>e.formattedMessage).join('\n'));
 const c=out.contracts['AtlasWorldQuest.sol'].AtlasWorldQuest;
 return {abi:c.abi,bytecode:`0x${c.evm.bytecode.object}`};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){mkdirSync('artifacts',{recursive:true});writeFileSync('artifacts/AtlasWorldQuest.json',JSON.stringify(compile(),null,2));console.log('Compiled AtlasWorldQuest score registry.');}
