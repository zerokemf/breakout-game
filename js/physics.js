// Continuous circle/rectangle collision. Faces and rounded corners are tested
// separately: expanding the AABB alone gives false square-corner collisions.
export function sweepCircleRect(b,r,dt){
 const out=[];const eps=1e-9;
 const add=(t,nx,ny)=>{if(t>=-eps&&t<=dt+eps&&b.vx*nx+b.vy*ny< -eps)out.push({t:Math.max(0,t),nx,ny});};
 if(b.vx>eps){const t=(r.x-b.radius-b.x)/b.vx,y=b.y+b.vy*t;if(y>=r.y&&y<=r.y+r.height)add(t,-1,0);}
 if(b.vx< -eps){const t=(r.x+r.width+b.radius-b.x)/b.vx,y=b.y+b.vy*t;if(y>=r.y&&y<=r.y+r.height)add(t,1,0);}
 if(b.vy>eps){const t=(r.y-b.radius-b.y)/b.vy,x=b.x+b.vx*t;if(x>=r.x&&x<=r.x+r.width)add(t,0,-1);}
 if(b.vy< -eps){const t=(r.y+r.height+b.radius-b.y)/b.vy,x=b.x+b.vx*t;if(x>=r.x&&x<=r.x+r.width)add(t,0,1);}
 const a=b.vx*b.vx+b.vy*b.vy;
 if(a>eps)for(const [cx,cy,sx,sy] of [[r.x,r.y,-1,-1],[r.x+r.width,r.y,1,-1],[r.x,r.y+r.height,-1,1],[r.x+r.width,r.y+r.height,1,1]]){
  const dx=b.x-cx,dy=b.y-cy,B=2*(dx*b.vx+dy*b.vy),C=dx*dx+dy*dy-b.radius*b.radius,D=B*B-4*a*C;
  if(D<0)continue;const t=(-B-Math.sqrt(D))/(2*a),hx=b.x+b.vx*t-cx,hy=b.y+b.vy*t-cy;
  if(hx*sx>=-eps&&hy*sy>=-eps)add(t,hx/b.radius,hy/b.radius);
 }
 return out.sort((a,b)=>a.t-b.t)[0]??null;
}
export function reflect(ball,nx,ny){const d=ball.vx*nx+ball.vy*ny;if(d<0){ball.vx-=2*d*nx;ball.vy-=2*d*ny;}}
export const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
