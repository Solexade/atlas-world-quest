export function watchWallets(target, update) {
  const wallets=[];
  const add=(provider,info={})=>{
    if(typeof provider?.request!=='function'||wallets.some(w=>w.provider===provider))return;
    wallets.push({provider,id:info.uuid||`legacy-${wallets.length}`,name:String(info.name||(provider.isRabby?'Rabby':provider.isMetaMask?'MetaMask':'Browser wallet')).slice(0,60)});
    update([...wallets]);
  };
  const announce=e=>{if(e.detail)add(e.detail.provider,e.detail.info);};
  const legacy=()=>{for(const p of target.ethereum?.providers||[target.ethereum])add(p);};
  target.addEventListener('eip6963:announceProvider',announce);
  target.addEventListener('ethereum#initialized',legacy);
  target.dispatchEvent(new Event('eip6963:requestProvider'));
  legacy();
  return ()=>{target.removeEventListener('eip6963:announceProvider',announce);target.removeEventListener('ethereum#initialized',legacy);};
}
export function walletError(e) {
  const code=Number(e?.code??e?.data?.originalError?.code);
  if(code===4001)return 'Wallet request cancelled. You can reconnect when ready.';
  if(code===-32002)return 'A request is already open in your wallet. Open Rabby or your wallet extension and approve or cancel it, then retry.';
  return e?.shortMessage||e?.message||'Connection failed. Unlock your wallet and try again.';
}
