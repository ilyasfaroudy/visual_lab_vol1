import { download,slug,toast } from '../app/utils.js';
const KEY='sekret2-last-project';
export function normalizeProject(project){
 if(!project||typeof project!=='object')throw Error('Invalid project data');
 if(project.schemaVersion===1){return {schemaVersion:2,appVersion:'4.0.0',lab:project.lab||'image',name:project.name||'UNTITLED',image:{layers:project.layers||[],selected:project.selected||null,color:{saturation:100,hue:0,contrast:100,brightness:100},category:project.category||'ALL',assets:[]},audio:{scene:typeof project.scene==='number'?['particle-web','fluid-blobs','geometry-field','feedback-field','media-reactive','signal-lines'][project.scene]||'particle-web':'particle-web',params:project.sceneParams||{},ratio:project.ratio||'16:9',sourceName:project.audioName||null,mediaName:project.mediaName||null,mappings:{}},migratedFrom:1};}
 if(project.schemaVersion!==2)throw Error('Unsupported schema version');
 if(!['image','audio','generative','webfx','forge'].includes(project.lab))throw Error('Unknown LAB');
 return project;
}
export function makeProject(app){return {schemaVersion:2,appVersion:'4.1.0',featureVersion:'creative-engine-2.1',webfx:app.webfx?.serialize()||app.savedWebfx||{},forge:app.forge?.serialize()||app.savedForge||{},lab:app.lab,name:app.name,image:app.image?.serialize()||app.savedImage||{},audio:app.audio?.serialize()||app.savedAudio||{},generative:app.generative?.serialize()||app.savedGenerative||{},heroSettings:app.heroSettings||{},savedAt:new Date().toISOString()};}
export function saveProject(app){const p=makeProject(app);download(new Blob([JSON.stringify(p,null,2)],{type:'application/json'}),slug(app.name)+'.sekret.json');toast('PROJECT FILE SAVED');}
export function encodeProject(project){const bytes=new TextEncoder().encode(JSON.stringify(project));let bin='';for(let i=0;i<bytes.length;i+=8192)bin+=String.fromCharCode(...bytes.slice(i,i+8192));return 'SEKRET2:'+btoa(bin);}
export function decodeProject(code){const raw=String(code).trim();if(raw.startsWith('SEKRET1:')||raw.startsWith('SEKRET2:')){const binary=atob(raw.slice(8));const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));return normalizeProject(JSON.parse(new TextDecoder().decode(bytes)))}throw Error('Invalid project code prefix');}
export function autosave(app){try{localStorage.setItem(KEY,JSON.stringify(makeProject(app)));}catch(e){console.warn('Autosave unavailable:',e)}}
export function latestProject(){try{const raw=localStorage.getItem(KEY);return raw?normalizeProject(JSON.parse(raw)):null}catch{return null}}
