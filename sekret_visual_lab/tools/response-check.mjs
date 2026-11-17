import assert from 'node:assert/strict';
import {Modulator} from '../src/audio/modulation.js';
const control=(extra={})=>({value:8,map:{source:'bass',min:4,max:24,mode:'replace',strength:1,smoothness:.75,intensity:1,attack:.06,release:.3,...extra}});
function run(dt,duration,c,input){const m=new Modulator();let result=0;for(let t=0;t<duration-1e-8;t+=dt){const sig=input(t);m.beginFrame(sig,dt);result=m.evaluate('x',c,sig,dt);}return result;}
const a=run(1/30,1,control(),()=>({bass:1})),b=run(1/120,1,control(),()=>({bass:1}));assert.ok(Math.abs(a-b)<.001,'framerate independence');
assert.ok(run(1/60,8,control({smoothness:1}),()=>({bass:1}))>23.99,'smoothness preserves sustained peak');
const hi=run(1/60,2,control(),()=>({bass:.2})),lo=run(1/60,2,control({intensity:.5}),()=>({bass:.2}));assert.ok(Math.abs((hi-4)/2-(lo-4))<1e-8,'independent intensity');
for(const rate of ['1','2','4','custom']){const m=new Modulator(),c=control({source:'beat',triggerRate:rate,interval:1.2});let starts=0,last=-10;for(let i=0;i<360;i++){const sig={beat:i%30<3?1:0};m.beginFrame(sig,1/60);const x=m.evaluate('x',c,sig,1/60);assert.ok(x>=4&&x<=24);const time=m.states.get('x').last;if(time!==last){starts++;last=time;}}assert.equal(starts,rate==='1'?12:rate==='2'?6:rate==='4'?3:4);}
const old=control();delete old.map.smoothness;delete old.map.intensity;assert.ok(Number.isFinite(run(1/60,1,old,()=>({bass:.5}))));
console.log('PASS: dt invariance, peak preservation, intensity independence, every 1/2/4/custom triggering, bounded envelopes, legacy settings');

const {normalizeProject,encodeProject,decodeProject}=await import('../src/project/project.js');
const {AudioLab}=await import('../src/audio/AudioLab.js');
const restored=Object.create(AudioLab.prototype);restored.sceneId='signal-lines';restored.variants={};restored.settings={'signal-lines':{density:{value:8,map:{source:'bass',min:4,max:24,mode:'replace',strength:.8}}}};
const merged=restored.currentSettings();assert.equal(merged.density.value,8);assert.equal(merged.density.map.strength,.8);assert.equal(merged.density.map.intensity,1);
const project={schemaVersion:2,lab:'audio',audio:{settings:restored.settings,interactions:{'particle-web':{mode:'repel'}}}};
assert.deepEqual(decodeProject(encodeProject(project)),project);assert.equal(normalizeProject({schemaVersion:1,lab:'audio'}).schemaVersion,2);
console.log('PASS: legacy control defaults, schema 1 migration, schema 2 / Project Code roundtrip with interaction');
