import {CONFIG} from './config.js';
export const POWERUP_TYPES=Object.freeze({
 extend:{icon:'↔',label:'PADDLE EXTEND',color:'#38def6',apply:g=>{g.effects.extend=15;g.paddle.setWidth(CONFIG.paddleWidth*1.5);}},
 slow:{icon:'↓',label:'SLOW BALL',color:'#b68cff',apply:g=>{g.effects.slow=10;for(const b of g.balls)b.setSpeed(g.currentSpeed());}},
 life:{icon:'♥',label:'EXTRA LIFE',color:'#ff6aa9',apply:g=>{g.lives=Math.min(5,g.lives+1);}}
});
export class PowerUp{constructor(x,y,type){this.x=x;this.y=y;this.type=type;this.age=0;this.radius=17;this.active=true;}
update(dt,paddle){this.age+=dt;const oldY=this.y;this.y+=155*dt;if(this.x+this.radius>=paddle.x&&this.x-this.radius<=paddle.x+paddle.width&&oldY-this.radius<=paddle.y+paddle.height&&this.y+this.radius>=paddle.y){this.active=false;return true;}if(this.y-this.radius>CONFIG.height)this.active=false;return false;}
}
