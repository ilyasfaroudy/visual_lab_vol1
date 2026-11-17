import {analyzeImage} from './analysis.js';
import {renderAscii} from './ascii.js';
import {presets as legacyPresets,clonePreset as legacyClone,processEffect as processLegacy} from './presets.js';
import {clamp,uid} from '../app/utils.js';
import {applyReactiveMask} from './masking.js';
export const extras=[
 ['PIXEL // MOSH','BITMAP',12,.9,11,1.3,.7],
 ['ADAPTIVE // PIXEL','BITMAP',13,.9,7,1.2,.8],
 ['PIXEL // SORT','BITMAP',14,.92,3,1.4,.6],
 ['ASCII / IMAGE TO TYPE','BITMAP',15,1,5,1.05,.45],
 ['VHS // GHOST','SIGNAL',16,.9,6,1.4,.8],
 ['GRADIENT // MAP','COLOR',17,.95,3,1.2,.2],
 ['GLASS // SMEAR','DISTORT',18,.86,8,1.1,.9],
 ['BITMAP // DECAY','EXPERIMENTAL',19,.82,5,1.6,.75],
 ['COLOR // SEPARATION','COLOR',20,.87,6,1.3,.7],
 ['HALFTONE // CELLS','PRINT',21,.94,8,1.5,.65],
 ['MIRROR // FRACTURE','DISTORT',22,.92,6,1.4,.9],
 ['SRT // GHOST','SIGNAL',23,.8,4,1.2,.65],
 ['SCAN // VECTOR','SIGNAL',24,.85,5,1.35,.55],
 ['POSTER // BLOOM','EXPERIMENTAL',25,.8,4,1.6,.7],
 ['SHADOW // CIRCUIT','EXPERIMENTAL',26,.87,7,1.35,.65],
 ['SPECTRAL // EDGE','COLOR',27,.94,4,1.45,.72],
 ['TOPO // CONTOUR','PRINT',28,.92,5,1.22,.66],
 ['CHROMA // BLOCK','BITMAP',29,.86,13,1.25,.56],
 ['PRISM // HIGHLIGHTS','DISTORT',30,.82,8,1.35,.77],
 ['MONO // GRAINSCAN','SIGNAL',31,.86,4,1.55,.82],
 ['ADAPTIVE MOSAIC','BITMAP',32,1,10,1.2,.6],
 ['PIXEL FLOW','BITMAP',33,.92,7,1.2,.72],
 ['HALFTONE FRACTURE','PRINT',34,.95,7,1.35,.45],
 ['STIPPLE FIELD','PRINT',35,1,4,1.2,.6],
 ['LENTICULAR FIELD','DISTORT',36,.94,9,1.2,.7],
 ['CHROME RELIEF','DISTORT',37,1,7,1.35,.7],
 ['FIBER ENGRAVING','PRINT',38,1,5,1.3,.65],
 ['CONTOUR EROSION','EXPERIMENTAL',39,1,6,1.3,.5],
 ['GLASS TOPOGRAPHY','DISTORT',40,.95,9,1.2,.7],
 ['RISO DUOTONE','PRINT',41,1,6,1.15,.35],
 ['CONTOUR FOIL','PRINT',42,.95,8,1.2,.6],
 ['LIQUID MARBLING','DISTORT',43,.9,10,1.2,.7],
 ['SELECTIVE DITHER','PRINT',44,.95,4,1.2,.65],
 ['SHADOW FRAGMENTATION','EXPERIMENTAL',45,.85,8,1.15,.6],
 ['INTAGLIO ENGRAVING','PRINT',46,1,5,1.25,.6],
 ['EDGE LENS','DISTORT',47,.92,9,1.15,.7]
].map(([name,category,mode,amount,scale,contrast,distortion],i)=>({id:`fx${12+i}`,name,category,mode,amount,scale,contrast,distortion,seed:120+i*17,enabled:true}));
export const EFFECT_LABELS={
 15:{amount:'BLEND',scale:'CHARACTER SIZE',contrast:'CONTRAST',distortion:'DECONSTRUCTION'},
 46:{scale:'HATCH SPACING',contrast:'INK WEIGHT',distortion:'CONTOUR BEND'},
 47:{scale:'RELIEF RADIUS',contrast:'CAUSTIC LIGHT',distortion:'REFRACTION'},
 44:{scale:'DOT PITCH',contrast:'INK CONTRAST',distortion:'SHADOW SELECTION'},
 45:{scale:'FRAGMENT SIZE',contrast:'EDGE RETENTION',distortion:'DISPLACEMENT'},
 41:{scale:'SCREEN PITCH',contrast:'INK DENSITY',distortion:'REGISTRATION'},
 42:{scale:'CONTOUR DENSITY',contrast:'TONAL RANGE',distortion:'FOIL RELIEF'},
 43:{scale:'FLOW RADIUS',contrast:'CHROMA',distortion:'FLOW DISTANCE'},
 18:{scale:'RELIEF SCALE',distortion:'REFRACTION'},
 28:{scale:'CONTOUR DENSITY',contrast:'TONAL RANGE',distortion:'IRREGULARITY'},
 32:{scale:'TILE SIZE',distortion:'MERGE THRESHOLD'},
 33:{scale:'FRAGMENT SIZE',distortion:'FLOW DISTANCE'},
 34:{scale:'SCREEN PITCH',distortion:'REGISTRATION'},
 35:{scale:'POINT SPACING',contrast:'INK DENSITY',distortion:'SCATTER'},
 36:{scale:'LENS PITCH',distortion:'LENS DEPTH'},
 37:{scale:'NORMAL RADIUS',contrast:'REFLECTIONS',distortion:'RELIEF DEPTH'},
 38:{scale:'LINE SPACING',contrast:'INK DENSITY',distortion:'FLOW ALIGNMENT'},
 39:{scale:'FRAGMENT SIZE',contrast:'TONAL RANGE',distortion:'EROSION'},
 40:{scale:'GLASS BANDS',contrast:'TONAL RANGE',distortion:'REFRACTION'}
};
export const imagePresets=[...legacyPresets,...extras];
export function clonePreset(p){return {...p,uid:uid(),enabled:true,color1:'#17121f',color2:'#9d3b60',color3:'#ede3d3',text:'SIGNAL LOST / 2026'};}
const rand=(x,y,s)=>{let h=Math.sin(x*127.1+y*311.7+s*73.7)*43758.5453;return h-Math.floor(h)};
const channels=[0,1,2,3];
function hex(s){return [1,3,5].map(i=>parseInt((s||'#ffffff').slice(i,i+2),16)||0)}
function lerp(a,b,t){return a+(b-a)*t}
function processRawEffect(source,fx){if(fx.mode<12)return processLegacy(source,fx);
 const w=source.width,h=source.height,input=source.data,out=new ImageData(w,h),d=out.data;
 const {mode,amount,contrast,distortion,seed}=fx,scale=Math.max(1,(mode>=32||mode===18||mode===28)?fx.scale*Math.min(w,h)/600:Math.round(fx.scale));
 const get=(x,y,c)=>input[(Math.min(h-1,Math.max(0,y|0))*w+Math.min(w-1,Math.max(0,x|0)))*4+c];
 const lum=(x,y)=>.2126*get(x,y,0)+.7152*get(x,y,1)+.0722*get(x,y,2);
 const palette=[hex(fx.color1),hex(fx.color2),hex(fx.color3)];
 if(mode===32){
  const analysis=analyzeImage(source);
  // Recursive, content-adaptive tiles: preserve edges, merge quiet regions.
  const tile=(x,y,size)=>{if(x>=w||y>=h)return;const right=Math.min(w,x+size),bottom=Math.min(h,y+size),cx=(x+right)>>1,cy=(y+bottom)>>1;
   const tones=[lum(x,y),lum(right-1,y),lum(x,bottom-1),lum(right-1,bottom-1),lum(cx,cy)];
   const ai=analysis.index(cx,cy),detail=(analysis.edge[ai]+analysis.texture[ai]+analysis.contrast[ai])*85;
   if(size>Math.max(2,scale/3)&&Math.max(Math.max(...tones)-Math.min(...tones),detail)>(18+distortion*75)/contrast){const half=Math.ceil(size/2);tile(x,y,half);tile(x+half,y,half);tile(x,y+half,half);tile(x+half,y+half,half);return;}
   const color=[get(cx,cy,0),get(cx,cy,1),get(cx,cy,2)];
   for(let yy=y;yy<bottom;yy++)for(let xx=x;xx<right;xx++){const i=(yy*w+xx)*4;for(let c=0;c<3;c++)d[i+c]=lerp(input[i+c],color[c],amount);d[i+3]=input[i+3];}
  };
  const size=2**Math.ceil(Math.log2(scale*4));for(let y=0;y<h;y+=size)for(let x=0;x<w;x+=size)tile(x,y,size);return out;
 }
 if(mode===15)return renderAscii(source,fx);
 if(mode===14){d.set(input);const threshold=clamp(45+distortion*140,0,255);const sorted=[];
  for(let y=0;y<h;y++){let x=0;while(x<w){if(lum(x,y)<threshold){x++;continue;}const start=x;while(x<w&&lum(x,y)>=threshold)x++;const length=x-start;if(length<3)continue;sorted.length=0;for(let k=start;k<x;k++){const j=(y*w+k)*4;sorted.push([input[j],input[j+1],input[j+2],input[j+3],lum(k,y)])}sorted.sort((a,b)=>a[4]-b[4]);for(let k=start;k<x;k++){const a=sorted[k-start],j=(y*w+k)*4;for(let c=0;c<3;c++)d[j+c]=lerp(input[j+c],a[c],amount)}}}
  return out;
 }
 const canvas=mode===23?document.createElement('canvas'):null;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const j=(y*w+x)*4,l=lum(x,y),n=rand(Math.floor(x/scale),Math.floor(y/scale),seed),cell=scale;
  let X=x,Y=y,R=get(x,y,0),G=get(x,y,1),B=get(x,y,2);
  if(mode===12||mode===13){const size=mode===13?clamp(Math.round(cell*(.7+((255-l)/255)*2.6)),2,60):cell;
   X=Math.floor(x/size)*size+(n-.5)*distortion*size*1.4;Y=Math.floor(y/size)*size+(n-.5)*distortion*size*.9;
   R=get(X,Y,0);G=get(X,Y,1);B=get(X,Y,2);
   if(mode===12&&n>.92){R=get(X+size*3,Y,0);B=get(X-size*2,Y,2)}
  }else if(mode===16){const tear=rand(Math.floor(y/scale),seed,13);X=x+((tear>.7?tear-.5:0)*distortion*80)+Math.sin(y*.07)*distortion*5;R=get(X+distortion*8,y,0);G=get(X,y,1);B=get(X-distortion*8,y,2);const scan=.75+.25*Math.sin(y*.8);R*=scan;G*=scan;B*=scan;}
  else if(mode===17){const t=clamp(((l-128)*contrast+128)/255,0,1),p=t<.5?0:1,k=t<.5?t*2:(t-.5)*2;R=lerp(palette[p][0],palette[p+1][0],k);G=lerp(palette[p][1],palette[p+1][1],k);B=lerp(palette[p][2],palette[p+1][2],k);}
  else if(mode===18){const e=Math.max(1,cell*.6),gx=(lum(x+e,y)-lum(x-e,y))/255,gy=(lum(x,y+e)-lum(x,y-e))/255;const relief=(l/255-.5)*distortion*cell*3;X=x-gx*distortion*cell*9+relief;Y=y-gy*distortion*cell*9;const split=distortion*cell*.18,shine=Math.pow(Math.max(0,1-Math.abs(gx+gy-.2)*3),12)*20;R=get(X+split,Y,0)+shine;G=get(X,Y,1)+shine;B=get(X-split,Y,2)+shine;}
  else if(mode===19){const dust=rand(Math.floor(y/cell),Math.floor(x/cell),seed);if(dust>1.-distortion*.3){R=G=B=dust>.9?240:8}else {const grad=clamp((l-128)*contrast+128,0,255);R=G=B=grad>115?235:14}}
  else if(mode===20){const off=distortion*cell*2;R=get(x+off,y,0);G=get(x-off,y,1);B=get(x,y+off,2);}
  else if(mode===21){const cx=(x%cell)/cell-.5,cy=(y%cell)/cell-.5;const inside=Math.sqrt(cx*cx+cy*cy)<(1-l/255)*.65*contrast;const value=inside?18:245;R=G=B=value;}
  else if(mode===22){const seg=Math.max(2,Math.round(scale/2)+2),angle=Math.atan2(y-h/2,x-w/2);const radius=Math.hypot(x-w/2,y-h/2),sector=Math.PI*2/seg;const a=Math.abs(((angle+sector*seg*4)%(sector*2))-sector);const dx=w/2+Math.cos(a)*radius,dy=h/2+Math.sin(a)*radius;R=get(dx,dy,0);G=get(dx,dy,1);B=get(dx,dy,2);}
  else if(mode===23){const noise=rand(x|0,y|0,seed);const scan=Math.sin(y*.56);const shift=(n>.75?distortion*12:0);R=get(x+shift,y,0)*(noise>.98?.4:1);G=get(x,y,1)*(.9+.1*scan);B=get(x-shift,y,2);}
  else if(mode===24){const edge=Math.abs(l-lum(x+2,y))+Math.abs(l-lum(x,y+2));const line=edge*contrast*3.2;R=G=B=line>(65+distortion*45)?230:12;}
  else if(mode===25){const v=clamp((l-128)*contrast+128,0,255);const gl=Math.min(255,v+distortion*125*Math.pow(Math.max(0,v/255),4));R=clamp(gl*.95,0,255);G=clamp(gl*.52+50,0,255);B=clamp(gl*.75+30,0,255);}
  else if(mode===26){
   const shadow=1-clamp((l-30)/(180-45*distortion),0,1),cell2=Math.max(3,cell);
   const gx=Math.floor(x/cell2),gy=Math.floor(y/cell2);
   const hsh=rand(gx,gy,seed),lane=(x%cell2)/cell2;
   const trace=(Math.abs(lane-.5)<.075||Math.abs(y%cell2-cell2*.5)<.65)&&hsh>.32;
   const spark=(Math.abs(x%cell2-cell2*.5)<1&&Math.abs(y%cell2-cell2*.5)<1);
   const ink=trace||spark?230:8;
   R=lerp(R,ink,shadow*.88);G=lerp(G,ink*.64,shadow*.88);B=lerp(B,ink*.73,shadow*.88);
  }
  else if(mode===27){
   const ex=(lum(x+2,y)-lum(x-2,y))/255,ey=(lum(x,y+2)-lum(x,y-2))/255;
   const edge=clamp((Math.hypot(ex,ey)*contrast-.04)*5,0,1),offset=Math.round(3+distortion*cell);
   R=lerp(R,get(x+offset,y,0),edge);G=lerp(G,get(x-offset,y,1),edge*.65);B=lerp(B,get(x,y+offset,2),edge);
   R=lerp(R,255,edge*.16);B=lerp(B,245,edge*.2);
  }
  else if(mode===28){
   const s=clamp((l/255)*contrast,0,1),bands=Math.max(3,Math.round(cell*1.8));
   const location=s*bands+(n-.5)*distortion*.15;
   const contour=Math.abs(location-Math.round(location));
   const slope=(Math.abs(lum(x+1,y)-lum(x-1,y))+Math.abs(lum(x,y+1)-lum(x,y-1)))/510*bands;const ink=lerp(248,15,clamp((.1-contour)/Math.max(.015,slope)+.5,0,1));
   const shade=(Math.floor(location)%2)?255:204;
   R=lerp(ink,shade,.17);G=R;B=R;
  }
  else if(mode===29){
   const grade=clamp(l/255,0,1),tile=Math.max(3,Math.floor(cell*(.75+grade*1.6)));
   const px=Math.floor(x/tile)*tile,py=Math.floor(y/tile)*tile;
   const q=Math.max(2,Math.round(3+distortion*7));
   R=Math.floor(get(px,py,0)/255*q)/q*255;
   G=Math.floor(get(px,py,1)/255*q)/q*255;
   B=Math.floor(get(px,py,2)/255*q)/q*255;
   if(x%tile<1||y%tile<1){R*=.64;G*=.64;B*=.64;}
  }
  else if(mode===30){
   const hi=clamp((l-120)/135,0,1),wiggle=Math.sin(y/(cell*1.6)+seed*.05)+Math.cos(x/(cell*1.9)-seed*.06);
   const shift=wiggle*distortion*cell*3*hi;
   R=get(x+shift,y+shift*.2,0);G=get(x-shift*.6,y,1);B=get(x+shift*.4,y-shift*.2,2);
   const flare=hi*hi*(.13+.15*n);
   R=clamp(R+flare*200,0,255);B=clamp(B+flare*255,0,255);
  }
  else if(mode===31){
   const dark=1-clamp(l/255,0,1),scan=Math.pow(Math.abs(Math.sin(y*(.4+distortion*.3))),6);
   const bits=(rand(Math.floor(x/cell),y,seed)-.5)*120*distortion;
   const mono=clamp((l-128)*contrast+128+bits*dark,0,255);
   R=G=B=mono*(.8+.2*(1-scan))+(n>.94?230:0)*dark*.22;
  }
  else if(mode===33){
   let px=x,py=y;const stride=cell*distortion*.65;
   for(let step=0;step<4;step++){const gx=lum(px+cell,py)-lum(px-cell,py),gy=lum(px,py+cell)-lum(px,py-cell);const len=Math.max(10,Math.hypot(gx,gy));px+=-gy/len*stride;py+=gx/len*stride;}
   const cx=Math.floor(px/cell)*cell+cell*.5,cy=Math.floor(py/cell)*cell+cell*.5;
   R=(get(cx,cy,0)-128)*contrast+128;G=(get(cx,cy,1)-128)*contrast+128;B=(get(cx,cy,2)-128)*contrast+128;
  }
  else if(mode===34){
   const offset=(rand(Math.floor(y/(cell*5)),seed,4)-.5)*distortion*cell*3;
   const ink=(channel,angle,shift)=>{const xx=(x+shift)*Math.cos(angle)-y*Math.sin(angle),yy=(x+shift)*Math.sin(angle)+y*Math.cos(angle);const r=Math.hypot(((xx%cell)+cell)%cell/cell-.5,((yy%cell)+cell)%cell/cell-.5);return r<Math.sqrt(1-get(x+shift,y,channel)/255)*.6?1:0;};
   R=245-ink(0,.26,offset)*210;G=240-ink(1,1.3,-offset)*205;B=230-ink(2,.78,offset*.5)*195;
  }
  else if(mode===35){
   const cx=Math.floor(x/cell),cy=Math.floor(y/cell);let ink=0;
   for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++){const ix=cx+xx,iy=cy+yy;const px=(ix+.5+(rand(ix,iy,seed)-.5)*(.2+.7*distortion))*cell,py=(iy+.5+(rand(ix,iy,seed+1)-.5)*(.2+.7*distortion))*cell;const shade=1-lum(px,py)/255;const radius=cell*Math.sqrt(shade)*.48*contrast;ink=Math.max(ink,clamp(radius-Math.hypot(x-px,y-py)+.5,0,1));}
   R=lerp(241,19,ink);G=lerp(233,17,ink);B=lerp(216,24,ink);
  }
  else if(mode===36){
   const lane=Math.floor(x/cell),phase=(x%cell)/cell;
   const off=(phase-.5)*cell*(1+distortion*5);const dy=Math.sin(lane*.24+seed)*cell*distortion;
   R=get(x+off+distortion*2,y+dy,0);G=get(x+off,y+dy,1);B=get(x+off-distortion*2,y+dy,2);
   const shade=.73+.27*Math.sin(phase*Math.PI);R*=shade;G*=shade;B*=shade;
  }
  else if(mode>=37&&mode<=40){
   const reach=Math.max(1,cell*.65),gx=(lum(x+reach,y)-lum(x-reach,y))/255,gy=(lum(x,y+reach)-lum(x,y-reach))/255;
   const tone=l/255,edge=Math.hypot(gx,gy),nx=-gx*(3+distortion*12),ny=-gy*(3+distortion*12),nz=1/Math.sqrt(1+nx*nx+ny*ny);
   if(mode===37){
    const rx=2*nx*nz*nz,ry=2*ny*nz*nz;
    const strip=Math.exp(-(((rx+ry*.35-.25)/.11)**2)),panel=Math.exp(-(((rx-ry*.5+.55)/.26)**2));
    const ridge=Math.pow(Math.max(0,1-nz),2),shade=(.06+strip*.85+panel*.45+ridge*.2)*contrast;
    R=255*shade+tone*14;G=255*shade*.97+tone*18;B=255*shade*1.02+tone*25;
   }else if(mode===38){
    const angle=.45+(Math.atan2(gy,gx)+Math.PI*.5-.45)*distortion,phase=(x*Math.cos(angle)+y*Math.sin(angle))/cell;
    const width=Math.max(.025,(1-tone)*.46*contrast),distance=Math.abs(phase-Math.round(phase));
    const ink=clamp((width-distance)*cell+ .5,0,1),cross=Math.abs((x-y)/cell*.7-Math.round((x-y)/cell*.7));
    const etched=Math.max(ink,tone<.35?clamp((.1-cross)*cell+.5,0,1):0);
    R=lerp(244,15,etched);G=lerp(238,17,etched);B=lerp(224,22,etched);
   }else if(mode===39){
    const cx=Math.floor(x/cell)*cell+cell*.5,cy=Math.floor(y/cell)*cell+cell*.5,local=clamp((lum(cx,cy)/255-.5)*contrast+.5,0,1);
    const boundary=clamp((local-(distortion*.9-.05))*10,0,1),line=Math.min(x%cell,y%cell,cell-x%cell,cell-y%cell)<.8;
    const retained=boundary>.3&&n<boundary;const fragment=retained?(line?235:local*225):8;
    R=G=B=fragment;B+=retained?Math.min(20,edge*70):0;
   }else{
    const contour=clamp((tone-.5)*contrast+.5,0,1)*(3+fx.scale*.5),fold=Math.sin(contour*Math.PI*2),offset=fold*distortion*cell*3;
    const len=Math.max(.03,edge),dx=gx/len,dy=gy/len;
    const px=x+dx*offset,py=y+dy*offset,split=distortion*cell*.12;
    const shine=Math.pow(Math.max(0,Math.cos(contour*Math.PI*2)),18)*45;
    R=get(px+dx*split,py+dy*split,0)*(.8+.2*nz)+shine;
    G=get(px,py,1)*(.8+.2*nz)+shine;
    B=get(px-dx*split,py-dy*split,2)*(.8+.2*nz)+shine;
   }
  }
  else if(mode===41){
   const pitch=Math.max(1.5,cell),tone=clamp((l/255-.5)*contrast+.5,0,1);
   const dot=(angle,shift,coverage)=>{const xx=(x+shift)*Math.cos(angle)-y*Math.sin(angle),yy=(x+shift)*Math.sin(angle)+y*Math.cos(angle);const dx=((xx%pitch)+pitch)%pitch/pitch-.5,dy=((yy%pitch)+pitch)%pitch/pitch-.5;return clamp((Math.sqrt(coverage)*.56-Math.hypot(dx,dy))*pitch+.5,0,1)};
   const a=dot(.35,distortion*cell*.35,1-tone),b=dot(1.2,-distortion*cell*.35,Math.pow(1-tone,2));
   const paper=[247,238,219],wine=[142,36,70],blue=[29,44,72];const color=paper.map((v,c)=>v*(1-a*(1-wine[c]/255))*(1-b*(1-blue[c]/255)));
   [R,G,B]=color;
  }
  else if(mode===42){
   const gx=(lum(x+cell,y)-lum(x-cell,y))/255,gy=(lum(x,y+cell)-lum(x,y-cell))/255;
   const tone=clamp((l/255-.5)*contrast+.5,0,1),phase=tone*(6+fx.scale),line=Math.abs(phase-Math.round(phase));
   const highlight=Math.exp(-Math.pow((gx+gy*.4-.12)/( .045+distortion*.12),2));
   const ink=clamp((.13-line)*cell+.5,0,1),foil=(.15+.85*highlight)*ink;
   R=18+foil*237;G=15+foil*214;B=22+foil*194;
  }
  else if(mode===43){
   let px=x,py=y;for(let k=0;k<5;k++){const gx=(lum(px+cell,py)-lum(px-cell,py))/255,gy=(lum(px,py+cell)-lum(px,py-cell))/255;const len=Math.max(.06,Math.hypot(gx,gy));px+=(-gy/len+gx*.25)*cell*distortion;py+=(gx/len+gy*.25)*cell*distortion;}
   const split=distortion*cell*.2;R=get(px+split,py,0);G=get(px,py,1);B=get(px-split,py,2);
   const gray=(R+G+B)/3;R=gray+(R-gray)*contrast;G=gray+(G-gray)*contrast;B=gray+(B-gray)*contrast;
  }
  else if(mode===44){
   const pitch=Math.max(1,fx.scale*Math.min(w,h)/600),cx=Math.floor(x/pitch),cy=Math.floor(y/pitch);
   // Ordered ink with image-driven selection: bright detail and color survive.
   const bayer=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
   const tone=clamp((l/255-.5)*contrast+.5,0,1),ink=tone>(bayer[(cy%4)*4+cx%4]+.5)/16?244:19;
   const gradient=Math.hypot(lum(x+pitch,y)-lum(x-pitch,y),lum(x,y+pitch)-lum(x,y-pitch))/255;
   const selection=clamp((.85-tone)*(1+distortion)*1.6,0,1)*(1-clamp(gradient*.65,0,.6));
   R=lerp(R,ink,selection);G=lerp(G,ink*.95,selection);B=lerp(B,ink*.98,selection);
  }
  else if(mode===45){
   const pitch=Math.max(1,fx.scale*Math.min(w,h)/600),cx=Math.floor(x/pitch),cy=Math.floor(y/pitch),px=(cx+.5)*pitch,py=(cy+.5)*pitch;
   const tone=lum(px,py)/255,gx=(lum(px+pitch,py)-lum(px-pitch,py))/255,gy=(lum(px,py+pitch)-lum(px,py-pitch))/255;
   const shadow=Math.pow(clamp(1-tone,0,1),1.6),edge=clamp(Math.hypot(gx,gy)*contrast,0,1),seeded=rand(cx,cy,seed)-.5;
   const dx=(gy*2+seeded)*pitch*distortion*7*shadow*(1-edge*.7),dy=(-gx*2+seeded*.3)*pitch*distortion*7*shadow*(1-edge*.7);
   R=get(x+dx,y+dy,0);G=get(x+dx,y+dy,1);B=get(x+dx,y+dy,2);
   const seam=Math.min((x/pitch)%1,(y/pitch)%1)<.055?shadow*distortion*.3:0;R*=1-seam;G*=1-seam;B*=1-seam;
  }
  else if(mode===46){
   const pitch=Math.max(1,fx.scale*Math.min(w,h)/600),tone=clamp((l/255-.5)*contrast+.5,0,1);
   const gx=(lum(x+pitch,y)-lum(x-pitch,y))/255,gy=(lum(x,y+pitch)-lum(x,y-pitch))/255;
   const bend=(gx+gy)*pitch*distortion*4,phase=(x*.72+y*.69+bend)/pitch,phase2=(x*.78-y*.63-bend)/pitch;
   const line=(phase,coverage)=>clamp((coverage*.48-Math.abs((phase-Math.floor(phase))-.5))*pitch+.35,0,1);
   const ink=Math.max(line(phase,1-tone),line(phase2,Math.max(0,.5-tone)*1.6));
   R=243-ink*218;G=236-ink*216;B=220-ink*195;
  }
  else if(mode===47){
   const pitch=Math.max(1,fx.scale*Math.min(w,h)/600),gx=(lum(x+pitch,y)-lum(x-pitch,y))/255,gy=(lum(x,y+pitch)-lum(x,y-pitch))/255;
   const edge=Math.hypot(gx,gy),distance=pitch*distortion*12;
   const px=x-gx*distance,py=y-gy*distance,caustic=Math.pow(clamp(edge*2,0,1),2)*contrast*42;
   R=get(px+gx*pitch*.18,py,0)+caustic;G=get(px,py,1)+caustic*.94;B=get(px-gx*pitch*.18,py,2)+caustic*.9;
  }
  d[j]=lerp(input[j],R,amount);d[j+1]=lerp(input[j+1],G,amount);d[j+2]=lerp(input[j+2],B,amount);d[j+3]=input[j+3];
 }
 if(mode===23){const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.putImageData(out,0,0);ctx.textAlign='center';ctx.font=`bold ${Math.max(10,Math.round(w/38))}px monospace`;ctx.fillStyle='#e6e6e6';ctx.strokeStyle='#080808';ctx.lineWidth=3;const txt=(fx.text||'SIGNAL LOST / 2026').slice(0,80);ctx.strokeText(txt,w/2,h*.82,w*.85);ctx.fillText(txt,w/2,h*.82,w*.85);return ctx.getImageData(0,0,w,h);}
 return out;
}

export function processEffect(source,fx){return applyReactiveMask(source,processRawEffect(source,fx),fx.mask);}
