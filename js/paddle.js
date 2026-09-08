import {CONFIG} from './config.js';import {clamp} from './physics.js';
export class Paddle{constructor(){this.width=CONFIG.paddleWidth;this.height=CONFIG.paddleHeight;this.y=CONFIG.paddleY;this.x=(CONFIG.width-this.width)/2;}
get centerX(){return this.x+this.width/2;}
moveTo(center){this.x=clamp(center-this.width/2,0,CONFIG.width-this.width);}
setWidth(width){const center=this.centerX;this.width=width;this.moveTo(center);}
}
