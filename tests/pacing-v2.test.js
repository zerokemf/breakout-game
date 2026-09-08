import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../js/game.js';
import {CONFIG} from '../js/config.js';
import {LEVELS} from '../js/levels.js';
const playing=(level=1)=>{const g=new Game();g.start(level);g.launch();return g;};
const kill=(g,b)=>{while(!b.destroyed)g.hitBrick(b);};
const wait=(g,seconds)=>{const b=g.balls[0];Object.assign(b,{attached:true,active:false});for(let i=0;i<Math.round(seconds*120);i++)g.update(1/120);};
test('burst coalesces to one pending, releases at eight simulation seconds, pause freezes',()=>{
 const g=playing(9),bricks=g.bricks.filter(b=>b.type===4);for(const b of bricks.slice(0,10))kill(g,b);
 assert.equal(g.powerups.length,1);assert.equal(g.dropIndex,1);assert.ok(g.pendingDrop&&!Array.isArray(g.pendingDrop));
 g.pause();const clock=g.dropCooldown;for(let i=0;i<300;i++)g.update(.05);assert.equal(g.dropCooldown,clock);assert.equal(g.dropIndex,1);g.resume();
 wait(g,7.9);assert.equal(g.dropIndex,1);wait(g,.1);assert.equal(g.dropIndex,2);assert.equal(g.powerups.at(-1).type,'laser');assert.equal(g.pendingDrop,null);
 wait(g,16);assert.equal(g.dropIndex,2);kill(g,bricks[10]);assert.equal(g.powerups.at(-1).type,'multi');
});
test('max two falling; spent budget survives death; READY and menu never release pending',()=>{
 const g=playing(9),bricks=g.bricks.filter(b=>b.type===4);kill(g,bricks[0]);
 g.powerups.push({active:true,update:()=>false});g.powerups[0].update=()=>false;
 kill(g,bricks[1]);wait(g,8);assert.equal(g.dropIndex,1);assert.equal(g.powerups.length,2);
 g.powerups[0].active=false;wait(g,.05);assert.equal(g.dropIndex,2);assert.equal(g.powerups.length,2);
 kill(g,bricks[2]);g.loseLife();assert.equal(g.pendingDrop,null);assert.equal(g.dropCooldown,0);assert.equal(g.dropsSpawned,2);assert.equal(g.dropIndex,2);
 const index=g.dropIndex;kill(g,bricks[3]);wait(g,10);assert.equal(g.dropIndex,index);assert.equal(g.pendingDrop,null);
 g.transition('MENU');kill(g,bricks[4]);g.update(.05);assert.equal(g.dropIndex,index);
 g.start(9);g.launch();for(const b of g.bricks.filter(b=>b.type===4)){kill(g,b);g.powerups=[];wait(g,8);}assert.equal(g.dropsSpawned,LEVELS[8].dropBudget);assert.equal(g.pendingDrop,null);
});
test('level clear discards pending; level load resets budget and preserves introduction',()=>{
 const g=playing();for(const b of g.bricks)if(b.destructible)kill(g,b);
 assert.equal(g.state,'LEVEL_CLEAR');assert.equal(g.pendingDrop,null);assert.equal(g.dropIndex,1);
 g.nextLevel();assert.equal(g.dropsSpawned,0);assert.equal(g.dropCooldown,0);assert.equal(g.dropIndex,1);
});
test('extend is life-bound, survives nextLevel without duplicate pickup, restart and death clear it',()=>{
 const events=[];const g=new Game({onEvent:name=>events.push(name)});g.start();g.launch();g.applyPowerup('extend');
 g.tickEffects(600);assert.equal(g.effects.extend,Infinity);assert.equal(g.paddle.width,CONFIG.paddleWidth*1.5);
 g.transition('LEVEL_CLEAR');g.nextLevel();assert.equal(g.effects.extend,Infinity);assert.equal(g.paddle.width,CONFIG.paddleWidth*1.5);
 assert.equal(events.filter(n=>n==='powerup_pickup').length,1);
 g.start();assert.equal(g.effects.extend,0);assert.equal(g.paddle.width,CONFIG.paddleWidth);
 g.launch();g.applyPowerup('extend');g.loseLife();assert.equal(g.effects.extend,0);
 g.launch();g.applyPowerup('extend');g.lives=1;g.loseLife();assert.equal(g.effects.extend,0);assert.equal(g.paddle.width,CONFIG.paddleWidth);
});
