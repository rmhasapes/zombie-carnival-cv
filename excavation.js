// Reusable 2.5D ground-breakthrough presentation.  Graphics are deliberately
// procedural: the supplied board is a lighting/shape reference, not a clean atlas.
export const EMERGENCE={
 duration:3.9,
 stages:[.16,.17,.18,.22,.18,.09],
 dirtIntensity:1,
 particleDensity:1,
 dustOpacity:.62,
 crackIntensity:1,
 variation:1,
 quality:'high'
};
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
const lerp=(a,b,t)=>a+(b-a)*t;
export function emergenceStage(progress,config=EMERGENCE){
 const total=config.stages.reduce((a,b)=>a+b,0);let at=0,p=clamp(progress)*total;
 for(let i=0;i<config.stages.length;i++){const next=at+config.stages[i];if(p<=next||i===config.stages.length-1)return {index:i,local:clamp((p-at)/config.stages[i]),progress:clamp(progress)};at=next;}
}
export function emergencePose(progress,variant=0,config=EMERGENCE){
 const s=emergenceStage(progress,config),t=s.progress,w=Math.sin((variant+1)*12.9898)*.5+.5;
 const headEmerges=clamp((t-.27)/.20),hands=clamp((t-.48)/.15),upper=clamp((t-.43)/.24),climb=clamp((t-.66)/.18),recover=clamp((t-.84)/.16);
 const brace=smooth(upper)*(1-smooth(recover)),pull=smooth(climb),settle=smooth(recover);
 return {stage:s.index,stageLocal:s.local,progress:t,
  // The skull breaks the surface first; hands and shoulders follow to pull free.
  lift:lerp(0,1,smooth((t-.30)/.64)), visible:Math.max(headEmerges,hands,upper),
  torso:lerp(31,-7,upper)+Math.sin(t*15+w*5)*7*(1-pull)+settle*5,
  head:lerp(-27,5,upper)+Math.sin(t*11+w*4)*5*(1-settle),
  leftArm:lerp(118,24,Math.max(hands,pull))+Math.sin(t*21+w)*14*(1-pull),
  rightArm:lerp(-103,-22,Math.max(hands*.84,pull))+Math.sin(t*18+w*3)*11*(1-pull),
  leftElbow:lerp(83,-35,brace+pull-brace*pull)-Math.sin(t*19)*20*(1-pull),
  rightElbow:lerp(-78,31,brace+pull-brace*pull)+Math.sin(t*17)*18*(1-pull),
  leftThigh:lerp(48,4,pull),rightThigh:lerp(-45,-4,clamp((t-.72)/.2)),
  leftKnee:lerp(-72,-5,pull),rightKnee:lerp(66,5,clamp((t-.74)/.18)),
  offset:lerp(1.02,0,smooth((t-.27)/.67)), digging:t<.9, headEmerges,handLeft:hands,handRight:clamp((t-.53)/.14), upper, climb, settle,
  sway:(w-.5)*8+Math.sin(t*10+w*3)*4*(1-settle)
 };
}
function ellipse(g,x,y,w,h,color,alpha=1){g.fillStyle(color,alpha).fillEllipse(x,y,w,h);}
export class ExcavationRig{
 constructor(scene,plan,height,id,config=EMERGENCE){
  this.scene=scene;this.plan=plan;this.height=height;this.config=config;this.seed=id*73.31;this.groundY=plan.kind==='ground'?plan.footY:plan.clipY;
  const d=plan.footY,frontDepth=(plan.cover>=0?100.5:101)+d;this.back=scene.add.graphics().setDepth(99+d);this.front=scene.add.graphics().setDepth(frontDepth);this.particles=scene.add.graphics().setDepth((plan.cover>=0?100.7:103)+d);this.items=[];this.lastStage=-1;this.lastProgress=0;
 }
 rand(n){const v=Math.sin(this.seed+n*91.17)*43758.5453;return v-Math.floor(v);}
 emit(kind,count,progress,side=0){
  const H=this.height, density=this.config.particleDensity*this.config.dirtIntensity;
  for(let i=0;i<Math.ceil(count*density);i++){const r=this.rand(i+progress*1000+this.items.length),a=(r-.5)*2.1+side*.45,clump=kind==='clump';this.items.push({
   kind,x:(r-.5)*H*.36,y:-H*.02-r*H*.035,vx:Math.sin(a)*H*(clump?.30:.16)*(1+r),vy:-H*(clump?.25:.10)*(1-r*.45),
   gravity:H*(clump?1.45:.34),size:H*(clump?(.018+r*.026):(.035+r*.045)),rot:r*6.28,spin:(r-.5)*9,life:clump?.85:1.1,age:0
  });}
 }
 updateParticles(dt,progress){
  const stage=emergenceStage(progress,this.config).index;
  if(stage!==this.lastStage){if(stage===0)this.emit('dust',4,progress);if(stage===1){this.emit('clump',10,progress);this.emit('dust',12,progress);}if(stage===2){this.emit('clump',5,progress,-1);this.emit('dust',5,progress);}if(stage===3){this.emit('clump',7,progress);this.emit('dust',8,progress);}if(stage===4){this.emit('clump',6,progress,1);this.emit('dust',6,progress);}this.lastStage=stage;}
  for(const p of this.items){p.age+=dt;p.vy+=p.gravity*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=p.spin*dt;if(p.y>0){p.y=0;p.vx*=.38;p.vy*=-.18;p.spin*=.5;}}
  this.items=this.items.filter(p=>p.age<p.life);this.particles.clear();
  for(const p of this.items){const a=1-p.age/p.life;if(p.kind==='dust'){ellipse(this.particles,this.plan.x+p.x,this.groundY+p.y,p.size*(1+p.age*1.8),p.size*.32*(1+p.age),0xb88257,a*this.config.dustOpacity);}else{this.particles.fillStyle(0x6d432e,a).fillCircle(this.plan.x+p.x,this.groundY+p.y,p.size);this.particles.lineStyle(1,0xc39262,a*.55).strokeCircle(this.plan.x+p.x,this.groundY+p.y,p.size*.8);}}
 }
 draw(progress,dt){
  const H=this.height,c=this.config,stage=emergenceStage(progress,c),open=smooth((progress-.13)/.40),wide=H*(.26+.25*open),high=H*(.045+.045*open),x=this.plan.x,y=this.groundY;
  this.back.clear();this.front.clear();
  // Back-to-front compositing: dark interior and cracks behind the rig, then rear rim.
  ellipse(this.back,x,y+H*.008,wide*2.05,high*2.2,0x201b1a,.72*open);
  ellipse(this.back,x,y-H*.005,wide*1.55,high*1.16,0x40261e,.72*open);
  const cracks=(c.quality==='low'?5:9);for(let i=0;i<cracks;i++){const a=i/cracks*Math.PI*2+this.seed,reach=wide*(.75+this.rand(i)*.85)*c.crackIntensity;this.back.lineStyle(Math.max(1,H*.007),0x4a3027,.55*open).lineBetween(x+Math.cos(a)*wide*.22,y+Math.sin(a)*high*.16,x+Math.cos(a)*reach,y+Math.sin(a)*high*.55);}
  for(let i=0;i<6;i++){const a=Math.PI+.17+i*.46,rx=Math.cos(a)*wide*(.5+this.rand(i)*.65),ry=Math.sin(a)*high*(.4+this.rand(i)*.5);ellipse(this.back,x+rx,y+ry,H*(.055+this.rand(i)*.05),H*.025, i%2?0x825038:0xa56a43,.86*open);}
  // Foreground rim obscures hips/legs until they physically clear the excavation.
  const cover=(1-smooth((progress-.68)/.23));ellipse(this.front,x,y+high*.35,wide*2.18,high*(1.05+.35*cover),0x633d2b,.90*open);ellipse(this.front,x,y+high*.12,wide*1.92,high*.75,0x9b603d,.88*open);
  for(let i=0;i<9;i++){const a=.15+i*.34,rx=Math.cos(a)*wide*(.35+this.rand(i+20)*.7),ry=Math.sin(a)*high*(.45+this.rand(i+30)*.55);ellipse(this.front,x+rx,y+ry,H*(.035+this.rand(i+40)*.035),H*.019,i%2?0xbc8252:0x75442f,.92*open);}
  this.updateParticles(dt,progress);
 }
 setVisible(v){this.back.setVisible(v);this.front.setVisible(v);this.particles.setVisible(v);}
 destroy(){this.back.destroy();this.front.destroy();this.particles.destroy();this.items=[];}
}
