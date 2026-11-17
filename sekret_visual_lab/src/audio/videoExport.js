// Realtime recording. Native MP4 is offered ONLY when the current browser advertises
// a compatible encoder; WebM fallback remains available. No mislabeled formats.
export const VIDEO_TYPES={
 mp4:['video/mp4;codecs="avc1.42E01E,mp4a.40.2"','video/mp4;codecs="avc1.42E01E"','video/mp4'],
 webm:['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm']
};
export function supportedVideoMime(format='mp4',requireAudio=false){
 if(typeof MediaRecorder==='undefined')return null;
 const formats=(VIDEO_TYPES[format]||[]).filter(m=>format!=='mp4'||!requireAudio||m.includes('mp4a.40.2'));
 return formats.find(m=>MediaRecorder.isTypeSupported(m))||null;
}
export function videoCapabilities(){return {mp4:!!supportedVideoMime('mp4'),webm:!!supportedVideoMime('webm')};}
export async function localEncoderAvailable(){try{const response=await fetch('/api/encoder',{cache:'no-store'});if(!response.ok)return false;return (await response.json()).localMp4===true}catch{return false;}}
export async function convertWebmToMp4(blob){
 const response=await fetch('/api/convert-mp4',{method:'POST',headers:{'Content-Type':'video/webm'},body:blob});
 if(!response.ok)throw Error((await response.text()).slice(0,400));
 const result=await response.blob();if(!result.size)throw Error('Empty MP4 output');return result;
}
