// Content-aware tonal selection. Operates on the current image entering each effect,
// so stacked effects can select different regions as the composition evolves.
export const MASK_REGIONS = [
  ['all','ALL PIXELS'],['luminance','LUMINANCE'],['hue','HUE RANGE'],['localContrast','LOCAL CONTRAST'],['shadows','SHADOWS'],['midtones','MIDTONES'],
  ['highlights','HIGHLIGHTS'],['edges','CONTOURS / EDGES'],
  ['saturated','SATURATED COLORS'],['desaturated','LOW SATURATION']
];
export const DEFAULT_MASK = Object.freeze({region:'all',threshold:.5,feather:.18,invert:false,strength:1,hue:0,secondary:'all',combine:'intersect',preview:false});
const sat = (r,g,b) => {const hi=Math.max(r,g,b),lo=Math.min(r,g,b);return hi<=0?0:(hi-lo)/hi;};
const luma = (d,i) => (d[i]*.2126+d[i+1]*.7152+d[i+2]*.0722)/255;
const smooth = (a,b,v) => {const t=Math.max(0,Math.min(1,(v-a)/Math.max(.00001,b-a)));return t*t*(3-2*t);};
export function maskAt(data,w,h,x,y,options={}){
 const region=options.region||'all';if(region==='all'&&(!options.secondary||options.secondary==='all'))return options.invert?0:1;
 const i=(y*w+x)*4,lum=luma(data,i),s=sat(data[i],data[i+1],data[i+2]);
 const threshold=Math.max(0,Math.min(1,Number(options.threshold??.5)));
 const feather=Math.max(.005,Math.min(.48,Number(options.feather??.18)));
 let mask=0;
 switch(region){
 case 'shadows':mask=1-smooth(threshold-feather,threshold+feather,lum);break;
 case 'luminance':case 'highlights':mask=smooth(threshold-feather,threshold+feather,lum);break;
 case 'midtones':mask=smooth(0,threshold,lum)*(1-smooth(threshold,1,lum));mask=Math.min(1,mask*2.25);break;
 case 'saturated':mask=smooth(threshold-feather,threshold+feather,s);break;
 case 'desaturated':mask=1-smooth(threshold-feather,threshold+feather,s);break;
 case 'hue':{
 const r=data[i]/255,g=data[i+1]/255,b=data[i+2]/255,hi=Math.max(r,g,b),lo=Math.min(r,g,b),delta=hi-lo;
 let hue=0;if(delta>.0001){if(hi===r)hue=((g-b)/delta+6)%6;else if(hi===g)hue=(b-r)/delta+2;else hue=(r-g)/delta+4;hue/=6;}
 const distance=Math.abs(hue-((Number(options.hue)||0)/360));const circular=Math.min(distance,1-distance);
 mask=(1-smooth(threshold*.5,threshold*.5+feather*.3,circular))*smooth(.04,.12,s);break;
 }
 case 'localContrast':{
 let sum=0;const radius=Math.max(1,Math.round(Math.min(w,h)/90));
 for(const [dx,dy] of [[-radius,0],[radius,0],[0,-radius],[0,radius]])sum+=luma(data,(Math.min(h-1,Math.max(0,y+dy))*w+Math.min(w-1,Math.max(0,x+dx)))*4);
 mask=smooth(threshold*.3,threshold*.3+feather,Math.abs(lum-sum/4)*3);break;
 }
 case 'edges':{
   const right=(y*w+Math.min(w-1,x+1))*4,down=(Math.min(h-1,y+1)*w+x)*4;
   const gradient=Math.min(1,(Math.abs(lum-luma(data,right))+Math.abs(lum-luma(data,down)))*3.8);
   mask=smooth(threshold*.45,threshold*.45+feather,gradient);break;
 }
 default:mask=1;
 }
 if(options.secondary&&options.secondary!=='all'){const second=maskAt(data,w,h,x,y,{...options,region:options.secondary,secondary:'all',invert:false});mask=options.combine==='union'?Math.max(mask,second):mask*second;}return options.invert?1-mask:mask;
}
export function applyReactiveMask(original,modified,options){
 if(!options)return modified;if(!options.preview&&!options.invert&&(options.region||'all')==='all'&&(!options.secondary||options.secondary==='all')&&(options.strength??1)===1)return modified;
 const {width:w,height:h,data:a}=original,b=modified.data;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4,k=maskAt(a,w,h,x,y,options)*Math.max(0,Math.min(1,options.strength??1));if(options.preview){b[i]=b[i+1]=b[i+2]=k*255;b[i+3]=255;continue;}
  b[i]=a[i]+(b[i]-a[i])*k;b[i+1]=a[i+1]+(b[i+1]-a[i+1])*k;
  b[i+2]=a[i+2]+(b[i+2]-a[i+2])*k;b[i+3]=a[i+3]+(b[i+3]-a[i+3])*k;
 }
 return modified;
}
