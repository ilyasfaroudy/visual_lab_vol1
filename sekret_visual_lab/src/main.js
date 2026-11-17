import {openOnboarding} from './app/onboarding.js';
import {CreativeTools} from './tools/CreativeTools.js';
import {initPreferences,mountPreferences} from './app/preferences.js';
import {GenerativeLab} from './generative/GenerativeLab.js';
import {heroConfig} from './home/heroConfig.js';
import {$,$$,toast,filePicker,safe} from './app/utils.js';
import {makeProject,saveProject,encodeProject,decodeProject,normalizeProject,autosave} from './project/project.js';
import {Home} from './home/Home.js';
import {ImageLab} from './image/ImageLab.js';
import {AudioLab} from './audio/AudioLab.js';
const root=$('#app');
const app={lab:'home',name:'UNTITLED PROJECT',home:null,image:null,audio:null,generative:null,savedGenerative:null,heroSettings:heroConfig(),savedImage:null,savedAudio:null,webfx:null,forge:null,savedWebfx:null,savedForge:null};
let lastSave=0;
const requestSave=()=>{if(app.lab==='home')return;const t=Date.now();if(t-lastSave>1600){lastSave=t;autosave(app)}};
function shell(){root.innerHTML=`<div id="home-root"></div><div id="lab-container" hidden><header class="editor-header"><button class="header-brand" id="header-home" title="Back to home"><img src="/assets/brand/sekret_main_logo_half.svg" alt="SEKRET half logo"><span>SEKRET <small>/ TOOLS LAB</small></span></button><span class="header-divider"></span><div id="current-lab" class="header-lab"></div><div class="project-input"><span>PROJECT</span><input id="project-name" maxlength="64" value="${safe(app.name)}" aria-label="Project name"></div><div class="header-buttons"><button class="head-btn" id="guide">GUIDE</button><button class="head-btn" id="undo" title="Undo (Ctrl+Z)">↶</button><button class="head-btn" id="redo" title="Redo (Ctrl+Shift+Z)">↷</button><button class="head-btn" id="save" title="Save project">SAVE</button><button class="head-btn" id="load" title="Load project">LOAD</button><button class="head-btn" id="code" title="Project code">PROJECT CODE</button><button class="head-btn export-btn" id="export">EXPORT ↗</button></div></header><div class="lab-mount" id="image-root" hidden></div><div class="lab-mount" id="audio-root" hidden></div><div class="lab-mount" id="generative-root" hidden></div><div class="lab-mount" id="webfx-root" hidden></div><div class="lab-mount" id="forge-root" hidden></div></div>`;
 mountPreferences($('.header-buttons'));$('#guide').onclick=()=>openOnboarding(navigate);$('#header-home').onclick=()=>navigate('home');$('#project-name').oninput=e=>{app.name=e.target.value||'UNTITLED PROJECT';requestSave()};
 $('#undo').onclick=()=>{if(app.lab==='image')app.image?.undo();else app[app.lab]?.undo();};$('#redo').onclick=()=>{if(app.lab==='image')app.image?.redo();else app[app.lab]?.redo()};
 $('#save').onclick=()=>saveProject(app);$('#load').onclick=loadFile;$('#code').onclick=projectCode;
 $('#export').onclick=()=>{if(app.lab==='image')app.image?.export();else if(app.lab==='generative')app.generative?.export();else if(['webfx','forge'].includes(app.lab))app[app.lab]?.export();else app.audio?.record()};
 }
function navigate(lab){if(lab===app.lab)return;
 if(app.lab!=='home')autosave(app);
 if(app.lab==='home'){app.home?.dispose();app.home=null;}if(app.lab==='audio')app.audio?.setActive(false);if(app.lab==='generative')app.generative?.setActive(false);
 if(['webfx','forge'].includes(app.lab))app[app.lab]?.setActive(false);app.lab=lab;$('#webfx-root').hidden=lab!=='webfx';$('#forge-root').hidden=lab!=='forge';$('#undo').disabled=$('#redo').disabled=['webfx','forge'].includes(lab);
 if(lab==='home'){$('#home-root').hidden=false;$('#lab-container').hidden=true;$('#image-root').hidden=true;$('#audio-root').hidden=true;$('#generative-root').hidden=true;app.home=new Home($('#home-root'),navigate,restoreProject,app.heroSettings);}
 else{$('#home-root').hidden=true;$('#lab-container').hidden=false;$('#image-root').hidden=lab!=='image';$('#audio-root').hidden=lab!=='audio';$('#generative-root').hidden=lab!=='generative';$('#current-lab').textContent=(lab==='image'?'PHOTO':lab.toUpperCase())+' LAB';$('#export').textContent=lab==='image'?'EXPORT IMAGE ↗':lab==='generative'?'CAPTURE PNG ↗':'RECORD MP4 / WEBM ●';
 if(lab==='image'&&!app.image)app.image=new ImageLab($('#image-root'),requestSave,app.savedImage,async(file,meta,destination='audio')=>{if(destination==='generative'){navigate('generative');await app.generative.composer.importFile(file,{bridge:true});return;}navigate('audio');const audio=app.audio;audio.capture?.();audio.sceneId='media-reactive';audio.bridgeMeta=meta;audio.render();await audio.loadVisual(file);});
 if(lab==='audio'&&!app.audio)app.audio=new AudioLab($('#audio-root'),requestSave,app.savedAudio);
 if(lab==='audio')app.audio?.setActive(true);if(lab==='generative'&&!app.generative)app.generative=new GenerativeLab($('#generative-root'),requestSave,app.savedGenerative);if(lab==='generative')app.generative.setActive(true);
 }
 if(['webfx','forge'].includes(lab)){if(!app[lab])app[lab]=new CreativeTools($('#'+lab+'-root'),lab,requestSave,lab==='webfx'?app.savedWebfx:app.savedForge,async file=>{navigate('generative');await app.generative.composer.importFile(file);});app[lab].setActive(true);$('#current-lab').textContent=lab==='webfx'?'WEB FX':'ASSET FORGE';$('#export').textContent=lab==='webfx'?'DOWNLOAD SOURCE ↗':'EXPORT SVG ↗';}
 requestSave();}
