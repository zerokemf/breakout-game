import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../js/game.js';
import {Brick} from '../js/brick.js';
import {Ball} from '../js/ball.js';
import {CONFIG} from '../js/config.js';
import {POWERUP_TYPES} from '../js/powerup.js';
import {sweepCircleRect} from '../js/physics.js';
const setup=()=>{const events=[];const g=new Game({onEvent:(name,data)=>events.push({name,...data})});g.start();g.launch();g.bricks=[];return {g,events};};
test('charge thresholds, cancellation and cooldown freeze with paused projectiles',()=>{
 const {g,events}=setup();assert.deepEqual(g.charge,{active:false,elapsed:0,cooldown:0});
 assert.equal(g.beginCharge(),true);advance(g,.39);assert.equal(g.releaseCharge(),false);assert.equal(g.chargeShots.length,0);
 g.beginCharge();advance(g,.4);assert.equal(g.releaseCharge(),true);assert.equal(g.chargeShots[0].full,false);assert.equal(g.chargeShots[0].vy,-900);near(g.charge.cooldown,2);assert.equal(g.beginCharge(),false);
 g.pause();const snap=JSON.stringify([g.charge,g.chargeShots]);advance(g,1);assert.equal(JSON.stringify([g.charge,g.chargeShots]),snap);g.resume();
 g.charge.cooldown=0;g.beginCharge();advance(g,.1);g.pause();assert.equal(g.charge.active,false);assert.equal(g.charge.elapsed,0);g.resume();assert.equal(g.releaseCharge(),false);
 g.beginCharge();advance(g,1.6);near(g.charge.elapsed,1.5);assert.equal(g.releaseCharge(),true);near(g.charge.cooldown,4);assert.equal(events.filter(e=>e.name==='charge_fire').at(-1).full,true);
 g.resetReady();assert.equal(g.beginCharge(),false);assert.deepEqual(g.chargeShots,[]);g.launch();g.balls[0].attached=true;assert.equal(g.beginCharge(),false);
});
test('swept cannon partial damages nearest, full penetrates destructibles and destroys only first steel for zero points',()=>{
 const {g,events}=setup();const strong=new Brick(2,400,450,100,20),normal=new Brick(1,400,400,100,20),steel=new Brick(3,400,350,100,20),steel2=new Brick(3,400,300,100,20);g.bricks=[steel2,normal,steel,strong,new Brick(1,900,100,50,20)];
 const shot=full=>({x:450,y:550,vx:0,vy:-900,radius:5,active:true,full});
 g.chargeShots=[shot(false)];g.tickCharge(.4);assert.equal(strong.hp,1);assert.equal(normal.destroyed,false);assert.equal(g.chargeShots.length,0);
 g.chargeShots=[shot(true)];g.tickCharge(.4);assert.equal(strong.destroyed,true);assert.equal(normal.destroyed,true);assert.equal(steel.destroyed,true);assert.equal(steel2.destroyed,false);assert.equal(g.chargeShots.length,0);assert.equal(g.score.getScore(),300);assert.equal(g.destroyedCount,2);assert.equal(events.filter(e=>e.name==='steel_break').length,1);g.hitBrick(strong);assert.equal(g.score.getScore(),300);
 g.chargeShots=[shot(false)];g.tickCharge(.4);assert.equal(steel2.destroyed,false);assert.equal(g.score.getScore(),300);
});
test('guided inventory captures one ball, freezes paddle, clamps angle and launches without jumping',()=>{
 const {g}=setup();assert.equal(POWERUP_TYPES.aim.label,'GUIDED SHOT');g.collectPowerup('aim');assert.deepEqual(g.inventory,['aim',null]);g.activateSlot(0);assert.equal(g.aimArmed,true);assert.equal(g.aimingBall,null);
 const b=g.balls[0],other=new Ball(100,400);Object.assign(other,{active:true,vx:0,vy:-440});g.balls.push(other);Object.assign(b,{x:g.paddle.centerX+35,y:g.paddle.y-b.radius-2,vx:0,vy:440});g.update(.02);assert.equal(g.aimingBall,b);assert.equal(b.attached,true);assert.equal(other.attached,false);assert.ok(other.y<400);
 const pos=[b.x,b.y],center=g.paddle.centerX;g.setPointer(100);g.keys.add('ArrowRight');g.update(.05);assert.equal(g.paddle.centerX,center);assert.deepEqual([b.x,b.y],pos);g.setAim(b.x+1000,b.y);near(g.aimAngle,CONFIG.maxBounceAngle);assert.equal(g.beginCharge(),false);
 g.applyPowerup('sticky');g.tickEffects(12);assert.equal(b.attached,true);g.launch();assert.deepEqual([b.x,b.y],pos);assert.equal(g.aimingBall,null);assert.equal(g.aimArmed,false);near(b.vx,Math.sin(CONFIG.maxBounceAngle)*b.speed);assert.equal(b.attached,false);
 g.start();g.applyPowerup('multi');g.applyPowerup('aim');const chosen=g.aimingBall;assert.ok(chosen);g.setAim(chosen.x,0);g.launch();assert.ok(g.balls.every(b=>b.active&&!b.attached));near(chosen.vx,0);
 g.applyPowerup('aim');g.loseLife();assert.equal(g.aimArmed,false);assert.equal(g.aimingBall,null);
});
test('guided preview shares exact corner CCD and wall reflection with actual flight, fire ignores penetrable bricks',()=>{
 const g=new Game();g.start();g.setPointer(450);g.update(0);g.applyPowerup('aim');g.setAim(450,0);const b=g.aimingBall,brick=new Brick(3,400,400,100,20);g.bricks=[brick];
 const path=g.getAimPath();assert.equal(path.length,3);assert.deepEqual(path[0],{x:b.x,y:b.y});const h=sweepCircleRect({...b,vx:0,vy:-b.speed},brick,10);near(path[1].y,b.y-b.speed*h.t);assert.ok(path[2].y>path[1].y);g.launch();g.moveBall(b,h.t);near(b.y,path[1].y+.02);assert.ok(b.vy>0);
 g.start();g.bricks=[];g.applyPowerup('aim');g.setAim(5000,0);const wall=g.getAimPath();near(wall[1].x,CONFIG.width-b.radius);assert.ok(wall[2].x<wall[1].x);
 g.start();g.applyPowerup('aim');g.setAim(640,0);g.bricks=[new Brick(1,600,400,80,20),new Brick(3,600,300,80,20)];g.applyPowerup('fire');const fire=g.getAimPath();near(fire[1].y,329);assert.equal(g.bricks[0].destroyed,false);assert.equal(g.score.getScore(),0);
 const selected=g.aimingBall;g.transition('LEVEL_CLEAR');g.nextLevel();assert.equal(g.aimingBall,selected);g.launch();assert.equal(g.aimArmed,false);
});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
const advance=(g,s)=>{for(let t=0;t<s-1e-9;t+=1/240)g.update(Math.min(1/240,s-t));};
test('extend stacks three life-bound tiers, then converts overflow into one shield',()=>{
 const {g,events}=setup();assert.equal(g.extendTier,0);
 for(const [tier,width] of [[1,255],[2,306],[3,357],[3,357]]){g.applyPowerup('extend');assert.equal(g.extendTier,tier);near(g.paddle.width,width);assert.equal(g.effects.extend,Infinity);}
 assert.equal(g.shield,true);assert.equal(events.filter(e=>e.name==='paddle_upgrade').length,3);
 g.transition('LEVEL_CLEAR');g.nextLevel();assert.equal(g.extendTier,3);near(g.paddle.width,357);
 g.loseLife();assert.equal(g.extendTier,0);near(g.paddle.width,170);assert.equal(g.shield,false);
 g.applyPowerup('extend');g.start();assert.equal(g.extendTier,0);
});
