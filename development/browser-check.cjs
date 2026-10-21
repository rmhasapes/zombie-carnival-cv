const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({...(process.env.CV_BROWSER_PATH?{executablePath:process.env.CV_BROWSER_PATH}:{}),headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),errors=[];
 context.on('page',p=>{p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400&&/\.(js|png|json|css)(\?|$)/.test(r.url()))errors.push(r.url()+' '+r.status());});});
 await context.addInitScript(()=>{
  const canvas=document.createElement('canvas');canvas.width=640;canvas.height=360;const ctx=canvas.getContext('2d');
  window.testBall={x:320,y:180,radius:20,visible:true};function paint(){ctx.fillStyle='#102032';ctx.fillRect(0,0,640,360);const b=window.testBall;if(b.visible){ctx.fillStyle='#f4952a';ctx.beginPath();ctx.arc(b.x,b.y,b.radius,0,Math.PI*2);ctx.fill();}requestAnimationFrame(paint);}paint();
  Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:async()=>canvas.captureStream(60)});
  Object.defineProperty(navigator.mediaDevices,'enumerateDevices',{value:async()=>[{kind:'videoinput',deviceId:'synthetic',label:'Synthetic test camera'}]});
 });
 const game=await context.newPage();await game.goto('http://127.0.0.1:8782');await game.waitForFunction(()=>window.zcTest?.game.ready);
 await game.locator('#throw-count').fill('5');await game.locator('#start-round').click();assert.equal(await game.evaluate(()=>window.carnival.round.throws),5);
 const labPromise=context.waitForEvent('page');await game.locator('#open-cv-lab').click();const lab=await labPromise;await lab.waitForLoadState();
 await lab.locator('#connect').click();await lab.waitForFunction(()=>window.cvLab?.last?.frameId>3);
 assert.ok(await lab.evaluate(()=>window.cvLab.last.detection?.radius>18));
 const projectorPromise=context.waitForEvent('page');await lab.locator('#projector').click();const projector=await projectorPromise;await projector.waitForLoadState();await projector.waitForTimeout(300);
 const click=async(x,y)=>{const b=await lab.locator('#camera').boundingBox();await lab.mouse.click(b.x+x*b.width,b.y+y*b.height);};
 await lab.locator('#corners').click();for(const [x,y]of [[.08,.13],[.92,.13],[.92,.86],[.08,.86]])await click(x,y);
 assert.ok(await lab.evaluate(()=>window.cvLab.calibration.H));
 await lab.locator('#validate').click();for(const [x,y]of [[.3,.3],[.7,.3],[.7,.7],[.3,.7],[.5,.5]])await click(x,y);
 assert.equal(await lab.evaluate(()=>window.cvLab.calibration.validated),true);
 for(const [i,x,y]of [[0,.1,.1],[1,.5,.1],[2,.9,.1],[3,.1,.5],[4,.5,.5],[5,.9,.5],[6,.1,.9],[7,.5,.9],[8,.9,.9]]){
  await lab.evaluate(({x,y})=>Object.assign(window.testBall,{x:x*640,y:y*360,radius:20}),{x,y});await lab.waitForTimeout(120);await lab.locator('#sample').click();await lab.waitForFunction(i=>window.cvLab.calibration.samples.length===i+1,i,{timeout:15000});
 }
 assert.equal(await lab.evaluate(()=>window.cvLab.calibration.ready),true);assert.equal(await lab.locator('#bridge').isDisabled(),true);
 await lab.screenshot({path:'cv-preview.png',fullPage:true});
 await lab.locator('#physical-tested').check();assert.equal(await lab.locator('#bridge').isDisabled(),false);await lab.locator('#bridge').check();assert.equal(await game.evaluate(()=>window.cvImpactAdapter.enabled),true);
 assert.equal(await lab.evaluate(()=>window.gameCanvas===window.opener.gameCanvas),true);
 // Worker runs off-thread, timestamps and frame IDs progress, and logs have no repeated accepted IDs.
 const ids=await lab.evaluate(()=>window.cvLab.logs.map(r=>r.frameId));assert.equal(new Set(ids).size,ids.length);
 await lab.locator('#tolerance').fill('.12');await lab.locator('#tolerance').dispatchEvent('change');assert.equal(await game.evaluate(()=>window.cvImpactAdapter.enabled),false);assert.equal(await lab.locator('#bridge').isChecked(),false);
 // Camera restart invalidates calibration and shuts off scoring.
 await lab.locator('#stop').click();assert.equal(await lab.evaluate(()=>window.cvLab.calibration.H),null);await lab.locator('#connect').click();await lab.waitForFunction(()=>window.cvLab.last?.frameId>2);assert.equal(await lab.evaluate(()=>window.cvLab.calibration.samples.length),0);
 await lab.setViewportSize({width:390,height:844});assert.ok(await lab.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await lab.screenshot({path:'cv-mobile.png',fullPage:true});
 await lab.close();await game.waitForTimeout(100);assert.equal(await game.evaluate(()=>window.cvImpactAdapter.enabled),false);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({browser:'passed',game:'five-throw round preserved',worker:'real browser worker and contour detection passed',calibration:'4 corners + 5 independent checks + 9 radius samples passed',frames:'unique frame IDs passed',bridge:'opt-in, projector source, config reset and close guards passed',responsive:'390px without overflow',errors}));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
