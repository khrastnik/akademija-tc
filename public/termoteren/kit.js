/* Physical field-service case and camera-mounted technician's hand. Dimensions are metres. */
window.createFieldKit = function createFieldKit(T, scene, camera) {
  'use strict';
  const root = new T.Group();
  root.position.set(-2.55, 0, 1.40);
  scene.add(root);
  const parts = new Set(), surfaces = new Set(), textures = new Set();
  const geometry = (g) => { parts.add(g); return g; };
  const material = (color, metalness = 0, roughness = .55) => {
    const m = new T.MeshStandardMaterial({color, metalness, roughness});
    surfaces.add(m);
    return m;
  };
  const orange = material(0xd86b25, .12, .49), yellow = material(0xf3bc43, .04, .43);
  const graphite = material(0x2c3436, .13, .55), rubber = material(0x192024, .02, .83);
  const foam = material(0x303838, 0, .98), steel = material(0xb3b9b6, .79, .28);
  const blue = material(0x347c95, .12, .49), leaf = material(0x849e88, .02, .68);
  const ivory = material(0xd9deca, .1, .48), wood = material(0xc8a27b, 0, .8);
  const skin = material(0x3a4241, .03, .89), leather = material(0x525a54, .01, .79);
  const cloth = material(0x2c3c44, 0, .93), brass = material(0xb99b65, .51, .36);
  const boxGeo = geometry(new T.BoxGeometry(1,1,1));
  const cylGeo = geometry(new T.CylinderGeometry(1,1,1,16));
  const sphereGeo = geometry(new T.SphereGeometry(1,12,10));
  const vec = (x,y,z) => new T.Vector3(x,y,z);
  function group(parent,x=0,y=0,z=0){
    const n = new T.Group();n.position.set(x,y,z);parent.add(n);return n;
  }
  function mesh(parent,geo,mat,x,y,z,w=1,h=1,d=1){
    const n=new T.Mesh(geo,mat);n.position.set(x,y,z);n.scale.set(w,h,d);
    n.castShadow=true;n.receiveShadow=true;parent.add(n);return n;
  }
  const box=(p,m,x,y,z,w,h,d)=>mesh(p,boxGeo,m,x,y,z,w,h,d);
  const ball=(p,m,x,y,z,w,h,d)=>mesh(p,sphereGeo,m,x,y,z,w,h,d);
  function rod(p,m,a,b,r) {
    const from=vec(...a),to=vec(...b),delta=to.sub(from),mid=from.clone().addScaledVector(delta,.5);
    const n=mesh(p,cylGeo,m,mid.x,mid.y,mid.z,r,delta.length(),r);
    n.quaternion.setFromUnitVectors(vec(0,1,0),delta.normalize());
    return n;
  }
  function cylinderZ(p,m,x,y,z,r,length) {
    const n=mesh(p,cylGeo,m,x,y,z,r,length,r);n.rotation.x=Math.PI/2;return n;
  }
  function plate(p,m,x,y,z,w,h,d,r) {
    const shape=new T.Shape(),l=-w/2,t=-d/2;
    shape.moveTo(l+r,t);shape.lineTo(-l-r,t);shape.quadraticCurveTo(-l,t,-l,t+r);
    shape.lineTo(-l,-t-r);shape.quadraticCurveTo(-l,-t,-l-r,-t);
    shape.lineTo(l+r,-t);shape.quadraticCurveTo(l,-t,l,-t-r);
    shape.lineTo(l,t+r);shape.quadraticCurveTo(l,t,l+r,t);
    const geo=geometry(new T.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false,curveSegments:3}));
    const n=mesh(p,geo,m,x,y-h/2,z);n.rotation.x=-Math.PI/2;return n;
  }
  // Physical printed legends stay with their objects as the player moves around the table.
  const labels=new Map();
  function label(p,x,y,z,w,h,title,sub='',bg='#263132',fg='#f3e9ce',orientation='up'){
    const key=[title,sub,bg,fg].join('|');
    if(!labels.has(key)){
      const c=document.createElement('canvas');c.width=512;c.height=150;
      const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);
      ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.font='bold '+(sub?45:56)+'px sans-serif';ctx.fillText(title,256,sub?52:77,474);
      if(sub){ctx.font='32px monospace';ctx.fillText(sub,256,110,472);}
      const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;textures.add(map);
      const mat=new T.MeshBasicMaterial({map,toneMapped:false});surfaces.add(mat);labels.set(key,mat);
    }
    const n=mesh(p,geometry(new T.PlaneGeometry(w,h)),labels.get(key),x,y,z);
    n.castShadow=false;n.receiveShadow=false;
    if(orientation==='up')n.rotation.x=-Math.PI/2;
    if(orientation==='down')n.rotation.x=Math.PI/2;
    return n;
  }
  // Folding table with steel scissor legs, pivot bolts, braces and rubber feet.
  plate(root,graphite,0,.756,0,1.34,.048,.83,.038);
  for(const x of [-.49,.49]){
    for(const s of [-1,1]){
      rod(root,steel,[x,.048,.32*s],[x,.728,-.30*s],.019);
      box(root,rubber,x,.027,.32*s,.08,.044,.09);
    }
    ball(root,graphite,x,.396,0,.036,.037,.037);
  }
  rod(root,steel,[-.49,.13,.24],[.49,.13,.24],.014);
  rod(root,steel,[-.49,.13,-.24],[.49,.13,-.24],.014);
  const body=group(root,0,.782,0);body.userData.fieldId='kit';
  plate(body,rubber,0,.052,0,1.18,.103,.690,.048);
  plate(body,orange,0,.086,0,1.174,.084,.681,.045);
  plate(body,graphite,0,.132,0,1.173,.025,.681,.041);
  plate(body,foam,0,.147,0,1.12,.020,.632,.027);
  for(const x of [-.47,.47]){
    box(body,graphite,x,.08,.344,.084,.103,.026);
    box(body,steel,x,.084,.359,.044,.053,.008);
    for(const z of [-.30,.29]) box(body,rubber,x,.032,z,.105,.04,.11);
    cylinderZ(body,steel,x,.080,.366,.010,.008);
  }
  const handle=group(body,0,.07,.345);
  for(const x of [-.132,.132])rod(handle,rubber,[x,0,0],[x,0,.070],.019);
  rod(handle,graphite,[-.132,0,.070],[.132,0,.070],.024);
  label(body,0,.077,.344,.32,.045,'TOPLOLOG SIMULATOR','','#ae521b','#221f1a','front');
  const lid=group(body,0,.156,-.334);
  plate(lid,orange,0,.051,.334,1.17,.096,.672,.043);
  plate(lid,graphite,0,.007,.334,1.17,.024,.670,.039);
  plate(lid,foam,0,-.009,.334,1.113,.026,.620,.021);
  for(const x of [-.46,-.34,.34,.46]){
    plate(lid,orange,x,.106,.334,.035,.016,.505,.014);
  }
  label(lid,0,.101,.334,.53,.135,'TOPLOLOG SIMULATOR','SERVISNI KOVČEK','#282d2c','#f1c693');
  label(lid,0,-.024,.37,.52,.16,'SERVISNI KOVČEK','MERILNA OPREMA','#303b3a','#dedecf','down');
  for(const x of [-.46,-.31,.31,.46])box(lid,rubber,x,-.026,.34,.043,.012,.44);
  for(const x of [-.38,.38]){
    rod(body,graphite,[x-.08,.147,-.333],[x+.08,.147,-.333],.021);
  }
  const tools={
    inspect:{title:'Svetilka',accent:yellow},meter:{title:'Servisni terminal',accent:orange},
    thermo:{title:'Termometer',accent:blue},flow:{title:'Merilnik pretoka',accent:leaf},
    driver:{title:'Izvijač',accent:yellow},brush:{title:'Ščetka',accent:wood}
  };
  function instrument(p,w,d,accent,title,sub){
    plate(p,rubber,0,0,0,w,.032,d,.015);
    plate(p,accent,0,.014,0,w-.009,.018,d-.010,.012);
    plate(p,graphite,0,.024,-d*.13,w-.024,.007,d*.56,.005);
    label(p,0,.028,-d*.13,w-.031,d*.42,title,sub,'#657b72','#162a29');
    for(const x of [-.24,0,.24])ball(p,graphite,x*w,.026,d*.33,.0052,.0024,.0052);
  }
  function buildTool(key){
    const p=new T.Group();
    if(key==='inspect'){
      cylinderZ(p,rubber,0,0,.019,.022,.124);
      for(const z of [-.033,.003,.027,.051,.074])cylinderZ(p,graphite,0,0,z,.024,.005);
      cylinderZ(p,yellow,0,0,-.062,.029,.052);
      cylinderZ(p,graphite,0,0,-.091,.029,.008);
      cylinderZ(p,ivory,0,0,-.096,.022,.003);
      box(p,steel,.019,.007,.033,.005,.010,.058);
      ball(p,orange,0,.023,-.004,.009,.003,.008);
    }else if(key==='meter'){
      instrument(p,.119,.203,orange,'TČ / SERVIS','PRIPRAVLJEN');
      box(p,rubber,-.035,0,-.089,.029,.020,.020);
      for(const x of [-.05,.05])box(p,graphite,x,0,.030,.007,.022,.042);
    }else if(key==='thermo'){
      instrument(p,.119,.203,blue,'T1 / T2','SONDI');
      for(const x of [-.028,.028])cylinderZ(p,brass,x,0,-.107,.009,.017);
    }else if(key==='flow'){
      instrument(p,.119,.203,leaf,'l/min','ULTRAZVOK');
      for(const x of [-.025,.025]){
        cylinderZ(p,brass,x,0,-.105,.010,.018);
        cylinderZ(p,graphite,x,0,-.118,.012,.014);
      }
      box(p,steel,.042,0,.048,.009,.013,.033);
    }else if(key==='driver'){
      cylinderZ(p,yellow,0,0,.033,.021,.097);
      ball(p,rubber,0,0,.081,.020,.020,.011);
      for(const angle of [0,Math.PI*.5,Math.PI,Math.PI*1.5]){
        const x=.017*Math.sin(angle),y=.017*Math.cos(angle);
        ball(p,graphite,x,y,.036,.010,.007,.036);
      }
      cylinderZ(p,rubber,0,0,-.019,.024,.014);
      cylinderZ(p,steel,0,0,-.084,.0045,.124);
      cylinderZ(p,graphite,0,0,-.143,.0037,.006);
      box(p,steel,0,0,-.15,.008,.0018,.008);
    }else{
      plate(p,wood,0,0,.024,.031,.016,.154,.013);
      plate(p,wood,0,.002,-.064,.063,.022,.074,.015);
      const bristleSpecs=[];
      for(let ix=0;ix<5;ix++)for(let iz=0;iz<6;iz++)bristleSpecs.push([-.021+ix*.0105,-.018,-.092+iz*.011]);
      const bristles=new T.InstancedMesh(cylGeo,leather,bristleSpecs.length);
      const transform=new T.Object3D();
      bristleSpecs.forEach(([x,y,z],i)=>{
        transform.position.set(x,y,z);transform.rotation.z=x*3.5;
        transform.scale.set(.0035,.026,.0035);transform.updateMatrix();bristles.setMatrixAt(i,transform.matrix);
      });
      bristles.castShadow=true;bristles.receiveShadow=true;p.add(bristles);
      cylinderZ(p,graphite,0,0,.092,.011,.012);
    }
    return p;
  }
  const trays=new Map(),handTools=new Map();
  Object.keys(tools).forEach((key,i)=>{
    const x=(i%3-1)*.365, z=(Math.floor(i/3)-.5)*.293;
    const slot=group(body,x,.16,z);slot.userData.fieldId='tool:'+key;
    plate(slot,rubber,0,0,0,.339,.012,.265,.019);
    const tool=buildTool(key);tool.position.set(0,.038,-.012);slot.add(tool);
    if(key==='brush')tool.rotation.z=Math.PI;
    label(slot,0,.008,.110,.23,.038,tools[key].title,'','#222d2d','#d9dfce');
    trays.set(key,{tool,slot});
  });
  if(!camera.parent)scene.add(camera);
  const arms=group(camera), up=vec(0,1,0), delta=vec(0,0,0);
  const sleeveGeo=geometry(new T.CylinderGeometry(.79,1,1,14));
  const upperGeo=geometry(new T.CylinderGeometry(.9,1,1,14));
  const strap=material(0xb4c0b3,.09,.7);
  function connect(bone,a,b,radius,depthScale=1){
    delta.subVectors(b,a);
    bone.position.copy(a).addScaledVector(delta,.5);
    bone.scale.set(radius,Math.max(.0001,delta.length()),radius*depthScale);
    bone.quaternion.setFromUnitVectors(up,delta.normalize());
  }
  function arm(side){
    const wrist=group(arms),palm=group(wrist);
    const upper=mesh(arms,upperGeo,cloth,0,0,0);
    const lower=mesh(arms,sleeveGeo,cloth,0,0,0);
    const elbowPad=ball(arms,graphite,0,0,0,.056,.059,.056);
    const cuff=mesh(arms,cylGeo,graphite,0,0,0), band=mesh(arms,cylGeo,strap,0,0,0);
    const cuffSeam=mesh(arms,cylGeo,orange,0,0,0);
    const hand=window.createAnatomicalHand(T,palm,side);
    const shoulder=vec(side*.17,-.205,.065), socket=vec(0,0,0), elbow=vec(0,0,0);
    const line=vec(0,0,0), pole=vec(0,0,0), cuffStart=vec(0,0,0),stripe=vec(0,0,0),lineTip=vec(0,0,0);
    function solve(){
      // Analytic two-link IK. The projected elbow pole keeps the bend lateral during a reach.
      socket.set(side*.014,-.016,.083).applyQuaternion(wrist.quaternion).add(wrist.position);
      line.subVectors(socket,shoulder);const distance=Math.max(.0001,line.length());line.multiplyScalar(1/distance);
      pole.set(side*.78,-.78,.34);pole.addScaledVector(line,-pole.dot(line)).normalize();
      const humerus=Math.max(.292,distance*.51),forearm=Math.max(.264,distance*.49);
      const along=Math.min(humerus,(humerus*humerus-forearm*forearm+distance*distance)/(2*distance));
      elbow.copy(shoulder).addScaledVector(line,along).addScaledVector(pole,Math.sqrt(Math.max(0,humerus*humerus-along*along)));
      connect(upper,shoulder,elbow,.067,.94);elbowPad.position.copy(elbow);
      cuffStart.copy(socket).lerp(elbow,.16);
      connect(lower,elbow,cuffStart,.054,.91);connect(cuff,cuffStart,socket,.038,.89);
      stripe.copy(cuffStart).lerp(socket,.20);lineTip.copy(cuffStart).lerp(socket,.34);
      connect(band,stripe,lineTip,.039,.91);
      stripe.copy(cuffStart).lerp(socket,.43);lineTip.copy(cuffStart).lerp(socket,.49);
      connect(cuffSeam,stripe,lineTip,.0386,.90);
    }
    return {wrist,pose:hand.pose,solve,dispose:hand.dispose};
  }
  const right=arm(1),left=arm(-1),wrist=right.wrist,grip=group(wrist);
  const filterGrip=group(left.wrist,-.017,.003,.025);
  for(const [k,{tool}] of trays){
    const inHand=tool.clone(true);inHand.position.set(0,0,0);
    inHand.rotation.set(0,0,0);inHand.visible=false;
    grip.add(inHand);handTools.set(k,inHand);
  }
  // Removed and replacement assemblies can be carried in the same hand as service tools.
  function carriedPart(key){
    const p=group(grip);p.visible=false;handTools.set(key,p);return p;
  }
  // The service rig owns the single physical cartridge and attaches it to filterGrip.
  const filterKeys=new Set(['dirtyCartridge','cartridge']);
  const drive=carriedPart('drive');
  plate(drive,rubber,0,.006,-.016,.095,.057,.111,.011);
  plate(drive,graphite,0,.037,-.016,.088,.009,.104,.009);
  label(drive,0,.042,-.037,.063,.025,'POGON','','#242e31','#c1cfbe');
  ball(drive,material(0xb94933,.12,.48),0,.048,-.003,.014,.006,.014);
  box(drive,ivory,0,.054,-.006,.004,.002,.014);
  cylinderZ(drive,brass,0,.003,-.079,.017,.018);
  cylinderZ(drive,rubber,0,.003,-.090,.010,.007);
  box(drive,rubber,.025,-.009,.046,.026,.019,.023);
  const flowPart=carriedPart('flowPart');
  cylinderZ(flowPart,brass,0,.005,-.016,.020,.105);
  const nutGeo=geometry(new T.CylinderGeometry(.027,.027,.017,6));
  for(const z of [-.066,.035]){
    const nut=mesh(flowPart,nutGeo,brass,0,.005,z);nut.rotation.x=Math.PI/2;
    cylinderZ(flowPart,rubber,0,.005,z+(z<0?-.009:.009),.015,.003);
  }
  plate(flowPart,blue,0,.030,-.018,.049,.030,.056,.005);
  label(flowPart,0,.0452,-.017,.038,.028,'PRETOK','▲','#254954','#dbebda');
  box(flowPart,graphite,.028,.030,-.018,.015,.019,.023);
  const probe=carriedPart('probe');
  plate(probe,graphite,0,0,-.020,.069,.023,.095,.008);
  plate(probe,ivory,0,.018,-.020,.065,.020,.091,.007);
  for(let k=0;k<5;k++)box(probe,graphite,0,.0283,-.045+k*.009,.041,.0017,.003);
  cylinderZ(probe,rubber,0,.006,.032,.009,.023);
  rod(probe,rubber,[0,.006,.038],[-.012,.004,.064],.0036);
  rod(probe,rubber,[-.012,.004,.064],[-.027,-.001,.080],.0036);
  const driverTip=group(handTools.get('driver'),0,0,-.154);
  const lcd=document.createElement('canvas');lcd.width=640;lcd.height=640;
  const lcdCtx=lcd.getContext('2d'),lcdMap=new T.CanvasTexture(lcd);lcdMap.colorSpace=T.SRGBColorSpace;textures.add(lcdMap);
  const lcdMat=new T.MeshBasicMaterial({map:lcdMap,toneMapped:false});surfaces.add(lcdMat);
  const screens=['flow','thermo','meter'],lcdGeo=geometry(new T.PlaneGeometry(.096,.100));
  for(const key of screens){const screen=mesh(handTools.get(key),lcdGeo,lcdMat,0,.032,-.023);screen.rotation.x=-Math.PI/2}
  let lastDisplay='',raised=false,lift=0;
  function display(d,inspect){
    raised=inspect;const signature=JSON.stringify(d);if(signature===lastDisplay)return;lastDisplay=signature;
    const g=lcdCtx;g.fillStyle='#bcd1ae';g.fillRect(0,0,640,640);g.fillStyle='#223c35';g.fillRect(0,0,640,82);
    g.fillStyle='#e0ead4';g.font='bold 39px Segoe UI';g.fillText(d.heading,22,54,596);
    g.fillStyle='#35534b';g.font='bold 31px Consolas';g.fillText(d.status,25,137);
    d.rows.forEach((r,i)=>{const y=173+i*163;g.fillStyle='#476258';g.font='31px Segoe UI';g.fillText(r.name,25,y+23);
      g.fillStyle='#183229';g.font='bold 103px Consolas';g.fillText(r.value,19,y+120,400);g.font='bold 45px Segoe UI';g.fillText(r.unit,425,y+113,185);
      g.fillRect(22,y+138,589,2)});
    g.fillStyle='#324a3e';g.font='32px Segoe UI';g.fillText(d.note||'',23,578,596);
    g.font='22px Consolas';g.fillText('TOPLOLOG  /  FIELD METER',24,622);lcdMap.needsUpdate=true
  }
  function instrumentSocket(channel){const instrument=handTools.get(held)||grip;return instrument.localToWorld(vec(channel?.028:-.028,0,-.106))}
  const cartridgeRest=group(arms,-.145,-.142,-.38);
  const qp=new T.Quaternion(),qc=new T.Quaternion(),roll=new T.Quaternion();
  const targetPos=vec(0,0,0),offset=vec(0,0,0),forward=vec(0,0,1);
  arms.traverse(n=>{n.raycast=()=>{};n.castShadow=false;n.receiveShadow=false;});
  let isOpen=false,held=null,elapsed=0,stride=0,kick=0,operationT=0;
  function set({open,held:nextHeld}={}){
    if(open!==undefined)isOpen=!!open;
    if(nextHeld!==undefined&&held!==nextHeld){
      held=handTools.has(nextHeld)||filterKeys.has(nextHeld)?nextHeld:null;
      kick=1;
      for(const [key,tool] of handTools)tool.visible=key===held;
    }
    for(const [key,{tool,slot}] of trays){
      slot.visible=isOpen;tool.visible=key!==held;
      slot.userData.fieldId=key===held?'kit':'tool:'+key;
    }
    wrist.visible=true;
  }
  function animate(dt,walk=0,progress=0,contact=null){
    dt=Math.max(0,Math.min(Number(dt)||0,.1));
    elapsed+=dt;stride+=dt*(walk?9:0);kick=Math.max(0,kick-3.5*dt);
    const target=isOpen?-1.91:0;
    lid.rotation.x+=(target-lid.rotation.x)*(1-Math.exp(-dt*13));
    if(Math.abs(target-lid.rotation.x)<.001)lid.rotation.x=target;
    const active=Number(progress)>0&&Number(progress)<=1;
    operationT=active?operationT+dt:0;
    const effort=active?Math.min(1,operationT*7):0;
    const oscillation=Math.sin(operationT*(held==='brush'?19:12));
    const bob=walk?Math.sin(stride)*.006:Math.sin(elapsed*1.5)*.0017;
    // Keep the working hand in the lower-right quadrant even on portrait viewports.
    const x=Math.min(.19,.136*Math.max(.55,camera.aspect));
    wrist.position.set(x+bob*.52-effort*.031,held?-.15+Math.abs(bob)-kick*.045+effort*.030:-.21+bob,-.36-effort*.041);
    wrist.rotation.set(.52+effort*.19,.33+effort*.25,-.12+bob*.7);
    grip.rotation.z=effort*oscillation*.06;
    grip.position.z=held==='brush'?oscillation*effort*.027:0;
    left.wrist.position.set(-x,-.21-bob,-.36);left.wrist.rotation.set(.57,-.45,.25);
    cartridgeRest.position.set(-x,-.152-bob*.4,-.38);
    const carrying=filterKeys.has(held),panel=contact?.id==='cover',screw=contact?.id?.startsWith('screw:')||contact?.id==='radVent';
    const filter=contact&&['filterCap','filterSeat','cleanFilter','basinDrop'].includes(contact.id);
    const w=contact?.weight??0;
    lift+=((raised&&screens.includes(held)?1:0)-lift)*(1-Math.exp(-dt*12));
    const measuring=screens.includes(held);
    if(measuring){
      const distance=Math.max(.236,.144/Math.max(.4,camera.aspect));
      wrist.position.lerp(targetPos.set(-.022,-.016,-distance),lift);
      wrist.rotation.x+=((Math.PI/2-.04)-wrist.rotation.x)*lift;
      wrist.rotation.y*=1-lift;wrist.rotation.z*=1-lift;
    }
    right.pose(held&&!carrying?.90:.33,measuring?'instrument':'grip');left.pose(carrying?.9:.34);
    if(contact?.id==='secondaryPump'||contact?.id?.startsWith('probe:')||(contact?.id?.startsWith('rad')&&!screw)){
      targetPos.copy(contact.point);camera.worldToLocal(targetPos);
      left.wrist.position.lerp(targetPos.sub(offset.copy(filterGrip.position).applyQuaternion(left.wrist.quaternion)),w);
      left.pose(.78,'pinch')
    }
    if(carrying){left.wrist.position.copy(cartridgeRest.position).sub(offset.copy(filterGrip.position).applyQuaternion(left.wrist.quaternion))}
    grip.visible=!panel;
    if(screw){
      camera.getWorldQuaternion(qc).invert();
      // Regrip within the wrist's range while the bit stays in the cross recess.
      const wristRoll=.73*Math.sin(contact.twist);
      qp.setFromUnitVectors(forward,contact.normal).multiply(roll.setFromAxisAngle(forward,wristRoll)).premultiply(qc);
      targetPos.copy(contact.point);camera.worldToLocal(targetPos);
      targetPos.sub(offset.set(0,0,-.154).applyQuaternion(qp));
      grip.rotation.set(0,0,(contact.twist-wristRoll)*w);grip.position.set(0,0,0);
      wrist.position.lerp(targetPos,w);wrist.quaternion.slerp(qp,w);
      right.pose(.94-.26*w*Math.max(0,-Math.cos(contact.twist)));
    }
    if(panel||filter){
      targetPos.copy(contact.leftPoint||contact.point);camera.worldToLocal(targetPos);
      left.wrist.position.lerp(targetPos.sub(offset.copy(filterGrip.position).applyQuaternion(left.wrist.quaternion)),w);
      left.pose(.33+.63*w);
      if(panel){targetPos.copy(contact.point);camera.worldToLocal(targetPos);wrist.position.lerp(targetPos,w);right.pose(.34+.6*w)}
    }
    right.solve();left.solve();
  }
  function dispose(){
    left.dispose();right.dispose();
    scene.remove(root);camera.remove(arms);
    root.traverse(n=>{if(n.isInstancedMesh)n.dispose();});
    wrist.traverse(n=>{if(n.isInstancedMesh)n.dispose();});
    for(const m of surfaces)m.dispose();
    for(const g of parts)g.dispose();
    for(const texture of textures)texture.dispose();
  }
  set();animate(0);
  return {position:vec(-2.55,.93,1.40),root,set,animate,display,instrumentSocket,dispose,driverTip,cartridgeRest,filterGrip};
};
