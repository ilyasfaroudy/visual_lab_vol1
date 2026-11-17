import './generate-webfx.mjs';
import { cp, mkdir, rm, stat } from 'node:fs/promises';
const out='dist';
await rm(out,{recursive:true,force:true}); await mkdir(out,{recursive:true});
await cp('index.html',out+'/index.html');
await cp('src',out+'/src',{recursive:true,filter:p=>!/[\\/]legacy(?:[\\/]|$)/.test(p)});
await cp('public/assets',out+'/assets',{recursive:true});
console.log('Build complete: dist/ — zero-dependency browser ES modules; serve with npm run preview.');
