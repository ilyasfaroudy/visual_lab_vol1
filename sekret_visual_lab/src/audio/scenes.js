// One family of algorithms per scene: visual systems, not recolored copies.
const param=(id,label,min,max,def,step=.01,advanced=false)=>({id,label,min,max,default:def,step,advanced});
export const SCENES=[
 {id:'particle-web',name:'PARTICLE WEB',category:'PARTICLES',desc:'Constellations, filaments and kinetic connection fields',params:[param('density','Node Density',7,35,18,1),param('motion','Motion',0,2,1),param('connections','Connections',0,2,.85),param('glow','Bloom',0,2,.75),param('spread','Spread',0,2,.7),param('complexity','Turbulence',0,2,.35),param('detail','Detail',0,2,1, .01,true),param('feedback','Persistence',0,1,.18,.01,true)]},
 {id:'ribbon-flow',name:'RIBBON FLOW',category:'PARTICLES',desc:'Spectral calligraphy, strands and long-exposure light',params:[param('density','Ribbon Count',2,44,22,1),param('motion','Flow Speed',0,2,.52),param('connections','Curvature',0,2,1.2),param('glow','Glow',0,2,1),param('spread','Amplitude',0,2,.9),param('complexity','Waves',0,2,.85),param('detail','Line Detail',0,2,1,.01,true),param('feedback','Trails',0,1,.5,.01,true)]},
 {id:'feedback-field',name:'FEEDBACK FIELD',category:'FEEDBACK',desc:'Recursive image memories, spectral erosion and ghost trails',params:[param('density','Field Scale',2,35,17),param('motion','Transport',0,2,.42),param('connections','Warp',0,2,.7),param('glow','Exposure',0,2,1),param('spread','Signal Width',0,2,.7),param('complexity','Corruption',0,2,.65),param('detail','Fragmentation',0,2,1,.01,true),param('feedback','Feedback Decay',0,.995,.94,.005)]},
 {id:'fluid-blobs',name:'FLUID BLOBS',category:'FLUID',desc:'Merging contours and audio-driven viscous masses',params:[param('density','Blob Count',2,12,7,1),param('motion','Flow Speed',0,2,.55),param('connections','Merge Radius',0,2,1),param('glow','Glow',0,2,.85),param('spread','Fluid Scale',0,2,1),param('complexity','Turbulence',0,2,.7),param('detail','Sharpness',0,2,.8,.01,true),param('feedback','Traces',0,1,.2,.01,true)]},
 {id:'geometry-field',name:'GEOMETRY FIELD',category:'GEOMETRY',desc:'Deformed spatial lattice and frequency-driven perspective',params:[param('density','Grid Density',5,36,16,1),param('motion','Motion',0,2,.42),param('connections','Deformation',0,2,.8),param('glow','Luminance',0,2,.8),param('spread','Perspective',0,2,1),param('complexity','Noise',0,2,.35),param('detail','Line Weight',0,2,.7,.01,true),param('feedback','Trails',0,1,.22,.01,true)]},
 {id:'media-reactive',name:'MEDIA REACTIVE',category:'MEDIA',desc:'Transform uploaded photos or moving footage with music',params:[param('density','Pixel Blocks',1,40,8,1),param('motion','Displacement',0,2,.8),param('connections','RGB Split',0,2,.65),param('glow','Contrast',0,2,1),param('spread','Zoom',0,2,.55),param('complexity','Signal Glitch',0,2,.45),param('detail','Sharpness',0,2,1,.01,true),param('feedback','Persistence',0,1,.15,.01,true)]},
 {id:'reactive-typography',name:'REACTIVE TYPOGRAPHY',category:'TYPE',desc:'Spatial type sculptures, infinite tunnels and full-frame kinetic compositions',params:[param('density','Type Scale',.3,2,1),param('motion','Stretch',0,2,.85),param('connections','Wave Deform',0,2,.65),param('glow','Glow',0,2,.65),param('spread','Spatial Repetition',0,2,1),param('complexity','Glitch',0,2,.45),param('detail','Distortion',0,2,.6,.01,true),param('feedback','Trails',0,1,.25,.01,true)]},
 {id:'gradient-systems',name:'GRADIENT SYSTEMS',category:'COLOR',desc:'Editorial, spectral, threshold and contour gradient fields',params:[param('density','Field Scale',1,18,5),param('motion','Flow Speed',0,2,.45),param('connections','Warp',0,2,.65),param('glow','Exposure',0,2,1),param('spread','Color Spread',0,2,1),param('complexity','Grain / Bands',0,2,.2),param('detail','Softness',0,2,.85,.01,true),param('feedback','Persistence',0,1,.1,.01,true)]},
 {id:'liquid-glass',name:'LIQUID GLASS',category:'GLASS',desc:'Refractive membranes, translucent blobs and chromatic lenses',params:[param('density','Lens Count',1,10,4,1),param('motion','Flow Speed',0,2,.4),param('connections','Refraction',0,2,1.2),param('glow','Highlights',0,2,1),param('spread','Lens Scale',0,2,1),param('complexity','Dispersion',0,2,.7),param('detail','Surface Detail',0,2,.6,.01,true),param('feedback','Trails',0,1,.1,.01,true)]},
 {id:'signal-lines',name:'SIGNAL LINES',category:'SIGNAL',desc:'Oscilloscope trajectories and harmonic interference',params:[param('density','Line Count',1,44,8,1),param('motion','Flow Speed',0,2,.6),param('connections','Harmonics',0,2,1),param('glow','Glow',0,2,.75),param('spread','Amplitude',0,2,.75),param('complexity','Distortion',0,2,.55),param('detail','Line Weight',0,2,.85,.01,true),param('feedback','Persistence',0,1,.4,.01,true)]},
 {id:'signal-corruption',name:'SIGNAL CORRUPTION',category:'FEEDBACK',desc:'High-energy fragmented digital noise and tearing',params:[param('density','Block Density',3,35,16),param('motion','Signal Speed',0,2,.85),param('connections','Tearing',0,2,1),param('glow','Contrast',0,2,1),param('spread','Spread',0,2,.7),param('complexity','Noise Field',0,2,1),param('detail','Scanlines',0,2,1,.01,true),param('feedback','Persistence',0,1,.55,.01,true)]},
 {id:'voice-sculpture',name:'VOICE SCULPTURE',category:'SIGNAL',desc:'Volumetric voice envelope: layered membranes, spectral anatomy, real waveform detail',params:[param('density','Membrane / Line Count',4,44,26,1),param('motion','Phase Motion',0,2,.67),param('connections','Wave Complexity',0,2,1.15),param('glow','Volumetric Light',0,2,1.12),param('spread','Envelope Width',0,2,.95),param('complexity','Microtexture',0,2,1.1),param('detail','Fine Filaments',0,2,1.05,.01,true),param('feedback','Motion Trails',0,1,.30,.01,true)]}
];
SCENES.push(
 {id:'spectral-bloom',name:'SPECTRAL BLOOM',category:'PARTICLES',desc:'Layered spectral filaments suspended in a rotating volume',params:SCENES[1].params.map(p=>({...p,label:p.id==='density'?'Filament Density':p.id==='spread'?'Bloom Radius':p.label,default:p.id==='density'?32:p.id==='feedback'?.12:p.default}))},
 {id:'phase-torus',name:'PHASE TORUS',category:'GEOMETRY',desc:'Sculpted chrome topology with spectral grooves and orbit control',params:SCENES[4].params.map(p=>({...p,label:p.id==='density'?'Surface Grooves':p.id==='connections'?'Surface Tension':p.label,default:p.id==='density'?22:p.id==='feedback'?.06:p.default}))}
);
SCENES.push({id:'material-resonance',name:'MATERIAL RESONANCE',category:'GEOMETRY',desc:'Standing-wave sculpture: folded silver, nodal engraving and resonant light',params:SCENES[4].params.map(p=>({...p,label:({density:'Contour Density',connections:'Resonance Depth',spread:'Object Scale',detail:'Surface Engraving'})[p.id]||p.label,default:p.id==='density'?22:p.id==='feedback'?.06:p.default}))});

