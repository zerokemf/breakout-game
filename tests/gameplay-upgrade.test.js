import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../js/game.js';
import {PowerUp,POWERUP_TYPES} from '../js/powerup.js';
import {Brick,buildBricks} from '../js/brick.js';
import {Ball} from '../js/ball.js';
import {LEVELS} from '../js/levels.js';
import {CONFIG} from '../js/config.js';
const setup=(level=1)=>{const events=[];const g=new Game({onEvent:(name,data)=>events.push({name,data})});g.start(level);g.launch();return {g,events};};
const advance=(g,seconds)=>{for(let t=0;t<seconds-1e-9;t+=1/120)g.update(Math.min(1/120,seconds-t));};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
test('blast consumes one charge, damages neighbors once, excludes steel and far bricks',()=>{
 const {g,events}=setup();g.applyPowerup('blast');g.applyPowerup('blast');assert.equal(g.blastCharges,1);assert.equal(g.effects.blast,undefined);
 const center=new Brick(1,400,300,80,20),strong=new Brick(2,490,300,80,20),normal=new Brick(4,310,300,80,20),steel=new Brick(3,400,340,80,20),far=new Brick(1,650,300,80,20);
 g.bricks=[center,strong,normal,steel,far];g.hitBrick(center);
 assert.equal(g.blastCharges,0);assert.equal(strong.hp,1);assert.equal(normal.destroyed,true);assert.equal(steel.hp,Infinity);assert.equal(far.destroyed,false);assert.equal(g.score.getScore(),250);
 g.hitBrick(center);g.hitBrick(normal);assert.equal(g.score.getScore(),250);assert.equal(events.filter(e=>e.name==='blast_hit').length,1);
 g.bolts=[{x:530,y:360,vx:0,vy:-950,radius:3,active:true},{x:530,y:360,vx:0,vy:-950,radius:3,active:true}];g.moveBolts(.1);assert.equal(g.score.getScore(),450);
 g.applyPowerup('blast');g.loseLife();assert.equal(g.blastCharges,0);g.applyPowerup('blast');g.start();assert.equal(g.blastCharges,0);
});
test('all ten powerups are introduced without repeats after the first extend laser multi',()=>{
 const {g}=setup();const intro=Array.from({length:10},()=>g.nextDropType());assert.deepEqual(intro,['extend','laser','multi','fire','shield','magnet','blast','sticky','slow','life']);
 for(const key of ['label','color','icon'])assert.equal(new Set(Object.values(POWERUP_TYPES).map(p=>p[key])).size,10);
});
test('magnet smoothly attracts pickups for twelve simulation seconds, pause and READY freeze it',()=>{
 const {g}=setup();g.bricks=[];g.applyPowerup('magnet');assert.equal(g.effects.magnet,12);
 const p=new PowerUp(100,300,'shield');g.powerups=[p];const y=p.y;g.update(.05);
 assert.ok(p.x>100&&p.x<g.paddle.centerX);near(p.y,y+155*.05);near(g.effects.magnet,11.95);
 g.pause();const x=p.x;g.update(.05);assert.equal(p.x,x);near(g.effects.magnet,11.95);g.resume();
 g.tickEffects(12);g.update(.05);assert.equal(p.x,x);assert.equal(g.effects.magnet,0);
 g.start();g.collectPowerup('magnet');g.activateSlot(0);advance(g,1);assert.equal(g.effects.magnet,12);g.launch();g.loseLife();assert.equal(g.effects.magnet,0);
});
test('shield is one shared floor bounce, not a timer, then ordinary loss resumes',()=>{
 const {g,events}=setup();g.bricks=[];g.applyPowerup('shield');assert.equal(g.shield,true);assert.equal(g.effects.shield,undefined);
 const b=g.balls[0];Object.assign(b,{x:100,y:CONFIG.height-b.radius-1,vx:30,vy:440});g.moveBall(b,.02);
 assert.equal(g.shield,false);assert.ok(b.vy<0);assert.equal(b.active,true);assert.equal(events.filter(e=>e.name==='shield_hit').length,1);
 Object.assign(b,{y:CONFIG.height-b.radius-1,vy:440});g.update(.05);assert.equal(g.lives,2);assert.equal(g.state,'READY');
 g.applyPowerup('shield');g.launch();g.loseLife();assert.equal(g.shield,false);
 g.applyPowerup('shield');g.start();assert.equal(g.shield,false);
});
test('inventory survives deaths, active effects clear even on final death, new run clears slots',()=>{
 const {g}=setup();g.collectPowerup('slow');g.collectPowerup('fire');
 for(const lives of [3,1]){
  g.lives=lives;for(const type of ['extend','slow','fire','laser','sticky'])g.applyPowerup(type);
  g.loseLife();assert.deepEqual(g.inventory,lives>1?['slow','fire']:[null,null]);assert.ok(Object.values(g.effects).every(v=>v===0));assert.equal(g.paddle.width,CONFIG.paddleWidth);
  if(lives>1)g.launch();
 }
 g.start();assert.deepEqual(g.inventory,[null,null]);
});
test('slot activation validates state/index and READY multi waits with paddle until launch',()=>{
 const g=new Game();g.start();g.collectPowerup('multi');
 for(const state of ['PAUSED','MENU','LEVEL_CLEAR','GAME_OVER']){g.transition(state);assert.equal(g.activateSlot(0),false);assert.equal(g.inventory[0],'multi');}
 g.transition('READY');for(const index of [-1,2,.5,'0',NaN])assert.equal(g.activateSlot(index),false);
 assert.equal(g.activateSlot(0),true);assert.equal(g.balls.length,3);assert.equal(g.activateSlot(0),false);
 g.setPointer(350);g.update(.05);for(const b of g.balls){assert.equal(b.active,false);assert.equal(b.x,g.paddle.centerX);assert.equal(b.y,g.paddle.y-b.radius-1);}
 g.launch();assert.equal(g.balls.length,3);assert.ok(g.balls.every(b=>b.active&&!b.attached&&b.vy<0));assert.equal(new Set(g.balls.map(b=>Math.atan2(b.vy,b.vx))).size,3);
});
test('caught rewards fill first empty inventory slot; full slots autoactivate; life is immediate',()=>{
 const {g,events}=setup();assert.deepEqual(g.inventory,[null,null]);
 for(const type of ['extend','slow','fire','life']){
  g.powerups.push(new PowerUp(g.paddle.centerX,g.paddle.y-18,type));g.update(.02);
 }
 assert.deepEqual(g.inventory,['extend','slow']);assert.equal(g.effects.extend,0);assert.equal(g.effects.slow,0);assert.ok(g.effects.fire>14);assert.equal(g.lives,4);
 for(const [name,type] of [['inventory_stored','extend'],['inventory_stored','slow'],['inventory_full','fire']]){
  const e=events.find(e=>e.name===name&&e.data.type===type);assert.ok(e);assert.equal(e.data.label,POWERUP_TYPES[type].label);assert.equal(e.data.color,POWERUP_TYPES[type].color);
 }
 assert.equal(events.filter(e=>e.name==='powerup_pickup').length,2);
 assert.equal(events.at(-2).name,'inventory_full');
 assert.equal(g.activateSlot(0),true);assert.deepEqual(g.inventory,[null,'slow']);assert.equal(g.effects.extend,Infinity);
 const use=events.find(e=>e.name==='inventory_use');assert.equal(use.data.type,'extend');assert.equal(use.data.label,POWERUP_TYPES.extend.label);assert.equal(use.data.color,POWERUP_TYPES.extend.color);
 g.collectPowerup('sticky');assert.deepEqual(g.inventory,['sticky','slow']);
});
