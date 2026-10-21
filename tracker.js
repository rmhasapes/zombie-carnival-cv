import {rgbToHsv,ContactEstimator,transform} from './core.js';
export class BallCamera{
 constructor({video,canvas,onPoint,onCandidate,onStatus}){
  this.video=video;this.canvas=canvas;this.ctx=canvas.getContext('2d',{willReadFrequently:true});this.buffer=document.createElement('canvas');this.buffer.width=480;this.buffer.height=270;this.bctx=this.buffer.getContext('2d',{willReadFrequently:true});this.onPoint=onPoint;this.onCandidate=onCandidate;this.onStatus=onStatus;this.color=[24,.88,.95];this.tolerance=24;this.minSize=5;this.zoom=1;this.cropX=.5;this.cropY=.5;this.H=null;this.estimator=new ContactEstimator();this.active=false;this.currentPoint=null;this.rectangles=[];
  tracking.ColorTracker.registerColor('carnival-ball',(r,g,b)=>{const[h,s,v]=rgbToHsv(r,g,b);const dh=Math.min(Math.abs(h-this.color[0]),360-Math.abs(h-this.color[0]));return dh<this.tolerance&&s>Math.max(.3,this.color[1]-.45)&&v>.25;});
  this.colorTracker=new tracking.ColorTracker('carnival-ball');this.colorTracker.setMinDimension(3);this.colorTracker.setMinGroupSize(12);this.colorTracker.on('track',e=>{this.rectangles=e.data;});
 }
 async connect(deviceId){
  this.stop();if(!navigator.mediaDevices?.getUserMedia)throw new Error('Camera access needs localhost and a supported desktop browser. Launch server.py.');
  const constraint={width:{ideal:1280},height:{ideal:720},frameRate:{ideal:60},...(deviceId?{deviceId:{exact:deviceId}}:{})};
  this.stream=await navigator.mediaDevices.getUserMedia({video:constraint,audio:false});this.video.srcObject=this.stream;await this.video.play();
  this.track=this.stream.getVideoTracks()[0];this.track.onended=()=>this.stop();this.settings=this.track.getSettings();this.active=true;this.synthetic=false;this.lastFrame=0;this.lastMediaTime=-1;this.windowStart=performance.now();this.frames=0;this.lastFreshFrame=performance.now();this.stalled=false;this.onStatus('connected',this.track.label);this.loop();return this.track.label;
 }
 stop(){this.active=false;this.synthetic=false;cancelAnimationFrame(this.raf);this.stream?.getTracks().forEach(t=>{t.onended=null;t.stop();});this.stream=null;this.video.srcObject=null;this.currentPoint=null;this.rectangles=[];this.estimator.clear();this.onPoint(null);this.onStatus('disconnected');}
 setZoom(zoom){this.zoom=Math.max(1,Math.min(2.5,Number(zoom)||1));this.estimator.clear();return this.zoom;}
 setCrop(x,y){this.cropX=Math.max(0,Math.min(1,Number.isFinite(Number(x))?Number(x):.5));this.cropY=Math.max(0,Math.min(1,Number.isFinite(Number(y))?Number(y):.5));this.estimator.clear();return {x:this.cropX,y:this.cropY};}
 drawMonitoredArea(){const sourceW=this.video.videoWidth/this.zoom,sourceH=this.video.videoHeight/this.zoom,sourceX=(this.video.videoWidth-sourceW)*this.cropX,sourceY=(this.video.videoHeight-sourceH)*this.cropY;this.bctx.drawImage(this.video,sourceX,sourceY,sourceW,sourceH,0,0,480,270);}
 loop=()=>{if(!this.active)return;const now=performance.now();if(now-this.lastFrame>=30&&(this.synthetic||this.video.currentTime!==this.lastMediaTime)){this.lastFrame=now;this.lastFreshFrame=now;this.stalled=false;this.lastMediaTime=this.video.currentTime;try{if(this.synthetic)this.drawSynthetic(now);else if(this.video.readyState>=2)this.drawMonitoredArea();this.process(now);}catch(error){this.onStatus('error',error.message);this.stop();return;}}if(!this.synthetic&&now-this.lastFreshFrame>1200&&!this.stalled){this.stalled=true;this.currentPoint=null;this.onPoint(null);this.onStatus('error','Camera frames stalled. Reconnect before resuming.');}this.raf=requestAnimationFrame(this.loop);};
 process(now){
  const image=this.bctx.getImageData(0,0,480,270);this.colorTracker.setMinDimension(this.minSize);this.colorTracker.track(image.data,480,270);
  let boxes=this.rectangles.filter(b=>b.width<=100&&b.height<=100&&b.width/b.height>.45&&b.width/b.height<2.2);
  if(this.currentRaw&&now-this.currentRaw.t<180)boxes=boxes.sort((a,b)=>Math.hypot(a.x+a.width/2-this.currentRaw.x,a.y+a.height/2-this.currentRaw.y)-Math.hypot(b.x+b.width/2-this.currentRaw.x,b.y+b.height/2-this.currentRaw.y));else boxes.sort((a,b)=>b.width*b.height-a.width*a.height);
  const box=boxes[0];this.ctx.drawImage(this.buffer,0,0);
  if(box){const x=box.x+box.width/2,y=box.y+box.height/2;this.currentRaw={x,y,t:now};const mapped=this.H?transform(this.H,x/480,y/270):null;this.currentPoint=mapped?{...mapped,t:now,size:Math.sqrt(box.width*box.height)/480}:null;
   this.ctx.strokeStyle='#c9f79d';this.ctx.lineWidth=2;this.ctx.strokeRect(box.x,box.y,box.width,box.height);this.ctx.beginPath();this.ctx.arc(x,y,3,0,Math.PI*2);this.ctx.stroke();
   this.onPoint(this.currentPoint,{x:x/480,y:y/270,box,t:now});const candidate=this.estimator.update(this.currentPoint,now);if(candidate)this.onCandidate(candidate);
  }else{this.currentPoint=null;this.onPoint(null);this.estimator.update(null,now);}
  this.frames++;if(now-this.windowStart>1000){this.fps=Math.round(this.frames*1000/(now-this.windowStart));this.frames=0;this.windowStart=now;this.onStatus('fps',this.fps);}
 }
 pickColor(x,y){const px=this.bctx.getImageData(Math.min(479,Math.max(0,Math.floor(x*480))),Math.min(269,Math.max(0,Math.floor(y*270))),1,1).data;const hsv=rgbToHsv(px[0],px[1],px[2]);if(hsv[1]<.25||hsv[2]<.2)throw new Error('Pick a bright, saturated part of the ball.');this.color=hsv;this.estimator.clear();return hsv;}
 startSynthetic(){this.stop();this.active=true;this.synthetic=true;this.syntheticStarted=performance.now();this.lastFrame=0;this.H=[1,0,0,0,1,0,0,0,1];this.currentRaw=null;this.windowStart=performance.now();this.frames=0;this.onStatus('synthetic');this.loop();}
 drawSynthetic(now){const t=(now-this.syntheticStarted)/1000;const phase=t%3.2;let x,y,r;if(phase<1.45){const f=phase/1.45;x=60+f*260;y=185-f*105;r=5+f**3*23;}else{const f=(phase-1.45)/1.45;x=320-f*245;y=80+f*110;r=Math.max(4,28-f*36);}
  this.bctx.fillStyle='#12252b';this.bctx.fillRect(0,0,480,270);this.bctx.strokeStyle='#375453';this.bctx.strokeRect(20,20,440,230);this.bctx.fillStyle='#f4952a';this.bctx.beginPath();this.bctx.arc(x,y,Math.max(3,r),0,Math.PI*2);this.bctx.fill();this.bctx.fillStyle='#a2b9b7';this.bctx.font='14px Arial';this.bctx.fillText('SYNTHETIC INPUT · NOT A REAL CAMERA',22,250);
 }
}
