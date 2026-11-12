import * as THREE from './assets/three.module.js';

// Three landscape vignettes, not a sprinkler spacing or hydraulic design.
export function buildLandscape({scene,M,mesh,box,cyl,rod,path,pipe,ring,mat,flow}){
  const garden=new THREE.Group();scene.add(garden);
  let seed=809;const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
  const stone=mat('#bdc1ad',.92),mulch=mat('#645444',1),bark=mat('#796249',.92);
  const leafColors=['#5b7951','#799365','#98aa74','#54714d'].map(c=>mat(c,.88));
  const bloomColors=['#ded8bd','#9b96b2','#bfc7a1'].map(c=>mat(c,.92));
  const leafGeo=new THREE.IcosahedronGeometry(1,1),budGeo=new THREE.IcosahedronGeometry(.025,1);
  const jets=[],wetting=[],dripDrops=[],growing=[],grassBlades=[];
  function growthGroup(children,x,z){const g=new THREE.Group();g.position.set(x,0,z);garden.add(g);garden.updateMatrixWorld(true);children.forEach(o=>g.attach(o));growing.push(g);return g;}
  function leafCloud(x,y,z,r,count=16,palette=leafColors){
    const g=new THREE.Group();garden.add(g);
    for(let j=0;j<count;j++){
      const a=j*2.399,rr=Math.sqrt(random())*r*.62;
      const o=mesh(leafGeo,palette[j%palette.length],g);o.position.set(x+Math.cos(a)*rr,y+(random()-.4)*r*.65,z+Math.sin(a)*rr);o.scale.set(r*(.30+random()*.18),r*(.30+random()*.22),r*(.30+random()*.18));o.rotation.set(random(),random()*3,random());
    }return g;
  }
  function shrub(x,z,r=.22,flowers=false){
    const g=leafCloud(x,r*.65,z,r,18);
    for(let j=0;j<5;j++)rod([x,.02,z],[x+(random()-.5)*r,.23*r/.22,z+(random()-.5)*r],.006,bark,g,8);
    if(flowers)for(let j=0;j<10;j++){const a=j*2.399;const b=mesh(budGeo,bloomColors[j%3],g);b.position.set(x+Math.cos(a)*r*.44,r*(.9+random()*.3),z+Math.sin(a)*r*.44);}
    growthGroup([g],x,z);return g;
  }
  function grassTuft(x,z,r=.09){
    for(let i=0;i<7;i++){const a=i*.9;path([[x,.02,z],[x+Math.cos(a)*r*.4,.15+random()*.1,z+Math.sin(a)*r*.4],[x+Math.cos(a)*r,.12,z+Math.sin(a)*r]],.0035,leafColors[i%4],garden);}
  }
  function border(points){pipe(points,.017,stone,garden,.07);}
  function flagstone(x,z,w=.24,d=.27){const o=box(w,.025,d,x,.026,z,stone,garden,.006);o.rotation.y=(random()-.5)*.1;}
  function lawn(x,z,w,d){
    box(w,.022,d,x,.013,z,new THREE.MeshStandardMaterial({color:'#829c6d',map:M.grass.map,bumpMap:M.grass.bumpMap,bumpScale:.004,roughness:.96}),garden,.008);
    for(let j=0;j<8;j++)box(w/8,.001,d-.02,x-w/2+w*(j+.5)/8,.025,z,mat(j%2?'#8ca774':'#829e6c',.98),garden);
    border([[x-w/2,.025,z-d/2],[x+w/2,.025,z-d/2],[x+w/2,.025,z+d/2],[x-w/2,.025,z+d/2],[x-w/2,.025,z-d/2]]);
  }
  // Shared buried mainline and three independently depicted branches.
  const mainRoute=pipe([[-.04,-.60,.90],[.68,-.60,.90],[.68,-.60,1.55],[2.03,-.60,1.55],[2.03,-.32,1.55]],.04,M.pipeGrey,scene,.12);flow(mainRoute.curve,scene,19,'distribution');
  const branches=[[[2.03,-.32,1.55],[2.03,-.32,-.6],[2.32,-.19,-.6]]];
  branches.forEach(p=>flow(pipe(p,.026,M.black,scene,.08).curve,scene,13,'distribution'));
  // DRIP GARDEN. A true below-grade window exposes roots and shallow drip tubing.
  box(2.6,.075,2.35,3.5,-.68,-.525,M.soil,garden);
  box(2.6,.62,.07,3.5,-.34,-1.67,M.soil,garden);
  for(const x of [2.23,4.77])box(.06,.62,2.35,x,-.34,-.525,M.soil,garden);
  box(2.47,.59,1.06,3.5,-.33,-1.095,M.soil,garden);
  box(2.47,.035,1.06,3.5,-.017,-1.095,mulch,garden);
  const topSection=new THREE.Group();garden.add(topSection);
  box(2.47,.04,1.10,3.5,-.015,-.015,mulch,topSection);
  // Thin translucent material suggests the original planting surface when cut away.
  const surfaceGhost=box(2.47,.014,1.10,3.5,-.01,-.015,new THREE.MeshStandardMaterial({color:'#9a8469',transparent:true,opacity:.10,depthWrite:false}),garden);
  border([[2.2,.016,.63],[2.2,.016,-1.7],[4.8,.016,-1.7],[4.8,.016,.63]]);
  // Sculptural ornamental tree, with small leaf clusters and branching silhouette.
  const treeStart=garden.children.length;
  const tx=3.92,tz=-1.03;
  path([[tx,-.05,tz],[tx-.03,.45,tz],[tx+.03,.9,tz-.015],[tx-.06,1.45,tz]],.038,bark,garden);
  for(let j=0;j<7;j++){
    const a=j*2.399,dx=Math.cos(a)*(.32+random()*.17),dz=Math.sin(a)*(.30+random()*.15),h=1.05+random()*.45;
    rod([tx,.65+j*.055,tz],[tx+dx,h,tz+dz],.015,bark,garden,10);
    leafCloud(tx+dx,h+.12,tz+dz,.43,18);
  }
  leafCloud(tx,1.65,tz,.44,20);
  growthGroup(garden.children.slice(treeStart),tx,tz);
  shrub(2.82,-.72,.39,true);
  for(const [x,z,r] of [[2.53,-1.25,.16],[3.20,-1.38,.14],[4.48,-1.35,.17],[4.48,-.46,.13]])shrub(x,z,r,true);
  for(const x of [2.55,3.08,3.5,4.30,4.54])grassTuft(x,-1.51,.07);
  // Root branches sit behind the viewing face, spanning the watered soil.
  const roots=new THREE.Group();garden.add(roots);const rootMat=mat('#ad8f62',.95);
  for(const [x,z,size] of [[tx,tz,.75],[2.82,-.72,.49]]){
    rod([x,.015,z],[x,-.34,z+.25],.027*size,rootMat,roots);
    for(let j=0;j<7;j++){
      const dx=(j-3)*.16*size,dz=.50+random()*.45;
      const end=[x+dx,-.30-random()*.25,z+dz];
      path([[x,-.12,z],[x+dx*.4,-.23,z+dz*.45],end],.009*size,rootMat,roots);
      for(let k=0;k<3;k++)rod([end[0]-dx*.15,end[1]+.08,end[2]-.08],[end[0]+(k-1)*.09,end[1]-.06,end[2]+.08+k*.03],.0028,rootMat,roots,8);
    }
  }
  const dripMat=mat('#544337',.65);
  const dripRoute=pipe([[2.32,-.19,-.6],[2.42,-.19,-.6],[2.42,-.19,.23],[4.52,-.19,.23],[4.52,-.19,-.38],[2.65,-.19,-.38]],.012,dripMat,garden,.10);
  flow(dripRoute.curve,garden,17,'drip');
  for(let j=0;j<9;j++){
    const p=dripRoute.curve.getPointAt(.10+j*.092);
    const emitter=cyl(.018,.028,p.x,p.y,p.z,M.black,garden);emitter.rotation.z=Math.PI/2;
    const bulb=mesh(new THREE.SphereGeometry(1,18,12),new THREE.MeshBasicMaterial({color:'#3c9eaf',transparent:true,opacity:.32,depthWrite:false}),garden);bulb.position.set(p.x,p.y-.13,p.z);bulb.scale.set(.22,.23,.22);wetting.push({bulb,phase:j*.12});
    const drop=mesh(new THREE.SphereGeometry(.011,10,8),M.flow,garden);drop.castShadow=false;dripDrops.push({drop,p,phase:j*.12});
  }
  // Four inward-facing heads follow the corners of a convex, irregular lawn.
  const mpBoundary=[[2.40,.92],[4.52,1.10],[4.12,2.17],[2.62,1.94]];
  const rotorBoundary=[[2.38,2.70],[4.18,2.70],[4.18,4.50],[2.38,4.50]];
  function inside(x,z,poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
  const shape=new THREE.Shape();mpBoundary.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
  const turf=mesh(new THREE.ShapeGeometry(shape),new THREE.MeshStandardMaterial({color:'#829c6d',map:M.grass.map,bumpMap:M.grass.bumpMap,bumpScale:.004,roughness:.96}),garden);turf.rotation.x=-Math.PI/2;turf.position.y=.027;
  border([...mpBoundary,mpBoundary[0]].map(([x,z])=>[x,.025,z]));
  lawn(3.28,3.60,1.80,1.80);
  // Actual blades rise from the turf, then reset to a freshly cut height.
  for(const poly of [mpBoundary,rotorBoundary]){
    const blades=new THREE.InstancedMesh(new THREE.ConeGeometry(.010,1,3),leafColors[1],220);garden.add(blades);
    const points=[];while(points.length<220){const x=2.39+random()*(poly===mpBoundary?2.26:1.78),z=(poly===mpBoundary?.94:2.71)+random()*(poly===mpBoundary?1.20:1.78);if(inside(x,z,poly))points.push([x,z,.7+random()*.6]);}
    grassBlades.push({blades,points});
  }
  for(let i=0;i<7;i++){flagstone(2.19,.92+i*.20,.16,.17);shrub(4.77,.93+i*.19,.10,i%2===0);flagstone(2.42+i*.31,2.42,.27,.20);}
  for(let j=0;j<9;j++)shrub(4.44,2.75+j*.20,.13,j%3===0);
  for(const x of [2.48,3.13,3.82,4.4])shrub(x,4.75,.13,true);
  function sprinkler(x,z,type,poly,index){
    const isMP=type==='mp',baseY=isMP?.13:.18;
    cyl(isMP?.034:.058,.06,x,.03,z,M.black,garden);
    cyl(isMP?.016:.029,baseY,x,baseY/2+.03,z,M.steel,garden);
    const pivot=new THREE.Group();pivot.position.set(x,baseY,z);garden.add(pivot);
    cyl(isMP?.025:.046,.048,0,.012,0,M.black,pivot);
    cyl(isMP?.023:.045,.008,0,.040,0,M.black,pivot);
    if(!isMP){box(.012,.015,.016,.039,.023,0,mat('#277eb5',.4),pivot);box(.026,.002,.004,0,.046,0,M.steel,pivot);}
    else cyl(.020,.008,0,.045,0,M.green,pivot);
    const spray=new THREE.Group();garden.add(spray);
    const next=poly[(index+1)%4],prev=poly[(index+3)%4];
    let a0=Math.atan2(next[1]-z,next[0]-x),a1=Math.atan2(prev[1]-z,prev[0]-x);while(a1<a0)a1+=Math.PI*2;
    const streams=[];for(let j=0;j<(isMP?7:1);j++){
      const curve=new THREE.QuadraticBezierCurve3();const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({length:29},()=>new THREE.Vector3())),new THREE.LineBasicMaterial({color:'#5eb9d1',transparent:true,opacity:.72}));spray.add(line);
      const dots=[];for(let k=0;k<(isMP?3:10);k++){const dot=mesh(new THREE.SphereGeometry(isMP?.008:.012,8,6),M.flow,spray);dot.castShadow=false;dots.push(dot);}streams.push({curve,line,dots,phase:j/7});
    }
    jets.push({pivot,spray,streams,type,x,z,baseY,a0,a1,poly});
  }
  for(const [type,poly] of [['mp',mpBoundary],['rotor',rotorBoundary]]){
    poly.forEach(([x,z],i)=>{sprinkler(x,z,type,poly,i);flow(pipe([[2.03,-.32,z],[x,-.32,z],[x,.08,z]],.018,M.black,scene,.05).curve,scene,9,'distribution');});
  }
  const growthDummy=new THREE.Object3D();
  return {
    update(time,step,detail){
      const show=step===0||step===4,cut=step===4&&(detail===null||detail==='drip');
      topSection.visible=!cut;surfaceGhost.visible=cut;roots.visible=cut;
      wetting.forEach(({bulb,phase})=>{bulb.visible=cut;const s=1+Math.sin(time*1.8+phase*6)*.08;bulb.scale.set(.16*s,.19*s,.16*s);});
      dripDrops.forEach(({drop,p,phase})=>{drop.visible=cut;drop.position.set(p.x,p.y-((time*.6+phase)%1)*.23,p.z);});
      const cycle=(time%16)/16,progress=Math.min(1,cycle/.82),growth=.32+.68*(progress*progress*(3-2*progress));
      growing.forEach(g=>g.scale.setScalar(step===4&&(detail===null||detail==='drip')?growth:1));
      grassBlades.forEach(({blades,points},lawnIndex)=>{points.forEach(([x,z,v],i)=>{const h=(step===4&&(detail===null||detail===(lawnIndex===0?'mp':'rotor'))?.025+progress*.08:.045)*v;growthDummy.position.set(x,.03+h/2,z);growthDummy.scale.set(1,h,1);growthDummy.updateMatrix();blades.setMatrixAt(i,growthDummy.matrix);});blades.instanceMatrix.needsUpdate=true;});
      jets.forEach(j=>{
        j.spray.visible=show&&(step===0||detail===null||detail===j.type);
        const rotation=(time*.10)%2,sweep=rotation<=1?rotation:2-rotation;j.pivot.rotation.y=-(j.a0+sweep*(j.a1-j.a0));
        j.streams.forEach((s,n)=>{
          const phase=j.type==='mp'?(time*.12+n/7)%1:sweep;
          const a=j.type==='mp'?j.a0+.012+phase*(j.a1-j.a0-.024):j.a0+phase*(j.a1-j.a0),dx=Math.cos(a),dz=Math.sin(a);
          // MPs fit their irregular boundary; rotors keep a fixed throw equal to the square's side.
          let lo=.001,hi=3.2;for(let k=0;k<15;k++){const mid=(lo+hi)/2;if(inside(j.x+dx*mid,j.z+dz*mid,j.poly))lo=mid;else hi=mid;}
          const len=j.type==='mp'?lo*[.98,.76,.53][n%3]:Math.hypot(j.poly[1][0]-j.poly[0][0],j.poly[1][1]-j.poly[0][1]);
          s.curve.v0.set(j.x,j.baseY,j.z);s.curve.v1.set(j.x+dx*len*.5,j.baseY+len*.30,j.z+dz*len*.5);s.curve.v2.set(j.x+dx*len,.035,j.z+dz*len);
          const attr=s.line.geometry.attributes.position;for(let k=0;k<29;k++){const p=s.curve.getPoint(k/28);attr.setXYZ(k,p.x,p.y,p.z);}attr.needsUpdate=true;s.line.geometry.computeBoundingSphere();
          s.dots.forEach((d,k)=>d.position.copy(s.curve.getPoint((time*.8+k/s.dots.length)%1)));
        });
      });
    }
  };
}
