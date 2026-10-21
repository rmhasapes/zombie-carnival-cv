import {detectBalls} from './detector.js';
import {ProjectileTracker,DEFAULTS} from './tracker.js';
import {WIDTH,HEIGHT} from './calibration.js';
import {transform} from '../core.js';
let revision=0,config={...DEFAULTS},tracker=new ProjectileTracker(config),lastFrameId=-1;
const canvas=new OffscreenCanvas(WIDTH,HEIGHT),ctx=canvas.getContext('2d',{willReadFrequently:true});
self.onmessage=({data:m})=>{try{
 if(m.type==='configure'){revision=m.revision;config={...DEFAULTS,...m.config};tracker=new ProjectileTracker(config);tracker.calibrate(m.calibration?.H,m.calibration?.samples,m.calibration?.validated);lastFrameId=-1;return;}
 if(m.type!=='frame')return;if(m.revision!==revision||m.frameId<=lastFrameId){m.bitmap.close();postMessage({type:'skipped',frameId:m.frameId,revision:m.revision});return;}lastFrameId=m.frameId;
 const started=performance.now(),zoom=Math.max(1,Math.min(2.5,Number(m.zoom)||1)),cropX=Math.max(0,Math.min(1,Number.isFinite(Number(m.cropX))?Number(m.cropX):.5)),cropY=Math.max(0,Math.min(1,Number.isFinite(Number(m.cropY))?Number(m.cropY):.5)),sourceW=m.bitmap.width/zoom,sourceH=m.bitmap.height/zoom,sourceX=(m.bitmap.width-sourceW)*cropX,sourceY=(m.bitmap.height-sourceH)*cropY;ctx.drawImage(m.bitmap,sourceX,sourceY,sourceW,sourceH,0,0,WIDTH,HEIGHT);m.bitmap.close();const blobs=detectBalls(ctx.getImageData(0,0,WIDTH,HEIGHT).data,WIDTH,HEIGHT,config),prediction=tracker.kalman.project(m.timestamp),mapped=blobs.map(blob=>({blob,game:tracker.H?transform(tracker.H,blob.x/WIDTH,blob.y/HEIGHT):null}));let candidates=mapped;
 if(config.calibrationTarget&&tracker.H){const minimumRadius=Math.max(6,Math.sqrt(config.minArea/Math.PI));candidates=mapped.filter(({blob,game})=>blob.radius>=minimumRadius&&game&&Math.hypot(game.x-config.calibrationTarget.x,game.y-config.calibrationTarget.y)<=.065).sort((a,b)=>Math.hypot(a.game.x-config.calibrationTarget.x,a.game.y-config.calibrationTarget.y)-Math.hypot(b.game.x-config.calibrationTarget.x,b.game.y-config.calibrationTarget.y));}
 else if(tracker.field){candidates=mapped.filter(({blob,game})=>{const expected=game&&tracker.field.at(game.x,game.y);if(!expected)return false;const ratio=blob.radius/expected;return config.direction<0?ratio>=.72&&ratio<=4:ratio>=.2&&ratio<=1.28;});}
 let detection=candidates[0]?.blob;
 if(prediction){const [x,y,r]=prediction.state,sigma=Math.sqrt(Math.max(prediction.P[0][0],prediction.P[1][1])),gate=Math.max(20,Math.min(110,4*sigma));detection=candidates.map(c=>c.blob).filter(b=>Math.hypot(b.x-x,b.y-y)<=gate&&Math.abs(b.radius-r)<=Math.max(8,r*.65)).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0];}
 postMessage({type:'result',revision,frameId:m.frameId,timestamp:m.timestamp,clock:m.clock,detection:detection||null,blobs,...tracker.update(detection,m),processingMs:performance.now()-started});
 }catch(error){m.bitmap?.close();postMessage({type:'error',revision,message:error.message});}};
