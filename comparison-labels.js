import { WELL_SENSOR_POINTS } from './well-supply.js?v=jumbo-well-box-6';
// Stable component IDs link selections; display numbers follow each visible key.
const components={
  1:{name:'Smart controller',description:'Coordinates watering schedules. The proposed controller uses Wi-Fi and weather data to help adjust irrigation.',point:[-.48,1.47,-.38]},
  2:{name:'Pump control',description:'Adjusts pump operation to deliver water at consistent pressure as zones open and close.',point:[-1.17,1.23,-.35]},
  3:{name:'Automatic self-flushing filter',point:[-.04,1.08,.34],description:'The automatic self-flushing filter removes sediment and debris from the water, helping irrigation system components last longer.'},
  4:{name:'Pressure tank',point:[-.04,.98,-.30],description:'Flexible pump controls deliver water to the system at constant pressure, as needed.'},
  7:{name:'Flow meter',description:'Measures water delivered to the landscape and helps flag unexpected flow.',point:[1.24,-.52,1.55]},
  8:{name:'Remote connection',point:[-.12,1.16,-.44]},
  10:{name:'Pump start relay',description:'Connects the irrigation control signal to the pump-start circuit.',point:[-1.75,1.04,-.40]},
  11:{name:'Well 1 flow meter',description:'Measures the first well’s contribution to storage.',point:WELL_SENSOR_POINTS[0]},
  12:{name:'Well 2 flow meter',description:'Measures the second well’s contribution to storage.',point:WELL_SENSOR_POINTS[1]}
};

export function createComparisonLabels(getScene){
  const key=document.createElement('div');key.className='component-key';key.setAttribute('aria-label','Explore system components');
  document.querySelector('.story').append(key);
  const explanation=document.createElement('div');explanation.className='component-explanation';explanation.setAttribute('aria-live','polite');
  const title=document.createElement('h3'),copy=document.createElement('p');explanation.append(title,copy);
  let items=[],selected=null;
  function select(id){
    selected=id;const item=items.find(x=>x.id===id);explanation.hidden=!item?.description;
    title.textContent=item?.name||'';copy.textContent=item?.description||'';
    document.querySelectorAll('[data-component]').forEach(el=>{
      el.classList.toggle('is-active',Number(el.dataset.component)===id);
      if(el.tagName==='BUTTON')el.setAttribute('aria-pressed',String(Number(el.dataset.component)===id));
    });
  }
  function show(file,chapter,meter=null){
    const ids=meter===2?[7]:meter!==null?[11,12]:[[],[11,12],[4,3],[1,2,10],[]][chapter];
    items=ids.map((id,i)=>({id,...components[id],number:i+1}));key.replaceChildren();key.hidden=!items.length;
    const hint=document.createElement('span');hint.className='component-key-heading';hint.textContent='EXPLORE THE COMPONENTS';key.append(hint);
    items.forEach(item=>{
      const b=document.createElement('button');b.type='button';b.dataset.component=item.id;
      const n=document.createElement('span');n.className='component-key-number';n.textContent=item.number;
      b.append(n,document.createTextNode(item.name));b.addEventListener('click',()=>select(item.id));key.append(b);
    });
    key.append(explanation);getScene()?.setComponentLabels(items);select(items[0]?.id??null);
  }
  return {show};
}
