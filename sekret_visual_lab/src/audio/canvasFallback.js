import {maskAt} from '../image/masking.js';
import {clamp} from '../app/utils.js';
function rand(seed){let v=Math.sin(seed*127.1+3.11)*43758.5453;return v-Math.floor(v)}
export class Audio2D{
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.media=null;this.points=Array.from({length:260},(_,i)=>({x:rand(i*3+1),y:rand(i*7+11),phase:rand(i+5)*6.28}));this.lastScene=-1;this.mode='FALLBACK / CANVAS2D';}
 resize(w,h){if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h}}
 setMedia(source){this.media=source}
 resetFeedback(){this.ctx?.clearRect(0,0,this.canvas.width,this.canvas.height)}
 render({sceneIndex,params:p,signals:s,colors,colorControls,time:t,width,height,waveform=null,gradientStyle=0,mediaMask=[0,.5,.17,0],directorScene=null,directorBlend=0}){
 this.resize(Math.min(1100,width),Math.min(850,height));const c=this.ctx,w=this.canvas.width,h=this.canvas.height,beat=s[5]||0,bass=s[0]||0,mid=s[2]||0,high=s[3]||0;
 const palette=colors.length?colors:['#101020','#7c2945','#eee'];const fg=palette[2],accent=palette[1];
 if(sceneIndex!==this.lastScene){c.fillStyle='#050508';c.fillRect(0,0,w,h);this.lastScene=sceneIndex;}
 if(sceneIndex===2||sceneIndex===1||sceneIndex===9){c.fillStyle=`rgba(3,3,6,${clamp(1-p[7],.035,.34)})`;c.fillRect(0,0,w,h)}else{c.fillStyle='#050507';c.fillRect(0,0,w,h)}
 const stroke=(color=fg,a=1)=>{c.strokeStyle=color;c.globalAlpha=a;c.stroke();c.globalAlpha=1};
 if(sceneIndex===0){const count=clamp(Math.round(p[0]*11),70,250),R=(40+p[2]*40)*(w/900);c.lineWidth=.8;
 const pts=this.points.slice(0,count).map((pt,i)=>{const a=t*(.09+p[1]*.22)+pt.phase;return {x:(pt.x+.08*Math.sin(a+i*.1)*(1+bass))*w,y:(pt.y+.1*Math.cos(a*.7+i*.02)*(1+mid))*h}});
 for(let i=0;i<pts.length;i++){let links=0;for(let j=i+1;j<pts.length;j++){const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y,d=dx*dx+dy*dy;if(d<R*R&&links++<5){c.beginPath();c.moveTo(pts[i].x,pts[i].y);c.lineTo(pts[j].x,pts[j].y);stroke(fg,.08+.35*(1-Math.sqrt(d)/R));}}}
 for(let i=0;i<pts.length;i++){c.beginPath();c.arc(pts[i].x,pts[i].y,Math.max(.65,p[3]*1.3)*(1+beat*.4),0,6.283);c.fillStyle=i%17===0?accent:fg;c.globalAlpha=.4+.5*rand(i+2);c.fill()}c.globalAlpha=1;
 }else if(sceneIndex===1){const count=Math.round(p[0]*2.5);for(let i=0;i<count;i++){c.beginPath();for(let x=0;x<w;x+=3){const xx=x/w,phase=i*.32,y=h*(.5+.23*Math.sin(xx*5+phase+t*(.14+p[1]*.26))*Math.cos(xx*2.1+phase+t*.11)*p[4])+i*.4; x===0?c.moveTo(x,y):c.lineTo(x,y)}c.lineWidth=.6+Math.sin(i*.3)*.4;stroke(i%7===0?accent:fg,.05+.15*(1-i/count))}}
 else if(sceneIndex===2){for(let j=0;j<16;j++){c.beginPath();for(let x=0;x<w;x+=4){const y=h*.5+h*.28*Math.sin(x/w*(5+p[2]*5)+t*.27+j*.24)*Math.cos(x/w*11-j*.4);x===0?c.moveTo(x,y):c.lineTo(x,y)}c.lineWidth=.8;stroke(j%3===0?accent:fg,.09+.17*beat)} }
 else if(sceneIndex===3){
 c.save();c.globalCompositeOperation='screen';
 const count=Math.max(2,Math.round(p[0]));
 for(let layer=0;layer<9;layer++){
  const jitter=(layer-4)*.06,phase=t*(.07+p[1]*.12);
  c.beginPath();
  for(let x=0;x<w;x+=3){const u=x/w,dist=(u-.5)*2;
    const motion=.16*Math.sin(dist*5+phase+layer*.17)+.09*Math.sin(dist*12-phase*.67+layer*.31)+.04*Math.sin(dist*29+layer*.51+t*.12);
    const center=h*(.5+motion*p[2]);
    const y=center+(layer-4)*h*.017*(.7+Math.sin(dist*6+phase)*.3)*p[4];
    x===0?c.moveTo(x,y):c.lineTo(x,y)
  }
  c.strokeStyle=layer%3===0?fg:accent;c.lineWidth=layer%3===0?1.15:.7;
  c.globalAlpha=.07+.13*(1-Math.abs(layer-4)/5);c.shadowColor=accent;c.shadowBlur=layer===4?18:4;c.stroke();
 }
 for(let i=0;i<count;i++){
  const a=i*2.399+t*(.09+p[1]*.15),x=w*(.5+.25*Math.cos(a)),y=h*(.5+.25*Math.sin(a*.87));
  const r=(20+p[2]*28)*(w/900)*(1+bass*.32);let grad=c.createRadialGradient(x,y,r*.2,x,y,r*2.2);
  grad.addColorStop(0,accent+'99');grad.addColorStop(.5,accent+'19');grad.addColorStop(1,'#00000000');
  c.globalAlpha=.28;c.fillStyle=grad;c.fillRect(x-r*2.2,y-r*2.2,4.4*r,4.4*r)
 }
 c.restore();
 }
 else if(sceneIndex===4){const grid=Math.round(p[0]);c.lineWidth=.6;for(let y=0;y<grid;y++){c.beginPath();for(let x=0;x<=75;x++){const xx=x/75*w,yy=(y/(grid-1)*h)+Math.sin(xx/w*10+t*.23+y*.2)*(13+p[2]*31)*(1+bass);x===0?c.moveTo(xx,yy):c.lineTo(xx,yy)}stroke(y%5===0?accent:fg,.12+.18*y/grid)}for(let x=0;x<grid;x++){c.beginPath();for(let y=0;y<=50;y++){const yy=y/50*h,xx=(x/(grid-1)*w)+Math.cos(yy/h*12+t*.2+x*.2)*p[2]*18;y===0?c.moveTo(xx,yy):c.lineTo(xx,yy)}stroke(fg,.07)}}
 else if(sceneIndex===5){if(this.media){try{const off=Math.round((bass+.1)*p[1]*25);c.drawImage(this.media,-off,0,w+off*2,h);for(let i=0;i<12;i++){const y=Math.floor(rand(i+Math.floor(t*4))*h),sh=Math.max(3,Math.round(p[0]));c.drawImage(this.media,0,y/ h*(this.media.videoHeight||this.media.naturalHeight||h),this.media.videoWidth||this.media.naturalWidth||w,sh,(rand(i+22)-.5)*off*5,y,w,sh)}}catch{}}else{const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,accent);g.addColorStop(.6,fg);g.addColorStop(1,'#07080a');c.fillStyle=g;c.fillRect(0,0,w,h)}}
 else if(sceneIndex===6){c.save();c.translate(w/2,h/2);c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';c.font=`900 ${Math.max(45,w/8*p[0])}px Arial`;const str=this.text||'MAKE SOME NOISE';for(let i=0;i<8;i++){c.globalAlpha=i===0?1:.065;c.fillStyle=i===0?fg:accent;c.fillText(str,(i-2)*p[2]*(5+bass*18),Math.sin(t*1.6+i)*p[1]*(7+bass*35),w*.9)}c.restore();c.globalAlpha=1;}
 else if(sceneIndex===7||sceneIndex===8){const grad=c.createLinearGradient(0,0,w,h);grad.addColorStop(0,palette[0]);grad.addColorStop(.55,palette[1]);grad.addColorStop(1,palette[2]);c.fillStyle=grad;c.fillRect(0,0,w,h);c.globalCompositeOperation='screen';for(let i=0;i<4;i++){let x=w*(.5+.32*Math.sin(t*.13+i*1.7)),y=h*(.5+.31*Math.cos(t*.14+i*.8)),r=w*(.15+p[2]*.19);const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,i%2?palette[1]:palette[2]);g.addColorStop(1,'transparent');c.fillStyle=g;c.globalAlpha=.6;c.fillRect(x-r,y-r,2*r,2*r)}c.globalCompositeOperation='source-over';c.globalAlpha=1;
 if(sceneIndex===8){for(let i=0;i<4;i++){let x=w*(.2+.2*i+.05*Math.sin(t*.17+i)),y=h*(.5+.22*Math.sin(t*.3+i*1.9)),r=w*.095;c.beginPath();c.ellipse(x,y,r,r*(.8+.3*Math.sin(t*.16)),t*.05,0,6.283);c.lineWidth=2+i*.7;stroke('#ffffff',.35);c.fillStyle='#ffffff11';c.fill()}}}
 else if(sceneIndex===9){
  const count=Math.max(1,Math.min(44,Math.round(p[0])));
  c.save();c.globalCompositeOperation='screen';
  for(let j=0;j<count;j++){
    const layer=j/Math.max(1,count-1),phase=j*.57;
    c.beginPath();for(let x=0;x<w;x+=2){const xx=x/w;
      const wave=.65*Math.sin(xx*(4+p[2]*9)+t*(.3+p[1]*.35)+phase)+.33*Math.sin(xx*25-phase*1.3-t*.38)+.12*Math.sin(xx*61+j*.2+t*.3);
      const y=h*(.5+(layer-.5)*(.1+p[4]*.35)+wave*(.12+.06*p[4])*(1+bass*.38));
      x===0?c.moveTo(x,y):c.lineTo(x,y)
    }
    c.strokeStyle=j%5===0?fg:accent;c.lineWidth=j%5===0?1.2:.65;c.globalAlpha=.1+.25*(1-Math.abs(layer-.5)*2);
    c.shadowColor=fg;c.shadowBlur=j%6===0?10:0;c.stroke();
  }
  c.restore();
 }
 else if(sceneIndex===11){
  // Layered actual audio waveform anatomy, drawn at preview resolution in the safe path.
  const count=Math.max(4,Math.min(44,Math.round(p[0])));
  const gradient=c.createLinearGradient(0,h*.32,w,h*.68);
  gradient.addColorStop(0,palette[0]);gradient.addColorStop(.38,accent);gradient.addColorStop(.7,fg);gradient.addColorStop(1,palette[1]);
  const waveAt=(x)=>{if(waveform?.length===256)return (waveform[Math.min(255,Math.max(0,Math.floor((x/w)*255)))]/255-.5)*2;
      return Math.sin(x*.037+t*.6)*.55+Math.sin(x*.115-t*.44)*.2;};
  c.save();c.globalCompositeOperation='screen';
  // A translucent layered membrane anchors the lines in a single volumetric form.
  c.beginPath();
  for(let x=0;x<=w;x+=4){const z=(x-w/2)/(w*.52),taper=Math.max(0,1-Math.pow(Math.abs(z),3.3));
   const amp=h*(.064+.06*p[4])*taper*(.66+Math.abs(waveAt(x))*.30+bass*.15);
   const yy=h/2-amp+Math.sin(x*.017+t*.27)*amp*.16;
   x===0?c.moveTo(x,yy):c.lineTo(x,yy);
  }
  for(let x=w;x>=0;x-=4){const z=(x-w/2)/(w*.52),taper=Math.max(0,1-Math.pow(Math.abs(z),3.3));
   const amp=h*(.064+.06*p[4])*taper*(.66+Math.abs(waveAt(x))*.30+bass*.15);
   c.lineTo(x,h/2+amp+Math.sin(x*.017+t*.27)*amp*.16);
  }
  c.closePath();let fill=c.createLinearGradient(0,h*.32,0,h*.7);
  fill.addColorStop(0,palette[0]);fill.addColorStop(.47,accent);fill.addColorStop(.52,accent);fill.addColorStop(1,palette[0]);
  c.globalAlpha=.33;c.fillStyle=fill;c.fill();
  for(let layer=0;layer<count;layer++){
   const lane=(layer/Math.max(1,count-1)-.5)*2;
   c.beginPath();
   for(let x=0;x<=w+2;x+=3){const z=(x-w/2)/(w*.53),envelope=Math.pow(Math.max(0,1-Math.pow(Math.abs(z),3.4)),.8);
     const vol=.36+.4*bass+.14*high+Math.abs(waveAt(x))*.36;
     const thickness=h*(.115+.095*p[4])*envelope*vol;
     const flutter=12*Math.sin(x*.015+layer*.19+t*(.24+.3*p[1]))+5*Math.sin(x*.044-layer*.34-t*.18);
     const y=h/2+lane*thickness*(.85+.2*Math.sin(z*4.7+layer*.2+t*.21))+flutter*(.12+.19*p[2]);
     x===0?c.moveTo(x,y):c.lineTo(x,y);
   }
   c.strokeStyle=gradient;c.lineWidth=layer%6===0?1.5:.85;
   c.globalAlpha=.18+.19*Math.pow(1-Math.abs(lane),.75);
   c.shadowColor=layer%2?accent:fg;c.shadowBlur=layer%9===0?7:0;
   c.stroke();
  }
  c.shadowBlur=0;
  for(let i=0;i<410;i++){const x=rand(i*11+7)*w,y=h/2+(rand(i*9+2)-.5)*h*.28;
    const fade=Math.pow(Math.max(0,1-Math.abs(x-w/2)/(w*.53)),3);
    c.globalAlpha=fade*(.04+.09*rand(i*17+t*.1));c.fillStyle=i%4?fg:accent;c.fillRect(x,y,1,1);
  }
  c.restore();
 }
 else{for(let i=0;i<250;i++){const x=rand(i+Math.floor(t*6))*w,y=rand(i*3+Math.floor(t*6))*h,size=2+rand(i*11)*p[0]*1.6;c.globalAlpha=.04+rand(i*.21)*.3;c.fillStyle=i%3?fg:accent;c.fillRect(x,y,size,2+rand(i)*9)}c.globalAlpha=1}
 if(sceneIndex!==7&&sceneIndex!==8){const v=c.createLinearGradient(0,0,w,0);v.addColorStop(0,'#08080a55');v.addColorStop(.5,'#00000000');v.addColorStop(1,'#09090a55');c.fillStyle=v;c.fillRect(0,0,w,h)}
 // Approximate selective media masking in the no-WebGL fallback. Work at a small mask
 // resolution then composite at full preview size to avoid per-frame full-res pixel scans.
 if(sceneIndex===5&&this.media&&(mediaMask[0]>0||mediaMask[3]>.5)){
  try{
   const mw=240,mh=Math.max(1,Math.round(mw*h/w));
   this.maskSource??=document.createElement('canvas');this.maskAlpha??=document.createElement('canvas');this.maskFx??=document.createElement('canvas');
   const src=this.maskSource,alpha=this.maskAlpha,fx=this.maskFx;src.width=alpha.width=mw;src.height=alpha.height=mh;
   const sc=src.getContext('2d',{willReadFrequently:true});sc.clearRect(0,0,mw,mh);sc.drawImage(this.media,0,0,mw,mh);
   const input=sc.getImageData(0,0,mw,mh),ac=alpha.getContext('2d'),image=ac.createImageData(mw,mh),d=image.data;
   const regions=['all','shadows','midtones','highlights','edges','saturated','desaturated'];
   const options={region:regions[mediaMask[0]|0]||'all',threshold:mediaMask[1],feather:mediaMask[2],invert:mediaMask[3]>.5};
   for(let y=0;y<mh;y++)for(let x=0;x<mw;x++){const j=(y*mw+x)*4;d[j]=d[j+1]=d[j+2]=255;d[j+3]=Math.round(255*maskAt(input.data,mw,mh,x,y,options));}
   ac.putImageData(image,0,0);if(fx.width!==w||fx.height!==h){fx.width=w;fx.height=h;}
   const fc=fx.getContext('2d');fc.clearRect(0,0,w,h);fc.drawImage(this.canvas,0,0);
   fc.globalCompositeOperation='destination-in';fc.drawImage(alpha,0,0,w,h);fc.globalCompositeOperation='source-over';
   c.clearRect(0,0,w,h);c.drawImage(this.media,0,0,w,h);c.drawImage(fx,0,0);
  }catch(e){if(!this.maskError){console.warn('Media mask fallback:',e);this.maskError=true}}
 }
 if(directorBlend>.001&&directorScene!==null&&directorScene!==sceneIndex){
  if(!this.directorCanvas){this.directorCanvas=document.createElement('canvas');this.directorRenderer=new Audio2D(this.directorCanvas)}
  this.directorRenderer.render({sceneIndex:directorScene,params:p,signals:s,colors,colorControls,time:t,width:w,height:h,gradientStyle,mediaMask:[0,.5,.1,0]});
  c.save();c.globalAlpha=clamp(directorBlend,0,1);c.drawImage(this.directorCanvas,0,0,w,h);c.restore();
 }
 }
 dispose(){this.directorRenderer?.dispose();this.ctx=null;this.media=null;this.maskSource=null;this.maskFx=null;this.maskAlpha=null}
}
