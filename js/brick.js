export const BRICK_TYPES=Object.freeze({1:{hp:1,points:100,color:'#38def6'},2:{hp:2,points:200,color:'#b68cff'},3:{hp:Infinity,points:0,color:'#71859f'},4:{hp:1,points:150,color:'#ffca65'}});
// Row-led color families with restrained column variation. Six-digit hex is
// intentional: the renderer derives translucent gradient stops from this color.
const PALETTE=[['#38cfe8','#52ddef','#71e7f3'],['#aa83ed','#bb97f4','#c7a9fa'],['#eb78b0','#f48cc0','#f7a0cc'],['#eeb55e','#f4c577','#f8d38d'],['#54d8b0','#72e4c1','#90ecd1']];
export class Brick{
 constructor(type,x,y,width,height,color=BRICK_TYPES[type].color){Object.assign(this,{type,x,y,width,height,hp:BRICK_TYPES[type].hp,flash:0,destroyed:false,tint:color});}
 get destructible(){return this.type!==3;}
 get color(){return this.tint;}
 hit(){this.flash=.13;if(!this.destructible)return {destroyed:false,points:0};this.hp--;this.destroyed=this.hp<=0;return {destroyed:this.destroyed,points:this.destroyed?BRICK_TYPES[this.type].points:0};}
}
export function buildBricks(level){
 const cols=level.grid[0].length,gap=8,width=(1152-gap*(cols-1))/cols,offset=((level.id||1)-1)%PALETTE.length;
 return level.grid.flatMap((row,y)=>row.flatMap((type,x)=>type?[new Brick(type,64+x*(width+gap),92+y*38,width,28,type<=2?PALETTE[(y+offset)%PALETTE.length][(x+y)%3]:BRICK_TYPES[type].color)]:[]));
}
