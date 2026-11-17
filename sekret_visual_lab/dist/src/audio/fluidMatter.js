// Ray-marched analytical liquid sculpture; not a Navier–Stokes solver.
export const FLUID_GLSL=`
uniform vec4 u_fluidShape;uniform vec4 u_fluidMaterial;
float liquidUnion(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
float liquidField(vec3 p,float t){
 float slow=t*(.12+.25*u_p[1])/(.4+u_fluidShape.x),beat=u_sig[5]*u_fluidMaterial.w,bass=u_sig[0];
 float wave=sin(length(p.xy)*12.-slow*3.)*exp(-length(p.xy)*1.5)*(.025+beat*.065);
 p+=sin(p.yzx*(3.+u_p[5])+vec3(slow,slow*.7,-slow*.5))*(.035+.045*u_p[2]+bass*.035);
 float d=4.,blend=.12+.2*u_fluidShape.y;
 if(u_variant>1.5&&u_variant<2.5){float angle=atan(p.y,p.x),rr=length(p.xy);float tube=.14+.045*sin(angle*(2.+u_p[0]*.4)-slow*2.)+.025*bass;
 d=length(vec2(rr-(.52+.07*sin(angle*3.+slow)),p.z+sin(angle*4.-slow)*.1))-tube;
 d=liquidUnion(d,length(p*vec3(1.,1.,1.8))-.42,.2);
 }else{
 for(int i=0;i<12;i++){float k=float(i);if(k>=u_p[0])break;float a=k*2.399+slow*.2;
 vec3 center;float radius=.24+.06*sin(k*7.);
 if(u_variant<.5){center=vec3(cos(a)*.31,sin(a)*.28,sin(a*2.+slow)*.13);center.xy*=.8+.2*u_fluidShape.z;center.y-=.1*pow(.5+.5*sin(a),2.);radius+=.07;}
 else if(u_variant<1.5){float side=mod(k,2.)*2.-1.;center=vec3(side*(.22+(.16+beat*.13)*sin(slow*.65)*u_fluidShape.z),sin(a)*.28,cos(a)*.2);}
 else{float separation=(.25+.3*pow(.5+.5*sin(slow*.8),3.)+.2*beat)*u_fluidShape.z;center=vec3(cos(a),sin(a),sin(a*2.+slow)*.6)*separation;radius=.24+.04*bass;blend*=.95;}
 d=liquidUnion(d,length(p-center)-radius,blend);
 }}
 return d+wave/(.7+u_fluidShape.w)+sin(p.x*22.+slow)*sin(p.y*19.-slow)*.003*u_p[6]*u_sig[3];
}
vec3 liquidStudio(vec3 r){float strip=pow(max(0.,1.-abs(r.x*.7+r.y*.3-.35)),24.);float ceiling=smoothstep(.15,.8,r.y)*.7;float side=pow(max(0.,1.-abs(r.x+.6)),12.);return u_colors[2]*(strip*1.7+ceiling*.55+side*.65)+u_colors[1]*(.12+.15*r.y);}
vec3 fluidBlobs(vec2 uv,float t){uv=manipulate(uv,2.1);vec2 p=aspectUV(uv)-.5;p/=.75+.35*u_p[4];vec3 origin=vec3(0.,0.,3.),ray=normalize(vec3(p*2.8,-3.));float travel=0.,d=1.;vec3 pos;
 for(int j=0;j<48;j++){pos=origin+ray*travel;d=liquidField(pos,t);if(d<.002||travel>5.)break;travel+=max(.002,d*.72);}
 if(d>.004||travel>5.)return vec3(0.);
 vec2 e=vec2(.002,-.002);vec3 n=normalize(e.xyy*liquidField(pos+e.xyy,t)+e.yyx*liquidField(pos+e.yyx,t)+e.yxy*liquidField(pos+e.yxy,t)+e.xxx*liquidField(pos+e.xxx,t));
 vec3 reflected=reflect(ray,n),light=normalize(vec3(-.5,.8,1.));float facing=max(0.,dot(n,-ray)),fresnel=pow(1.-facing,5.),diffuse=.25+.75*max(0.,dot(n,light));
 float thickness=(.15+.7*facing)*u_fluidMaterial.z;vec3 absorption=exp(-thickness*vec3(1.2,.55,.7));
 vec3 transmitted=liquidStudio(refract(ray,n,.72))*absorption;
 float metal=u_variant>.5&&u_variant<1.5?1.:u_variant>2.5?.6:.15;
 vec3 base=mix(u_colors[1]*diffuse*.35,u_colors[2]*.12,metal);
 base+=liquidStudio(reflected)*(.12+metal*.65+fresnel*.5)*u_fluidMaterial.x;
 base+=transmitted*(1.-metal)*u_fluidMaterial.y*.3;
 base+=u_colors[2]*pow(max(0.,dot(reflect(-light,n),-ray)),70.)*(.4+.5*u_p[3]);
 if(u_variant>1.5&&u_variant<2.5)base+=ramp(.8)*filamentAA((pos.z+sin(pos.x*4.+t*.2)*.06)*35.)*.065*u_p[6];
 float ao=clamp(liquidField(pos+n*.12,t)/.12,.2,1.);return base*ao+u_colors[2]*fresnel*.08*u_p[3];
}
`;
export const FLUID_CONTROLS=[['viscosity','Viscosity',.2,2,1],['tension','Surface tension',.1,2,1],['separation','Separation',.1,2,1],['damping','Wave damping',.2,3,1],['reflection','Reflection',0,2,1],['refraction','Transmission',0,2,.8],['thickness','Optical thickness',.1,3,1],['pulse','Pulse pressure',0,2,1]];
export function fluidSettings(saved={}){return Object.fromEntries(FLUID_CONTROLS.map(([k,,lo,hi,v])=>[k,Number.isFinite(saved[k])?Math.max(lo,Math.min(hi,saved[k])):v]));}
