import {homography,transform,CALIBRATION_POINTS} from '../core.js';
import {median} from './math.js';
export const WIDTH=640,HEIGHT=360;
export const GRID=[.1,.5,.9].flatMap(y=>[.1,.5,.9].map(x=>({x,y})));
export const CHECK_POINTS=[{x:.3,y:.3},{x:.7,y:.3},{x:.7,y:.7},{x:.3,y:.7},{x:.5,y:.5}];
export class RadiusField{
 constructor(samples){if(samples.length!==9||samples.some((s,i)=>!Number.isFinite(s.radius)||s.radius<=0||Math.hypot(s.x-GRID[i].x,s.y-GRID[i].y)>.001))throw Error('Nine ordered radius samples required');this.samples=samples;}
 at(x,y){if(!Number.isFinite(x)||!Number.isFinite(y)||x<.1||x>.9||y<.1||y>.9)return null;const u=(x-.1)/.4,v=(y-.1)/.4,i=Math.min(1,Math.floor(u)),j=Math.min(1,Math.floor(v)),a=u-i,b=v-j;return [this.samples[j*3+i].radius,this.samples[j*3+i+1].radius,this.samples[(j+1)*3+i].radius,this.samples[(j+1)*3+i+1].radius].reduce((s,r,k)=>s+r*[(1-a)*(1-b),a*(1-b),(1-a)*b,a*b][k],0);}
 sigmaAt(x,y){const r=this.at(x,y);if(!r)return null;return Math.max(.5,...this.samples.map(s=>s.sigmaRadius||0));}
}
export class Calibration{
 constructor(){this.clear();}
 clear(){this.H=null;this.samples=[];this.checks=[];this.field=null;this.signature=null;}
 setCorners(points,signature){this.clear();this.H=homography(points,CALIBRATION_POINTS);this.signature=signature;}
 map(x,y){return this.H?transform(this.H,x/WIDTH,y/HEIGHT):null;}
 addCheck(cameraX,cameraY){if(!this.H||this.checks.length>=CHECK_POINTS.length)throw Error('Map corners before validation');const target=CHECK_POINTS[this.checks.length],g=this.map(cameraX,cameraY);if(!g||!Number.isFinite(g.x+g.y))throw Error('Invalid validation point');const errorPx=Math.hypot((g.x-target.x)*1280,(g.y-target.y)*720);this.checks.push({target,cameraX,cameraY,game:g,errorPx});return errorPx;}
 get validated(){return this.checks.length===5&&Math.max(...this.checks.map(c=>c.errorPx))<=20;}
 addRadius(detections,{minConfidence=.5}={}){if(!this.validated)throw Error('Pass independent interior validation first');const target=GRID[this.samples.length];if(!target||detections.length<20)throw Error('Twenty stationary detections required');const radius=median(detections.map(d=>d.radius)),x=median(detections.map(d=>d.x)),y=median(detections.map(d=>d.y)),g=this.map(x,y);if(!g||Math.hypot(g.x-target.x,g.y-target.y)>.05)throw Error('Ball is not at the projected mark');if(detections.some(d=>d.confidence<minConfidence||Math.hypot(d.x-x,d.y-y)>4||Math.abs(d.radius-radius)>radius*.1))throw Error('Hold the ball still with its full outline visible');const sigmaRadius=1.4826*median(detections.map(d=>Math.abs(d.radius-radius)));this.samples.push({...target,cameraX:x,cameraY:y,radius,diameter:radius*2,sigmaRadius});if(this.samples.length===9)this.field=new RadiusField(this.samples);return this.samples.at(-1);}
 get ready(){return this.validated&&!!this.field;}
 invalidateRadius(){this.samples=[];this.field=null;}
 restore(data){if(!data||!Array.isArray(data.H)||data.H.length!==9||data.H.some(v=>!Number.isFinite(v))||!Array.isArray(data.samples)||!Array.isArray(data.checks)||data.checks.length!==5)throw Error('Saved calibration is incomplete.');const checks=data.checks.map(c=>{if(!c?.target||!Number.isFinite(c.cameraX+c.cameraY+c.errorPx))throw Error('Saved calibration checks are invalid.');return {target:{x:c.target.x,y:c.target.y},cameraX:c.cameraX,cameraY:c.cameraY,game:c.game,errorPx:c.errorPx};});if(Math.max(...checks.map(c=>c.errorPx))>20)throw Error('Saved calibration did not pass interior validation.');const samples=data.samples.map(s=>({...s}));this.H=[...data.H];this.checks=checks;this.samples=samples;this.field=new RadiusField(samples);this.signature=data.signature||null;return this;}
 export(){return {H:this.H,samples:this.samples,checks:this.checks,signature:this.signature,analysis:{width:WIDTH,height:HEIGHT},validated:this.validated};}
}
