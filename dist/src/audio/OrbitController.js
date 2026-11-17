export class OrbitController{
 constructor(canvas,state,onCommit,allow=()=>true,zoomBounds=[.65,1.65],planar=false){this.zoomBounds=zoomBounds;this.canvas=canvas;this.state=state;state[3]=Number.isFinite(state[3])?state[3]:0;state[4]=Number.isFinite(state[4])?state[4]:0;this.current=[...state];this.onCommit=onCommit;this.drag=null;
  this.down=e=>{if(e.button!==2&&(e.button!==0||(!e.shiftKey&&!allow())))return;this.drag={pan:e.shiftKey||planar,id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);};
  this.move=e=>{if(!this.drag||e.pointerId!==this.drag.id)return;const r=canvas.getBoundingClientRect();if(this.drag.pan){state[3]=Math.max(-1,Math.min(1,state[3]+(e.clientX-this.drag.x)/r.width));state[4]=Math.max(-1,Math.min(1,state[4]-(e.clientY-this.drag.y)/r.height));}else {state[0]+=(e.clientX-this.drag.x)/r.width*4;state[1]=Math.max(-1.15,Math.min(1.15,state[1]+(e.clientY-this.drag.y)/r.height*2.5));}this.drag.x=e.clientX;this.drag.y=e.clientY;};
  this.up=()=>{if(this.drag){this.drag=null;onCommit()}};
  this.wheel=e=>{e.preventDefault();state[2]=Math.max(zoomBounds[0],Math.min(zoomBounds[1],state[2]*Math.exp(-e.deltaY*.001)));onCommit()};
  this.context=e=>e.preventDefault();canvas.addEventListener('contextmenu',this.context);
  this.key=e=>{const steps={ArrowLeft:[-.1,0],ArrowRight:[.1,0],ArrowUp:[0,-.1],ArrowDown:[0,.1]};if(steps[e.key]){e.preventDefault();if(planar){state[3]+=steps[e.key][0];state[4]-=steps[e.key][1];}else{state[0]+=steps[e.key][0];state[1]=Math.max(-1.15,Math.min(1.15,state[1]+steps[e.key][1]));}onCommit()}else if(e.key==='Home'){e.preventDefault();this.reset()}};
  for(const [type,fn] of Object.entries({pointerdown:this.down,pointermove:this.move,pointerup:this.up,pointercancel:this.up,lostpointercapture:this.up,keydown:this.key}))canvas.addEventListener(type,fn);
  canvas.addEventListener('wheel',this.wheel,{passive:false});canvas.tabIndex=0;
 }
 step(dt){const k=1-Math.exp(-dt*16);for(let i=0;i<5;i++)this.current[i]+=(this.state[i]-this.current[i])*k;return this.current}
 reset(){this.state.splice(0,5,0,0,1,0,0);this.onCommit()}
 dispose(){for(const [type,fn] of Object.entries({pointerdown:this.down,pointermove:this.move,pointerup:this.up,pointercancel:this.up,lostpointercapture:this.up,keydown:this.key,wheel:this.wheel}))this.canvas.removeEventListener(type,fn);this.canvas.removeEventListener('contextmenu',this.context);this.canvas.removeAttribute('tabindex');this.drag=null;}
}
