// Spectral proxies, not stem separation. Silence stays silent; overlapping instruments can cross-trigger.
export const MUSICAL_KEYS=['kick','snare','hats','vocal','melody','bassline','percussion'];
export class MusicalSignals{
 constructor(){this.reset()}
 reset(){this.previous=null;this.envelopes={};}
 read(bytes,sampleRate,dt){dt=Math.max(.001,Math.min(.1,dt));const bands=[[35,150],[160,500],[700,3500],[4500,16000]],energy=[],onset=[],flatness=[];
 if(!this.previous||this.previous.length!==bytes.length)this.previous=new Float32Array(bytes.length);
 for(const [lo,hi] of bands){let sum=0,log=0,flux=0,n=0;const a=Math.max(1,Math.floor(lo/(sampleRate/2)*bytes.length)),b=Math.min(bytes.length,Math.ceil(hi/(sampleRate/2)*bytes.length));for(let i=a;i<b;i++){const x=bytes[i]/255;sum+=x;log+=Math.log(x+.0001);flux+=Math.max(0,x-this.previous[i]);n++;}const e=sum/Math.max(1,n);energy.push(e);onset.push(flux/Math.max(1,n));flatness.push(Math.min(1,Math.exp(log/Math.max(1,n))/(e+.0001)));}
 for(let i=0;i<bytes.length;i++)this.previous[i]=bytes[i]/255;
 const [low,body,mid,air]=energy,[ol,ob,om,oa]=onset,tonal=1-flatness[2],sustain=1-Math.min(1,om*8);
 const raw={kick:ol*9*(.4+low)*(1-Math.min(.8,air)),snare:(ob*3+om*4)*(.3+flatness[2])*(.3+body+mid),hats:oa*8*(.3+flatness[3]),vocal:mid*tonal*sustain*(.4+body)*2,melody:mid*tonal*(1-Math.min(.8,low))*1.8,bassline:low*(1-Math.min(.85,ol*7))*1.5,percussion:(ob+om+oa)*3};
 const result={};for(const key of MUSICAL_KEYS){const value=Math.max(0,Math.min(1,raw[key]));const old=this.envelopes[key]||0;const sustained=['vocal','melody','bassline'].includes(key),tau=value>old?(sustained?.09:.018):(sustained?.45:key==='hats'?.12:.24);result[key]=this.envelopes[key]=old+(value-old)*(1-Math.exp(-dt/tau));}return result;
 }
}
