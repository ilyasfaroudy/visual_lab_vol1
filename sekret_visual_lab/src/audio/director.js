// Lightweight offline musical structure estimator. It is not speech/genre recognition:
// section labels are energy-based heuristics and remain editable by the user.
const constrain=(v,a,b)=>Math.max(a,Math.min(b,v));
const LABELS=['INTRO','BUILD','DROP','BREAK','OUTRO'];
const BAND_COLORS=['#7f263d','#a84b68','#c47c8b','#e6a4b3','#f2d8d9'];
function rangeEnergy(channel,start,end,stride){let v=0,n=0,peak=0;for(let i=start;i<end;i+=stride){const s=channel[i];v+=s*s;peak=Math.max(peak,Math.abs(s));n++;}return {rms:Math.sqrt(v/Math.max(1,n)),peak};}
export function estimateTempo(channel,rate){
 // 100 Hz energy envelope, positive flux, normalized autocorrelation. A heuristic,
 // with an explicit confidence value; silence and non-rhythmic audio return null.
 const hop=Math.max(1,Math.round(rate*.01)),length=Math.min(Math.floor(channel.length/hop),60000);
 if(length<200)return {bpm:null,confidence:0};const onset=new Float32Array(length);let previous=0,power=0;
 for(let k=0;k<length;k++){let sum=0,n=0;for(let j=k*hop;j<(k+1)*hop;j+=4){sum+=channel[j]*channel[j];n++;}const energy=Math.sqrt(sum/Math.max(1,n));onset[k]=Math.max(0,energy-previous);power+=onset[k]*onset[k];previous=energy;}
 if(power<.00001)return {bpm:null,confidence:0};let best=0,bestLag=0;
 for(let lag=33;lag<=100;lag++){let cross=0,a=0,b=0;for(let k=lag;k<length;k++){cross+=onset[k]*onset[k-lag];a+=onset[k]*onset[k];b+=onset[k-lag]*onset[k-lag];}const score=cross/Math.sqrt(Math.max(1e-12,a*b));if(score>best){best=score;bestLag=lag;}}
 return {bpm:best>.18?Math.round(60*rate/(hop*bestLag)):null,confidence:best};
}
export function analyzeAudioBuffer(buffer){
 if(!buffer||!buffer.length||!Number.isFinite(buffer.duration))throw Error('Invalid decoded audio');
 const channel=buffer.getChannelData(0),rate=buffer.sampleRate;
 const hop=Math.max(2048,Math.round(rate*.24)),frames=Math.max(1,Math.ceil(channel.length/hop));
 const levels=[];let max=0;
 for(let i=0;i<frames;i++){const s=i*hop,e=Math.min(channel.length,s+hop),r=rangeEnergy(channel,s,e,Math.max(1,Math.floor((e-s)/512)));const value=r.rms;levels.push(value);max=Math.max(max,value);}
 const normalized=levels.map(v=>constrain(v/Math.max(.015,max),0,1));
 const envelope=normalized.map((v,i)=>{
  let sum=0,n=0;for(let j=Math.max(0,i-4);j<=Math.min(normalized.length-1,i+4);j++){sum+=normalized[j];n++;}return sum/n;
 });
 // Divide the duration into a bounded number of musical sections, then classify by intensity/trend.
 const count=constrain(Math.round(buffer.duration/18),3,9),duration=buffer.duration,sections=[];
 for(let i=0;i<count;i++){
  const start=i/count*duration,end=(i+1)/count*duration;
  const a=Math.floor(start*rate/hop),b=Math.min(envelope.length,Math.ceil(end*rate/hop));
  let total=0,n=0;for(let j=a;j<b;j++){total+=envelope[j]||0;n++;}
  const energy=constrain(total/Math.max(1,n),0,1);
  const before=sections[i-1]?.energy??energy;
  let label=i===0?'INTRO':i===count-1?'OUTRO':energy>.69&&energy>before*.98?'DROP':energy<before*.76?'BREAK':energy>before*1.12?'BUILD':'GROOVE';
  sections.push({id:`section-${i}`,start,end,energy,label,intensity:constrain(.65+energy*.95,.5,1.8),palette:i%5});
 }
 for(let i=1;i<sections.length;i++){
 const target=sections[i].start,window=Math.min(3,duration/count*.23);let best=0,boundary=target;
 for(let j=3;j<envelope.length-3;j++){const time=j*hop/rate;if(Math.abs(time-target)>window)continue;const change=Math.abs(envelope[j+2]-envelope[j-2]);if(change>best){best=change;boundary=time;}}
 if(best>.035){sections[i].start=boundary;sections[i-1].end=boundary;}
 }
 // Detect strong rises in the smoothed loudness envelope as candidate transient events.
 const beats=[];let last=-1;
 for(let i=2;i<normalized.length-1;i++){
  const t=i*hop/rate;const baseline=envelope[i];
  if(t-last>.26 && normalized[i]>Math.max(.20,baseline*1.4)&&normalized[i]>normalized[i-1]&&normalized[i]>=normalized[i+1]){beats.push(Number(t.toFixed(3)));last=t;}
 }
 const tempo=estimateTempo(channel,rate);return {version:2,bpm:tempo.bpm,tempoConfidence:tempo.confidence,duration,sections,beats:beats.slice(0,2500),sampleCount:frames,generatedAt:new Date().toISOString()};
}
export function sectionAt(analysis,time){return analysis?.sections?.find(s=>time>=s.start&&time<s.end)||analysis?.sections?.at(-1)||null;}
export function directorSignals(signal,analysis,time,mix=1){const section=sectionAt(analysis,time);if(!section||!mix)return signal;
 const boost=1+(section.intensity-1)*constrain(mix,0,1);
 return {...signal,bass:constrain(signal.bass*boost,0,1),low:constrain(signal.low*boost,0,1),mid:constrain(signal.mid*boost,0,1),high:constrain(signal.high*boost,0,1),energy:constrain(signal.energy*boost,0,1),beat:constrain(signal.beat*(.7+.3*boost),0,1)};
}
export const DIRECTOR_LABELS=['INTRO','BUILD','GROOVE','DROP','BREAK','OUTRO'];
