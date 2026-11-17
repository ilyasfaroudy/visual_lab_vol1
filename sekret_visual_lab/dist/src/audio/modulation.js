import { clamp } from '../app/utils.js';
export const SIGNAL_SOURCES=[['none','NONE / STATIC'],['kick','KICK / ONSET PROXY'],['snare','SNARE / NOISE PROXY'],['hats','HI-HAT / AIR PROXY'],['vocal','VOCAL / TONAL MID PROXY'],['melody','MELODY / TONAL PROXY'],['bassline','BASSLINE / SUSTAIN PROXY'],['percussion','PERCUSSION / ONSET PROXY'],['bass','BASS (20–140 Hz)'],['beat','BEAT / TRANSIENT'],['low','LOW (140–400 Hz)'],['lowMid','LOW–MID (400–1K)'],['mid','MID (1–3K)'],['highMid','HIGH–MID (3–6K)'],['high','HIGH (6K+)'],['energy','OVERALL ENERGY'],['peak','PEAK'],['flux','SPECTRAL FLUX'],['transient','TRANSIENT ACCENT'],['rhythm','RHYTHM ENVELOPE'],['waveform','WAVEFORM RMS'],['fft1','FFT / BAND 01'],['fft2','FFT / BAND 02'],['fft3','FFT / BAND 03'],['fft4','FFT / BAND 04']];
export const RESPONSE_PRESETS={
 snappy:{smoothness:.1,attack:.018,release:.14},smooth:{smoothness:.65,attack:.08,release:.45},
 pulse:{smoothness:.3,attack:.065,release:.48},float:{smoothness:.95,attack:.25,release:1.15}
};
const finite=(v,d,min,max)=>Number.isFinite(Number(v))?clamp(Number(v),min,max):d;
export class Modulator{
 constructor(){this.memory=new Map();this.states=new Map();this.sources=new Map();this.time=0;}
 reset(){this.memory.clear();this.states.clear();this.sources.clear();this.time=0;}
 beginFrame(signals,dt){
  dt=finite(dt,1/60,0,.1);this.time+=dt;
  for(const [key] of SIGNAL_SOURCES){if(key==='none')continue;let s=this.sources.get(key);if(!s){s={peak:.65,armed:true,last:-10,count:0,event:false};this.sources.set(key,s);}
   const x=finite(signals[key],0,0,1);s.peak=Math.max(.65,x,s.peak*Math.exp(-dt/3));s.normal=x/s.peak;s.event=false;
   if(x<.12)s.armed=true;
   if(s.armed&&x>=.24&&this.time-s.last>=.12){s.event=true;s.count++;s.last=this.time;s.armed=false;}
  }
 }
 evaluate(id,control,signals,dt){
  if(!control)return 0;const {value=0,map:m={}}=control,source=m.source||'none';if(source==='none')return value;
  const lo=finite(m.min,0,-1e6,1e6),hi=Math.max(lo,finite(m.max,1,-1e6,1e6));
  let s=this.states.get(id);if(!s||s.source!==source){s={source,value:0,last:-10,start:0,age:1e6};this.states.set(id,s);}
  const smooth=finite(m.smoothness,.5,0,1),attack=finite(m.attack,.06,.003,5)+smooth*smooth*.24,release=finite(m.release,.3,.003,5)+smooth*smooth*.85;
  const threshold=finite(m.threshold,0,0,.99),gain=finite(m.gain,1,0,5),src=this.sources.get(source);
  let raw=clamp(((src?.normal??signals[source]??0)*gain-threshold)/(1-threshold),0,1);
  if(m.curve==='exponential')raw*=raw;else if(m.curve==='soft')raw=Math.sqrt(raw);else if(m.curve==='smooth')raw=raw*raw*(3-2*raw);
  const eventSource=source==='beat'||source==='transient';let response;
  if(eventSource){
   const every=m.triggerRate==='2'?2:m.triggerRate==='4'?4:1,cooldown=finite(m.cooldown,.12,.03,10);
   const interval=m.triggerRate==='custom'?finite(m.interval,.5,.05,20):cooldown;
   if(src?.event&&raw>0&&(src.count-1)%every===0&&this.time-s.last>=Math.max(cooldown,interval)){
    s.start=s.value;s.age=0;s.last=this.time;s.peak=raw;
   }
   s.age+=Math.max(0,dt);
   if(s.age<attack){const x=s.age/attack;response=s.start+((s.peak??1)-s.start)*x*x*(3-2*x);}
   else response=(s.peak??0)*Math.exp(-(s.age-attack)/release);
  }else{const tau=raw>s.value?attack:release;response=s.value+(raw-s.value)*(1-Math.exp(-Math.max(0,dt)/tau));}
  s.value=clamp(response,0,1);const shaped=m.invert?1-s.value:s.value;this.memory.set(id,shaped);
  const delta=shaped*finite(m.strength,.5,0,3)*finite(m.intensity,1,0,2);
  const output=m.mode==='replace'?lo+(hi-lo)*delta:m.mode==='multiply'?value*(1+delta):value+delta*(hi-lo)*.35;
  return clamp(output,lo,hi);
 }
}
