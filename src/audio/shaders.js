import {FLUID_GLSL} from './fluidMatter.js';
import {AUDIO_STUDIES_GLSL} from './audioStudies.js';
export const VERTEX=`attribute vec2 a_position; varying vec2 v_uv;
void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}`;

export const FRAGMENT=`#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
#endif
precision highp float;
varying vec2 v_uv;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_scene;
uniform float u_variant;
uniform float u_dt;
uniform vec4 u_finish; // exposure, gamma, midpoint, interpolation
uniform vec4 u_dna;
uniform vec4 u_compose; // mix, blend, imprint, reserved
uniform float u_directorScene;
uniform float u_directorBlend;
uniform float u_p[8];
uniform float u_sig[8];
uniform vec3 u_colors[3];
uniform vec4 u_colorControls; // hue, saturation, brightness, contrast
uniform sampler2D u_media;
uniform sampler2D u_history;
uniform sampler2D u_geometry;uniform sampler2D u_particles;
uniform float u_hasMedia;
uniform float u_hasHistory;
uniform float u_gradientStyle;
uniform sampler2D u_waveform;
uniform sampler2D u_spectrum;uniform sampler2D u_spectralHistory;uniform float u_spectralHead;
uniform float u_hasAudio;
uniform vec4 u_interaction;uniform vec2 u_stroke;uniform vec2 u_pointer;uniform vec4 u_evolution;uniform vec3 u_camera;uniform vec2 u_pan;
uniform vec4 u_mediaMaskParams; // region, threshold, feather, invert

#define PI 3.14159265359
float hash21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
vec2 hash22(vec2 p){return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash21(i),hash21(i+vec2(1.,0.)),f.x),mix(hash21(i+vec2(0.,1.)),hash21(i+1.),f.x),f.y);}
float fbm(vec2 p){float f=0.,a=.5;for(int i=0;i<4;i++){f+=a*noise(p);p=p*2.02+vec2(11.3,9.7);a*=.5;}return f;}
float segment(vec2 p,vec2 a,vec2 b){vec2 d=b-a;return length(p-(a+d*clamp(dot(p-a,d)/max(dot(d,d),.00001),0.,1.)));}
vec3 ramp(float x){x=clamp(x,0.,1.);float m=clamp(u_finish.z,.08,.92);float f=x<m?x/m:(x-m)/(1.-m);if(u_finish.w>.5)f=f*f*(3.-2.*f);vec3 a=x<m?u_colors[0]:u_colors[1],b=x<m?u_colors[1]:u_colors[2];return sqrt(mix(a*a,b*b,f));}
float lum(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
vec3 hueShift(vec3 color,float angle){vec3 k=vec3(.57735);float ca=cos(angle),sa=sin(angle);return color*ca+cross(k,color)*sa+k*dot(k,color)*(1.-ca);}
vec3 colorGrade(vec3 c){c=hueShift(c,u_colorControls.x*PI/180.);c=mix(vec3(lum(c)),c,u_colorControls.y);c=(c-.5)*u_colorControls.w+.5;c*=u_colorControls.z;return clamp(c,0.,1.);}
vec2 aspectUV(vec2 uv){return vec2((uv.x-.5)*u_resolution.x/max(1.,u_resolution.y)+.5,uv.y);}
float lineGlow(float d,float thickness){return thickness/(d+thickness);}
float osc(float x,float t){float real=texture2D(u_waveform,vec2(clamp(fract(x),.001,.999),.5)).r*2.-1.;float synth=sin(x*31.+t*2.2)*.6+sin(x*73.-t*.65)*.25+sin(x*131.+t*.51)*.13;return mix(synth,real,u_hasAudio);}
float spec(float x){float v=texture2D(u_spectrum,vec2(clamp(x,.001,.999),.5)).r;return mix(.2+.4*sin(x*13.+u_time*1.5)*sin(x*6.-u_time),v,u_hasAudio);}
float fineGrain(vec2 p){return hash21(floor(p*u_resolution*.52)+vec2(floor(u_time*9.)));}
float ridgeNoise(vec2 p){return 1.-abs(2.*fbm(p)-1.);}
vec3 lightInk(float field,float tone){return ramp(clamp(tone+.34*field,0.,1.))*max(0.,field)*2.45;}


float filamentAA(float phase){
 float width=.08;
 #ifdef GL_OES_standard_derivatives
 width=max(.055,min(.65,fwidth(phase)*.6));
 #endif
 float d=abs(fract(phase)-.5);return exp(-d*d/(width*width))*.11/width;
}
vec2 flow(vec2 p,float t){return vec2(sin(p.y*2.7+t)+cos(p.x*1.7-p.y*.8-t*.71),-cos(p.x*2.7-t)+sin(p.y*1.3+p.x*.6+t*.43));}
mat2 rotate2(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
float dnaTone(vec2 uv){return lum(texture2D(u_media,clamp(uv,0.,1.)).rgb);}
vec3 particleSample(vec2 uv){if(any(lessThan(uv,vec2(0.)))||any(greaterThan(uv,vec2(1.))))return vec3(0.);return texture2D(u_particles,uv).rgb;}
vec3 particleWeb(vec2 uv,float t){return particleSample(uv);}
vec2 manipulate(vec2 uv,float viscosity){
 vec2 ratio=vec2(u_resolution.x/u_resolution.y,1.),d=(uv-u_interaction.xy)*ratio;
 float reach=exp(-dot(d,d)*32.)*u_interaction.z;vec2 offset=vec2(0.);
 if(u_interaction.w<1.5)offset=d*reach*.65;
 else if(u_interaction.w<2.5)offset=-d*reach*.8;
 else if(u_interaction.w<3.5)offset=-u_stroke*ratio*reach*viscosity;
 else offset=vec2(-d.y,d.x)*reach*.85+normalize(d+vec2(.001))*sin(length(d)*65.-u_time*2.)*reach*.012;
 return uv+offset/ratio;
}
float activation(float cell,float count,float total){float rank=mod(cell*17.,total);return 1.-smoothstep(count-.7,count+.3,rank);}
vec3 ribbons(vec2 uv,float t){uv=manipulate(uv,1.5);
 vec2 q=(aspectUV(uv)-.5)*.8;vec2 cursor=(aspectUV(u_pointer)-.5)*.8;

 float travel=t*(.07+.13*u_p[1]);vec3 col=vec3(0.);
 for(int j=0;j<4;j++){
  float k=float(j);vec2 p=rotate2(-.35+k*.65+sin(travel*.32)*.18)*q;
  p+=flow(p*3.+k,travel)*(.018+.018*u_p[5]);
  float radius=length(p),angle=atan(p.y,p.x);
  float lane,along,edge;
  if(u_variant<1.5){
   float fold=sin(p.x*(5.+u_p[2]*2.)+travel+k*.8);
   float center=fold*.17+.055*sin(p.x*11.-travel*.6+k);
   float width=.025+(.055+.055*u_p[4])*(.12+pow(abs(cos(p.x*5.+travel+k)),2.));
   lane=(p.y-center-(k-1.5)*.035)/width;along=p.x;edge=exp(-pow(abs(p.x)*1.12,4.));
  }else{
   float contour=.23+.035*sin(angle*3.+travel+k*.6)+.025*sin(angle*7.-travel*.5)*u_p[2];
   float width=.018+.045*u_p[4]*(.35+.65*pow(sin(angle*2.+travel+k),2.));
   lane=(radius-contour-k*.012)/width;along=angle*.22;edge=1.;
  }
  lane+=(dnaTone(uv)-.5)*u_dna.w*.8;
  float count=max(2.,u_p[0]),phase=(lane*.5+.5)*44.;
  phase+=sin(along*31.+travel+k+lane*2.)*.16*u_p[5];
  float membrane=1.-smoothstep(.82,1.02,abs(lane));
  float threads=filamentAA(phase)*(.5+.5*pow(abs(cos(along*8.+k+travel)),3.));
  float fine=filamentAA(phase*(2.+u_p[6]))*.13*u_p[6];
  float sheen=pow(max(0.,cos(lane*1.2+along*7.+travel+k)),12.);
  float silk=(threads+fine+.025+sheen*.09)*membrane*edge*activation(floor(phase),count,44.);
  float depth=.4+.6*(.5+.5*sin(along*6.+k+travel));
  col+=ramp(.5+k*.1+lane*.08)*silk*depth*(1.15+u_p[3])/(1.+k*.2);
 }
 return col;
}

vec3 feedbackField(vec2 uv,float t){
 vec2 p=aspectUV(uv)-.5;float time=t*(.16+.22*u_p[1]),energy=.15+u_sig[0]*.5+u_sig[5]*.6;vec3 col=vec3(0.);p*=1.25-.018*u_p[0];p+=flow(p*3.,time*.2)*.012*u_p[5];
 if(u_variant<.5){
  // Moving emissive filaments are injected into the previous-frame resonance buffer.
  for(int i=0;i<6;i++){float k=float(i),a=time*.45+k*1.047;vec2 center=vec2(cos(a),sin(a*1.3))*(.08+.07*u_p[4]);float radius=.12+.025*k+.02*sin(time+k);float d=abs(length(p-center)-radius);float arc=.2+.8*pow(.5+.5*cos(atan(p.y-center.y,p.x-center.x)*3.-time-k),4.);col+=ramp(.45+k*.07)*exp(-d*(450.-u_p[6]*90.))*arc*energy/(1.+k*.25);}
 }else if(u_variant<1.5){
  float wave=sin(p.x*(5.+u_p[0]*.22)-time)*.15*u_p[4]+sin(p.x*11.+time*.4)*.04;float d=abs(p.y-wave);float pulse=pow(.5+.5*sin(p.x*7.-time*.8),3.);col=ramp(.6+p.x*.2)*exp(-d*(420.-u_p[6]*90.))*(.25+energy)*pulse;
 }else if(u_variant<2.5){
  vec2 q=rotate2(time*.16)*p;float square=max(abs(q.x),abs(q.y)),radius=.16+.035*sin(time*.7);float d=abs(square-radius);float ridge=pow(.5+.5*cos(atan(q.y,q.x)*4.+time),4.);col=ramp(.7)*exp(-d*(450.-u_p[6]*70.))*(.25+energy)*(.3+ridge);
 }else{
  for(int i=0;i<8;i++){float k=float(i),phase=time*.3+k*.71;vec2 center=vec2(sin(phase*1.3)*.42,cos(phase*.9)*.25)*(.7+.4*u_p[4]);vec2 q=p-center;float stroke=exp(-abs(q.y-sin(q.x*19.+phase)*.018)*300.)*exp(-q.x*q.x*320.);float halo=exp(-dot(q,q)*400.);col+=ramp(.3+k*.08)*(stroke*.6+halo*.08)*(.2+energy)*(.4+.6*spec(k*.1));}
 }
 return col*(.6+.6*u_p[3]);
}
${FLUID_GLSL}
vec3 geometryField(vec2 uv,float t){if(uv.x<0.||uv.y<0.||uv.x>1.||uv.y>1.)return vec3(0.);return texture2D(u_geometry,uv).rgb;}

float reactiveContentMask(vec2 uv,vec3 source){
 float mode=u_mediaMaskParams.x,threshold=u_mediaMaskParams.y,feather=max(.006,u_mediaMaskParams.z);
 float l=lum(source),s=max(max(source.r,source.g),source.b)-min(min(source.r,source.g),source.b);
 float m=1.;
 if(mode<.5)m=1.;
 else if(mode<1.5)m=1.-smoothstep(threshold-feather,threshold+feather,l);
 else if(mode<2.5)m=smoothstep(0.,threshold,l)*(1.-smoothstep(threshold,1.,l))*2.5;
 else if(mode<3.5)m=smoothstep(threshold-feather,threshold+feather,l);
 else if(mode<4.5){vec2 d=1./u_resolution;float edge=length(texture2D(u_media,uv+vec2(d.x,0.)).rgb-source)+length(texture2D(u_media,uv+vec2(0.,d.y)).rgb-source);m=smoothstep(threshold*.22,threshold*.22+feather,edge);}
 else if(mode<5.5)m=smoothstep(threshold-feather,threshold+feather,s);
 else m=1.-smoothstep(threshold-feather,threshold+feather,s);
 return u_mediaMaskParams.w>.5?1.-m:clamp(m,0.,1.);
}
vec3 mediaReactive(vec2 uv,float t){
 vec2 p=uv;float beat=u_sig[5],bass=u_sig[0],mid=u_sig[2],treble=u_sig[3];
 float energy=spec(clamp(uv.x*.8,0.,1.));
 float noiseBand=fbm(vec2(uv.y*14.+t*.12,uv.x*3.-t*.09));
 float rolling=sin(uv.y*(27.+u_p[5]*11.)-t*(.5+u_p[1]*2.))*.004;
 p+=flow((uv-.5)*3.,t*.06)*.012*u_p[1]*(.2+bass);
 float tearLine=noise(vec2(floor(uv.y*(18.+u_p[0])),t*(.35+u_p[1])));
 float tear=(tearLine>.74?tearLine-.53:0.)*u_p[5]*beat*.12;
 p.x+=(noiseBand-.5)*.044*u_p[1]*(.4+bass)+rolling*mid+tear;
 p.y+=sin(uv.x*13.+t*.21)*.018*u_p[2]*treble;
 p=(p-.5)*(1.-u_p[4]*.09*(.3+bass*.7))+.5;
 float pixelGrid=max(3.,u_p[0]*7.);
 vec2 quantized=floor(p*pixelGrid+.5)/pixelGrid;
 p=mix(p,quantized,clamp(beat*.42+u_p[6]*.12,0.,.8));
 vec3 c=vec3(.035);
 if(u_hasMedia>.5){
   vec2 e=vec2(2./u_resolution.x,2./u_resolution.y);
   vec2 gradient=vec2(lum(texture2D(u_media,clamp(uv+vec2(e.x,0.),0.,1.)).rgb)-lum(texture2D(u_media,clamp(uv-vec2(e.x,0.),0.,1.)).rgb),lum(texture2D(u_media,clamp(uv+vec2(0.,e.y),0.,1.)).rgb)-lum(texture2D(u_media,clamp(uv-vec2(0.,e.y),0.,1.)).rgb));
   float structure=lum(texture2D(u_media,uv).rgb);
   if(u_variant<.5){
    // Advect along actual image contours, with local pressure across them.
    vec2 advected=p;for(int k=0;k<3;k++){
     vec2 g=vec2(lum(texture2D(u_media,clamp(advected+vec2(e.x,0.),0.,1.)).rgb)-lum(texture2D(u_media,clamp(advected-vec2(e.x,0.),0.,1.)).rgb),lum(texture2D(u_media,clamp(advected+vec2(0.,e.y),0.,1.)).rgb)-lum(texture2D(u_media,clamp(advected-vec2(0.,e.y),0.,1.)).rgb));
     advected+=(vec2(-g.y,g.x)*mid+g*bass)*u_p[1]*.18;
    }p=advected;
   }
   else if(u_variant<1.5){float cell=max(8.,u_p[0]*5.);vec2 block=(floor(p*cell)+.5)/cell;float dissolve=smoothstep(.1,.7,1.-structure)*beat; p=mix(p,block,clamp(dissolve*u_p[5]*2.,0.,1.));}
   else if(u_variant>2.5)p+=normalize(gradient+vec2(.0001))*(.002+.02*mid)*sin(structure*35.+t*.15)*u_p[1];
   float off=.008*u_p[2]*(treble+beat*.6+energy*.2);
   c.r=texture2D(u_media,clamp(p+vec2(off,0.),0.,1.)).r;
   c.g=texture2D(u_media,clamp(p,0.,1.)).g;
   c.b=texture2D(u_media,clamp(p-vec2(off,0.),0.,1.)).b;
   vec3 original=texture2D(u_media,uv).rgb;
   float edge=length(original-texture2D(u_media,clamp(uv+vec2(.002,0.),0.,1.)).rgb);
   float edgeInk=clamp(edge*3.*u_p[6],0.,1.);
   vec3 reliefNormal=normalize(vec3(-gradient*5.,1.));float reliefLight=pow(max(0.,dot(reliefNormal,normalize(vec3(-.5,.65,1.)))),18.);
   float contour=filamentAA(structure*(8.+u_p[6]*12.))*length(gradient);
   c=clamp((c-.5)*(.5+u_p[3])+.5+edgeInk*ramp(.75)*.22+(reliefLight*.1+contour*.25)*ramp(.9)*u_p[6]*(.2+mid),0.,1.);
   return mix(original,c,reactiveContentMask(uv,original));
 }
 float f=fbm((p-.5)*9.+vec2(t*.08,-t*.13));
 float veins=exp(-abs(fract(f*10.+sin(p.x*14.+t*.24)*.6)-.5)*38.);
 float scan=pow(abs(sin(p.y*220.+t*.9)),21.)*.045;
 return lightInk(.36*f+.52*veins+scan,.31+f*.33);
}

float glyph(vec2 uv){
 // The source texture contains the user's complete typeset line, cached between edits.
 return texture2D(u_media,clamp(uv,0.,1.)).a*step(0.,uv.x)*step(uv.x,1.)*step(0.,uv.y)*step(uv.y,1.);
}
vec3 typeCylinder(vec2 uv,float t,float layer){
 vec2 q=aspectUV(uv)-.5;
 q=rotate2(-.18+sin(t*.14+layer)*.12+layer*.32)*q;
 float radius=.37+.07*u_p[4];
 float nx=q.x/radius;
 float shell=1.-smoothstep(.96,1.02,abs(nx));
 float z=sqrt(max(.001,1.-nx*nx));
 float longitude=asin(clamp(nx,-.999,.999))/PI+.5;
 float rows=4.+u_p[4]*4.;
 vec2 textUV=vec2(fract(longitude*2.+t*(.025+.045*u_p[1])+layer*.19),fract(q.y*rows/(.65+.35*z)+.5+t*.025));
 textUV.y=(textUV.y-.5)*.66+.5;
 float ink=glyph(textUV);
 float edge=glyph(textUV+vec2(.003,-.008))-ink;
 float lighting=.15+.85*pow(z,.65);
 float vertical=1.-smoothstep(.42,.51,abs(q.y));
 vec3 tone=ramp(.35+.4*z+q.y*.2);
 return tone*(ink*lighting+max(0.,edge)*.35)*shell*vertical;
}
vec3 reactiveTypography(vec2 uv,float t){
 if(u_variant>19.5){uv=rotate2(u_camera.x*.3)*(uv-.5)/u_camera.z+.5;uv.y+=u_camera.y*.1;if(any(lessThan(uv,vec2(0.)))||any(greaterThan(uv,vec2(1.))))return vec3(0.);return ramp(.4+uv.y*.5)*texture2D(u_media,uv).a*(.8+.3*u_p[3]);}
 if(u_variant>11.5){
  vec2 grid=vec2(40.,22.),cell=floor(uv*grid),center=(cell+.5)/grid;
  float activation=smoothstep(.08,.8,u_sig[5]*.65+u_sig[0]*.45),seed=fract(sin(dot(cell,vec2(127.1,311.7)))*43758.5453);
  vec2 flow=vec2(sin(center.y*7.+t*.32),cos(center.x*6.-t*.25));
  vec2 offset=flow*activation*(.025+.11*u_p[2])*(.3+seed);
  vec2 sampleUV=(uv-offset-.5)/max(.3,u_p[0])+.5;
  sampleUV.y+=sin(sampleUV.x*8.+t*.3)*.012*u_p[1];
  float ink=glyph(sampleUV),seam=smoothstep(.01,.09,min(fract(uv.x*grid.x),fract(uv.y*grid.y)));
  return ramp(.25+seed*.45)*ink*mix(1.,seam,activation)*(.9+.3*u_p[3]);
 }
if(u_variant>10.5)return particleSample(uv);uv=manipulate(uv,.55);uv=rotate2(u_camera.x*.22)*(uv-.5)/u_camera.z+.5;uv.y+=u_camera.y*.12;
 vec2 q=aspectUV(uv)-.5;float beat=u_sig[5],bass=u_sig[0];
 // Default: a rotating typographic cylinder. Audio changes torsion and illumination,
 // rather than shaking a flat word. The whole canvas is an editable composition.
 if(u_variant<.5|| (u_variant>5.5&&u_variant<6.5)){
  vec2 warped=uv;warped.y+=sin(uv.x*6.+t*.16)*.008*u_p[2];warped.x+=sin(uv.y*7.+t*.3)*(.015+.025*u_p[2])*(.3+bass);
  vec3 front=typeCylinder(warped,t,0.);
  if(u_variant>5.5){vec3 other=typeCylinder(vec2(uv.y,1.-uv.x),t*.8,1.);front=max(front,other*.65);}
  return front*(.8+.35*u_p[3]+beat*.18);
 }
 if(u_variant>6.5&&u_variant<7.5){
  // Perspective tunnel: concentric text rings with independently advancing depth.
  float r=length(q),angle=atan(q.y,q.x)/6.283+.5;
  float depth=-log(max(.035,r))*2.3-t*(.1+.14*u_p[1]);
  float ring=floor(depth),local=fract(depth);
  vec2 p=vec2(fract(angle*(3.+floor(u_p[4]*2.))+ring*.13+t*.025),.5+(local-.5)*.6);
  float ink=glyph(p);float shadow=smoothstep(.02,.17,local)*(1.-smoothstep(.85,1.,local));
  return ramp(.35+.4*fract(ring*.17))*ink*shadow*smoothstep(.025,.13,r)*(1.-smoothstep(.72,1.1,r))*(.65+.6*u_p[3]);
 }
 if(u_variant>9.5){
  vec3 color=vec3(0.);vec2 p=rotate2(-.3)*(aspectUV(uv)-.5);
  for(int i=0;i<4;i++){
   float k=float(i),center=.19*sin(p.x*4.+t*.2+k*.7)+(k-1.5)*.13;
   float width=.07+.035*(.5+.5*cos(p.x*6.+t*.12+k));
   float lane=(p.y-center)/width;
   vec2 tex=vec2(fract(p.x*(1.5+u_p[0])+t*.04*u_p[1]+k*.2),.5+lane*.28);
   tex.x+=lane*.045*sin(p.x*7.+t*.2)*u_p[2];
   float ink=glyph(tex)*(1.-smoothstep(.95,1.05,abs(lane)));
   float light=.22+.78*pow(.5+.5*cos(p.x*5.+lane+k+t*.2),2.);
   color=max(color,ramp(.48+k*.12)*ink*light*(.8+.5*u_p[3]));
  }
  return color;
 }
 if(u_variant>8.5){
  vec2 p=rotate2(-.2+t*.025*u_p[1])*q;float radius=.42+.07*u_p[4];
  p+=flow(p*3.,t*.12)*.018*u_p[2];float r=length(p)/radius;
  if(r>1.)return vec3(0.);
  vec3 n=normalize(vec3(p/radius,sqrt(max(.001,1.-r*r))));
  float longitude=atan(n.x,n.z)/6.283+.5+t*.025*u_p[1]+u_camera.x*.12;
  float latitude=asin(n.y)/3.142+.5;
  vec2 tex=vec2(fract(longitude*(3.+u_p[0]*3.)),fract(latitude*(5.+u_p[4]*4.)));
  tex.y=.5+(tex.y-.5)*.68;float ink=glyph(tex);
  float shade=.16+.84*max(0.,dot(n,normalize(vec3(-.6,.8,1.))));
  float rim=pow(1.-n.z,4.);
  return ramp(.65+n.y*.22)*(ink*shade+rim*.07)*(.7+.4*u_p[3])*(1.-smoothstep(.985,1.,r));
 }
 if(u_variant>7.5){
  vec2 p=rotate2(-.17)*(aspectUV(uv)-.5);float travel=t*.12*u_p[1];
  float fold=sin(p.x*6.+travel)+.35*sin(p.x*13.-travel*.6);
  float height=.16*fold*(.4+u_p[2]);
  p.y+=height+sin(p.y*7.+p.x*2.+travel)*.03*u_p[6];
  float rows=4.+floor(u_p[4]*4.),row=floor((p.y+.5)*rows);
  vec2 tex=vec2(fract(p.x*(1.+u_p[0])+(mod(row,2.)-.5)*travel),fract((p.y+.5)*rows));tex.y=.5+(tex.y-.5)*.68;
  float slope=cos(p.x*6.+travel)*(.4+u_p[2]);
  float shade=.25+.75*max(0.,dot(normalize(vec3(-slope,.2,1.)),normalize(vec3(-.7,.6,1.))));
  float ink=glyph(tex),edge=glyph(tex+vec2(.004,.007))*(1.-ink);
  return ramp(.55+.3*uv.y)*(ink*shade+edge*.18)*(.7+.35*u_p[3]);
 }
 vec2 p=uv;
 if(u_variant<1.5){
  // Stable fragment cells fly out from the glyph and reassemble with the transient.
  vec2 cell=floor(uv*vec2(110.,65.)),rnd=hash22(cell);
  vec2 movement=(rnd-.5)*pow(beat,.65)*(.08+.15*u_p[2]);
  p=uv-movement;float angle=(rnd.x-.5)*beat*1.2;
  p=(rotate2(angle)*(p-(cell+.5)/vec2(110.,65.)))+(cell+.5)/vec2(110.,65.);
  p.y=.5+(p.y-.5)*1.5;
  float ink=glyph(p);float dotMask=1.-smoothstep(.28,.5,length(fract(uv*vec2(110.,65.))-.5));
  return ramp(.3+.5*rnd.y)*ink*mix(1.,dotMask,beat)*(.9+.45*u_p[3]);
 }
 if(u_variant<3.5){
  // An architectural type grid with individual column stretch and spectral curvature.
  float columns=2.+floor(u_p[4]*2.);vec2 cell=vec2(floor(uv.x*columns),floor(uv.y*4.));
  p=fract(uv*vec2(columns,4.));
  p.y=.5+(p.y-.5)*(.55+.2*sin(cell.x*1.8+t*.4+bass));
  p.x+=sin(p.y*5.+t*.4+cell.y)*.05*u_p[2];
  float ink=glyph(p);if(u_variant>2.5)ink*=.4+.6*filamentAA(uv.y*180.+osc(uv.x,t)*2.);
  return ramp(.32+.45*uv.x)*ink*(.7+.4*u_p[3]);
 }
 if(u_variant<4.5){
  vec3 color=vec3(0.);
  for(int i=0;i<7;i++){float k=float(i);vec2 v=rotate2(.035*k+sin(t*.13)*.08)*(uv-.5);v=v*pow(1.17,k)+.5;v.x+=sin(t*.2+k*.3)*.018;float ink=glyph(v);color=max(color,ramp(.27+k*.08)*ink*(1.-k*.1));}
  return color;
 }
 vec2 fold=rotate2(-.18)*(uv-.5);fold.y+=sin(fold.x*7.+t*.25)*.07*u_p[2];
 vec2 v=vec2(fract(fold.x*1.7+t*.025),fract(fold.y*5.+.5));v.y=.5+(v.y-.5)*.65;
 float off=.004+.016*beat*u_p[5];vec3 ink=vec3(glyph(v+vec2(off,0.)),glyph(v),glyph(v-vec2(off,0.)));
 return ink*ramp(.5+.35*sin(fold.x*3.+t*.1))*(.85+.4*u_p[3]);
}

vec3 gradients(vec2 uv,float t){
 uv+=vec2(sin(uv.y*4.+t*.09),cos(uv.x*5.-t*.07))*.012*u_p[2]*(.3+u_sig[2]);
 vec2 p=aspectUV(uv)-.5;float speed=.03+.12*u_p[1];
 float n=fbm(p*(2.+u_p[0]*.2)+vec2(t*speed,-t*speed*.6));
 vec2 warp=p+flow(p*2.,t*.12)*.05*u_p[2];
 // Counter-advected layers carry local spectral pressure into the color boundaries.
 vec2 lower=p+flow(p*1.7,-t*speed*.6)*.12;
 float pressure=exp(-dot(lower-vec2(-.25,.12),lower-vec2(-.25,.12))*5.);
 warp+=vec2(sin(lower.y*7.+t*speed),cos(lower.x*6.-t*speed))*(.015+.045*u_sig[2])*pressure;
 float field;
 if(u_gradientStyle<.5){
  // Broad offset elliptical color masses; deliberately quiet editorial composition.
  float a=exp(-dot((warp-vec2(-.25,.18))*vec2(1.5,2.),(warp-vec2(-.25,.18))*vec2(1.5,2.)));
  float b=exp(-dot((warp-vec2(.38,-.1))*vec2(2.,1.5),(warp-vec2(.38,-.1))*vec2(2.,1.5)));
  field=clamp(.08+.65*a+.3*b+.13*n,0.,1.);
 }else if(u_gradientStyle<1.5){
  float spectral=spec(clamp(uv.x,0.,1.));field=.5+.3*sin(warp.x*7.+n*4.+t*speed)+.15*cos(warp.y*15.+spectral*2.);
 }else if(u_gradientStyle<2.5){
  vec2 q=warp;for(int i=0;i<3;i++)q+=flow(q*(2.+float(i)),t*speed+float(i))*.13;
  field=.5+.36*sin(q.x*5.+q.y*3.+n*2.);
 }else if(u_gradientStyle<3.5){
  float value=fbm(warp*(3.+u_p[0]*.3)+flow(warp*3.,t*speed)*.5);float levels=3.+floor(u_p[5]*4.);field=floor(value*levels)/max(1.,levels-1.);
 }else{
  float value=fbm(warp*4.+t*speed*.3);float lines=filamentAA(value*(12.+u_p[0]))*.8+filamentAA(value*(48.+u_p[0]*2.))*.15;return mix(u_colors[0],u_colors[2],clamp(lines*.8,0.,1.))*(.6+.35*u_p[3]);
 }
 float ridge=exp(-pow((field-.58)*14.,2.));float fold=pow(.5+.5*sin(warp.x*5.+warp.y*4.+n*2.),10.);
 field+=ridge*fold*.055*u_p[6];field+=(u_sig[0]-.25)*.07;float grain=(fineGrain(uv)-.5)*.025*u_p[5];return ramp(clamp(field,0.,1.))*(.6+.3*u_p[3])+grain;
}

vec3 glassBackground(vec2 uv,float t){
 if(u_hasMedia>.5)return texture2D(u_media,clamp(uv,0.,1.)).rgb;
 vec2 p=aspectUV(uv)-.5;float band=.5+.5*sin(p.x*4.+p.y*2.+t*.09);
 vec3 c=mix(u_colors[0],u_colors[1],band*.7);
 float strip=exp(-pow((p.x+p.y*.18-.17)/.12,2.));
 c+=u_colors[2]*strip*.55;return c;
}
vec3 studioEnvironment(vec3 r,float rough){
 float strip=exp(-pow((r.x+r.y*.28-.26)/(.045+rough*.08),2.));
 float panel=exp(-pow((r.x-r.y*.55+.62)/(.12+rough*.1),2.))*smoothstep(-.55,.65,r.z);
 float horizon=pow(max(0.,1.-abs(r.y+.15)),12.);
 vec3 c=mix(u_colors[0]*.3,u_colors[1]*.36,smoothstep(-.7,.8,r.y));
 c+=u_colors[2]*(strip*1.5+panel*.65+horizon*.19);
 return c;
}
vec3 liquidGlass(vec2 uv,float t){
 vec2 q=aspectUV(uv)-.5;float field=0.;vec2 grad=vec2(0.);
 vec2 cursor=aspectUV(u_pointer)-.5;
 q+=(q-cursor)*exp(-dot(q-cursor,q-cursor)*25.)*.13;
 for(int j=0;j<10;j++){
  float i=float(j);float active=1.-smoothstep(u_p[0]-.7,u_p[0]+.3,i);float a=i*2.399+t*(.06+.12*u_p[1]);
  vec2 center=vec2(cos(a),sin(a*.83+i*.5))*(.16+.07*u_p[4]);
  vec2 d=q-center;float twist=.028*sin(d.y*15.+t*.2)*u_p[6];d.x+=twist;
  if(u_variant<.5){center=vec2((i-1.)*.16,.035*sin(i*2.+t*.15));d=q-center;}
  else if(u_variant>1.5&&u_variant<2.5){center=vec2(0.);d=q-center;active=i<.5?1.:0.;}
  float r2=dot(d,d*vec2(1.,u_variant>1.5&&u_variant<2.5?1.:1.4))+.0025;
  if(u_variant<.5)r2+=.0015*sin(d.x*26.-t*.4)*sin(d.y*22.+t*.3)*(1.+u_sig[0]);
  float radius=.006*(.65+.4*u_p[4]);
  field+=active*radius/r2;grad-=active*2.*radius*d*vec2(1.,1.4)/(r2*r2);
 }
 if(u_variant>3.5){
  float wave=sin(q.x*9.+t*.28+sin(q.y*7.-t*.2))*cos(q.y*6.+t*.17);
  field=.9+wave*(.08+.15*u_sig[0]);
  grad+=vec2(cos(q.x*9.+t*.28),sin(q.y*6.+t*.17))*(2.+u_sig[5]*4.);
 }
 float inside=smoothstep(.69,.74,field);
 vec3 n=normalize(vec3(-grad*.07,1.));
 float relief=sin(field*4.+q.x*9.+t*.16)*.1*u_p[6];n=normalize(n+vec3(relief,-relief*.4,0.));
 vec2 disp=n.xy*(.035+.09*u_p[2])*(1.+u_sig[0]*.45+u_sig[5]*.25);float dispersion=.025*u_p[5];
 vec3 refracted=vec3(glassBackground(uv+disp*(1.+dispersion),t).r,glassBackground(uv+disp,t).g,glassBackground(uv+disp*(1.-dispersion),t).b);
 float thickness=clamp(field-.7,0.,2.);refracted*=exp(-thickness*vec3(.08,.035,.055));
 float fresnel=.04+.96*pow(1.-n.z,5.);vec3 view=reflect(vec3(0.,0.,-1.),n);
 vec3 environment=studioEnvironment(view,.14);
 float rim=exp(-abs(field-.72)*48.);
 vec3 glass=mix(refracted*vec3(.89,.94,.98),environment,fresnel*.8+.16)*(.6+.4*u_p[3]);
 if(u_variant>2.5&&u_variant<3.5)glass=environment*(.7+.5*u_p[3])+refracted*.08;
 else if(u_variant>1.5)glass=mix(glass,environment,.38);
 vec3 background=u_hasMedia>.5?glassBackground(uv,t):u_colors[0]*.25;
 return mix(background,glass,inside)+rim*u_colors[2]*.23;
}

// Four organized bundles: travelling helix, crossed weave, spectral fan, closed orbit.
vec3 signalLines(vec2 uv,float t){
 vec2 q=(aspectUV(uv)-.5)/u_camera.z;float travel=t*(.18+.3*u_p[1]);
 float x=q.x, y=q.y, edge=1.-smoothstep(.62,.86,abs(x));
 if(u_variant>2.5){float a=atan(q.y,q.x);x=a/PI*.72;y=length(q)-.28;edge=1.;}
 vec3 col=vec3(0.);float count=clamp(u_p[0],1.,44.);
 for(int j=0;j<3;j++){
  float group=float(j),depth=.35+group*.3;
  float wave=sin(x*(4.+u_p[2]*2.)+travel+group*2.1)*(.035+.045*u_p[4]);
  wave+=osc(x*.45+.5,t)*.026*(.2+u_sig[2]);
  float spread=.025+.035*u_p[4]+.018*u_sig[0];
  float center=wave+sin(x*2.8-travel*.28+group*2.1)*.09;
  if(u_variant>.5&&u_variant<1.5){center+=x*(group-1.)*.3;spread*=.7;}
  if(u_variant>1.5&&u_variant<2.5){center=(group-1.)*.085+sin(x*3.-travel*.22)*.07;spread*=.25+1.4*smoothstep(-.6,.7,x);}
  float lane=(y-center)/spread, phase=(lane*.5+.5)*count/3.;
  phase+=sin(x*12.-travel+group)*.2*u_p[5];
  float envelope=exp(-pow(abs(lane),6.))*edge;
  float strands=filamentAA(phase),fine=filamentAA(phase*2.+.15)*.12*u_p[6];
  float packet=pow(.5+.5*cos(x*9.-travel*2.+group*2.4),18.);
  float nodes=exp(-pow((x-(u_pointer.x-.5)*1.4)*9.,2.))*u_interaction.z;
  float light=(.23+.3*depth)+packet*(.35+.85*u_sig[5])+nodes*.4;
  col+=ramp(.52+depth*.17)*(strands+fine)*envelope*light*(.6+.5*u_p[3]);
 }
 return col;
}

vec3 signalCorruption(vec2 uv,float t){
 vec2 p=aspectUV(uv)-.5;float speed=t*(.05+.09*u_p[1]);
 // Coherent deformation precedes erosion; each look has a distinct spatial carrier.
 if(u_variant>.5&&u_variant<1.5)p=rotate2(.35)*p;
 if(u_variant>1.5&&u_variant<2.5)p=vec2(atan(p.y,p.x)*.24,length(p)-.3);
 if(u_variant>2.5)p.y+=sin(p.x*5.-speed)*.12;
 vec2 warp=p+flow(p*3.,speed)*.14*u_p[2];
 float n=fbm(warp*4.+vec2(speed,-speed*.3));
 float body=.5+.5*sin(warp.x*7.+warp.y*3.+n*8.);
 if(u_variant>.5&&u_variant<1.5)body=.5+.5*sin(warp.x*12.+floor(warp.y*8.)*.7+speed);
 if(u_variant>1.5&&u_variant<2.5)body=.5+.5*sin(warp.y*23.+n*3.-speed);
 if(u_variant>2.5)body=exp(-abs(warp.y)*7.)*(.65+.35*sin(warp.x*11.+speed));
 float dissolve=clamp(.3+u_sig[5]*.3+u_p[5]*.09,.1,.85);
 vec2 grid=vec2(25.+u_p[0]*3.,40.+u_p[0]);vec2 cell=floor(uv*grid);
 float seed=hash21(cell),coarse=hash21(floor(cell/4.));
 float erosion=smoothstep(dissolve-.04,dissolve+.04,body+seed*.18);
 float phase=body*(9.+u_p[6]*7.);float strata=filamentAA(phase);
 float border=1.-smoothstep(.02,.07,min(min(fract(uv*grid).x,1.-fract(uv*grid).x),min(fract(uv*grid).y,1.-fract(uv*grid).y)));
 float fringe=exp(-abs(body-dissolve)*15.);
 float chips=smoothstep(.54,.72,seed)*fringe*(.3+.7*border);
 float conductor=filamentAA(body*12.+warp.y*4.)*exp(-abs(body-dissolve)*8.);
 vec3 solid=ramp(.25+body*.65)*(.22+.65*body+strata*.25);
 vec2 glyphCell=fract(uv*grid);float rail=step(abs(glyphCell.y-.2),.025)*step(.2,glyphCell.x);
 float symbol=step(.76,fract(glyphCell.y*4.))*step(glyphCell.x,.2+seed*.5)*step(.6,coarse);
 solid+=ramp(.85)*(rail*.16+symbol*.2)*fringe*u_p[6]+ramp(.7)*conductor*.18;solid*=.65+.35*coarse;
 return (solid*erosion+u_colors[2]*chips*.55)*(.5+.5*u_p[3]);
}

// A closed vocal membrane; longitudinal, folded, waveform and lobed structures.
vec3 voiceSculpture(vec2 uv,float t){
 vec2 q=(aspectUV(uv)-.5)/u_camera.z;float phase=t*(.1+.2*u_p[1]);
 q=rotate2(.14*sin(phase*.3)+u_camera.x*.2)*q;
 if(u_variant<.5)q.x*=.62;else if(u_variant<1.5)q.y*=.72;
 float angle=atan(q.y,q.x),radius=length(q),voice=osc(fract(angle/(2.*PI)+.5),t);
 vec3 col=vec3(0.);
 for(int j=0;j<5;j++){
  float layer=float(j)/4.,offset=layer*.016;
  float shell=.22+.035*u_p[4]+sin(angle*3.+phase+layer)*.025*u_p[2];
  shell+=voice*.018*(.2+u_sig[2]);
  if(u_variant>.5&&u_variant<1.5)shell+=.035*sin(angle*7.+layer*3.-phase*.5);
  if(u_variant>1.5&&u_variant<2.5)shell+=.065*voice*(.3+u_sig[4]);
  if(u_variant>2.5)shell+=.05*cos(angle*5.+phase*.3)*(.5+.4*u_sig[0]);
  float width=.03+.025*u_p[4],lane=(radius-shell+offset)/width;
  float envelope=exp(-lane*lane*2.);
  float strands=filamentAA(lane*(3.+u_p[0]*.14)+sin(angle*9.+phase+layer*5.)*.3*u_p[5]);
  float meridian=filamentAA(angle*(6.+u_p[0]*.25)+lane*.4)*.12*u_p[6];
  float pulse=pow(.5+.5*cos(angle*2.-phase*1.7-layer),22.)*(.3+u_sig[5]);
  float light=.25+.6*pow(.5+.5*cos(angle-1.+layer*.7),4.);
  col+=ramp(.58+layer*.15)*(strands*.28+meridian+.025+pulse*.17)*envelope*light*(.6+.5*u_p[3]);
 }
 return col;
}
mat3 sceneRX(float a){return mat3(1.,0.,0.,0.,cos(a),sin(a),0.,-sin(a),cos(a));}
mat3 sceneRY(float a){return mat3(cos(a),0.,-sin(a),0.,1.,0.,sin(a),0.,cos(a));}
vec3 spectralBloom(vec2 uv,float t){
 if(u_variant>1.5){
  // Reuse the existing spectrum ring buffer: depth is actual recent audio history.
  vec2 q=(aspectUV(uv)-.5)/u_camera.z;vec3 color=vec3(0.);
  for(int j=0;j<40;j++){
   float age=1.-float(j)/39.,depth=.55+age*1.7;
   float x=q.x*depth+.5+u_camera.x*.06;
   float history=texture2D(u_spectralHistory,vec2(clamp(x,.001,.999),fract(u_spectralHead-age*.97))).r;
   float demo=.22+.13*sin(x*9.+age*6.-t*.18)*cos(x*19.-age*3.);
   float height=mix(demo,history,u_hasAudio)*(.12+.17*u_p[2]);
   float base=-.28+age*.48,crest=base+height/depth;
   float d=abs(q.y-crest),line=exp(-d*(500.-age*150.));
   float boundary=smoothstep(0.,.06,x)*(1.-smoothstep(.94,1.,x));
   float veil=exp(-max(0.,crest-q.y)*95.)*step(q.y,crest)*.045;
   color=mix(color,color*.86,step(q.y,crest)*boundary*.18);
   color+=ramp(.52+height*.9)*(line+veil)*boundary*(.25+.5*(1.-age))*(.6+.45*u_p[3]);
  }return color;
 }

 vec2 q=(aspectUV(uv)-.5)/u_camera.z;vec3 col=vec3(0.);
 mat3 model=sceneRX(.35+u_camera.y)*sceneRY(t*.04*u_p[1]+u_camera.x);
 for(int i=0;i<9;i++){
  float depth=float(i)/8.-.5;vec3 p=model*vec3(q,depth*.85);
  float angle=atan(p.y,p.x),radius=length(p.xy);
  float shell=.28+.06*u_p[4]+.012*sin(depth*11.+t*.12)*(1.+u_sig[0])+.035*sin(angle*5.+t*.16+depth*4.)*u_p[2];
  if(u_variant>.5)shell+=.04*sin(angle*3.-depth*12.+t*.12);
  float lane=(radius-shell)/(.035+.045*u_p[4]);
  float phase=(lane*.5+.5)*u_p[0]*.32+sin(angle*11.+depth*7.+t*.2)*.15*u_p[5];
  float threads=filamentAA(phase),envelope=exp(-lane*lane*2.-depth*depth*7.);
  float illumination=.3+.7*pow(.5+.5*sin(angle*2.+depth*3.+t*.1),3.);
  col=max(col,ramp(.72+depth*.15+u_sig[3]*.1)*threads*envelope*illumination*(.65+.55*u_p[3]));col+=ramp(.5)*envelope*.012;
 }
 return col;
}
float torusDistance(vec3 p,float t){
 float angle=atan(p.z,p.x);float twist=.16*sin(angle*3.+t*.12*u_p[1])*u_p[2];
 float major=.44;
 if(u_variant>.5&&u_variant<1.5){major+=.09*cos(angle*3.+t*.08);p.y+=.07*sin(angle*3.+t*.08);}
 if(u_variant>1.5){p.y+=.055*sin(angle*6.-t*.1)*(.25+u_sig[2]);major+=.035*cos(angle*6.);}
 p.y+=twist;float tube=.16+.035*sin(angle*(3.+u_variant)+t*.15)+u_sig[0]*.035;
 if(u_variant>1.5)tube+=.025*sin(p.y*14.+angle*5.);
 return length(vec2(length(p.xz)-major,p.y))-tube;
}
vec3 phaseTorus(vec2 uv,float t){
 uv+=vec2(sin(t*.12),cos(t*.09))*.006*u_sig[0];
 vec2 q=(aspectUV(uv)-.5)/u_camera.z;
 mat3 model=sceneRX(.65+u_camera.y)*sceneRY(t*.055*u_p[1]+u_camera.x);
 vec3 ro=model*vec3(0.,0.,2.6),rd=model*normalize(vec3(q*1.7,-2.3));
 float distance=1.4;vec3 p=vec3(0.);bool hit=false;
 for(int i=0;i<52;i++){p=ro+rd*distance;float d=torusDistance(p,t);if(d<.0015){hit=true;break;}distance+=d*.7;if(distance>4.)break;}
 if(!hit)return u_colors[0]*.15;
 vec2 e=vec2(.003,0.);vec3 n=normalize(vec3(torusDistance(p+e.xyy,t)-torusDistance(p-e.xyy,t),torusDistance(p+e.yxy,t)-torusDistance(p-e.yxy,t),torusDistance(p+e.yyx,t)-torusDistance(p-e.yyx,t)));
 float angle=atan(p.z,p.x),tubeAngle=atan(p.y,length(p.xz)-.44);
 float lines=filamentAA((tubeAngle+angle*.45)*u_p[0]*.5);
 vec3 reflection=studioEnvironment(reflect(rd,n),.12);
 float light=.25+.75*max(0.,dot(n,normalize(vec3(-.5,.9,1.))));
 vec3 pearl=ramp(.45+light*.4)*(.3+light*.45)+reflection*.55;
 if(u_variant>.5&&u_variant<1.5)pearl=reflection*1.2;
 if(u_variant>1.5)pearl*=.2+lines*.8;
 return (pearl+ramp(.85)*lines*.13*u_p[6])*(.65+.45*u_p[3]);
}

float resonanceHeight(vec2 p,float t){
 float phase=t*(.12+.12*u_p[1]),n=3.+u_p[2]*2.;
 float modeA=sin(p.x*n*PI+phase)*sin(p.y*(n+1.)*PI);
 float modeB=cos((p.x+p.y)*PI*3.-phase*.7)*sin((p.x-p.y)*PI*2.);
 return (modeA*.075+modeB*.045)*( .6+u_p[2]+u_sig[0]*.45)+.055*sin(p.x*3.+phase)*cos(p.y*2.);
}
float resonanceDistance(vec3 p,float t){
 vec2 edge=abs(p.xy)-vec2(.82,.57);float boundary=max(edge.x,edge.y);if(u_variant<.5)boundary=(length(p.xy/vec2(.82,.57))-1.-.055*sin(atan(p.y,p.x)*3.+t*.08))*.5;
 return max(abs(p.z-resonanceHeight(p.xy,t))-.023,boundary);
}
vec3 materialResonance(vec2 uv,float t){
 vec2 q=(aspectUV(uv)-.5)/(u_camera.z*(.8+u_p[4]*.15));
 mat3 model=sceneRX(.35+u_camera.y)*sceneRY(-.32+u_camera.x+sin(t*.07)*.15);
 vec3 ro=model*vec3(0.,0.,2.5),rd=model*normalize(vec3(q*1.85,-2.4));
 float travel=1.4;vec3 p=vec3(0.);bool hit=false;
 for(int i=0;i<72;i++){p=ro+rd*travel;float d=resonanceDistance(p,t);if(d<.0013){hit=true;break;}travel+=max(.001,d*.48);if(travel>3.8)break;}
 if(!hit)return u_colors[0]*.09;
 vec2 e=vec2(.002,0.);vec3 normal=normalize(vec3(resonanceDistance(p+e.xyy,t)-resonanceDistance(p-e.xyy,t),resonanceDistance(p+e.yxy,t)-resonanceDistance(p-e.yxy,t),resonanceDistance(p+e.yyx,t)-resonanceDistance(p-e.yyx,t)));
 float height=resonanceHeight(p.xy,t),contours=filamentAA(height*u_p[0]*6.);
 float node=exp(-abs(height)*65.),rim=pow(1.-abs(dot(-rd,normal)),3.);
 vec3 reflection=studioEnvironment(reflect(rd,normal),.08);
 float light=.3+.7*abs(dot(normal,normalize(vec3(-.5,.8,1.))));
 vec3 silver=mix(vec3(.17,.18,.20),vec3(.8,.83,.87),light)*.55+reflection*.65;
 if(u_variant>.5&&u_variant<1.5)silver=mix(silver*.22,ramp(.9),contours*.65+node*.12);
 if(u_variant>1.5)silver=mix(silver,ramp(.35+light*.45),.65);
 silver+=ramp(.75)*(contours*.09*u_p[6]+rim*.24);
 silver*=.82+.18*cos(height*7.);
 return silver*(.6+.45*u_p[3]);
}

${AUDIO_STUDIES_GLSL}
vec3 sceneColor(float which, vec2 uv,float t){vec3 c=vec3(0.);
 if(which<.5)c=particleWeb(uv,t);
 else if(which<1.5)c=ribbons(uv,t);
 else if(which<2.5)c=feedbackField(uv,t);
 else if(which<3.5)c=fluidBlobs(uv,t);
 else if(which<4.5)c=geometryField(uv,t);
 else if(which<5.5)c=mediaReactive(uv,t);
 else if(which<6.5)c=reactiveTypography(uv,t);
 else if(which<7.5)c=gradients(uv,t);
 else if(which<8.5)c=liquidGlass(uv,t);
 else if(which<9.5)c=signalLines(uv,t);
 else if(which<10.5)c=signalCorruption(uv,t);
 else c=voiceSculpture(uv,t);
 return c;}
void main(){vec2 uv=v_uv-u_pan;float t=u_time;
 vec2 pivot=uv-.5;float turn=u_evolution.z;
 uv=mat2(cos(turn),-sin(turn),sin(turn),cos(turn))*pivot+.5-u_evolution.xy;
 uv+=vec2(sin(pivot.y*8.+u_evolution.w*4.),cos(pivot.x*7.-u_evolution.w*3.))*u_evolution.w*.1;if(u_scene>1.5&&u_scene<2.5)uv=v_uv;vec3 c=sceneColor(u_scene,uv,t);
 if(u_directorBlend>.001){vec3 b=sceneColor(u_directorScene,uv,t);float k=clamp(u_directorBlend,0.,1.);
  if(u_compose.y>.5&&u_compose.y<1.5)c=1.-(1.-clamp(c,0.,1.))*(1.-clamp(b*k,0.,1.));
  else if(u_compose.y>1.5)c=mix(c,c*b*2.,k);else c=mix(c,b,k);
 }
 if(u_hasHistory>.5){vec2 p=uv-.5;float frame=clamp(u_dt*60.,.1,6.);float a=(.001+u_p[1]*.003)*frame;
  vec2 shift=rotate2(a)*p*pow(.998-.003*u_p[2],frame)+.5;
  if(u_scene>1.5&&u_scene<2.5){
   if(u_variant<.5)shift=rotate2(.004*frame*u_p[2])*p*pow(.995,frame)+.5;
   else if(u_variant<1.5)shift=p*pow(1.002,frame)+.5+vec2(sin(p.y*8.+t*.2),-sin(p.x*8.+t*.2))*.0018*frame*(.3+u_p[4]);
   else if(u_variant<2.5)shift=rotate2(-.006*frame*u_p[2])*p*pow(1.008+.004*u_sig[0],frame)+.5;
   else shift=p*pow(1.003,frame)+.5+vec2(-p.y,p.x)*.008*frame*(.4+u_p[1]);
  }
  vec3 old=texture2D(u_history,clamp(shift,0.,1.)).rgb;
  old*=step(0.,shift.x)*step(shift.x,1.)*step(0.,shift.y)*step(shift.y,1.);
  float decay=u_scene>1.5&&u_scene<2.5?min(.992,u_p[7]):.87*u_p[7];if(u_scene>5.5&&u_scene<6.5&&u_variant>3.5&&u_variant<4.5)decay=min(.98,.75+.24*u_p[7]);
  old*=pow(max(.001,decay),frame);
  if(u_variant>1.5&&u_scene>1.5&&u_scene<2.5)old*=smoothstep(.015,.08,lum(old));
  if(u_scene>1.5&&u_scene<2.5)c=clamp(c*(.4+.35*u_sig[4])*min(2.,frame)+old,0.,1.);else c=max(c,old);
 }
 // History stores ungraded bounded radiance. Display adjustments never accumulate.
 gl_FragColor=vec4(clamp(c,0.,1.),1.);

}`;