SCENES.push(...[
 ['city-signal','CITY SIGNAL','CARTOGRAPHY','Imported street structures, travelling signals and layered urban relief',['Street Detail','Flow Speed','Extrusion Height','Light','Pulse Spread','Dissolve','Fine Lights'],[70,.5,1,1,.8,.4,.7]],
 ['tech-radar','TECH RADAR','SIGNAL','Radial event clusters, spectral lanes and waveform monitoring',['Event Count','Scan Speed','Orbit Response','Luminance','Wave Amplitude','Drift','Marker Size'],[72,.5,.8,1,1,.5,.7]],
 ['neural-core','NEURAL CORE','GEOMETRY','Bilateral cortical sculpture with sulci, transmission and travelling activation',['Neural Density','Auto Rotation','Deformation','Studio Light','Pulse Spread','Pathway Glow','Cortical Detail'],[40,.45,.7,1,.8,1,1]],
 ['ascii-motion','ASCII MOTION','TYPE','Procedural character fields, coherent flow and signal typography',['Columns','Flow Speed','Warp','Luminance','Amplitude','Breakup','Character Detail'],[80,.5,.8,1,1,.5,.8]]
].map(([id,name,category,desc,labels,values])=>({id,name,category,desc,params:['density','motion','connections','glow','spread','complexity','detail','feedback'].map((key,i)=>param(key,labels[i]||'Persistence',i===0?(id==='ascii-motion'?24:8):0,i===0?(id==='ascii-motion'?140:96):i===7?.8:2,values[i]??.08,i===0?1:.01))})));

