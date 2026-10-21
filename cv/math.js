export function median(values){const a=[...values].sort((a,b)=>a-b);return a.length?(a[Math.floor((a.length-1)/2)]+a[Math.floor(a.length/2)])/2:NaN;}
export function identity(n){return Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>+(i===j)));}
export function transpose(a){return a[0].map((_,i)=>a.map(r=>r[i]));}
export function multiply(a,b){return a.map(row=>b[0].map((_,j)=>row.reduce((s,v,k)=>s+v*b[k][j],0)));}
export function inverse(a){const n=a.length,m=a.map((r,i)=>[...r,...identity(n)[i]]);for(let i=0;i<n;i++){let k=i;for(let j=i+1;j<n;j++)if(Math.abs(m[j][i])>Math.abs(m[k][i]))k=j;if(Math.abs(m[k][i])<1e-12)throw Error('Singular covariance');[m[i],m[k]]=[m[k],m[i]];const v=m[i][i];m[i]=m[i].map(x=>x/v);for(let j=0;j<n;j++)if(j!==i){const f=m[j][i];m[j]=m[j].map((x,k)=>x-f*m[i][k]);}}return m.map(r=>r.slice(n));}
