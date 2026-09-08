import {CONFIG} from './config.js?v=2a-drops';import {POWERUP_TYPES} from './powerup.js?v=2a-drops';
const EFFECT_NAMES={extend:'加寬',slow:'慢速',fire:'火焰',laser:'雷射',sticky:'黏球'};
const CAPTIONS={extend:'加寬擋板・接球更從容',slow:'慢速球・穩住節奏',life:'額外生命・再戰一回',multi:'多重球・全面出擊',fire:'火焰球・穿透磚塊',laser:'雷射擋板・自動連射',sticky:'黏性擋板・瞄準再出發'};
const rounded=(ctx,x,y,w,h,r)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r);};
export class Renderer{
 constructor(canvas,particles){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.particles=particles;this.flash=0;this.shake=0;this.caption=null;}
 event(name,data={},settings={}){
  this.settings=settings;
  if(settings.screenShake===false||settings.reducedMotion)this.shake=0;
  else {
   const duration=name==='lose_life'?.2:name==='level_clear'?.25:name==='powerup_pickup'&&['multi','fire'].includes(data.type)?.12:0;
   if(duration)this.shake=duration; // Replace, never accumulate impulses.
  }
  if(name==='brick_break')this.particles.burst(data.x,data.y,data.color,22);
  if(name==='powerup_pickup'){this.particles.burst(data.x,data.y,data.color,38);this.caption={text:data.label,sub:CAPTIONS[data.type]||'道具啟動',time:1.3,color:data.color};}
  if(name==='level_clear')this.flash=.3;
  if(name==='high_score')this.flash=.65;
 }
 update(dt){this.particles.update(dt);this.flash=Math.max(0,this.flash-dt);this.shake=Math.max(0,this.shake-dt);if(this.caption){this.caption.time-=dt;if(this.caption.time<=0)this.caption=null;}}
 render(g,{dim=false,settings=this.settings}={}){this.settings=settings;if(settings?.screenShake===false||settings?.reducedMotion)this.shake=0;const c=this.ctx,W=CONFIG.width,H=CONFIG.height;c.fillStyle='#080d1c';c.fillRect(0,0,W,H);
 const bg=c.createRadialGradient(W*.5,H*.4,20,W*.5,H*.4,760);bg.addColorStop(0,'#132442');bg.addColorStop(1,'#080b18');c.fillStyle=bg;c.fillRect(0,0,W,H);
 c.save();if(this.shake>0)c.translate(Math.sin(this.shake*350)*2,Math.cos(this.shake*420)*2);
 c.strokeStyle='#3b63831c';c.lineWidth=1;for(let x=0;x<W;x+=64){c.beginPath();c.moveTo(x,0);c.lineTo(x,H);c.stroke();}for(let y=16;y<H;y+=48){c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke();}
 c.fillStyle='#39dff8';c.shadowColor='#39dff8';c.shadowBlur=12;c.fillRect(0,0,3,H-32);c.fillRect(W-3,0,3,H-32);c.fillRect(0,0,W,3);c.shadowBlur=0;
 c.textAlign='left';c.font='600 13px ui-monospace,monospace';c.fillStyle='#5a7895';c.fillText('關卡 '+String(g.level||1).padStart(2,'0')+'   /   霓虹街機',36,43);c.textAlign='right';c.fillText('擊破・反彈・再挑戰',W-36,43);
 for(const b of g.bricks||[]){
  if(b.destroyed)continue;c.save();c.shadowColor=b.color;c.shadowBlur=b.type===3?0:b.type===4?9:4;
  const gradient=c.createLinearGradient(b.x,b.y,b.x,b.y+b.height);gradient.addColorStop(0,b.flash>0?'#ffffff':b.color);gradient.addColorStop(1,b.type===3?'#29394e':b.color+'99');c.fillStyle=gradient;rounded(c,b.x,b.y,b.width,b.height,5);c.fill();c.shadowBlur=0;c.strokeStyle=b.type===3?'#8593a6':b.color;c.lineWidth=1;c.stroke();c.fillStyle='#ffffff50';c.fillRect(b.x+7,b.y+4,b.width-14,2);
  if(b.type===2){
   c.strokeStyle='#182333';c.lineWidth=3;
   if(b.hp===1){c.beginPath();c.moveTo(b.x+b.width*.45,b.y);c.lineTo(b.x+b.width*.55,b.y+9);c.lineTo(b.x+b.width*.4,b.y+18);c.lineTo(b.x+b.width*.58,b.y+b.height);c.stroke();c.lineWidth=1;c.strokeStyle='#ffffffaa';c.stroke();}
   else{c.fillStyle='#182333';for(const dx of [-7,7]){c.beginPath();c.arc(b.x+b.width/2+dx,b.y+16,3.5,0,Math.PI*2);c.fill();}}
   c.strokeStyle='#15213788';c.lineWidth=1;rounded(c,b.x+3,b.y+3,b.width-6,b.height-6,3);c.stroke();
  }
  if(b.type===3){for(const x of [b.x+8,b.x+b.width-8])for(const y of [b.y+9,b.y+b.height-7]){c.fillStyle='#b0bccb';c.beginPath();c.arc(x,y,2,0,Math.PI*2);c.fill();c.fillStyle='#334258';c.fillRect(x-1,y,2,1);}}
  if(b.bonusDrop){c.fillStyle='#091321';c.fillRect(b.x+b.width/2-12,b.y+6,24,20);c.fillStyle='#fff2b0';c.textAlign='center';c.font='bold 20px system-ui';c.fillText('★',b.x+b.width/2,b.y+22);}
  if(b.type===4){c.fillStyle='#5c3a0d';c.textAlign='center';c.font='bold 22px system-ui';c.fillText('★',b.x+b.width/2,b.y+22);}
  c.restore();
 }
 for(const p of g.powerups||[]){const type=POWERUP_TYPES[p.type];if(!type)continue;c.save();c.translate(p.x,p.y);if(!settings?.reducedMotion)c.rotate(Math.sin((p.age||0)*4)*.09);c.shadowBlur=12;c.shadowColor=type.color;c.fillStyle='#0a152c';rounded(c,-20,-16,40,32,8);c.fill();c.strokeStyle=type.color;c.lineWidth=2;c.stroke();c.fillStyle=type.color;c.textAlign='center';c.font='bold 24px system-ui';c.fillText(type.icon,0,8);c.restore();}
 const p=g.paddle,effects=g.effects||{};
 c.save();
 if(effects.extend>0){c.shadowColor='#7aeaff';c.shadowBlur=16;c.strokeStyle='#7aeaff88';c.lineWidth=2;rounded(c,p.x-4,p.y-4,p.width+8,p.height+8,12);c.stroke();}
 c.shadowBlur=16;c.shadowColor='#3ce9ff';const pg=c.createLinearGradient(p.x,p.y,p.x,p.y+p.height);pg.addColorStop(0,'#e6fdff');pg.addColorStop(.35,'#4ce6f7');pg.addColorStop(1,'#147da1');c.fillStyle=pg;rounded(c,p.x,p.y,p.width,p.height,9);c.fill();c.shadowBlur=0;c.fillStyle='#fe72b8';rounded(c,p.x+5,p.y+4,10,p.height-8,4);c.fill();rounded(c,p.x+p.width-15,p.y+4,10,p.height-8,4);c.fill();
 if(effects.sticky>0){c.fillStyle='#8ff0b0';c.shadowColor='#8ff0b0';c.shadowBlur=9;c.fillRect(p.x+19,p.y-2,Math.max(0,p.width-38),4);}
 if(effects.laser>0){for(const x of [p.x+9,p.x+p.width-19]){c.shadowBlur=0;c.fillStyle='#314560';rounded(c,x,p.y-12,10,20,3);c.fill();c.fillStyle='#fff4cf';c.shadowColor='#ffc669';c.shadowBlur=12;c.fillRect(x+2,p.y-12,6,5);}}
 c.restore();
 for(const bolt of g.bolts||[]){if(bolt.active===false)continue;const r=bolt.radius||3;c.save();c.shadowColor='#ffc669';c.shadowBlur=15;c.fillStyle='#ffb84f';c.fillRect(bolt.x-r-1,bolt.y-12,r*2+2,24);c.fillStyle='#fff4cf';c.fillRect(bolt.x-r,bolt.y-10,r*2,18);c.restore();}
 for(const b of g.balls||[]){const trail=b.trail||[],fire=effects.fire>0;c.save();if(!b.attached)for(let i=0;i<trail.length;i++){const t=trail[i];c.globalAlpha=(i+1)/trail.length*(fire?.42:.25);c.fillStyle=fire?'#ff934f':'#52e7ff';c.beginPath();c.arc(t.x,t.y,b.radius*((i+1)/trail.length)*.8,0,Math.PI*2);c.fill();}c.globalAlpha=1;c.shadowBlur=fire?19:15;c.shadowColor=fire?'#ffab59':'#9af4ff';c.fillStyle='#fff';c.beginPath();c.arc(b.x,b.y,b.radius,0,Math.PI*2);c.fill();c.restore();}
 this.particles.render(c);c.fillStyle='#ff528544';c.fillRect(20,H-13,W-40,1);c.font='600 21px ui-monospace,monospace';c.textAlign='left';
 const active=Object.entries(effects).filter(([type,time])=>time>0&&POWERUP_TYPES[type]);const slot=Math.min(230,(W-64)/Math.max(1,active.length));
 active.forEach(([type,time],i)=>{c.fillStyle=POWERUP_TYPES[type].color;c.fillText(POWERUP_TYPES[type].icon+' '+EFFECT_NAMES[type]+' '+time.toFixed(1)+'秒',32+i*slot,H-30,slot-12);});
 if((g.balls||[]).some(b=>b.attached)){c.save();c.font='800 34px ui-monospace,monospace';c.textAlign='center';c.strokeStyle='#08111f';c.lineWidth=9;c.strokeText('空白鍵／輕點放球',W/2,p.y-56);c.fillStyle='#b9ffd0';c.fillText('空白鍵／輕點放球',W/2,p.y-56);c.restore();}
 if(this.caption){const t=this.caption;c.save();c.globalAlpha=Math.min(1,t.time*3);c.textAlign='center';c.lineWidth=8;c.strokeStyle='#060914';c.shadowColor=t.color;c.shadowBlur=25;c.font='900 58px system-ui';c.strokeText(t.text,W/2,H*.58);c.fillStyle=t.color;c.fillText(t.text,W/2,H*.58);c.font='bold 22px ui-monospace,monospace';c.fillStyle='#fff';c.fillText(t.sub,W/2,H*.58+35);c.restore();}
 if(this.flash>0){c.fillStyle=`rgba(139,225,255,${this.flash*.3})`;c.fillRect(0,0,W,H);}c.restore();if(dim){c.fillStyle='#0509187a';c.fillRect(0,0,W,H);}
 }
}
