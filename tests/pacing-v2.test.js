import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../js/game.js';
import {CONFIG} from '../js/config.js';
import {LEVELS} from '../js/levels.js';
const playing=(level=1)=>{const g=new Game();g.start(level);g.launch();return g;};
const kill=(g,b)=>{while(!b.destroyed)g.hitBrick(b);};
test('each marked brick drops immediately even in a burst above the old budget',()=>{
 const g=playing(9),bricks=g.bricks.filter(b=>b.dropEligible);
 for(const [i,b] of bricks.entries()){
  kill(g,b);assert.equal(g.powerups.length,i+1);assert.equal(g.dropIndex,i+1);
  assert.equal(g.powerups[i].x,b.x+b.width/2);assert.equal(g.powerups[i].y,b.y+b.height/2);
  g.hitBrick(b);assert.equal(g.powerups.length,i+1);
 }
 assert.ok(bricks.length>9);assert.equal(g.dropsSpawned,bricks.length);
});
test('last marked brick drops before level clear without discarding falling rewards',()=>{
 const g=playing();const final=g.bricks.find(b=>b.dropEligible);g.bricks=[final];
 kill(g,final);assert.equal(g.state,'LEVEL_CLEAR');assert.equal(g.powerups.length,1);
 assert.equal(g.powerups[0].type,'extend');
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
