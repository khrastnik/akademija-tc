window.createFirstPerson=function({T,host,canvas,scene,camera,kit,service,callbacks,render}){
 const keys=new Set(),ray=new T.Raycaster(),ndc=new T.Vector2(),axis=new T.Vector2();
 const world=new T.Vector3(),vector=new T.Vector3(),box=new T.Box3();
 const bufferCase=callbacks.state().f.caseIndex===9;
 const player=new T.Vector3(bufferCase?1.42:1.28,1.59,bufferCase?4.40:3.75);
 let yaw=bufferCase?-.13:.30,pitch=-.15,crouched=false,raf=0,previous=0,lastPick=0,lastHud='',lastGuide='',scenePainted=false;
 let highlighted=null,hold=null,drag=null,hover=null,walking=0,clock=0,running=true,guidePoint=null;
 const controller=new AbortController(),opts={signal:controller.signal};
 const on=(el,type,handler)=>el.addEventListener(type,handler,opts);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const reach=1.85;
 const probes=window.createProbeRig(T,scene,kit);
 // Pokrov in vijaki: brez približanja, da vidiš celoten pokrov in roko z izvijačem.
const precision=id=>['panelRest','panelMount','filterCap','basinDrop','cleanFilter','filterSeat','radVent','radPin','radHead'].includes(id);
 const workRange=id=>precision(id)||id?.startsWith('probe:')?1.32:reach;
 let lean=0,leanTo=null;
 const eyeRotation=new T.Quaternion(),aimRotation=new T.Quaternion(),aimMatrix=new T.Matrix4();
 const blocked=()=>Boolean(document.querySelector('dialog[open]'))||document.hidden;
 const state=()=>callbacks.state();
 camera.fov=bufferCase?72:66;camera.near=.035;camera.rotation.order='YXZ';camera.updateProjectionMatrix();
 if(!camera.parent)scene.add(camera);
 canvas.setAttribute('aria-label','Prvoosebni servis. WASD za hojo, povlek ali puščice za pogled, C za počep, H za smer in E za poseg.');
 canvas.style.cursor='crosshair';
 const pose=callbacks.pose?.();
 if(pose&&[pose.x,pose.z,pose.yaw,pose.pitch].every(Number.isFinite)){
  player.x=T.MathUtils.clamp(pose.x,-6,6);player.z=T.MathUtils.clamp(pose.z,-1.8,6.5);
  yaw=pose.yaw;pitch=pose.pitch;crouched=Boolean(pose.crouched);
 }
 function cameraUpdate(dt){
  const turn=(keys.has('ArrowLeft')?1:0)-(keys.has('ArrowRight')?1:0);
  yaw+=turn*dt*1.7;pitch=T.MathUtils.clamp(pitch+((keys.has('ArrowUp')?1:0)-(keys.has('ArrowDown')?1:0))*dt*1.38,-1.48,1.37);
  axis.set((keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0),(keys.has('KeyW')?1:0)-(keys.has('KeyS')?1:0));
  const amount=axis.length();if(amount>1)axis.normalize();
  walking=Math.min(1,amount);clock+=dt;
  const speed=dt*(crouched?1.1:(keys.has('ShiftLeft')||keys.has('ShiftRight'))?3.15:1.95);
  const dx=speed*(axis.x*Math.cos(yaw)-axis.y*Math.sin(yaw)),dz=speed*(-axis.x*Math.sin(yaw)-axis.y*Math.cos(yaw));
  if(clear(player.x+dx,player.z))player.x+=dx;
  if(clear(player.x,player.z+dz))player.z+=dz;
  player.y=T.MathUtils.lerp(player.y,crouched?.92:1.59,1-Math.exp(-dt*12));
  camera.position.copy(player);if(!reduced)camera.position.y+=walking*Math.sin(clock*10)*.015;
  camera.rotation.set(pitch,yaw,0,'YXZ');camera.updateMatrixWorld();
  if(amount||turn)hover=null;
 }
 function clear(x,z){
  const m=state().f.measurement;
  if(m?.ports.length){
   const port=probes.point('probe:'+m.ports[0]);
   if(port&&Math.hypot(x-port.x,z-port.z)>Math.max(2.1,Math.hypot(player.x-port.x,player.z-port.z))+.00001)return false;
  }
  // Pri Žireh (ni kotlovnice) je zunanje tipalo za levim vogalom hiše; ta kotiček je prehoden.
  const nook=state().f.caseIndex===9&&x< -4.06&&x> -5.6&&z> -4.2;
  if(x < -6||x>6||(z< -1.82&&!nook)||z>6.5)return false;
  const rect=(a,b,c,d)=>x>a&&x<b&&z>c&&z<d;
  if(rect(-1.58,1.58,-.73,.81)||rect(-3.31,-1.81,.85,1.94)||rect(-3.19,-1.89,-.66,.47))return false;
  const level=state().f.caseIndex;
  if(rect(1.29,1.68,-1.83,.30))return false;
  if(level!==9&&(rect(3.5,3.7,-2.1,.12)||rect(3.5,3.98,-.08,.12)||rect(4.82,6,-.08,.12)||rect(5.22,6,-2.1,-1.3)))return false;
  if(level===9&&(rect(2.12,3.18,-1.82,-1.05)||rect(3.25,5.98,-2.05,-.91)))return false;
  if(((level>=6&&level<=8)||level===10||level===11)&&rect(-6,-3.08,-2.05,-.91))return false;
  return !(state().f.opened&&rect(2.86,3.83,.59,1.18))
 }
 function idOf(obj){
  let field=null,part=null;
  for(let n=obj;n&&n!==scene;n=n.parent){
   if(!n.visible||n===camera)return null;
   field??=n.userData.fieldId;part??=n.userData.part;
  }
  return field||part||null
 }
 function pick(pos){
  if(pos){const r=canvas.getBoundingClientRect();ndc.set((pos.x-r.left)/r.width*2-1,1-(pos.y-r.top)/r.height*2)}else ndc.set(0,0);
  ray.setFromCamera(ndc,camera);ray.far=13;
  for(const hit of ray.intersectObjects(scene.children.filter(o=>o!==camera&&o.visible&&!o.isLight),true)){
   let visible=true;for(let n=hit.object;n;n=n.parent){if(!n.visible||n.userData.nonBlocking){visible=false;break}}
   if(!visible)continue;
   const id=idOf(hit.object);return id?{id,d:hit.distance,point:hit.point}:null;
  }
  return null;
 }
 // Resolve the guide from scene geometry so it follows a parked panel or a relocated sensor.
 function locate(id,visibleSurface=false){
  if(!id||id==='tablet'||id==='instrument')return null;
  let best=null;
  scene.traverseVisible(o=>{
   if(best||(!o.userData.fieldId&&!o.userData.part)||idOf(o)!==id)return;
   box.setFromObject(o);if(!box.isEmpty())best=box.getCenter(new T.Vector3());
  });
  if(best&&visibleSurface){
   const candidates=[best],bounds=new T.Box3();
   scene.traverseVisible(o=>{
    if(!o.isMesh||idOf(o)!==id||candidates.length>55)return;
    bounds.setFromObject(o);const middle=bounds.getCenter(new T.Vector3());candidates.push(middle);
    if(candidates.length<30)candidates.push(new T.Vector3(middle.x,bounds.max.y,middle.z));
   });
   for(const p of candidates){
    ray.set(camera.position,p.clone().sub(camera.position).normalize());ray.far=13;
    const hit=ray.intersectObjects(scene.children.filter(o=>o!==camera&&o.visible&&!o.isLight),true).find(h=>{
     for(let n=h.object;n;n=n.parent)if(!n.visible||n.userData.nonBlocking)return false;return true
    });
    if(hit&&idOf(hit.object)===id)return hit.point;
   }
  }
  return best
 }
 function direction(){
  guidePoint=locate(lastGuide,true);
  if(!guidePoint)return;
  vector.copy(guidePoint).sub(camera.position);
  yaw=Math.atan2(-vector.x,-vector.z);pitch=T.MathUtils.clamp(Math.atan2(vector.y,Math.hypot(vector.x,vector.z)),-1.48,1.37);
  hover=null;lastPick=0;canvas.focus({preventScroll:true});
 }
 function sync(){
  const {f,j,c}=state();kit.set({open:f.kitOpen,held:f.carry||f.held});service.sync(f);probes.sync(f);
  scene.updateMatrixWorld(true);lastGuide=FieldRules.target(f,j,c);guidePoint=locate(lastGuide);
  callbacks.shadowsChanged?.();
  lastPick=0;lastHud='';
 }
 function setHud(hit,progress){
  const {f,j,c}=state();
  let title='Prosti pogled',verb='Približaj se predmetu in ga nameri.',available=false;
  if(hit){
   title=FieldRules.label(hit.id);
   const a=FieldRules.action(f,j,c,hit.id);
   verb=hit.d>workRange(hit.id)?'Stopi bliže ali počepni · '+hit.d.toFixed(1).replace('.',',')+' m':a.verb;
   available=hit.d<=workRange(hit.id)&&a.enabled;
  }
  const signature=title+'|'+verb+'|'+available;
  if(signature!==lastHud){callbacks.aim(title,verb,available);lastHud=signature}
  callbacks.progress(progress);
  if(guidePoint){
   world.copy(guidePoint).project(camera);
   vector.copy(guidePoint).sub(camera.position);const dist=vector.length();
   callbacks.guide({id:lastGuide,x:world.x,y:world.y,visible:world.z>0&&world.z<1&&Math.abs(world.x)<.92&&Math.abs(world.y)<.81,distance:dist});
  }else callbacks.guide(null)
 }
 function start(pos,source){
  if(blocked()||hold||callbacks.reading?.())return;
  const hit=pick(pos);
  if(!hit)return;
  highlighted=hit;setHud(hit,0);
  if(hit.d>workRange(hit.id))return;
  const {f,j,c}=state(),a=FieldRules.action(f,j,c,hit.id);
  if(!a.enabled)return;
  if(precision(hit.id))leanTo=hit.point.clone();
  hold={id:hit.id,elapsed:0,pos,source,seconds:a.seconds};
 }
 function stop(){if(hold){service.sync(state().f);probes.sync(state().f);hold=null;callbacks.progress(0)}}
 function clearInputs(){keys.clear();drag=null;stop()}
 function frame(time){
  if(!running)return;raf=requestAnimationFrame(frame);
  if(previous&&time-previous<31)return;
  const dt=Math.min(.1,(time-(previous||time))/1000);previous=time;
  if(blocked()){
   clearInputs();
   if(!scenePainted&&!document.hidden){render(0,state().f);scenePainted=true}
   return;
  }
  cameraUpdate(dt);let p=0,contact=null;
  const engage=hold&&precision(hold.id)?1:0;
  lean+=(engage-lean)*(1-Math.exp(-dt*11));
  if(leanTo&&lean>.002){
    vector.copy(leanTo).sub(camera.position);const d=vector.length();
    camera.position.addScaledVector(vector,lean*Math.max(0,Math.min(.65,d-.55))/Math.max(.001,d));
    eyeRotation.copy(camera.quaternion);aimMatrix.lookAt(camera.position,leanTo,camera.up);
    aimRotation.setFromRotationMatrix(aimMatrix);camera.quaternion.copy(eyeRotation).slerp(aimRotation,lean);
    camera.updateMatrixWorld();
  }
  if(hold){
   const hit=highlighted;const {f,j,c}=state();
   if(!hit||walking||keys.has('ArrowLeft')||keys.has('ArrowRight')||keys.has('ArrowUp')||keys.has('ArrowDown')){stop()}
   else{
    highlighted=hit;hold.elapsed+=dt;p=Math.min(1,hold.elapsed/hold.seconds);
    if(hold.id.startsWith('probe:'))contact=probes.reach(hold.id,p);
    else if(hold.id==='secondaryPump')contact=probes.pumpReach(p);
    else if(hold.id.startsWith('rad'))contact=probes.serviceReach(hold.id,p);
    else contact=service.animate(hold.id,p,dt);
    if(p>=1){const a=FieldRules.action(f,j,c,hit.id);stop();if(a.enabled){a.change();if(hit.id.startsWith('probe:'))callbacks.savePose({x:player.x,z:player.z,yaw,pitch,crouched});callbacks.changed(hit.id,a.verb);if(!running)return;sync()}p=0;contact=null}
   }
  }else if(time-lastPick>85||!lastPick){highlighted=pick(hover);lastPick=time}
  const {f,j,c}=state();setHud(highlighted,p);if(!contact)contact=service.idle();
  if(['flow','thermo','meter'].includes(f.held)){kit.display(Measurements.screen(f,j,c),!!callbacks.reading?.());callbacks.readiness?.(Measurements.stable(f.measurement))}
  else kit.display({heading:'',status:'',rows:[]},false);
  kit.animate(dt,reduced?0:walking,p,contact);cinematic(contact,dt);probes.animate();render(dt,f);scenePainted=true;
 }
 function resize(){const w=host.clientWidth,h=host.clientHeight;if(w&&h){camera.aspect=w/h;camera.updateProjectionMatrix();callbacks.resize(w,h)}}
 const observer=new ResizeObserver(resize);observer.observe(host);resize();
 function keyDown(e){
  if(blocked()||e.ctrlKey||e.altKey||e.metaKey||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
  if(e.code==='KeyI'&&!e.repeat){callbacks.toggleReading?.();return}
  if(callbacks.reading?.())return;
  if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'].includes(e.code)){e.preventDefault();keys.add(e.code);return}
  if(e.repeat)return;
  if(e.code==='KeyE'){e.preventDefault();hover=null;start(null,'key')}
  if(e.code==='KeyC')crouched=!crouched;
  if(e.code==='KeyH')direction();
  if(e.code==='KeyR')callbacks.rotate();
 }
 on(window,'keydown',keyDown);on(window,'keyup',e=>{keys.delete(e.code);if(e.code==='KeyE'&&hold?.source==='key')stop()});
 on(window,'blur',clearInputs);on(document,'visibilitychange',clearInputs);
 function look(dx,dy){if(Math.abs(dx)+Math.abs(dy)>2)stop();yaw-=dx*.004;pitch=T.MathUtils.clamp(pitch-dy*.004,-1.48,1.37);hover=null}
 on(canvas,'contextmenu',e=>e.preventDefault());
 on(canvas,'pointerdown',e=>{
  if(drag||e.button>2)return;canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);
  const pos={x:e.clientX,y:e.clientY};drag={...pos,ox:pos.x,oy:pos.y,id:e.pointerId,looking:e.button===2};
  if(e.button===0){hover=document.pointerLockElement===canvas?null:pos;start(hover,'pointer')}
 });
 on(canvas,'pointermove',e=>{
  if(document.pointerLockElement===canvas){look(e.movementX,e.movementY);return}
  if(!drag){hover={x:e.clientX,y:e.clientY};return}if(drag.id!==e.pointerId)return;
  if(Math.hypot(e.clientX-drag.ox,e.clientY-drag.oy)>5)drag.looking=true;
  if(drag.looking){stop();look(e.clientX-drag.x,e.clientY-drag.y)}
  drag.x=e.clientX;drag.y=e.clientY
 });
 function release(){drag=null;if(hold?.source==='pointer')stop()}
 on(canvas,'pointerup',release);on(canvas,'pointercancel',release);on(canvas,'pointerleave',()=>{if(!drag)hover=null});
 on(document,'pointerlockchange',()=>{hover=null;clearInputs()});
 function releaseMouse(){if(document.pointerLockElement===canvas)document.exitPointerLock();clearInputs()}
 // Samodejni pokrov: kamera se odmakne in pokaže celega serviserja.
 const worker=window.createWorker?.(T,scene),cineEye=new T.Vector3(),cineLook=new T.Vector3(),cineM=new T.Matrix4(),cineQ=new T.Quaternion();
 let cine=0,lastContact=null;
 function cinematic(contact,dt){
  if(!worker)return;
  const on=!!hold&&(hold.id==='cover'||hold.id.startsWith('screw:'))&&!!contact&&(contact.id==='cover'||contact.id?.startsWith('screw:'));
  if(on)lastContact=contact;
  cine+=((on?1:0)-cine)*(1-Math.exp(-dt*(on?4.5:6)));if(cine<.004){cine=0;lastContact=null}
  worker.update(cine>.25&&lastContact?lastContact:null,dt);
  if(kit.arms)kit.arms.visible=cine<.35;
  if(!cine||!worker.root.visible)return;
  const b=worker.body.position;
  cineEye.set(b.x+1.5,1.72,b.z+1.95);cineLook.set(b.x-.3,1.0-(.93-b.y)*.5,b.z-.5);
  cineM.lookAt(cineEye,cineLook,camera.up);cineQ.setFromRotationMatrix(cineM);
  camera.position.lerp(cineEye,cine);camera.quaternion.slerp(cineQ,cine);camera.updateMatrixWorld();
 }
 sync();cameraUpdate(0);raf=requestAnimationFrame(frame);canvas.focus({preventScroll:true});
 return {sync,direction,releaseMouse,move(code,down){if(down){keys.add(code);hover=null}else keys.delete(code)},crouch(){crouched=!crouched},
  lookLock(){const p=canvas.requestPointerLock?.();p?.catch(()=>callbacks.message('Za razgled povleci po prizoru.'))},
  destroy(){running=false;callbacks.savePose({x:player.x,z:player.z,yaw,pitch,crouched});releaseMouse();cancelAnimationFrame(raf);observer.disconnect();controller.abort();probes.dispose();kit.dispose();service.dispose();worker?.dispose()}
 };
};
