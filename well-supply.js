import * as THREE from './assets/three.module.js';

// Two separate wells share an inspection box; their water lines never merge here.
// Scene dimensions are metres: a nominal 26 by 22 inch jumbo irrigation box.
export const WELL_BOX={x:-3.35,z:.925,length:.6604,width:.5588};
const BOX_SCALE=[WELL_BOX.length/1.55,.65,WELL_BOX.width/.98];
const boxPoint=([x,y,z])=>[WELL_BOX.x+(x-WELL_BOX.x)*BOX_SCALE[0],-.002+(y+.002)*BOX_SCALE[1],WELL_BOX.z+(z-WELL_BOX.z)*BOX_SCALE[2]];
export const WELL_SENSOR_POINTS=[[-3.11,-.48,.685],[-3.11,-.48,1.165]].map(boxPoint);
const originalRoutes=[
  [[-4.7,-1.27,-.25],[-4.7,-.60,-.25],[-4.35,-.60,-.25],[-4.35,-.60,.685],[-4.125,-.60,.685],[-2.575,-.60,.685],[-2.05,-.60,.685],[-2.05,-.60,2.52],[-1.84,-.60,2.52]],
  [[-4.7,-1.27,2.1],[-4.7,-.60,2.1],[-4.35,-.60,2.1],[-4.35,-.60,1.165],[-4.125,-.60,1.165],[-2.575,-.60,1.165],[-2.35,-.60,1.165],[-2.35,-.60,2.84],[-1.84,-.60,2.84]]
];
// Keep the well heads and tank connections fixed; only adjust the box approach.
export const WELL_ROUTES=originalRoutes.map(route=>route.map((p,i)=>{
  if(i>=4&&i<=5)return boxPoint(p);
  if(i===3||i===6)return [p[0],boxPoint(p)[1],boxPoint(p)[2]];
  return p;
}));