async function loadFile(){const files=await filePicker('.sekret,.json,.txt');if(!files.length)return;try{const project=normalizeProject(JSON.parse(await files[0].text()));restoreProject(project);toast('PROJECT RESTORED — RELINK MISSING MEDIA');}catch(e){toast('PROJECT LOAD FAILED: '+e.message,'error')}}
function restoreProject(project){try{const p=normalizeProject(project);app.home?.dispose();app.home=null;app.image?.dispose();app.audio?.dispose();app.generative?.dispose();app.webfx?.dispose();app.forge?.dispose();app.webfx=app.forge=null;app.savedWebfx=p.webfx||null;app.savedForge=p.forge||null;app.generative=null;app.savedGenerative=p.generative||null;app.heroSettings=heroConfig(p.heroSettings);app.image=null;app.audio=null;app.savedImage=p.image||{};app.savedAudio=p.audio||{};app.name=p.name||'UNTITLED PROJECT';$('#project-name').value=app.name;app.lab='home';navigate(p.lab);toast('PROJECT STATE LOADED — SOURCE FILES MAY REQUIRE RELINK');}catch(e){toast('RESTORE FAILED: '+e.message,'error')}}
function projectCode(){const p=makeProject(app);const code=encodeProject(p);const backdrop=document.createElement('div');backdrop.className='modal-backdrop';backdrop.innerHTML=`<div class="dialog project-dialog"><div class="dialog-title">PROJECT CODE <button id="close-code" class="icon-button">×</button></div><p>A portable configuration string. Source images, music and video are not embedded. Relink files after restoring.</p><textarea id="project-code-input" rows="8" spellcheck="false">${safe(code)}</textarea><div class="dialog-actions"><button id="copy-code" class="toolbtn">COPY CODE</button><button id="restore-code" class="toolbtn primary">RESTORE CODE ↗</button></div><div class="micro-note">Compatible with SEKRET1 and SEKRET2 configurations.</div></div>`;document.body.append(backdrop);backdrop.onclick=e=>{if(e.target===backdrop)backdrop.remove()};$('#close-code',backdrop).onclick=()=>backdrop.remove();$('#copy-code',backdrop).onclick=async()=>{try{await navigator.clipboard.writeText($('#project-code-input',backdrop).value);toast('PROJECT CODE COPIED')}catch{const text=$('#project-code-input',backdrop);text.focus();text.select();toast('SELECTED CODE — COPY MANUALLY')}};$('#restore-code',backdrop).onclick=()=>{try{restoreProject(decodeProject($('#project-code-input',backdrop).value));backdrop.remove()}catch(e){toast('CODE ERROR: '+e.message,'error')}};}
window.addEventListener('keydown',e=>{const editable=['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)||document.activeElement?.isContentEditable;if(e.key==='Escape')$('.modal-backdrop')?.remove();if(editable)return;
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();if(app.lab!=='home')saveProject(app)}
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();if(e.shiftKey){if(app.lab==='image')app.image?.redo();else app[app.lab]?.redo()}else{if(app.lab==='image')app.image?.undo();else app[app.lab]?.undo()}}
 if(e.code==='Space'&&['audio','generative'].includes(app.lab)){e.preventDefault();app[app.lab]?.play();}
 });
document.addEventListener('visibilitychange',()=>{if(document.hidden&&app.generative?.recorder?.state==='recording')app.generative.recorder.stop();if(document.hidden&&app.audio?.recorder?.state==='recording'){app.audio.recorder.stop();toast('RECORDING SAVED — KEEP THIS TAB VISIBLE WHILE CAPTURING');}});
window.addEventListener('beforeunload',()=>{if(app.lab!=='home')autosave(app)});
initPreferences();shell();app.home=new Home($('#home-root'),navigate,restoreProject,app.heroSettings);

document.addEventListener('sekret-workflow',e=>{if(e.detail==='pattern'&&app.forge){app.forge.state.type='pattern';app.forge.render();requestSave();}});

document.addEventListener('sekret-guide',()=>openOnboarding(navigate));
