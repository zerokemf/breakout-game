import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../js/game.js';import {Brick,buildBricks} from '../js/brick.js';import {PowerUp} from '../js/powerup.js';import {LEVELS,LEVEL_MAX_SCORES} from '../js/levels.js';
const advance=(g,s)=>{for(let t=0;t<s-1e-9;t+=1/120)g.update(Math.min(1/120,s-t));};
const clear=g=>{for(const b of g.bricks)if(b.destructible)while(!b.destroyed)g.hitBrick(b);};
test('campaign automatically advances all ten levels, retains actors/effects/rewards and finishes normally',()=>{
 const events=[];const g=new Game({onEvent:(name,data)=>events.push({name,data})});g.start();g.launch();const ball=g.balls[0],paddle=g.paddle;
 g.collectPowerup('shield');g.collectPowerup('blast');g.applyPowerup('extend');g.applyPowerup('sticky');g.applyPowerup('slow');g.applyPowerup('magnet');g.applyPowerup('shield');g.applyPowerup('blast');
 let total=0;
 for(let level=1;level<=10;level++){
  Object.assign(ball,{x:30,y:500,vx:0,vy:0,attached:true,active:true});clear(g);total+=LEVEL_MAX_SCORES[level-1];assert.equal(g.score.getScore(),total);assert.equal(g.state,'LEVEL_CLEAR');
  const pickups=g.powerups,first=pickups.at(-1),before=g.effects.sticky;for(const item of pickups)item.y=-1000; // isolate carry-over from collection/expiry (tested separately)
  advance(g,.79);assert.equal(g.level,level);assert.equal(g.state,'LEVEL_CLEAR');assert.ok(g.effects.sticky<before);
  advance(g,.02);assert.equal(events.filter(e=>e.name==='level_clear').length,level);
  if(level<10){assert.equal(g.level,level+1);assert.equal(g.state,'PLAYING');assert.equal(g.balls[0],ball);assert.equal(g.paddle,paddle);assert.equal(g.effects.extend,Infinity);assert.deepEqual(g.inventory,['shield','blast']);assert.ok(g.powerups.includes(first));assert.equal(g.shield,true);}
  else{assert.equal(g.state,'GAME_OVER');assert.deepEqual(g.inventory,[null,null]);assert.equal(events.filter(e=>e.name==='game_over').length,1);}
 }
});
test('clear state continues ball movement and pickup collection; pause freezes pending transition',()=>{
 const g=new Game();g.start();g.launch();const b=g.balls[0];Object.assign(b,{x:30,y:400,vx:0,vy:440});clear(g);
 g.powerups=[new PowerUp(g.paddle.centerX,g.paddle.y-18,'magnet')];advance(g,.1);assert.ok(b.y>400);assert.deepEqual(g.inventory,['magnet',null]);
 g.pause();assert.equal(g.state,'PAUSED');const y=b.y,time=g.levelClearTimer;advance(g,2);assert.equal(b.y,y);assert.equal(g.levelClearTimer,time);g.resume();assert.equal(g.state,'LEVEL_CLEAR');
 Object.assign(b,{attached:true,active:true});advance(g,.71);assert.equal(g.level,2);assert.equal(g.state,'PLAYING');
});
test('automatic spawn waits until every ball naturally exits candidate bricks without teleporting',()=>{
 const g=new Game();g.start();g.launch();clear(g);const b=g.balls[0],candidate=buildBricks(LEVELS[1])[0];Object.assign(b,{x:candidate.x+20,y:candidate.y+12,vx:0,vy:0});const pos=[b.x,b.y];
 advance(g,1);assert.equal(g.state,'LEVEL_CLEAR');assert.equal(g.level,1);assert.deepEqual([b.x,b.y],pos);
 Object.assign(b,{x:30,y:400,vy:440});advance(g,.01);assert.equal(g.state,'PLAYING');assert.equal(g.level,2);assert.equal(g.balls[0],b);assert.ok(b.y>400&&b.y<410);
});
test('last balls lost during clear lose only one life and resume on next board, never old cleared board',()=>{
 const g=new Game();g.start();g.launch();g.collectPowerup('blast');g.applyPowerup('extend');g.applyPowerup('multi');clear(g);for(const b of g.balls)Object.assign(b,{y:750,vy:440});advance(g,.05);
 assert.equal(g.lives,2);assert.deepEqual(g.inventory,['blast',null]);assert.equal(g.effects.extend,0);advance(g,1);assert.equal(g.level,2);assert.equal(g.state,'READY');assert.equal(g.lives,2);assert.ok(g.bricks.some(b=>b.destructible&&!b.destroyed));g.launch();advance(g,.05);assert.equal(g.state,'PLAYING');
});
test('a blast clearing the last adjacent bricks emits one fully scored completion event',()=>{
 let clears=0,scoreAtClear=0;const g=new Game({onEvent:name=>{if(name==='level_clear'){clears++;scoreAtClear=g.score.getScore();}}});g.start();g.launch();g.bricks=[new Brick(4,400,300,80,20),new Brick(4,490,300,80,20)];g.applyPowerup('blast');g.hitBrick(g.bricks[0]);
 assert.equal(clears,1);assert.equal(scoreAtClear,300);assert.equal(g.powerups.length,2);assert.equal(g.state,'LEVEL_CLEAR');
});
