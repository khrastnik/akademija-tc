/* Serviser v celoti: prikaže se samo med samodejnim odvijanjem pokrova, ko se kamera odmakne.
   Telo stoji pred enoto (obraz proti -z). Roke in noge so zaobljeni udi z inverzno kinematiko,
   trup je oblikovan (ramena širša od pasu), delovna obleka ima odsevne trakove, pas in torbico za orodje. */
window.createWorker=function(T,scene){
 const root=new T.Group();root.visible=false;scene.add(root);
 const geos=[],mats=[],textures=[];
 const G=g=>{geos.push(g);return g};
 const mat=(color,rough=.82,metal=0)=>{const m=new T.MeshStandardMaterial({color,roughness:rough,metalness:metal});mats.push(m);return m};
 // Rahla tkanina: šum v hrapavosti, da obleka ni plastična.
 const weave=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),im=g.createImageData(64,64);let s=11;
  for(let i=0;i<im.data.length;i+=4){s=(Math.imul(s,1664525)+1013904223)>>>0;const n=150+(s%70)+(((i>>2)%64)%4===0?20:0);im.data.set([n,n,n,255],i)}
  g.putImageData(im,0,0);const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(6,6);textures.push(t);return t})();
 const cloth=(color,rough=.9)=>{const m=mat(color,rough);m.roughnessMap=weave;m.bumpMap=weave;m.bumpScale=.0006;return m};
 const jacket=cloth(0x3a4447),trousers=cloth(0x2a3033),orange=cloth(0xd8742c,.7),reflect=mat(0xd7dbd2,.25,.35);
 const skin=mat(0xc08a6e,.62),lip=mat(0x9c5f52,.6),eye=mat(0x1d2224,.3),hair=mat(0x3a2c22,.85),cap=cloth(0x2c3436,.8);
 const glove=mat(0x55626a,.75),gloveGrip=mat(0x2b3338,.9),boot=mat(0x23211f,.55),sole=mat(0x111213,.9),belt=mat(0x1d2122,.6),buckle=mat(0xa3a9a3,.35,.8);
 const handle=mat(0xe2b23a,.45),shaft=mat(0xa7b0aa,.25,.85),knee=mat(0x1f2427,.7);
 function add(parent,geo,m,x=0,y=0,z=0,sx=1,sy=1,sz=1){const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);parent.add(o);return o}
 const sphere=G(new T.SphereGeometry(1,24,16)),cyl=G(new T.CylinderGeometry(1,1,1,20)),cube=G(new T.BoxGeometry(1,1,1));
 const up=new T.Vector3(0,1,0),tmp=new T.Vector3(),dir=new T.Vector3(),pole=new T.Vector3(),bend=new T.Vector3();

 // Ud s točno dolžino: zaobljen konec pri obeh sklepih, brez raztezanja.
 function capsule(m,r,len){const o=new T.Mesh(G(new T.CapsuleGeometry(r,len,6,16)),m);root.add(o);return o}
 function place(o,a,b){tmp.subVectors(b,a);const l=Math.max(.001,tmp.length());o.position.copy(a).addScaledVector(tmp,.5);o.quaternion.setFromUnitVectors(up,tmp.multiplyScalar(1/l))}
 // Analitična IK z dvema členoma; "hint" določa smer upogiba (komolec ven in dol, koleno naprej).
 function solve(a,target,l1,l2,hint,joint){
  tmp.subVectors(target,a);let d=tmp.length();const max=l1+l2-.003;if(d>max){tmp.multiplyScalar(max/d);d=max}
  dir.copy(tmp).normalize();const along=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-along*along));
  pole.copy(hint).addScaledVector(dir,-hint.dot(dir)).normalize();
  joint.copy(a).addScaledVector(dir,along).addScaledVector(pole,h);return a.clone().add(tmp)
 }

 const body=new T.Group();root.add(body);           // izhodišče = boki
 const torso=new T.Group();body.add(torso);
 // Trup kot vrtenina: pas ožji, prsni koš in ramena širši, nato vrat. Sploščen spredaj-zadaj.
 const profile=[[0,-.02],[.158,0],[.162,.08],[.155,.18],[.168,.3],[.19,.4],[.198,.46],[.18,.5],[.12,.54],[.055,.565],[0,.57]].map(([r,y])=>new T.Vector2(r,y));
 const radiusAt=y=>{for(let i=1;i<profile.length;i++){const a=profile[i-1],b=profile[i];if(y<=b.y)return a.x+(b.x-a.x)*(y-a.y)/Math.max(.001,b.y-a.y)}return 0};
 const DEPTH=.64;
 add(torso,G(new T.LatheGeometry(profile,32)),jacket,0,0,0,1,1,DEPTH);
 const band=(y,h,m,grow=.004)=>{const r=radiusAt(y)+grow;add(torso,cyl,m,0,y,0,r,h,r*DEPTH)};
 band(.12,.05,orange);band(.2,.022,reflect);band(.38,.022,reflect,.005);
 add(torso,G(new T.TorusGeometry(.062,.022,10,24)),jacket,0,.55,0).rotation.x=Math.PI/2;            // ovratnik
 add(torso,cube,belt,0,.29,-radiusAt(.29)*DEPTH-.002,.012,.42,.006);                                // zadrga
 // Napis na hrbtu
 {const c=document.createElement('canvas');c.width=256;c.height=96;const g=c.getContext('2d');g.fillStyle='#d8742c';g.font='bold 46px sans-serif';g.textAlign='center';g.fillText('SERVIS TČ',128,62);
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;textures.push(t);const m=new T.MeshBasicMaterial({map:t,transparent:true,toneMapped:false});mats.push(m);
  add(torso,G(new T.PlaneGeometry(.26,.1)),m,0,.31,radiusAt(.31)*DEPTH+.007);}
 // Glava
 const head=new T.Group();torso.add(head);head.position.set(0,.69,0);
 add(torso,cyl,skin,0,.6,0,.046,.1,.046);
 add(head,sphere,skin,0,0,0,.09,.112,.1);
 add(head,sphere,skin,0,-.055,-.03,.07,.05,.07);                     // brada in čeljust
 add(head,sphere,hair,0,.012,.014,.094,.1,.098);                     // lasje pod kapo (zadaj)
 for(const s of [-1,1]){add(head,sphere,skin,s*.09,-.005,.005,.016,.03,.022);add(head,sphere,eye,s*.032,.012,-.09,.011,.009,.006);add(head,cube,hair,s*.033,.034,-.092,.03,.006,.006)}
 add(head,G(new T.CapsuleGeometry(.011,.03,4,8)),skin,0,-.008,-.1).rotation.x=-.25;                // nos
 add(head,cube,lip,0,-.05,-.094,.034,.006,.006);
 add(head,G(new T.SphereGeometry(1,24,12,0,Math.PI*2,0,Math.PI/2)),cap,0,.028,0,.1,.09,.108);     // kapa
 add(head,G(new T.CylinderGeometry(1,1,1,24,1,false,Math.PI*.5,Math.PI)),cap,0,.03,-.07,.095,.008,.085); // šilt
 add(head,cube,orange,0,.075,-.09,.04,.016,.006);
 // Boki, pas, torbica
 add(body,G(new T.CapsuleGeometry(.11,.12,6,16)),trousers,0,-.06,0,1.35,1,DEPTH*1.3).rotation.z=Math.PI/2;
 add(body,cyl,belt,0,0,0,.168,.035,.168*DEPTH*1.05);
 add(body,cube,buckle,0,0,-.112,.045,.03,.01);
 add(body,cube,belt,.17,-.07,.02,.05,.1,.09);add(body,cube,handle,.17,0,.04,.012,.05,.012);        // torbica z izvijačem

 const legs=[-1,1].map(s=>({s,thigh:capsule(trousers,.072,.32),shin:capsule(trousers,.06,.32),pad:add(root,sphere,knee,0,0,0,.05,.055,.03),
  boot:(()=>{const b=new T.Group();root.add(b);add(b,cube,sole,0,.012,-.03,.11,.024,.29);add(b,G(new T.CapsuleGeometry(.05,.15,6,12)),boot,0,.06,-.05,1.05,.95,1).rotation.x=Math.PI/2;add(b,cyl,boot,0,.11,.02,.056,.1,.06);return b})(),
  knee:new T.Vector3()}));
 // Rokavica s prsti: dlan + štirje prsti + palec, ukrivljeni okoli ročaja.
 function makeGlove(side){
  const g=new T.Group();root.add(g);
  add(g,G(new T.CapsuleGeometry(.03,.035,4,10)),glove,0,.035,0,1.25,1,.62);
  add(g,cyl,gloveGrip,0,0,0,.036,.03,.026);
  const fingers=[];
  for(let i=0;i<4;i++){const f=new T.Group();g.add(f);f.position.set((i-1.5)*.017,.072,0);add(f,G(new T.CapsuleGeometry(.0095,.034,4,8)),glove,0,.022,0);fingers.push(f)}
  const thumb=new T.Group();g.add(thumb);thumb.position.set(side*.03,.03,-.012);thumb.rotation.z=-side*.7;add(thumb,G(new T.CapsuleGeometry(.0105,.03,4,8)),glove,0,.02,0);
  return {g,fingers,thumb}
 }
 const arms=[-1,1].map(s=>({s,upper:capsule(jacket,.056,.24),fore:capsule(jacket,.048,.23),cuff:add(root,cyl,orange,0,0,0,.05,.03,.05),glove:makeGlove(s),elbow:new T.Vector3()}));
 const driver=new T.Group();root.add(driver);add(driver,G(new T.CapsuleGeometry(.017,.08,4,12)),handle,0,.06,0);add(driver,cyl,shaft,0,.155,0,.0042,.11,.0042);
 // Mehka senca pod serviserjem (senčna karta je statična, zato senca iz teksture).
 const shadow=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),gr=g.createRadialGradient(64,64,4,64,64,62);gr.addColorStop(0,'rgba(0,0,0,.45)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);
  const t=new T.CanvasTexture(c);textures.push(t);const m=new T.MeshBasicMaterial({map:t,transparent:true,depthWrite:false});mats.push(m);
  const o=add(root,G(new T.PlaneGeometry(.75,.6)),m);o.rotation.x=-Math.PI/2;return o})();
 root.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true}});

 let x=0,z=1,walkPhase=0,drop=0,lean=0,ready=false,clock=0;
 const hip=new T.Vector3(),shoulder=new T.Vector3(),ankle=new T.Vector3(),target=new T.Vector3(),wristPt=new T.Vector3();
 function update(contact,dt){
  if(!contact){root.visible=false;ready=false;return}
  root.visible=true;clock+=dt;
  const right=contact.point,left=contact.leftPoint||null,screw=contact.id?.startsWith('screw:');
  // Kje stoji: pred vijakom ali med robovoma pokrova, pol metra pred ploskvijo.
  const tx=left?(right.x+left.x)/2:right.x-.2,tz=Math.max(right.z,left?left.z:-9)+(left?.4:.5);
  if(!ready){x=tx;z=tz;ready=true}
  // pri nošenju pokrova telo sledi hitro, da so roke pred telesom
  const k=1-Math.exp(-dt*(left?11:4.5)),ox=x,oz=z;x+=(tx-x)*k;z+=(tz-z)*k;
  const speed=Math.hypot(x-ox,z-oz)/Math.max(dt,.001);walkPhase+=dt*Math.min(9,speed*14);
  // Za spodnje vijake počep, za visoke vzravnan.
  const low=Math.min(right.y,left?left.y:9);
  drop+=((low<.8?Math.min(.36,(.95-low)*.6):0)-drop)*Math.min(1,k*1.6);
  lean+=((screw?.2:.1)+(low<.8?.2:0)-lean)*k;
  body.position.set(x,.94-drop+(speed>.05?Math.abs(Math.sin(walkPhase))*.015:0),z);torso.rotation.x=-lean;
  torso.scale.y=1+Math.sin(clock*1.9)*.006;
  head.rotation.x=lean*.55+T.MathUtils.clamp((1.5-right.y)*.35,-.25,.45);head.rotation.y=T.MathUtils.clamp((right.x-x)*-.8,-.5,.5);
  shadow.position.set(x,.008,z-.04);
  body.updateMatrixWorld(true);
  legs.forEach(L=>{
   hip.set(L.s*.095,-.08,0);body.localToWorld(hip);
   const swing=speed>.05?Math.sin(walkPhase+(L.s>0?0:Math.PI))*.15:0;
   ankle.set(x+L.s*.11,.11,z+swing+(drop>.1?-.06:.04));
   const foot=solve(hip,ankle,.44,.42,bend.set(0,.15,-1),L.knee);
   place(L.thigh,hip,L.knee);place(L.shin,L.knee,foot);
   L.pad.position.copy(L.knee).add(tmp.set(0,-.02,-.055));
   L.boot.position.set(foot.x,0,foot.z);L.boot.rotation.y=-L.s*.08;
  });
  arms.forEach(A=>{
   shoulder.set(A.s*.19,.46,0);torso.localToWorld(shoulder);
   const goal=A.s>0?right:left;
   if(goal)target.copy(goal);else target.set(shoulder.x+A.s*.07,shoulder.y-.52,shoulder.z-.06);
   // pri vijaku desna roka drži ročaj izvijača pred glavo vijaka, leva se nasloni na ohišje
   if(screw&&A.s>0)target.addScaledVector(contact.normal||up,.13);
   if(screw&&A.s<0)target.set(right.x-.32,right.y+.06,right.z+.04);
   wristPt.copy(solve(shoulder,target,.3,.29,bend.set(A.s*.75,-1,.35).normalize(),A.elbow));
   place(A.upper,shoulder,A.elbow);
   tmp.copy(A.elbow).lerp(wristPt,.9);const foreEnd=tmp.clone();place(A.fore,A.elbow,foreEnd);
   A.cuff.position.copy(A.elbow).lerp(wristPt,.84);A.cuff.quaternion.copy(A.fore.quaternion);
   dir.subVectors(wristPt,A.elbow).normalize();
   const gl=A.glove;gl.g.position.copy(wristPt).addScaledVector(dir,-.012);
   gl.g.quaternion.setFromUnitVectors(up,dir);gl.g.rotateY(A.s*-.9);
   // prijem: pri vijaku in pokrovu prsti ukrivljeni, sicer sproščeni
   const curl=goal?(screw&&A.s>0?1.5:1.05):.45;
   gl.fingers.forEach((f,i)=>{f.rotation.x=-curl*(.9+i*.06)});gl.thumb.rotation.x=-curl*.5;
  });
  driver.visible=!!screw;
  if(screw){
   const n=contact.normal||up;driver.position.copy(right).addScaledVector(n,.21);
   driver.quaternion.setFromUnitVectors(up,tmp.copy(n).negate());driver.rotateY(contact.twist||0);
  }
 }
 function dispose(){root.removeFromParent();geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());textures.forEach(t=>t.dispose())}
 return {root,body,update,dispose};
};
