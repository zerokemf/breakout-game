import {CONFIG} from './config.js?v=2a';
export const POWERUP_TYPES=Object.freeze({
 extend:{icon:'↔',label:'PADDLE EXTEND',color:'#38def6',apply:g=>{g.effects.extend=15;g.paddle.setWidth(CONFIG.paddleWidth*1.5);}},
 slow:{icon:'↓',label:'SLOW BALL',color:'#b68cff',apply:g=>{g.effects.slow=10;for(const b of g.balls)b.setSpeed(g.currentSpeed());}},
 life:{icon:'♥',label:'EXTRA LIFE',color:'#ff6aa9',apply:g=>{g.lives=Math.min(5,g.lives+1);}},
 multi:{icon:'✣',label:'MULTI BALL',color:'#69ed97',apply:g=>g.splitBalls()},
 fire:{icon:'♨',label:'FIRE BALL',color:'#ff7946',apply:g=>{g.effects.fire=15;}},
 laser:{icon:'⚡',label:'LASER PADDLE',color:'#ffe46b',apply:g=>{if(!g.effects.laser)g.laserClock=0;g.effects.laser=12;}},
 sticky:{icon:'⌁',label:'STICKY PADDLE',color:'#f28af5',apply:g=>{g.effects.sticky=12;}}
});
export class PowerUp{constructor(x,y,type){this.x=x;this.y=y;this.type=type;this.age=0;this.radius=17;this.active=true;}
update(dt,paddle){this.age+=dt;const oldY=this.y;this.y+=155*dt;if(this.x+this.radius>=paddle.x&&this.x-this.radius<=paddle.x+paddle.width&&oldY-this.radius<=paddle.y+paddle.height&&this.y+this.radius>=paddle.y){this.active=false;return true;}if(this.y-this.radius>CONFIG.height)this.active=false;return false;}
}
