export async function api(path,data){
 let response;
 try{response=await fetch(`/api/${path}`,{method:data===undefined?'GET':'POST',credentials:'same-origin',headers:data===undefined?{}:{'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data),signal:AbortSignal.timeout(20000)});}catch(e){throw new Error(e.name==='TimeoutError'?'The game service took too long. Please retry.':'Unable to reach the game service. Check your connection and retry.');}
 const text=await response.text();let result;
 try{result=JSON.parse(text);}catch{throw new Error(`The game service returned an unexpected response (HTTP ${response.status}). Please refresh and retry. If it continues, report this status to ATLAS.`);}
 if(!response.ok)throw new Error(result.error||`The request failed (HTTP ${response.status}). Please retry.`);
 return result;
}
