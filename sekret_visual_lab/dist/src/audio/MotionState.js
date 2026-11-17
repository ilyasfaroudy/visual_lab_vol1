const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const MOTION_MODES=['pulse','flow','accumulate','orbit','evolve'];
export const MOTION_DEFAULTS=Object.freeze({mode:'flow',running:true,speed:.6,momentum:.75,force:1,damping:1.4,persistence:.65,accumulation:.5,returnStrength:.3,bounds:.3,direction:0});
export function motionSettings(value={}){const out={...MOTION_DEFAULTS,...value};out.mode=MOTION_MODES.includes(out.mode)?out.mode:'pulse';out.running=out.running!==false;for(const [key,lo,hi] of [['speed',0,2],['momentum',0,1],['force',0,3],['damping',.1,5],['persistence',0,1],['accumulation',0,1],['returnStrength',0,2],['bounds',.05,.6],['direction',-180,180]])out[key]=Number.isFinite(out[key])?clamp(out[key],lo,hi):MOTION_DEFAULTS[key];return out;}
export class MotionState{
 constructor(saved={}){this.state={phase:0,x:0,y:0,vx:0,vy:0,speed:0,angle:0,spin:0,morph:0,impulse:0,armed:true,...saved};for(const key of ['phase','x','y','vx','vy','speed','angle','spin','morph','impulse'])this.state[key]=Number.isFinite(this.state[key])?this.state[key]:0;this.remainder=0;this.vector=new Float32Array(4);}
 step(dt,signals,config){const s=this.state,c=config;if(!c.running||c.mode==='pulse')return this.output(c);
 // Edge events are latched once, independent of the number of integration substeps.
 const beat=clamp(signals[5]||0,0,1);if(beat<.14)s.armed=true;if(beat>.3&&s.armed){s.impulse=Math.min(3,s.impulse+c.force);s.armed=false;}
 this.remainder+=clamp(dt,0,.1);const h=1/120;
 while(this.remainder+1e-9>=h){this.remainder-=h;const energy=clamp((signals[0]||0)*.65+(signals[4]||0)*.35,0,1),drag=c.damping*(1.25-c.momentum*.95),decay=Math.exp(-drag*h);
  const target=c.speed+energy*c.force*.9+s.impulse*.35;s.speed+=(target-s.speed)*(-Math.expm1(-h*(1.2+(1-c.momentum)*8)));
  s.phase+=s.speed*h;
  s.spin=(s.spin+(energy*.18+s.impulse*.3)*c.force*h)*Math.exp(-h*(1.6-c.persistence));s.angle+=s.spin*h;
  const angle=c.direction*Math.PI/180+(c.mode==='orbit'?s.phase*.35+s.angle:s.angle*.35),force=(energy*.6+s.impulse)*c.force;
  const spring=c.mode==='accumulate'?(1-c.accumulation)*.65:c.returnStrength+ .2;
  const ax=Math.cos(angle)*force*.09-s.x*spring,ay=Math.sin(angle)*force*.09-s.y*spring;
  s.vx=(s.vx+ax*h)*decay;s.vy=(s.vy+ay*h)*decay;s.x+=s.vx*h;s.y+=s.vy*h;
  const radius=Math.hypot(s.x,s.y);if(radius>c.bounds){const nx=s.x/radius,ny=s.y/radius;s.x=nx*c.bounds;s.y=ny*c.bounds;const outward=s.vx*nx+s.vy*ny;if(outward>0){s.vx-=outward*nx*1.35;s.vy-=outward*ny*1.35;}}
  s.morph=clamp(s.morph+(energy+s.impulse*.4)*c.force*h*.12-s.morph*h*(1-c.persistence)*.2,0,1);
  s.impulse*=Math.exp(-h*4);
 }
 return this.output(c);
 }
 output(c){const s=this.state;if(c.mode==='pulse')this.vector.fill(0);else this.vector.set([s.x,s.y,c.mode==='orbit'?s.angle*.3:0,c.mode==='evolve'?s.morph*.32:0]);return this.vector;}
 serialize(){return {...this.state};}
}