export function buildWellSupply({scene,M,mesh,box,cyl,rod,path,pipe,ring,mat}){
  // Dedicated randomness keeps every existing downstream material and detail unchanged.
  let seed=6476;const random=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};
  const green=mat('#3f685c',.85),gravel=mat('#a1a395',.95),yellow=mat('#ddb844',.46),orange=mat('#cc652c',.7),blue=mat('#2eadd3',.5);
  const g=new THREE.Group();g.name='Shared well flow-meter box';g.position.set(WELL_BOX.x,-.673,WELL_BOX.z);scene.add(g);
  // Retain all detailed meshes, then scale the complete assembly about ground level.
  const L=1.55,W=.98;
  g.scale.set(...BOX_SCALE);g.position.y=-.002-.671*BOX_SCALE[1];
  box(L,.035,W,0,0,0,gravel,g,.008);
  box(.035,.16,W,-L/2,.10,0,green,g,.012);box(.035,.65,W,L/2,.34,0,green,g,.012);
  box(L,.65,.035,0,.34,-W/2,green,g,.012);box(L,.16,.035,0,.10,W/2,green,g,.012);
  for(const x of [-L/2,L/2])box(.05,.032,W+.05,x,.671,0,green,g,.012);
  for(const z of [-W/2,W/2])box(L+.05,.032,.05,0,.671,z,green,g,.012);
  // A loose matching cover rests on grass beside the box, clear of the water lines.
  const lid=new THREE.Group();lid.position.set(0,.679,-1.09);lid.rotation.y=.07;g.add(lid);
  box(L,.025,W,0,0,0,green,lid,.018);
  for(let i=0;i<12;i++)box(L-.16,.003,.009,0,.016,-.39+i*.07,green,lid);
  for(let i=0;i<115;i++){
    const stone=mesh(new THREE.IcosahedronGeometry(.018+random()*.015,0),gravel,g);
    stone.position.set((random()-.5)*(L-.12),.035,(random()-.5)*(W-.12));stone.scale.y=.68;
  }
  function inlineCylinder(radius,length,x,y,z,material){const o=cyl(radius,length,x,y,z,material,g);o.rotation.z=Math.PI/2;return o;}
  for(const [i,z] of [-.24,.24].entries()){
    // White PVC, an open isolation valve, then the meter: all align with +X flow to storage.
    rod([-L/2,.073,z],[L/2,.073,z],.035,M.pvc,g);
    inlineCylinder(.047,.23,-.39,.073,z,M.brass);
    cyl(.022,.065,-.39,.125,z,M.brass,g);box(.25,.022,.043,-.39,.166,z,yellow,g,.006);
    inlineCylinder(.062,.27,.24,.073,z,M.pvc);
    for(const x of [.10,.38])inlineCylinder(.068,.036,x,.073,z,M.pvc);
    cyl(.062,.11,.24,.136,z,M.pvc,g);cyl(.047,.012,.24,.197,z,M.steel,g);ring(.041,.005,.24,.205,z,M.pvc,g);
    // Direction arrows point from each well-side valve through its sensor toward the tank.
    for(const x of [-.04,.56]){
      rod([x-.065,.115,z],[x+.055,.115,z],.006,M.blue,g,8);
      rod([x+.055,.115,z],[x+.015,.115,z-.032],.006,M.blue,g,8);
      rod([x+.055,.115,z],[x+.015,.115,z+.032],.006,M.blue,g,8);
    }
    path([[.24,.21,z],[.36,.28,z+.055],[.59,.26,.40],[.69,.25,.40]],.005,M.red,g);
    path([[.24,.21,z],[.36,.25,z-.045],[.64,.23,.39]],.004,M.black,g);
    box(.18,.11,.035,.60,.19,.445,M.black,g,.004);
    for(let j=0;j<3;j++)path([[.25,.21,z],[.32,.25,z+.05],[.51,.21,.37+j*.02],[.65,.20,.39+j*.014]],.0027,[M.blue,yellow,M.white][j],g);
  }
  // Coiled orange cable, blue conduit and joined sensor wiring echo the reference photograph.
  for(let j=0;j<4;j++){
    const pts=[];for(let i=0;i<=64;i++){const a=i/64*Math.PI*2;pts.push([-.34+Math.cos(a)*(.30+j*.022),.24+j*.01,-.19+Math.sin(a)*(.19+j*.018)]);}path(pts,.012,orange,g);
  }
  path([[-.68,.14,-.36],[-.55,.20,.33],[-.10,.25,.39],[.54,.28,.34],[.66,.24,-.08],[.43,.24,-.33]],.025,blue,g);
  for(const p of [[-.62,.12,.30],[-.53,.14,.31]])cyl(.026,.07,...p,M.black,g);
  const feedCurves=[];
  for(const [i,z] of [-.25,2.1].entries()){
    const x=-4.7;
    cyl(.18,.035,x,.015,z,M.concrete);cyl(.074,1.65,x,-.50,z,M.steel);cyl(.10,.07,x,.35,z,M.green);ring(.087,.006,x,.392,z,M.steel);
    for(let j=0;j<4;j++){const a=j*Math.PI/2;cyl(.009,.013,x+Math.cos(a)*.075,.396,z+Math.sin(a)*.075,M.chrome,scene,.009,6);}
    pipe([[x+.07,.30,z],[x+.15,.30,z],[x+.15,-.17,z]],.014,M.conduit);
    const sleeve=mesh(new THREE.CylinderGeometry(.19,.19,1.45,32,1,true,0,Math.PI),M.soil);sleeve.position.set(x,-.76,z);sleeve.rotation.y=Math.PI/2;
    feedCurves.push(pipe(WELL_ROUTES[i],.03,M.black,scene,.09).curve);
    pipe(WELL_ROUTES[i],.034,new THREE.MeshStandardMaterial({color:'#238da2',roughness:.3,transparent:true,opacity:.58}),scene,.09);
  }
  return {feedCurves};
}
