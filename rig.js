const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function rigPose(local,entry,variant=0){
 const q=Math.max(0,Math.min(1,local/entry)),lift=smooth((q-.3)/.7),dig=(1-smooth((q-.35)/.3))*Math.sin(q*Math.PI*7);
 const breathing=Math.sin(local*2.3+variant)*1.3;
 return {lift,torso:lerp(18,-3,lift)+breathing,head:lerp(-16,4,lift)-breathing*.6,
  leftArm:lerp(98,26,lift)+dig*24+Math.sin(local*2.1)*5*lift,
  rightArm:lerp(-98,-22,lift)+dig*24+Math.sin(local*1.8+1)*6*lift,
  leftElbow:lerp(70,-38,lift)-dig*29,rightElbow:lerp(-70,32,lift)-dig*29,
  leftThigh:lerp(32,4,lift),rightThigh:lerp(-38,-4,lift),leftKnee:lerp(-52,-5,lift),rightKnee:lerp(58,5,lift),
  offset:lerp(1.06,.60,smooth(q/.3))*(1-lift),digging:q>.05&&q<.65};
}
export class ZombieRig{
 constructor(scene,variant,height){
  this.scene=scene;this.height=height;this.variant=variant;const H=height;
  this.root=scene.add.container(0,0);this.hips=scene.add.container(0,-H*.42);this.root.add(this.hips);
  const part=(parent,name,x,y,w,h,ox=.5,oy=0)=>{const image=scene.add.image(x,y,'rig-'+variant,name).setOrigin(ox,oy).setDisplaySize(w,h);parent.add(image);return image;};
  const bone=(parent,x,y)=>{const b=scene.add.container(x,y);parent.add(b);return b;};
  this.leftLeg=bone(this.hips,-H*.10,0);this.rightLeg=bone(this.hips,H*.10,0);
  for(const [leg,side] of [[this.leftLeg,'left'],[this.rightLeg,'right']]){part(leg,'5',0,0,H*.17,H*.22);const knee=bone(leg,0,H*.20);part(knee,'6',0,0,H*.18,H*.24);this[side+'Knee']=knee;}
  this.pelvis=part(this.hips,'2',0,0,H*.34,H*.15,.5,.5);
  this.torso=bone(this.hips,0,-H*.035);part(this.torso,'1',0,0,H*.40,H*.34,.5,1);
  this.head=bone(this.torso,0,-H*.24);part(this.head,'0',0,0,H*.30,H*.26,.5,1);
  this.leftArm=bone(this.torso,-H*.15,-H*.26);this.rightArm=bone(this.torso,H*.15,-H*.26);
  for(const [arm,side] of [[this.leftArm,'left'],[this.rightArm,'right']]){part(arm,'3',0,0,H*.13,H*.23,.5,.08);const elbow=bone(arm,0,H*.18);part(elbow,'4',0,0,H*.14,H*.255,.5,.07);this[side+'Elbow']=elbow;if(side==='right'){arm.list[0].setFlipX(true);elbow.list[0].setFlipX(true);}}
  this.hips.bringToTop(this.pelvis);
 }
 apply(pose){
  this.torso.angle=pose.torso;this.head.angle=pose.head;this.leftArm.angle=pose.leftArm;this.rightArm.angle=pose.rightArm;
  this.leftElbow.angle=pose.leftElbow;this.rightElbow.angle=pose.rightElbow;this.leftLeg.angle=pose.leftThigh;this.rightLeg.angle=pose.rightThigh;
  this.leftKnee.angle=pose.leftKnee;this.rightKnee.angle=pose.rightKnee;
 }
 setEmergence(pose){
  // Keep the joint container live so the nested head can break ground before torso art.
  const upper=pose.upper||0,legs=pose.climb||0;
  this.hips.setAlpha(1);this.torso.list[0].setAlpha(upper);this.head.setAlpha(pose.headEmerges||upper);
  this.leftArm.setAlpha(Math.max(pose.handLeft||0,upper));this.rightArm.setAlpha(Math.max(pose.handRight||0,upper));
  this.pelvis.setAlpha(Math.max(0,(upper-.35)/.65));this.leftLeg.setAlpha(legs);this.rightLeg.setAlpha(Math.max(0,(legs-.18)/.82));
 }
 resetEmergence(){for(const part of [this.hips,this.torso,this.head,this.pelvis,this.leftArm,this.rightArm,this.leftLeg,this.rightLeg])part.setAlpha(1);this.torso.list[0].setAlpha(1);}
 destroy(){this.root.destroy(true);}
}
