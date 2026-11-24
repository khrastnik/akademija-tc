window.createProbeRig=function(T,scene,kit){
 const root=new T.Group();scene.add(root);
 const material=(color,metalness=0,roughness=.45)=>new T.MeshStandardMaterial({color,metalness,roughness});
 const copper=material(0xb67c51,.72),steel=material(0x9da59d,.78),black=material(0x242e2d),red=material(0xb35433),blue=material(0x377f95),gold=material(0xcfad70,.62);
 const boxGeo=new T.BoxGeometry(1,1,1),round=new T.CylinderGeometry(1,1,1,24),geos=new Set([boxGeo,round]),mats=new Set([copper,steel,black,red,blue,gold]),textures=[];
 const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
 function mesh(parent,g,m,x,y,z,sx,sy,sz){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);parent.add(o);o.castShadow=true;return o}
 const box=(p,m,x,y,z,w,h,d)=>mesh(p,boxGeo,m,x,y,z,w,h,d);
 function pipe(p,m,a,b,r){const delta=b.clone().sub(a),mid=a.clone().lerp(b,.5);const o=mesh(p,round,m,mid.x,mid.y,mid.z,r,delta.length(),r);o.quaternion.setFromUnitVectors(V(0,1,0),delta.normalize());return o}
 function route(parent,material,points,r){
  const path=new T.CurvePath();let last=V(...points[0]);
  for(let i=1;i<points.length-1;i++){
   const a=V(...points[i-1]),b=V(...points[i]),c=V(...points[i+1]);
   const trim=Math.min(.12,a.distanceTo(b)*.34,c.distanceTo(b)*.34);
   const before=b.clone().addScaledVector(a.clone().sub(b).normalize(),trim);
   const after=b.clone().addScaledVector(c.clone().sub(b).normalize(),trim);
   path.add(new T.LineCurve3(last,before));path.add(new T.QuadraticBezierCurve3(before,b,after));last=after;
  }
  path.add(new T.LineCurve3(last,V(...points[points.length-1])));
  const geometry=new T.TubeGeometry(path,Math.max(20,points.length*14),r,10,false);geos.add(geometry);
  return mesh(parent,geometry,material,0,0,0,1,1,1);
 }
 function tag(p,text,x,y,z,width){
  const c=document.createElement('canvas');c.width=512;c.height=80;const g=c.getContext('2d');g.fillStyle='#172c31';g.fillRect(0,0,512,80);g.fillStyle='#f1ead3';g.font='600 51px Segoe UI';g.textAlign='center';g.fillText(text,256,59,492);
  const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;textures.push(tx);const mat=new T.MeshBasicMaterial({map:tx,toneMapped:false});mats.add(mat);const geo=new T.PlaneGeometry(width,width*80/512);geos.add(geo);const o=new T.Mesh(geo,mat);o.position.set(x,y,z);p.add(o)
 }
 const ports=new Map(),heads=new Map();let field=null,active=null;
 const z=-.43;
 for(const x of [2.67,3.68]){box(root,steel,x,.81,z-.1,.041,1.59,.048);box(root,steel,x,.035,z-.1,.16,.06,.21)}
 function rail(y,title){
  const group=new T.Group();root.add(group);
  pipe(group,copper,V(2.55,y,z),V(3.82,y,z),.039);
  for(const x of [2.61,3.75])pipe(group,gold,V(x-.034,y,z),V(x+.034,y,z),.057);
  tag(group,title,3.16,y+.113,z,.73);return group
 }
 const flow=rail(1.37,'PRETOK   ·   A   ›   B'),hot=rail(1.02,'DVIŽNI VOD'),cold=rail(.68,'POVRATNI VOD');
 const boiler=rail(1.02,'VEJA BOJLERJA'),rad=rail(.68,'VEJA RADIATORJEV');
 for(const [x,y] of [[2.58,1.37],[3.78,1.02],[2.64,.68]]){pipe(root,copper,V(x,y,z),V(x,y,-1.96),.039)}
 function mount(id,parent,x,y,where,kind,channel){
  const g=new T.Group();g.position.set(x,y,where);g.userData.fieldId='probe:'+id;parent.add(g);ports.set(id,g);
  pipe(g,id==='air'?steel:copper,V(-.097,0,0),V(.097,0,0),.0405);
  const color=channel===0?red:blue;
  for(const off of [-.073,.073])pipe(g,color,V(off-.007,0,0),V(off+.007,0,0),.042);
  const h=new T.Group();g.add(h);h.userData.fieldId=g.userData.fieldId;heads.set(id,h);
  if(kind==='air'){pipe(h,steel,V(0,.01,.054),V(0,.145,.054),.007);box(h,black,0,0,.051,.062,.045,.055)}
  else{
   const ring=new T.TorusGeometry(.044,.006,8,36);geos.add(ring);for(const xx of [-.035,.035]){const o=new T.Mesh(ring,steel);o.position.x=xx;o.rotation.y=Math.PI/2;h.add(o)}
   box(h,black,0,.018,.044,.107,.041,.034);box(h,color,0,.018,.065,.089,.043,.025);
   if(kind==='temp'){box(h,steel,0,.057,.058,.025,.047,.018);box(h,black,0,.083,.06,.035,.023,.027)}
   pipe(h,black,V(.031,.01,.071),V(.056,-.018,.079),.008)
  }
  h.visible=false;
 }
 mount('up',flow,2.92,1.37,z,'flow',0);mount('down',flow,3.40,1.37,z,'flow',1);
 mount('supply',hot,3.14,1.02,z,'temp',0);mount('return',cold,3.14,.68,z,'temp',1);
 mount('boiler',boiler,3.14,1.02,z,'temp',0);mount('radiator',rad,3.14,.68,z,'temp',1);
 mount('air',root,.39,1.51,-1.94,'air',0);tag(root,'SONDA · SENCA',.39,1.69,-1.93,.32);
 const standardPorts=new Map(ports),standardHeads=new Map(heads);let bufferPorts=null,bufferHeads=null;
 let radiatorBay,bufferBay;
 function createBufferBay(){
  const bay=new T.Group();bay.position.set(2.9,0,-1.65);root.add(bay);
  const network=new T.Group();root.add(network);
  const jacket=material(0x727f80,.36,.51),insulation=material(0x333d3d,.03,.85);
  mats.add(jacket);mats.add(insulation);
  const tankX=-.25,tankZ=-.04;
  for(const dx of [-.22,.22]){
   box(bay,steel,tankX+dx,.085,tankZ,.075,.17,.335);
   box(bay,black,tankX+dx,.015,tankZ,.14,.03,.40);
  }
  pipe(bay,jacket,V(tankX,.15,tankZ),V(tankX,1.58,tankZ),.33);
  for(const y of [.17,.51,1.27,1.57]){
   pipe(bay,y===.17||y===1.57?insulation:steel,V(tankX,y-.013,tankZ),V(tankX,y+.013,tankZ),.336);
  }
  pipe(bay,gold,V(tankX,1.58,tankZ),V(tankX,1.69,tankZ),.025);
  pipe(bay,steel,V(tankX,1.64,tankZ),V(tankX,1.72,tankZ),.04);
  tag(bay,'ZALOGOVNIK',tankX,.98,.30,.49);
  const pipeZ=.058,serviceZ=bay.position.z+pipeZ,top=1.31,low=.53,left=tankX-.33,right=tankX+.33,primaryEnd=-1.18,secondaryEnd=1.29;
  // Primary circuit: heat pump flow enters the upper-left buffer connection and
  // the lower-left connection returns cooled water to the monobloc.
  pipe(bay,red,V(left,top,pipeZ),V(primaryEnd,top,pipeZ),.044);
  pipe(bay,blue,V(left,low,pipeZ),V(primaryEnd,low,pipeZ),.044);
  pipe(bay,gold,V(left+.035,top,pipeZ),V(left+.105,top,pipeZ),.057);
  pipe(bay,gold,V(left+.035,low,pipeZ),V(left+.105,low,pipeZ),.057);
  route(network,red,[[1.48,1.134,-2.085],[1.48,1.134,-1.91],[1.48,top,-1.78],[2.9+primaryEnd,top,serviceZ]],.047);
  route(network,blue,[[2.9+primaryEnd,low,serviceZ],[1.48,low,-1.78],[1.48,.605,-1.91],[1.48,.605,-2.085]],.047);
  // Secondary circuit: hot water leaves the buffer, crosses the circulator,
  // serves the radiator and returns through the lower-right buffer connection.
  pipe(bay,red,V(right,top,pipeZ),V(.49,top,pipeZ),.044);
  pipe(bay,red,V(.81,top,pipeZ),V(secondaryEnd,top,pipeZ),.044);
  pipe(bay,blue,V(right,low,pipeZ),V(secondaryEnd,low,pipeZ),.044);
  for(const x of [right,secondaryEnd]){
   pipe(bay,gold,V(x-.035,top,pipeZ),V(x+.035,top,pipeZ),.057);
   pipe(bay,gold,V(x-.035,low,pipeZ),V(x+.035,low,pipeZ),.057);
  }
  route(network,red,[[2.9+secondaryEnd,top,serviceZ],[4.45,top,serviceZ],[5.16,1.24,-1.65],[5.28,1.143,-1.65]],.047);
  route(network,blue,[[3.594,.221,-1.65],[3.594,.43,-1.65],[3.84,low,serviceZ],[2.9+secondaryEnd,low,serviceZ]],.047);
  mount('up',network,1.84,top,serviceZ,'flow',0);mount('down',network,2.12,top,serviceZ,'flow',1);
  mount('bufferIn',network,2.20,top,serviceZ,'temp',0);
  mount('bufferOut',network,3.17,top,serviceZ,'temp',1);
  mount('secUp',network,3.84,top,serviceZ,'flow',0);mount('secDown',network,4.06,top,serviceZ,'flow',1);
  bufferPorts=new Map(['up','down','bufferIn','bufferOut','secUp','secDown'].map(id=>[id,ports.get(id)]));
  bufferHeads=new Map(['up','down','bufferIn','bufferOut','secUp','secDown'].map(id=>[id,heads.get(id)]));
  tag(bay,'PRIMARNI KROG · TČ',-.82,top+.17,.25,.66);
  tag(bay,'SEKUNDARNI KROG · RADIATORJI',.66,top+.17,.25,.90);
  tag(bay,'POVRATEK · TČ',-.86,low-.13,.25,.49);
  tag(bay,'POVRATEK · RADIATORJI',.67,low-.18,.25,.70);
  tag(network,'DVIŽNI VOD · RADIATORJI',4.67,1.51,-1.54,.62);
  const pump=new T.Group();pump.position.set(.65,top,pipeZ);pump.userData.fieldId='secondaryPump';bay.add(pump);
  for(const side of [-1,1]){
   pipe(pump,gold,V(side*.115,0,0),V(side*.16,0,0),.067);
   pipe(pump,red,V(side*.08,0,0),V(side*.117,0,0),.061);
  }
  pipe(pump,red,V(0,0,-.08),V(0,0,.078),.115);
  pipe(pump,steel,V(0,0,.078),V(0,0,.106),.098);
  pipe(pump,black,V(0,0,.107),V(0,0,.145),.091);
  box(pump,black,0,.13,.048,.2,.145,.145);
  tag(pump,'I     II     III',0,.159,.124,.16);
  pipe(pump,steel,V(0,.108,.119),V(0,.108,.147),.035);
  const knob=new T.Group();knob.position.set(0,.108,.152);pump.add(knob);
  box(knob,gold,0,.014,.004,.012,.039,.009);
  tag(bay,'OBTOČNA ČRPALKA',.65,top+.315,pipeZ+.13,.60);
  function sync(f){bay.visible=network.visible=f.caseIndex===9;knob.rotation.z=f.fixed?0:-.82;}
  function reach(p){return {id:'secondaryPump',point:knob.localToWorld(V(0,.01,.017)),weight:T.MathUtils.smoothstep(p,0,.25),normal:V(0,0,1),twist:0};}
  return {sync,reach};
 }
 function createRadiatorBay(){
  const bay=new T.Group();root.add(bay);bay.position.set(-4.55,0,-1.92);
  const finish=(color,metal=0,rough=.55)=>{const m=material(color,metal,rough);mats.add(m);return m};
  const enamel=finish(0xf3eee2,.24,.34),joint=finish(0xb9b5a7,.25,.47),plaster=finish(0xc8c4b3,0,.95);
  const oak=finish(0x82745b,.02,.8),cloth=finish(0x6d7974,0,.95),water=finish(0x77b6bb,.16,.19);
  const activeLed=finish(0x74bb88),restLed=finish(0xe3b771);
  const objects={};
  const group=(parent,x,y,depth,id)=>{const g=new T.Group();g.position.set(x,y,depth);parent.add(g);if(id){g.userData.fieldId=id;objects[id]=g}return g};
  box(bay,plaster,0,1.10,-.11,2.92,2.2,.16);
  box(bay,oak,0,.056,-.004,2.92,.11,.075);
  for(const x of [-1.46,1.46])box(bay,oak,x,1.10,-.06,.055,2.2,.22);
  box(bay,oak,0,.016,.49,2.96,.033,1.2);
  tag(bay,'OGREVALNI KROG   /   RADIATOR',0,1.96,.32,1.32);
  // The two stamped-steel panels, top grille and convector fins sit off the plaster on wall brackets.
  for(const x of [-.53,.45]){box(bay,steel,x,.86,.035,.069,.59,.10);box(bay,steel,x,.84,.102,.090,.045,.17)}
  box(bay,joint,-.07,.82,.099,1.51,.79,.048);
  box(bay,enamel,-.07,.82,.229,1.56,.8,.044);
  for(let i=0;i<28;i++){
   const x=-.798+i*.054;
   box(bay,enamel,x,.82,.263,.033,.749,.032);
   box(bay,joint,x,1.212,.172,.018,.018,.118);
  }
  for(const y of [.422,1.216])box(bay,enamel,-.07,y,.175,1.57,.026,.158);
  for(const x of [-.846,.706])box(bay,enamel,x,.82,.174,.026,.794,.169);
  // Small flat contact shoes conduct the surface temperature into the clamps.
  for(const [name,y,ch] of [['top',1.119,0],['bottom',.527,1]]){
   box(bay,steel,-.13,y,.292,.208,.055,.026);
   mount(name,bay,-.13,y,.316,'temp',ch);
   tag(bay,ch?'T2 · SPODAJ':'T1 · ZGORAJ',.166,y,.293,.31);
  }
  const head=group(bay,.818,1.144,.239,'radHead');
  pipe(bay,copper,V(.83,.129,.30),V(.83,1.143,.30),.021);
  pipe(bay,copper,V(.83,.129,.30),V(1.425,.129,.30),.021);
  pipe(bay,copper,V(-.855,.221,.30),V(1.425,.221,.30),.022);
  pipe(bay,copper,V(-.856,.221,.30),V(-.856,.475,.30),.022);
  for(const [x,y] of [[.82,1.143],[-.856,.475]]){
   pipe(bay,gold,V(x-.062,y,.30),V(x+.055,y,.30),.048);
   pipe(bay,steel,V(x,y,.30),V(x,y,.386),.044);
  }
  tag(bay,'TERMOSTAT',.858,1.411,.005,.43);
  const headRest=V(.99,.516,.26),headHome=head.position.clone();
  box(bay,oak,1.00,.383,.21,.435,.033,.34);
  pipe(head,steel,V(0,0,-.045),V(0,0,.012),.066);
  pipe(head,enamel,V(0,0,.011),V(0,0,.181),.082);
  for(let i=0;i<18;i++){
   const a=i*Math.PI/9;
   pipe(head,joint,V(Math.cos(a)*.08,Math.sin(a)*.08,.066),V(Math.cos(a)*.08,Math.sin(a)*.08,.16),.0035);
  }
  tag(head,'5',0,0,.184,.077);
  const pin=group(bay,.818,1.144,.235,'radPin');
  pipe(pin,gold,V(0,0,-.04),V(0,0,.001),.054);
  const stem=pipe(pin,steel,V(0,0,.001),V(0,0,.032),.013);
  const vent=group(bay,-.842,1.144,.264,'radVent');
  pipe(vent,steel,V(0,0,-.071),V(0,0,.025),.054);
  const screw=group(vent,0,0,.028);
  pipe(screw,gold,V(0,0,0),V(0,0,.03),.027);
  box(screw,black,0,0,.0305,.043,.005,.002);
  pipe(vent,gold,V(-.015,-.028,.008),V(-.037,-.067,.036),.011);
  tag(bay,'ODZRAČEVALNIK',-.851,1.412,.005,.62);
  const vessel=group(bay,-1.22,1.75,.13,'radVessel');
  const vesselRed=finish(0xb3412f,.25,.42);
  pipe(vessel,vesselRed,V(0,-.15,0),V(0,.15,0),.11);
  pipe(vessel,steel,V(0,-.15,0),V(0,-.21,0),.03);
  pipe(vessel,gold,V(0,.15,0),V(0,.19,0),.018);
  pipe(bay,copper,V(-1.22,1.54,.13),V(-1.22,.475,.13),.016);
  tag(bay,'RAZTEZNA POSODA',-1.13,2.02,.005,.5);
  const cup=group(bay,-1.103,.478,.259,'radCup');
  box(bay,oak,-1.11,.414,.202,.46,.028,.351);
  box(cup,cloth,-.012,-.047,.009,.235,.018,.154);
  // An open catch cup with a visible rolled lip.
  const cupGeo=new T.CylinderGeometry(.084,.057,.136,28,1,true);geos.add(cupGeo);
  mesh(cup,cupGeo,steel,0,.025,0,1,1,1);
  pipe(cup,black,V(0,-.045,0),V(0,-.038,0),.058);
  const rimGeo=new T.TorusGeometry(.084,.006,8,36);geos.add(rimGeo);
  const lip=new T.Mesh(rimGeo,steel);lip.rotation.x=Math.PI/2;lip.position.y=.093;cup.add(lip);
  const cupHome=cup.position.clone(),cupWork=V(-.884,.926,.294);
  const waterInside=pipe(cup,water,V(0,.014,0),V(0,.017,0),.068);
  const drops=group(vent,-.037,-.071,.036);
  const dropGeo=new T.SphereGeometry(1,8,6);geos.add(dropGeo);
  for(let i=0;i<3;i++)mesh(drops,dropGeo,water,0,0,0,.004,.009,.004);
  const panel=group(bay,1.126,1.62,.023);
  box(panel,black,0,0,0,.454,.441,.096);
  const gauge=group(panel,-.095,.027,.070,'radGauge'),control=group(panel,.112,.033,.070,'radControl');
  pipe(gauge,steel,V(0,0,0),V(0,0,.041),.102);
  const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');
  g.fillStyle='#e9e5d8';g.beginPath();g.arc(128,128,124,0,2*Math.PI);g.fill();
  g.strokeStyle='#313b39';g.fillStyle='#293331';g.textAlign='center';g.textBaseline='middle';g.font='bold 25px Segoe UI';
  for(let k=0;k<=24;k++){
   const a=(135+k*270/24)*Math.PI/180,dx=Math.cos(a),dy=Math.sin(a),major=k%4===0;
   g.lineWidth=major?4:2;g.beginPath();g.moveTo(128+dx*(major?83:96),128+dy*(major?83:96));
   g.lineTo(128+dx*108,128+dy*108);g.stroke();
   if(k%8===0)g.fillText(String(k/8),128+dx*67,128+dy*67);
  }
  g.font='bold 25px Segoe UI';g.fillText('bar',128,181);
  // The cold-fill reference is the midpoint of the simulated 0–3 bar dial.
  g.strokeStyle='#963e30';g.lineWidth=6;g.beginPath();g.moveTo(128,135);g.lineTo(128,36);g.stroke();
  const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;textures.push(tx);
  const faceMat=new T.MeshBasicMaterial({map:tx,transparent:true,toneMapped:false});mats.add(faceMat);
  const square=new T.PlaneGeometry(.198,.198);geos.add(square);const face=new T.Mesh(square,faceMat);face.position.z=.042;gauge.add(face);
  tag(gauge,'TLAK',0,-.142,0,.159);
  pipe(control,steel,V(0,0,0),V(0,0,.042),.067);
  const rocker=box(control,black,0,0,.054,.076,.109,.038);
  const lamp=box(control,activeLed,0,.103,.023,.05,.018,.015);
  tag(control,'OBTOK',0,-.149,0,.176);
  function sync(f){
   bay.visible=(f.caseIndex>=6&&f.caseIndex<=9)||f.caseIndex===10||f.caseIndex===11;
   bay.position.x=f.caseIndex===9?4.45:-4.55;bay.position.z=f.caseIndex===9?-1.95:-1.92;
   if(!bay.visible)return;
   const step=f.radStep||0,off=step>=1&&step<=4&&f.phase==='procedure';
   const removed=f.caseIndex===7&&step>=2&&step<=3;
   head.position.copy(removed?headRest:headHome);head.rotation.z=0;
   stem.position.z=f.caseIndex===7&&step<3?.003:.022;
   const catching=f.caseIndex===6&&step>=2&&step<=3&&f.phase==='procedure';
   cup.position.copy(catching?cupWork:cupHome);waterInside.visible=f.caseIndex===6&&step>=3;
   rocker.rotation.x=off?-.52:.52;lamp.material=off?restLed:activeLed;
   screw.rotation.z=0;drops.visible=false;
  }
  function interact(id,p){
   const item=objects[id];if(!item)return null;
   const t=T.MathUtils.smoothstep(p,.20,.83),step=field.radStep||0,work=field.phase==='procedure';
   if(work&&id==='radCup'&&step===1)cup.position.lerpVectors(cupHome,cupWork,t);
   if(work&&id==='radVent'&&step===2){
    screw.rotation.z=-Math.PI*.86*Math.sin(t*Math.PI);
    drops.visible=p>.52&&p<.90;
    drops.children.forEach((drop,i)=>{drop.position.y=-.066*((p*10+i/3)%1)});
   }
   if(work&&id==='radHead'&&(step===1||step===3)){
    const u=step===1?t:1-t;head.rotation.z=u*Math.PI*1.35;
    head.position.lerpVectors(headHome,headRest,u);head.position.z+=.136*Math.sin(u*Math.PI);
   }
   if(work&&id==='radPin'&&step===2)stem.position.z=.012+.012*Math.cos(t*4*Math.PI);
   if(work&&id==='radControl')rocker.rotation.x=(step===0?1-2*t:2*t-1)*.52;
   const offset=id==='radHead'?.17:id==='radCup'?.07:id==='radVent'?.0585:.045;
   return {id,point:item.localToWorld(V(0,0,offset)),weight:Math.sin(Math.PI*Math.min(1,p/.2)/2)*(1-T.MathUtils.smoothstep(p,.85,1)),normal:V(0,0,1),twist:screw.rotation.z};
  }
  return {sync,interact};
 }
 function cable(){
  const geo=new T.BufferGeometry(),pos=new Float32Array(15*6*3),idx=[];for(let k=0;k<14;k++)for(let n=0;n<6;n++){const a=k*6+n,b=k*6+(n+1)%6;idx.push(a,b,a+6,b,b+6,a+6)}
  geo.setAttribute('position',new T.BufferAttribute(pos,3).setUsage(T.DynamicDrawUsage));geo.setIndex(idx);geos.add(geo);
  const mat=new T.MeshBasicMaterial({color:0x262c2c,side:T.DoubleSide});mats.add(mat);const o=new T.Mesh(geo,mat);root.add(o);o.userData.nonBlocking=true;o.frustumCulled=false;
  return {draw(start,end){
   o.visible=!!start;if(!start)return;const sag=Math.min(.34,start.distanceTo(end)*.25);
   const tangent=V(),a=V(),b=V(),center=V(),up=V(0,1,0);
   for(let k=0;k<15;k++){
    const t=k/14;center.copy(start).lerp(end,t);center.y-=4*t*(1-t)*sag;
    tangent.subVectors(end,start);tangent.y-=4*(1-2*t)*sag;tangent.normalize();a.crossVectors(tangent,up);if(a.lengthSq()<.001)a.set(1,0,0);a.normalize();b.crossVectors(tangent,a);
    for(let n=0;n<6;n++){const u=n*Math.PI/3,cs=.004*Math.cos(u),sn=.004*Math.sin(u);let j=(k*6+n)*3;pos[j]=center.x+a.x*cs+b.x*sn;pos[j+1]=center.y+a.y*cs+b.y*sn;pos[j+2]=center.z+a.z*cs+b.z*sn}
   }geo.attributes.position.needsUpdate=true
  }}
 }
 const wires=[cable(),cable()];
 function sync(f){field=f;active=null;
  flow.visible=f.caseIndex!==9;hot.visible=cold.visible=f.caseIndex!==4&&f.caseIndex!==9;boiler.visible=rad.visible=f.caseIndex===4;
  if(((f.caseIndex>=6&&f.caseIndex<=9)||f.caseIndex===10||f.caseIndex===11)&&!radiatorBay)radiatorBay=createRadiatorBay();
  if(f.caseIndex===9&&!bufferBay)bufferBay=createBufferBay();
  const buffering=f.caseIndex===9&&!!bufferBay,activePorts=buffering?bufferPorts:standardPorts,activeHeads=buffering?bufferHeads:standardHeads;
  for(const id of ['up','down','supply','return','boiler','radiator','bufferIn','bufferOut','secUp','secDown']){
   const p=activePorts?.get(id),h=activeHeads?.get(id);
   if(p)ports.set(id,p);else ports.delete(id);
   if(h)heads.set(id,h);else heads.delete(id);
  }
  radiatorBay?.sync(f);bufferBay?.sync(f);
  for(const [id,h] of heads){h.visible=!!f.measurement?.ports.includes(id);h.position.set(0,0,0)}
  }
 function point(id){const g=ports.get(id.replace('probe:',''));return g?g.localToWorld(V(0,.03,.065)):null}
 function reach(id,p){
  const port=id.slice(6),g=ports.get(port),h=heads.get(port);if(!g)return null;
  const end=point(id),begin=kit.instrumentSocket(0);begin.x-=.1;const t=T.MathUtils.smoothstep(p,.08,.83);
  const at=begin.lerp(end,t);active=port;
  if(!field.measurement?.ports.includes(port)){h.visible=true;h.position.copy(g.worldToLocal(at.clone())).sub(V(0,.03,.065))}
  return {id,point:field.measurement?.ports.includes(port)?end:at,weight:Math.sin(Math.min(p/.25,1)*Math.PI/2),normal:V(0,0,1),twist:0}
 }
 function animate(){const ids=field?.measurement?.ports?.slice()||[];if(active&&!ids.includes(active))ids.push(active);
  for(let i=0;i<2;i++){const h=heads.get(ids[i]);wires[i].draw(h?kit.instrumentSocket(i):null,h?.localToWorld(V(.03,0,.08)))}active=null}
 return {sync,reach,animate,point,serviceReach:(id,p)=>radiatorBay?.interact(id,p),pumpReach:p=>bufferBay?.reach(p),dispose(){root.removeFromParent();geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());textures.forEach(t=>t.dispose())}}
};
