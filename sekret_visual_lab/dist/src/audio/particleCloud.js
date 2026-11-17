// A deterministic Lorenz attractor, integrated once. Spatial neighbours are built
// once using a bounded hash grid; deformation and camera projection stay on GPU.
export function buildParticleCloud(count=9000,variant=0){
 const points=new Float32Array(count*5),cells=new Map(),edges=[];let x=.1,y=.2,z=.3;
 function step(){const dt=.006,dx=10*(y-x),dy=x*(28-z)-y,dz=x*y-z*2.666667;x+=dx*dt;y+=dy*dt;z+=dz*dt;}
 for(let i=0;i<1500;i++)step();
 for(let i=0;i<count;i++){
  step();const o=i*5;let px=x*.035,py=(z-25)*.032,pz=y*.026;
 const u=((i*7549)%10007)/10007,v=((i*3571)%10009)/10009,w=((i*1877)%10037)/10037;
 if(variant===1){px=(u-.5)*2.;py=(v-.5)*.44;pz=(w-.5)*.5;}
 else if(variant===2){const cluster=i%5,a=u*Math.PI*2,theta=cluster*Math.PI*2/5,rad=.09+.14*v;px=Math.cos(theta)*.48+Math.cos(a)*rad;py=Math.sin(theta)*.38+Math.sin(a)*rad;pz=(w-.5)*.35;}
 else if(variant===3){px=(i%100)/99*1.6-.8;py=Math.floor(i/100)/89*1.1-.55;pz=Math.sin(px*4.)*.15;}

  points[o]=px;points[o+1]=py;points[o+2]=pz;
  points[o+3]=((i*1973)%9973)/9973;points[o+4]=i/count;
  const gx=Math.floor(px/.075),gy=Math.floor(py/.075),gz=Math.floor(pz/.075);let degree=0;
  if(i%3===0)for(let a=-1;a<=1&&degree<3;a++)for(let b=-1;b<=1&&degree<3;b++)for(let c=-1;c<=1&&degree<3;c++){
   const bucket=cells.get(`${gx+a},${gy+b},${gz+c}`);if(!bucket)continue;
   for(let k=bucket.length-1;k>=0&&degree<3;k--){const j=bucket[k],q=j*5;if(i-j<18)continue;
    const distance=Math.hypot(px-points[q],py-points[q+1],pz-points[q+2]);if(distance<.025||distance>.12)continue;
    const rank=Math.max(points[o+3],points[q+3]);edges.push(px,py,pz,rank,points[o+4],points[q],points[q+1],points[q+2],rank,points[q+4]);degree++;
   }
  }
  const key=`${gx},${gy},${gz}`;let bucket=cells.get(key);if(!bucket){bucket=[];cells.set(key,bucket);}if(bucket.length<28)bucket.push(i);else bucket[i%28]=i;
 }
 return {points,lines:new Float32Array(edges)};
}
export const PARTICLE_VERTEX=`precision highp float;
attribute vec3 a_position;attribute vec2 a_data;
uniform vec2 u_resolution;uniform vec2 u_pointer;uniform float u_time;uniform float u_variant;uniform float u_points;
uniform sampler2D u_media;uniform vec4 u_dna;
uniform vec4 u_interaction;uniform vec2 u_stroke;uniform vec4 u_evolution;uniform vec3 u_camera;uniform float u_p[8];uniform float u_sig[8];uniform vec3 u_colors[3];
varying vec3 v_color;varying float v_alpha;
mat3 rotY(float a){return mat3(cos(a),0.,-sin(a),0.,1.,0.,sin(a),0.,cos(a));}
mat3 rotX(float a){return mat3(1.,0.,0.,0.,cos(a),sin(a),0.,-sin(a),cos(a));}
void main(){
 float time=u_time*(.32+.38*u_p[1]);vec3 p=a_position;
 if(u_variant<.5){
  vec3 curl=vec3(sin(p.y*5.+time*.7)-cos(p.z*4.-time*.4),sin(p.z*5.+time*.5)-cos(p.x*4.+time*.4),sin(p.x*5.-time*.6)-cos(p.y*4.+time*.3));
  p+=curl*(.055+.075*u_p[5]+.09*u_sig[0]);
  float pressure=sin(length(p)*9.-time*1.2);p*=1.+pressure*(.045+.11*u_sig[5]);
 }else if(u_variant<1.5){
  float x=p.x+time*.38;p.x=mod(x+1.,2.)-1.;
  float ribbon=p.y*8.;p.y+=sin(p.x*3.+ribbon+time*.3)*(.18+.14*u_sig[0]);p.z+=cos(p.x*4.+ribbon-time*.22)*.22;
 }else if(u_variant<2.5){
  float theta=atan(p.y,p.x),rad=length(p.xy);float turn=time*(.12+.15*rad);p.xy=mat2(cos(turn),-sin(turn),sin(turn),cos(turn))*p.xy;
  p.z+=sin(theta*5.+time*.6)*(.12+.14*u_sig[2]);p.xy*=1.+sin(theta*3.-time*.4)*.12*u_p[5];
 }else if(u_variant<10.5){
  float front=.5+.5*sin(p.x*4.+p.y*3.-time*.6),dissolve=smoothstep(.3,.8,front)*(.3+.7*u_sig[5]);
  p.z+=sin(p.x*5.+time*.5)*cos(p.y*6.-time*.4)*(.18+.18*u_p[2]);
  p.xy+=vec2(sin(p.y*13.+time),cos(p.x*11.-time*.7))*dissolve*.12*u_p[5];p.z+=dissolve*.3;
 }
 float source=dot(texture2D(u_media,clamp(p.xy*.6+.5,0.,1.)).rgb,vec3(.2126,.7152,.0722));
 p+=normalize(p+vec3(.001))*(source-.5)*u_dna.w*.25;
 p*=.85+.18*u_p[4]+u_sig[0]*.05;
 float typeMask=1.;
 if(u_variant>10.5){float index=floor(a_data.y*9000.+.1);vec2 uv=vec2(mod(index,120.)/119.,floor(index/120.)/74.);typeMask=texture2D(u_media,uv).a;
 p=vec3((uv-.5)*vec2(2.15,1.08),sin(uv.x*12.+time)*.10*u_p[2]+cos(uv.y*16.-time*.6)*.06*u_p[5]);
 p.xy*=u_p[0];p.xy+=vec2(sin(index*1.17+time),cos(index*.93-time))*.004*u_sig[3];}
 mat3 model=rotX((u_variant>10.5?.08:.3+sin(time*.27)*.2)+u_camera.y)*rotY((u_variant>10.5?sin(time*.3)*.12:time*.12)+u_camera.x);p=model*p;p.z+=sin(p.x*8.+p.y*5.+u_evolution.w*4.)*u_evolution.w*.35;
 vec2 cursor=(u_interaction.xy-.5)*vec2(u_resolution.x/u_resolution.y,1.)*(2.6-p.z)/(1.6*u_camera.z);
 vec2 delta=p.xy-cursor;float reach=exp(-dot(delta,delta)*12.)*u_interaction.z;
 if(u_interaction.w<1.5)p.xy-=delta*reach*.8;
 else if(u_interaction.w<2.5)p.xy+=delta*reach*1.3;
 else if(u_interaction.w<3.5)p.xy+=u_stroke*reach*2.;
 else p.xy+=vec2(-delta.y,delta.x)*reach*1.4;
 p.z+=sin(length(delta)*18.-u_time*3.)*reach*.07;
 float z=2.6-p.z,aspect=u_resolution.x/u_resolution.y;
 gl_Position=vec4(p.x*3.2*u_camera.z/aspect,p.y*3.2*u_camera.z,z*.95-.2,z);
 float visible=smoothstep(a_data.x-.03,a_data.x+.03,clamp(u_variant>10.5?.86:u_p[0]/35.,.08,1.))*typeMask;
 float depth=exp(-max(0.,z-1.9)*1.1);
 v_alpha=visible*depth*(.7+.3*pow(.5+.5*sin(a_data.y*37.7-time*.7),3.))*(u_points>.5?.7:.18)*(.65+.55*u_p[3]);
 if(u_points<.5)v_alpha*=clamp(u_p[2],0.,2.)*smoothstep(a_data.x-.06,a_data.x+.06,clamp(.12+u_p[2]*.55,0.,1.));
 if(u_variant>.5&&u_variant<1.5){v_alpha*=u_points>.5?2.2:.35;v_alpha*=smoothstep(0.,.12,1.-abs(p.x));}
 if(u_variant>2.5&&u_variant<10.5)v_alpha*=.2+.8*smoothstep(.15,.75,.5+.5*sin(a_position.x*4.+a_position.y*3.-time*.6));
 if(u_variant<10.5){v_alpha*=.75+.65*u_sig[4];if(u_points<.5)v_alpha*=.55+.45*sin(a_position.x*6.+a_position.y*5.+time*.5)*sin(a_position.x*6.+a_position.y*5.+time*.5);}
 v_color=mix(u_colors[1],u_colors[2],.42+.55*depth);if(u_variant>10.5){v_alpha=visible*.95;v_color=mix(u_colors[1],u_colors[2],.85);}
 gl_PointSize=clamp((1.1+u_p[6]*1.3+u_sig[3])*(u_resolution.y/600.)*2./z,1.,24.);if(u_variant>10.5)gl_PointSize=clamp(4.3*(u_resolution.y/600.)*(.75+u_p[6]*.3),1.6,28.);
}`;
export const PARTICLE_FRAGMENT=`precision highp float;uniform float u_points;uniform float u_variant;varying vec3 v_color;varying float v_alpha;
void main(){float alpha=v_alpha;if(u_points>.5){float r=length(gl_PointCoord-.5);alpha*=exp(-r*r*(u_variant>10.5?5.:14.));if(r>.5)discard;}gl_FragColor=vec4(v_color,alpha);}`;
