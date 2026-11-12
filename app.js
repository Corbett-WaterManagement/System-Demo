import { createInstallation } from './scene.js?v=jumbo-well-box-6';
import { createComparisonLabels } from './comparison-labels.js?v=twin-only-2';

const $ = (s) => document.querySelector(s);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const chapters = [
  {number:'00',name:'THE COMPLETE SYSTEM',title:'A closer look. <br>A clearer picture.',description:'Two wells replenish underground storage. Water passes through pumping and filtration before being measured and delivered to the landscape.',note:'Supply · Store · Filter · Deliver',caption:'COMPLETE SYSTEM',camera:[-9.4,6.8,13.6],target:[-.65,.05,1.25]},
  {number:'01',name:'WATER STORAGE',title:'Water, ready <br>when it is needed.',description:'The wells replenish a cistern between irrigation cycles, building a reserve for the landscape. Flow meters track each well’s contribution.',note:'Two well supplies · Level-controlled storage',caption:'BELOW THE SURFACE',camera:[-3.8,2.8,4.8],target:[-.65,-.65,3.05]},
  {number:'02',name:'PUMPING & FILTRATION',title:'A clear path <br>to the landscape.',description:'Stored water is pumped through an automatic self-flushing filter to remove sediment and debris. An outgoing flow meter tracks water delivered to the landscape.',note:'Automatic self-flushing filtration',caption:'PUMPING & FILTRATION',camera:[-3.6,1.7,.42],target:[-.02,.87,.25]},
  {number:'03',name:'CONTROL & CONNECTIVITY',title:'The coordination <br>behind the system.',description:'A smart controller coordinates watering. The proposed controller uses Wi-Fi connectivity and weather data to help adjust schedules.',note:'Proposed Wi-Fi and weather integration · Confirm selected equipment',caption:'CONTROL & CONNECTIVITY',camera:[-.97,1.62,3.6],target:[-1.0,1.02,-.55]},
  {number:'04',name:'INTO THE LANDSCAPE',title:'From the system. <br>Into the landscape.',description:'Separate drip zones serve trees, shrubs and flowers. Multi-stream rotating nozzles suit irregular lawns; conventional rotors cover larger, regular areas.',note:'Select a landscape to look closer · Illustrative layouts',caption:'WATER TO THE LANDSCAPE',camera:[-1.3,4.9,8.1],target:[1.9,.25,1.1]}
];
let step=0,playing=false,motionPaused=reducedMotion,tourTime=0;
let sceneAPI=null;
const chapterButtons=[...document.querySelectorAll('[data-step]')];
function setStep(index,{user=true}={}){
  step=Math.max(0,Math.min(chapters.length-1,index));
  const c=chapters[step];
  $('#chapter-number').textContent=c.number;
  $('#chapter-name').textContent=c.name;
  $('#story-title').innerHTML=c.title;
  $('#story-description').textContent=c.description;
  $('#note-text').textContent=c.note;
  $('#view-caption').innerHTML='<span></span>'+c.caption;
  $('#step-count').textContent=`0${step+1} / 0${chapters.length}`;
  $('#previous').disabled=step===0;
  $('#next').setAttribute('aria-label',step===chapters.length-1?'Return to overview':'Next chapter');
  $('#next').textContent=step===chapters.length-1?'↺':'→';
  chapterButtons.forEach(b=>{
    const n=Number(b.dataset.step);
    if(b.classList.contains('chapter')){
      b.classList.toggle('active',n===step);
      if(n===step)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');
    }
    if(b.classList.contains('progress-segment')){
      b.classList.toggle('current',n===step);b.classList.toggle('done',n<step);
    }
    if(b.classList.contains('hotspot')){
      b.classList.toggle('selected',n===step);b.classList.toggle('dimmed',step!==0&&n!==step);
    }
  });
  $('#landscape-switcher').hidden=step!==4;
  document.querySelectorAll('[data-landscape]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.landscape==='all')));
  tourTime=0;
  if(user&&playing)togglePlay(false);
  sceneAPI?.focus(step);
  updateProjectStory(step);
  window.demoState={step,playing,motionPaused};
}
function togglePlay(value=!playing){
  playing=value;tourTime=0;
  $('#play-tour').setAttribute('aria-pressed',String(playing));
  $('#play-tour span').textContent=playing?'Pause walkthrough':'Play walkthrough';
  $('#play-symbol').setAttribute('d',playing?'M5 3h4v14H5zM12 3h4v14h-4z':'M6 3l11 7-11 7z');
  if(playing&&motionPaused){motionPaused=false;updateMotionButton();}
  window.demoState={step,playing,motionPaused};
}
function updateMotionButton(){
  $('#motion-toggle').textContent=motionPaused?'Resume motion':'Pause motion';
  $('#motion-toggle').setAttribute('aria-pressed',String(motionPaused));
}
chapterButtons.forEach(b=>b.addEventListener('click',()=>setStep(Number(b.dataset.step))));
$('#previous').addEventListener('click',()=>setStep(step-1));
$('#next').addEventListener('click',()=>setStep((step+1)%chapters.length));
$('#play-tour').addEventListener('click',()=>togglePlay());
$('#motion-toggle').addEventListener('click',()=>{motionPaused=!motionPaused;if(motionPaused&&playing)togglePlay(false);updateMotionButton();window.demoState={step,playing,motionPaused};});
$('#reset-view').addEventListener('click',()=>sceneAPI?.resetView());
$('#fullscreen').addEventListener('click',async()=>{
  try{if(document.fullscreenElement)await document.exitFullscreen();else await $('.experience').requestFullscreen();}catch{}
});
document.addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  if(['ArrowRight','ArrowLeft','Home'].includes(e.key)&&!['INPUT','TEXTAREA'].includes(e.target.tagName)){
    e.preventDefault();setStep(e.key==='Home'?0:e.key==='ArrowRight'?(step+1)%chapters.length:Math.max(0,step-1));
  }
});
const landscapeStories={
  drip:{title:'Water at <br>the roots.',description:'Drip irrigation delivers water directly to the roots of trees, shrubs and flowers.',note:'Illustrative soil cutaway · Depths not to scale'},
  mp:{title:'Many streams. <br>Gentle rotation.',description:'Four corner multi-stream rotating nozzles direct fine streams inward across an irregular lawn. The animation keeps the water within the turf outline.',note:'Multi-stream rotating nozzles · Illustrative coverage'},
  rotor:{title:'A steady throw. <br>Overlapping coverage.',description:'Four Conventional rotors sweep inward from the corners of a square lawn. Their throw stays constant and reaches the adjacent heads.',note:'Conventional · Schematic head-to-head coverage'}
};
document.querySelectorAll('[data-landscape]').forEach(button=>button.addEventListener('click',()=>{
  const kind=button.dataset.landscape;
  setStep(4);sceneAPI?.focusLandscape(kind==='all'?null:kind);
  comparisonLabels.show(null,4);
  document.querySelectorAll('[data-landscape]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.landscape===kind)));
  const text=landscapeStories[kind];
  if(text){$('#story-title').innerHTML=text.title;$('#story-description').textContent=text.description;$('#note-text').textContent=text.note;}
}));
$('#year').textContent=new Date().getFullYear();
updateMotionButton();
const comparisonLabels=createComparisonLabels(()=>sceneAPI);

function createScene(){
  return createInstallation({
    container:$('#scene'), chapters, reducedMotion,
    getState:()=>({step,playing,motionPaused}),
    onAdvance:()=>{if(step===chapters.length-1){setStep(0,{user:false});togglePlay(false);}else setStep(step+1,{user:false});},
    onInterrupt:()=>{if(playing)togglePlay(false);}
  });
}

try{
  sceneAPI=createScene();
  $('#loading').classList.add('loaded');
  $('#scene').dataset.ready='true';
  setStep(0);
}catch(error){
  console.error('3D viewer unavailable:',error);
  $('#loading').classList.add('loaded');$('#fallback').hidden=false;
  document.querySelectorAll('.hotspot').forEach(el=>el.hidden=true);
  $('#scene').dataset.ready='fallback';
  setStep(0);
}

document.querySelectorAll('[data-meter]').forEach(button=>button.addEventListener('click',()=>{
  const index=Number(button.dataset.meter);setStep(index===2?2:1);sceneAPI?.focusMeter(index);
  $('#story-title').innerHTML='Flow, measured <br>below the surface.';
  $('#story-description').textContent=index===2?'The outgoing flow meter sits inside a buried inspection box between filtration and the landscape.':'Both well supply lines pass through separate flow meters in one shared valve box before reaching the cistern.';
  $('#note-text').textContent='Open sectional view · Illustrative installation depth';
  comparisonLabels.show(null,step,index);
}));

function updateProjectStory(index){
  const stories=[
    {kicker:'00 / THE COMPLETE SYSTEM',title:'One coordinated installation.',description:'Water supply, storage, filtration and controls work together to serve a varied residential landscape.',detail:'Explore the chapters to explain how each stage contributes to the complete system.',photo:'assembled-system.jpg',alt:'The irrigation control and filtration equipment assembled at the property',caption:'Reference photograph · Assembled control and filtration equipment.'},
    {kicker:'01 / WATER STORAGE',title:'A reserve that bridges the gap.',description:'The cistern collects water between irrigation cycles, making the wells’ slower output available when the landscape needs it.',detail:'A level sensor starts and stops the well pumps. If storage drops too low, the irrigation pump shuts down. The service team checks that sufficient water is available before manually clearing the alarm.',photo:'underground-storage.jpg',alt:'The buried cistern roof and two access openings before final backfill',caption:'Reference photograph · The underground cistern and its access openings before backfill.'},
    {kicker:'02 / PUMPING & FILTRATION',title:'Protect the path to the landscape.',description:'The automatic self-flushing filter removes sediment and debris from well water, helping prevent clogged sprinkler heads and drip lines.',detail:'The mainline flow meter measures water leaving the system. Together with the two well meters, it helps the service team monitor performance and investigate unusual use.',photo:'filter-detail.jpg',alt:'A close view of the installed automatic self-flushing filter, pressure tank, valves and supporting pipework',caption:'Reference photograph · The installed filtration assembly and pipework.'},
    {kicker:'03 / CONTROL & CONNECTIVITY',title:'Visibility beyond the property.',description:'The proposed Wi-Fi smart controller combines scheduling, weather data and remote visibility. Final controller connectivity and weather service are confirmed during design.',detail:'High-priority conditions, such as unscheduled flow, shut irrigation down automatically. Lower-priority alerts notify the service team for investigation.',photo:'control-panel.jpg',alt:'A direct view of the smart controller and pump-control equipment mounted on the panel',caption:'Reference photograph · The mounted control equipment and conduit.'},
    {kicker:'04 / INTO THE LANDSCAPE',title:'The right method for each area.',description:'Drip zones supply trees, shrubs, flowers and other plantings directly at the roots.',detail:'Multi-stream rotating nozzles tailor coverage to irregular lawns and help limit overspray. Conventional rotors serve larger, regularly shaped turf. The landscape shown in the twin is illustrative.',photo:'assembled-system.jpg',alt:'The control and filtration assembly that supplies the landscape irrigation network',caption:'Reference photograph · The equipment supplying the irrigation network. Landscape layouts are illustrative.'}
  ];
  const c=stories[index];
  comparisonLabels.show(null,index);
  $('#proof-kicker').textContent=c.kicker;$('#proof-title').textContent=c.title;
  $('#proof-description').textContent=c.description;$('#proof-detail').textContent=c.detail;
  $('#proof-count').textContent=`0${index+1} / 05`;
}
$('#proof-previous').addEventListener('click',()=>setStep((step+4)%5));
$('#proof-next').addEventListener('click',()=>setStep((step+1)%5));
