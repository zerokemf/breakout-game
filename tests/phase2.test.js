import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../js/game.js';
import {Brick} from '../js/brick.js';
import {POWERUP_TYPES} from '../js/powerup.js';
const playing=()=>{const g=new Game();g.start();g.launch();return g;};
test('special audio events fire at activation, shot and sticky catch',()=>{
 const events=[];const g=new Game({onEvent:(name,data)=>events.push({name,...data})});g.start();g.launch();g.bricks=[];
 g.applyPowerup('fire');assert.equal(events.filter(e=>e.name==='fire_activate').length,1);
 g.applyPowerup('laser');for(let i=0;i<7;i++)g.update(.05);assert.equal(events.filter(e=>e.name==='laser_shot').length,1);
 g.applyPowerup('sticky');const b=g.balls[0];Object.assign(b,{x:g.paddle.centerX,y:g.paddle.y-b.radius-2,vx:0,vy:440});g.update(.02);
 assert.equal(events.filter(e=>e.name==='sticky_catch').length,1);
});
test('attached balls follow even on zero-delta pointer updates and remain alive when inactive',()=>{
 const g=playing(),b=g.balls[0];Object.assign(b,{attached:true,active:false,attachOffset:20,vx:0,vy:0});
 g.setPointer(300);g.update(0);near(b.x,320);g.update(.02);assert.equal(g.balls.length,1);assert.equal(g.lives,3);
});
test('multi rotates actual horizontal direction and preserves slow speed',()=>{
 const g=playing();g.applyPowerup('slow');const b=g.balls[0];b.vx=b.speed;b.vy=0;g.applyPowerup('multi');
 near(g.balls[1].vy,-b.speed*.5);near(g.balls[2].vy,b.speed*.5);for(const ball of g.balls)near(Math.hypot(ball.vx,ball.vy),352);
});
test('sticky catches descending balls alive, follows paddle, launch and expiry release',()=>{
 const g=playing();g.applyPowerup('sticky');assert.equal(g.effects.sticky,12);const b=g.balls[0];
 Object.assign(b,{x:g.paddle.centerX+30,y:g.paddle.y-b.radius-2,vx:0,vy:440});g.update(.02);
 assert.equal(b.attached,true);near(b.attachOffset,30);assert.equal(g.lives,3);assert.equal(g.state,'PLAYING');
 near(b.vx,0);near(b.vy,0);g.setPointer(400);g.update(.02);near(b.x,430);near(b.y,g.paddle.y-b.radius-1);
 g.applyPowerup('multi');assert.equal(g.balls.length,3);for(const other of g.balls)if(other!==b){assert.equal(other.attached,true);Object.assign(other,{attached:false,active:true,y:750,vy:440});}g.update(.02);
 assert.equal(g.lives,3);assert.equal(g.balls.length,1);assert.equal(b.attached,true);
 g.launch();assert.equal(b.attached,false);assert.equal(b.active,true);assert.ok(b.vy<0);near(Math.hypot(b.vx,b.vy),b.speed);
 Object.assign(b,{x:g.paddle.centerX,y:g.paddle.y-b.radius-2,vx:0,vy:b.speed});g.update(.02);assert.equal(b.attached,true);
 g.tickEffects(12);assert.equal(g.effects.sticky,0);assert.equal(b.attached,false);assert.ok(b.vy<0);near(Math.hypot(b.vx,b.vy),b.speed);
});
test('ten distinctive pickups; pause freezes complete simulation; resetReady clears effects and bolts',()=>{
assert.deepEqual(Object.keys(POWERUP_TYPES).sort(),['blast','extend','fire','laser','life','magnet','multi','shield','slow','sticky']);
for(const key of ['label','icon','color'])assert.equal(new Set(Object.values(POWERUP_TYPES).map(v=>v[key])).size,10);
 const g=playing();for(const type of Object.keys(POWERUP_TYPES))g.applyPowerup(type);
 for(let i=0;i<7;i++)g.update(.05);assert.ok(g.bolts.length>0);
 g.pause();const snapshot=JSON.stringify({balls:g.balls,bolts:g.bolts,effects:g.effects,paddle:g.paddle,elapsed:g.elapsed,clock:g.laserClock,powerups:g.powerups,bricks:g.bricks});
 g.setPointer(100);g.launch();g.update(.05);
 assert.equal(JSON.stringify({balls:g.balls,bolts:g.bolts,effects:g.effects,paddle:g.paddle,elapsed:g.elapsed,clock:g.laserClock,powerups:g.powerups,bricks:g.bricks}),snapshot);
 g.resume();g.resetReady();assert.deepEqual(g.effects,{extend:0,slow:0,fire:0,laser:0,sticky:0,magnet:0});assert.deepEqual(g.bolts,[]);assert.equal(g.laserClock,0);assert.equal(g.balls.length,1);assert.equal(g.balls[0].attached,false);
 const demo=new Game();assert.deepEqual(demo.bolts,[]);demo.start(1);demo.update(.05);demo.launch();demo.update(.05);assert.equal(demo.state,'PLAYING');
});
test('laser fires dual swept bolts every .35s for 12s; nearest steel blocks and strong takes two',()=>{
 const g=playing();g.bricks=[];g.applyPowerup('laser');assert.equal(g.effects.laser,12);
 for(let i=0;i<6;i++)g.update(.05);assert.equal(g.bolts.length,0);g.update(.05);assert.equal(g.bolts.length,2);
 for(const bolt of g.bolts){assert.equal(bolt.vx,0);assert.equal(bolt.vy,-950);assert.equal(bolt.radius,3);assert.equal(bolt.active,true);}
 assert.ok(g.bolts[0].x<g.paddle.centerX&&g.bolts[1].x>g.paddle.centerX);
 for(let i=0;i<7;i++)g.update(.05);assert.equal(g.bolts.length,4);
 const strong=new Brick(2,400,350,100,20),steel=new Brick(3,400,420,100,20),far=new Brick(1,400,280,100,20);
 g.bricks=[far,strong,steel,new Brick(1,900,100,60,20)];
 const shot=()=>({x:450,y:500,vx:0,vy:-950,radius:3,active:true});g.bolts=[shot()];g.moveBolts(.3);
 assert.equal(g.bolts.length,0);assert.equal(strong.hp,2);assert.equal(g.score.getScore(),0);
 g.bricks=g.bricks.filter(b=>b!==steel);g.applyPowerup('fire'); // fire must not amplify laser damage
 g.bolts=[shot()];g.moveBolts(.3);assert.equal(strong.hp,1);assert.equal(g.score.getScore(),0);assert.equal(far.destroyed,false);
 g.bolts=[shot(),shot()];g.moveBolts(.3);assert.equal(strong.destroyed,true);assert.equal(far.destroyed,true);assert.equal(g.score.getScore(),300);
 g.hitBrick(strong);assert.equal(g.score.getScore(),300);g.tickEffects(12);assert.equal(g.effects.laser,0);
 g.bolts=[];g.update(.05);assert.equal(g.bolts.length,0);
});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('fire lasts 15s, penetrates normal and strong once, reflects steel without changing speed',()=>{
 const g=playing();g.applyPowerup('fire');assert.equal(g.effects.fire,15);
 const normal=new Brick(1,400,400,100,20),strong=new Brick(2,400,340,100,20),steel=new Brick(3,400,250,100,20);
 g.bricks=[normal,strong,steel,new Brick(1,900,100,60,20)];
 const b=g.balls[0];Object.assign(b,{x:450,y:450,vx:0,vy:-440});
 g.moveBall(b,.3);assert.equal(normal.destroyed,true);assert.equal(strong.destroyed,true);assert.ok(b.vy<0);near(Math.hypot(b.vx,b.vy),440);
 assert.equal(g.score.getScore(),300);assert.equal(g.destroyedCount,2);g.hitBrick(strong);assert.equal(g.score.getScore(),300);assert.equal(g.destroyedCount,2);
 g.moveBall(b,.15);assert.ok(b.vy>0);assert.equal(steel.destroyed,false);near(Math.hypot(b.vx,b.vy),440);
 g.tickEffects(15);assert.equal(g.effects.fire,0);
});
test('multi splits to three then caps at six without scoring; pickup identifies type',()=>{
 const events=[];const g=new Game({onEvent:(event,data)=>events.push([event,data])});g.start();g.launch();
 g.applyPowerup('multi');assert.equal(g.balls.length,3);
 assert.equal(new Set(g.balls.map(b=>Math.atan2(b.vy,b.vx))).size,3);
 for(const b of g.balls){assert.equal(b.active,true);near(Math.hypot(b.vx,b.vy),b.speed);}
 g.applyPowerup('multi');g.applyPowerup('multi');assert.equal(g.balls.length,6);assert.equal(g.score.getScore(),0);
 assert.equal(events.at(-1)[0],'powerup_pickup');assert.equal(events.at(-1)[1].type,'multi');
 for(const b of g.balls)b.y=750;g.update(.02);assert.equal(g.lives,2);assert.equal(g.balls.length,1);assert.equal(g.state,'READY');
});
