import {rgbToHsv} from '../core.js';
import {median} from './math.js';
function morphology(mask,w,h,dilate){const out=new Uint8Array(mask.length);for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;let v=dilate?0:1;for(const n of [i,i-1,i+1,i-w,i+w])if(dilate?mask[n]:!mask[n]){v=dilate?1:0;break;}out[i]=v;}return out;}
function clean(mask,w,h){return morphology(morphology(morphology(morphology(mask,w,h,false),w,h,true),w,h,true),w,h,false);}
export function detectBalls(data,w,h,c){const hues=Array.isArray(c.hueSamples)&&c.hueSamples.length?c.hueSamples:[c.hue],saturationGain=Math.max(1,Number(c.saturationGain)||1);let mask=new Uint8Array(w*h);for(let i=0;i<mask.length;i++){const [hue,s,v]=rgbToHsv(data[i*4],data[i*4+1],data[i*4+2]),filteredS=Math.min(1,s*saturationGain),matches=hues.some(sample=>{const d=Math.abs(hue-sample);return Math.min(d,360-d)<=c.hueTolerance;});mask[i]=matches&&filteredS>=c.minSaturation&&v>=c.minValue?1:0;}if(c.cleanup)mask=clean(mask,w,h);
 const queue=new Int32Array(w*h),blobs=[];
 for(let seed=0;seed<mask.length;seed++){if(mask[seed]!==1)continue;let head=0,tail=1,sx=0,sy=0,x0=w,y0=h,x1=0,y1=0,perimeter=0;const boundary=[];queue[0]=seed;mask[seed]=2;
  while(head<tail){const i=queue[head++],x=i%w,y=Math.floor(i/w);sx+=x;sy+=y;x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);let edge=false;for(const n of [x>0?i-1:-1,x<w-1?i+1:-1,y>0?i-w:-1,y<h-1?i+w:-1]){if(n<0||mask[n]===0){edge=true;perimeter++;}else if(mask[n]===1){mask[n]=2;queue[tail++]=n;}}if(edge)boundary.push({x,y});}
  if(tail<c.minArea||tail>c.maxArea||x0<=1||y0<=1||x1>=w-2||y1>=h-2)continue;
  const x=sx/tail,y=sy/tail,bw=x1-x0+1,bh=y1-y0+1,aspect=Math.min(bw,bh)/Math.max(bw,bh),areaRadius=Math.sqrt(tail/Math.PI),radii=boundary.map(p=>Math.hypot(p.x-x,p.y-y)),radius=median(radii)+.5,spread=median(radii.map(r=>Math.abs(r-(radius-.5))))/radius;
  // Grid-edge perimeter is corrected by pi/4 for approximately isotropic boundaries.
  const circularity=Math.min(1,4*Math.PI*tail/((perimeter*Math.PI/4)**2)),consistency=Math.min(radius,areaRadius)/Math.max(radius,areaRadius),confidence=aspect*circularity*consistency*Math.max(0,1-spread*4);
  const minAspect=c.calibrationAssist?Math.min(c.minAspect,.58):c.minAspect,minCircularity=c.calibrationAssist?Math.min(c.minCircularity,.4):c.minCircularity,maxSpread=c.calibrationAssist?Math.max(c.maxRadialSpread,.22):c.maxRadialSpread,minConsistency=c.calibrationAssist?.6:.75;
  if(aspect<minAspect||circularity<minCircularity||spread>maxSpread||consistency<minConsistency)continue;
  blobs.push({x,y,radius,diameter:radius*2,area:tail,areaRadius,confidence,circularity,radialSpread:spread,box:{x:x0,y:y0,w:bw,h:bh},contour:boundary.filter((_,i)=>i%Math.max(1,Math.floor(boundary.length/80))===0)});
 }return blobs.sort((a,b)=>b.confidence-a.confidence).slice(0,12);
}
