// Only transfers new video frames. One bitmap/worker request may be in flight.
export class FramePump{
 constructor(video,{onFrame,onFault}){this.video=video;this.onFrame=onFrame;this.onFault=onFault;this.generation=0;}
 start(){this.stop();this.active=true;this.busy=false;this.frameId=0;this.firstMedia=null;this.lastMedia=-Infinity;this.lastTimestamp=-Infinity;this.lastFresh=performance.now();this.delivered=0;this.dropped=0;this.clock='unknown';this.started=this.lastFresh;const gen=this.generation;this.watchdog=setInterval(()=>{if(this.active&&performance.now()-this.lastFresh>1600)this.onFault('Camera frames stalled');if(this.busy&&performance.now()-this.sentAt>2000)this.onFault('CV worker stalled');},300);this.schedule(gen);}
 stop(){this.active=false;this.generation++;if(this.callback!==undefined){if(this.video.cancelVideoFrameCallback)this.video.cancelVideoFrameCallback(this.callback);else cancelAnimationFrame(this.callback);}clearInterval(this.watchdog);this.busy=false;}
 schedule(gen){if(!this.active||gen!==this.generation)return;if(this.video.requestVideoFrameCallback)this.callback=this.video.requestVideoFrameCallback((now,metadata)=>this.consume(now,metadata,gen));else this.callback=requestAnimationFrame(now=>this.consume(now,{mediaTime:this.video.currentTime},gen));}
 consume(now,metadata,gen){if(!this.active||gen!==this.generation)return;this.schedule(gen);const media=metadata.mediaTime;if(!Number.isFinite(media)||media<=this.lastMedia)return;this.lastMedia=media;this.lastFresh=now;this.frameId++;if(this.firstMedia===null){this.firstMedia=media;this.anchor=now;}
 let timestamp=this.anchor+(media-this.firstMedia)*1000,clock='mediaTime-relative';if(Number.isFinite(metadata.captureTime)&&metadata.captureTime>=0&&metadata.captureTime<=now+5){timestamp=metadata.captureTime;this.anchor=timestamp-(media-this.firstMedia)*1000;clock='captureTime';}if(timestamp<=this.lastTimestamp){this.dropped++;return;}this.lastTimestamp=timestamp;this.clock=clock;if(this.busy){this.dropped++;return;}this.busy=true;this.sentAt=now;const frame={timestamp,frameId:this.frameId,clock,mediaTime:media};
 createImageBitmap(this.video).then(bitmap=>{if(!this.active||gen!==this.generation){bitmap.close();return;}this.delivered++;this.onFrame({...frame,bitmap});}).catch(error=>{this.busy=false;this.onFault(error.message);});
 }
 acknowledge(){this.busy=false;}
}
