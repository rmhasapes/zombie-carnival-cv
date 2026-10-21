import {identity,transpose,multiply,inverse} from './math.js';
// Six states [camera x, camera y, radius, vx, vy, radius velocity].
// Prediction uses actual capture intervals. Measurements are not game coordinates.
export class BallKalman{
 constructor({measurementNoise=2,processNoise=600,gate=16}={}){this.options={measurementNoise,processNoise,gate};this.reset();}
 reset(){this.state=null;this.P=null;this.timestamp=null;}
 project(timestamp){if(!this.state)return null;const dt=(timestamp-this.timestamp)/1000;if(dt<=0||dt>.25)return null;const F=identity(6);for(let i=0;i<3;i++)F[i][i+3]=dt;const s=multiply(F,this.state.map(v=>[v])).map(r=>r[0]);const p=multiply(multiply(F,this.P),transpose(F));for(let i=0;i<3;i++){const q=this.options.processNoise*(i===2?.05:1);p[i][i]+=q*dt**4/4;p[i][i+3]+=q*dt**3/2;p[i+3][i]+=q*dt**3/2;p[i+3][i+3]+=q*dt**2;}return {state:s,P:p,dt};}
 allowRebound(){if(!this.state)return;this.state[5]=0;this.P[2][2]+=2;this.P[5][5]=Math.max(this.P[5][5],10000);}
 update(d,t){if(!d||![d.x,d.y,d.radius,d.confidence,t].every(Number.isFinite)||d.radius<=0)return null;
  if(!this.state||t-this.timestamp>250){this.state=[d.x,d.y,d.radius,0,0,0];this.P=identity(6).map((r,i)=>r.map(v=>v*(i<3?4:10000)));this.timestamp=t;return this.result(d,0);}
  const predicted=this.project(t);if(!predicted)return null;const {state:s,P:p}=predicted;const noise=this.options.measurementNoise/Math.max(.1,d.confidence);const R=[noise,noise,Math.max(.3,noise*.35)],S=p.slice(0,3).map((r,i)=>r.slice(0,3).map((v,j)=>v+(i===j?R[i]:0))),Si=inverse(S),innovation=[d.x-s[0],d.y-s[1],d.radius-s[2]];
  const distance=multiply(multiply([innovation],Si),innovation.map(v=>[v]))[0][0];if(distance>this.options.gate)return {rejected:true,distance};
  const K=multiply(p.map(r=>r.slice(0,3)),Si);this.state=s.map((v,i)=>v+K[i].reduce((sum,k,j)=>sum+k*innovation[j],0));
  const A=identity(6);for(let i=0;i<6;i++)for(let j=0;j<3;j++)A[i][j]-=K[i][j];
  // Joseph covariance update keeps covariance symmetric and nonnegative.
  const krkt=multiply(K.map(r=>r.map((v,j)=>v*R[j])),transpose(K));this.P=multiply(multiply(A,p),transpose(A)).map((r,i)=>r.map((v,j)=>v+krkt[i][j]));this.timestamp=t;return this.result(d,distance);
 }
 result(d,distance){const [x,y,radius,vx,vy,vr]=this.state;return {x,y,radius,vx,vy,vr,sigmaRadius:Math.sqrt(Math.max(0,this.P[2][2])),sigmaPosition:Math.sqrt(Math.max(this.P[0][0],this.P[1][1])),confidence:d.confidence,distance};}
}