export const BLIT=`precision highp float;varying vec2 v_uv;uniform sampler2D u_texture;uniform vec4 u_colorControls;uniform vec4 u_finish;uniform vec2 u_resolution;uniform vec3 u_view;
vec3 sampleColor(vec2 uv){if(any(lessThan(uv,vec2(0.)))||any(greaterThan(uv,vec2(1.))))return vec3(0.);return texture2D(u_texture,uv).rgb;}
float luminance(vec3 c){return dot(c,vec3(.299,.587,.114));}
void main(){vec2 uv=(v_uv-.5-u_view.xy)/u_view.z+.5,px=1./u_resolution/u_view.z;
vec3 c=sampleColor(uv),nw=sampleColor(uv+vec2(-1.,-1.)*px),ne=sampleColor(uv+vec2(1.,-1.)*px),sw=sampleColor(uv+vec2(-1.,1.)*px),se=sampleColor(uv+px);
float m=luminance(c),a0=luminance(nw),a1=luminance(ne),a2=luminance(sw),a3=luminance(se),lo=min(m,min(min(a0,a1),min(a2,a3))),hi=max(m,max(max(a0,a1),max(a2,a3)));
if(hi-lo>max(.025,hi*.15)){vec2 dir=vec2(-((a0+a1)-(a2+a3)),(a0+a2)-(a1+a3));float reduce=max((a0+a1+a2+a3)*.03125,.0078125);dir=clamp(dir/(min(abs(dir.x),abs(dir.y))+reduce),-6.,6.)*px;vec3 ca=.5*(sampleColor(uv-dir/6.)+sampleColor(uv+dir/6.)),cb=ca*.5+.25*(sampleColor(uv-dir*.5)+sampleColor(uv+dir*.5));float lb=luminance(cb);c=lb<lo||lb>hi?ca:cb;}
vec3 k=vec3(.57735);float a=u_colorControls.x*.0174533;
c=c*cos(a)+cross(k,c)*sin(a)+k*dot(k,c)*(1.-cos(a));c=mix(vec3(dot(c,vec3(.2126,.7152,.0722))),c,u_colorControls.y);
c=max(vec3(0.),(c-.18)*u_colorControls.w+.18)*u_colorControls.z*exp2(u_finish.x);
c=1.-exp(-c*1.45);c=pow(c,vec3(1./max(.1,u_finish.y)));
c*=1.-.3*dot(v_uv-.5,v_uv-.5);gl_FragColor=vec4(clamp(c,0.,1.),1.);}`;

const FUNCTIONS=['particleWeb','ribbons','feedbackField','fluidBlobs','geometryField','mediaReactive','reactiveTypography','gradients','liquidGlass','signalLines','signalCorruption','voiceSculpture','spectralBloom','phaseTorus','materialResonance','citySignal','techRadar','neuralCore','asciiMotion'];
export function sceneFragment(index,secondary=index){
 const a=FUNCTIONS[index]||FUNCTIONS[0],b=FUNCTIONS[secondary]||a;
 return FRAGMENT.replace(/vec3 sceneColor\(float which,[\s\S]*?return c;}/,`vec3 sceneColor(float which,vec2 uv,float t){${a===b?`return ${a}(uv,t);`:`if(which<${index}.1&&which>${index}.-.1)return ${a}(uv,t);return ${b}(uv,t);`}}`);
}
