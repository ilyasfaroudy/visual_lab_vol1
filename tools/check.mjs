import { readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory()){if(!p.includes('legacy'))await walk(p)}else if(p.endsWith('.js')){execFileSync(process.execPath,['--check',p]);console.log('OK',p)}}}
await walk('src');await walk('tools');
