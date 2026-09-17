// Fit the enclosing sphere into the portion of the projection not covered by the inspector.
export function inspectionDistance(radius,verticalFov,width,height,usableWidth=width,usableHeight=height){
 const tangent=Math.tan(verticalFov*Math.PI/360);
 const horizontalHalfAngle=Math.atan(tangent*width/height*Math.max(usableWidth/width,.01));
 const verticalHalfAngle=Math.atan(tangent*Math.max(usableHeight/height,.01));
 return Math.max(radius,.012)/Math.sin(Math.min(horizontalHalfAngle,verticalHalfAngle))*1.2;
}

// Fit the eight corners in camera space rather than fitting a wastefully large sphere.
export function boxFitDistance(min,max,direction,verticalFov,width,height,usableWidth=width,usableHeight=height,boxes=[{min,max}]){
 const normalize=v=>{const n=Math.hypot(...v);return v.map(x=>x/n)},dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0);
 const d=normalize(direction),right=Math.hypot(d[0],d[2])>1e-6?normalize([d[2],0,-d[0]]):[1,0,0];
 const up=[d[1]*right[2]-d[2]*right[1],d[2]*right[0]-d[0]*right[2],d[0]*right[1]-d[1]*right[0]];
 const center=min.map((v,i)=>(v+max[i])/2),tan=Math.tan(verticalFov*Math.PI/360);
 const tx=tan*Math.max(usableWidth,1)/height,ty=tan*Math.max(usableHeight,1)/height;
 let distance=.05;
 for(const box of boxes)for(const x of [box.min[0],box.max[0]])for(const y of [box.min[1],box.max[1]])for(const z of [box.min[2],box.max[2]]){
  const p=[x-center[0],y-center[1],z-center[2]];
  distance=Math.max(distance,dot(p,d)+1.045*Math.max(Math.abs(dot(p,right))/tx,Math.abs(dot(p,up))/ty));
 }
 return distance;
}