export const SCENE_MAP=new Map(SCENES.map((scene,i)=>[scene.id,{...scene,index:i}]));
export const PALETTES=[
 {name:'MONO / SILVER',stops:['#08090a','#646b74','#f6f7ff']},
 {name:'SEKRET / BORDEAUX',stops:['#080607','#781d34','#f9c9d0']},
 {name:'ELECTRIC / COBALT',stops:['#020711','#1359fd','#a4eaff']},
 {name:'ACID / LIME',stops:['#060c05','#94ce19','#efffd8']},
 {name:'INFRARED',stops:['#040412','#bd1451','#ffbb49']},
 {name:'AMETHYST / SILVER',stops:['#0a0716','#7553b1','#e6e2fb']},
 {name:'CINEMA / TUNGSTEN',stops:['#090a11','#a66254','#f9d3a0']},
 {name:'MINT / PORCELAIN',stops:['#070c12','#348b87','#d7fff0']},
 {name:'MONO / INVERT',stops:['#f7f7f2','#787878','#070707']},
 {name:'PASTEL / DUST',stops:['#5c6480','#b2a2a8','#e9d6ba']}
];
export const GRADIENT_STYLES=['EDITORIAL SOFT','SPECTRAL FIELD','AURORA MESH','THRESHOLD / BANDS','MONO FIELD'];
export const DEFAULT_MAPPINGS={
 density:'none',motion:'bass',connections:'mid',glow:'high',spread:'bass',complexity:'energy',detail:'beat',feedback:'none'
};
export function defaultSceneSettings(id){
 const scene=SCENE_MAP.get(id)||SCENE_MAP.get('particle-web');
 const countDriven=id==='ribbon-flow';
 const musical={motion:'bassline',connections:'vocal',glow:'hats',spread:'kick',complexity:'melody',detail:'snare',feedback:'none',density:'none'};
 const individual={
 'signal-lines':{motion:'bassline',connections:'melody',glow:'hats',spread:'energy',complexity:'vocal',detail:'snare'},
 'voice-sculpture':{motion:'bassline',connections:'vocal',glow:'high',spread:'vocal',complexity:'melody',detail:'hats'},
 'signal-corruption':{motion:'bassline',connections:'percussion',glow:'high',spread:'energy',complexity:'snare',detail:'hats'},
 'gradient-systems':{motion:'bassline',connections:'melody',glow:'energy',spread:'lowMid',complexity:'high',detail:'vocal'}
 }[id];if(individual)Object.assign(musical,individual);
 return Object.fromEntries(scene.params.map(p=>[p.id,{value:p.default,map:{
 source:p.id==='density'&&countDriven?'beat':(id==='ribbon-flow'?DEFAULT_MAPPINGS:musical)[p.id]||'none',
 strength:p.id==='density'&&countDriven?1:.45,min:p.min,max:p.max,
 smoothness:id==='ribbon-flow'?.55:.72,intensity:1,triggerRate:'1',interval:.5,cooldown:.12,response:'smooth',attack:p.id==='density'?.035:.06,release:p.id==='density'?.4:id==='ribbon-flow'?.26:.48,invert:false,mode:p.id==='density'&&countDriven?'replace':'add'
 }}]));
}

