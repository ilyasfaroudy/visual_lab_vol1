import {SurfaceContactTrail} from './SurfaceContactTrail.js';
import {heroConfig,HERO_DEFAULTS} from './heroConfig.js';
export const DUAL_IDENTITY=HERO_DEFAULTS;
const vertex=`attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;
// The vector mask becomes a signed distance volume: real depth, rounded bevels and moving apertures.
const fragment=`precision highp float;varying vec2 v;uniform vec2 res;uniform vec2 fieldSize;uniform vec2 mouse;uniform float motion;uniform float t;uniform sampler2D eyes;uniform vec4 contacts[8];uniform vec4 revealConfig;uniform float revealRadius;uniform float lightTheme;uniform float singleEye;
mat3 rx(float a){return mat3(1.,0.,0.,0.,cos(a),sin(a),0.,-sin(a),cos(a));}
mat3 ry(float a){return mat3(cos(a),0.,-sin(a),0.,1.,0.,sin(a),0.,cos(a));}
float noise(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float profile(vec2 p){
 p.x-=singleEye*.94;vec2 uv=p/fieldSize+.5;
 float outside=length(max(abs(p)-fieldSize*.5,0.));
 float outer=(dot(texture2D(eyes,clamp(uv,0.,1.)).rg,vec2(65280.,255.))/65535.-.5)*1.3+outside;
 vec2 gaze=(mouse-.5)*vec2(.115,.145);
 float hole=(dot(texture2D(eyes,clamp(uv-gaze,0.,1.)).ba,vec2(65280.,255.))/65535.-.5)*1.3;
 return max(max(outer,-hole),singleEye>.5?p.x+.06:-10.);
}
float sculpture(vec3 p){
 vec2 d=vec2(profile(p.xy)+.025,abs(p.z)-.105);
 return min(max(d.x,d.y),0.)+length(max(d,0.))-.025;
}
vec3 environment(vec3 r){
 float strip=exp(-pow((r.x+r.y*.32-.18)/.055,2.));
 float panel=exp(-pow((r.x-r.y*.45+.64)/.2,2.))*smoothstep(-.6,.5,r.z);
 float horizon=exp(-pow((r.y+.18)/.12,2.));
 vec3 base=mix(vec3(.23,.255,.29),vec3(.66,.70,.76),smoothstep(-.6,.85,r.y));
 return base+vec3(.92,.96,1.)*(strip*1.35+panel*.85+horizon*.26)+vec3(.27,.025,.075)*pow(max(0.,-r.x),5.);
}
void main(){
 float aspect=res.x/res.y;vec2 q=(v-vec2(.5,.61))*vec2(aspect,1.);
 float fit=min(1.,aspect/mix(1.45,.82,singleEye));q/=fit;
 vec2 tilt=(mouse-.5)*vec2(1.05,.76);
 // Inverse model rotation: positive screen-up gaze rotates the face upward.
 mat3 inv=rx(tilt.y)*ry(-tilt.x);
 vec3 ro=inv*vec3(-(mouse.x-.5)*.12,-(mouse.y-.5)*.08,4.);
 vec3 rd=inv*normalize(vec3(q*1.9,-3.2));
 vec3 color=mix(vec3(.011,.012,.017),vec3(.91,.89,.86),lightTheme);
 color+=mix(vec3(.045,.006,.018),vec3(-.055,-.075,-.07),lightTheme)*exp(-dot(q*vec2(1.,1.8),q*vec2(1.,1.8))*2.);
 // A single woven orbital structure sits behind the sculpture.
 vec2 orbit=q;orbit.y*=2.3;float angle=atan(orbit.y,orbit.x),r=length(orbit);
 float band=r-.83-.06*sin(angle*3.+t*.12);
 float envelope=exp(-band*band*210.);
 float fibers=pow(.5+.5*cos(band*950.+sin(angle*8.+t*.09)*2.),14.);
 color+=mix(1.,-.65,lightTheme)*mix(vec3(.065,.018,.034),vec3(.12,.13,.17),.5+.5*sin(angle*2.))*envelope*(.15+fibers*.55);
 float distance=1.65;vec3 point=vec3(0.);bool hit=false;
 for(int i=0;i<72;i++){
  point=ro+rd*distance;float d=sculpture(point);
  if(d<.0025){hit=true;break;}
  distance+=max(.001,d*.72);if(distance>6.4)break;
 }
 if(hit){
  vec2 e=vec2(.012,0.);vec3 n=normalize(vec3(sculpture(point+e.xyy)-sculpture(point-e.xyy),sculpture(point+e.yxy)-sculpture(point-e.yxy),sculpture(point+e.yyx)-sculpture(point-e.yyx)));
  // Broad slightly convex faces catch moving studio reflections, while the silhouette stays faithful.
  n=normalize(n+vec3(sin(point.x*1.7+point.y*.8)*.16,point.y*.14,0.)*pow(abs(n.z),4.));
  vec3 reflection=reflect(rd,n);float fresnel=pow(1.-max(0.,dot(-rd,n)),4.);
  float brushed=(noise(floor(point.xy*vec2(1700.,340.)))-.5)*.018;
  vec3 silver=environment(reflection)*(.84+.16*fresnel)+vec3(.12,.13,.15);
  silver+=vec3(.19,.026,.058)*pow(max(0.,dot(n,normalize(vec3(-1.,-.4,.25)))),7.);
  float cavity=clamp(profile(point.xy)*-7.+.88,.68,1.);
  color=mix(vec3(.075,.079,.087),silver*cavity+brushed,smoothstep(.12,.8,abs(n.z)));
  float influence=0.;
  // Anisotropic overlapping patches follow the eye's sweep, never a screen-space disc.
  vec2 tangent=normalize(vec2(1.,-.22*sign(point.x)+point.y*.16)),across=vec2(-tangent.y,tangent.x);
  for(int k=0;k<8;k++){
   vec3 delta=point-contacts[k].xyz;
   vec2 local=vec2(dot(delta.xy,tangent),dot(delta.xy,across))/max(.01,revealRadius);
   float warp=sin(point.x*19.+point.y*27.)*.06+sin(point.x*41.-point.y*13.)*.025;
   float a=length(vec3(local.x*.58,(local.y+warp)*1.38,delta.z/revealRadius*.65));
   float b=length(vec3((local.x-.62)*.92,(local.y-.09+warp)*2.25,delta.z/revealRadius));
   float c=length(vec3((local.x+.51)*1.1,(local.y+.14+warp)*2.4,delta.z/revealRadius));
   float patch=max(1.-smoothstep(.25,1.,a),max(1.-smoothstep(.1,.75,b),1.-smoothstep(.15,.72,c))*.85);
   influence=max(influence,contacts[k].w*patch);
  }
  // Local coordinates adhere to the turning surface, including its bevel.
  // Persistent object-space engraving. No time-dependent cell IDs or random refresh.
  vec3 innerPoint=point+rd*.018;
  vec2 surfaceUV=innerPoint.xy+innerPoint.z*vec2(.29,.43);
  surfaceUV.y+=sin(surfaceUV.x*5.)*.035;
  float footprint=1.9*distance/(3.2*res.y*fit);
  vec2 cell=floor(surfaceUV*revealConfig.z),f=fract(surfaceUV*revealConfig.z);
  float cellSeed=noise(cell);
  // Continuous low-frequency breakup keeps the reveal boundary coherent during rotation.
  float breakup=sin(surfaceUV.x*19.+sin(surfaceUV.y*11.))*sin(surfaceUV.y*23.)*.065;
  float erosion=influence+breakup*smoothstep(.02,.2,influence);
  float opened=smoothstep(.09,.48,erosion)*revealConfig.x;
  float aa=clamp(footprint*revealConfig.z*1.5,.025,.24);
  float edgeDistance=min(min(f.x,1.-f.x),min(f.y,1.-f.y));
  float seam=1.-smoothstep(.024,.024+aa,edgeDistance);
  vec2 guv=surfaceUV*revealConfig.y*.6,glyph=fract(guv),gc=floor(guv);
  float code=noise(gc),ga=clamp(footprint*revealConfig.y,.025,.22);
  float row=fract(glyph.y*4.);
  float bars=(1.-smoothstep(.13,.13+ga*3.,abs(row-.5)))*smoothstep(.1,.1+ga,glyph.x)*(1.-smoothstep(.3+code*.5,.3+code*.5+ga,glyph.x));
  float stem=(1.-smoothstep(.035,.035+ga,abs(glyph.x-.19)))*smoothstep(.09,.18,glyph.y)*(1.-smoothstep(.82,.92,glyph.y));
  float symbols=max(bars,stem);
  float path=abs(sin(surfaceUV.y*38.+sin(surfaceUV.x*6.)*2.));
  float conduit=1.-smoothstep(.025,.025+footprint*70.,path);
  float signal=.72+.28*sin(surfaceUV.x*5.-t*.65);
  float facet=.5+.5*cos(surfaceUV.x*22.+sin(surfaceUV.y*13.));
  vec3 innerNormal=normalize(n+vec3(sin(surfaceUV.x*22.)*.23,cos(surfaceUV.y*13.)*.18,0.));
  float innerLight=.48+.52*max(0.,dot(innerNormal,normalize(vec3(-.5,.8,1.))));
  float microHighlight=pow(max(0.,dot(reflect(rd,innerNormal),normalize(vec3(-.45,.7,.8)))),18.);
  vec3 core=mix(vec3(.19,.028,.062),vec3(.38,.065,.12),facet)*innerLight;
  core+=vec3(.83,.30,.43)*symbols*(.38+.35*signal)*revealConfig.w;
  core+=vec3(.95,.66,.71)*(conduit*.27+seam*.14+microHighlight*.26)*revealConfig.w;
  core+=vec3(.15,.019,.044)*opened;
  float lip=smoothstep(.055,.17,erosion)*(1.-smoothstep(.26,.49,erosion));
  color=mix(color,core,opened)+vec3(.52,.29,.34)*lip;
  // Narrow graphite recesses preserve depth without extinguishing the internal matter.
  color*=1.-opened*seam*.12;
 }
 color+=vec3((noise(gl_FragCoord.xy)-.5)*.003);
 vec3 displayColor=pow(max(color,0.)/(1.+max(color,0.)*.35),vec3(.92));
 if(lightTheme>.5&&!hit){displayColor=vec3(.961,.949,.929)-vec3(.027,.03,.028)*exp(-dot(q*vec2(1.,2.),q*vec2(1.,2.))*2.);displayColor-=vec3(.035,.02,.025)*envelope*(.12+fibers*.3);}
 gl_FragColor=vec4(displayColor,1.);
}`;
// Two chamfer transforms create signed distances to the silhouette and apertures once at load.
function distanceField(data,w,h,test){
 const inside=new Uint8Array(w*h);for(let i=0;i<inside.length;i++)inside[i]=test(data,i*4)?1:0;
 const transform=target=>{const a=new Float32Array(w*h);for(let i=0;i<a.length;i++)a[i]=inside[i]===target?0:1e4;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;let d=a[i];if(x)d=Math.min(d,a[i-1]+1);if(y){d=Math.min(d,a[i-w]+1);if(x)d=Math.min(d,a[i-w-1]+1.414214);if(x+1<w)d=Math.min(d,a[i-w+1]+1.414214);}a[i]=d;}
  for(let y=h-1;y>=0;y--)for(let x=w-1;x>=0;x--){const i=y*w+x;let d=a[i];if(x+1<w)d=Math.min(d,a[i+1]+1);if(y+1<h){d=Math.min(d,a[i+w]+1);if(x)d=Math.min(d,a[i+w-1]+1.414214);if(x+1<w)d=Math.min(d,a[i+w+1]+1.414214);}a[i]=d;}return a;};
 const a=transform(1),b=transform(0);for(let i=0;i<a.length;i++)a[i]=(a[i]-b[i])*3.6/(w-48);return a;
}
function shader(gl,kind,source){const s=gl.createShader(kind);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
export class Hero{
 constructor(canvas,settings){this.settings=heroConfig(settings);this.canvas=canvas;this.gl=canvas.getContext('webgl',{alpha:false,antialias:true,powerPreference:'low-power'});this.raf=0;this.move=[.5,.5];this.target=[.5,.5];this.velocity=0;this.targetVelocity=0;this.last=0;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.init();}
 async init(){const gl=this.gl;if(!gl){this.canvas.classList.add('hero-fallback');return;}
 try{const p=gl.createProgram(),a=shader(gl,gl.VERTEX_SHADER,vertex),b=shader(gl,gl.FRAGMENT_SHADER,fragment);gl.attachShader(p,a);gl.attachShader(p,b);gl.linkProgram(p);gl.deleteShader(a);gl.deleteShader(b);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));this.program=p;this.loc={};for(const n of ['res','fieldSize','mouse','motion','t','eyes','contacts[0]','revealConfig','revealRadius','lightTheme','singleEye'])this.loc[n]=gl.getUniformLocation(p,n);
 const buf=gl.createBuffer();this.buf=buf;gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
 const img=new Image();img.src='/assets/brand/sekret_eye_masks.svg';await img.decode();if(this.disposed)return;
 // Rasterize original vector at high resolution once; browser SVG default was softer on wide screens.
 const glyph=document.createElement('canvas');const maxTexture=gl.getParameter(gl.MAX_TEXTURE_SIZE)||2048;glyph.width=Math.min(maxTexture,1536);glyph.height=Math.round((glyph.width-48)*774/2047)+48;this.fieldSize=[3.6*glyph.width/(glyph.width-48),3.6*glyph.height/(glyph.width-48)];
 // Empty padding is essential: contours touching the texture edge otherwise extrude into spikes.
 glyph.getContext('2d').drawImage(img,24,24,glyph.width-48,glyph.height-48);
 const ctx=glyph.getContext('2d'),pixels=ctx.getImageData(0,0,glyph.width,glyph.height);
 const outer=distanceField(pixels.data,glyph.width,glyph.height,(d,i)=>d[i]+d[i+1]>128),hole=distanceField(pixels.data,glyph.width,glyph.height,(d,i)=>d[i+1]>128);
 this.surface={outer,hole,w:glyph.width,h:glyph.height};this.contactTrail=new SurfaceContactTrail();this.contacts=this.contactTrail.values;
 const signedPixels=new Uint8Array(outer.length*4);
 for(let y=0;y<glyph.height;y++)for(let x=0;x<glyph.width;x++){const i=y*glyph.width+x,j=((glyph.height-1-y)*glyph.width+x)*4;const a=Math.round(Math.max(0,Math.min(1,.5+outer[i]/1.3))*65535),b=Math.round(Math.max(0,Math.min(1,.5+hole[i]/1.3))*65535);signedPixels[j]=a>>8;signedPixels[j+1]=a&255;signedPixels[j+2]=b>>8;signedPixels[j+3]=b&255;}

 this.tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,glyph.width,glyph.height,0,gl.RGBA,gl.UNSIGNED_BYTE,signedPixels);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
 this.onPointer=e=>{const r=this.canvas.getBoundingClientRect();const x=(e.clientX-r.left)/r.width,y=1-(e.clientY-r.top)/r.height;const d=Math.hypot(x-this.target[0],y-this.target[1]);this.pointerInside=true;this.pointerUV=[x,y];this.target=[x,y];this.targetVelocity=Math.min(1,d*4+.05)};
 this.onLeave=()=>{this.pointerInside=false;this.targetVelocity=0;this.target=[.5,.5]};this.pointerHost=this.canvas.parentElement;this.pointerHost.addEventListener('pointermove',this.onPointer);this.pointerHost.addEventListener('pointerleave',this.onLeave);this.onDown=e=>{if(e.target===this.canvas){clearTimeout(this.touchRelease);this.onPointer(e)}};this.onUp=e=>{if(e.pointerType!=='mouse'){clearTimeout(this.touchRelease);this.touchRelease=setTimeout(()=>this.onLeave(),180)}};this.canvas.addEventListener('pointerdown',this.onDown);this.canvas.addEventListener('pointerup',this.onUp);this.canvas.addEventListener('pointercancel',this.onUp);this.tick(0);
 }catch(e){console.warn('Home shader unavailable:',e);this.canvas.classList.add('hero-fallback');this.canvas.style.background='radial-gradient(ellipse at 50% 40%,#28202a 0%,#09090b 55%)';}
 }
 surfaceHit(uv,aspect){
 const {outer,hole,w,h}=this.surface,fs=this.fieldSize;
 const sample=(data,u,v)=>{const x=Math.max(0,Math.min(w-1,u*w-.5)),y=Math.max(0,Math.min(h-1,(1-v)*h-.5)),ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
 const a=data[iy*w+ix],b=data[iy*w+Math.min(w-1,ix+1)],c=data[Math.min(h-1,iy+1)*w+ix],d=data[Math.min(h-1,iy+1)*w+Math.min(w-1,ix+1)];return (a+(b-a)*fx)*(1-fy)+(c+(d-c)*fx)*fy;};
 const ax=(this.move[1]-.5)*.76,ay=-(this.move[0]-.5)*1.05;
 const rotate=p=>{const x=Math.cos(ay)*p[0]+Math.sin(ay)*p[2],z=-Math.sin(ay)*p[0]+Math.cos(ay)*p[2];return [x,Math.cos(ax)*p[1]-Math.sin(ax)*z,Math.sin(ax)*p[1]+Math.cos(ax)*z]};
 const single=matchMedia('(max-width:700px)').matches;const fit=Math.min(1,aspect/(single?.82:1.45)),ro=rotate([-(this.move[0]-.5)*.12,-(this.move[1]-.5)*.08,4]);
 const ray=[(uv[0]-.5)*aspect/fit*1.9,(uv[1]-.61)/fit*1.9,-3.2],length=Math.hypot(...ray),rd=rotate(ray.map(v=>v/length));let travel=1.65;
 for(let i=0;i<72;i++){const p=ro.map((v,k)=>v+rd[k]*travel),u=(p[0]-(single?.94:0))/fs[0]+.5,v=p[1]/fs[1]+.5;
 const outside=Math.hypot(Math.max(0,Math.abs(p[0]-(single?.94:0))-fs[0]*.5),Math.max(0,Math.abs(p[1])-fs[1]*.5));
 const profile=Math.max(sample(outer,u,v)+outside,-sample(hole,u-(this.move[0]-.5)*.115,v-(this.move[1]-.5)*.145),single?p[0]-.88:-10);
 const x=profile+.025,z=Math.abs(p[2])-.105,d=Math.min(Math.max(x,z),0)+Math.hypot(Math.max(x,0),Math.max(z,0))-.025;
 if(d<.0025)return {point:p,travel};travel+=Math.max(.001,d*.72);if(travel>6.4)break;
 }return null;
 }
 tick(ms){if(!this.gl||!this.program||!this.canvas.isConnected)return;const gl=this.gl;this.raf=requestAnimationFrame(t=>this.tick(t));if(document.hidden)return;
 const rect=this.canvas.getBoundingClientRect(),scale=Math.min(window.devicePixelRatio||1,matchMedia('(max-width:700px)').matches?1.5:2);let w=Math.max(1,Math.round(rect.width*scale)),h=Math.max(1,Math.round(rect.height*scale));const cap=Math.min(1,1500/w,950/h);w=Math.round(w*cap);h=Math.round(h*cap);if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h}
 if(this.reduced){this.target=[.5,.5];}else if(matchMedia('(pointer: coarse)').matches&&this.targetVelocity<.01){this.target=[.5+.12*Math.sin(ms*.00027),.5+.08*Math.sin(ms*.00019)];}
 const tracking=1-Math.exp(-Math.min(.06,Math.max(.001,(ms-(this.trackLast??ms-16))/1000))*7);this.trackLast=ms;this.move[0]+=(this.target[0]-this.move[0])*tracking;this.move[1]+=(this.target[1]-this.move[1])*tracking;this.velocity+=(this.targetVelocity-this.velocity)*.08;this.targetVelocity*=.91;
 const dt=Math.min(.06,Math.max(.001,(ms-(this.revealLast??ms-16))/1000));this.revealLast=ms;
 const hit=this.pointerInside?this.surfaceHit(this.pointerUV,w/h):null;
 this.contactTrail.update(hit,dt,this.settings,this.pointerInside);
 if(hit)this.hitDistance=hit.travel;
 // Short tail supplies hover hysteresis without revealing any background pixels.
 const radius=this.settings.radius/Math.max(1,rect.height)*1.9*(this.hitDistance||4)/3.2/Math.min(1,w/h/1.45);
 gl.viewport(0,0,w,h);gl.useProgram(this.program);gl.uniform4fv(this.loc['contacts[0]'],this.contacts);gl.uniform1f(this.loc.revealRadius,radius);gl.uniform1f(this.loc.singleEye,matchMedia('(max-width:700px)').matches?1:0);gl.uniform1f(this.loc.lightTheme,document.documentElement.dataset.theme==='light'?1:0);gl.uniform4f(this.loc.revealConfig,this.settings.strength,this.settings.detail,this.settings.fragments,this.settings.brightness);gl.bindBuffer(gl.ARRAY_BUFFER,this.buf);const loc=gl.getAttribLocation(this.program,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
 gl.uniform2f(this.loc.res,w,h);gl.uniform2f(this.loc.fieldSize,...this.fieldSize);gl.uniform2f(this.loc.mouse,...this.move);gl.uniform1f(this.loc.motion,this.reduced?0:this.velocity);gl.uniform1f(this.loc.t,this.reduced?0:ms*.001);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.tex);gl.uniform1i(this.loc.eyes,0);gl.drawArrays(gl.TRIANGLES,0,6);
 }
 dispose(){clearTimeout(this.touchRelease);this.canvas.removeEventListener('pointerdown',this.onDown);this.canvas.removeEventListener('pointerup',this.onUp);this.canvas.removeEventListener('pointercancel',this.onUp);this.disposed=true;cancelAnimationFrame(this.raf);this.pointerHost?.removeEventListener('pointermove',this.onPointer);this.pointerHost?.removeEventListener('pointerleave',this.onLeave);if(this.gl){this.gl.deleteProgram(this.program);this.gl.deleteBuffer(this.buf);this.gl.deleteTexture(this.tex)}}
}
