import test from 'node:test';
import assert from 'node:assert/strict';
import {Renderer} from '../js/renderer.js';
import {buildBricks} from '../js/brick.js';
import {AudioManager} from '../js/audio.js';

function fixture(){
 const calls=[];
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})}, {get:(o,k)=>k in o?o[k]:(...args)=>calls.push([k,...args,o.fillStyle]),set:(o,k,v)=>(o[k]=v,true)});
 const particles={burst(){},update(){},render(){}};
 return {renderer:new Renderer({getContext:()=>ctx},particles),calls};
}
const scene=()=>({level:1,bricks:[],powerups:[],paddle:{x:500,y:650,width:140,height:18},balls:[],bolts:[],effects:{}});
test('disabled shake clears an existing impulse immediately, including mutable settings while paused',()=>{
 const {renderer:r,calls}=fixture(),settings={screenShake:true};
 r.event('lose_life',{},settings);settings.screenShake=false;
 r.render(scene());assert.equal(r.shake,0);assert.equal(calls.filter(c=>c[0]==='translate').length,0);
 settings.screenShake=true;r.event('lose_life',{},settings);
 r.event('wall_hit',{}, {screenShake:false});assert.equal(r.shake,0);
 r.event('level_clear',{}, {screenShake:true,reducedMotion:true});assert.equal(r.shake,0);
});
test('normal brick hues vary by row, column and level, while steel and power stay recognizable',()=>{
 const grid=Array.from({length:5},()=>[1,1,1,2,3,4]);
 const a=buildBricks({id:1,grid}),b=buildBricks({id:2,grid});
 assert.ok(new Set(a.filter(b=>b.type===1).map(b=>b.color)).size>=10);
 assert.notEqual(a[0].color,b[0].color);
 assert.equal(a[4].color,b[4].color);assert.equal(a[5].color,b[5].color);
 const strong=a[3];strong.hit();assert.equal(strong.hp,1);assert.equal(strong.destroyed,false);
});
test('fire keeps a white ball core; laser, sticky and extend add readable paddle feedback',()=>{
 const {renderer:r,calls}=fixture(),g=scene();
 g.effects={fire:5,laser:5,sticky:5,extend:5};
 g.balls=[{x:600,y:400,radius:8,trail:[{x:590,y:420},{x:595,y:410}],attached:false}];
 g.bolts=[{x:520,y:350,vx:0,vy:-800,radius:3,active:true},{x:540,y:350,radius:3,active:false}];
 r.render(g);
 assert.ok(calls.some(c=>c[0]==='fill'&&c.at(-1)==='#ff934f'),'warm fire trail');
 assert.ok(calls.some(c=>c[0]==='fill'&&c.at(-1)==='#fff'),'white core');
 assert.ok(calls.some(c=>c[0]==='fillRect'&&c[1]===517&&c.at(-1)==='#fff4cf'),'active bolt');
 assert.ok(!calls.some(c=>c[0]==='fillRect'&&c[1]===537&&c.at(-1)==='#fff4cf'),'inactive bolt absent');
 assert.ok(calls.some(c=>c[0]==='fillRect'&&c.at(-1)==='#8ff0b0'),'sticky lip');
 assert.equal(calls.filter(c=>c[0]==='roundRect'&&c[2]===638&&c[3]===10).length,2,'dual barrels');
 assert.ok(calls.some(c=>c[0]==='roundRect'&&c[1]===496&&c[3]===148),'extend outline');
});
test('attached ball shows release hint, minimal scenes allow null effects',()=>{
 const {renderer:r,calls}=fixture(),g=scene();g.effects=null;g.balls=[{x:550,y:640,radius:8,attached:true}];
 r.render(g);assert.ok(calls.some(c=>c[0]==='fillText'&&c[1]==='SPACE / TAP TO RELEASE'));
});
test('strong bricks have large durability dots and a high contrast crack after damage',()=>{
 const {renderer:r,calls}=fixture(),g=scene();g.bricks=buildBricks({grid:[[2,3,4]]});
 r.render(g);assert.equal(calls.filter(c=>c[0]==='arc'&&c[3]===3.5).length,2);
 calls.length=0;g.bricks[0].hit();r.render(g);
 assert.ok(calls.some(c=>c[0]==='lineTo'&&c[2]===g.bricks[0].y+g.bricks[0].height));
 assert.ok(calls.some(c=>c[0]==='fillText'&&c[1]==='★'));
});
test('laser shot, fire activation and sticky catch have distinct synthesized cues',()=>{
 const audio=new AudioManager();audio.context={state:'running',currentTime:0};audio.sfxBus={};
 const signatures=[];
 for(const event of ['laser_shot','fire_activate','sticky_catch']){const notes=[];audio._tone=(...args)=>notes.push(args.slice(1));audio.play(event);assert.ok(notes.length>0,event);signatures.push(JSON.stringify(notes));}
 assert.equal(new Set(signatures).size,3);
});
test('minimal renderer state tolerates absent collections and null effects',()=>{
 const {renderer:r}=fixture();assert.doesNotThrow(()=>r.render({paddle:scene().paddle,effects:null}));
});
test('all five timed effect indicators fit within the canvas',()=>{
 const {renderer:r,calls}=fixture(),g=scene();g.effects={extend:15,slow:10,fire:15,laser:12,sticky:12};r.render(g);
 const labels=calls.filter(c=>c[0]==='fillText'&&/\d+\.\ds$/.test(c[1]));assert.equal(labels.length,5);
 for(const c of labels){assert.ok(c[2]>=0);assert.ok(c[2]+c[4]<=1280);}
});
const pickup=type=>({type,x:100,y:200,color:'#ffeeaa',label:type});
test('routine contacts never initiate shake; only selected milestones shake without accumulation',()=>{
 const {renderer:r}=fixture(),settings={screenShake:true};
 for(const name of ['brick_break','brick_hit','wall_hit','paddle_hit','steel_hit','laser_hit','laser_shot','high_score']){r.event(name,{},settings);assert.equal(r.shake,0,name);}
 for(const type of ['extend','slow','life','laser','sticky']){r.event('powerup_pickup',pickup(type),settings);assert.equal(r.shake,0,type);}
 for(const type of ['multi','fire']){r.event('powerup_pickup',pickup(type),settings);assert.equal(r.shake,.12);r.event('powerup_pickup',pickup(type),settings);assert.equal(r.shake,.12);r.update(.2);assert.equal(r.shake,0);}
 r.event('lose_life',{},settings);assert.equal(r.shake,.2);
 r.event('level_clear',{},settings);assert.equal(r.shake,.25);
});
