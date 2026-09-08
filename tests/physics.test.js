import test from 'node:test';
import assert from 'node:assert/strict';
const load=()=>import('../js/physics.js').catch(()=>({}));
test('swept circle intercepts a thin brick at high speed with a top normal',async()=>{
 const {sweepCircleRect}=await load(); assert.equal(typeof sweepCircleRect,'function','swept collision must be implemented');
 const h=sweepCircleRect({x:50,y:0,radius:5,vx:0,vy:2000},{x:0,y:50,width:100,height:16},.1);
 assert.ok(h);assert.ok(Math.abs(h.t-.0225)<1e-8);assert.equal(h.ny,-1);
});