// Art-directed variations share one renderer per family, with reproducible settings.
export const LOOKS={
 'city-signal':['SIGNAL STREETS','CITY EXTRUSION','URBAN PARTICLES'],
 'tech-radar':['PHASE OBSERVATORY'],
 'neural-core':['CORTICAL TRANSMISSION'],
 'ascii-motion':['ASCII FIELD','ASCII FLOW','ASCII SIGNAL','ASCII PARTICLES'],
 'material-resonance':['STANDING SILVER','NODAL ENGRAVING','WINE MEMBRANE'],
 'spectral-bloom':['SPECTRAL COROLLA','VORTEX VEIL','SPECTRAL LANDSCAPE'],
 'phase-torus':['PEARL TOPOLOGY','CHROME KNOT','CONTOUR VESSEL'],
 'particle-web':['DENSE NEURAL WEB','PARTICLE CURRENT','ORBITAL CLUSTERS','DISSOLVING MESH'],
 'ribbon-flow':['SILK TRAILS','TURBULENT RIBBONS','FIBER FLOW','KINETIC THREADS'],
 'feedback-field':['RESONANCE TRAILS','WAVE TRANSPORT','RECURSIVE CHAMBER','SIGNAL AFTERIMAGE'],
 'fluid-blobs':['VISCOUS INK','CHROME MERCURY','ELASTIC MEMBRANE','LIQUID FRACTURE'],
 'geometry-field':['SPECTRAL TERRAIN','PLEATED SAIL','RESONANT MEMBRANE','TENSION SHELL'],
 'media-reactive':['SPECTRAL DISPLACEMENT','SHADOW BREAKUP','CHROMATIC TRANSIENT','GRANULAR SIGNAL'],
 'reactive-typography':['TYPE FLOW','TYPE PARTICLES','TYPE STRETCH','TYPE SIGNAL','TYPE FEEDBACK','TYPE CHROMATIC','TYPE ORBIT','TYPE TUNNEL','TYPE WALL','TYPE PLANET','TYPE RIBBON SCULPTURE','PARTICLE TYPE FIELD','TYPE REASSEMBLY'],
 'gradient-systems':['EDITORIAL MESH','SPECTRAL GRADIENT','LIQUID COLOR FIELD','THRESHOLD FIELD','MONOCHROME TOPOGRAPHY'],
 'liquid-glass':['REFRACTIVE MEMBRANE','GLASS ORGANISM','LIQUID LENS','CHROME REFRACTION','FULL FRAME MEMBRANE'],
 'signal-lines':['TRAVELLING HELIX','CROSSED WEAVE','SPECTRAL FAN','CLOSED ORBIT'],
 'signal-corruption':['DIGITAL RUPTURE','BLOCK MEMORY','SPECTRAL DAMAGE','SIGNAL COLLAPSE'],
 'voice-sculpture':['VOICE MEMBRANE','SPECTRAL BODY','WAVEFORM SCULPTURE','SIGNAL ORGANISM']
};
export function applyLook(id,index){
 const settings=defaultSceneSettings(id),scene=SCENE_MAP.get(id);
 const profiles=[[1,1,1,1,1,1,1,1],[1.18,.65,1.35,.75,1.3,1.3,.8,.95],[1.4,.8,.75,.8,.75,1.5,1.3,.7],[.75,1.3,1.4,.8,1.15,1.5,1,.9],[1,.5,.5,.8,1,.2,1,2],[1,1,1.2,.9,1,1.2,1,.6]];
 const profile=profiles[index]||profiles[0];
 scene.params.forEach((p,i)=>settings[p.id].value=Math.min(p.max,Math.max(p.min,p.default*profile[i])));
 const art={
 'particle-web':{density:27,connections:1.25,detail:1.15,feedback:.12},
 'ribbon-flow':{density:36,spread:1.15,detail:1.4,glow:1.2,feedback:.22},
 'feedback-field':{glow:.8,detail:1.35,feedback:.9},
 'fluid-blobs':{density:5,connections:.85,detail:1.4},
 'geometry-field':{density:28,connections:1.1,glow:1.05},
 'media-reactive':{connections:.35,detail:1.2,complexity:.65},
 'reactive-typography':{glow:1,feedback:.18},
 'gradient-systems':{connections:1.2,detail:1.3},
 'signal-lines':{density:30,spread:.95,detail:1.1,glow:1.1,feedback:.08},
 'signal-corruption':{density:18,complexity:.7,feedback:.1},
 'liquid-glass':{density:3,detail:1.1,glow:1.35},
 'voice-sculpture':{density:32,spread:1.25,glow:1.3,feedback:.18},
 'spectral-bloom':{density:36,spread:1.25,glow:1.4,feedback:.15},
 'material-resonance':{density:22,connections:.85,motion:.55,spread:1.1,glow:1.1,detail:1.3,feedback:.04},
 'phase-torus':{density:28,connections:1.2,glow:1.1,feedback:.05}
 }[id];
 if(art)for(const [key,value] of Object.entries(art)){const param=scene.params.find(p=>p.id===key);settings[key].value=Math.min(param.max,Math.max(param.min,value*(index===0?1:profile[scene.params.indexOf(param)])));}
 if(id!=='signal-lines'&&settings.density.map.source!=='none'){settings.density.map.min=Math.max(scene.params[0].min,Math.round(settings.density.value*.5));settings.density.map.max=scene.params[0].max;}
 const focused={
 'particle-web':[[29,.65,1.1,.8,.8,.6,1.2,.08],[24,.9,.55,.9,1,.55,1.3,.18],[26,.65,1.2,.85,.9,.7,1,.12],[30,.6,.9,.85,1,.85,1.2,.12]],
 'feedback-field':[[18,.65,.8,.75,.7,.5,1.1,.97],[20,.8,.7,.75,.9,.45,1,.965],[14,.5,.8,.65,.8,.3,1.2,.975],[24,.6,1,.85,.8,.5,1.2,.96]],
 'fluid-blobs':[[7,.6,.85,1,.9,.6,1.2,.06],[6,.85,.8,1,1,.7,1.1,.04],[9,.65,.7,1.1,1.1,.7,1.2,.05],[5,.35,1.1,.9,.9,.5,1.3,.06]],
 'geometry-field':[[29,.5,1.15,1,.8,.7,1,.04],[32,.65,1.2,1,.8,.7,1,.04],[30,.7,1.3,1,.8,.8,1.1,.04],[32,.55,1.25,1,.9,.8,1.1,.04]]
 }[id]?.[index];
 if(focused)scene.params.forEach((p,i)=>settings[p.id].value=focused[i]);
 return settings;
}
PALETTES.push({name:'INK / BONE',stops:['#0d1518','#69736b','#eee5cf']},{name:'COLD INDUSTRIAL',stops:['#080f17','#475b68','#cbdde2']},{name:'CMYK DAMAGE',stops:['#12101b','#cf2158','#79e8df']});
