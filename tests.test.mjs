import test from 'node:test';
import assert from 'node:assert/strict';
import {maskAt,applyReactiveMask} from './src/image/masking.js';
import {analyzeAudioBuffer,sectionAt,directorSignals} from './src/audio/director.js';
import {normalizeProject,encodeProject,decodeProject} from './src/project/project.js';
import {SCENE_MAP} from './src/audio/scenes.js';

test('Reactive Masking selects shadows instead of highlights',()=>{
 const original={width:2,height:1,data:new Uint8ClampedArray([15,15,15,255,245,245,245,255])};
 const modified={width:2,height:1,data:new Uint8ClampedArray([240,40,40,255,40,40,240,255])};
 assert.ok(maskAt(original.data,2,1,0,0,{region:'shadows',threshold:.5,feather:.1})>.95);
 assert.ok(maskAt(original.data,2,1,1,0,{region:'shadows',threshold:.5,feather:.1})<.05);
 applyReactiveMask(original,modified,{region:'shadows',threshold:.5,feather:.1});
 assert.equal(modified.data[0],240);assert.equal(modified.data[4],245);
});
test('Reactive Masking supports edge masks, saturation, inversion',()=>{
 const original=new Uint8ClampedArray([0,0,0,255,255,0,0,255,255,255,255,255]);
 assert.ok(maskAt(original,3,1,0,0,{region:'edges',threshold:.25,feather:.1})>.5);
 assert.ok(maskAt(original,3,1,1,0,{region:'saturated',threshold:.5,feather:.1})>.9);
 assert.ok(maskAt(original,3,1,2,0,{region:'desaturated',threshold:.5,feather:.1})>.9);
 assert.equal(maskAt(original,3,1,1,0,{region:'all',invert:true}),0);
});
test('Sound Director analyzes sections within audio timeline',()=>{
 const rate=8000,duration=12,channel=new Float32Array(rate*duration);
 for(let i=0;i<channel.length;i++){const seconds=i/rate;const amp=seconds<4?.06:seconds<8?.85:.2;channel[i]=amp*Math.sin(2*Math.PI*120*i/rate)}
 const analysis=analyzeAudioBuffer({length:channel.length,sampleRate:rate,duration,getChannelData:()=>channel});
 assert.equal(analysis.sections.length,3);assert.equal(analysis.sections[0].start,0);
 assert.ok(analysis.sections.every(s=>s.end>s.start&&s.energy>=0&&s.energy<=1));
 assert.ok(sectionAt(analysis,6));
 const modulated=directorSignals({bass:.2,low:.2,mid:.2,high:.2,energy:.2,beat:.3},analysis,6,1);
 assert.ok(modulated.bass>=0&&modulated.bass<=1);
});
test('v2 Project Code remains compatible in v3',()=>{
 const original={schemaVersion:2,appVersion:'0.2.0',lab:'audio',name:'МОЙ ПРОЕКТ',audio:{sceneId:'signal-lines',settings:{}},image:{}};
 const code=encodeProject(original);assert.ok(code.startsWith('SEKRET2:'));
 assert.deepEqual(decodeProject(code),original);
 const normalized=normalizeProject(original);assert.equal(normalized.lab,'audio');
 assert.ok(SCENE_MAP.has(normalized.audio.sceneId));
});

