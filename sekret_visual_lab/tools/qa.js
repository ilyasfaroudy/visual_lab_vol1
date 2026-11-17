import {AudioGPU} from '../src/audio/gpuEngine.js';
import {SCENES,PALETTES,LOOKS,applyLook} from '../src/audio/scenes.js';
import {demoSignals,AudioSource} from '../src/audio/audioSource.js';
import {imagePresets,processEffect} from '../src/image/effects.js';
import {encodeProject,decodeProject} from '../src/project/project.js';
import {supportedVideoMime} from '../src/audio/videoExport.js';
import {download} from '../src/app/utils.js';
const report=document.querySelector('#report'),gallery=document.querySelector('#gallery');let results=[];let thumbnails={};
const log=s=>{results.push(s);report.textContent=results.join('\n')};
const pause=()=>new Promise(r=>requestAnimationFrame(r));
const dataURL=c=>c.toDataURL('image/png');
const figure=(name,url)=>{const f=document.createElement('figure');const img=new Image();img.src=url;const cap=document.createElement('figcaption');cap.textContent=name;f.append(img,cap);gallery.append(f)};
document.querySelector('#thumbnails').onclick=()=>download(new Blob([JSON.stringify(thumbnails)],{type:'application/json'}),'sekret-scene-thumbnails.json');
document.querySelector('#download').onclick=()=>download(new Blob([results.join('\n')],{type:'text/plain'}),'SEKRET-QA.txt');
document.querySelector('#run').onclick=async()=>{
 results=[];gallery.innerHTML='';log('Browser: '+navigator.userAgent);const c=document.createElement('canvas');let gpu;
 try{gpu=new AudioGPU(c);const ext=gpu.gl.getExtension('WEBGL_debug_renderer_info');log('Renderer: '+(ext?gpu.gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gpu.gl.getParameter(gpu.gl.RENDERER)));
 const tex=document.createElement('canvas');tex.width=1024;tex.height=512;const tg=tex.getContext('2d');tg.fillStyle='white';tg.font='900 130px Arial';tg.textAlign='center';tg.fillText('SEKRET',512,290);
 let variants=0;const pixels=new Uint8Array(256*144*4);
 for(let i=0;i<SCENES.length;i++){
  const scene=SCENES[i];let maximum=0;gpu.resetFeedback();gpu.setMedia(i===6?tex:null);
  for(let v=0;v<LOOKS[scene.id].length;v++){
   const settings=applyLook(scene.id,v),params=scene.params.map(p=>settings[p.id].value);
   gpu.render({sceneIndex:i,variant:v,params,signals:[.3,.2,.3,.2,.4,.5,.5,.2],colors:PALETTES[1].stops,colorControls:{},time:8,gradientStyle:i===7?v:0,width:256,height:144});
   const error=gpu.gl.getError();if(error)throw Error(scene.name+' GL error '+error);
   gpu.gl.readPixels(0,0,256,144,gpu.gl.RGBA,gpu.gl.UNSIGNED_BYTE,pixels);let sum=0;for(let k=0;k<pixels.length;k+=4)sum+=pixels[k]+pixels[k+1]+pixels[k+2];const avg=sum/(256*144*3);if(avg<.1)throw Error(scene.name+' blank output');maximum=Math.max(maximum,avg);
   if(v===0){const image=dataURL(c);figure(scene.name,image);thumbnails[scene.id]=image;}variants++;
  }
  log('PASS '+scene.name+' / '+LOOKS[scene.id].length+' looks / luminance '+maximum.toFixed(1));await pause();
 }
 gpu.render({sceneIndex:9,directorScene:8,directorBlend:.4,compose:[.4,1,0,0],params:[12,.5,1,1,1,.5,1,.5],signals:[.2,.2,.2,.2,.2,.2,.2,.2],colors:PALETTES[1].stops,colorControls:{},time:6,width:256,height:144});if(gpu.gl.getError())throw Error('Composition failed');log('PASS two-system Screen composition');
 log('PASS '+variants+' shader variants');
 for(const type of ['image/png','image/jpeg','image/webp']){const b=await new Promise(r=>c.toBlob(r,type,.92));if(!b||b.type!==type)throw Error(type+' unavailable');const bitmap=await createImageBitmap(b);if(bitmap.width!==256||bitmap.height!==144)throw Error('Wrong image dimensions');bitmap.close();log('PASS '+type+' encode/decode '+b.size+' bytes');}
 const photo=document.createElement('canvas');photo.width=128;photo.height=96;const pg=photo.getContext('2d');const gradient=pg.createLinearGradient(0,0,128,96);gradient.addColorStop(0,'#f0ddc3');gradient.addColorStop(.5,'#ac234e');gradient.addColorStop(1,'#081c35');pg.fillStyle=gradient;pg.fillRect(0,0,128,96);pg.fillStyle='white';pg.font='bold 80px Arial';pg.fillText('S',30,78);const input=pg.getImageData(0,0,128,96);
 for(const preset of imagePresets){const output=processEffect(input,preset);if(output.width!==128||output.data.some((x,k)=>k%4===3&&x!==255))throw Error(preset.name+' alpha/dimension mismatch');if(preset.mode>=32){pg.putImageData(output,0,0);figure(preset.name,dataURL(photo));}}
 log('PASS '+imagePresets.length+' photo systems / alpha and dimensions');
 const p={schemaVersion:2,lab:'audio',name:'QA / Проверка',audio:{sceneId:'signal-lines',variants:{'signal-lines':2},compose:{enabled:true,scene:'liquid-glass',blend:1,mix:.35},recordFPS:60},image:{}};
 if(JSON.stringify(decodeProject(encodeProject(p)))!==JSON.stringify(p))throw Error('Code roundtrip');log('PASS project code / new fields + Unicode');
 log('COMPLETE — GPU, photo, image codecs and project checks passed.');
 }catch(e){log('FAIL '+e.stack)}finally{gpu?.dispose()}
};
document.querySelector('#codecs').onclick=async()=>{
 const context=new AudioContext();await context.resume();const osc=context.createOscillator(),gain=context.createGain(),destination=context.createMediaStreamDestination();gain.gain.value=.1;osc.frequency.value=220;osc.connect(gain);gain.connect(destination);osc.start();
 const c=document.createElement('canvas');c.width=320;c.height=180;const g=c.getContext('2d');let frame=0,raf;const draw=()=>{g.fillStyle='#100910';g.fillRect(0,0,320,180);g.fillStyle='#da7996';g.fillRect((frame++*3)%320,30,60,120);raf=requestAnimationFrame(draw)};draw();
 try{for(const format of ['webm','mp4']){
  const mime=supportedVideoMime(format,true);if(!mime){log('UNSUPPORTED '+format+' with audio');continue;}
  for(let run=1;run<=2;run++){
   const video=c.captureStream(30),audio=destination.stream.getAudioTracks().map(t=>t.clone()),stream=new MediaStream([...video.getTracks(),...audio]);const chunks=[];const recorder=new MediaRecorder(stream,{mimeType:mime});
   const blob=await new Promise((resolve,reject)=>{recorder.ondataavailable=e=>chunks.push(e.data);recorder.onerror=e=>reject(e.error);recorder.onstop=()=>resolve(new Blob(chunks,{type:mime.split(';')[0]}));recorder.start(100);setTimeout(()=>recorder.stop(),1200)});
   stream.getTracks().forEach(t=>t.stop());const bytes=new Uint8Array(await blob.arrayBuffer());const signature=String.fromCharCode(...bytes.slice(4,8));if(format==='mp4'&&signature!=='ftyp')throw Error('MP4 signature missing');if(format==='webm'&&(bytes[0]!==26||bytes[1]!==69))throw Error('EBML signature missing');
   const decoded=new TextDecoder('latin1').decode(bytes);if(format==='mp4'&&(!decoded.includes('soun')||!decoded.includes('vide')))throw Error('Missing audio/video tracks');
   const v=document.createElement('video');v.muted=true;const url=URL.createObjectURL(blob);v.src=url;await new Promise((r,j)=>{v.onloadedmetadata=r;v.onerror=()=>j(Error('Recorded video does not decode'));});if(v.videoWidth!==320)throw Error('Video dimensions mismatch');URL.revokeObjectURL(url);
   if(destination.stream.getAudioTracks()[0].readyState!=='live')throw Error('Original audio track ended');log('PASS '+format.toUpperCase()+' + AUDIO recording #'+run+' / '+blob.size+' bytes / 320×180 / source track live');
  }
 }}catch(e){log('FAIL recording '+e.message)}finally{cancelAnimationFrame(raf);osc.stop();await context.close();log('Recording checks complete.');}
};
