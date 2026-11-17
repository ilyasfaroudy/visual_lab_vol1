// Interface preferences deliberately live outside creative project data.
const key='sekret-interface-v1';
let saved={};try{saved=JSON.parse(localStorage.getItem(key)||'{}')}catch{}
export const preferences={language:saved.language==='ru'?'ru':'en',theme:saved.theme==='light'?'light':'dark'};
const ru={
 'SEKRET / DESIGN ON YOUR OWN TERMS':'SEKRET / ДИЗАЙН НА ТВОИХ УСЛОВИЯХ',
 'CREATIVE SOFTWARE / DESIGN LABORATORY':'ТВОРЧЕСКАЯ СРЕДА / ЛАБОРАТОРИЯ ДИЗАЙНА',
 'MOVE TO MAKE CONTACT ↗':'КОСНИСЬ КУРСОРОМ ↗',
 'Turn photographs into graphic matter. Turn sound into moving form. Three laboratories. One creative instinct.':'Превращай фотографии в графическую материю, а звук — в движущуюся форму. Три лаборатории. Один творческий инстинкт.',
 'FOR THE UNEXPECTED.':'ДЛЯ НЕОЖИДАННОГО.', 'VISUAL SYSTEMS':'ВИЗУАЛЬНЫЕ СИСТЕМЫ',
 '01 / CREATIVE LABORATORIES':'01 / ТВОРЧЕСКИЕ ЛАБОРАТОРИИ','[ OPEN A LABORATORY BELOW ]':'[ ВЫБЕРИ ЛАБОРАТОРИЮ ]',
 '01 / PHOTO ↗':'01 / ФОТО ↗','02 / AUDIO ↗':'02 / АУДИО ↗','03 / GENERATIVE ↗':'03 / ГЕНЕРАЦИЯ ↗',
 '[ 01 ] / PHOTO EFFECT SYSTEMS':'[ 01 ] / ОБРАБОТКА ИЗОБРАЖЕНИЙ','[ 02 ] / REALTIME GENERATIVE MOTION':'[ 02 ] / ДВИЖЕНИЕ В РЕАЛЬНОМ ВРЕМЕНИ','[ 03 ] / CREATE FROM NOTHING':'[ 03 ] / СОЗДАВАЙ С НУЛЯ',
 'PHOTO':'ФОТО','AUDIO':'АУДИО','GENERATIVE':'ГЕНЕРАТИВНАЯ','LABORATORY':'ЛАБОРАТОРИЯ',
 'PHOTO LAB':'ФОТОЛАБ','AUDIO LAB':'АУДИОЛАБ','GENERATIVE LAB':'ГЕНЕРАТИВНЫЙ ЛАБ',
 'PIXEL / PRINT / GLITCH / COLOR / TEXTURE':'ПИКСЕЛЬ / ПЕЧАТЬ / ГЛИТЧ / ЦВЕТ / ТЕКСТУРА',
 'SOUND / PARTICLES / TYPE / FEEDBACK':'ЗВУК / ЧАСТИЦЫ / ТЕКСТ / ОБРАТНАЯ СВЯЗЬ',
 'SCULPTURE / FIELDS / TYPE / INTERACTION':'ФОРМА / ПОЛЯ / ТЕКСТ / ВЗАИМОДЕЙСТВИЕ',
 'FREQUENCY / SPACE':'ЧАСТОТА / ПРОСТРАНСТВО','FORM / FIELD / FORCE':'ФОРМА / ПОЛЕ / СИЛА',
 'LOCAL PROCESSING':'ЛОКАЛЬНАЯ ОБРАБОТКА','↗ RESUME LAST PROJECT':'↗ ПРОДОЛЖИТЬ ПРОЕКТ',
 'SAVE':'СОХРАНИТЬ','LOAD':'ЗАГРУЗИТЬ','PROJECT':'ПРОЕКТ','PROJECT CODE':'КОД ПРОЕКТА',
 'EXPORT ↗':'ЭКСПОРТ ↗','EXPORT IMAGE ↗':'ЭКСПОРТ ФОТО ↗','CAPTURE PNG ↗':'СНИМОК PNG ↗',
 'RECORD MP4 / WEBM ●':'ЗАПИСЬ MP4 / WEBM ●','Back to home':'На главную',
 'Save project':'Сохранить проект','Load project':'Загрузить проект','Project name':'Название проекта',
 'Undo (Ctrl+Z)':'Отменить (Ctrl+Z)','Redo (Ctrl+Shift+Z)':'Повторить (Ctrl+Shift+Z)',
 'PHOTO SYSTEMS':'ФОТОСИСТЕМЫ','INSPECTOR':'ИНСПЕКТОР','EFFECT STACK':'СТЕК ЭФФЕКТОВ','LAYERS':'СЛОИ',
 'OPACITY':'НЕПРОЗРАЧНОСТЬ','BLEND MODE':'РЕЖИМ СМЕШИВАНИЯ','AMOUNT':'СИЛА','SCALE':'МАСШТАБ','CONTRAST':'КОНТРАСТ','DISTORTION':'ИСКАЖЕНИЕ',
 'SEED':'ЗЕРНО','RESET':'СБРОС','ADVANCED / SOURCE SETTINGS':'РАСШИРЕННЫЕ НАСТРОЙКИ',
 'REACTIVE MASK':'РЕАКТИВНАЯ МАСКА','CONTENT-AWARE':'ПО СОДЕРЖИМОМУ','AFFECT REGION':'ОБЛАСТЬ ВОЗДЕЙСТВИЯ',
 'ALL PIXELS':'ВСЕ ПИКСЕЛИ','SHADOWS':'ТЕНИ','HIGHLIGHTS':'СВЕТА','MIDTONES':'ПОЛУТОНА','LUMINANCE':'ЯРКОСТЬ','CONTOURS / EDGES':'КОНТУРЫ / ГРАНИ',
 'THRESHOLD':'ПОРОГ','FEATHER':'РАСТУШЁВКА','MASK STRENGTH':'СИЛА МАСКИ','PREVIEW MASK':'ПОКАЗАТЬ МАСКУ','INVERT REGION':'ИНВЕРТИРОВАТЬ',
 '↥ LOAD SOURCE':'↥ ЗАГРУЗИТЬ ФОТО','↥ SELECT SOURCE':'↥ ВЫБРАТЬ ФОТО','↗ MAKE REACTIVE':'↗ ОЖИВИТЬ','FIT':'ВПИСАТЬ',
 'DROP AN IMAGE TO BEGIN':'ПЕРЕТАЩИ ФОТОГРАФИЮ','NO LAYER':'НЕТ СЛОЯ','SELECTED LAYER':'ВЫБРАННЫЙ СЛОЙ','+ SOURCE':'+ ИСТОЧНИК',
 'RENDER & SAVE ↗':'СОЗДАТЬ И СОХРАНИТЬ ↗','EXPORT IMAGE':'ЭКСПОРТ ФОТО','FORMAT':'ФОРМАТ','WIDTH (PX)':'ШИРИНА (PX)',
 'RENDER MODE':'РЕЖИМ РЕНДЕРА','MATCH PREVIEW / WYSIWYG':'КАК В ПРЕВЬЮ / WYSIWYG','HD REPROCESS / SOURCE PIXELS':'HD / ИСХОДНОЕ РАЗРЕШЕНИЕ',
 'COPY CODE':'КОПИРОВАТЬ КОД','RESTORE CODE ↗':'ВОССТАНОВИТЬ ↗','RESET COLOR':'СБРОСИТЬ ЦВЕТ',
 'SATURATION':'НАСЫЩЕННОСТЬ','HUE':'ТОН','BRIGHTNESS':'ЯРКОСТЬ','GAMMA':'ГАММА',
 'PERFORMANCE':'БЫСТРО','BALANCED':'БАЛАНС','QUALITY':'КАЧЕСТВО',
 'FIDELITY / RECONSTRUCT':'ТОЧНОСТЬ / РЕКОНСТРУКЦИЯ','EXPERIMENTAL / DECONSTRUCT':'ЭКСПЕРИМЕНТ / ДЕКОНСТРУКЦИЯ',
 'CHARACTER SIZE':'РАЗМЕР СИМВОЛОВ','DETAIL PRESERVATION':'СОХРАНЕНИЕ ДЕТАЛЕЙ','DECONSTRUCTION':'ДЕКОНСТРУКЦИЯ',
 'CHARACTER SET':'НАБОР СИМВОЛОВ','COLOR MODE':'РЕЖИМ ЦВЕТА','ORIGINAL COLOR':'ЦВЕТ ОРИГИНАЛА','MONOCHROME':'МОНОХРОМ',
 'CUSTOM TEXT':'СВОЙ ТЕКСТ','FONT':'ШРИФТ','DENSITY':'ПЛОТНОСТЬ','EDGE EMPHASIS':'АКЦЕНТ КОНТУРОВ',
 'FULL REPLACEMENT':'ПОЛНАЯ ЗАМЕНА','SHADOWS ONLY':'ТОЛЬКО ТЕНИ','HIGHLIGHTS ONLY':'ТОЛЬКО СВЕТА','EDGES ONLY':'ТОЛЬКО КОНТУРЫ','HYBRID':'ГИБРИД',
 'PAUSE':'ПАУЗА','PLAY':'ПУСК','RESET VIEW':'СБРОС КАМЕРЫ','NEW VARIATION':'НОВАЯ ВАРИАЦИЯ','SPEED':'СКОРОСТЬ',
 'ATTRACT':'ПРИТЯЖЕНИЕ','REPEL':'ОТТАЛКИВАНИЕ','DRAG':'ПЕРЕТАСКИВАНИЕ','DISTORT':'ДЕФОРМАЦИЯ','ORBIT':'ОРБИТА',
 'BASIC':'ОСНОВНОЕ','ADVANCED':'РАСШИРЕННОЕ','INTENSITY':'ИНТЕНСИВНОСТЬ','SMOOTHNESS':'ПЛАВНОСТЬ','TRIGGER RATE':'ЧАСТОТА ИМПУЛЬСОВ',
 'SOURCE':'ИСТОЧНИК','NONE':'НЕТ','BEAT':'БИТ','BASS':'БАС','LOW':'НИЗКИЕ','MID':'СРЕДНИЕ','HIGH':'ВЫСОКИЕ',
 'Toggle effect':'Включить эффект','Move up':'Выше','Move down':'Ниже','Delete':'Удалить','Duplicate':'Дублировать'
};
const originals=new WeakMap(),attrs=new WeakMap();
const excluded='script,style,textarea,input,output,code,pre,.layer-name,.source-name,.inspector-lead h2,[data-no-translate]';
function text(node){
 if(node.parentElement?.closest(excluded))return;
 const raw=node.nodeValue,trim=raw.trim();let original=originals.get(node);
 if(!original||![original,ru[original.trim()]].some(x=>x?.trim()===trim)){if(!ru[trim])return;original=raw;originals.set(node,raw);}
 // Option display text must never change its semantic value.
 if(node.parentElement?.tagName==='OPTION'&&!node.parentElement.hasAttribute('value'))node.parentElement.value=original.trim();
 const next=preferences.language==='ru'?original.replace(original.trim(),ru[original.trim()]||original.trim()):original;
 if(node.nodeValue!==next)node.nodeValue=next;
}
function translate(root){
 if(root.nodeType===3){text(root);return;}if(root.nodeType!==1)return;
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode())text(node);
 for(const el of [root,...root.querySelectorAll('[title],[aria-label],[placeholder]')]){
  if(el.closest(excluded))continue;let values=attrs.get(el);if(!values){values={};attrs.set(el,values)}
  for(const key of ['title','aria-label','placeholder']){const value=el.getAttribute(key);if(!value)continue;values[key]??=value;const next=preferences.language==='ru'?(ru[values[key]]||values[key]):values[key];if(value!==next)el.setAttribute(key,next);}
 }
}
function apply(){document.documentElement.lang=preferences.language;document.documentElement.dataset.theme=preferences.theme;translate(document.body);document.querySelectorAll('[data-pref]').forEach(el=>{el.setAttribute('aria-pressed',String(preferences[el.dataset.pref]===el.dataset.value))});try{localStorage.setItem(key,JSON.stringify(preferences))}catch{}}
export function mountPreferences(root){const controls=document.createElement('div');controls.className='interface-preferences';controls.dataset.noTranslate='';controls.innerHTML='<div role="group" aria-label="Language"><button data-pref="language" data-value="en">EN</button><button data-pref="language" data-value="ru">RU</button></div><div role="group" aria-label="Theme"><button data-pref="theme" data-value="dark" title="Dark theme">DARK</button><button data-pref="theme" data-value="light" title="Light theme">LIGHT</button></div>';root.append(controls);controls.addEventListener('click',e=>{const button=e.target.closest('[data-pref]');if(!button)return;preferences[button.dataset.pref]=button.dataset.value;apply()});apply();}
export function initPreferences(){apply();const observer=new MutationObserver(records=>{for(const r of records){if(r.type==='characterData')text(r.target);else for(const n of r.addedNodes)translate(n)}});observer.observe(document.body,{childList:true,subtree:true,characterData:true});}
