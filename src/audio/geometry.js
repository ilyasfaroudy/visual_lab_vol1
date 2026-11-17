// Shared parametric mesh. All motion occurs in the vertex shader; buffers are immutable.
export const MESH_VERTEX=`precision highp float;
attribute vec3 a_grid;uniform float u_time;uniform float u_variant;uniform float u_aspect;uniform float u_wire;
uniform vec4 u_interaction;uniform vec2 u_stroke;uniform vec4 u_evolution;uniform vec3 u_camera;uniform float u_p[8];uniform float u_sig[8];uniform vec3 u_colors[3];uniform sampler2D u_media;uniform vec4 u_dna;
uniform sampler2D u_spectralHistory;uniform float u_spectralHead;uniform float u_hasAudio;
varying vec3 v_color;varying float v_alpha;
#define PI 3.14159265359
mat3 rotY(float a){return mat3(cos(a),0.,-sin(a),0.,1.,0.,sin(a),0.,cos(a));}
mat3 rotX(float a){return mat3(1.,0.,0.,0.,cos(a),sin(a),0.,-sin(a),cos(a));}
vec3 surface(vec2 uv){
 float t=u_time*(.16+.24*u_p[1]),a=uv.x*PI*2.,b=uv.y*PI*2.;
 float drive=u_sig[0]*.7+u_sig[1]*.35+u_sig[5]*.3;
 float relief=.25+.32*u_p[2]+drive*.38;
 float grain=sin(a*13.+t)*sin(b*11.-t)*.012*u_p[5];
 float dna=(dot(texture2D(u_media,clamp(uv,0.,1.)).rgb,vec3(.2126,.7152,.0722))-.5)*u_dna.w*.45;
 if(u_variant<.5){
  float history=texture2D(u_spectralHistory,vec2(clamp(uv.x,0.,1.),fract(u_spectralHead-clamp(uv.y,0.,1.)*.94+1.))).r;
  float ridge=pow(.5+.5*sin(a*2.3+t-uv.y*5.),3.)*(.3+.7*pow(.5+.5*cos(a*.9-b*.6),2.));
  float peak=mix(ridge,history,u_hasAudio);
  float h=pow(peak,1.3)*(relief*2.)-.28+grain+dna;
  h+=sin(a*3.+t)*sin(b*2.-t*.4)*.08*(1.+drive);
  return vec3((uv.x-.5)*2.8,h,(uv.y-.5)*2.4);
 }
 if(u_variant<1.5){
  float envelope=sin(clamp(uv.x,0.,1.)*PI);
  float folds=sin(a*(2.+u_p[5])+b*.35-t)*relief*.48;
  float sail=sin(b*.5)*envelope*.5;
  return vec3((uv.x-.5)*2.8,folds+sail+grain+dna,(uv.y-.5)*2.3+sin(a+t)*.2*envelope);
 }
 if(u_variant<2.5){
  float radius=.035+uv.y*1.2;
  float envelope=sin(uv.y*PI);
  float h=(sin(radius*(8.+u_p[5]*3.)-t*2.)*.5+cos(a*5.+t)*.24)*envelope*relief;
  return vec3(cos(a)*radius,h+grain*envelope+dna*envelope,sin(a)*radius);
 }
 float polar=uv.y*PI,sp=sin(polar);
 float lobes=sin(a*5.+sin(polar*3.+t))*sin(polar*4.-t*.5);
 float radius=.84+lobes*relief*.28+grain*sp+dna*sp;
 radius+=sin(polar*7.-t*1.4)*sp*drive*.18;
 return vec3(cos(a)*sp,cos(polar)*1.2,sin(a)*sp)*radius;
}
vec3 evolvedSurface(vec2 uv){vec3 p=surface(uv);p.z+=sin(p.x*6.+p.y*5.)*u_evolution.w*.25;return p;}
void main(){vec2 uv=a_grid.xy;vec3 p=evolvedSurface(uv);float e=.002;
 vec3 du=evolvedSurface(uv+vec2(e,0.))-evolvedSurface(uv-vec2(e,0.)),dv=evolvedSurface(uv+vec2(0.,e))-evolvedSurface(uv-vec2(0.,e));
 mat3 model=rotX((u_variant<1.5?.46:.32)+u_camera.y)*rotY(-.35+u_time*.035*u_p[1]+u_camera.x);
 vec3 n=normalize(model*(cross(du,dv)+vec3(0.,.000001,0.)));p=model*p;
 float distance=3.5+.2*u_p[4];
 vec2 cursor=(u_interaction.xy-.5)*vec2(u_aspect,1.)*(distance-p.z)/(1.4*u_camera.z);
 vec2 delta=p.xy-cursor;float reach=exp(-dot(delta,delta)*9.)*u_interaction.z;
 if(u_interaction.w<1.5){p.xy-=delta*reach*.4;p.z+=reach*.32;}
 else if(u_interaction.w<2.5){p.xy+=delta*reach*.45;p.z-=reach*.4;}
 else if(u_interaction.w<3.5)p.xy+=u_stroke*reach*1.8;
 else p.z+=cos(length(delta)*20.-u_time*3.)*reach*.24;
 float z=distance-p.z;
 gl_Position=vec4(p.x*2.8*u_camera.z/u_aspect,p.y*2.8*u_camera.z,z*.95-.2,z);
 float illumination=.18+.82*abs(dot(n,normalize(vec3(-.5,.8,1.))));
 float rim=pow(1.-abs(n.z),3.);float sparkle=pow(max(0.,dot(n,normalize(vec3(-.4,.7,1.2)))),22.);
 vec3 tone=mix(u_colors[1],u_colors[2],clamp(.2+illumination*.5+(uv.x-.5)*.2,0.,1.));
 float fade=exp(-max(0.,z-2.6)*.45);
 if(u_wire>.5){v_color=tone*(.55+.6*u_p[3])*fade;float visible=clamp(u_p[0]/36.,.08,1.);v_alpha=(1.-smoothstep(visible-.035,visible+.035,a_grid.z))*(.18+.48*illumination)*(.65+.3*u_p[6]);}
 else{v_color=tone*(.035+.09*illumination)+u_colors[2]*(sparkle*.28+rim*.045);v_alpha=1.;}
}
`;
export const MESH_FRAGMENT=`precision mediump float;varying vec3 v_color;varying float v_alpha;void main(){gl_FragColor=vec4(v_color,v_alpha);}`;
function rank(i){let n=i,r=0,f=.5;for(let b=0;b<7;b++){r+=(n%2)*f;n=Math.floor(n/2);f*=.5;}return r;}
export function buildMesh(columns=80,rows=56){
 const lines=[],faces=[];const point=(array,x,y,k=0)=>array.push(x/columns,y/rows,k);
 for(let y=0;y<=rows;y++)for(let x=0;x<=columns;x++){
  if(x<columns){point(lines,x,y,rank(y));point(lines,x+1,y,rank(y));}
  if(y<rows){point(lines,x,y,rank(x));point(lines,x,y+1,rank(x));}
  if(x<columns&&y<rows){point(faces,x,y);point(faces,x+1,y);point(faces,x,y+1);point(faces,x+1,y);point(faces,x+1,y+1);point(faces,x,y+1);}
 }
 return {lines:new Float32Array(lines),faces:new Float32Array(faces)};
}
