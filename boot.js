// Keep startup failures visible instead of leaving a silent loading placeholder.
let started=false;
function loadingFailure(message){
 const box=document.getElementById('loading-art');box.hidden=false;box.style.cssText='padding:28px;white-space:pre-wrap;text-align:center;background:#10191ff2;color:#f5d8b0;pointer-events:auto;z-index:100';
 box.textContent='Game startup failed\n\n'+message+'\n\nUse the exact address printed by the new launcher. If this persists, copy this message.';
}
window.addEventListener('error',event=>{if(!started)loadingFailure(event.message||'A script failed to load.');});
window.addEventListener('unhandledrejection',event=>{if(!started)loadingFailure(event.reason?.message||String(event.reason));});
try{
 if(!window.Phaser||!window.tracking)throw new Error('A bundled library did not load. Extract the entire ZIP, including the vendor folder.');
 await import('./app.js?build=0.6.0');
 let timeout=setTimeout(()=>{if(!window.zcTest?.game.ready)loadingFailure('The scene did not finish loading. Check the terminal for HTTP errors.');},20000);
 const wait=setInterval(()=>{if(window.zcTest?.game.ready){started=true;clearTimeout(timeout);clearInterval(wait);}},100);
}catch(error){loadingFailure(error.message);}
