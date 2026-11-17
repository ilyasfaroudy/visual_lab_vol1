// Renderer-neutral input: normalized coordinates, bounded strength, inertial stroke.
// Future recording event: {timestamp,type,coordinates,strength,duration,targetScene}.
export const INTERACTION_SCENES=['particle-web','ribbon-flow','fluid-blobs','geometry-field','reactive-typography'];
export class InteractionController{
 constructor(canvas,settings){this.canvas=canvas;this.settings=settings;this.force=new Float32Array([.5,.5,0,0]);this.stroke=new Float32Array(2);this.target=[.5,.5];this.velocity=[0,0];this.pressed=false;this.inside=false;
 this.move=e=>{const b=canvas.getBoundingClientRect(),x=Math.max(0,Math.min(1,(e.clientX-b.left)/b.width)),y=Math.max(0,Math.min(1,1-(e.clientY-b.top)/b.height));const eventScale=.016/Math.max(.008,Math.min(.1,(e.timeStamp-(this.lastEvent??e.timeStamp-16))/1000));this.lastEvent=e.timeStamp;if(this.pressed){this.velocity[0]=Math.max(-.2,Math.min(.2,(x-this.target[0])*eventScale));this.velocity[1]=Math.max(-.2,Math.min(.2,(y-this.target[1])*eventScale));}this.target[0]=x;this.target[1]=y;this.inside=true;};
 this.down=e=>{if(e.button!==0||e.shiftKey||settings.mode==='orbit')return;this.move(e);this.pressed=true;canvas.setPointerCapture(e.pointerId);};
 this.up=()=>{this.pressed=false;};this.leave=()=>{this.inside=false;};
 this.events={pointermove:this.move,pointerdown:this.down,pointerup:this.up,pointercancel:this.up,lostpointercapture:this.up,pointerleave:this.leave};for(const [k,v]of Object.entries(this.events))canvas.addEventListener(k,v);
 }
 step(dt){const mode={orbit:0,attract:1,repel:2,drag:3,distort:4}[this.settings.mode]||0,k=1-Math.exp(-dt*18);this.force[3]=mode;
 const target=mode&&this.inside?(this.pressed?1:.12):0;this.force[2]+=(target-this.force[2])*(1-Math.exp(-dt*(target>this.force[2]?12:3.5)));
 for(let i=0;i<2;i++){this.force[i]+=(this.target[i]-this.force[i])*k;this.stroke[i]+=(this.velocity[i]*4-this.stroke[i])*(1-Math.exp(-dt*9));this.velocity[i]*=Math.exp(-dt*12);}return this.force;}
 dispose(){for(const [k,v]of Object.entries(this.events))this.canvas.removeEventListener(k,v);}
}
