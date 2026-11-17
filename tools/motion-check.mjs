import assert from 'node:assert/strict';import {MotionState,motionSettings,MOTION_MODES} from '../src/audio/MotionState.js';
for(const mode of MOTION_MODES.filter(m=>m!=='pulse')){
 const config=motionSettings({mode}),run=fps=>{const engine=new MotionState();for(let i=0;i<fps*8;i++){const t=i/fps;engine.step(1/fps,[t<1?.8:0,0,0,0,t<1?.5:0,t<.1?1:0,0,0],config);}return engine;},a=run(30),b=run(120);
 for(const key of ['phase','x','y','vx','vy','morph'])assert.ok(Math.abs(a.state[key]-b.state[key])<1e-6,mode+' FPS independence '+key);
 assert.ok(a.state.phase>4,mode+' continues during silence');assert.ok(Math.hypot(a.state.x,a.state.y)<=config.bounds+1e-7,mode+' bounds');
 const before=a.serialize();a.step(.1,[1,1,1,1,1,1,1,1],{...config,running:false});assert.deepEqual(a.serialize(),before,mode+' pause');const restored=new MotionState(before);assert.deepEqual(restored.serialize(),before,mode+' save/restore');
 const extreme=new MotionState();for(let i=0;i<12000;i++)extreme.step(1/120,[1,1,1,1,1,i%60<20?1:0,1,1],motionSettings({mode,force:3,damping:.1,accumulation:1}));assert.ok(Math.hypot(extreme.state.x,extreme.state.y)<=.300001,mode+' sustained force bounded');
 console.log('PASS '+mode+': 30/120 FPS, inertia, bounds, pause and state restore');
}
