// One bounded analysis per source. No image readback in the animation loop.
export function extractMaterialDNA({data,width,height}){
 const samples=[];let sum=0,squares=0,edges=0,weight=0;
 const luminance=i=>(data[i]*.2126+data[i+1]*.7152+data[i+2]*.0722)/255;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4,a=data[i+3]/255;if(a<.1)continue;const l=luminance(i);sum+=l*a;squares+=l*l*a;weight+=a;samples.push({l,r:data[i],g:data[i+1],b:data[i+2],a});
  if(x+1<width)edges+=Math.abs(l-luminance(i+4))*a;
  if(y+1<height)edges+=Math.abs(l-luminance(i+width*4))*a;
 }
 if(!weight)return {palette:['#08090b','#6b5762','#eadce3'],luminance:0,contrast:0,edges:0};
 samples.sort((a,b)=>a.l-b.l);const palette=[];
 for(let band=0;band<3;band++){let r=0,g=0,b=0,n=0;const start=Math.floor(samples.length*band/3),end=Math.max(start+1,Math.floor(samples.length*(band+1)/3));for(let j=start;j<end;j++){const p=samples[Math.min(j,samples.length-1)];r+=p.r*p.a;g+=p.g*p.a;b+=p.b*p.a;n+=p.a;}palette.push('#'+[r,g,b].map(x=>Math.round(x/n).toString(16).padStart(2,'0')).join(''));}
 const mean=sum/weight;return {palette,luminance:mean,contrast:Math.sqrt(Math.max(0,squares/weight-mean*mean)),edges:Math.min(1,edges/weight*2)};
}
