import {mkdir,writeFile} from 'node:fs/promises';import {webSource,FX_TYPES} from '../src/tools/webfx.js';
await mkdir('public/assets/webfx',{recursive:true});
for(const type of FX_TYPES){let html=webSource({type});
// The preview document has no parent-origin privileges. Its fragment contains only typed settings.
const setup=`(()=>{let x={};try{x=JSON.parse(new URLSearchParams(location.search).get('settings')||'{}')}catch{}for(const key of ['radius','strength','smoothing','density'])if(Number.isFinite(x[key]))config[key]=x[key];config.radius=Math.max(20,Math.min(200,config.radius));config.strength=Math.max(0,Math.min(2,config.strength));config.smoothing=Math.max(.02,Math.min(.4,config.smoothing));config.density=Math.round(Math.max(12,Math.min(160,config.density)));if(typeof x.text==='string')config.text=x.text.slice(0,40);if(/^#[0-9a-f]{6}$/i.test(x.color))config.color=x.color;return config;})()`;
// Insert setup at the first root binding, after the exported config literal.
html=html.replace(",root=document.querySelector",",previewConfig="+setup+",root=document.querySelector");
if(type!=='liquid-glass')html=html.replace("if(config.type==='interactive-type'){title.textContent='';", "title.textContent=config.text;if(config.type==='interactive-type'){title.textContent='';");
await writeFile('public/assets/webfx/'+type+'.html',html);}
console.log('Generated three sandbox preview documents');

