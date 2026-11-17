import {networkInterfaces} from 'node:os';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, relative, sep, basename } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
const projectRoot=fileURLToPath(new URL('../',import.meta.url));
const lan=process.argv.includes('--lan');
const root=resolve(projectRoot,process.argv.slice(2).find(a=>!a.startsWith('--'))||'.');
const lanAddresses=Object.values(networkInterfaces()).flat().filter(a=>a&&a.family==='IPv4'&&!a.internal&&(/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)/).test(a.address)).map(a=>a.address);
if(lan&&!lanAddresses.length){console.error('No private LAN IPv4 address found. Connect this PC to Wi-Fi and retry.');process.exit(1);}
const host=lan?lanAddresses[0]:'127.0.0.1';
try { await stat(resolve(root,'index.html')); } catch { console.error('SEKRET: build not found. Run npm run build, then npm run preview.'); process.exit(1); }
const types={'.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.html':'text/html','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.json':'application/json','.woff2':'font/woff2'};
const requestedPort=Number(process.env.PORT)||5173;
let port=Number.isInteger(requestedPort)&&requestedPort>0&&requestedPort<65536&&requestedPort!==5174?requestedPort:5173;
let portAttempts=0;
const ffmpegPresent=spawnSync('ffmpeg',['-version'],{stdio:'ignore',timeout:3000}).status===0;
const MAX_BYTES=256*1024*1024;
async function convertMp4(req,res){
 const origin=req.headers.origin;const allowed=new Set([`http://localhost:${port}`,`http://127.0.0.1:${port}`,`http://${host}:${port}`]);
 if(origin&&!allowed.has(origin)){res.writeHead(403);res.end('Request origin is not local');return;}
 if(!ffmpegPresent){res.writeHead(503);res.end('FFmpeg is not installed on this computer. Install FFmpeg to enable local MP4 encoding, or choose WebM.');return;}
 if(Number(req.headers['content-length'])>MAX_BYTES){res.writeHead(413);res.end('Recording exceeds 256 MB limit');return;}
 const ff=spawn('ffmpeg',['-hide_banner','-loglevel','error','-nostdin','-i','pipe:0','-map','0:v:0','-map','0:a:0?','-vf','pad=ceil(iw/2)*2:ceil(ih/2)*2','-c:v','libx264','-preset','veryfast','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','frag_keyframe+empty_moov','-f','mp4','pipe:1'],{stdio:['pipe','pipe','pipe']});
 let bytes=0,outBytes=0,error='',chunks=[],inputFailed=false;
 req.on('data',chunk=>{bytes+=chunk.length;if(!inputFailed&&bytes>MAX_BYTES){inputFailed=true;req.unpipe(ff.stdin);ff.kill('SIGKILL');res.writeHead(413);res.end('Recording exceeds 256 MB limit');}});
 req.pipe(ff.stdin);ff.stdin.on('error',()=>{});
 ff.stdout.on('data',chunk=>{outBytes+=chunk.length;if(outBytes>MAX_BYTES){inputFailed=true;ff.kill('SIGKILL');}else chunks.push(chunk)});
 ff.stderr.on('data',chunk=>error=(error+chunk.toString()).slice(-1200));
 ff.on('error',err=>{if(!res.headersSent){res.writeHead(500);res.end('Local FFmpeg failed: '+err.message)}});
 ff.on('close',code=>{if(res.writableEnded||inputFailed)return;if(code===0&&chunks.length){const body=Buffer.concat(chunks);res.writeHead(200,{'Content-Type':'video/mp4','Content-Length':body.length,'Cache-Control':'no-store'});res.end(body);}else{res.writeHead(422,{'Content-Type':'text/plain'});res.end('Local MP4 conversion failed: '+error)}});
}
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(path==='/api/encoder'&&req.method==='GET'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({localMp4:ffmpegPresent,maxInputBytes:MAX_BYTES}));return;}
  if(path==='/api/convert-mp4'&&req.method==='POST'){await convertMp4(req,res);return;}
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end('Method not allowed');return;}
  const logical=path==='/'?'/index.html':path;
  const candidate=logical.startsWith('/assets/')?resolve(root,basename(root)==='dist'?'assets':'public/assets',logical.slice('/assets/'.length)):resolve(root,'.'+logical);
  const rel=relative(root,candidate);
  if(rel.startsWith('..'+sep)||rel==='..'||candidate===root){res.writeHead(403);res.end('Forbidden');return;}
  const info=await stat(candidate);if(!info.isFile())throw Error('Not a file');
  res.writeHead(200,{'Content-Type':types[extname(candidate)]||'application/octet-stream','Cache-Control':'no-cache'});
  if(req.method==='HEAD')res.end();else res.end(await readFile(candidate));
 }catch{if(!res.headersSent){res.writeHead(404);res.end('Not found')}}
});
server.on('error',error=>{
 if(error.code==='EADDRINUSE'&&portAttempts++<10){
  console.log(`Port ${port} is busy; selecting another port. Existing applications stay running.`);
  port=port>=65535?5175:port+1;if(port===5174)port=5175;
  server.listen(port,host);return;
 }
 console.error(`SEKRET could not start: ${error.code==='EADDRINUSE'?'No free port found. Close an unused preview and retry.':error.message}`);process.exitCode=1;
});
server.on('listening',()=>console.log(`SEKRET LAB v4 running at http://${host}:${port} (${root}) · local MP4 encoder: ${ffmpegPresent?'FFmpeg ready':'unavailable; browser-native MP4 may still work'}`));
server.listen(port,host);

if(lan)console.log('PHONE DEMO: same Wi-Fi required. Allow Node.js on PRIVATE networks if Windows asks. No router forwarding required. LAN IP choices: '+lanAddresses.join(', '));
