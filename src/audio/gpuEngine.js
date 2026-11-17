import {buildParticleCloud,PARTICLE_VERTEX,PARTICLE_FRAGMENT} from './particleCloud.js';
import {VERTEX,FRAGMENT,BLIT,sceneFragment} from './shaders.js';
import {MESH_VERTEX,MESH_FRAGMENT,buildMesh} from './geometry.js';
import {clamp} from '../app/utils.js';
function compile(gl,kind,source){const shader=gl.createShader(kind);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw Error('WebGL shader compilation: '+error)}return shader;}
function program(gl,vertex,fragment){const p=gl.createProgram(),v=compile(gl,gl.VERTEX_SHADER,vertex),f=compile(gl,gl.FRAGMENT_SHADER,fragment);gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);gl.deleteShader(v);gl.deleteShader(f);if(!gl.getProgramParameter(p,gl.LINK_STATUS)){const e=gl.getProgramInfoLog(p);gl.deleteProgram(p);throw Error('WebGL program linking: '+e)}return p;}
function texture(gl){const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([7,7,9,255]));return t;}
const rgbaHex=s=>{const v=s.replace('#','');return [parseInt(v.slice(0,2),16)/255,parseInt(v.slice(2,4),16)/255,parseInt(v.slice(4,6),16)/255];};
export class AudioGPU {
 constructor(canvas){this.canvas=canvas;this.gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,preserveDrawingBuffer:false,powerPreference:'high-performance'});
 if(!this.gl)throw Error('WebGL is unavailable in this browser');
 const gl=this.gl;gl.getExtension("OES_standard_derivatives");this.programCache=new Map();this.renderProgram=program(gl,VERTEX,sceneFragment(0));this.programCache.set("0:0",this.renderProgram);this.programKey="0:0";this.colorBuffer=new Float32Array(9);this.controlBuffer=new Float32Array(4);this.finishBuffer=new Float32Array(4);this.blitProgram=program(gl,VERTEX,BLIT);this.copyProgram=program(gl,VERTEX,'precision highp float;varying vec2 v_uv;uniform sampler2D u_texture;void main(){gl_FragColor=texture2D(u_texture,v_uv);}');this.copyUniform=gl.getUniformLocation(this.copyProgram,'u_texture');
 this.quad=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.quad);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
 this.particleTexture=texture(gl);this.particleFbo=gl.createFramebuffer();this.particleProgram=null;this.mediaTexture=texture(gl);this.geometryTexture=texture(gl);this.geometryFbo=gl.createFramebuffer();this.geometryDepth=gl.createRenderbuffer();this.meshProgram=null;
 this.waveTexture=gl.createTexture();this.spectrumTexture=gl.createTexture();
 for(const [tex,w] of [[this.waveTexture,256],[this.spectrumTexture,128]]){
   gl.bindTexture(gl.TEXTURE_2D,tex);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.LUMINANCE,w,1,0,gl.LUMINANCE,gl.UNSIGNED_BYTE,new Uint8Array(w).fill(tex===this.waveTexture?128:0));
 }
 this.spectralHistory=texture(gl);this.spectralRows=new Uint8Array(128*96);this.spectralHead=0;this.spectralTime=-Infinity;
 gl.bindTexture(gl.TEXTURE_2D,this.spectralHistory);gl.texImage2D(gl.TEXTURE_2D,0,gl.LUMINANCE,128,96,0,gl.LUMINANCE,gl.UNSIGNED_BYTE,this.spectralRows);
 this.history=[texture(gl),texture(gl)];this.fbos=[gl.createFramebuffer(),gl.createFramebuffer()];this.index=0;this.historyValid=false;this.media=null;this.lastMediaFrame=-1;this.mediaWidth=0;this.mediaHeight=0;this.lost=false;
 this.onLoss=e=>{e.preventDefault();this.lost=true};this.onRestore=()=>{this.lost=true;this.restored=true};
 canvas.addEventListener('webglcontextlost',this.onLoss);canvas.addEventListener('webglcontextrestored',this.onRestore);
 this.uniforms={};for(const [key,shader] of [['render',this.renderProgram],['blit',this.blitProgram]]){this.uniforms[key]={};for(const name of (key==='render'?['u_resolution','u_time','u_scene','u_directorScene','u_directorBlend','u_p[0]','u_sig[0]','u_colors[0]','u_colorControls','u_media','u_history','u_hasMedia','u_hasHistory','u_gradientStyle','u_pointer','u_mediaMaskParams','u_waveform','u_spectrum','u_spectralHistory','u_spectralHead','u_hasAudio','u_variant','u_dt','u_finish','u_compose','u_dna','u_geometry','u_particles','u_camera','u_pan','u_interaction','u_stroke','u_evolution','u_fluidShape','u_fluidMaterial']:['u_texture','u_colorControls','u_finish','u_resolution','u_view'])){this.uniforms[key][name]=gl.getUniformLocation(shader,name)}}
 }
 bind(program){const gl=this.gl;gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,this.quad);const pos=gl.getAttribLocation(program,'a_position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);}
 setMedia(source){this.media=source;this.lastMediaFrame=-1;if(!source)return;this.uploadSource(source);}
 uploadSource(source){if(!source||this.lost)return;const gl=this.gl;const width=source.videoWidth||source.naturalWidth||source.width||0;if(!width)return;
 try{const height=source.videoHeight||source.naturalHeight||source.height||0;const frame=source.tagName==='VIDEO'?source.currentTime:-1;if(source.tagName==='VIDEO'&&frame===this.lastMediaFrame)return;gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.mediaTexture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);if(this.mediaWidth===width&&this.mediaHeight===height)gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,gl.RGBA,gl.UNSIGNED_BYTE,source);else{gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);this.mediaWidth=width;this.mediaHeight=height;}this.lastMediaFrame=frame;gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false)}catch(e){console.warn('Media texture upload failed:',e.message)} }
 resize(width,height){const gl=this.gl;const w=clamp(Math.floor(width),1,4096),h=clamp(Math.floor(height),1,4096);if(this.canvas.width===w&&this.canvas.height===h)return;const previous=this.history,hadHistory=this.historyValid;gl.activeTexture(gl.TEXTURE0);this.history=[texture(gl),texture(gl)];this.canvas.width=w;this.canvas.height=h;
 for(let i=0;i<2;i++){gl.bindTexture(gl.TEXTURE_2D,this.history[i]);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);gl.bindFramebuffer(gl.FRAMEBUFFER,this.fbos[i]);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,this.history[i],0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)console.warn('Framebuffer unavailable');}
 gl.bindTexture(gl.TEXTURE_2D,this.particleTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
 gl.bindFramebuffer(gl.FRAMEBUFFER,this.particleFbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,this.particleTexture,0);
 gl.bindTexture(gl.TEXTURE_2D,this.geometryTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
 gl.bindFramebuffer(gl.FRAMEBUFFER,this.geometryFbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,this.geometryTexture,0);
 gl.bindRenderbuffer(gl.RENDERBUFFER,this.geometryDepth);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,w,h);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,this.geometryDepth);
 if(hadHistory){gl.bindFramebuffer(gl.FRAMEBUFFER,this.fbos[0]);gl.viewport(0,0,w,h);this.bind(this.copyProgram);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,previous[this.index]);gl.uniform1i(this.copyUniform,0);gl.drawArrays(gl.TRIANGLES,0,6);}previous.forEach(t=>gl.deleteTexture(t));gl.bindFramebuffer(gl.FRAMEBUFFER,null);this.historyValid=hadHistory;this.index=0;
 }
 renderParticles(params,signals,colors,time,variant,pointer,dna,camera,interaction,stroke,evolution){const gl=this.gl;
 if(!this.particleProgram){this.particleProgram=program(gl,PARTICLE_VERTEX,PARTICLE_FRAGMENT);const mesh=buildParticleCloud();this.particleBuffers={};for(const key of ['lines','points']){const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,mesh[key],gl.STATIC_DRAW);this.particleBuffers[key]={buffer,count:mesh[key].length/5};}this.particleUniforms={};for(const name of ['u_time','u_variant','u_resolution','u_pointer','u_points','u_p[0]','u_sig[0]','u_colors[0]','u_media','u_dna','u_camera','u_pan','u_interaction','u_stroke','u_evolution','u_fluidShape','u_fluidMaterial'])this.particleUniforms[name]=gl.getUniformLocation(this.particleProgram,name);}
 const topology=variant>10.5?0:Math.max(0,Math.min(3,Math.floor(variant)));
 if(this.particleTopology!==topology){Object.values(this.particleBuffers).forEach(x=>gl.deleteBuffer(x.buffer));const mesh=buildParticleCloud(9000,topology);for(const key of ['lines','points']){const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,mesh[key],gl.STATIC_DRAW);this.particleBuffers[key]={buffer,count:mesh[key].length/5};}this.particleTopology=topology;}
 gl.bindFramebuffer(gl.FRAMEBUFFER,this.particleFbo);gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(this.particleProgram);gl.disable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
 const u=this.particleUniforms;gl.uniform4fv(u.u_evolution,evolution);gl.uniform3fv(u.u_camera,camera.slice(0,3));gl.uniform2f(u.u_pan,camera[3]||0,camera[4]||0);gl.uniform4fv(u.u_interaction,interaction);gl.uniform2fv(u.u_stroke,stroke);gl.uniform1f(u.u_time,time);gl.uniform1f(u.u_variant,variant);gl.uniform2f(u.u_resolution,this.canvas.width,this.canvas.height);gl.uniform2f(u.u_pointer,...pointer);gl.uniform1fv(u['u_p[0]'],params);gl.uniform1fv(u['u_sig[0]'],signals);colors.forEach((c,i)=>this.colorBuffer.set(rgbaHex(c),i*3));gl.uniform3fv(u['u_colors[0]'],this.colorBuffer);
 gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.mediaTexture);gl.uniform1i(u.u_media,0);gl.uniform4fv(u.u_dna,dna);
 const pos=gl.getAttribLocation(this.particleProgram,'a_position'),data=gl.getAttribLocation(this.particleProgram,'a_data');gl.enableVertexAttribArray(pos);gl.enableVertexAttribArray(data);
 for(const key of (variant>10.5?['points']:['lines','points'])){gl.bindBuffer(gl.ARRAY_BUFFER,this.particleBuffers[key].buffer);gl.vertexAttribPointer(pos,3,gl.FLOAT,false,20,0);gl.vertexAttribPointer(data,2,gl.FLOAT,false,20,12);gl.uniform1f(u.u_points,key==='points'?1:0);gl.drawArrays(key==='points'?gl.POINTS:gl.LINES,0,this.particleBuffers[key].count);}
 gl.disableVertexAttribArray(data);gl.disable(gl.BLEND);
 }
 renderGeometry(params,signals,colors,time,variant,dna,hasAudio=false,camera=[0,0,1],interaction=[.5,.5,0,0],stroke=[0,0],evolution=[0,0,0,0]){const gl=this.gl;
 if(!this.meshProgram){this.meshProgram=program(gl,MESH_VERTEX,MESH_FRAGMENT);const mesh=buildMesh();this.meshBuffers={};for(const key of ['lines','faces']){const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,mesh[key],gl.STATIC_DRAW);this.meshBuffers[key]={buffer,count:mesh[key].length/3};}this.meshUniforms={};for(const name of ['u_time','u_variant','u_aspect','u_wire','u_p[0]','u_sig[0]','u_colors[0]','u_media','u_dna','u_spectralHistory','u_spectralHead','u_hasAudio','u_camera','u_pan','u_interaction','u_stroke','u_evolution','u_fluidShape','u_fluidMaterial'])this.meshUniforms[name]=gl.getUniformLocation(this.meshProgram,name);}
 gl.bindFramebuffer(gl.FRAMEBUFFER,this.geometryFbo);gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.useProgram(this.meshProgram);const u=this.meshUniforms;gl.uniform4fv(u.u_evolution,evolution);gl.uniform3fv(u.u_camera,camera.slice(0,3));gl.uniform2f(u.u_pan,camera[3]||0,camera[4]||0);gl.uniform4fv(u.u_interaction,interaction);gl.uniform2fv(u.u_stroke,stroke);
 gl.uniform1f(u.u_time,time);gl.uniform1f(u.u_variant,variant);gl.uniform1f(u.u_aspect,this.canvas.width/this.canvas.height);gl.uniform1fv(u['u_p[0]'],params);gl.uniform1fv(u['u_sig[0]'],signals);colors.forEach((c,i)=>this.colorBuffer.set(rgbaHex(c),i*3));gl.uniform3fv(u['u_colors[0]'],this.colorBuffer);gl.uniform4fv(u.u_dna,dna);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.mediaTexture);gl.uniform1i(u.u_media,0);
 gl.activeTexture(gl.TEXTURE5);gl.bindTexture(gl.TEXTURE_2D,this.spectralHistory);gl.uniform1i(u.u_spectralHistory,5);gl.uniform1f(u.u_spectralHead,(this.spectralHead+.5)/96);gl.uniform1f(u.u_hasAudio,hasAudio?1:0);
 const attr=gl.getAttribLocation(this.meshProgram,'a_grid');gl.enableVertexAttribArray(attr);
 for(const key of ['faces','lines']){const wire=key==='lines';gl.uniform1f(u.u_wire,wire?1:0);gl.bindBuffer(gl.ARRAY_BUFFER,this.meshBuffers[key].buffer);gl.vertexAttribPointer(attr,3,gl.FLOAT,false,0,0);if(wire){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.depthMask(false);}else{gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(1,1);}gl.drawArrays(wire?gl.LINES:gl.TRIANGLES,0,this.meshBuffers[key].count);gl.disable(gl.POLYGON_OFFSET_FILL);}
 gl.depthMask(true);gl.disable(gl.BLEND);gl.disable(gl.DEPTH_TEST);
 }
 selectProgram(scene,secondary){const key=scene+':'+secondary;if(key===this.programKey)return;const gl=this.gl;
 let selected=this.programCache.get(key);if(!selected){selected=program(gl,VERTEX,sceneFragment(scene,secondary));this.programCache.set(key,selected);}
 this.renderProgram=selected;this.programKey=key;for(const name of Object.keys(this.uniforms.render))this.uniforms.render[name]=gl.getUniformLocation(selected,name);
 if(this.programCache.size>5){const oldest=[...this.programCache.keys()].find(k=>k!==key);gl.deleteProgram(this.programCache.get(oldest));this.programCache.delete(oldest);}
 }
 resetSpectrum(){this.spectralTime=-Infinity;this.spectralHead=0;}
 resetFeedback(){this.historyValid=false;}
 render({fluid=[1,1,1,1,1,.8,1,1],evolution=[0,0,0,0],interaction=[.5,.5,0,0],stroke=[0,0],camera=[0,0,1],sceneIndex,params,signals,colors,colorControls,time,variant=0,dt=1/60,compose=[0,0,0,0],dna=[0,0,0,0],gradientStyle=0,pointer=[.5,.5],mediaMask=[0,.5,.15,0],directorScene=null,directorBlend=0,waveform=null,spectrum=null,width=960,height=540}){
 if(this.lost)return;const gl=this.gl;
 this.selectProgram(sceneIndex,directorBlend>.001?(directorScene??sceneIndex):sceneIndex);this.resize(width,height);
 if(this.media?.tagName==='VIDEO')this.uploadSource(this.media);
 if(spectrum?.length===128&&(time-this.spectralTime>=.04||time<this.spectralTime)){
  gl.activeTexture(gl.TEXTURE5);gl.bindTexture(gl.TEXTURE_2D,this.spectralHistory);
  if(time<this.spectralTime||time-this.spectralTime>1){this.spectralRows.fill(0);gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,128,96,gl.LUMINANCE,gl.UNSIGNED_BYTE,this.spectralRows);}
  this.spectralHead=(this.spectralHead+1)%96;gl.texSubImage2D(gl.TEXTURE_2D,0,0,this.spectralHead,128,1,gl.LUMINANCE,gl.UNSIGNED_BYTE,spectrum);this.spectralTime=time;
 }
 if(sceneIndex===0||(sceneIndex===6&&variant>10.5&&variant<19.5)||(directorBlend>.001&&directorScene===0))this.renderParticles(params,signals,colors,time,variant,pointer,dna,camera,interaction,stroke,evolution);
 if(sceneIndex===4||(directorBlend>.001&&directorScene===4))this.renderGeometry(params,signals,colors,time,variant,dna,!!spectrum,camera,interaction,stroke,evolution);
 const useHistory=this.historyValid && (sceneIndex===2 || params[7]>.04);
 const write=1-this.index;
 gl.bindFramebuffer(gl.FRAMEBUFFER,this.fbos[write]);gl.viewport(0,0,this.canvas.width,this.canvas.height);this.bind(this.renderProgram);
 const u=this.uniforms.render;gl.uniform4fv(u.u_fluidShape,fluid.slice(0,4));gl.uniform4fv(u.u_fluidMaterial,fluid.slice(4,8));gl.uniform4fv(u.u_evolution,evolution);gl.uniform3fv(u.u_camera,camera.slice(0,3));gl.uniform2f(u.u_pan,camera[3]||0,camera[4]||0);gl.uniform4fv(u.u_interaction,interaction);gl.uniform2fv(u.u_stroke,stroke);
 gl.uniform2f(u.u_resolution,this.canvas.width,this.canvas.height);
 gl.uniform1f(u.u_time,time);gl.uniform1f(u.u_scene,sceneIndex);gl.uniform1f(u.u_directorScene,directorScene??sceneIndex);gl.uniform1f(u.u_directorBlend,directorBlend);gl.uniform1fv(u['u_p[0]'],params);gl.uniform1fv(u['u_sig[0]'],signals);
 colors.forEach((c,i)=>this.colorBuffer.set(rgbaHex(c),i*3));gl.uniform3fv(u['u_colors[0]'],this.colorBuffer);gl.uniform1f(u.u_variant,variant);gl.uniform1f(u.u_dt,dt);this.finishBuffer.set([colorControls.exposure||0,colorControls.gamma||1,colorControls.midpoint??.5,colorControls.interpolation==='linear'?0:1]);gl.uniform4fv(u.u_finish,this.finishBuffer);gl.uniform4fv(u.u_compose,compose);gl.uniform4fv(u.u_dna,dna);
 gl.uniform4fv(u.u_colorControls,(this.controlBuffer.set([colorControls.hue||0,(colorControls.saturation??100)/100,(colorControls.brightness??100)/100,(colorControls.contrast??100)/100]),this.controlBuffer));
 gl.uniform1f(u.u_hasMedia,this.media?1:0);gl.uniform1f(u.u_hasHistory,useHistory?1:0);gl.uniform1f(u.u_gradientStyle,gradientStyle);gl.uniform2f(u.u_pointer,...pointer);gl.uniform4fv(u.u_mediaMaskParams,mediaMask);
 gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.mediaTexture);gl.uniform1i(u.u_media,0);
 gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.history[this.index]);gl.uniform1i(u.u_history,1);
 gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,this.waveTexture);
 if(waveform?.length===256)gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,256,1,gl.LUMINANCE,gl.UNSIGNED_BYTE,waveform);
 gl.uniform1i(u.u_waveform,2);
 gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,this.spectrumTexture);
 if(spectrum?.length===128)gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,128,1,gl.LUMINANCE,gl.UNSIGNED_BYTE,spectrum);
 gl.uniform1i(u.u_spectrum,3);gl.uniform1f(u.u_hasAudio,waveform?.length===256?1:0);
 gl.activeTexture(gl.TEXTURE4);gl.bindTexture(gl.TEXTURE_2D,this.geometryTexture);gl.uniform1i(u.u_geometry,4);
 gl.activeTexture(gl.TEXTURE5);gl.bindTexture(gl.TEXTURE_2D,this.spectralHistory);gl.uniform1i(u.u_spectralHistory,5);gl.uniform1f(u.u_spectralHead,(this.spectralHead+.5)/96);
 gl.activeTexture(gl.TEXTURE6);gl.bindTexture(gl.TEXTURE_2D,this.particleTexture);gl.uniform1i(u.u_particles,6);
 gl.drawArrays(gl.TRIANGLES,0,6);
 gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,this.canvas.width,this.canvas.height);this.bind(this.blitProgram);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.history[write]);gl.uniform1i(this.uniforms.blit.u_texture,0);gl.uniform2f(this.uniforms.blit.u_resolution,this.canvas.width,this.canvas.height);gl.uniform3f(this.uniforms.blit.u_view,sceneIndex===2?(camera[3]||0):0,sceneIndex===2?(camera[4]||0):0,sceneIndex===2?camera[2]:1);gl.uniform4fv(this.uniforms.blit.u_colorControls,this.controlBuffer);gl.uniform4fv(this.uniforms.blit.u_finish,this.finishBuffer);gl.drawArrays(gl.TRIANGLES,0,6);
 this.index=write;this.historyValid=true;
 }
 dispose(){const gl=this.gl;if(!gl)return;this.canvas.removeEventListener('webglcontextlost',this.onLoss);this.canvas.removeEventListener('webglcontextrestored',this.onRestore);
 [this.particleTexture,this.spectralHistory,this.geometryTexture,this.mediaTexture,this.waveTexture,this.spectrumTexture,...this.history].forEach(t=>gl.deleteTexture(t));this.fbos.forEach(f=>gl.deleteFramebuffer(f));gl.deleteFramebuffer(this.particleFbo);if(this.particleProgram){gl.deleteProgram(this.particleProgram);Object.values(this.particleBuffers).forEach(x=>gl.deleteBuffer(x.buffer));}gl.deleteFramebuffer(this.geometryFbo);gl.deleteRenderbuffer(this.geometryDepth);if(this.meshProgram){gl.deleteProgram(this.meshProgram);Object.values(this.meshBuffers).forEach(x=>gl.deleteBuffer(x.buffer));}gl.deleteBuffer(this.quad);this.programCache.forEach(p=>gl.deleteProgram(p));this.programCache.clear();gl.deleteProgram(this.blitProgram);gl.deleteProgram(this.copyProgram);this.gl=null;
 }
}
