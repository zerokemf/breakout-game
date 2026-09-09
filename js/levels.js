// 0 empty / 1 normal / 2 strong / 3 steel / 4 power. Eleven columns.
const definitions=[
 ['FIRST CONTACT',['11111111111','11111111111','11411111411','11111111111']],
 ['NEON PYRAMID',['00000400000','00001110000','00011211000','00111111100','01141114110','11111111111']],
 ['CROSS CURRENT',['41000000014','01100000110','00110001100','00012121000','00001210000','00011111000','00110001100']],
 ['THE HOLLOW',['11111111111','12411111421','12000000021','11000000011','12000000021','14111111141']],
 ['DOUBLE IMPACT',['22222222222','11111111111','24222222422','01111111110','00222222200']],
 ['IRON GATES',['11114141111','11311111311','11312221311','11314441311','00311111300','00111111100']],
 ['SYNTH CIRCUIT',['20411111402','21130103112','01420102410','11031113011','21214141212','01111111110']],
 ['HARDWIRED',['22224242222','02222222220','20222222202','22022222022','22202220222','22220202222']],
 ['POWER SURGE',['41414141414','12121212121','40141414104','11311111311','41422222414','11114141111']],
 ['FINAL FREQUENCY',['22422222422','21321112312','22422222422','21223232212','22421212422','03222222230','21241414212']]
];
// Metadata only: never change the scoring grid. Evenly spaced rows with
// alternating column targets provide an early lower pickup and later discoveries.
export const LEVELS=definitions.map(([name,rows],i)=>{
 const grid=rows.map(row=>[...row].map(Number));
 const count=grid.flat().filter(t=>t&&t!==3).length;
 const originalDrops=grid.flat().filter(t=>t===4).length;
 // Existing type-4 cells (notably POWER SURGE) stay intact and retain scores.
 const dropBudget=Math.max(originalDrops,Math.max(5,Math.min(9,Math.round(count/8))));
 const candidates=grid.flatMap((row,y)=>row.some(t=>t===1||t===2)?[y]:[]);
 const bonusCount=Math.min(candidates.length,dropBudget-originalDrops);
 const bonusDropCells=Array.from({length:bonusCount},(_,n)=>{
  const y=candidates[bonusCount===1?candidates.length-1:Math.round(n*(candidates.length-1)/(bonusCount-1))];
  const target=[2,8,5][(n+i)%3];
  const columns=grid[y].flatMap((t,x)=>t===1||t===2?[x]:[]);
  const x=columns.reduce((best,x)=>Math.abs(x-target)<Math.abs(best-target)?x:best);
  return [y,x];
 });
 return {id:i+1,name,grid,dropBudget,bonusDropCells};
});
export const LEVEL_MAX_SCORES=LEVELS.map(l=>l.grid.flat().reduce((sum,t)=>sum+({1:100,2:200,4:150}[t]||0),0));
export const CUMULATIVE_MAX_SCORES=LEVEL_MAX_SCORES.map((_,i)=>LEVEL_MAX_SCORES.slice(0,i+1).reduce((a,b)=>a+b,0));
