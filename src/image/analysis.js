// Immutable ImageData identity is the cache key; analysis is shared by effects/masks.
const cache=new WeakMap();
export function analyzeImage(source){
 if(cache.has(source))return cache.get(source);
 const scale=Math.min(1,768/Math.max(source.width,source.height)),w=Math.max(1,Math.round(source.width*scale)),h=Math.max(1,Math.round(source.height*scale)),n=w*h;
 const luminance=new Float32Array(n),saturation=new Float32Array(n),hue=new Float32Array(n),gx=new Float32Array(n),gy=new Float32Array(n),edge=new Float32Array(n),contrast=new Float32Array(n),texture=new Float32Array(n);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=y*w+x,j=(Math.min(source.height-1,Math.floor((y+.5)/h*source.height))*source.width+Math.min(source.width-1,Math.floor((x+.5)/w*source.width)))*4,d=source.data;
  const r=d[j]/255,g=d[j+1]/255,b=d[j+2]/255,hi=Math.max(r,g,b),lo=Math.min(r,g,b),delta=hi-lo;
  luminance[i]=(.2126*r+.7152*g+.0722*b)*d[j+3]/255;saturation[i]=hi?delta/hi:0;
  hue[i]=delta===0?0:((hi===r?(g-b)/delta+6:hi===g?(b-r)/delta+2:(r-g)/delta+4)%6)/6;
 }
 const at=(x,y)=>luminance[Math.max(0,Math.min(h-1,y))*w+Math.max(0,Math.min(w-1,x))];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=y*w+x,a=at(x-1,y-1),b=at(x,y-1),c=at(x+1,y-1),d=at(x-1,y),e=at(x+1,y),f=at(x-1,y+1),g=at(x,y+1),k=at(x+1,y+1);
  gx[i]=(c+2*e+k-a-2*d-f)/8;gy[i]=(f+2*g+k-a-2*b-c)/8;edge[i]=Math.min(1,Math.hypot(gx[i],gy[i])*4);
  const mean=(a+b+c+d+e+f+g+k)/8;contrast[i]=Math.sqrt(((a-mean)**2+(b-mean)**2+(c-mean)**2+(d-mean)**2+(e-mean)**2+(f-mean)**2+(g-mean)**2+(k-mean)**2)/8);
  texture[i]=Math.min(1,Math.abs(4*luminance[i]-b-d-e-g)*2);
 }
 const result={width:w,height:h,luminance,saturation,hue,gx,gy,edge,contrast,texture,index(x,y){return Math.max(0,Math.min(h-1,Math.floor(y/source.height*h)))*w+Math.max(0,Math.min(w-1,Math.floor(x/source.width*w)))}};
 cache.set(source,result);return result;
}
