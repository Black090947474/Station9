/* Multiplayer for the Android app: replaces the claude.ai room with a direct
   phone-to-phone connection (WebRTC via PeerJS). The first player in a room code
   becomes the hub; everyone else connects to it and the hub relays all presence.
   It offers the same calls the game already uses: join(code) -> {presence, onPeers, leave}. */
function peerRoomBase(){
  const PeerC=window.Peer||(window.peerjs&&window.peerjs.Peer);
  if(!PeerC)return null;
  const OPTS={debug:0,config:{iceServers:[
    {urls:'stun:stun.l.google.com:19302'},
    {urls:'stun:global.stun.twilio.com:3478'},
    {urls:'turn:openrelay.metered.ca:80',username:'openrelayproject',credential:'openrelayproject'},
    {urls:'turn:openrelay.metered.ca:443',username:'openrelayproject',credential:'openrelayproject'}]}};
  return {join(code){return new Promise((resolve,reject)=>{
    const hubId='station9-'+String(code).toLowerCase().replace(/[^a-z0-9-]/g,'');
    const pres=new Map(),conns=new Map(),listeners=new Set(),errFns=new Set();
    let me=null,myId=null,isHub=false,hubConn=null,closed=false,done=false,bcastT=null,lastHub=Date.now();const myPres={};const seen=new Map();
    const snapshot=()=>[...pres].map(([id,p])=>({peer:id,presence:p||{},sameTab:id===myId,isMe:id===myId,kind:'viewer',guest:false,by:null,updatedAt:Date.now()}));
    const emitPeers=()=>{const s=snapshot();listeners.forEach(f=>{try{f({peers:s,joined:[],left:[],updated:[]});}catch(e){}});};
    const fail=msg=>{if(closed)return;closed=true;clearInterval(watch);errFns.forEach(f=>{try{f&&f({code:'upstream_error',message:msg});}catch(e){}});try{me&&me.destroy();}catch(e){}};
    const broadcast=()=>{if(bcastT)return;bcastT=setTimeout(()=>{bcastT=null;const all=[...pres];for(const c of conns.values())if(c.open)try{c.send({t:'all',ps:all});}catch(e){}},60);};
    const api={name:code,
      presence(p){if(closed)return Promise.resolve();for(const k in p){if(p[k]===null)delete myPres[k];else myPres[k]=p[k];}
        if(myId){pres.set(myId,{...myPres});if(isHub){broadcast();emitPeers();}else if(hubConn&&hubConn.open){try{hubConn.send({t:'p',p:myPres});}catch(e){}}}
        return Promise.resolve();},
      onPeers(fn,onErr){listeners.add(fn);if(onErr)errFns.add(onErr);setTimeout(()=>{try{fn({peers:snapshot(),joined:[],left:[],updated:[]});}catch(e){}},0);return()=>listeners.delete(fn);},
      peers:snapshot,connected:()=>!closed,
      leave(){closed=true;clearInterval(watch);try{me&&me.destroy();}catch(e){}return Promise.resolve();}};
    // players who vanish without a clean disconnect drop out after a few seconds
    const watch=setInterval(()=>{if(closed)return;const now=Date.now();
      if(isHub){for(const [id,t] of seen)if(now-t>6000){seen.delete(id);const c=conns.get(id);conns.delete(id);try{c&&c.close();}catch(e){}if(pres.delete(id)){emitPeers();broadcast();}}}
      else if(done&&hubConn&&now-lastHub>8000)fail('Der Raum antwortet nicht mehr');},2000);
    const ok=()=>{if(done)return;done=true;clearTimeout(to);pres.set(myId,{...myPres});resolve(api);};
    const to=setTimeout(()=>{if(!done){done=true;try{me&&me.destroy();}catch(e){}reject(new Error('timeout'));}},12000);
    const asHub=()=>{
      me=new PeerC(hubId,OPTS);
      me.on('open',id=>{myId=id;isHub=true;ok();});
      me.on('connection',c=>{
        c.on('open',()=>{if(conns.size>=3){try{c.send({t:'full'});}catch(e){}setTimeout(()=>c.close(),200);return;}conns.set(c.peer,c);broadcast();});
        c.on('data',d=>{seen.set(c.peer,Date.now());if(d&&d.t==='p'&&typeof d.p==='object'){pres.set(c.peer,d.p);emitPeers();broadcast();}});
        const gone=()=>{seen.delete(c.peer);conns.delete(c.peer);if(pres.delete(c.peer)){emitPeers();broadcast();}};
        c.on('close',gone);c.on('error',gone);});
      me.on('error',e=>{if(!done&&e&&e.type==='unavailable-id'){try{me.destroy();}catch(x){}asClient();}else if(!done){done=true;clearTimeout(to);reject(e);}else if(e&&e.type!=='peer-unavailable')fail('Verbindung verloren');});
      me.on('disconnected',()=>{try{if(!closed)me.reconnect();}catch(e){}});};
    const asClient=()=>{
      me=new PeerC(OPTS);
      me.on('open',id=>{myId=id;hubConn=me.connect(hubId,{reliable:true});
        hubConn.on('open',()=>{ok();try{hubConn.send({t:'p',p:myPres});}catch(e){}});
        hubConn.on('data',d=>{lastHub=Date.now();if(!d)return;if(d.t==='full'){fail('Raum ist voll');return;}
          if(d.t==='all'&&Array.isArray(d.ps)){for(const k of [...pres.keys()])if(k!==myId)pres.delete(k);for(const [id,p] of d.ps)if(id!==myId&&p&&typeof p==='object')pres.set(id,p);emitPeers();}});
        hubConn.on('close',()=>fail('Der Raum wurde geschlossen'));});
      me.on('error',e=>{if(!done){done=true;clearTimeout(to);reject(e);}else fail('Verbindung verloren');});};
    asHub();
  });}};
}
