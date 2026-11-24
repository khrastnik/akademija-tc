/* Serviser v celoti: prikaže se samo med samodejnim odvijanjem pokrova, ko se kamera odmakne.
   Telo stoji pred enoto (gleda proti -z), roke z inverzno kinematiko sledijo vijaku ali robovom pokrova. */
window.createWorker=function(T,scene){
 const root=new T.Group();root.visible=false;scene.add(root);
 const geos=[],mats=[];
 const mat=(color,rough=.8,metal=0)=>{const m=new T.MeshStandardMaterial({color,roughness:rough,metalness:metal});mats.push(m);return m};
 const cyl=new T.CylinderGeometry(1,1,1,14),ball=new T.SphereGeometry(1,18,12),cube=new T.BoxGeometry(1,1,1);geos.push(cyl,ball,cube);
 const jacket=mat(0x3c4446),stripe=mat(0xe07a2e,.6),pants=mat(0x2b3133),boot=mat(0x1c1f20,.6),skin=mat(0xb67e65,.7),glove=mat(0x46525a,.85),cap=mat(0x26302f),reflect=mat(0xc9ccc2,.3,.4);
 const handle=mat(0xe2b23a,.5),shaft=mat(0x9da59d,.3,.8);
 function part(parent,g,m,x=0,y=0,z=0,sx=1,sy=1,sz=1){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;parent.add(o);return o}
 const up=new T.Vector3(0,1,0),tmp=new T.Vector3(),tmp2=new T.Vector3(),pole=new T.Vector3(),bend=new T.Vector3(),elbow=new T.Vector3();
 // Ud med dvema točkama (valj, poravnan z daljico).
 function limb(m,r){const o=part(root,cyl,m);o.userData.r=r;return o}
 function connect(o,a,b){tmp.subVectors(b,a);const len=Math.max(.001,tmp.length());o.position.copy(a).addScaledVector(tmp,.5);o.scale.set(o.userData.r,len,o.userData.r*.9);o.quaternion.setFromUnitVectors(up,tmp.multiplyScalar(1/len))}
 // Analitična IK z dvema členoma; pole določa smer upogiba (komolec ven in dol, koleno naprej).
 function solve(a,target,l1,l2,poleDir,out){
  tmp.subVectors(target,a);let d=tmp.length();const max=l1+l2-.002;if(d>max){tmp.multiplyScalar(max/d);d=max}
  const dir=tmp2.copy(tmp).normalize(),along=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-along*along));
  pole.copy(poleDir).addScaledVector(dir,-poleDir.dot(dir)).normalize();
  out.copy(a).addScaledVector(dir,along).addScaledVector(pole,h);return a.clone().add(tmp)
 }
 const body=new T.Group();root.add(body);
 const torso=new T.Group();body.add(torso);
 part(torso,cyl,jacket,0,.27,0,.2,.56,.13);                       // jakna
 part(torso,ball,jacket,0,.55,0,.22,.09,.14);                     // ramena
 part(torso,cyl,stripe,0,.2,0,.205,.035,.135);                    // oranžen pas
 part(torso,cyl,reflect,0,.3,0,.204,.018,.134);                   // odsevni trak
 part(torso,cube,stripe,0,.44,-.13,.12,.06,.01);                  // napis na prsih
 part(torso,cyl,skin,0,.64,0,.055,.08,.055);                      // vrat
 const head=new T.Group();torso.add(head);head.position.set(0,.77,0);
 part(head,ball,skin,0,0,0,.1,.12,.105);
 part(head,ball,cap,0,.045,.005,.108,.075,.112);                  // kapa
 part(head,cube,cap,0,.03,-.11,.15,.012,.09);                     // šilt
 part(head,ball,skin,-.1,0,0,.02,.032,.02);part(head,ball,skin,.1,0,0,.02,.032,.02);
 const pelvis=part(body,cyl,pants,0,0,0,.19,.16,.12);
 const legs=[-1,1].map(s=>({s,thigh:limb(pants,.075),shin:limb(pants,.06),boot:part(root,cube,boot,0,0,0,.11,.09,.27),knee:new T.Vector3()}));
 const arms=[-1,1].map(s=>({s,upper:limb(jacket,.058),fore:limb(jacket,.05),cuff:limb(stripe,.052),hand:part(root,cube,glove,0,0,0,.085,.1,.05),elbow:new T.Vector3()}));
 const driver=new T.Group();root.add(driver);part(driver,cyl,handle,0,.05,0,.017,.1,.017);part(driver,cyl,shaft,0,.15,0,.004,.11,.004);
 let x=0,z=1,walkPhase=0,drop=0,lean=0,ready=false;
 const hip=new T.Vector3(),shoulder=new T.Vector3(),ankle=new T.Vector3(),target=new T.Vector3(),hand=new T.Vector3();
 function update(contact,dt){
  if(!contact){root.visible=false;ready=false;return}
  root.visible=true;
  const right=contact.point,left=contact.leftPoint||null,screw=contact.id?.startsWith('screw:');
  // Kje stoji: pred vijakom ali med robovoma pokrova, pol metra pred ploskvijo.
  const tx=left?(right.x+left.x)/2:right.x-.18,tz=Math.max(right.z,left?left.z:-9)+.52;
  if(!ready){x=tx;z=tz;ready=true}
  const k=1-Math.exp(-dt*4.5),ox=x,oz=z;x+=(tx-x)*k;z+=(tz-z)*k;
  const speed=Math.hypot(x-ox,z-oz)/Math.max(dt,.001);walkPhase+=dt*Math.min(9,speed*14);
  // Za spodnje vijake počep, za visoke vzravnan.
  const low=Math.min(right.y,left?left.y:9);
  drop+=((low<.8?Math.min(.38,(.95-low)*.6):0)-drop)*k*1.6;
  lean+=((screw?.22:.12)+(low<.8?.18:0)-lean)*k;
  body.position.set(x,.93-drop,z);torso.rotation.x=-lean;
  head.rotation.x=lean*.6+(right.y<1.2?.25:-.1);
  body.updateMatrixWorld(true);
  legs.forEach(L=>{
   hip.set(L.s*.1,-.05,0);body.localToWorld(hip);
   const swing=speed>.05?Math.sin(walkPhase+(L.s>0?0:Math.PI))*.16:0;
   ankle.set(x+L.s*.12,.1,z+swing+(drop>.1?-.05:.05));
   const foot=solve(hip,ankle,.45,.43,bend.set(0,.2,-1),L.knee);
   connect(L.thigh,hip,L.knee);connect(L.shin,L.knee,foot);
   L.boot.position.set(foot.x,.045,foot.z-.05);
  });
  arms.forEach(A=>{
   shoulder.set(A.s*.22,.53,0);torso.localToWorld(shoulder);
   const goal=A.s>0?right:left;
   if(goal)target.copy(goal);else target.set(shoulder.x+A.s*.06,shoulder.y-.55,shoulder.z-.08);
   // pri vijaku desna roka drži ročaj izvijača 16 cm pred glavo vijaka, leva se nasloni na ohišje
   if(screw&&A.s>0)target.addScaledVector(contact.normal||up,.17);
   if(screw&&A.s<0)target.set(right.x-.3,right.y+.05,right.z+.05);
   const wristPt=solve(shoulder,target,.3,.29,bend.set(A.s*.8,-1,.35).normalize(),A.elbow);
   connect(A.upper,shoulder,A.elbow);
   hand.copy(A.elbow).lerp(wristPt,.86);connect(A.fore,A.elbow,hand);connect(A.cuff,hand,wristPt);
   A.hand.position.copy(wristPt);A.hand.quaternion.copy(A.fore.quaternion);
  });
  driver.visible=!!screw;
  if(screw){
   const n=contact.normal||up;driver.position.copy(right).addScaledVector(n,.2);
   driver.quaternion.setFromUnitVectors(up,tmp.copy(n).negate());driver.rotateY(contact.twist||0);
  }
 }
 function dispose(){root.removeFromParent();geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose())}
 return {root,body,update,dispose};
};
