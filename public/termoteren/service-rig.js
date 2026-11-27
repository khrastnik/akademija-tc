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
    // Suho listje: rjavi odtenki, mat površina, vidno z obeh strani.
    const leafColors = [0x7a5230,0x9a6e3a,0x5e4024,0xa9824a].map(c=>{const m=material(c,0,.96);m.side=T.DoubleSide;return m});
    const veinMat=material(0x3f2a18,0,.9);
    // List: koničasta oblika, robovi zvihani navzgor, rahlo upognjen po dolžini – ne ploščica.
    const leafGeo=keep((()=>{const s=new T.Shape();s.moveTo(0,-1);s.quadraticCurveTo(.62,-.42,.42,.32);s.quadraticCurveTo(.22,.78,0,1);s.quadraticCurveTo(-.22,.78,-.42,.32);s.quadraticCurveTo(-.62,-.42,0,-1);
      const g=new T.ShapeGeometry(s,10),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);p.setZ(i,.55*x*x+.18*y*y-.12*y)}g.computeVertexNormals();return g})());
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
    // Servisno stikalo IP65: sivo ohišje s pokrovom na štirih vijakih, rumena plošča z oznakama 0 in I, uvodnice za kabel spodaj.
    box(isolatedSwitch,0,0,0,.29,.40,.16,material(0xc9ccc8,.05,.55));box(isolatedSwitch,0,0,.081,.27,.38,.004,material(0xbfc3bf,.05,.5));
    for(const [x,y] of [[-.12,.175],[.12,.175],[-.12,-.175],[.12,-.175]])cylinder(isolatedSwitch,x,y,.084,.009,.006,zinc,'z');
    box(isolatedSwitch,0,.035,.084,.25,.233,.023,ochre);
    sticker(isolatedSwitch,0,.035,.0962,.25,.233,(g,w,h)=>{g.fillStyle='#f2bf1c';g.fillRect(0,0,w,h);g.strokeStyle='#222';g.lineWidth=4;g.beginPath();g.arc(w/2,h/2+4,78,0,7);g.stroke();g.fillStyle='#111';g.font='bold 40px Arial';g.textAlign='center';g.fillText('I',w/2+44,42);g.fillText('0',30,h/2+18);g.font='bold 15px Arial';g.fillText('ON',w/2+44,62);g.fillText('OFF',34,h/2+46)});
    for(const x of [-.07,.07])cylinder(isolatedSwitch,x,-.21,0,.016,.025,black,'y');
    cylinder(isolatedSwitch,0,.044,.108,.082,.044,red,'z');
    const switchHandle=group(isolatedSwitch,0,.044,.142);
    box(switchHandle,0,.026,0,.043,.142,.045,red);
    plate(isolatedSwitch,0,-.142,.084,.241,.046,'GLAVNO STIKALO');
    line(fixtures,[2.15,1.21,-2],[2.15,.5,-2],.016,zinc);
    // Hidravlika v kotlovnici (probe-rig zgradi prostor in cevi). Tu so deli, na katerih serviser dela.
    const rack=group(fixtures,0,0,0);
    const AZ=-1.9,SUP=1.134,RET=.605;
    const castIron=material(0x2c3134,.45,.55),motorRed=material(0xb8322a,.25,.42),headGrey=material(0x3a4044,.2,.6),plastic=material(0x1d2224,.05,.7),
      actuatorWhite=material(0xe3e5e0,.05,.55);
    const nut=(p,x,y,z,r=.05,len=.028,axis='x')=>cylinder(p,x,y,z,r,len,brass,axis,true);
    const cable=(p,pts)=>{for(let i=1;i<pts.length;i++)line(p,pts[i-1],pts[i],.006,plastic)};
    function sticker(p,x,y,z,w,h,draw,rotY=0){const c=document.createElement('canvas');c.width=256;c.height=Math.round(256*h/w);const g=c.getContext('2d');draw(g,c.width,c.height);
      const t=keep(new T.CanvasTexture(c));t.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(keep(new T.PlaneGeometry(w,h)),keep(new T.MeshBasicMaterial({map:t,toneMapped:false})));m.position.set(x,y,z);m.rotation.y=rotY;p.add(m);return m}
    // Krogelni ventil: medeninasto telo s šestrobima holandcema, vreteno in ploščata ročica (rdeča = dvižni, modra = povratni).
    function ballValve(p,x,y,col){
      nut(p,x-.052,y,0);nut(p,x+.052,y,0);cylinder(p,x,y,0,.046,.08,brass,'x');
      mesh(p,geometry.sphere,brass,x,y,0,.052,.05,.05);
      cylinder(p,x,y+.055,0,.013,.04,brass,'y');nut(p,x,y+.077,0,.017,.01,'y');
      box(p,x+.045,y+.086,0,.11,.008,.026,col);box(p,x+.1,y+.082,0,.02,.016,.03,col);cylinder(p,x,y+.092,0,.006,.006,zinc,'y');
    }
    // zaporna krogelna ventila ob vstopu v kotlovnico in izpustna pipica na povratku
    const water=group(rack,3.75,RET,AZ,'water');
    ballValve(water,0,0,teal);ballValve(water,0,SUP-RET,red);
    // izpustna pipica: telo navzdol, nastavek za cev z rebri in kapica
    cylinder(water,.04,-.06,0,.018,.06,brass,'y');nut(water,.04,-.095,0,.02,.016,'y');
    cylinder(water,.04,-.15,0,.013,.07,brass,'y');for(let k=0;k<3;k++)cylinder(water,.04,-.135-k*.022,0,.016,.006,brass,'y');
    cylinder(water,.04,-.192,0,.017,.02,teal,'y');
    const waterHandle=group(water,.04,-.095,.03);
    box(waterHandle,.035,0,0,.07,.014,.012,teal);
    plate(water,0,-.2,.05,.3,.05,'ZAPORA · IZPUST');
    // magnetni filter na povratnem vodu z manometrom pred in za njim
    const filterPoint=group(rack,4.36,RET,AZ,'test:filter');
    // magnetni filter: medeninast priključni blok s holandcema, pokrov, črno ohišje z rebri, izpustni ventil spodaj, odzračevalnik zgoraj
    cylinder(filterPoint,0,0,0,.046,.1,brass,'x');nut(filterPoint,-.075,0,0);nut(filterPoint,.075,0,0);
    cylinder(filterPoint,0,-.035,0,.05,.03,brass,'y');cylinder(filterPoint,0,-.058,0,.066,.02,castIron,'y');
    cylinder(filterPoint,0,-.15,0,.06,.17,plastic,'y');
    for(const y of [-.08,-.2])cylinder(filterPoint,0,y,0,.064,.012,castIron,'y');
    cylinder(filterPoint,0,-.245,0,.04,.02,castIron,'y');cylinder(filterPoint,0,-.27,0,.012,.03,brass,'y');box(filterPoint,.02,-.268,0,.045,.008,.012,teal);
    cylinder(filterPoint,0,.052,0,.012,.02,brass,'y');cylinder(filterPoint,0,.066,0,.016,.008,zinc,'y');
    sticker(filterPoint,0,-.14,.0605,.07,.06,(g,w,h)=>{g.fillStyle='#d8dcd6';g.fillRect(0,0,w,h);g.fillStyle='#1f6f8b';g.fillRect(0,0,w,46);g.fillStyle='#fff';g.font='bold 30px Arial';g.textAlign='center';g.fillText('MAGNET',w/2,34);g.fillStyle='#222';g.font='22px Arial';g.fillText('filter  →',w/2,90);g.fillText('očisti 1× letno',w/2,140);g.fillText('max 3 bar · 90 °C',w/2,186)});
    // Manometra 0–4 bar pred in za filtrom – enaka izvedba kot manometer na steni kotlovnice. Zamašen filter = nižji tlak za njim.
    const gaugeTex=keep((()=>{const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d'),cx=128,cy=128;
      g.fillStyle='#f4f2ea';g.beginPath();g.arc(cx,cy,128,0,7);g.fill();
      const ang=v=>(-135+v/4*270)*Math.PI/180,pt=(v,r)=>[cx+r*Math.sin(ang(v)),cy-r*Math.cos(ang(v))];
      const arc=(a,b,color)=>{g.strokeStyle=color;g.lineWidth=12;g.beginPath();g.arc(cx,cy,100,ang(a)-Math.PI/2,ang(b)-Math.PI/2);g.stroke()};
      arc(1,2.5,'#3f9b5a');arc(3,4,'#c8352b');
      for(let k=0;k<=40;k++){const v=k/10,major=k%10===0,half=k%5===0;const [x1,y1]=pt(v,major?82:half?88:93),[x2,y2]=pt(v,108);g.strokeStyle='#1c1f20';g.lineWidth=major?5:half?3:1.6;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke()}
      g.fillStyle='#1c1f20';g.font='700 30px Segoe UI, Arial';g.textAlign='center';g.textBaseline='middle';for(let v=0;v<=4;v++){const [x,y]=pt(v,60);g.fillText(String(v),x,y)}
      g.font='700 26px Segoe UI, Arial';g.fillText('bar',cx,cy+50);
      const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t})());
    const gaugeFace=keep(new T.MeshBasicMaterial({map:gaugeTex,toneMapped:false})),gaugeShell=material(0x2b3133,.5,.4),gaugeChrome=material(0xd7dcdc,.95,.18),gaugeRed=material(0xc0261c,.1,.5);
    const gaugeGlass=keep(new T.MeshStandardMaterial({color:0xffffff,roughness:.05,transparent:true,opacity:.14,depthWrite:false}));
    const dialGeo=keep(new T.CircleGeometry(1,40)),rimGeo=keep(new T.TorusGeometry(1,.11,10,40));
    function makeGauge(parent,x,y,z,r){
      const g=group(parent,x,y,z);
      cylinder(g,0,0,-.013,r,.026,gaugeShell,'z');
      const rim=new T.Mesh(rimGeo,gaugeChrome);rim.scale.setScalar(r);rim.position.z=.001;g.add(rim);
      const face=new T.Mesh(dialGeo,gaugeFace);face.scale.setScalar(r*.96);face.position.z=.0005;g.add(face);
      const needle=group(g,0,0,.002);box(needle,0,r*.35,0,r*.07,r*.9,.0012,gaugeRed);box(needle,0,-r*.15,0,r*.11,r*.26,.0012,gaugeRed);
      cylinder(g,0,0,.003,r*.12,.002,black,'z');
      const glass=new T.Mesh(dialGeo,gaugeGlass);glass.scale.setScalar(r*.96);glass.position.z=.005;glass.castShadow=false;g.add(glass);
      return bar=>{needle.rotation.z=-(-135+Math.max(0,Math.min(4,bar))/4*270)*Math.PI/180};
    }
    const gauges=[-.1,.1].map(dx=>{cylinder(filterPoint,dx,.06,0,.012,.07,brass,'y');cylinder(filterPoint,dx,.098,0,.016,.016,brass,'y',true);return makeGauge(filterPoint,dx,.145,.026,.038)});
    plate(filterPoint,-.1,.205,.03,.09,.026,'PRED');plate(filterPoint,.1,.205,.03,.09,.026,'ZA');
    plate(filterPoint,0,-.42,.05,.18,.045,'FILTER');
    // obtočna črpalka na dvižnem vodu
    const returnPoint=group(rack,4.36,SUP,AZ,'test:pump');
    // mokrotekoča obtočna črpalka: litoželezno ohišje v cevi s holandcema, motor z vodoravno gredjo, krmilna glava z lučkami in tipko, kabel
    nut(returnPoint,-.095,0,0,.05,.03);nut(returnPoint,.095,0,0,.05,.03);
    cylinder(returnPoint,0,0,0,.045,.16,castIron,'x');mesh(returnPoint,geometry.sphere,castIron,0,0,.02,.075,.07,.06);
    cylinder(returnPoint,0,0,.07,.058,.06,castIron,'z');
    cylinder(returnPoint,0,0,.125,.06,.07,motorRed,'z');for(const z of [.1,.115,.13,.145])cylinder(returnPoint,0,0,z,.063,.004,motorRed,'z');
    box(returnPoint,0,0,.185,.115,.115,.05,headGrey);
    sticker(returnPoint,0,0,.2105,.105,.105,(g,w,h)=>{g.fillStyle='#2c3236';g.fillRect(0,0,w,h);g.fillStyle='#9aa3a6';g.font='bold 20px Arial';g.textAlign='center';g.fillText('OBTOČNA',w/2,30);
      for(let k=0;k<5;k++){g.fillStyle=k===2?'#3ee07a':'#4b5558';g.fillRect(40+k*36,92,24,12)}
      g.fillStyle='#cfd5d6';g.font='16px Arial';g.fillText('I    II   III  ΔP  AUTO',w/2,130);
      g.fillStyle='#55605f';g.beginPath();g.arc(w/2,190,26,0,7);g.fill();g.fillStyle='#e8eceb';g.font='bold 22px Arial';g.fillText('MODE',w/2,198)});
    cylinder(returnPoint,.05,-.065,.185,.012,.03,plastic,'y');cable(returnPoint,[[.05,-.08,.185],[.05,-.13,.185],[.05,-.13,-.14],[.08,-.16,-.14]]);
    sticker(returnPoint,0,.047,.0,.07,.02,(g,w,h)=>{g.fillStyle='#e9e9e2';g.fillRect(0,0,w,h);g.fillStyle='#111';g.font='bold 52px Arial';g.textAlign='center';g.fillText('→',w/2,h*.85)});
    plate(returnPoint,0,-.16,.05,.2,.045,'ČRPALKA');
    // merilnik pretoka na povratnem vodu
    const flowPoint=group(rack,4.63,RET,AZ,'test:sensor');
    // vrtinčni merilnik pretoka: plastično telo v cevi, glava s priključkom in kablom, puščica smeri
    nut(flowPoint,-.065,0,0);nut(flowPoint,.065,0,0);cylinder(flowPoint,0,0,0,.044,.1,plastic,'x');
    box(flowPoint,0,.058,0,.06,.04,.05,headGrey);cylinder(flowPoint,0,.09,0,.014,.025,plastic,'y');cable(flowPoint,[[0,.1,0],[0,.12,0],[0,.12,-.165],[0,.37,-.165],[-.11,.37,-.165]]);
    sticker(flowPoint,0,.058,.0255,.055,.035,(g,w,h)=>{g.fillStyle='#e9e9e2';g.fillRect(0,0,w,h);g.fillStyle='#111';g.font='bold 34px Arial';g.textAlign='center';g.fillText('→ l/min',w/2,62);g.font='22px Arial';g.fillText('1,5–40',w/2,120)});
    plate(flowPoint,0,.13,.05,.16,.04,'PRETOK');
    // tripotni preklopni ventil: dvižni vod ali bojler
    const valvePoint=group(rack,4.6,SUP,AZ,'test:valve');
    // preklopni ventil: medeninasto telo s tremi priključki (AB iz enote, A radiatorji, B bojler navzgor) in pogon z ročno ročico
    cylinder(valvePoint,0,0,0,.048,.11,brass,'x');cylinder(valvePoint,0,.045,0,.046,.07,brass,'y');
    nut(valvePoint,-.07,0,0);nut(valvePoint,.07,0,0);nut(valvePoint,0,.085,0,.05,.028,'y');
    cylinder(valvePoint,0,0,.055,.02,.03,zinc,'z');
    box(valvePoint,0,0,.11,.1,.11,.08,actuatorWhite);box(valvePoint,0,.06,.11,.04,.012,.02,plastic);
    cylinder(valvePoint,-.035,-.06,.11,.011,.02,plastic,'y');cable(valvePoint,[[-.035,-.07,.11],[-.035,-.13,.11],[-.035,-.13,-.14],[-.08,-.16,-.14]]);
    // razdelilna doza na steni med črpalko in ventilom, od nje instalacijska cev do tal
    box(rack,4.48,SUP-.16,AZ-.165,.09,.09,.05,headGrey);box(rack,4.48,SUP-.16,AZ-.139,.08,.08,.004,castIron);
    line(rack,[4.48,SUP-.205,AZ-.17],[4.48,.03,AZ-.17],.011,headGrey);
    plate(valvePoint,0,.015,.151,.08,.03,'A / B');
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
      for(let j=0;j<12;j++){
        const x=(random()-.5)*.36,y=(random()-.5)*.56,z=-random()*.02;
        const sz=.075+random()*.03,leaf=mesh(g,leafGeo,leafColors[(i*7+j)%4],x,y,z-.006,sz*.85,sz,sz*(.7+random()*.6));
        leaf.rotation.set(Math.PI+(random()-.5)*.5,(random()-.5)*.5,random()*Math.PI*2);
        const vein=mesh(leaf,geometry.box,veinMat,0,0,.02,.035,1.7,.02);vein.castShadow=false;
      }
      // Bounding surface follows the patch and only catches clicks on the dirty section of the coil.
      const catcher=box(g,0,0,.021,.47,.73,.025,keep(new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false})));
      catcher.castShadow=catcher.receiveShadow=false;leaves.push(g);
    }
    // Veter je listje nanesel tudi okoli enote: na betonsko ploščo in gramoz pred njo, da je težava vidna že s poti.
    const groundLeaves=group(fixtures);groundLeaves.userData.nonBlocking=true;
    const lay=(x,y,z)=>{const sz=.1+random()*.04,tilt=.25+random()*.45,l=mesh(groundLeaves,leafGeo,leafColors[Math.floor(random()*4)],x,y+sz*Math.sin(tilt)*.9,z,sz*.85,sz,sz*(.7+random()*.5));
      l.rotation.set(-Math.PI/2+(random()<.5?-tilt:tilt),(random()-.5)*.5,random()*Math.PI*2);l.castShadow=false};
    for(let k=0;k<12;k++)lay(-1.5+random()*3,.13,-.74+random()*.18);           // za enoto, ob uparjalniku
    for(let k=0;k<7;k++)lay(-1.56+random()*.24,.13,-.7+random()*1.4);          // leva stran plošče
    for(let k=0;k<5;k++)lay(1.33+random()*.23,.13,-.7+random()*1.4);           // desna stran plošče
    for(let k=0;k<6;k++)lay(-1.4+random()*2.8,.13,.52+random()*.2);            // pred enoto
    for(let k=0;k<16;k++){const a=random()*Math.PI*2,r=.25+random()*.9;lay(Math.cos(a)*(1.65+r*.6),.015,.2+Math.sin(a)*(.8+r))} // gramoz okoli plošče
    // Led pri nalogu 13: zadnja in leva stran uparjalnika, led pod enoto in ledene sveče – viden že s poti.
    const iceMat=material(0xd9ecf2,.02,.14);iceMat.transparent=true;iceMat.opacity=.82;
    const crust=material(0xf6fbfc,0,.6);
    // Ivje na lamelah: neenakomerno belo, spodaj debelejše, zgoraj se še vidijo lamele – ne ravna bela plošča.
    const frostTex=(()=>{const c=document.createElement('canvas');c.width=256;c.height=256;const g=c.getContext('2d');
      const grad=g.createLinearGradient(0,0,0,256);grad.addColorStop(0,'rgba(236,244,247,.55)');grad.addColorStop(.55,'rgba(240,247,249,.85)');grad.addColorStop(1,'rgba(248,251,252,.98)');
      g.fillStyle=grad;g.fillRect(0,0,256,256);
      for(let x=0;x<256;x+=4){g.fillStyle='rgba(70,86,92,'+(.18+random()*.1)+')';g.fillRect(x,0,1,150+random()*70)}
      for(let k=0;k<70;k++){const x=random()*256,y=40+random()*216,r=6+random()*22;const b=g.createRadialGradient(x,y,0,x,y,r);b.addColorStop(0,'rgba(255,255,255,.85)');b.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=b;g.fillRect(x-r,y-r,2*r,2*r)}
      const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return keep(t)})();
    const frostMat=new T.MeshStandardMaterial({map:frostTex,transparent:true,roughness:.7,metalness:0,depthWrite:false});keep(frostMat);
    const ice=group(fixtures,0,0,0);ice.userData.part='coil';
    box(ice,-.45,1.11,-.54,1.64,1.30,.05,frostMat);
    box(ice,-1.36,1.11,-.02,.05,1.30,.88,frostMat);
    box(ice,-.45,.47,.0,1.72,.06,1.02,crust);
    // Led pred enoto: odtaljena voda kaplja iz korita in zmrzuje v eno nepravilno ploskev z grbinami pod odtočnimi luknjami.
    const puddle=material(0xc9e2ea,.05,.08);puddle.transparent=true;puddle.opacity=.74;
    const sheet=(()=>{const sh=new T.Shape(),n=22;for(let i=0;i<=n;i++){const a=i/n*Math.PI*2,r=1+.16*Math.sin(a*3+1)+.1*Math.sin(a*7)+(random()-.5)*.08,p=[Math.cos(a)*r,Math.sin(a)*r];i?sh.lineTo(...p):sh.moveTo(...p)}
      const g=new T.ExtrudeGeometry(sh,{depth:.5,bevelEnabled:true,bevelThickness:.5,bevelSize:.12,bevelSegments:3,curveSegments:4});g.rotateX(-Math.PI/2);g.computeVertexNormals();return keep(g)})();
    const sheetMesh=new T.Mesh(sheet,puddle);sheetMesh.position.set(-.3,.121,.5);sheetMesh.scale.set(.95,.014,.17);sheetMesh.receiveShadow=true;ice.add(sheetMesh);
    const lump=keep((()=>{const g=new T.IcosahedronGeometry(1,2),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=1+.18*Math.sin(x*5+z*3)+.12*Math.cos(z*6-y*2);p.setXYZ(i,x*k,Math.max(y,-.2)*k,z*k)}g.computeVertexNormals();return g})());
    [[-1.05,.5,.16,.035,.11],[-.6,.52,.2,.045,.13],[-.12,.5,.15,.03,.1],[.32,.52,.17,.04,.11]].forEach(([x,z,w,h,d])=>{const m=new T.Mesh(lump,puddle);m.position.set(x,.13,z);m.scale.set(w,h,d);m.rotation.y=x*4;ice.add(m)});
    // Ledene sveče: prosojni stožci s konico navzdol, različnih dolžin.
    const icicle=keep(new T.ConeGeometry(1,1,8));
    const drip=(x,z,h,r)=>{const m=new T.Mesh(icicle,iceMat);m.position.set(x,.43-h/2,z);m.scale.set(r,h,r);m.rotation.x=Math.PI;ice.add(m)};
    // Nepravilen razmik, nekaj dolgih in debelih, vmes vrzeli – kot v naravi.
    for(let x=-1.25;x<.4;x+=.05+random()*.07){if(random()<.2)continue;const L=random()<.18?.16+random()*.08:.03+random()*.09;drip(x,.49+random()*.02,L,.006+L*.08+random()*.004)}
    for(let z=-.38;z<.42;z+=.06+random()*.07){if(random()<.25)continue;const L=random()<.15?.14+random()*.06:.03+random()*.08;drip(-1.38,z,L,.006+L*.08)}
    // Senčni nosilec: severna stena kotlovnice, 2 m visoko, stran od zunanje enote, oken in vrat.
    const shaded=group(fixtures,3.522,2.05,-1.25,'newMount');shaded.rotation.y=-Math.PI/2;
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
      const clogged=level===0&&!fixed&&!field.drained;gauges[0](clogged?1.9:1.75);gauges[1](clogged?1.0:1.6);
      flowPoint.visible=true;
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
      groundLeaves.visible=level===1&&!fixed;
      leaves.forEach((g,i)=>{
        g.visible=level===1&&!fixed&&!clean.includes(i);setTag(g,repair?'leaf:'+i:null);g.userData.part='coil';g.scale.set(1,1,1);
      });
      ice.visible=level===12&&!fixed;
      shaded.visible=level===2;
      setTag(shaded,repair&&removed&&level===2?'newMount':null);
      wallSensor.visible=level!==5&&!(level===2&&removed);
      // Zunanje tipalo: SEVERNA stena (v sceni sever = −x) – kotlovnica ali pri Žireh stranska stena hiše –, vsaj 2 m visoko, ne nad okni ali vrati in ne v toku zraka zunanje enote.
      // Pri nalogu 3 je pred popravilom napačno na osončeni fasadi hiše (ta napaka je bistvo naloga).
      const spot=level===2&&!fixed?[1.72,2.12,-2.09,0]:level===9?[-3.995,2.2,-3.0,-Math.PI/2]:[3.504,2.05,-1.25,-Math.PI/2];
      wallSensor.position.set(spot[0],spot[1],spot[2]);wallSensor.rotation.y=spot[3];
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
      if(id.startsWith('screw:'))id='cover'; // klik na vijak sproži celoten postopek pokrova
      if(id.startsWith('screw:')){
        const index=Number(id.slice(6)),s=screws[index];if(!s)return;
        const turning=slide((p-.24)/.58);
        const back=(state.screws||[]).includes(index)?1-turning:turning;
        s.position.z=.043*back;s.rotation.z=back*Math.PI*4.36;
        return {id,point:s.localToWorld(point(0,0,.0345)),normal:out,twist:s.rotation.z,weight:slide(p/.23)*(1-slide((p-.84)/.16))};
      }else if(id==='cover'){
        // En poteg: vijaki ven, pokrov na stojalo – ali obratno pri zapiranju.
        // Izvijač gre od vijaka do vijaka; ko so vsi štirje odviti, obe roki primeta pokrov.
        const opening=!state.opened,S=.5,n=screws.length,sp=opening?p/S:(p-(1-S))/S;
        const tm=slide(opening?(p-S-.02)/(1-S-.04):p/(1-S-.04)),head=s=>s.localToWorld(point(0,0,.0345));
        screws.forEach((s,i)=>{
          const order=opening?i:n-1-i,u=slide((sp*n-order-.28)/.62),back=opening?u:1-u;
          s.position.z=.043*back;s.rotation.z=back*Math.PI*4.36;
        });
        movePanel(opening?'frame':'stand',opening?'stand':'frame',tm,.12);rig.visible=false;
        if(sp>0&&sp<1){
          const k=Math.min(n-1,Math.floor(sp*n)),local=sp*n-k,idx=opening?k:n-1-k,s=screws[idx];
          let at=head(s);
          if(k>0&&local<.28)at=head(screws[opening?k-1:n-k]).lerp(at,slide(local/.28));
          return {id:'screw:'+idx,point:at,normal:out,twist:s.rotation.z,weight:slide(sp/.07)*(1-slide((sp-.93)/.07))};
        }
        return panelContact(slide(tm/.1)*(1-slide((tm-.9)/.1)));
      }else if(['panelRest','panelMount'].includes(id)){
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
