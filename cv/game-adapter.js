// Game-independent immutable target history. All timestamps use the game's clock.
export class HitboxHistory{
 constructor({retentionMs=1200,maxGapMs=60}={}){this.retentionMs=retentionMs;this.maxGapMs=maxGapMs;this.frames=[];}
 record(timestamp,{roundId,playing,blocked,targets=[],covers=[]}){if(!Number.isFinite(timestamp)||timestamp<=this.frames.at(-1)?.timestamp)return;const frame={timestamp,roundId,playing,blocked,targets:targets.map(t=>({id:t.id,x:t.x,y:t.y,w:t.w,h:t.h,footY:t.footY,head:t.head?{...t.head}:null})),covers:covers.map(c=>({...c}))};this.frames.push(frame);while(this.frames.length&&timestamp-this.frames[0].timestamp>this.retentionMs)this.frames.shift();}
 resolve(event,roundId){if(!this.frames.length||event.timestamp<this.frames[0].timestamp)return null;const before=this.frames.findLast(f=>f.timestamp<=event.timestamp);if(!before||event.timestamp-before.timestamp>this.maxGapMs||before.roundId!==roundId||!before.playing||before.blocked)return null;
 const targets=before.targets.filter(t=>event.x>=t.x-t.w/2&&event.x<=t.x+t.w/2&&event.y>=t.y&&event.y<=t.y+t.h&&!before.covers.some(c=>c.footY>=t.footY&&event.x>=c.x&&event.x<=c.x+c.w&&event.y>=c.y&&event.y<=c.y+c.h)).map(t=>({id:t.id,headshot:!!t.head&&event.x>=t.head.x-t.head.w/2&&event.x<=t.head.x+t.head.w/2&&event.y>=t.head.y&&event.y<=t.head.y+t.head.h}));const first=targets[0];return {roundId,hit:targets.length>0,headshot:first?.headshot??false,targetId:first?.id??null,targets,timestamp:event.timestamp,snapshotTimestamp:before.timestamp};}
 clear(){this.frames=[];}
}
export class GameImpactAdapter{
 constructor(game){this.game=game;this.history=new HitboxHistory();this.enabled=false;this.seen=new Set();this.lastAccepted=-Infinity;this.loop=()=>{if(this.destroyed)return;this.record(performance.now());this.raf=requestAnimationFrame(this.loop);};this.loop();}
 record(t){const g=this.game;this.history.record(t,{roundId:g.round.id,playing:g.round.status==='playing',blocked:g.calibrating,targets:g.getTargets().map(t=>({...t,footY:t.target.plan.footY})),covers:g.coverObjects||[]});}
 enable(validated){this.enabled=validated===true;this.history.clear();this.lastAccepted=-Infinity;this.record(performance.now());}
 accept(event,now=performance.now()){
  if(!this.enabled||!event?.id||this.seen.has(event.id)||![event.timestamp,event.x,event.y,event.confidence].every(Number.isFinite)||event.confidence<.4||event.x<0||event.x>1280||event.y<0||event.y>720||event.timestamp>now||now-event.timestamp>400||event.timestamp<this.lastAccepted)return false;
  const g=this.game;if(g.round.status!=='playing'||g.calibrating)return false;const resolved=this.history.resolve(event,g.round.id);if(!resolved)return false;
  const accepted=g.throwResolved(event.x,event.y,'camera CV lab',event.id,resolved);if(accepted){this.seen.add(event.id);if(this.seen.size>4096)this.seen.delete(this.seen.values().next().value);this.lastAccepted=event.timestamp;}return accepted;
 }
 destroy(){this.destroyed=true;cancelAnimationFrame(this.raf);this.history.clear();this.enabled=false;}
}
