// Presentation scheduler only; Round and camera math remain untouched.
import {EMERGENCE} from './excavation.js';
export const DIFFICULTIES={
 easy:{label:'Easy',count:3,window:3.0,gap:.9,size:1.08,entry:2.25},
 normal:{label:'Normal',count:2,window:1.8,gap:.85,size:1,entry:1.95},
 quick:{label:'Hard',count:2,window:.95,gap:.7,size:.95,entry:1.65}
};
export const SITES=[
 {x:300,footY:420,height:235,cover:0,coverHeight:92,kind:'peek'},
 {x:900,footY:429,height:242,cover:1,coverHeight:94,kind:'peek'},
 {x:480,footY:523,height:280,cover:2,coverHeight:112,kind:'peek'},
 {x:1020,footY:535,height:285,cover:3,coverHeight:116,kind:'peek'},
 {x:260,footY:640,height:330,cover:4,coverHeight:133,kind:'peek'},
 {x:800,footY:638,height:330,cover:5,coverHeight:127,kind:'peek'},
 {x:630,footY:427,height:240,cover:-1,coverHeight:0,kind:'ground'},
 {x:750,footY:535,height:280,cover:-1,coverHeight:0,kind:'ground'},
 {x:1100,footY:639,height:330,cover:-1,coverHeight:0,kind:'ground'}
];
export function targetPlan(slot,cycle=0,pace='normal'){
 const config=DIFFICULTIES[pace]||DIFFICULTIES.normal;
 // Distinct sites for simultaneous slots; each cycle visits a new location.
 const order=[6,0,7,3,8,5,1,2,4],siteIndex=order[(slot*3+cycle*2)%SITES.length],site=SITES[siteIndex];
 return {...site,siteIndex,slot,cycle,height:Math.max(220,Math.round(site.height*config.size)),variant:(slot+cycle)%6,
  entry:EMERGENCE.duration,window:config.window,retreat:.35,delay:cycle===0?slot*.7+.25:config.gap+(slot%2)*.28,
  lifetime:EMERGENCE.duration+config.window+.35,clipY:site.cover>=0?site.footY+14-site.coverHeight:site.footY};
}
export function presentation(plan,age){
 const local=age-plan.delay,hitStart=plan.entry,hitEnd=hitStart+plan.window;
 const enter=Math.max(0,Math.min(1,local/plan.entry)),retreat=Math.max(0,Math.min(1,(local-hitEnd)/plan.retreat));
 const open=Math.sin(enter*Math.PI/2)*(1-retreat*retreat*(3-2*retreat)),hittable=local>=0&&local<hitEnd;
 const frame=0;
 return {visible:local>=0&&local<plan.lifetime,hittable,done:local>=plan.lifetime,x:plan.x,
  y:plan.footY+plan.height*(1-open),height:plan.height,alpha:local<0?0:1,frame,
  local,remaining:Math.max(0,hitEnd-local),open};
}
export function visibleHitbox(bounds,clipY){
 const top=Math.max(90,bounds.y),bottom=Math.min(bounds.y+bounds.h,clipY);
 return bottom>top?{x:bounds.x+bounds.w/2,y:top,w:bounds.w*.82,h:bottom-top}:null;
}
export function headHitbox(body){
 if(!body)return null;
 return {x:body.x,y:body.y,w:body.w*.56,h:Math.min(body.h,Math.max(20,body.h*.28))};
}
