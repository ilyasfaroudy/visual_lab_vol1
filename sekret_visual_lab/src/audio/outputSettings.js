// Display CSS size, interactive rendering and exported pixel dimensions are independent.
export const OUTPUT_SIZES=[540,720,1080,1440,2160];
export function outputDimensions(size,ratio=[16,9],custom=[1920,1080]){
 const h=size==='custom'?Number(custom[1]):Number(size),w=size==='custom'?Number(custom[0]):Math.round(h*ratio[0]/ratio[1]);
 if(!Number.isFinite(w)||!Number.isFinite(h)||w<64||h<64||w>4096||h>4096)throw Error('Choose dimensions from 64 to 4096 pixels.');
 return [Math.round(w/2)*2,Math.round(h/2)*2];
}
export function validateDimensions(gpu,size){const gl=gpu?.gl;if(gl){const limit=Math.min(4096,gl.getParameter(gl.MAX_TEXTURE_SIZE),gl.getParameter(gl.MAX_RENDERBUFFER_SIZE));if(size.some(n=>n>limit))throw Error('GPU supports a maximum of '+limit+' pixels per side.');}return size;}
export function videoBitrate(width,height,fps){return Math.round(Math.max(8e6,Math.min(64e6,width*height*fps*.22)));}
