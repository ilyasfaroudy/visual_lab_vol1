import {AudioResponse,responseSettings} from './AudioResponse.js';
import {MusicalSignals,MUSICAL_KEYS} from './MusicalSignals.js';
import {analyzeAudioBuffer} from './director.js';
import {clamp,formatTime} from '../app/utils.js';
const EMPTY=()=>({...Object.fromEntries(MUSICAL_KEYS.map(k=>[k,0])),bass:0,low:0,lowMid:0,mid:0,highMid:0,high:0,energy:0,peak:0,beat:0,flux:0,transient:0,rhythm:0,waveform:0,fft1:0,fft2:0,fft3:0,fft4:0});
export class AudioSource{
 constructor(onChange){this.onChange=onChange;this.response=new AudioResponse();this.responseConfig=responseSettings();this.musical=new MusicalSignals();this.file=null;this.url=null;this.element=null;this.ctx=null;this.analyser=null;this.destination=null;this.data=null;this.waveform=null;this.analysis=null;this.frequencyPrev=null;this.energyPrev=0;this.beatEnvelope=0;this.lastRead=performance.now();this.dynamicPeaks=new Map()}
 async load(file){if(!file||!(file.type.startsWith('audio/')||file.type.startsWith('video/')))throw Error('Select an audio or video file.');this.dispose();this.file=file;this.url=URL.createObjectURL(file);
 const media=document.createElement(file.type.startsWith('video/')?'video':'audio');media.src=this.url;media.preload='auto';media.playsInline=true;media.crossOrigin='anonymous';media.style.display='none';document.body.append(media);this.element=media;
 await new Promise((resolve,reject)=>{if(media.readyState>=1){resolve();return;}media.addEventListener('loadedmetadata',resolve,{once:true});media.addEventListener('error',()=>reject(Error('Browser could not decode media.')),{once:true});});
 const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext)throw Error('Web Audio API unavailable');this.ctx=new AudioContext();
 this.analyser=this.ctx.createAnalyser();this.analyser.fftSize=2048;this.analyser.smoothingTimeConstant=.35;this.data=new Uint8Array(this.analyser.frequencyBinCount);this.frequencyPrev=new Float32Array(this.data.length);this.timeDomain=new Uint8Array(this.analyser.fftSize);this.waveformFrame=new Uint8Array(256);this.spectrumFrame=new Uint8Array(128).fill(0);
 const node=this.ctx.createMediaElementSource(media);node.connect(this.analyser);this.analyser.connect(this.ctx.destination);this.destination=this.ctx.createMediaStreamDestination();this.analyser.connect(this.destination);
 media.addEventListener('play',()=>this.onChange?.());media.addEventListener('pause',()=>this.onChange?.());media.addEventListener('ended',()=>this.onChange?.());
 if(file.type.startsWith('audio/')&&file.size<70*1024*1024){this.decodeWaveform(file).catch(e=>console.warn('Waveform analysis:',e.message));}
 this.onChange?.();return media;
 }
 async decodeWaveform(file){const context=this.ctx;if(!context)return;const bytes=await file.arrayBuffer();if(context!==this.ctx)return;const buffer=await context.decodeAudioData(bytes.slice(0));if(!buffer||context!==this.ctx||file!==this.file||!this.element)return;
 const channel=buffer.getChannelData(0),buckets=380,values=new Float32Array(buckets);const step=Math.max(1,Math.floor(channel.length/buckets));
 for(let i=0;i<buckets;i++){let sum=0,used=0;for(let j=i*step;j<Math.min(channel.length,(i+1)*step);j+=Math.max(1,Math.floor(step/90))){sum+=channel[j]*channel[j];used++}values[i]=Math.sqrt(sum/Math.max(1,used));}
 const max=Math.max(.02,...values);this.waveform=Array.from(values,v=>clamp(v/max,0,1));this.analysis=analyzeAudioBuffer(buffer);this.onChange?.();
 }
 async play(){if(!this.element)return;if(!this.element.paused){this.element.pause();return;}await this.ctx?.resume();await this.element.play();}
 pause(){this.element?.pause()}
 seek(fraction){if(this.element&&Number.isFinite(this.element.duration)){this.element.currentTime=clamp(fraction,0,1)*this.element.duration;this.frequencyPrev?.fill(0);this.musical.reset();this.response.reset();this.beatEnvelope=0;}}
 get playing(){return !!this.element&&!this.element.paused&&!this.element.ended}
 get duration(){return Number.isFinite(this.element?.duration)?this.element.duration:0}
 get time(){return this.element?.currentTime||0}
 get isVideo(){return this.element?.tagName==='VIDEO'}
 read(now){const dt=clamp((now-this.lastRead)/1000,.001,.1);this.lastRead=now;if(!this.analyser||!this.playing)return EMPTY();this.analyser.getByteFrequencyData(this.data);
 this.analyser.getByteTimeDomainData(this.timeDomain);
 for(let i=0;i<256;i++)this.waveformFrame[i]=this.timeDomain[Math.min(this.timeDomain.length-1,i*8)];
 // Logarithmic frequency bins preserve the low frequencies critical for musical motion.
 for(let i=0;i<128;i++){const f=i/127;const sourceBin=Math.min(this.data.length-1,Math.round(Math.pow(f,1.7)*(this.data.length-1)));this.spectrumFrame[i]=this.data[sourceBin];}

 const nyquist=this.ctx.sampleRate*.5;const bin=this.data.length;
 const band=(from,to)=>{let a=Math.max(0,Math.floor(from/nyquist*bin)),b=Math.min(bin,Math.max(a+1,Math.ceil(to/nyquist*bin)));let sum=0;for(let i=a;i<b;i++)sum+=this.data[i];const level=clamp(sum/(b-a)/255,0,1),key=from+'-'+to,previous=this.dynamicPeaks.get(key)||.08,peak=Math.max(.08,previous*Math.exp(-dt*.24),level*1.35);this.dynamicPeaks.set(key,peak);return clamp(Math.max(0,level-.025)/Math.max(.06,peak-.025),0,1)};
 let flux=0,total=0,peak=0;for(let i=0;i<this.data.length;i++){const v=this.data[i]/255;flux+=Math.max(0,v-this.frequencyPrev[i]);this.frequencyPrev[i]=v;total+=v*v;peak=Math.max(peak,v);}
 const energy=clamp(Math.sqrt(total/this.data.length)*1.75,0,1);const transient=clamp(flux/this.data.length*35,0,1);
 this.beatEnvelope=Math.max(transient,this.beatEnvelope*Math.exp(-dt*9));
 let rms=0;for(let i=0;i<this.timeDomain.length;i++){const x=(this.timeDomain[i]-128)/128;rms+=x*x;}rms=Math.sqrt(rms/this.timeDomain.length);this.rhythm=(this.rhythm||0)+(this.beatEnvelope-(this.rhythm||0))*(1-Math.exp(-dt*3.));
 return this.response.process({...this.musical.read(this.data,this.ctx.sampleRate,dt),flux:transient,transient,rhythm:this.rhythm,waveform:clamp(rms*3,0,1),bass:band(20,140),low:band(140,400),lowMid:band(400,1000),mid:band(1000,3000),highMid:band(3000,6000),high:band(6000,Math.min(18000,nyquist)),energy,peak,beat:this.beatEnvelope,fft1:band(20,100),fft2:band(100,600),fft3:band(600,3500),fft4:band(3500,nyquist)},dt,this.responseConfig,rms);
 }
 dispose(){this.response.reset();this.musical.reset();this.element?.pause();this.element?.remove();this.element=null;this.file=null;this.waveform=null;this.analysis=null;this.data=null;this.frequencyPrev=null;this.timeDomain=null;this.waveformFrame=null;this.spectrumFrame=null;if(this.ctx){this.ctx.close().catch(()=>{});this.ctx=null;}if(this.url){URL.revokeObjectURL(this.url);this.url=null;}this.analyser=null;this.destination=null;this.dynamicPeaks?.clear();this.beatEnvelope=0;this.rhythm=0;}
}
export function demoSignals(t){const beat=Math.pow(Math.max(0,Math.sin(t*PI2*.85)),17);return {kick:beat,snare:Math.pow(Math.max(0,Math.sin(t*PI2*.85+Math.PI)),12),hats:Math.pow(Math.max(0,Math.sin(t*PI2*3.4)),6),vocal:.22+.15*Math.sin(t*.7)**2,melody:.25+.18*Math.sin(t*.4)**2,bassline:.3+.22*Math.sin(t*1.2)**2,percussion:.4*Math.sin(t*5)**8,flux:beat,transient:beat,rhythm:.3+.3*Math.sin(t*1.4)**2,waveform:.2+.4*beat,bass:.24+.42*beat,low:.16+.2*Math.sin(t*.7)**2,lowMid:.2+.21*Math.sin(t*.91)**2,mid:.16+.3*Math.sin(t*1.3)**2,highMid:.12+.31*Math.sin(t*3.1)**2,high:.16+.29*Math.sin(t*3.8)**2,energy:.35+.27*beat,peak:.45+.3*beat,beat,fft1:.35+.4*beat,fft2:.2+.22*Math.sin(t*.8)**2,fft3:.26+.2*Math.sin(t*1.8)**2,fft4:.21+.2*Math.sin(t*3.8)**2};}
const PI2=Math.PI*2;
