// Four independent procedural renderers. No audio or anatomical measurements are fabricated.
export const AUDIO_STUDIES_GLSL=`
float technicalLine(float d,float width){return exp(-abs(d)/max(.0006,width));}
vec3 techRadar(vec2 uv,float t){
 vec2 p=aspectUV(uv)-.5;p.x+=.08;float r=length(p),a=atan(p.y,p.x),speed=t*(.12+.12*u_p[1]);
 vec3 col=u_colors[0]*.18;float ring=0.;
 for(int j=0;j<5;j++){float k=float(j);ring+=technicalLine(r-(.09+k*.062),.0008)*( .1+.13*spec(k*.16+.06));}
 float crosshair=technicalLine(p.x,.0007)+technicalLine(p.y,.0007);
 float outer=technicalLine(r-.35,.0012),ticks=pow(max(0.,cos(a*96.)),36.)*smoothstep(.331,.337,r)*(1.-smoothstep(.349,.355,r));
 col+=mix(u_colors[1],u_colors[2],.55)*(ring*1.5+crosshair*.12+outer*.55+ticks*.4);
 float sweep=exp(-mod(a-speed+6.283,6.283)*8.)*(1.-smoothstep(.32,.36,r));
 col+=mix(u_colors[1],u_colors[2],.6)*sweep*.12;
 for(int i=0;i<96;i++){float n=float(i),active=1.-smoothstep(u_p[0]-.5,u_p[0]+.5,n);float theta=n*2.39996+speed*(.1+mod(n,3.)*.06);float band=spec(fract(n*.073));float radius=.10+mod(n,4.)*.057+(band-.3)*.035*u_p[2];
 vec2 point=vec2(cos(theta),sin(theta))*radius;point+=vec2(cos(theta*3.+t*.1),sin(theta*2.-t*.1))*.009*u_p[5];
 float glow=exp(-length(p-point)*(420.-80.*u_p[6]));float flash=.35+.65*pow(.5+.5*cos(theta-speed),6.);col+=ramp(.35+band*.6)*glow*active*flash*(1.3+u_p[3]*1.5);}
 // Oscilloscope rail and real FFT columns remain distinct from the radial event field.
 if(uv.x>.77&&uv.x<.96){float x=(uv.x-.77)/.19;float trace=.5+osc(x,t)*.16*(.3+u_p[4]);col+=u_colors[2]*technicalLine(uv.y-trace,.0018);float bars=spec(x)*.22;float bar=step(fract(x*32.),.55)*step(.08,uv.y)*step(uv.y,.08+bars);col+=u_colors[1]*bar*.5;col+=u_colors[2]*technicalLine(uv.y-.08,.0007)*.2;}
 return col;
}
float brainField(vec3 p,float t){
 p.y+=.04;float hemisphere=abs(p.x)-.23;vec3 q=vec3(hemisphere,p.y,p.z);float lobe=(length(q/vec3(.40,.43,.57))-1.)*.35;
 float fold=.5+.5*sin(p.z*43.+sin(p.y*24.+p.x*15.)*2.3+sin(p.x*31.)*1.1);
 lobe+=pow(fold,4.)*(.010+.009*u_p[6]);
 float fissure=.018-abs(p.x)+.008*sin(p.z*16.);lobe=max(lobe,fissure);
 lobe+=sin(p.y*8.+t*.23)*sin(p.z*7.)*.008*u_p[2]*(.3+u_sig[0]);
 return lobe;
}
vec3 neuralCore(vec2 uv,float t){
 vec2 q=(aspectUV(uv)-.5)/(u_camera.z*1.28);mat3 rotation=sceneRX(.13+u_camera.y)*sceneRY(.45+u_camera.x+t*.055*u_p[1]);
 vec3 ro=rotation*vec3(0.,0.,2.45),rd=rotation*normalize(vec3(q*2.3,-2.4));float travel=.9;vec3 p=vec3(0.);bool hit=false;
 for(int j=0;j<128;j++){p=ro+rd*travel;float d=brainField(p,t);if(d<.0023){hit=true;break;}travel+=max(.0005,d*.32);if(travel>3.5)break;}
 if(!hit)return u_colors[0]*.12;
 vec2 e=vec2(.002,0.);vec3 n=normalize(vec3(brainField(p+e.xyy,t)-brainField(p-e.xyy,t),brainField(p+e.yxy,t)-brainField(p-e.yxy,t),brainField(p+e.yyx,t)-brainField(p-e.yyx,t)));
 float light=max(0.,dot(n,normalize(vec3(-.4,.8,1.)))),rim=pow(1.-abs(dot(-rd,n)),3.);
 float curvature=clamp((brainField(p+n*.012,t)-brainField(p,t))/.012,0.,1.);
 float pathways=pow(max(0.,cos(p.z*(30.+u_p[0]*.35)+sin(p.y*23.)*2.+p.x*14.)),18.);
 float activation=.5+.5*sin(p.z*8.+p.y*5.-t*(.3+.15*u_p[4]));activation=pow(activation,5.)*(.08+u_sig[5]*.6+u_sig[2]*.35);
 vec3 cortex=mix(vec3(.13,.16,.18),mix(vec3(.77,.81,.83),u_colors[2],.25),.15+light*.65)*(.3+.7*curvature);
 cortex+=studioEnvironment(reflect(rd,n),.25)*.12*u_p[3];
 cortex+=mix(u_colors[1],u_colors[2],.7)*(pathways*(.1+activation)*u_p[5]+rim*.45);
 // Inner transmission follows a different spatial frequency from the cortical folds.
 float inner=pow(max(0.,sin(p.x*28.+p.z*19.+sin(p.y*17.)*3.-t*.2)),12.);
 cortex+=u_colors[1]*inner*rim*.28*(.4+u_sig[3]);return cortex*(.65+.35*u_p[3]);
}
vec3 asciiMotion(vec2 uv,float t){
 float cols=clamp(u_p[0],24.,140.);vec2 grid=vec2(cols,cols*u_resolution.y/u_resolution.x*.65);vec2 cell=floor(uv*grid),local=fract(uv*grid),p=(cell+.5)/grid;
 vec2 q=aspectUV(p)-.5;float f=0.,speed=t*(.13+.18*u_p[1]);
 if(u_variant<.5)f=.5+.5*sin(q.x*8.+sin(q.y*6.+speed)*u_p[2]+speed)*cos(q.y*7.-speed*.6);
 else if(u_variant<1.5){q+=flow(q*3.,speed*.3)*.12*u_p[2];f=.5+.5*sin(q.x*11.+q.y*5.+speed+sin(q.y*9.-speed)*2.);}
 else if(u_variant<2.5){float d=abs(q.y-osc(p.x,t)*.18*(.4+u_p[4]));f=exp(-d*22.)+.4*exp(-abs(length(q)-.25-u_sig[0]*.04)*60.);}
 else {float a=atan(q.y,q.x);f=exp(-pow((length(q)-.22-.045*sin(a*4.+speed))/.07,2.))*(.5+.5*sin(a*18.-speed));}
 f=clamp(f*(.65+u_sig[0]*.25+u_sig[2]*.2),0.,.999);float index=floor(f*15.);vec2 glyphUV=vec2((index+local.x)/16.,local.y);glyphUV.y=(local.y-.5)/( .75+.2*u_p[6])+.5;float ink=texture2D(u_media,glyphUV).a*step(0.,glyphUV.y)*step(glyphUV.y,1.);
 float mask=smoothstep(.08+.08*u_p[5]*u_sig[5],.22+.08*u_p[5]*u_sig[5],f),scan=.75+.25*sin(p.y*9.-speed*.5);return ramp(.48+f*.5)*ink*mask*scan*(.65+.5*u_p[3]);
}
float cityHeight(vec2 uv){if(uv.x<0.||uv.x>1.||uv.y<0.||uv.y>1.)return -1.;return texture2D(u_media,uv).r*(.07+.2*u_p[2])*(.8+u_sig[0]*.35);}
vec3 cityVolume(vec2 uv,float t){
 vec2 q=(aspectUV(uv)-.5)/u_camera.z;mat3 rotation=sceneRY(u_camera.x+.35)*sceneRX(-.7+u_camera.y*.65);vec3 ro=rotation*vec3(0.,0.,1.8),rd=rotation*normalize(vec3(q*2.,-1.8));
 float dist=.1;vec3 p=vec3(0.);bool hit=false;
 for(int i=0;i<112;i++){p=ro+rd*dist;float h=cityHeight(p.xz+.5);if(h>=0.&&p.y<=h&&p.y>=-.015){float lo=max(.1,dist-.018),hi=dist;for(int k=0;k<6;k++){float mid=(lo+hi)*.5;vec3 test=ro+rd*mid;if(test.y<=cityHeight(test.xz+.5))hi=mid;else lo=mid;}p=ro+rd*hi;hit=true;break;}dist+=.018;if(dist>2.5)break;}
 if(!hit)return u_colors[0]*.12;
 vec2 at=p.xz+.5;float h=cityHeight(at),dx=cityHeight(at+vec2(.002,0.))-h,dz=cityHeight(at+vec2(0.,.002))-h;vec3 n=normalize(vec3(-dx,.002,-dz));float lighting=.25+.75*max(0.,dot(n,normalize(vec3(-.5,1.,.4))));
 float roads=texture2D(u_media,at).g;float pulse=pow(.5+.5*sin((at.x+at.y*.7)*70.-t*(1.+u_p[1])),12.);float floors=pow(max(0.,cos(p.y*230.)),22.);vec3 color=ramp(.2+clamp(p.y*2.,0.,.7))*lighting*(.55+.35*u_p[3]);color+=u_colors[2]*floors*(.05+.1*u_p[6])*(.3+u_sig[3]);color+=roads*ramp(.8)*(.2+pulse*(.5+u_sig[5]));return color;
}
vec3 citySignal(vec2 uv,float t){if(u_variant>.5&&u_variant<1.5)return cityVolume(uv,t);
 vec2 p=(aspectUV(uv)-.5)/u_camera.z;p=rotate2(u_camera.x)*p;
 if(u_variant>.5&&u_variant<1.5){p.y=(p.y+.08)/(.55+.25*cos(u_camera.y));}
 p+=.5;vec4 map=texture2D(u_media,clamp(p,0.,1.));float roadWidth=(.5+u_p[0]/60.)/1024.;float roads=max(map.g,max(texture2D(u_media,p+vec2(roadWidth,0.)).g,texture2D(u_media,p+vec2(0.,roadWidth)).g)),buildings=map.r;float edge=step(0.,p.x)*step(p.x,1.)*step(0.,p.y)*step(p.y,1.);
 float travel=t*(.08+.12*u_p[1]);float pulse=pow(.5+.5*sin((p.x+p.y*.71)*(40.+u_p[4]*40.)-travel*9.),12.);
 vec3 col=u_colors[0]*.12+mix(u_colors[1],u_colors[2],.4)*roads*.45;
 if(u_variant<.5){col+=ramp(.85)*roads*(pulse*(.3+u_sig[5])+.12)*u_p[3];col+=u_colors[1]*buildings*.08;}
 else if(u_variant<1.5){
  // Layered height-field extrusion: each slice samples the same imported block footprint.
  float height=(.025+.065*u_p[2])*(.7+u_sig[0]*.4);vec3 city=vec3(0.);
  for(int j=0;j<24;j++){float z=float(j)/23.;vec2 sampleUV=p+vec2(.12*sin(u_camera.y),height)*z;vec4 block=texture2D(u_media,clamp(sampleUV,0.,1.));float face=step(.12+z*.8,block.r);city=mix(city,ramp(.23+z*.65)*(.25+.7*z),face);}
  col+=city*(.65+.4*u_p[3])+roads*pulse*u_colors[2]*.2;
 }else{vec2 cell=floor(p*(70.+u_p[0])),f=fract(p*(70.+u_p[0]))-.5;float nodes=exp(-dot(f,f)*80.);float drift=.5+.5*sin(dot(cell,vec2(.7,.43))-travel*5.);col+=ramp(.5+drift*.4)*roads*nodes*(.3+drift*u_p[3])*smoothstep(u_p[5]*u_sig[5]*.35,1.,drift+.3);}
 return col*edge;
}
`;
