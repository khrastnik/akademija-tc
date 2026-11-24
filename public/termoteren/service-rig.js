/* Physical service fixtures for the training monobloc. Coordinates are in scene metres. */
(() => {
  'use strict';
  window.createServiceRig = function createServiceRig({
    THREE: T, scene, machine, cover, rig, targets, wallSensor, flowSensor,
    fallenLeaves, lever, indicatorMat, signal,kit,camera
  }) {
    const resources = new Set(), attachments = [];
    const keep = object => (resources.add(object), object);
    const point = (x, y, z) => new T.Vector3(x, y, z);
    function group(parent, x=0, y=0, z=0, id) {
      const g = new T.Group(); g.position.set(x, y, z);
      if (id) g.userData.fieldId = id;
      parent.add(g); return g;
    }
    const fixtures = group(scene);
    attachments.push(fixtures);
    const geometry = {
      box: keep(new T.BoxGeometry(1, 1, 1)),
      cylinder: keep(new T.CylinderGeometry(1, 1, 1, 24)),
      hex: keep(new T.CylinderGeometry(1, 1, 1, 6)),
      sphere: keep(new T.SphereGeometry(1, 14, 8))
    };
    const material = (color, metalness=.12, roughness=.52) =>
      keep(new T.MeshStandardMaterial({color, metalness, roughness}));
    const steel = material(0x99a8a9,.78,.33), black = material(0x253034,.29,.57);
    const rubber = material(0x263137,.04,.88), brass = material(0xc19b5a,.7,.38);
    const zinc = material(0x87928e,.62,.52), white = material(0xcbd4ce,.14,.43);
    const teal = material(0x397b87,.4), red = material(0xb94334,.2), ochre = material(0xe5af48,.29);
    const metalScreen = material(0x81948f,.58,.59), dirt = material(0x62513b,0,.98);
    const leafColors = [0xb38544,0x99723b,0x946039].map(c=>material(c,.01,.92));
    function mesh(parent, geo, mat, x, y, z, w=1, h=1, d=1) {
      const m = new T.Mesh(geo,mat);
      m.position.set(x,y,z); m.scale.set(w,h,d); m.castShadow=m.receiveShadow=true;
      parent.add(m); return m;
    }
    const box = (p,x,y,z,w,h,d,m) => mesh(p,geometry.box,m,x,y,z,w,h,d);
    function cylinder(p,x,y,z,r,length,mat,axis='y',hex=false) {
      const m=mesh(p,hex?geometry.hex:geometry.cylinder,mat,x,y,z,r,length,r);
      if(axis==='z')m.rotation.x=Math.PI/2;
      if(axis==='x')m.rotation.z=Math.PI/2;
      return m;
    }
    function line(p,a,b,r,mat) {
      const start=point(...a),end=point(...b),vector=end.clone().sub(start);
      const m=cylinder(p,0,0,0,r,vector.length(),mat);
      m.position.copy(start.addScaledVector(vector,.5));
      m.quaternion.setFromUnitVectors(point(0,1,0),vector.normalize());
      return m;
    }
    function plate(p,x,y,z,w,h,text,bg='#233536',fg='#f0f2e1') {
      const c=document.createElement('canvas'); c.width=512;c.height=128;
      const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,512,128);
      g.fillStyle=fg;g.font='bold 75px Arial';g.textAlign='center';g.textBaseline='middle';
      g.fillText(text,256,69,488);
      const texture=keep(new T.CanvasTexture(c));texture.colorSpace=T.SRGBColorSpace;
      const m=keep(new T.MeshBasicMaterial({map:texture,toneMapped:false}));
      return mesh(p,keep(new T.PlaneGeometry(w,h)),m,x,y,z);
    }
    // The fasteners are captive. Bushes stay attached to the skin as the shanks back out.
    const oldBolts=cover.children.find(o=>o.isInstancedMesh&&o.count===4);
    if(oldBolts)oldBolts.visible=false;
    cover.userData.fieldId='cover';
    const screws=[];
    const added=parent=>{const g=group(parent);attachments.push(g);return g;};
    const screwHolder=added(cover);
    for(const x of [.509,1.252])for(const y of [.499,1.718]){
      const s=group(screwHolder,x,y,.484,'screw:'+screws.length);
      cylinder(s,0,0,0,.031,.013,zinc,'z');
      const head=group(s);cylinder(head,0,0,.019,.026,.028,steel,'z',true);
      cylinder(head,0,0,.003,.010,.07,black,'z');
      box(head,0,0,.034,.031,.005,.002,black);
      box(head,0,0,.034,.005,.024,.002,black);
      screws.push(head);
    }
    // Lean the L-shaped cover on a rubber mat beside the machine during service.
    const restMat=box(fixtures,3.35,.018,.59,1.36,.032,1.36,rubber);
    const restStand=group(fixtures,3.36,.04,.43,'panelRest');
    for(const x of [-.32,.32]){
      line(restStand,[x,0,0],[x,.83,-.19],.021,zinc);
      box(restStand,x,.045,.1,.13,.06,.27,rubber);
    }
    box(restStand,0,.78,-.18,.71,.045,.055,steel);
    plate(restStand,0,.71,-.145,.43,.074,'POKROV');
    const panelMount=added(machine);panelMount.userData.fieldId='panelMount';
    box(panelMount,.879,1.72,.411,.79,.061,.071,zinc);
    plate(panelMount,.879,1.72,.451,.25,.045,'VODILI');
    const isolatedSwitch=group(fixtures,2.15,1.43,-1.99,'isolator');
    box(isolatedSwitch,0,0,0,.29,.40,.16,white);
    box(isolatedSwitch,0,.035,.084,.25,.233,.023,ochre);
    cylinder(isolatedSwitch,0,.044,.108,.082,.044,red,'z');
    const switchHandle=group(isolatedSwitch,0,.044,.142);
    box(switchHandle,0,.026,0,.043,.142,.045,red);
    plate(isolatedSwitch,0,-.142,.084,.241,.046,'GLAVNO STIKALO');
    line(fixtures,[2.15,1.21,-2],[2.15,.5,-2],.016,zinc);
    // Remote hydronic test block tapped into the insulated pipes. Flat targets face the service aisle.
    const rack=group(fixtures,2.13,.99,-.62);
    box(rack,0,-.08,0,.88,.77,.10,zinc);
    for(const x of [-.32,.32]){
      box(rack,x,-.67,-.035,.045,.63,.055,steel);box(rack,x,-.956,-.03,.15,.048,.21,black);
      cylinder(rack,x,-.44,.021,.047,.23,brass,'y',true);
    }
    line(fixtures,[1.48,.605,-.62],[1.81,.605,-.62],.041,brass);
    line(fixtures,[1.48,1.134,-.62],[1.81,1.134,-.62],.041,brass);
    plate(rack,0,.244,.055,.74,.075,'MERILNA MESTA VODE');
    function station(id,x,y,title){
      const g=group(rack,x,y,.083,'test:'+id);
      box(g,0,0,0,.24,.207,.057,black);
      plate(g,0,-.075,.032,.22,.042,title);
      return g;
    }
    const returnPoint=station('pump',-.276,.062,'PRETOK');
    cylinder(returnPoint,0,.036,.043,.048,.138,brass,'x');
    box(returnPoint,0,.051,.086,.084,.064,.038,teal);
    const filterPoint=station('filter',0,.062,'FILTER Δp');
    cylinder(filterPoint,0,.029,.047,.066,.03,steel,'z');
    cylinder(filterPoint,0,.029,.065,.054,.006,white,'z');
    const filterNeedle=group(filterPoint,0,.029,.072);
    box(filterNeedle,0,.016,0,.006,.039,.004,black);
    const valvePoint=station('valve',.276,.062,'VEJI A / B');
    for(const x of [-.06,.06]){cylinder(valvePoint,x,.03,.054,.035,.052,x<0?red:teal,'z');}
    const flowPoint=station('sensor',.276,-.207,'TIPALO PRETOKA');
    box(flowPoint,0,.022,.047,.18,.072,.04,teal);
    plate(flowPoint,0,.022,.07,.132,.033,'Q   BUS');
    const water=group(rack,-.078,-.215,.092,'water');
    box(water,0,0,0,.37,.181,.046,black);
    plate(water,0,-.062,.025,.326,.047,'IZOLACIJA / IZPUST');
    cylinder(water,0,.023,.043,.039,.065,brass,'z');
    const waterHandle=group(water,0,.023,.086);
    box(waterHandle,.056,0,0,.184,.032,.031,teal);
    // The washing station stands just behind the tool table, on the technician's side of the facade.
    const bench=group(fixtures,-2.55,0,-.16);
    const basin=group(bench,0,.79,0);
    box(basin,0,0,0,1.08,.048,.53,steel);
    for(const x of [-.46,.46])for(const z of [-.185,.185])
      box(bench,x,.397,z,.034,.79,.035,zinc);
    for(const x of [-.525,.525])box(basin,x,.043,0,.03,.088,.53,steel);
    for(const z of [-.251,.251])box(basin,0,.043,z,1.06,.088,.026,steel);
    plate(basin,0,.04,.268,.55,.06,'SERVISNI PLADENJ');
    line(basin,[-.46,.02,-.19],[-.46,.29,-.19],.014,steel);
    line(basin,[-.46,.29,-.19],[-.31,.29,-.19],.014,steel);
    line(basin,[-.31,.29,-.19],[-.31,.24,-.19],.014,steel);
    // Actual removable elements of the original model. Stationary brass fittings and branch pipes remain.
    const cartridge=targets.filter.children.filter(o=>o.position.z>.19);
    const drive=targets.valve.children.filter(o=>o.position.z>.25);
    const flowModule=flowSensor.children.filter(o=>o.position.z>.17);
    const filterSocket=added(targets.filter);filterSocket.userData.fieldId='filterSeat';
    cylinder(filterSocket,1.043,.573,.227,.075,.07,brass,'z',true);
    cylinder(filterSocket,1.043,.573,.265,.053,.008,black,'z');
    const extracted=group(basin,0,.141,0);
    const grid=document.createElement('canvas');grid.width=grid.height=64;const ink=grid.getContext('2d');
    ink.fillStyle='#384540';ink.fillRect(0,0,64,64);ink.lineWidth=2.4;ink.strokeStyle='#b1beb8';
    for(let k=-64;k<128;k+=12){ink.beginPath();ink.moveTo(k,0);ink.lineTo(k+64,64);ink.moveTo(k,64);ink.lineTo(k+64,0);ink.stroke()}
    const weave=keep(new T.CanvasTexture(grid));weave.wrapS=weave.wrapT=T.RepeatWrapping;weave.repeat.set(5,8);weave.colorSpace=T.SRGBColorSpace;metalScreen.map=weave;
    cylinder(extracted,0,0,0,.066,.658,metalScreen,'x');
    for(const x of [-.323,.323])cylinder(extracted,x,0,0,.078,.034,brass,'x',true);
    // Three independently brushable areas. Raised strainer ribs remain visible after the dirt is removed.
    let seed=273;
    function random(){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;}
    for(let i=0;i<28;i++)cylinder(extracted,-.3+i*.022,0,0,.069,.005,steel,'x');
    const dirty=[];
    for(let i=0;i<3;i++){
      const g=group(extracted,(i-1)*.204,0,0,'dirty:'+i);
      cylinder(g,0,0,0,.073,.186,dirt,'x');
      for(let j=0;j<8;j++){
        const angle=random()*2.5-.5;
        mesh(g,geometry.sphere,dirt,(random()-.5)*.147,.071*Math.cos(angle),.071*Math.sin(angle),.027,.012,.019);
      }dirty.push(g);
    }
    const leaves=[];
    for(let i=0;i<3;i++){
      const g=group(fixtures,-1.00+i*.55,1.05,-.523,'leaf:'+i);
      for(let j=0;j<16;j++){
        const x=(random()-.5)*.43,y=(random()-.5)*.64,z=-random()*.014;
        const leaf=mesh(g,geometry.sphere,leafColors[(i+j)%3],x,y,z,.046+random()*.018,.079+random()*.018,.013);
        leaf.rotation.z=random()*Math.PI*2;
      }
      // Bounding surface follows the patch and only catches clicks on the dirty section of the coil.
      const catcher=box(g,0,0,.021,.47,.73,.025,keep(new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false})));
      catcher.castShadow=catcher.receiveShadow=false;leaves.push(g);
    }
    const shaded=group(fixtures,.72,1.71,-1.97,'newMount');
    box(shaded,0,0,0,.198,.275,.036,zinc);
    box(shaded,0,.165,.07,.32,.028,.225,black);
    for(const y of [-.092,.092])cylinder(shaded,0,y,.026,.011,.019,steel,'z');
    // The spare and the mock-up on the receiver are distinct meshes. Arrows give the alignment a datum.
    const spare=group(basin,0,.14,0,'spare');
    const receiverDrive=added(targets.valve);receiverDrive.userData.fieldId='driveSeat';
    const receiverFlow=added(flowSensor);receiverFlow.userData.fieldId='flowSeat';
    cylinder(receiverDrive,1.02,1.166,.237,.059,.078,brass,'z',true);
    box(receiverDrive,1.02,1.214,.276,.016,.044,.012,ochre);
    cylinder(receiverFlow,1.167,.831,.202,.053,.07,brass,'z',true);
    box(receiverFlow,1.167,.882,.238,.012,.038,.014,ochre);
    function sparePart(parent,isFlow,ghost=false){
      const g=group(parent);
      const casing=ghost?keep(new T.MeshStandardMaterial({color:0x83c8b1,transparent:true,opacity:.75,metalness:.2,roughness:.46})):(isFlow?teal:black);
      box(g,0,0,0,isFlow?.139:.191,isFlow?.094:.139,.087,casing);
      if(isFlow){cylinder(g,0,.004,-.048,.038,.134,brass,'y',true);}
      else{box(g,-.061,0,.047,.022,.083,.012,red);cylinder(g,0,0,-.047,.052,.043,brass,'z');}
      const arrowMat=ghost?ochre:white;
      box(g,0,.008,.051,.009,.064,.006,arrowMat);
      box(g,-.010,.034,.051,.008,.032,.006,arrowMat).rotation.z=-.67;
      box(g,.010,.034,.051,.008,.032,.006,arrowMat).rotation.z=.67;
      return g;
    }
    const spareDrive=sparePart(spare,false),spareFlow=sparePart(spare,true);
    spare.rotation.x=-Math.PI*.33;
    const driveGhost=sparePart(receiverDrive,false,true);
    driveGhost.position.set(1.02,1.166,.313);
    const flowGhost=sparePart(receiverFlow,true,true);
    flowGhost.position.set(1.167,.831,.285);
    scene.attach(extracted);attachments.push(extracted);extracted.scale.setScalar(.48);
    const slide=(v)=>{v=T.MathUtils.clamp(v,0,1);return v*v*(3-2*v)};
    const slot=point(1.043,.573,.18),rinse=basin.localToWorld(point(0,.077,0));
    const seated=new T.Quaternion().setFromAxisAngle(point(0,1,0),-Math.PI/2);
    const flat=new T.Quaternion(),out=point(0,0,1);
    const storedPos=point(2.35,-.355,.55),storedQ=new T.Quaternion().setFromEuler(new T.Euler(0,.155,-.075));
    const leftEdge=point(.81,1.69,.498),rightEdge=point(1.19,1.69,.498);
    const zero=point(0,0,0);
    function handPose(){
      const origin=kit.cartridgeRest.getWorldPosition(new T.Vector3());
      return {position:origin,rotation:kit.cartridgeRest.getWorldQuaternion(new T.Quaternion())};
    }
    function panelPose(where){
      if(where==='frame')return {position:zero,rotation:flat};
      if(where==='stand')return {position:storedPos,rotation:storedQ};
      const rotation=camera.getWorldQuaternion(new T.Quaternion()).multiply(new T.Quaternion().setFromEuler(new T.Euler(.16,.22,-.09)));
      const position=camera.localToWorld(point(-.19,-.18,-.49)).sub(leftEdge.clone().applyQuaternion(rotation));
      return {position,rotation};
    }
    function movePanel(from,to,t,lift){
      const a=panelPose(from),b=panelPose(to);
      cover.position.lerpVectors(a.position,b.position,t);cover.quaternion.slerpQuaternions(a.rotation,b.rotation,t);
      cover.position.y+=lift*Math.sin(Math.PI*t);cover.position.z+=lift*.8*Math.sin(Math.PI*t);
    }
    function panelContact(w){
      return {id:'cover',point:cover.localToWorld(rightEdge.clone()),leftPoint:cover.localToWorld(leftEdge.clone()),weight:w,normal:out,twist:0};
    }
    let state=null;
    function setTag(object,id){if(id)object.userData.fieldId=id;else delete object.userData.fieldId;}
    function setModule(objects,visible,id){
      for(const object of objects){object.visible=visible;setTag(object,id);}
    }
    function poseCover(amount){
      cover.rotation.set(0,amount*.155,-amount*.075);
      cover.position.set(2.35*amount,-.355*amount,.55*amount);
    }
    function sync(field){
      state=field;
      const level=field.caseIndex,repair=field.phase==='procedure',fixed=!!field.fixed,removed=!!field.removed&&!fixed;
      const clean=field.cleaned||[],undone=field.screws||[];
      rack.visible=level!==9;
      const filterOut=level===0&&removed,driveOut=level===4&&removed,flowOut=level===5&&removed;
      cover.visible=true;rig.visible=!field.opened;poseCover(field.opened?1:0);
      cover.userData.nonBlocking=!!field.panel;panelMount.visible=field.panel==='in';
      restStand.visible=field.opened;setTag(restStand,field.panel==='out'?'panelRest':null);
      restMat.visible=!!field.opened||undone.length>0;
      screws.forEach((s,i)=>{
        const loose=undone.includes(i);s.position.z=loose?.043:0;s.rotation.z=loose?Math.PI*4.36:0;
        setTag(s.parent,field.opened?null:'screw:'+i);
      });
      waterHandle.rotation.z=field.drained?Math.PI*.5:0;
      switchHandle.rotation.z=field.isolated?Math.PI*.5:0;
      filterNeedle.rotation.z=level===0&&!fixed&&!field.drained?-.95:.85;
      flowPoint.visible=level===5;
      filterSocket.visible=filterOut;
      setModule(cartridge,!filterOut,repair&&level===0&&!fixed?'filterCap':null);
      extracted.visible=filterOut;
      extracted.position.copy(rinse);extracted.quaternion.identity();
      const carryingFilter=['dirtyCartridge','cartridge'].includes(field.carry);
      extracted.userData.nonBlocking=carryingFilter;
      setTag(basin,field.carry==='dirtyCartridge'?'basinDrop':null);
      setTag(extracted,repair&&filterOut&&clean.length===3?'cleanFilter':null);
      dirty.forEach((g,i)=>{g.visible=!clean.includes(i);g.scale.set(1,1,1);});
      fallenLeaves.visible=false;
      leaves.forEach((g,i)=>{
        g.visible=level===1&&!fixed&&!clean.includes(i);setTag(g,repair?'leaf:'+i:null);g.userData.part='coil';g.scale.set(1,1,1);
      });
      shaded.visible=level===2;
      setTag(shaded,repair&&removed&&level===2?'newMount':null);
      wallSensor.visible=level!==5&&!(level===2&&removed);
      wallSensor.position.x=level===2&&fixed?-.998:0;
      setTag(wallSensor,repair&&level===2&&!removed&&!fixed?'oldSensor':null);
      flowSensor.visible=level===5;
      setModule(drive,!driveOut,repair&&level===4&&!fixed?'oldDrive':null);
      setModule(flowModule,!flowOut,repair&&level===5&&!fixed?'oldFlow':null);
      receiverDrive.visible=driveOut;receiverFlow.visible=flowOut;
      driveGhost.visible=flowGhost.visible=!!field.spare;
      driveGhost.rotation.z=flowGhost.rotation.z=(field.turn||0)*Math.PI*.5;
      spare.visible=repair&&(driveOut||flowOut)&&!field.spare;
      spareDrive.visible=level===4;spareFlow.visible=level===5;
      lever.rotation.z=level===4&&!fixed?1.48:0;
      indicatorMat.color.setHex(level===0&&!fixed?0xad4630:0x488969);
      signal.color.setHex(level===5&&!fixed?0xb9412a:0x5ba17c);
    }
    function idle(){
      if(state?.panel){movePanel('hands','hands',0,0);return panelContact(1)}
      if(['dirtyCartridge','cartridge'].includes(state?.carry)){
        const h=handPose();extracted.position.copy(h.position);extracted.quaternion.copy(h.rotation);
        return {id:'filterCap',point:h.position,weight:1,normal:out,twist:0}
      }
      return null
    }
    function animate(id,progress){
      if(!state)return;
      const p=Math.max(0,Math.min(1,progress||0));
      if(!id)return idle();
      if(id.startsWith('screw:')){
        const index=Number(id.slice(6)),s=screws[index];if(!s)return;
        const turning=slide((p-.24)/.58);
        const back=(state.screws||[]).includes(index)?1-turning:turning;
        s.position.z=.043*back;s.rotation.z=back*Math.PI*4.36;
        return {id,point:s.localToWorld(point(0,0,.0345)),normal:out,twist:s.rotation.z,weight:slide(p/.23)*(1-slide((p-.84)/.16))};
      }else if(['cover','panelRest','panelMount'].includes(id)){
        const pickup=id==='cover',from=pickup?(state.opened?'stand':'frame'):'hands',to=pickup?'hands':id==='panelRest'?'stand':'frame';
        movePanel(from,to,slide((p-.23)/.63),.09);rig.visible=false;
        return panelContact(pickup?slide(p/.22):1-slide((p-.85)/.15));
      }else if(['filterCap','filterSeat','cleanFilter','basinDrop'].includes(id)){
        const h=handPose(),pickup=id==='filterCap'||id==='cleanFilter',atUnit=id==='filterCap'||id==='filterSeat';
        const s=atUnit?slot:rinse,q=atUnit?seated:flat,amount=slide((p-.21)/.65),t=pickup?amount:1-amount;
        extracted.visible=true;extracted.userData.nonBlocking=true;
        if(atUnit){setModule(cartridge,false,null);filterSocket.visible=true}
        // Pull along the bore before swinging the cartridge toward the palm.
        if(atUnit&&t<.38){extracted.position.copy(s);extracted.position.z+=.23*slide(t/.38);extracted.quaternion.copy(q)}
        else{const a=s.clone();if(atUnit)a.z+=.23;const k=atUnit?(t-.38)/.62:t;
          extracted.position.lerpVectors(a,h.position,k);extracted.position.y+=.035*Math.sin(Math.PI*k);
          extracted.quaternion.slerpQuaternions(q,h.rotation,k)}
        return {id,point:extracted.position.clone(),weight:pickup?slide(p/.2):1-slide((p-.87)/.13),normal:out,twist:0};
      }
      else if(id==='isolator'){switchHandle.rotation.z=(state.isolated?1-p:p)*Math.PI*.5;}
      else if(id==='water'){waterHandle.rotation.z=(state.drained?1-p:p)*Math.PI*.5;}
      else if(id.startsWith('dirty:')||id.startsWith('leaf:')){
        const isDirt=id.startsWith('dirty:'),index=Number(id.split(':')[1]),g=(isDirt?dirty:leaves)[index];
        if(g)g.scale.set(1-p*.38,1-p*.56,1);
      }
    }
    function dispose(){
      for(const item of attachments)item.removeFromParent();
      for(const resource of resources)resource.dispose();
      // Original meshes belong to the monobloc and are disposed by its owner.
    }
    return {sync,animate,idle,dispose};
  };
})();
