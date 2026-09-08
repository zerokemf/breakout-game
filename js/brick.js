export const BRICK_TYPES=Object.freeze({1:{hp:1,points:100,color:'#38def6'},2:{hp:2,points:200,color:'#b68cff'},3:{hp:Infinity,points:0,color:'#71859f'},4:{hp:1,points:150,color:'#ffbe55'}});
export class Brick{constructor(type,x,y,width,height){Object.assign(this,{type,x,y,width,height,hp:BRICK_TYPES[type].hp,flash:0,destroyed:false});}
get destructible(){return this.type!==3;}get color(){return BRICK_TYPES[this.type].color;}
hit(){this.flash=.13;if(!this.destructible)return {destroyed:false,points:0};this.hp--;this.destroyed=this.hp<=0;return {destroyed:this.destroyed,points:this.destroyed?BRICK_TYPES[this.type].points:0};}
}
export function buildBricks(level){const cols=level.grid[0].length,gap=8,width=(1152-gap*(cols-1))/cols;return level.grid.flatMap((row,y)=>row.flatMap((type,x)=>type?[new Brick(type,64+x*(width+gap),92+y*38,width,28)]:[]));}
