import {ZombieRig,rigPose} from './rig.js';
import {targetPlan,presentation,DIFFICULTIES,SITES,visibleHitbox,headHitbox} from './perspective.js';
import {Round,GAME_W,GAME_H,CALIBRATION_POINTS} from './core.js';
import {ExcavationRig,EMERGENCE,emergencePose} from './excavation.js';
export const SCARE_DURATION=5,SCARE_POINTS=50,BONUS_POINTS=1000,BONUS_SPEED_SCALE=.75;
export function bonusSpeed(sequence){return (410+(sequence%3)*45)*BONUS_SPEED_SCALE;}
export class CarnivalGame {
 constructor({onChange,onThrow,onReady}){
  this.round=new Round();this.resolvedHits=new Set();this.targets=[];this.bonusTargets=[];this.pace='normal';this.mode='manual';this.onChange=onChange;this.onThrow=onThrow;this.onReady=onReady;this.calibrating=false;this.ready=false;this.sequence=0;this.completedNotified=false;this.soundEnabled=true;this.musicEnabled=true;this.scareEnabled=true;this.scareClock=0;this.nextScare=9;this.nextBonus=7;this.scareRemaining=0;
  const host=this;
  class Factory extends Phaser.Scene{
   preload(){this.load.image('factory','assets/carnival-muted.png');for(let i=0;i<6;i++)this.load.image('rig-'+i,'assets/rig-muted-'+i+'.png');this.load.image('props','assets/detailed-cover.png');this.load.json('rig-frames','assets/rig-frames.json');this.load.json('prop-frames','assets/prop-frames.json');this.load.on('loaderror',file=>{const message='Asset request failed: '+file.src+' (HTTP loading error). Check the terminal and use the launcher address.';console.error(message);document.querySelector('#loading-art').textContent=message;});}
   create(){
    host.scene=this;this.add.image(640,360,'factory').setDisplaySize(1280,720);

    host.frames=this.cache.json.get('rig-frames');host.frames.forEach(f=>this.textures.get(f.texture).add(f.name,0,f.x,f.y,f.width,f.height));
    this.cache.json.get('prop-frames').forEach(f=>this.textures.get('props').add(f.name,0,f.x,f.y,f.width,f.height));
    host.coverObjects=[];SITES.filter(p=>p.cover>=0).forEach(p=>{const prop=this.add.image(p.x,p.footY+14,'props',String(p.cover)).setOrigin(.5,1).setDepth(101+p.footY);prop.setDisplaySize(p.coverHeight*prop.width/prop.height,p.coverHeight);host.coverObjects.push({footY:p.footY,x:p.x-prop.displayWidth/2,y:p.footY+14-p.coverHeight,w:prop.displayWidth,h:p.coverHeight});});
    host.scareVeil=this.add.rectangle(640,360,1280,720,0x141029,.32).setDepth(2800).setVisible(false);
    host.scareRig=new ZombieRig(this,5,550);host.scareSprite=host.scareRig.root.setPosition(640,670).setDepth(2801).setVisible(false);
    this.add.rectangle(640,45,1280,90,0x081317,.8).setDepth(2000);
    this.title=this.add.text(32,26,'ZOMBIE CARNIVAL',{fontFamily:'Arial',fontSize:'26px',fontStyle:'bold',color:'#cce9b7',letterSpacing:2}).setDepth(2001);
    this.scoreText=this.add.text(1245,19,'000',{fontFamily:'Arial',fontSize:'40px',fontStyle:'bold',color:'#c6f09e'}).setOrigin(1,0).setDepth(2001);
    this.scoreLabel=this.add.text(1075,38,'SCORE',{fontSize:'14px',fontFamily:'Arial',color:'#9ab6a9'}).setOrigin(1,0).setDepth(2001);
    this.add.rectangle(640,697,1280,46,0x081317,.72).setDepth(2000);
    this.bottom=this.add.text(32,686,'29 PALMS · THREE THROWS. SIX ZOMBIES.',{fontFamily:'Arial',fontSize:'16px',color:'#ead8b8'}).setDepth(2001);
    this.timer=this.add.text(1245,680,'60s',{fontFamily:'Arial',fontSize:'26px',fontStyle:'bold',color:'#d3e2c6'}).setOrigin(1,0).setDepth(2001);
    this.overlay=this.add.container(640,225).setDepth(3000);
    this.overlayTitle=this.add.text(0,0,'ZOMBIE\nCARNIVAL',{align:'center',fontFamily:'Arial Black, Arial',fontSize:'74px',fontStyle:'bold',color:'#dcf6bc',stroke:'#101c18',strokeThickness:7,lineSpacing:-4,shadow:{offsetX:0,offsetY:5,color:'#000',blur:14,fill:true}}).setOrigin(.5,.5);
    this.overlayHint=this.add.text(0,118,'ZOMBIES 100–300 · RUNNER 1000\nJUMP SCARE +50 PER HIT FOR 5 SECONDS',{fontFamily:'Arial',fontSize:'21px',color:'#f0ecd5',stroke:'#101919',strokeThickness:4,align:'center',lineSpacing:7}).setOrigin(.5);
    this.overlay.add([this.overlayTitle,this.overlayHint]);
    this.calibration=this.add.container(0,0).setDepth(5000).setVisible(false);this.calibration.add(this.add.rectangle(640,360,1280,720,0x000000,.94));
    CALIBRATION_POINTS.forEach(([x,y],i)=>{const g=this.add.graphics();g.lineStyle(4,0xffffff).strokeCircle(x*1280,y*720,17).lineBetween(x*1280-35,y*720,x*1280+35,y*720).lineBetween(x*1280,y*720-35,x*1280,y*720+35);const t=this.add.text(x*1280+25,y*720+24,String(i+1),{fontSize:'32px',fontFamily:'Arial',fontStyle:'bold',color:'#d6f1b4'});this.calibration.add([g,t]);});
    this.input.on('pointerdown',p=>{if(host.mode==='manual'&&!host.calibrating)host.throwAt(p.x,p.y,'manual');});
    host.ready=true;host.resetTargets(true);host.onReady?.();host.notify();
   }
   update(time,delta){host.update(time,delta);}
  }
  this.phaser=new Phaser.Game({type:Phaser.CANVAS,width:GAME_W,height:GAME_H,parent:'game-root',backgroundColor:'#0c171b',antialias:true,scene:Factory,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},fps:{target:60},banner:false});
 }
 resetTargets(idle=false){
  if(!this.ready)return;this.targets.forEach(t=>this.destroyTarget(t));this.targets=[];this.bonusTargets.forEach(t=>this.destroyBonus(t));this.bonusTargets=[];
  for(let slot=0;slot<DIFFICULTIES[this.pace].count;slot++)this.spawn(slot,0,idle);
 }
 spawn(slot,cycle=0,idle=false){
  let plan=targetPlan(slot,cycle,this.pace);const occupied=new Set(this.targets.filter(t=>t.alive).map(t=>t.plan.siteIndex));for(let n=1;occupied.has(plan.siteIndex)&&n<6;n++){const variant=plan.variant;plan={...targetPlan(slot,cycle+n,this.pace),variant};}
  const rig=new ZombieRig(this.scene,plan.variant,plan.height),sprite=rig.root.setPosition(plan.x,plan.footY).setDepth(100+plan.footY);
  const shadow=this.scene.add.ellipse(plan.x,plan.footY+2,plan.height*.55,plan.height*.08,0x392c31,.5).setDepth(98+plan.footY);
  const excavation=new ExcavationRig(this.scene,plan,plan.height,this.sequence,EMERGENCE);
  const maskGraphics=this.scene.make.graphics({add:false});maskGraphics.fillStyle(0xffffff).fillRect(0,90,1280,plan.clipY-90);sprite.setMask(maskGraphics.createGeometryMask());
  const t={id:++this.sequence,slot,cycle,plan,rig,sprite,shadow,excavation,maskGraphics,age:idle?plan.delay+plan.entry+.2:0,height:plan.height,width:plan.height*.55,alive:true,rising:!idle};this.targets.push(t);this.presentTarget(t,0);if(!idle)this.effectSound('spawn');
 }
 destroyTarget(t){this.scene.tweens.killTweensOf(t.sprite);t.rig.destroy();t.shadow.destroy();t.excavation.destroy();t.maskGraphics.destroy();}
 destroyBonus(t){this.scene.tweens.killTweensOf(t.sprite);t.rig.destroy();t.shadow.destroy();}
 presentTarget(t,dt=0){
  const p=presentation(t.plan,t.age),emerging=p.local>=0&&p.local<t.plan.entry,pose=emerging?emergencePose(p.local/t.plan.entry,t.plan.variant,EMERGENCE):rigPose(p.local,t.plan.entry,t.plan.variant),H=t.plan.height;
  const retreat=p.local>t.plan.entry+t.plan.window?(1-p.open)*H:0;
  t.sprite.setPosition(p.x,t.plan.footY+pose.offset*H+retreat).setAlpha(p.alpha).setVisible(p.visible).setAngle(0);t.rig.apply(pose);if(emerging)t.rig.setEmergence(pose);else t.rig.resetEmergence();
  t.hitbox=visibleHitbox({x:p.x-H*.27,y:t.sprite.y-H*.99,w:H*.54,h:H},t.plan.clipY);t.headbox=headHitbox(t.hitbox);t.rising=!p.visible;t.pose=p;
  t.shadow.setPosition(p.x,t.plan.footY+2).setAlpha(p.visible?.5:0).setVisible(p.visible);t.excavation.setVisible(p.visible);if(p.visible)t.excavation.draw(Math.max(0,Math.min(1,p.local/t.plan.entry)),dt);
  return p;
 }
 spawnBonus(){
  const n=this.sequence++,fromLeft=n%2===0,H=235+(n%3)*24,y=438+(n%3)*62,rig=new ZombieRig(this.scene,n%6,H),sprite=rig.root.setDepth(150+y),shadow=this.scene.add.ellipse(0,y+2,H*.48,H*.07,0x392c31,.48).setDepth(148+y),x=fromLeft?-H:1280+H;
  const t={id:n,bonus:true,points:BONUS_POINTS,plan:{footY:y,cover:-1},rig,sprite,shadow,x,y,height:H,width:H*.52,direction:fromLeft?1:-1,speed:bonusSpeed(n),alive:true};this.bonusTargets.push(t);this.presentBonus(t,0);return t;
 }
 presentBonus(t,dt){
  t.x+=t.direction*t.speed*dt;const stride=Math.sin(t.x/t.height*2.6),pose=rigPose(99,1,t.id%6);pose.leftThigh+=stride*18;pose.rightThigh-=stride*18;pose.leftKnee-=stride*22;pose.rightKnee+=stride*22;pose.torso+=stride*4;pose.leftArm-=stride*9;pose.rightArm+=stride*9;
  t.sprite.setPosition(t.x,t.y).setVisible(true);t.rig.apply(pose);t.shadow.setPosition(t.x,t.y+2).setVisible(true);t.hitbox={x:t.x,y:t.y-t.height*.99,w:t.width*.82,h:t.height*.95};t.headbox=headHitbox(t.hitbox);
 }
 setDifficulty(pace){if(!DIFFICULTIES[pace])return;this.pace=pace;if(this.ready)this.resetTargets(this.round.status!=='playing');this.notify();}
 triggerScare(){
  if(!this.scareEnabled||this.calibrating||this.round.status!=='playing')return false;
  this.scareRemaining=SCARE_DURATION;this.scareTarget={id:++this.sequence,scare:true,repeatable:true,points:SCARE_POINTS,alive:true,plan:{footY:10000,cover:-1},hitbox:{x:640,y:45,w:1080,h:675}};this.scareSprite.setScale(.85).setAlpha(1).setVisible(true);this.scareVeil.setVisible(true);this.targets.forEach(t=>{t.sprite.setVisible(false);t.shadow.setVisible(false);t.excavation.setVisible(false);});this.bonusTargets.forEach(t=>{t.sprite.setVisible(false);t.shadow.setVisible(false);});this.effectSound('scare');return true;
 }
 hideScare(){this.scareRemaining=0;this.scareSprite?.setVisible(false);this.scareVeil?.setVisible(false);}
 start(duration=60,pace='normal',throws=3){
  if(!this.ready)return;this.calibrating=false;this.scene.calibration.setVisible(false);this.pace=pace;this.hideScare();this.scareClock=0;this.nextScare=9;this.nextBonus=5+Math.random()*4;this.round.start(duration,throws);this.resolvedHits.clear();this.completedNotified=false;this.scene.tweens.resumeAll();this.ensureMusic();this.resetTargets();this.scene.overlay.setVisible(false);this.effectSound('start');this.notify();
 }
 reset(){this.hideScare();this.scareTarget=null;this.round.reset();this.resolvedHits.clear();this.completedNotified=false;this.scene?.tweens.resumeAll();if(this.ready){this.resetTargets(true);this.scene.overlay.setVisible(true);this.scene.overlayTitle.setText('ZOMBIE\nCARNIVAL').setFontSize(74);this.scene.overlayHint.setText('ZOMBIES 100–300 · RUNNER 1000\nJUMP SCARE +50 PER HIT FOR 5 SECONDS');}this.notify();}
 pause(){this.round.togglePause();if(this.round.status==='paused')this.scene.tweens.pauseAll();else this.scene.tweens.resumeAll();if(this.round.status==='paused'){this.scene.overlayTitle.setText('PAUSED').setFontSize(65);this.scene.overlayHint.setText('THE ATTENDANT WILL RESUME YOUR ROUND.');this.scene.overlay.setVisible(true);}else if(this.round.status==='playing')this.scene.overlay.setVisible(false);this.notify();}
 notify(){this.onChange?.(this.round);}
 getTargets(){if(this.scareRemaining>0&&this.scareTarget?.alive)return [{id:this.scareTarget.id,...this.scareTarget.hitbox,head:null,target:this.scareTarget}];const ground=this.targets.filter(t=>t.alive&&!t.rising&&t.sprite.visible&&t.hitbox),bonus=this.bonusTargets.filter(t=>t.alive&&t.sprite.visible&&t.hitbox);return [...ground,...bonus].sort((a,b)=>b.plan.footY-a.plan.footY).map(t=>({id:t.id,...t.hitbox,head:t.headbox,target:t}));}
 findTargets(x,y){return this.getTargets().filter(t=>x>=t.x-t.w/2&&x<=t.x+t.w/2&&y>=t.y&&y<=t.y+t.h&&!this.coverObjects.some(c=>c.footY>=t.target.plan.footY&&x>=c.x&&x<=c.x+c.w&&y>=c.y&&y<=c.y+c.h));}
 findTarget(x,y){return this.findTargets(x,y)[0];}
 throwAt(x,y,source='manual',eventId=null){
  if(this.calibrating)return false;const hits=this.findTargets(x,y).map(t=>{const headshot=!!t.head&&x>=t.head.x-t.head.w/2&&x<=t.head.x+t.head.w/2&&y>=t.head.y&&y<=t.head.y+t.head.h;return {target:t.target,targetId:t.id,headshot,points:t.target.scare?SCARE_POINTS:t.target.bonus?BONUS_POINTS:undefined};});
  return this.submitThrow(x,y,source,eventId,hits);
 }
 // Accept a collision already resolved by a timestamped external input adapter.
 throwResolved(x,y,source,eventId,result){
  if(this.calibrating||result?.roundId!==this.round.id||typeof result.hit!=='boolean'||![x,y,result.timestamp].every(Number.isFinite))return false;
  const resolved=result.targets??(result.hit?[{id:result.targetId,headshot:result.headshot}]:[]),hits=resolved.filter(r=>Number.isInteger(r.id)&&(!this.resolvedHits.has(r.id)||this.scareTarget?.id===r.id)).map(r=>{const target=[...this.targets,...(this.bonusTargets||[]),...(this.scareTarget?[this.scareTarget]:[])].find(t=>t.id===r.id&&t.alive);return {target,targetId:r.id,headshot:r.headshot===true,points:target?.scare?SCARE_POINTS:target?.bonus?BONUS_POINTS:undefined};});
  if(result.hit&&hits.length===0)return false;
  return this.submitThrow(x,y,source,eventId,hits);
 }
 submitThrow(x,y,source,eventId,hits=[]){
  const points=hits.reduce((sum,h)=>sum+(h.points??(h.headshot?300:100)),0),accepted=this.round.submit(eventId||'throw-'+performance.now()+'-'+Math.random(),hits.length>0,points,hits.length);if(!accepted)return false;
  for(const hit of hits){const target=hit.target;if(target?.repeatable)continue;if(hit.targetId!=null)this.resolvedHits.add(hit.targetId);if(!target)continue;target.alive=false;target.shadow.setVisible(false);const fallen=target;
   this.scene.tweens.add({targets:fallen.sprite,y:fallen.sprite.y+45,angle:fallen.id%2?65:-65,alpha:0,duration:420,ease:'Cubic.In',onComplete:()=>{if(fallen.bonus){if(!this.bonusTargets.includes(fallen))return;this.destroyBonus(fallen);this.bonusTargets=this.bonusTargets.filter(z=>z!==fallen);return;}if(!this.targets.includes(fallen))return;this.destroyTarget(fallen);this.targets=this.targets.filter(z=>z!==fallen);if(this.round.status==='playing')this.spawn(fallen.slot,fallen.cycle+1);}});
  }
  this.impact(x,y,hits);this.effectSound(hits.length?'hit':'miss');this.onThrow?.({source,hit:hits.length>0,headshot:hits.some(h=>h.headshot),hitCount:hits.length,points,x:Math.round(x),y:Math.round(y),score:this.round.score,round:this.round.id,remaining:this.round.throws,throwLimit:this.round.throwLimit});this.notify();return true;
 }
 miss(source='attendant'){return this.throwAt(4,105,source);}
 impact(x,y,hits=[]){const hit=hits.length>0,points=hits.reduce((sum,h)=>sum+(h.points??(h.headshot?300:100)),0),headshot=hits.some(h=>h.headshot);
  const s=this.scene,g=s.add.graphics().setDepth(2500);g.lineStyle(5,hit?0xc8f697:0xf1c586).strokeCircle(0,0,30);g.setPosition(x,y);s.tweens.add({targets:g,scale:2.6,alpha:0,duration:440,onComplete:()=>g.destroy()});
  const label=hit?('+'+points+(hits.length>1?' ×'+hits.length+' ZOMBIES':headshot?' HEADSHOT':'')):'MISS',text=s.add.text(x,y-35,label,{fontFamily:'Arial',fontSize:'38px',fontStyle:'bold',color:hit?'#d5ffb0':'#f4d5a6',stroke:'#112020',strokeThickness:4}).setOrigin(.5).setDepth(2501);s.tweens.add({targets:text,y:y-105,alpha:0,duration:900,onComplete:()=>text.destroy()});
  if(hit){s.cameras.main.shake(90,.002);for(let i=0;i<12;i++){const p=s.add.circle(x,y,3+Math.random()*4,0xc8ed96).setDepth(2500);s.tweens.add({targets:p,x:x+(Math.random()-.5)*180,y:y-20-Math.random()*120,alpha:0,duration:550+Math.random()*200,onComplete:()=>p.destroy()});}}
 }
 showCalibration(enabled){if(enabled)this.hideScare();this.calibrating=enabled;if(this.ready)this.scene.calibration.setVisible(enabled);}
 update(time,delta){
  if(!this.ready)return;const dt=Math.min(delta,100)/1000;this.round.tick(dt);
  const moving=this.round.status==='playing'||this.round.status==='ready';
  if(moving&&!this.calibrating){for(const t of [...this.targets]){if(!t.alive)continue;if(this.scareRemaining<=0)t.age+=dt;const pose=this.presentTarget(t,dt);if(this.scareRemaining>0){t.sprite.setVisible(false);t.shadow.setVisible(false);t.excavation.setVisible(false);}if(pose.done){this.destroyTarget(t);this.targets=this.targets.filter(z=>z!==t);this.spawn(t.slot,t.cycle+1);}}for(const t of [...this.bonusTargets]){if(!t.alive)continue;if(this.scareRemaining>0){t.sprite.setVisible(false);t.shadow.setVisible(false);continue;}this.presentBonus(t,dt);if(t.x<-t.height||t.x>1280+t.height){this.destroyBonus(t);this.bonusTargets=this.bonusTargets.filter(z=>z!==t);}}}
  if(this.round.status==='playing'&&!this.calibrating){
   if(this.scareRemaining>0){this.scareRemaining=Math.max(0,this.scareRemaining-dt);const progress=1-this.scareRemaining/SCARE_DURATION,fadeStart=.9;this.scareSprite.setAlpha(progress>fadeStart?(1-progress)/(1-fadeStart):1);this.scareSprite.setScale(.85+Math.sin(Math.min(1,progress*5)*Math.PI/2)*.25);this.scareRig.apply({...rigPose(3,1,5),torso:-9-Math.sin(progress*Math.PI)*8,leftArm:70+Math.sin(progress*Math.PI*2)*18,rightArm:-70-Math.sin(progress*Math.PI*2)*18,leftElbow:-60,rightElbow:60});if(this.scareRemaining===0)this.hideScare();}
   else{this.scareClock+=dt;if(this.scareClock>=this.nextBonus){this.nextBonus+=7+Math.random()*5;this.spawnBonus();}if(this.scareClock>=this.nextScare){this.nextScare+=11+Math.random()*5;this.triggerScare();}}
  }
  this.scene.bottom.setText('29 PALMS · '+(this.round.throwLimit===null?'TIMED PLAY':this.round.throwLimit+' THROWS')+' · RISE. AIM. THROW.');
  this.scene.scoreText.setText(String(this.round.score).padStart(3,'0'));this.scene.timer.setText(Math.ceil(this.round.remaining)+'s');
  if(this.round.status==='complete'&&!this.completedNotified){this.hideScare();this.completedNotified=true;this.scene.time.delayedCall(650,()=>{if(this.round.status==='complete'){this.scene.overlayTitle.setText(this.round.score+' POINTS').setFontSize(64);this.scene.overlayHint.setText('NICE THROWING. NEXT PLAYER, PLEASE!');this.scene.overlay.setVisible(true);}});this.notify();}
  if(time-(this.lastUI||0)>100){this.lastUI=time;this.notify();}
 }
 setMusicEnabled(enabled){this.musicEnabled=enabled===true;if(this.musicEnabled)this.ensureMusic();else this.musicTrack?.pause();}
 setSoundEnabled(enabled){this.soundEnabled=enabled===true;}
 ensureMusic(){if(!this.musicEnabled||typeof Audio==='undefined')return;this.musicTrack??=Object.assign(new Audio('assets/audio/music/creepy-ambient-loop.ogg'),{loop:true,volume:.24});this.musicTrack.play().catch(()=>{});}
 playZombie(kind){if(typeof Audio==='undefined')return;const now=performance.now(),minimum=kind==='scare'?0:kind==='spawn'?700:140;if(now-(this.lastZombieVoice||-Infinity)<minimum)return;this.lastZombieVoice=now;const files={spawn:'zombie-rise.wav',hit:'zombie-hit.wav',scare:'zombie-scare.wav',snarl:'zombie-snarl.wav'},file=files[kind];if(!file)return;const clip=new Audio('assets/audio/sfx/'+file);clip.volume=kind==='scare'?.72:.48;clip.play().catch(()=>{});}
 effectSound(kind){if(!this.soundEnabled)return;if(['spawn','hit','scare'].includes(kind))this.playZombie(kind);try{this.audio??=new(window.AudioContext||window.webkitAudioContext)();this.audio.resume();const now=this.audio.currentTime,o=this.audio.createOscillator(),g=this.audio.createGain();o.type=kind==='scare'||kind==='spawn'?'sawtooth':kind==='hit'?'triangle':'sine';o.frequency.setValueAtTime(kind==='scare'?190:kind==='spawn'?115:kind==='hit'?380:kind==='start'?260:140,now);o.frequency.exponentialRampToValueAtTime(kind==='hit'?100:kind==='start'?530:80,now+.15);g.gain.setValueAtTime(kind==='spawn'?.035:.07,now);g.gain.exponentialRampToValueAtTime(.001,now+.2);o.connect(g).connect(this.audio.destination);o.start(now);o.stop(now+.23);}catch{}}
}
