// Preserve same-system UI across the few operations that replace markup.
export function rememberInspector(lab){
 if(lab.renderedScene!==lab.sceneId)return null;
 const panel=lab.root.querySelector('.inspector-panel');if(!panel)return null;
 const active=document.activeElement;
 return {scroll:panel.scrollTop,content:panel.querySelector('.inspector-content')?.scrollTop||0,
 details:[...panel.querySelectorAll('details')].map(x=>x.open),
 expanded:[...panel.querySelectorAll('.mapping-detail')].map(x=>!x.hidden),
 focus:panel.contains(active)?{id:active.id,attributes:[...active.attributes].filter(x=>x.name.startsWith('data-')).map(x=>[x.name,x.value])}:null};
}
export function restoreInspector(lab,state){
 lab.renderedScene=lab.sceneId;if(!state)return;
 const panel=lab.root.querySelector('.inspector-panel');
 panel.querySelectorAll('details').forEach((x,i)=>{if(state.details[i]!==undefined)x.open=state.details[i]});
 panel.querySelectorAll('.mapping-detail').forEach((x,i)=>{if(state.expanded[i]!==undefined)x.hidden=!state.expanded[i]});
 const f=state.focus;const target=f?.id?panel.querySelector('#'+CSS.escape(f.id)):f?.attributes.length?[...panel.querySelectorAll('input,select,button,textarea')].find(x=>f.attributes.every(([k,v])=>x.getAttribute(k)===v)):null;
 target?.focus({preventScroll:true});panel.scrollTop=state.scroll;panel.querySelector('.inspector-content').scrollTop=state.content;
}
