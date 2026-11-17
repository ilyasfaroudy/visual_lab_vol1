// A shared post-analysis response: normalized spectral proxies, not stem separation.
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
export const AUDIO_PROFILES={balanced:{attack:.025,release:.24,gain:1,threshold:.035,cooldown:.13},smooth:{attack:.09,release:.6,gain:.9,threshold:.045,cooldown:.2},punchy:{attack:.009,release:.16,gain:1.2,threshold:.07,cooldown:.1},flowing:{attack:.14,release:.9,gain:.95,threshold:.025,cooldown:.18}};
export const EVENT_SOURCES=new Set(['beat','transient','kick','snare','hats','percussion']);
export function responseSettings(s={}){const d={auto:true,profile:'balanced',...AUDIO_PROFILES.balanced,...s};d.auto=!!d.auto;for(const [k,a,b] of [['attack',.003,1],['release',.03,3],['gain',.1,3],['threshold',0,.5],['cooldown',.03,1]])d[k]=Number.isFinite(+d[k])?clamp(+d[k],a,b):AUDIO_PROFILES.balanced[k];return d;}
export class AudioResponse{
 constructor(){this.reset()}
 reset(){this.states=new Map();this.time=0;}
 process(input,dt,config,rms){this.time+=dt;const out={};const audible=rms>.0015;
  for(const [key,value] of Object.entries(input)){
   const x=audible?clamp(Number(value)||0):0;let s=this.states.get(key);if(!s){s={peak:.25,mean:0,value:0,last:-10,armed:true,previous:0};this.states.set(key,s)}
   s.peak=Math.max(.08,x,s.peak*Math.exp(-dt/5));s.mean+=(x-s.mean)*(1-Math.exp(-dt/1.4));
   let target=clamp((x*(config.auto?Math.min(6,.72/s.peak):1)*config.gain-config.threshold)/(1-config.threshold));
   if(EVENT_SOURCES.has(key)){
    const threshold=Math.max(config.threshold,.035,s.mean*.65);
    if(x<threshold*.65)s.armed=true;
    const onset=x-s.previous>Math.max(.025,s.mean*.28);
    if(audible&&(s.armed||onset)&&x>threshold&&this.time-s.last>config.cooldown){s.last=this.time;s.amplitude=target;s.armed=false;}
    const age=this.time-s.last;target=age<config.attack?(s.amplitude||0)*age/config.attack:(s.amplitude||0)*Math.exp(-(age-config.attack)/config.release);
    s.value=target;
   }else s.value+=(target-s.value)*(1-Math.exp(-dt/(target>s.value?config.attack:config.release)));
   s.previous=x;out[key]=clamp(s.value);
  }return out;
 }
}

