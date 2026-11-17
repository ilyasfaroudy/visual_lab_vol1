// Surface-local contacts. A stationary pointer never rotates through fading slots.
export class SurfaceContactTrail {
 constructor(){this.values=new Float32Array(32);this.slot=0;this.anchor=null;this.lastHit=null;this.missTime=0;}
 update(hit,dt,settings,inside){
  dt=Math.max(0,Math.min(.06,dt));
  this.missTime=hit?0:this.missTime+dt;
  if(hit)this.lastHit=hit;
  const retained=hit||(inside&&this.missTime<.075?this.lastHit:null);
  const active=this.slot*4;
  for(let i=3;i<32;i+=4)if(i!==active+3||!retained)this.values[i]*=Math.exp(-dt*settings.recoverySpeed);
  if(!retained)return;
  const point=retained.point;
  if(this.anchor&&Math.hypot(...point.map((v,i)=>v-this.anchor[i]))>.11){
   const strength=this.values[active+3];
   this.slot=(this.slot+1)%8;
   this.values[this.slot*4+3]=strength;
   this.anchor=[...point];
  }
  if(!this.anchor)this.anchor=[...point];
  const o=this.slot*4;
  this.values.set(point,o);
  this.values[o+3]+=(1-this.values[o+3])*(-Math.expm1(-dt*settings.revealSpeed));
 }
}
