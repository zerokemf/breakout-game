import {CONFIG,STATES} from './config.js?v=2a-drops';
import {Ball} from './ball.js?v=2a-drops';import {Paddle} from './paddle.js?v=2a-drops';
import {sweepCircleRect,reflect,clamp} from './physics.js?v=2a-drops';import {LEVELS} from './levels.js?v=2a-drops';
import {PowerUp,POWERUP_TYPES} from './powerup.js?v=2a-drops';
import {buildBricks} from './brick.js?v=2a-drops';import {ScoreManager} from './score.js?v=2a-drops';
export class Game{
 constructor({onEvent=()=>{},onState=()=>{}}={}){this.onEvent=onEvent;this.onState=onState;this.state=STATES.MENU;this.mode='campaign';this.paddle=new Paddle();this.balls=[];this.bricks=[];this.keys=new Set();this.pointer=null;this.score=new ScoreManager();this.powerups=[];this.bolts=[];this.laserClock=0;this.effects={extend:0,slow:0,fire:0,laser:0,sticky:0};this.elapsed=0;this.accumulator=0;}
 transition(state){if(!Object.values(STATES).includes(state))throw new Error('Unknown state');this.state=state;this.accumulator=0;this.onState(state);}
 start(level=1){if(!Number.isInteger(level)||level<1||level>LEVELS.length)throw new RangeError('Invalid level');this.level=level;this.startLevel=level;this.dropIndex=0;this.lives=3;this.destroyedCount=0;this.elapsed=0;this.score.resetScore();this.loadLevel();}
 loadLevel(){this.paddle=new Paddle();this.pointer=null;this.keys.clear();this.bricks=buildBricks(LEVELS[this.level-1]);this.resetReady();}
 resetReady(){this.powerups=[];this.bolts=[];this.laserClock=0;this.effects={extend:0,slow:0,fire:0,laser:0,sticky:0};this.paddle.setWidth(CONFIG.paddleWidth);this.balls=[new Ball(this.paddle.centerX,this.paddle.y-CONFIG.ballRadius-1)];this.balls[0].speed=this.currentSpeed();this.transition(STATES.READY);}
 currentSpeed(){return Math.min(CONFIG.initialSpeed*CONFIG.maxSpeedFactor,CONFIG.initialSpeed*1.025**Math.floor(this.destroyedCount/10))*(this.effects.slow>0?.8:1);}
 setPointer(x){if(Number.isFinite(x))this.pointer=x;}
 launch(){if(this.state===STATES.PLAYING){this.releaseAttached();return;}if(this.state!==STATES.READY)return;for(const b of this.balls){b.active=true;b.attached=false;b.vx=b.speed*.18;b.vy=-Math.sqrt(b.speed*b.speed-b.vx*b.vx);}this.transition(STATES.PLAYING);}
 followAttached(b){b.attachOffset=clamp(b.attachOffset,-this.paddle.width/2,this.paddle.width/2);b.x=clamp(this.paddle.centerX+b.attachOffset,b.radius,CONFIG.width-b.radius);b.y=this.paddle.y-b.radius-1;}
 releaseAttached(){for(const b of this.balls)if(b.attached){this.followAttached(b);b.attached=false;b.active=true;b.vx=b.speed*.18;b.vy=-Math.sqrt(b.speed*b.speed-b.vx*b.vx);}}
 update(dt){if(![STATES.READY,STATES.PLAYING].includes(this.state))return;dt=clamp(dt,0,.05);const dir=Number(this.keys.has('ArrowRight')||this.keys.has('d'))-Number(this.keys.has('ArrowLeft')||this.keys.has('a'));if(dir){this.pointer=null;this.paddle.moveTo(this.paddle.centerX+dir*CONFIG.paddleSpeed*dt);}else if(this.pointer!==null)this.paddle.moveTo(this.pointer);
 if(this.state===STATES.READY){for(const b of this.balls){b.x=this.paddle.centerX;b.y=this.paddle.y-b.radius-1;}return;}
 for(const b of this.balls)if(b.attached)this.followAttached(b);
 this.accumulator+=dt;while(this.accumulator+1e-10>=CONFIG.fixedStep&&this.state===STATES.PLAYING){this.accumulator-=CONFIG.fixedStep;this.step(CONFIG.fixedStep);}}
 step(dt){this.elapsed+=dt;this.updateLaser(Math.min(dt,this.effects.laser||0));this.tickEffects(dt);this.moveBolts(dt);if(this.state!==STATES.PLAYING)return;for(const p of this.powerups)if(p.update(dt,this.paddle))this.applyPowerup(p.type);this.powerups=this.powerups.filter(p=>p.active);for(const brick of this.bricks)brick.flash=Math.max(0,brick.flash-dt);for(const b of this.balls){if(!b.active)continue;this.moveBall(b,dt);if(this.state!==STATES.PLAYING)return;}
 this.balls=this.balls.filter(b=>b.active||b.attached);if(!this.balls.length)this.loseLife();}
 splitBalls(){for(const source of [...this.balls]){if(!source.active&&!source.attached)continue;for(const rotation of [-Math.PI/6,Math.PI/6]){if(this.balls.length>=6)return;const b=new Ball(source.x,source.y),angle=(source.vx||source.vy?Math.atan2(source.vy,source.vx):-Math.PI/2)+rotation;b.speed=source.speed;b.vx=Math.cos(angle)*b.speed;b.vy=Math.sin(angle)*b.speed;b.active=true;this.balls.push(b);}}}
 applyPowerup(type){const effect=POWERUP_TYPES[type];if(!effect)return;effect.apply(this);const data={type,x:this.paddle.centerX,y:this.paddle.y,color:effect.color,label:effect.label};this.onEvent('powerup_pickup',data);if(type==='fire')this.onEvent('fire_activate',data);}
 updateLaser(dt){if(dt<=0)return;this.laserClock+=dt;while(this.laserClock+1e-9>=.35){this.laserClock=Math.max(0,this.laserClock-.35);for(const x of [this.paddle.x+12,this.paddle.x+this.paddle.width-12])this.bolts.push({x,y:this.paddle.y-4,vx:0,vy:-950,radius:3,active:true});this.onEvent('laser_shot',{x:this.paddle.centerX,y:this.paddle.y});}}
 moveBolts(dt){for(const bolt of this.bolts){if(!bolt.active)continue;let hit=null;for(const brick of this.bricks){if(brick.destroyed)continue;const h=sweepCircleRect(bolt,brick,dt);if(h&&(!hit||h.t<hit.t))hit={...h,brick};}const time=hit?hit.t:dt;bolt.x+=bolt.vx*time;bolt.y+=bolt.vy*time;if(hit){bolt.active=false;this.hitBrick(hit.brick);if(this.state!==STATES.PLAYING)break;}else if(bolt.y+bolt.radius<0)bolt.active=false;}this.bolts=this.bolts.filter(b=>b.active);}
 tickEffects(dt){for(const type of ['extend','slow','fire','laser','sticky']){const before=this.effects[type]||0;this.effects[type]=Math.max(0,before-dt);if(before>0&&this.effects[type]===0){if(type==='extend')this.paddle.setWidth(CONFIG.paddleWidth);else if(type==='slow')for(const b of this.balls)b.setSpeed(this.currentSpeed());else if(type==='sticky')this.releaseAttached();}}}
 pause(){if([STATES.READY,STATES.PLAYING].includes(this.state)){this.pausedFrom=this.state;this.keys.clear();this.transition(STATES.PAUSED);}}
 resume(){if(this.state===STATES.PAUSED)this.transition(this.pausedFrom);}
 loseLife(){if(this.state!==STATES.PLAYING)return;this.lives--;this.onEvent('lose_life',{});if(this.lives>0)this.resetReady();else this.finish();}
 finish(){this.transition(STATES.GAME_OVER);this.onEvent('game_over',{});}
 nextLevel(){if(this.state!==STATES.LEVEL_CLEAR)return;if(this.level>=LEVELS.length){this.finish();return;}this.level++;this.loadLevel();}
 moveBall(b,dt){if(b.attached){this.followAttached(b);return;}b.x=clamp(b.x,b.radius,CONFIG.width-b.radius);b.y=Math.max(b.radius,b.y);let remaining=dt;
 for(let iteration=0;iteration<12&&remaining>1e-8;iteration++){
 let hit=null;const consider=(h,target)=>{if(h&&h.t>=-1e-9&&h.t<=remaining+1e-9&&(!hit||h.t<hit.t-1e-9))hit={...h,target};};
 if(b.vx<0)consider({t:(b.radius-b.x)/b.vx,nx:1,ny:0},'wall');
 if(b.vx>0)consider({t:(CONFIG.width-b.radius-b.x)/b.vx,nx:-1,ny:0},'wall');
 if(b.vy<0)consider({t:(b.radius-b.y)/b.vy,nx:0,ny:1},'wall');
 if(b.vy>0)consider(sweepCircleRect(b,this.paddle,remaining),'paddle');
 for(const brick of this.bricks)if(!brick.destroyed)consider(sweepCircleRect(b,brick,remaining),brick);
 if(!hit){b.x+=b.vx*remaining;b.y+=b.vy*remaining;break;}
 b.x+=b.vx*hit.t;b.y+=b.vy*hit.t;remaining-=hit.t;
 if(hit.target==='paddle'){if(this.effects.sticky>0){b.attached=true;b.active=true;b.attachOffset=b.x-this.paddle.centerX;b.vx=0;b.vy=0;b.trail=[];this.followAttached(b);this.onEvent('sticky_catch',{x:b.x,y:b.y});return;}const relative=clamp((b.x-this.paddle.centerX)/(this.paddle.width/2),-1,1),angle=relative*CONFIG.maxBounceAngle;b.vx=Math.sin(angle)*b.speed;b.vy=-Math.cos(angle)*b.speed;b.y=this.paddle.y-b.radius-.05;this.onEvent('paddle_hit',{x:b.x,y:b.y});}
 else if(hit.target!=='wall'&&this.effects.fire>0&&hit.target.destructible){this.hitBrick(hit.target,{fire:true});if(hit.target.destroyed){if(this.state!==STATES.PLAYING)return;continue;}reflect(b,hit.nx,hit.ny);}
 else{reflect(b,hit.nx,hit.ny);if(hit.target==='wall')this.onEvent('wall_hit',{x:b.x,y:b.y});else this.hitBrick(hit.target);}
 b.x+=hit.nx*.02;b.y+=hit.ny*.02;
 // Keep a meaningful vertical component after corner reflections, conserving speed.
 if(Math.abs(b.vy)<b.speed*.18){b.vy=(Math.sign(b.vy)||-1)*b.speed*.18;b.vx=(Math.sign(b.vx)||1)*Math.sqrt(b.speed*b.speed-b.vy*b.vy);}
 if(this.state!==STATES.PLAYING)return;
 }
 b.trail.push({x:b.x,y:b.y});if(b.trail.length>20)b.trail.shift();if(b.y-b.radius>CONFIG.height)b.active=false;
 }
 nextDropType(){const intro=['extend','laser','multi','fire','sticky','slow','life'];const i=this.dropIndex++;return i<intro.length?intro[i]:Object.keys(POWERUP_TYPES)[Math.floor(Math.random()*Object.keys(POWERUP_TYPES).length)];}
 hitBrick(brick,{fire=false}={}){if(brick.destroyed)return;if(fire&&brick.destructible)brick.hp=1;const result=brick.hit();this.onEvent(brick.type===3?'steel_hit':result.destroyed?'brick_break':'brick_hit',{x:brick.x+brick.width/2,y:brick.y+brick.height/2,color:brick.color});
 if(result.destroyed){this.score.addScore(result.points,{brickType:brick.type});this.destroyedCount++;if(brick.type===4||brick.bonusDrop){this.powerups.push(new PowerUp(brick.x+brick.width/2,brick.y+brick.height/2,this.nextDropType()));this.onEvent('powerup_spawn',{});}for(const b of this.balls)b.setSpeed(this.currentSpeed());if(this.bricks.every(b=>!b.destructible||b.destroyed)){this.transition(STATES.LEVEL_CLEAR);this.onEvent('level_clear',{level:this.level});}}}
}
