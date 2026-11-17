import {analyzeImage} from './analysis.js';
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const hash=(x,y,s)=>{const a=Math.sin(x*127.1+y*311.7+s*73.7)*43758.5453;return a-Math.floor(a)};
const glyphCache=new Map();
export const ASCII_DEFAULTS=Object.freeze({asciiMode:'fidelity',asciiSet:'tonal',asciiFont:'monospace',asciiColor:'original',asciiDensity:1,asciiDetail:.7,asciiEdges:.5,asciiRegion:'full',asciiText:'SEKRET / СЕКРЕТ',asciiBackground:'#08090c'});
const sets={tonal:' .,:;-=+!*?0123456789%@#▓█',technical:' .·:-+=/\|[]{}<>01#▓█',cyrillic:' .,:;-=+илтжфшщюЖФШЩЮ▓█'};
const fonts={monospace:'monospace',serif:'Georgia, serif',sans:'Arial, sans-serif'};
function glyphs(set,font){
 const chars=[...new Set([...(sets[set]||sets.tonal)])],key=set+font;if(glyphCache.has(key))return glyphCache.get(key);
 const c=document.createElement('canvas');c.width=24;c.height=40;const g=c.getContext('2d',{willReadFrequently:true});g.font=`40px ${font}`;g.textBaseline='middle';g.textAlign='center';g.fillStyle='#fff';
 const result=chars.map(char=>{g.clearRect(0,0,24,40);g.fillText(char,12,20,24);const d=g.getImageData(0,0,24,40).data;let sum=0;for(let i=3;i<d.length;i+=4)sum+=d[i]/255;return {char,density:sum/960}}).sort((a,b)=>a.density-b.density);
 glyphCache.set(key,result);return result;
}
export function asciiSettings(fx){const o={...ASCII_DEFAULTS,...fx};o.asciiMode=o.asciiMode==='experimental'?'experimental':'fidelity';o.asciiDensity=clamp(Number(o.asciiDensity)||1,.5,2);o.asciiDetail=clamp(Number(o.asciiDetail));o.asciiEdges=clamp(Number(o.asciiEdges));o.asciiText=String(o.asciiText||'SEKRET').slice(0,160);return o;}
export function renderAscii(source,fx){
 const o=asciiSettings(fx),{width:w,height:h,data:input}=source,analysis=analyzeImage(source),c=document.createElement('canvas');c.width=w;c.height=h;
 const g=c.getContext('2d',{willReadFrequently:true}),font=fonts[o.asciiFont]||fonts.monospace,bank=glyphs(o.asciiSet,font),experimental=o.asciiMode==='experimental';
 // Character size is in reference-image units, keeping layout consistent across export sizes.
 const base=Math.max(1.5,(Number(o.scale)||7)*Math.min(w,h)/600/o.asciiDensity),row=base/ .6;
 g.fillStyle=o.asciiBackground;g.fillRect(0,0,w,h);g.textBaseline='middle';g.textAlign='center';
 const text=[...o.asciiText],seed=Number(o.seed)||0,deconstruct=clamp(Number(o.distortion)||0),contrast=clamp(Number(o.contrast)||1,.4,3);
 function draw(x,y,cw,ch){
  const cx=x+cw*.5,cy=y+ch*.5,index=analysis.index(cx,cy),detail=clamp(analysis.edge[index]*o.asciiEdges+analysis.contrast[index]*2*o.asciiDetail);
  let r=0,gr=0,b=0,a=0,count=0;
  for(let yy=0;yy<3;yy++)for(let xx=0;xx<3;xx++){const j=(Math.min(h-1,Math.floor(y+(yy+.5)*ch/3))*w+Math.min(w-1,Math.floor(x+(xx+.5)*cw/3)))*4,k=input[j+3]/255;r+=input[j]*k;gr+=input[j+1]*k;b+=input[j+2]*k;a+=k;count++;}
  if(a<.001)return;r/=a;gr/=a;b/=a;
  let tone=clamp(((r*.2126+gr*.7152+b*.0722)/255-.5)*contrast+.5);
  tone=clamp(tone+detail*.12);
  const noise=hash(Math.round(x/base),Math.round(y/row),seed);
  if(experimental&&noise<deconstruct*(1-tone)*.66)return;
  let target=o.asciiColor==='original'?Math.sqrt(tone):tone;
  let chosen=bank[0],error=Infinity;
  for(const item of bank){const e=Math.abs(item.density-target);if(e<error){chosen=item;error=e;}}
  let char=chosen.char;
  if(experimental&&text.length)char=text[(Math.round(x/base)+Math.round(y/row)*7+Math.abs(seed|0))%text.length];
  const angle=Math.atan2(analysis.gy[index],analysis.gx[index])+Math.PI/2;
  g.save();g.translate(cx+(experimental?(noise-.5)*cw*deconstruct*1.5:0),cy+(experimental?Math.sin(cx/Math.max(w,1)*14+seed)*ch*deconstruct*.6:0));
  if(experimental)g.rotate(angle*deconstruct*o.asciiEdges);
  g.font=`${ch}px ${font}`;
  if(o.asciiColor==='original'){const gain=experimental?1:Math.min(4,tone/Math.max(.03,chosen.density)/Math.max(.02,(r*.2126+gr*.7152+b*.0722)/255));g.fillStyle=`rgb(${clamp(r*gain,0,255)},${clamp(gr*gain,0,255)},${clamp(b*gain,0,255)})`;}
  else if(o.asciiColor==='duotone')g.fillStyle=tone>.48?'#f2e3df':'#c46b88';else g.fillStyle='#f4f0eb';
  g.fillText(char,0,0,cw);g.restore();
 }
 const step=2;
 for(let y=0;y<h;y+=row*step)for(let x=0;x<w;x+=base*step){
  const i=analysis.index(x+base,y+row),subdivide=(analysis.edge[i]*o.asciiEdges+analysis.texture[i]*o.asciiDetail+analysis.contrast[i]*o.asciiDetail*2)>(experimental?.12:.035);
  if(subdivide){for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++)draw(x+xx*base,y+yy*row,base,row);}else draw(x,y,base*step,row*step);
 }
 const out=g.getImageData(0,0,w,h),d=out.data,amount=clamp(Number(o.amount));
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4,j=analysis.index(x,y),l=analysis.luminance[j];let select=1;
  if(o.asciiRegion==='shadows')select=clamp((.7-l)/.35);else if(o.asciiRegion==='highlights')select=clamp((l-.3)/.35);else if(o.asciiRegion==='edges')select=clamp(analysis.edge[j]*3);else if(o.asciiRegion==='hybrid')select=.55;
  const k=amount*select;for(let ch=0;ch<3;ch++)d[i+ch]=input[i+ch]+(d[i+ch]-input[i+ch])*k;d[i+3]=input[i+3];
 }
 return out;
}