import {Modulator} from './src/audio/modulation.js';
import {extractMaterialDNA} from './src/audio/materialDNA.js';
import {LOOKS,applyLook} from './src/audio/scenes.js';
test('Modulation has attack/release, bounds and response curves',()=>{
 const m=new Modulator(),c={value:10,map:{source:'bass',min:0,max:30,strength:1,attack:.01,release:.5,curve:'exponential'}};
 const first=m.evaluate('a',c,{bass:1},.1);assert.ok(first>19&&first<=30);
 const released=m.evaluate('a',c,{bass:0},.01);assert.ok(released<first&&released>18);
 const soft=m.evaluate('b',{...c,map:{...c.map,curve:'soft'}},{bass:.25},.1);
 const hard=m.evaluate('c',c,{bass:.25},.1);assert.ok(soft>hard);
 assert.ok(Number.isFinite(m.evaluate('bad',{value:1,map:{source:'bass',min:20,max:2}},{bass:1},.1)));
});
test('Material DNA ignores transparent pixels and sorts palette by luminance',()=>{
 const a=extractMaterialDNA({width:4,height:1,data:new Uint8ClampedArray([255,0,0,0,0,0,0,255,100,100,100,255,255,255,255,255])});
 assert.deepEqual(a.palette,['#000000','#646464','#ffffff']);assert.ok(a.contrast>.3);assert.ok(a.edges>0);
 const blank=extractMaterialDNA({width:1,height:1,data:new Uint8ClampedArray(4)});assert.equal(blank.luminance,0);
});
test('All art-directed looks respect the parameter ranges',()=>{
 for(const [id,looks] of Object.entries(LOOKS))for(let i=0;i<looks.length;i++){const settings=applyLook(id,i);for(const p of SCENE_MAP.get(id).params)assert.ok(settings[p.id].value>=p.min&&settings[p.id].value<=p.max,id+' '+p.id);}
});
test('Hue selection wraps around red and excludes unsaturated pixels',()=>{
 const data=new Uint8ClampedArray([255,0,8,255,0,255,0,255,200,200,200,255]);
 assert.ok(maskAt(data,3,1,0,0,{region:'hue',hue:0,threshold:.1,feather:.05})>.9);
 assert.ok(maskAt(data,3,1,1,0,{region:'hue',hue:0,threshold:.1,feather:.05})<.1);
 assert.equal(maskAt(data,3,1,2,0,{region:'hue',hue:0,threshold:.1,feather:.05}),0);
});
test('Mask strength zero preserves original pixels and preview is diagnostic',()=>{
 const source={width:1,height:1,data:new Uint8ClampedArray([100,50,25,255])};const output={width:1,height:1,data:new Uint8ClampedArray([255,255,255,255])};
 applyReactiveMask(source,output,{region:'all',strength:0});assert.deepEqual(output.data,source.data);
 applyReactiveMask(source,output,{region:'all',preview:true});assert.equal(output.data[0],255);
});
test('Intersection and union combine independently selected tonal regions',()=>{
 const d=new Uint8ClampedArray([10,10,10,255,240,240,240,255]);
 assert.equal(maskAt(d,2,1,0,0,{region:'shadows',secondary:'highlights',combine:'intersect',threshold:.5,feather:.1}),0);
 assert.equal(maskAt(d,2,1,0,0,{region:'shadows',secondary:'highlights',combine:'union',threshold:.5,feather:.1}),1);
});
test('New fields survive project code without changing SEKRET2 prefix',()=>{
 const p={schemaVersion:2,lab:'audio',name:'DNA',audio:{dna:{enabled:true,mix:.7},compose:{enabled:true,blend:1},variants:{'ribbon-flow':2},recordFPS:60},image:{layers:[{effects:[{mask:{region:'hue',secondary:'edges',combine:'union'}}]}]}};
 assert.deepEqual(decodeProject(encodeProject(p)),p);
});

import {estimateTempo} from './src/audio/director.js';
import {buildMesh} from './src/audio/geometry.js';
test('Tempo estimator finds an unambiguous 120 BPM pulse train and rejects silence',()=>{
 const rate=8000,c=new Float32Array(rate*8);for(let i=0;i<c.length;i++){const phase=(i/rate)%.5;c[i]=Math.sin(i/rate*2*Math.PI*120)*Math.exp(-phase*35);}
 const result=estimateTempo(c,rate);assert.ok(Math.abs(result.bpm-120)<3);assert.ok(result.confidence>.4);assert.equal(estimateTempo(new Float32Array(rate*3),rate).bpm,null);
});
test('Reusable mesh buffers contain finite normalized UVs and complete triangles',()=>{
 const mesh=buildMesh();assert.equal(mesh.lines.length%6,0);assert.equal(mesh.faces.length%9,0);assert.ok(mesh.lines.every(x=>Number.isFinite(x)&&x>=0&&x<=1));assert.ok(mesh.faces.every(x=>Number.isFinite(x)&&x>=0&&x<=1));
});
