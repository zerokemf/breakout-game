import {CONFIG} from './config.js?v=2b-inventory';
export class Ball{constructor(x,y){this.x=x;this.y=y;this.vx=0;this.vy=0;this.speed=CONFIG.initialSpeed;this.radius=CONFIG.ballRadius;this.active=false;this.attached=false;this.attachOffset=0;this.trail=[];}
setSpeed(speed){const n=Math.hypot(this.vx,this.vy);this.speed=speed;if(n){this.vx=this.vx/n*speed;this.vy=this.vy/n*speed;}}
}
