import * as THREE from './assets/three.module.js';
import { buildLandscape } from './landscape.js?v=flow-route-5';
import { buildWellSupply,WELL_BOX,WELL_SENSOR_POINTS } from './well-supply.js?v=jumbo-well-box-6';

// Photo-informed presentation model. Buried routing, distances and depths are illustrative.
export function createInstallation({container,chapters,reducedMotion,getState,onAdvance,onInterrupt}) {
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.08;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  const scene=new THREE.Scene();
  scene.background=new THREE.Color('#e8ede6');
  scene.fog=new THREE.Fog('#e8ede6',18,38);
  const camera=new THREE.PerspectiveCamera(34,1,.05,90);
  const target=new THREE.Vector3(...chapters[0].target);
  scene.add(new THREE.HemisphereLight('#e5efff','#877458',1.5));
  const sun=new THREE.DirectionalLight('#fff1d5',3.5);
  sun.position.set(-4,8,5);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:.5,far:22});
  sun.shadow.bias=-.00015;sun.shadow.normalBias=.012;sun.shadow.radius=3;
  scene.add(sun);
  const fill=new THREE.DirectionalLight('#e5f1ff',.85);fill.position.set(5,4,1);scene.add(fill);
  const rim=new THREE.DirectionalLight('#fff5db',1.4);rim.position.set(1,5,-4);scene.add(rim);

  // A soft studio environment gives stainless steel and painted enclosures real reflections.
  const envScene=new THREE.Scene();envScene.background=new THREE.Color('#c3cec7');
  function card(w,h,x,y,z,color,intensity=1){
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide}));
    m.material.color.multiplyScalar(intensity);m.position.set(x,y,z);m.lookAt(0,1,0);envScene.add(m);
  }
  card(7,10,-6,4,1,'#ffffff',2.6);card(3,9,5,3,2,'#f0f7ff',2);card(10,6,0,7,-4,'#fff5e4',2);
  card(10,5,1,-4,0,'#686a50',.7);card(1.4,8,-2,2,5,'#27362e',.6);
  const pmrem=new THREE.PMREMGenerator(renderer);
  const environment=pmrem.fromScene(envScene,.025,.1,50);scene.environment=environment.texture;scene.environmentIntensity=.65;
  pmrem.dispose();envScene.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
  let seed=9821;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
  const mat=(color,roughness=.5,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
  function texture(kind){
    const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');
    const base={wood:'#a5a596',stone:'#b9b8b1',soil:'#b3a18a',grass:'#c3c9a9',plastic:'#b8bbb7',metal:'#c4c9c6'};
    g.fillStyle=base[kind]||base.stone;g.fillRect(0,0,512,512);
    for(let i=0;i<24000;i++){
      const bright=rand()>.5,alpha=rand()*(kind==='soil'?.24:kind==='grass'?.18:.10);
      g.fillStyle=`rgba(${bright?'255,255,245':'28,32,20'},${alpha})`;
      const x=rand()*512,y=rand()*512;
      g.fillRect(x,y,kind==='wood'?12+rand()*65:kind==='metal'?8+rand()*25:1+rand()*2,kind==='wood'||kind==='metal'?.35+rand()*.5:1+rand()*2);
    }
    if(kind==='wood')for(let j=0;j<130;j++){
      const y=rand()*512;g.strokeStyle=`rgba(52,58,32,${.02+rand()*.04})`;g.lineWidth=.4+rand()*.7;g.beginPath();g.moveTo(0,y);for(let x=0;x<=512;x+=16)g.lineTo(x,y+Math.sin(x*.018+j)*1.2);g.stroke();
    }
    if(kind==='grass')for(let i=0;i<8500;i++){
      const x=rand()*512,y=rand()*512;g.strokeStyle=rand()>.5?'#8f9e7c55':'#f0edca55';g.lineWidth=.5;g.beginPath();g.moveTo(x,y);g.lineTo(x+(rand()-.5)*3,y-2-rand()*5);g.stroke();
    }
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;
  }
  const grain=texture('wood'),aggregate=texture('stone');grain.repeat.set(1,1);aggregate.repeat.set(2,2);
  const M={wood:mat('#62694c',.87),post:mat('#505b40',.85),pvc:mat('#d9d9bd',.45),conduit:mat('#b8bab2',.4,.15),black:mat('#252d2e',.34,.08),rubber:mat('#1c2426',.7),green:mat('#28905d',.33,.12),steel:mat('#a4b2af',.28,.82),chrome:mat('#d9e0dc',.18,1),brass:mat('#a88c4b',.3,.75),white:mat('#e8e9e1',.32,.15),red:mat('#b81e2d',.3,.05),blue:mat('#153b6e',.34,.15),concrete:mat('#b6b3a5',.95),soil:mat('#9a8368',1),topsoil:mat('#776e50',1),grass:mat('#9ca784',1),water:new THREE.MeshPhysicalMaterial({color:'#328fa1',metalness:.25,roughness:.2,transparent:true,opacity:.78,clearcoat:1}),flow:new THREE.MeshBasicMaterial({color:'#66e3ee'}),signal:new THREE.MeshBasicMaterial({color:'#a9c97d'})};
  const turfTexture=texture('grass'),soilTexture=texture('soil'),plasticTexture=texture('plastic'),brushedTexture=texture('metal');
  turfTexture.repeat.set(5,5);soilTexture.repeat.set(3,3);plasticTexture.repeat.set(3,3);brushedTexture.repeat.set(2,1);
  M.pipeGrey=mat('#555b58',.46,.05);
  for(const m of [M.pipeGrey,M.black,M.green,M.white]){m.bumpMap=plasticTexture;m.bumpScale=.0014;m.roughnessMap=plasticTexture;}
  for(const m of [M.steel,M.chrome]){m.bumpMap=brushedTexture;m.bumpScale=.0009;m.roughnessMap=brushedTexture;}
  M.wood.map=grain;M.wood.bumpMap=grain;M.wood.bumpScale=.0045;
  M.concrete.map=aggregate;M.concrete.bumpMap=aggregate;M.concrete.bumpScale=.018;
  M.soil.map=soilTexture;M.soil.bumpMap=soilTexture;M.soil.bumpScale=.022;
  M.grass.map=turfTexture;M.grass.bumpMap=turfTexture;M.grass.bumpScale=.008;
  function mesh(geo,material,parent=scene){const m=new THREE.Mesh(geo,material);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  const boxCache=new Map();
  function roundedGeo(w,h,d,r){
    const key=[w,h,d,r].join(',');if(boxCache.has(key))return boxCache.get(key);
    const x=-w/2+r,y=-h/2+r,a=w/2-r,b=h/2-r;
    const s=new THREE.Shape();s.moveTo(x+r,y);s.lineTo(a-r,y);s.quadraticCurveTo(a,y,a,y+r);s.lineTo(a,b-r);s.quadraticCurveTo(a,b,a-r,b);s.lineTo(x+r,b);s.quadraticCurveTo(x,b,x,b-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
    const geo=new THREE.ExtrudeGeometry(s,{depth:Math.max(.001,d-2*r),bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:r,bevelThickness:r,curveSegments:4});geo.translate(0,0,-d/2+r);boxCache.set(key,geo);return geo;
  }
  function box(w,h,d,x,y,z,m,parent=scene,bevel=0){const o=mesh(bevel?roundedGeo(w,h,d,Math.min(bevel,w/5,h/5,d/3)):new THREE.BoxGeometry(w,h,d),m,parent);o.position.set(x,y,z);return o;}
  function cyl(r,h,x,y,z,m,parent=scene,rTop=r,segments=48){const o=mesh(new THREE.CylinderGeometry(rTop,r,h,segments),m,parent);o.position.set(x,y,z);return o;}
  function rod(a,b,r,m,parent=scene,segments=20){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b);const o=cyl(r,av.distanceTo(bv),0,0,0,m,parent,r,segments);o.position.copy(av).add(bv).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),bv.sub(av).normalize());return o;}
  function path(points,r,m,parent=scene){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),false,'centripetal');const o=mesh(new THREE.TubeGeometry(curve,Math.max(36,points.length*14),r,12,false),m,parent);return {curve,mesh:o};}
  // Pipe elbows follow straight sections with short, controlled bend radii.
  function pipe(points,r,m,parent=scene,bend=.08){
    const p=points.map(x=>new THREE.Vector3(...x));const curve=new THREE.CurvePath();let start=p[0];
    for(let i=1;i<p.length-1;i++){
      const prev=p[i-1],v=p[i],next=p[i+1];const radius=Math.min(bend,v.distanceTo(prev)*.35,v.distanceTo(next)*.35);
      const a=v.clone().add(prev.clone().sub(v).normalize().multiplyScalar(radius)),b=v.clone().add(next.clone().sub(v).normalize().multiplyScalar(radius));
      curve.add(new THREE.LineCurve3(start,a));curve.add(new THREE.QuadraticBezierCurve3(a,v,b));start=b;
    }
    curve.add(new THREE.LineCurve3(start,p.at(-1)));const o=mesh(new THREE.TubeGeometry(curve,Math.max(48,p.length*16),r,16,false),m,parent);return {curve,mesh:o};
  }
  function ring(r,t,x,y,z,m,parent=scene,axis='y'){
    const o=mesh(new THREE.TorusGeometry(r,t,8,48),m,parent);if(axis==='y')o.rotation.x=Math.PI/2;if(axis==='x')o.rotation.y=Math.PI/2;o.position.set(x,y,z);return o;
  }
  function bolt(x,y,z,parent=scene){const o=cyl(.011,.01,x,y,z,M.chrome,parent,.011,6);o.rotation.x=Math.PI/2;ring(.014,.0025,x,y,z-.003,M.chrome,parent,'z');return o;}
  function label(text,w,h,x,y,z,fg='#455047',bg='#e6e7df',parent=scene){
    const c=document.createElement('canvas');c.width=1024;c.height=256;const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,1024,256);g.fillStyle=fg;g.font='600 85px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText(text,512,132,960);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;
    const o=mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:t,roughness:.55}),parent);o.position.set(x,y,z);o.castShadow=false;return o;
  }
  function capsule(r,h,x,y,z,m,parent=scene){
    const points=[];for(let i=0;i<=10;i++){const a=-Math.PI/2+i*Math.PI/20;points.push(new THREE.Vector2(r*Math.cos(a),-h/2+r+r*Math.sin(a)));}
    points.push(new THREE.Vector2(r,h/2-r));for(let i=1;i<=10;i++){const a=i*Math.PI/20;points.push(new THREE.Vector2(r*Math.cos(a),h/2-r+r*Math.sin(a)));}
    const o=mesh(new THREE.LatheGeometry(points,64),m,parent);o.position.set(x,y,z);return o;
  }
  // Surface and exposed earth: a sectional window shows the equipment genuinely below grade.
  const terrain=new THREE.Group();scene.add(terrain);
  const meterLocations=[...WELL_SENSOR_POINTS.map(([x,y,z])=>[x,z]),[1.24,1.55]];
  const meterOpenings=[[WELL_BOX.x,WELL_BOX.z,WELL_BOX.length/2+.025,WELL_BOX.width/2+.025],[1.24,1.55,.36,.30]];
  // Subtract real openings from every earth layer; the rims remain flush with turf.
  const earth=(w,d,x,z)=>{
    let pieces=[[x-w/2,x+w/2,z-d/2,z+d/2]];
    for(const [hx,hz,halfX,halfZ] of meterOpenings){const hole=[hx-halfX,hx+halfX,hz-halfZ,hz+halfZ];
      pieces=pieces.flatMap(([l,r,t,b])=>{const L=Math.max(l,hole[0]),R=Math.min(r,hole[1]),T=Math.max(t,hole[2]),B=Math.min(b,hole[3]);if(L>=R||T>=B)return [[l,r,t,b]];
        return [[l,L,t,b],[R,r,t,b],[L,R,t,T],[L,R,B,b]].filter(p=>p[1]-p[0]>.0001&&p[3]-p[2]>.0001);});
    }
    for(const [l,r,t,b] of pieces){const width=r-l,depth=b-t,cx=(l+r)/2,cz=(t+b)/2;box(width,1.48,depth,cx,-.79,cz,M.soil,terrain);box(width,.12,depth,cx,-.11,cz,M.topsoil,terrain);box(width,.055,depth,cx,-.022,cz,M.grass,terrain);}
  };
  // One continuous lawn below the boards; the only cutaway surrounds the remote tank.
  // Leave a real below-grade window in the ornamental drip garden.
  earth(8.2,4.15,-1.9,-.075);
  earth(2.8,.45,3.6,-1.925);
  earth(.2,2.35,4.9,-.525);
  earth(2.8,1.35,3.6,1.325);
  earth(3.55,2.7,-4.225,3.35);
  earth(4.1,2.7,2.95,3.35);
  box(11,.12,6.85,-.5,-1.59,1.275,M.soil,terrain);
  for(const [y,h,col] of [[-.40,.035,'#b19b7a'],[-.96,.05,'#a68c6e'],[-1.33,.025,'#877762']]){
    box(3.55,h,.012,-4.225,y,4.706,mat(col,1),terrain);
    box(4.1,h,.012,2.95,y,4.706,mat(col,1),terrain);
  }
  // Quiet, deliberately softened landscaping behind the subject.
  const landscape=new THREE.Group();scene.add(landscape);
  const landscapeGround=mesh(new THREE.PlaneGeometry(100,100),mat('#c6cdbb',1),landscape);landscapeGround.rotation.x=-Math.PI/2;landscapeGround.position.y=-1.67;landscapeGround.castShadow=false;
  const rearGround=mesh(new THREE.PlaneGeometry(60,32),mat('#bcc7a8',1),landscape);rearGround.rotation.x=-Math.PI/2;rearGround.position.set(0,-.06,-18.15);rearGround.castShadow=false;
  const bark=mat('#7c816d',1),leafMats=['#9cab8c','#a9b497','#bac1a6'].map(c=>mat(c,1));
  for(let n=0;n<19;n++){
    const x=-10+rand()*20,z=-4-rand()*10,height=3.2+rand()*3.3;const tree=new THREE.Group();tree.position.set(x,-.06,z);landscape.add(tree);
    cyl(.065,height,0,height/2,0,bark,tree,.035,10);
    for(let j=0;j<5;j++){const a=j*2.4+rand(),y=height*(.45+j*.07),dx=Math.cos(a)*.6,dz=Math.sin(a)*.6;rod([0,y,0],[dx,y+.75,dz],.021,bark,tree,8);}
    for(let j=0;j<24;j++){
      const a=j*2.399,r=.2+rand()*.85;const o=mesh(new THREE.IcosahedronGeometry(.36,2),leafMats[n%3],tree);o.position.set(Math.cos(a)*r,height-1.3+rand()*1.8,Math.sin(a)*r);o.scale.set(.9+rand()*.55,1+rand()*.5,.8+rand()*.5);o.castShadow=false;
    }
  }
  for(let i=0;i<16;i++){const o=mesh(new THREE.IcosahedronGeometry(.25+rand()*.2,2),leafMats[i%3],landscape);o.position.set(-5+rand()*10,.08,-2.4-rand()*1.5);o.scale.y=.6;o.castShadow=false;}
  const control=new THREE.Group();scene.add(control);
  const filter=new THREE.Group();filter.position.set(.25,0,-.65);filter.rotation.y=-Math.PI/2;scene.add(filter);
  box(2.4,1.48,.065,-.95,1.12,-.65,M.wood,control,.009);
  box(1.84,1.48,.065,.92,1.12,0,M.wood,filter,.009);
  for(const x of [-2.14,-.96,.23])box(.09,1.94,.09,x,.91,-.69,M.post,control,.004);
  for(const x of [0,.92,1.8])box(.09,1.94,.09,x,.91,-.035,M.post,filter,.004);
  for(const x of [-2.06,-.94,.15])for(const y of [.43,1.15,1.79])bolt(x,y,-.608,control);
  for(const x of [.07,.9,1.72])for(const y of [.43,1.12,1.79])bolt(x,y,.043,filter);
  box(2.35,.11,.04,-.95,.24,-.67,M.post,control);box(1.8,.11,.04,.92,.24,-.02,M.post,filter);
  function enclosure(w,h,d,x,y,z,parent=control){
    box(w,h,d,x,y,z,M.white,parent,.012);
    box(w-.015,h-.015,.013,x,y,z+d/2+.005,M.white,parent,.004);
    for(const sy of [-1,1])box(.016,.045,.024,x-w/2-.002,y+sy*h*.33,z+d/2-.014,M.steel,parent,.003);
    const latch=cyl(.012,.013,x+w*.37,y,z+d/2+.017,M.chrome,parent);latch.rotation.x=Math.PI/2;
  }
  // Closed doors, relative heights and the single straight conduit match the installation photographs.
  enclosure(.28,.36,.16,-1.75,1.04,-.50);
  for(const [y,color] of [[1.12,'#22a64e'],[1.035,'#2158a4']]){
    ring(.021,.004,-1.82,y,-.406,M.chrome,control,'z');const b=cyl(.018,.014,-1.82,y,-.398,mat(color,.23),control);b.rotation.x=Math.PI/2;
  }
  box(.30,.63,.19,-1.17,1.23,-.49,M.blue,control,.012);
  box(.285,.60,.036,-1.17,1.23,-.378,M.white,control,.009);
  box(.32,.075,.22,-1.17,1.565,-.48,M.white,control,.007);
  label('PUMP CONTROL',.238,.06,-1.17,1.365,-.354,'#ffffff','#3e8795',control);
  label('PUMP CONTROLLER',.22,.045,-1.17,1.427,-.354,'#35444c','#e6e9df',control);
  box(.048,.033,.006,-1.21,1.478,-.353,M.black,control,.001);
  label('READY',.04,.014,-1.21,1.478,-.348,'#bfd3b6','#28332f',control);
  label('SERVICE / SAFETY',.20,.026,-1.17,.96,-.353,'#826f4e','#e9dfbb',control);
  enclosure(.51,.43,.18,-.48,1.47,-.49);
  label('SMART CONTROL',.16,.035,-.355,1.315,-.383,'#4c5b76','#e8e9e1',control);
  label('IRRIGATION CONTROL',.18,.035,-.52,1.49,-.383,'#7e8179','#e8e9e1',control);
  cyl(.033,.10,-.65,1.735,-.49,M.black,control);
  enclosure(.23,.21,.11,-.43,1.00,-.52);
  label('CONNECTIONS',.19,.026,-.43,1.045,-.453,'#e9e8da','#325787',control);
  for(const dx of [-.088,.088])for(const dy of [-.078,.078])bolt(-.43+dx,1+dy,-.447,control);
  pipe([[-1.60,.99,-.54],[-.55,.99,-.54]],.02,M.conduit,control);
  for(const x of [-1.57,-1.35,-.69,-.57])rod([x-.013,.99,-.54],[x+.013,.99,-.54],.025,M.conduit,control);
  rod([-.48,1.12,-.52],[-.48,1.25,-.52],.022,M.conduit,control);
  const flex=path([[-.31,1.02,-.53],[-.02,1.01,-.51],[.13,.98,-.36],[.14,.96,-.02],[.13,.94,.13]],.021,M.conduit);
  for(let i=0;i<70;i++){
    const t=i/69,p=flex.curve.getPointAt(t),o=ring(.022,.0024,p.x,p.y,p.z,M.steel);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),flex.curve.getTangentAt(t));
  }
  for(let i=0;i<3;i++)path([[-.65+i*.035,1.25,-.45],[-.64+i*.04,1.17,-.40],[-.34+i*.035,1.16,-.43],[-.36,1.25,-.48]],.005,M.rubber,control);
  // Galvanized strut channels with slotted webs and stand-off brackets.
  for(const y of [.49,.72]){
    box(1.68,.055,.028,.91,y,.06,M.steel,filter,.002);
    box(1.68,.009,.025,.91,y+.026,.085,M.chrome,filter);
    box(1.68,.009,.025,.91,y-.026,.085,M.chrome,filter);
    for(let i=0;i<25;i++)box(.038,.016,.003,.12+i*.065,y,.076,M.rubber,filter,.001);
  }
  function clamp(x,y,z,r){
    box(.24,.025,.03,x,y,.21,M.steel,filter,.002);
    for(const s of [-1,1]){rod([x+s*.085,y,.07],[x+s*.085,y,z+.07],.006,M.steel,filter);bolt(x+s*.085,y,z+.078,filter);}
    const o=ring(r+.004,.006,x,y,z,M.steel,filter,'x');o.rotation.y=0;
  }
  const bottomY=.62,bodyX=.99,bodyZ=.29;
  pipe([[.20,-.2,.29],[.20,.62,.29],[.99,.62,.29]],.045,M.black,filter);
  pipe([[.99,.95,.29],[1.55,.95,.29],[1.55,-.60,.29]],.048,M.pipeGrey,filter,.045);
  for(const y of [.83,.26])cyl(.055,.065,1.55,y,.29,M.pipeGrey,filter);
  rod([1.45,.95,.29],[1.54,.95,.29],.059,M.pipeGrey,filter);


  for(const y of [.49,.72])clamp(1.55,y,.29,.045);
  clamp(.41,.62,.29,.046);
  // Lathed, stepped filter housing and moulded ribs, instead of a stack of plain cylinders.
  const profile=[[.0,.46],[.067,.46],[.10,.48],[.126,.58],[.126,.77],[.132,.80],[.132,1.07],[.14,1.11],[.14,1.29],[.127,1.33],[.12,1.48],[.105,1.52],[.0,1.52]].map(p=>new THREE.Vector2(...p));
  const body=mesh(new THREE.LatheGeometry(profile,64),M.black,filter);body.position.set(bodyX,0,bodyZ);
  for(const y of [.75,.77,.79,1.10,1.12,1.14])ring(.134,.006,bodyX,y,bodyZ,M.black,filter);
  for(const y of [.735,1.235]){
    cyl(.155,.042,bodyX,y,bodyZ,M.green,filter);
    for(let i=0;i<10;i++){const a=i*Math.PI/5,x=bodyX+Math.cos(a)*.151,z=bodyZ+Math.sin(a)*.151;box(.025,.025,.025,x,y,z,M.green,filter,.003);}
    for(const x of [bodyX-.155,bodyX+.155]){box(.045,.048,.06,x,y,bodyZ,M.green,filter,.005);bolt(x,y,bodyZ+.034,filter);}
  }
  cyl(.078,.065,bodyX,1.55,bodyZ,M.green,filter);
  for(let i=0;i<16;i++){const a=i*Math.PI/8;rod([bodyX+Math.cos(a)*.078,1.52,bodyZ+Math.sin(a)*.078],[bodyX+Math.cos(a)*.078,1.58,bodyZ+Math.sin(a)*.078],.004,M.green,filter);}
  cyl(.027,.25,bodyX,1.72,bodyZ,M.black,filter);ring(.030,.005,bodyX,1.845,bodyZ,M.steel,filter);
  label('AUTO FILTER',.18,.055,bodyX,.57,bodyZ+.128,'#e7e8df','#252d2e',filter);
  label('FILTER',.075,.055,bodyX,1.035,bodyZ+.137,'#ffffff','#a12732',filter);
  label('SERVICE',.075,.06,bodyX,1.41,bodyZ+.12,'#ffffff','#a12732',filter);
  pipe([[bodyX,1.17,.29],[.80,1.17,.29],[.77,1.06,.43],[.77,-.12,.43]],.036,M.black,filter,.055);
  cyl(.047,.065,.77,1.025,.43,M.steel,filter);
  const sideRing=ring(.052,.009,.83,1.17,.29,M.green,filter,'x');
  const actuator=cyl(.075,.055,.80,.97,.31,M.steel,filter);actuator.rotation.x=Math.PI/2;
  const motorFace=cyl(.058,.009,.80,.97,.344,M.black,filter);motorFace.rotation.x=Math.PI/2;
  for(let i=0;i<6;i++){const a=i*Math.PI/3;bolt(.80+Math.cos(a)*.065,.97+Math.sin(a)*.065,.349,filter);}
  function valve(x,y,material=M.black){
    rod([x-.09,y,.29],[x+.09,y,.29],.066,material,filter);
    for(const dx of [-.072,.072]){
      rod([x+dx-.02,y,.29],[x+dx+.02,y,.29],.078,material,filter);
      for(let i=0;i<24;i++){const a=i*Math.PI/12;rod([x+dx-.018,y+Math.cos(a)*.077,.29+Math.sin(a)*.077],[x+dx+.018,y+Math.cos(a)*.077,.29+Math.sin(a)*.077],.002,material,filter);}
    }
    cyl(.023,.072,x,y+.075,.29,M.black,filter);box(.22,.023,.049,x,y+.12,.29,M.red,filter,.007);cyl(.013,.009,x,y+.136,.29,M.red,filter);
  }
  valve(.71,.62);valve(1.32,.95,M.pipeGrey);
  cyl(.02,.11,.35,.72,.29,M.brass,filter);
  capsule(.115,.32,.35,.94,.29,M.chrome,filter);
  ring(.115,.004,.35,.91,.29,M.steel,filter);
  cyl(.033,.024,.35,1.109,.29,M.black,filter);
  label('PRESSURE TANK',.16,.043,.35,.98,.405,'#626964','#dfe2d9',filter);
  for(const y of [.94,.95,.96,.97,.98])label('â€” â€” â€” â€” â€”',.13,.006,.35,y,.406,'#747c77','#dfe2d9',filter);
  rod([.34,.62,.29],[.53,.62,.29],.029,M.brass,filter);
  rod([.44,.62,.29],[.44,.57,.43],.019,M.brass,filter);
  const drain=cyl(.024,.035,.44,.57,.44,M.brass,filter);drain.rotation.x=Math.PI/2;
  ring(.019,.004,.44,.57,.465,M.red,filter,'z');
  const gauge=cyl(.041,.024,.54,.68,.39,M.chrome,filter);gauge.rotation.x=Math.PI/2;
  const dial=cyl(.036,.003,.54,.68,.405,M.white,filter);dial.rotation.x=Math.PI/2;
  for(let i=0;i<11;i++){const a=-2.1+i*.42;rod([.54+Math.sin(a)*.027,.68+Math.cos(a)*.027,.408],[.54+Math.sin(a)*.032,.68+Math.cos(a)*.032,.408],.0014,M.black,filter,6);}
  rod([.54,.68,.411],[.526,.698,.411],.0018,M.black,filter,8);
  enclosure(.15,.17,.085,.57,1.03,.09,filter);
  for(const x of [.515,.625])for(const y of [.967,1.093])bolt(x,y,.145,filter);
  for(let i=0;i<3;i++)path([[.57+i*.015,.94,.14],[.66,.83,.21],[.82+i*.02,.86,.39],[.80,.94,.35]],.004,M.rubber,filter);
  path([[.99,1.63,.26],[1.12,1.45,.24],[1.11,1.0,.23],[.82,.9,.35]],.0045,M.rubber,filter);
  // Photo-based vertical conduit drops, couplings and the small communications enclosure.
  for(const [x,top,r] of [[-1.75,.86,.024],[-1.17,.91,.022],[-.43,.89,.018]]){
    rod([x,-.08,-.52],[x,top,-.52],r,M.conduit,control);
    for(const y of [.12,.47])cyl(r*1.24,.055,x,y,-.52,M.conduit,control);
  }
  enclosure(.13,.18,.08,-.12,1.16,-.51);
  box(.105,.125,.016,-.12,1.16,-.458,M.black,control,.005);
  path([[-.48,1.26,-.43],[-.37,1.19,-.42],[-.17,1.19,-.43]],.005,M.rubber,control);
  // Below-grade inspection boxes, open at the turf with a sectioned front wall.
  function sensorBox(x,z){
    const g=new THREE.Group();g.position.set(x,-.673,z);scene.add(g);
    const green=mat('#3f685c',.85),gravel=mat('#a1a395',.95);
    box(.70,.035,.58,0,0,0,gravel,g);
    box(.025,.65,.58,.34,.34,0,green,g,.004);
    box(.025,.13,.58,-.34,.08,0,green,g,.004);
    box(.70,.65,.025,0,.34,-.28,green,g,.004);
    box(.70,.13,.025,0,.08,.28,green,g,.004);
    // Fine rim outlines the true surface opening, while its front face is cut away.
    for(const dx of [-.35,.35])box(.035,.028,.61,dx,.671,0,green,g,.003);
    for(const dz of [-.29,.29])box(.72,.028,.035,0,.671,dz,green,g,.003);
    for(let i=0;i<50;i++){const pebble=mesh(new THREE.IcosahedronGeometry(.014+rand()*.009,0),gravel,g);pebble.position.set((rand()-.5)*.61,.023,(rand()-.5)*.48);pebble.scale.y=.6;}
    rod([-.36,.073,0],[.36,.073,0],.031,M.pvc,g);
    cyl(.041,.07,0,.11,0,M.pvc,g);ring(.029,.005,0,.149,0,M.black,g);
    for(const dx of [-.12,.12]){const u=cyl(.04,.025,dx,.073,0,M.pvc,g);u.rotation.z=Math.PI/2;}
    path([[0,.15,0],[.06,.18,.04],[.25,.20,-.18]],.004,M.red,g);
    path([[0,.15,0],[-.05,.19,.03],[-.25,.17,-.18]],.004,M.blue,g);
    const lidGroup=new THREE.Group();lidGroup.position.set(x>0?-.05:.78,.679,x>0?-.76:0);lidGroup.rotation.y=.12;g.add(lidGroup);
    box(.66,.025,.54,0,0,0,green,lidGroup,.012);
    for(let i=0;i<8;i++)box(.47,.003,.008,0,.016,-.20+i*.055,green,lidGroup);
    return g;
  }
  // Preserve the outgoing box exactly, including its original gravel arrangement.
  // The two retired well boxes consumed 300 random samples before this box.
  for(let i=0;i<300;i++)rand();
  sensorBox(...meterLocations[2]);
  const {feedCurves}=buildWellSupply({scene,M,mesh,box,cyl,rod,path,pipe,ring,mat});
  const tank=new THREE.Group();tank.position.set(-.68,-1.43,3.05);scene.add(tank);
  box(2.52,.10,1.38,0,.05,0,M.concrete,tank,.012);
  box(2.52,1.01,.09,0,.55,-.65,M.concrete,tank,.006);
  for(const x of [-1.215,1.215])box(.09,1.01,1.38,x,.55,0,M.concrete,tank,.007);
  // Front wall intentionally sectioned at the water line; it never reads as an above-ground tank.
  box(2.52,.12,.09,0,.16,.65,M.concrete,tank,.005);
  const water=box(2.31,.57,1.15,0,.40,0,M.water,tank);
  const waterSurface=mesh(new THREE.PlaneGeometry(2.30,1.14,40,20),new THREE.MeshPhysicalMaterial({color:'#7cc8cb',roughness:.15,metalness:.35,transparent:true,opacity:.65,side:THREE.DoubleSide}),tank);waterSurface.rotation.x=-Math.PI/2;waterSurface.position.y=.691;
  for(const x of [-.42,.42])box(.06,.23,1.24,x,.92,0,M.concrete,tank);
  // The rear roof remains solid; the front roof is removed in this architectural section.
  box(2.56,.10,.62,0,1.10,-.34,M.concrete,tank,.009);
  for(const x of [-.82,0]){
    cyl(.18,.32,x,1.29,-.30,M.concrete,tank);cyl(.19,.033,x,1.46,-.30,M.steel,tank);
    ring(.163,.008,x,1.48,-.30,M.steel,tank);rod([x-.045,1.484,-.30],[x+.045,1.484,-.30],.006,M.black,tank);
  }
  const roofGhost=box(2.56,.06,.72,0,1.10,.32,new THREE.MeshStandardMaterial({color:'#aab7aa',transparent:true,opacity:.09,depthWrite:false}),tank);
  const pump=capsule(.067,.31,.90,.27,.10,M.chrome,tank);ring(.066,.009,.90,.19,.10,M.black,tank);
  for(let i=0;i<5;i++)ring(.068,.003,.90,.30+i*.02,.10,M.black,tank);
  pipe([[.90,.43,.10],[.90,.85,.10],[.90,.85,-.62]],.027,M.black,tank);
  // Keep raw tank water on the inlet side, spatially separate from the filtered mainline.
  const outletPoints=[[.22,-.58,3.15],[.22,-.58,2.35],[-.85,-.58,2.35],[-.85,-.58,-.90],[-.04,-.58,-.90],[-.04,-.58,-.45],[-.04,-.20,-.45]];
  const outlet=pipe(outletPoints,.036,M.black,scene,.1);
  // Grade guide stays at the turf elevation, above the complete concrete chamber.
  const grade=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-2.35,.005,3.82),new THREE.Vector3(.75,.005,3.82)]),new THREE.LineDashedMaterial({color:'#7f8b71',dashSize:.07,gapSize:.045,transparent:true,opacity:.7}));grade.computeLineDistances();scene.add(grade);
  // Subtle flow trails follow the physical routes. No narration or live-data claims.
  const trails=[];
  function flow(curve,parent,count=14,kind='supply'){
    const dots=[];const material=new THREE.MeshBasicMaterial({color:'#52d1df'});
    const line=new THREE.Mesh(new THREE.TubeGeometry(curve,80,.011,8,false),new THREE.MeshBasicMaterial({color:'#218fa9',transparent:true,opacity:.68,depthTest:false}));line.renderOrder=5;parent.add(line);
    for(let i=0;i<count;i++){const d=new THREE.Mesh(new THREE.SphereGeometry(.014,10,8),material);d.material.depthTest=false;d.renderOrder=6;parent.add(d);dots.push(d);}trails.push({curve,line,dots,kind});
  }
  feedCurves.forEach(c=>flow(c,scene,13));flow(outlet.curve,scene,13,'irrigation-inlet');
  const filterFlow=pipe([[.20,-.20,.29],[.20,.62,.29],[.99,.62,.29],[.99,.95,.29],[1.55,.95,.29],[1.55,-.60,.29]],.001,M.black,filter,.07);filterFlow.mesh.visible=false;flow(filterFlow.curve,filter,18,'filter');
  const landscapeDemo=buildLandscape({scene,M,mesh,box,cyl,rod,path,pipe,ring,mat,flow});
  const signalCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-1.75,1.24,-.40),new THREE.Vector3(-1.3,1.84,-.40),new THREE.Vector3(-.72,1.85,-.40),new THREE.Vector3(-.48,1.72,-.40)]);
  const signalLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints(signalCurve.getPoints(60)),new THREE.LineDashedMaterial({color:'#829768',dashSize:.025,gapSize:.04,transparent:true,opacity:.48}));signalLine.computeLineDistances();scene.add(signalLine);
  const signalDots=[];for(let i=0;i<3;i++){const d=new THREE.Mesh(new THREE.SphereGeometry(.014,10,8),M.signal);scene.add(d);signalDots.push(d);}
  const pins=[
    {id:'label-meter-1',p:[WELL_BOX.x,.13,WELL_BOX.z],meter:true},
    {id:'label-meter-3',p:[1.24,.13,1.55],meter:true},
    {id:'pin-storage',p:[-1.25,-.78,3.70],step:1},
    {id:'pin-filtration',p:[-.08,1.76,.34],step:2},
    {id:'pin-control',p:[-1.1,1.88,-.58],step:3},
    {id:'label-well-1',p:[-4.7,.56,-.25],step:1,ambient:true},
    {id:'label-well-2',p:[-4.7,.56,2.1],step:1,ambient:true},
    {id:'label-grade',p:[.74,.015,3.82],step:1,ambient:true},
    {id:'pin-zones',p:[3.4,1.0,1.6],step:4},
    {id:'label-zone-1',p:[3.5,.25,.54],step:4,zone:true},
    {id:'label-zone-2',p:[4.20,.25,1.65],step:4,zone:true},
    {id:'label-zone-3',p:[4.20,.25,3.70],step:4,zone:true}
  ];
  let landscapeDetail=null,meterDetail=null,photoDetail=null;
  const componentLayer=document.createElement('div');componentLayer.className='model-component-layer';componentLayer.setAttribute('aria-hidden','true');container.append(componentLayer);
  const componentLines=document.createElementNS('http://www.w3.org/2000/svg','svg');componentLayer.append(componentLines);
  let componentLabels=[];
  function setComponentLabels(items){
    componentLayer.querySelectorAll('.component-marker').forEach(el=>el.remove());componentLines.replaceChildren();
    componentLabels=items.map(item=>{const el=document.createElement('span');el.className='component-marker';el.dataset.component=item.id;el.textContent=item.number;el.title=item.name;componentLayer.append(el);const line=document.createElementNS('http://www.w3.org/2000/svg','line');componentLines.append(line);return {...item,el,line};});
  }
  let transition=null,activeStep=0,clock=0,last=performance.now(),tourTime=0,wasPlaying=false,pointer=null;
  const spherical=new THREE.Spherical();
  function fitCamera(position,index){
    const p=new THREE.Vector3(...position),anchor=new THREE.Vector3(...chapters[index].target);
    const aspect=container.clientWidth/container.clientHeight;
    const scale=aspect<1.15?(index<2?Math.max(1,1.12/aspect):Math.max(1,(index===4?1.2:1)/aspect)):1;
    return p.sub(anchor).multiplyScalar(Math.min(1.65,scale)).add(anchor);
  }
  function focus(index){
    activeStep=index;landscapeDetail=null;meterDetail=null;photoDetail=null;tourTime=0;
    transition={start:performance.now(),from:camera.position.clone(),to:fitCamera(chapters[index].camera,index),targetFrom:target.clone(),targetTo:new THREE.Vector3(...chapters[index].target)};
    if(reducedMotion){camera.position.copy(transition.to);target.copy(transition.targetTo);transition=null;}
  }
  function focusMeter(index){
    const [x,z]=meterLocations[index];meterDetail=index;landscapeDetail=null;photoDetail=null;
    activeStep=index===2?2:1;
    const to=index===2?new THREE.Vector3(x-.42,1.65,z+.015):new THREE.Vector3(WELL_BOX.x-1.50,1.65,WELL_BOX.z+.04);
    const anchor=index===2?new THREE.Vector3(x,-.27,z):new THREE.Vector3(WELL_BOX.x,-.17,WELL_BOX.z-.12);
    if(index!==2&&camera.aspect<1)to.sub(anchor).multiplyScalar(Math.min(1.45,1/camera.aspect)).add(anchor);
    transition={start:performance.now(),from:camera.position.clone(),to,targetFrom:target.clone(),targetTo:anchor};
    if(reducedMotion){camera.position.copy(transition.to);target.copy(transition.targetTo);transition=null;}
  }
  // Supporting photographs have dedicated poses; preserve their selection on reset/resize.
  function focusPhoto(file){
    const defaults={'underground-storage.jpg':1,'filter-detail.jpg':2,'control-panel.jpg':3,'assembled-system.jpg':0};
    if(file==='flow-meter.jpg'){focusMeter(2);return;}
    if(file==='well-flow-meters.jpg'){focusMeter(0);return;}
    if(file in defaults){focus(defaults[file]);return;}
    const views={
      'cistern-roof-installation.jpg':{camera:[-3.55,3.2,4.9],target:[-.68,-.68,3.05]},
      'cistern-connections.jpg':{camera:[-.25,2.9,4.0],target:[-.13,-.55,2.96]},
      'cellular-connection.jpg':{camera:[-.38,1.63,1.62],target:[-.21,1.20,-.48]}
    };
    const view=views[file];if(!view)return;
    photoDetail=file;meterDetail=null;landscapeDetail=null;
    const to=new THREE.Vector3(...view.camera),anchor=new THREE.Vector3(...view.target);
    if(camera.aspect<1)to.sub(anchor).multiplyScalar(Math.min(1.4,1/camera.aspect)).add(anchor);
    transition={start:performance.now(),from:camera.position.clone(),to,targetFrom:target.clone(),targetTo:anchor};
    if(reducedMotion){camera.position.copy(to);target.copy(anchor);transition=null;}
  }
  function resetView(){if(photoDetail)focusPhoto(photoDetail);else if(meterDetail!==null)focusMeter(meterDetail);else if(landscapeDetail)focusLandscape(landscapeDetail);else focus(activeStep);}
  function focusLandscape(kind){
    if(!kind){focus(4);return;}
    landscapeDetail=kind;meterDetail=null;photoDetail=null;activeStep=4;tourTime=0;
    const views={drip:{camera:[.7,2.0,3.8],target:[3.48,.35,-.35]},mp:{camera:[.65,2.8,4.9],target:[3.45,.16,1.50]},rotor:{camera:[.4,3.0,6.7],target:[3.5,.17,3.45]}};
    const v=views[kind];if(!v)return;
    const to=new THREE.Vector3(...v.camera),anchor=new THREE.Vector3(...v.target);
    if(container.clientWidth/container.clientHeight<1)to.sub(anchor).multiplyScalar(1.22).add(anchor);
    transition={start:performance.now(),from:camera.position.clone(),to,targetFrom:target.clone(),targetTo:anchor};
    if(reducedMotion){camera.position.copy(to);target.copy(anchor);transition=null;}
  }
  function resize(){renderer.setSize(container.clientWidth,container.clientHeight);camera.aspect=container.clientWidth/container.clientHeight;camera.updateProjectionMatrix();if(photoDetail)focusPhoto(photoDetail);else if(meterDetail!==null)focusMeter(meterDetail);else if(activeStep===4&&landscapeDetail)focusLandscape(landscapeDetail);else focus(activeStep);}
  new ResizeObserver(resize).observe(container);camera.position.copy(fitCamera(chapters[0].camera,0));resize();
  container.addEventListener('pointerdown',e=>{pointer={x:e.clientX,y:e.clientY,id:e.pointerId};transition=null;container.setPointerCapture(e.pointerId);onInterrupt();});
  container.addEventListener('pointermove',e=>{if(!pointer||pointer.id!==e.pointerId)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;spherical.setFromVector3(camera.position.clone().sub(target));spherical.theta-=dx*.006;spherical.phi=Math.max(.38,Math.min(1.48,spherical.phi+dy*.005));camera.position.copy(target).add(new THREE.Vector3().setFromSpherical(spherical));pointer.x=e.clientX;pointer.y=e.clientY;});
  container.addEventListener('pointerup',()=>pointer=null);container.addEventListener('pointercancel',()=>pointer=null);
  container.addEventListener('wheel',e=>{if(!e.ctrlKey&&!e.metaKey)return;e.preventDefault();transition=null;const v=camera.position.clone().sub(target);v.multiplyScalar(e.deltaY>0?1.06:.94);v.clampLength(2,23);camera.position.copy(target).add(v);},{passive:false});
  const waterPositions=waterSurface.geometry.attributes.position;const initialWater=new Float32Array(waterPositions.array);
  function animate(now){
    requestAnimationFrame(animate);const dt=Math.max(0,Math.min((now-last)/1000,.05));last=now;const state=getState();
    if(!state.motionPaused)clock+=dt;
    if(state.playing&&!wasPlaying)tourTime=0;wasPlaying=state.playing;
    if(state.playing&&!state.motionPaused){tourTime+=dt;if(tourTime>11){tourTime=0;onAdvance();}}
    if(transition){const x=Math.min((now-transition.start)/(reducedMotion?1:1400),1),e=x*x*(3-2*x);camera.position.lerpVectors(transition.from,transition.to,e);target.lerpVectors(transition.targetFrom,transition.targetTo,e);if(x===1)transition=null;}
    const storageVisible=activeStep===0||activeStep===1;
    signalLine.visible=activeStep===3;
    signalDots.forEach((d,i)=>{d.visible=activeStep===3;d.position.copy(signalCurve.getPointAt((clock*.12+i/3)%1));});
    trails.forEach((t,j)=>{const visible=activeStep===0||(activeStep===1&&t.kind==='supply')||(activeStep===2&&(t.kind==='irrigation-inlet'||t.kind==='filter'||t.kind==='distribution'))||(activeStep===4&&(t.kind==='distribution'||(t.kind==='drip'&&(landscapeDetail===null||landscapeDetail==='drip'))));t.line.visible=visible;t.dots.forEach((d,i)=>{d.visible=visible;d.position.copy(t.curve.getPointAt((clock*.11+i/t.dots.length)%1));});});
    for(let i=0;i<waterPositions.count;i++)waterPositions.setZ(i,Math.sin(initialWater[i*3]*10+clock*1.4)*Math.cos(initialWater[i*3+1]*8+clock)*.005);waterPositions.needsUpdate=true;
    landscapeDemo.update(clock,activeStep,landscapeDetail);
    roofGhost.visible=activeStep!==1;grade.visible=storageVisible;camera.lookAt(target);
    pins.forEach(pin=>{const el=document.getElementById(pin.id);if(!el)return;const p=new THREE.Vector3(...pin.p).project(camera);const offset=activeStep===0?(pin.id==='pin-control'?-34:pin.id==='pin-filtration'?34:0):0;const x=(p.x*.5+.5)*container.clientWidth+offset,y=(-p.y*.5+.5)*container.clientHeight+(activeStep===0&&pin.id==='pin-zones'?22:0);el.style.left=Math.max(55,Math.min(container.clientWidth-65,x))+'px';el.style.top=Math.max(65,Math.min(container.clientHeight-78,y))+'px';el.style.visibility=p.z>1||Math.abs(p.x)>1.08||Math.abs(p.y)>1.08||(pin.meter&&meterDetail!==null)||(pin.meter&&!(activeStep===0||activeStep===1||activeStep===2||activeStep===4&&landscapeDetail===null))||(pin.ambient&&!storageVisible)||(pin.zone&&(activeStep!==4||landscapeDetail!==null))||(pin.id==='pin-zones'&&activeStep===4)?'hidden':'visible';});
    const occupied=[];
    componentLabels.forEach(item=>{
      const p=new THREE.Vector3(...item.point).project(camera),w=container.clientWidth,h=container.clientHeight;
      const visible=p.z>-1&&p.z<1&&Math.abs(p.x)<.98&&Math.abs(p.y)<.98;
      item.el.hidden=!visible;item.line.style.display=visible?'':'none';if(!visible)return;
      const ax=(p.x*.5+.5)*w,ay=(-p.y*.5+.5)*h;
      let x=Math.max(20,Math.min(w-20,ax)),y=Math.max(55,Math.min(h-65,ay-22));
      while(occupied.some(q=>Math.hypot(q.x-x,q.y-y)<34)&&y>65)y-=34;
      occupied.push({x,y});item.el.style.left=x+'px';item.el.style.top=y+'px';
      item.line.setAttribute('x1',ax);item.line.setAttribute('y1',ay);item.line.setAttribute('x2',x);item.line.setAttribute('y2',y);
    });
    renderer.render(scene,camera);
  }
  requestAnimationFrame(animate);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();document.getElementById('fallback').hidden=false;});
  return {focus,focusLandscape,focusMeter,focusPhoto,resetView,setComponentLabels,renderer,scene};
}
