const param=(id,label,min,max,value,step=.01)=>({id,label,min,max,default:value,step});
export const STUDIO_SCENES=new Map([
 ['topographic-atlas',{id:'topographic-atlas',name:'TOPOGRAPHIC ATLAS',category:'COMPOSITION',desc:'Contour cartography shaped by interference fields and cursor pressure',params:[param('levels','Contour Layers',8,52,28,1),param('motion','Drift Speed',0,2,.35),param('fold','Field Folding',0,2,.8),param('weight','Ink Weight',.3,2, .8),param('scale','Field Scale',.4,2,1),param('islands','Field Complexity',2,9,5,1)]}],
 ['orbital-engraving',{id:'orbital-engraving',name:'ORBITAL ENGRAVING',category:'COMPOSITION',desc:'Woven spatial curves: apertures, torques and precision linework',params:[param('threads','Thread Count',24,160,88,1),param('motion','Orbit Speed',0,2,.25),param('twist','Twist',1,9,3,1),param('weight','Ink Weight',.3,2,.7),param('aperture','Aperture',.1,1,.55),param('weave','Weave Depth',0,2,.8)]}]
]);
export const STUDIO_LOOKS={'topographic-atlas':['CONTOUR ARCHIPELAGO','FAULT LINES','ISOBAR STUDY'],'orbital-engraving':['WOVEN APERTURE','TORQUE STUDY','FILAMENT VESSEL']};
export function studioDefaults(id,look=0){const scene=STUDIO_SCENES.get(id);if(!scene)return null;const values=Object.fromEntries(scene.params.map(p=>[p.id,{value:p.default}]));if(look===1){if(id==='topographic-atlas'){values.fold.value=1.65;values.levels.value=40;values.islands.value=3;}else{values.twist.value=7;values.aperture.value=.28;values.weave.value=1.6;}}if(look===2){if(id==='topographic-atlas'){values.fold.value=.3;values.levels.value=18;values.islands.value=8;}else{values.twist.value=2;values.aperture.value=.8;values.threads.value=140;}}return values;}
export class StudioFields{
 constructor(){this.canvas=document.createElement('canvas');this.grid=new Float32Array(101*81);}
 render(id,p,time,seed,pointer,colors,width,height){const c=this.canvas;if(c.width!==width||c.height!==height){c.width=width;c.height=height;}const g=c.getContext('2d');g.fillStyle='#08090c';g.fillRect(0,0,width,height);const unit=Math.min(width,height),t=time*p.motion,phase=seed*.6180339;g.lineWidth=Math.max(.5,unit/600*p.weight);g.lineJoin='round';g.lineCap='round';
 const ink=colors[2]||'#f1e6df',wine=colors[1]||'#a74769';
 if(id==='topographic-atlas'){
 const nx=100,ny=80,grid=this.grid,aspect=width/height;
 for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++){const px=(x/nx-.5)*aspect*3/p.scale,py=(y/ny-.5)*3/p.scale;let field=0;
 for(let k=0;k<p.islands;k++){const a=k*2.39996+phase,cx=Math.cos(a+t*.09)*1.35,cy=Math.sin(a*1.7-t*.06)*.8,dx=px-cx,dy=py-cy;field+=Math.exp(-(dx*dx+dy*dy)*(1.2+(k%3)*.45))*(.55+.25*Math.sin(a));}
 const dx=x/nx-pointer[0],dy=y/ny-(1-pointer[1]);field+=Math.exp(-(dx*dx+dy*dy)*38)*.15;
 field+=Math.sin(px*3+Math.sin(py*2+t*.2)*p.fold+phase)*Math.cos(py*2.6-t*.15)*p.fold*.13;grid[y*101+x]=field;}
 for(let level=0;level<p.levels;level++){const threshold=.05+level/p.levels*1.8;g.beginPath();for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){const a=grid[y*101+x],b=grid[y*101+x+1],c=grid[(y+1)*101+x+1],d=grid[(y+1)*101+x];if(threshold<Math.min(a,b,c,d)||threshold>Math.max(a,b,c,d))continue;const values=[a,b,c,d];const corners=[[x,y],[x+1,y],[x+1,y+1],[x,y+1]],crossings=[];for(let k=0;k<4;k++){const j=(k+1)%4;if((values[k]>=threshold)===(values[j]>=threshold))continue;const a=(threshold-values[k])/(values[j]-values[k]);crossings.push([(corners[k][0]+(corners[j][0]-corners[k][0])*a)/nx*width,(corners[k][1]+(corners[j][1]-corners[k][1])*a)/ny*height]);}for(let i=0;i+1<crossings.length;i+=2){g.moveTo(...crossings[i]);g.lineTo(...crossings[i+1]);}}
 g.strokeStyle=level%5===0?ink:wine;g.globalAlpha=level%5===0?.8:.45;g.stroke();}g.globalAlpha=1;
 }else{
 g.translate(width/2,height/2);const threads=Math.round(p.threads),angle=.8+Math.sin(t*.12)*.15;
 for(let j=0;j<threads;j++){const a=j/threads*Math.PI*2;g.beginPath();for(let i=0;i<=220;i++){const b=i/220*Math.PI*2,ring=.42+p.aperture*.24,tube=.16+p.weave*.055*Math.cos(b*p.twist+a*2+phase);let x=(ring+tube*Math.cos(b))*Math.cos(a),y=(ring+tube*Math.cos(b))*Math.sin(a),z=tube*Math.sin(b);z+=Math.sin(a*p.twist+b+phase+t*.13)*p.weave*.1;const orbit=.35+Math.sin(t*.08)*.4,xx=x*Math.cos(orbit)-z*Math.sin(orbit),zz=x*Math.sin(orbit)+z*Math.cos(orbit),yy=y*Math.cos(angle)-zz*Math.sin(angle),depth=y*Math.sin(angle)+zz*Math.cos(angle),perspective=1/(1-depth*.3),px=xx*unit*.83*perspective,py=yy*unit*.83*perspective;if(i===0)g.moveTo(px,py);else g.lineTo(px,py);}g.strokeStyle=j%4===0?ink:wine;g.globalAlpha=j%4===0?.9:.48;g.stroke();}g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;
 }
 return c;}
}
