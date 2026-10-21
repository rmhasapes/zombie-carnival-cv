export const GAME_W=1280,GAME_H=720;
export const CALIBRATION_POINTS=[[.08,.13],[.92,.13],[.92,.86],[.08,.86]];
export function solveLinear(matrix,vector){
 const a=matrix.map((r,i)=>[...r,vector[i]]),n=vector.length;
 for(let i=0;i<n;i++){let pivot=i;for(let j=i+1;j<n;j++)if(Math.abs(a[j][i])>Math.abs(a[pivot][i]))pivot=j;
  if(Math.abs(a[pivot][i])<1e-9)throw new Error('Calibration points are too close or collinear.');
  [a[i],a[pivot]]=[a[pivot],a[i]];const scale=a[i][i];for(let k=i;k<=n;k++)a[i][k]/=scale;
  for(let j=0;j<n;j++){if(j===i)continue;const f=a[j][i];for(let k=i;k<=n;k++)a[j][k]-=f*a[i][k];}}
 return a.map(r=>r[n]);
}
export function homography(source,destination=CALIBRATION_POINTS){
 if(source.length!==4)throw new Error('Four camera points are required.');
 const signs=source.map((p,i)=>{const q=source[(i+1)%4],r=source[(i+2)%4];return(q[0]-p[0])*(r[1]-q[1])-(q[1]-p[1])*(r[0]-q[0]);});
 if(signs.some(s=>s<0)&&signs.some(s=>s>0))throw new Error('Click the marks in order: top-left, top-right, bottom-right, bottom-left.');
 const area=Math.abs(source.reduce((s,p,i)=>{const q=source[(i+1)%4];return s+p[0]*q[1]-q[0]*p[1];},0))/2;
 if(area<.025)throw new Error('The calibration marks cover too little camera area.');
 const a=[],b=[];source.forEach(([x,y],i)=>{const[u,v]=destination[i];a.push([x,y,1,0,0,0,-u*x,-u*y],[0,0,0,x,y,1,-v*x,-v*y]);b.push(u,v);});return [...solveLinear(a,b),1];
}
export function transform(h,x,y){const z=h[6]*x+h[7]*y+h[8];if(Math.abs(z)<1e-8)return null;return{x:(h[0]*x+h[1]*y+h[2])/z,y:(h[3]*x+h[4]*y+h[5])/z};}
export function rgbToHsv(r,g,b){r/=255;g/=255;b/=255;const hi=Math.max(r,g,b),lo=Math.min(r,g,b),d=hi-lo;let h=0;if(d)h=hi===r?((g-b)/d)%6:hi===g?(b-r)/d+2:(r-g)/d+4;return[((h*60+360)%360),hi?d/hi:0,hi];}
export class ContactEstimator{
 constructor(){this.history=[];this.lastContact=-Infinity;this.armed=true;}
 clear(){this.history=[];this.armed=true;this.lastContact=-Infinity;}
 update(point,now){
  if(!point){if(this.history.length&&now-this.history.at(-1).t>250){this.history=[];this.armed=true;}return null;}
  if(this.history.length&&now-this.history.at(-1).t>200)this.history=[];
  const previous=this.history.at(-1);if(previous&&Math.hypot(point.x-previous.x,point.y-previous.y)>.2){this.history=[];this.armed=true;}
  this.history.push({...point,t:now});if(this.history.length>8)this.history.shift();
  if(!this.armed||this.history.length<5||now-this.lastContact<1000)return null;
  const n=this.history.length;let peak=0;for(let k=1;k<n;k++)if(this.history[k].size>this.history[peak].size)peak=k;
  if(peak<2||peak>n-3)return null;const a=this.history[peak-2],b=this.history[peak],c=this.history[peak+2];
  const incoming={x:b.x-a.x,y:b.y-a.y},outgoing={x:c.x-b.x,y:c.y-b.y};
  const i=Math.hypot(incoming.x,incoming.y),o=Math.hypot(outgoing.x,outgoing.y);
  if(i<.008||o<.008)return null;
  const cosine=(incoming.x*outgoing.x+incoming.y*outgoing.y)/(i*o);
  const grow=b.size>a.size*1.07,shrink=c.size<b.size*.96;
  if(cosine<-.25&&grow&&shrink&&b.x>=0&&b.x<=1&&b.y>=0&&b.y<=1){this.lastContact=now;this.armed=false;return{x:b.x,y:b.y,t:b.t,reason:'direction reversal and apparent-size peak'};}
  return null;
 }
}
export class Round{
 constructor(){this.id=0;this.reset();}
 reset(){this.status='ready';this.score=0;this.throwLimit=3;this.throws=3;this.hits=0;this.duration=60;this.remaining=60;this.elapsed=0;this.seen=new Set();}
 start(duration=60,throws=3){if(throws!==null&&(!Number.isInteger(throws)||throws<1||throws>20))throw new Error('Throws must be null or a whole number from 1 to 20.');this.reset();this.throwLimit=throws;this.throws=throws;this.id++;this.duration=duration;this.remaining=duration;this.status='playing';}
 tick(dt){if(this.status==='playing'){this.elapsed+=dt;this.remaining=Math.max(0,this.duration-this.elapsed);if(this.remaining===0)this.status='complete';}}
 submit(eventId,hit,points=hit?100:0,hitCount=hit?1:0){if(this.status!=='playing'||(this.throwLimit!==null&&this.throws<=0)||this.seen.has(eventId))return false;this.seen.add(eventId);if(this.throwLimit!==null)this.throws--;if(hit){this.score+=points;this.hits+=hitCount;}if(this.throwLimit!==null&&this.throws===0)this.status='complete';return true;}
 togglePause(){if(this.status==='playing')this.status='paused';else if(this.status==='paused')this.status='playing';}
}
