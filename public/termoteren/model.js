/* Interactive, locally rendered monobloc. Three.js r160 is loaded by the host page. */
(() => {
  "use strict";
  const labels = {
    control: "Regulator", filter: "Vodni filter", pump: "Obtočna črpalka",
    coil: "Uparjalnik", fan: "Ventilator", sensor: "Tipalo",
    valve: "Tripotni ventil", power: "Električna omarica"
  };
  const current = {caseIndex: 0, repaired: false, opened: false};
  let view = null;

  function startThree(host, callbacks) {
    const T = window.THREE;
    const renderer = new T.WebGLRenderer({antialias: true, alpha: false, powerPreference: "high-performance"});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    const canvas = renderer.domElement;
    canvas.style.cssText = "display:block;width:100%;height:100%;touch-action:none;cursor:grab;outline-offset:-4px";
    canvas.tabIndex = 0;
    canvas.setAttribute("aria-label","3D toplotna črpalka. S puščicami obrni pogled, s tipkama plus in minus spremeni povečavo. Z miško izberi sestavni del.");
    host.appendChild(canvas);

    const scene = new T.Scene();
    scene.background = new T.Color(0xb3c5c9);
    scene.fog = new T.FogExp2(0xafbfc1, .034);
    const camera = new T.PerspectiveCamera(36, 1, .045, 75);
    const sunny=callbacks.state().f.caseIndex===2;
    const light = new T.DirectionalLight(sunny?0xffdfb8:0xffeee1,sunny?3.35:2.25);
    // Strani neba: sever = −x, jug = +x, zahod = +z (sprednja fasada), vzhod = −z. Sonce z jugozahoda:
    // sprednja (zahodna) fasada je opoldne in popoldne osončena, severne stene (obrnjene v −x) so v senci.
    light.position.set(4.2, 6.8, 3.8);
    light.castShadow = true;
    light.shadow.mapSize.set(1024,1024);
    Object.assign(light.shadow.camera, {left:-6.3,right:6.3,top:5.1,bottom:-5.1,near:1,far:23});
    light.shadow.normalBias = .008;
    scene.add(light, new T.HemisphereLight(0xd8e9fb, 0x6f6550,1.48));
    const fill = new T.DirectionalLight(0xc6def3,.68);
    fill.position.set(-3, 3, -4); scene.add(fill);
    const V = (x,y,z) => new T.Vector3(x,y,z);
    const mat = (color, metalness=0,roughness=.64) => new T.MeshStandardMaterial({color,metalness,roughness});
    const graphite = mat(0x374249,.55,.34), edge = mat(0x20292c,.47,.38);
    const rubber = mat(0x171e20,.03,.82), blades = mat(0x435059,.26,.34);
    const silver = mat(0x9ca8a9,.68,.31), copper = mat(0xbc7041,.63,.3);
    const brass = mat(0xb78d48,.6,.36), steel = mat(0x687980,.52,.42);
    const dark = mat(0x0c161a,.19,.49), red = mat(0x9a4436,.26), blue = mat(0x256779,.28);
    const white = mat(0xccd1c7,.2), concrete = mat(0x91928a,.0,.91);
    const geometries = new Map();
    function cached(key, create) {
      if (!geometries.has(key)) geometries.set(key,create());
      return geometries.get(key);
    }
    const boxGeo = cached("box",()=>new T.BoxGeometry(1,1,1));
    const ballGeo = cached("sphere",()=>new T.SphereGeometry(1,18,12));
    function mesh(geometry,material,x,y,z,parent=scene) {
      const m = new T.Mesh(geometry,material);
      m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true;
      parent.add(m); return m;
    }
    function box(x,y,z,w,h,d,material,parent) {
      const m=mesh(boxGeo,material,x,y,z,parent); m.scale.set(w,h,d); return m;
    }
    function ball(x,y,z,sx,sy,sz,material,parent) {
      const m=mesh(ballGeo,material,x,y,z,parent); m.scale.set(sx,sy,sz); return m;
    }
    function cyl(radius,depth,x,y,z,material,axis="y",parent=scene,n=28) {
      const geo=cached("cylinder"+n,()=>new T.CylinderGeometry(1,1,1,n));
      const m=mesh(geo,material,x,y,z,parent); m.scale.set(radius,depth,radius);
      if(axis==="z") m.rotation.x=Math.PI/2;
      if(axis==="x") m.rotation.z=Math.PI/2;
      return m;
    }
    function group(parent=scene) {const g=new T.Group();parent.add(g);return g}
    function pipe(points,r,material,parent=scene) {
      const path=new T.CurvePath();
      const v=points.map(p=>V(...p));
      let last=v[0];
      for(let i=1;i<v.length-1;i++){
        const a=v[i-1],b=v[i],c=v[i+1];
        const rounding=Math.min(.085,a.distanceTo(b)*.32,c.distanceTo(b)*.32);
        const before=b.clone().addScaledVector(a.clone().sub(b).normalize(),rounding);
        const after=b.clone().addScaledVector(c.clone().sub(b).normalize(),rounding);
        path.add(new T.LineCurve3(last,before));path.add(new T.QuadraticBezierCurve3(before,b,after));last=after;
      }
      path.add(new T.LineCurve3(last,v[v.length-1]));
      return mesh(new T.TubeGeometry(path,Math.max(12,v.length*7),r,10,false),material,0,0,0,parent);
    }
    const dummy=new T.Object3D();
    function batch(geo, material, instances,parent=scene) {
      const m=new T.InstancedMesh(geo,material,instances.length);
      for(let i=0;i<instances.length;i++){
        const [x,y,z,w,h,d,rx=0,ry=0,rz=0]=instances[i];
        dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.rotation.set(rx,ry,rz);dummy.updateMatrix();
        m.setMatrixAt(i,dummy.matrix);
      }
      m.castShadow=m.receiveShadow=true;parent.add(m);return m;
    }
    let seed=43217;
    function random(){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296}
    function canvasTex(w,h,draw){
      const c=document.createElement("canvas"); c.width=w;c.height=h;
      draw(c.getContext("2d"),w,h);
      const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return tex;
    }
    // An original panoramic sky gives painted metal and copper a reflected horizon in any camera direction.
    const panorama=canvasTex(1536,768,(g,w,h)=>{
      const sky=g.createLinearGradient(0,0,0,h);
      sky.addColorStop(0,"#578ab2");sky.addColorStop(.37,"#a3c2d2");sky.addColorStop(.51,"#e3d7ba");
      sky.addColorStop(.59,"#a5aa90");sky.addColorStop(1,"#6d705e");
      g.fillStyle=sky;g.fillRect(0,0,w,h);
      const sun=g.createRadialGradient(w*.72,h*.37,2,w*.72,h*.37,165);
      sun.addColorStop(0,"rgba(255,241,209,.91)");sun.addColorStop(.23,"rgba(255,225,176,.32)");sun.addColorStop(1,"rgba(255,225,176,0)");
      g.fillStyle=sun;g.fillRect(0,0,w,h);
      const mountain=(t,n)=>.026*Math.sin(6*Math.PI*t+n)+.016*Math.cos(18*Math.PI*t-n)+.012*Math.sin(30*Math.PI*t+n*.7)+.004*Math.cos(78*Math.PI*t);
      for(let k=0;k<3;k++){
        const base=.47+.017*k;
        g.fillStyle=["#abb9be","#91a4a7","#768d88"][k];g.beginPath();g.moveTo(0,h);
        for(let x=0;x<=w;x+=3)g.lineTo(x,(base+mountain(x/w,k))*h);
        g.lineTo(w,h);g.closePath();g.fill();
        if(k===0){
          for(let x=0;x<w;x+=3){
            const ridge=mountain(x/w,k),altitude=base+ridge;
            if(ridge<-.006){g.fillStyle="rgba(239,238,220,.66)";g.fillRect(x,altitude*h,3,Math.max(1,(-ridge-.006)*h*(.21+.4*random())));}
          }
        }
      }
    });
    panorama.mapping=T.EquirectangularReflectionMapping;
    scene.background=panorama;scene.environment=panorama;
    function surfaceLabel(x,y,z,w,h,draw,parent){
      const tex=canvasTex(512,192,draw);
      const label=mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex,toneMapped:false}),x,y,z,parent);
      label.castShadow=false;return label;
    }
    const gravel=canvasTex(256,256,(g,w,h)=>{
      g.fillStyle="#877f70";g.fillRect(0,0,w,h);
      for(let i=0;i<5500;i++){const k=Math.floor(78+random()*80);g.fillStyle="rgb("+k+","+(k-3)+","+(k-10)+")";
        g.beginPath();g.ellipse(random()*w,random()*h,1+random()*3,.6+random()*2,random()*4,0,Math.PI*2);g.fill();}
    });
    gravel.wrapS=gravel.wrapT=T.RepeatWrapping;gravel.repeat.set(34,34);
    const ground=mat(0xffffff,0,.95);ground.map=gravel;
    const apron=box(0,-.08,0,36,.14,36,ground);
    const softEdge=canvasTex(128,128,(g,w,h)=>{
      const grad=g.createRadialGradient(w/2,h/2,w*.26,w/2,h/2,w*.50);grad.addColorStop(0,'white');grad.addColorStop(1,'black');
      g.fillStyle=grad;g.fillRect(0,0,w,h);
    });
    ground.alphaMap=softEdge;ground.transparent=true;ground.depthWrite=false;apron.renderOrder=-1;
    box(0,.055,0,3.15,.13,1.5,concrete);
    // Cedar facade and weathered seams on the service-side wall.
    const timber=canvasTex(192,512,(g,w,h)=>{
      const grd=g.createLinearGradient(0,0,w,0);grd.addColorStop(0,"#71513a");grd.addColorStop(.32,"#937151");grd.addColorStop(.83,"#866447");grd.addColorStop(1,"#70533d");
      g.fillStyle=grd;g.fillRect(0,0,w,h);
      for(let i=0;i<480;i++){g.strokeStyle=random()>.45?"rgba(48,28,19,.10)":"rgba(228,201,160,.11)";const x=random()*w,y=random()*h;g.beginPath();g.moveTo(x,y);g.bezierCurveTo(x+random()*4,y+22,x-3,y+46,x+random()*2,y+random()*180+20);g.stroke();}
    });
    const wood=mat(0xffffff);wood.map=timber;
    const woodBack=mat(0x453d34);
    box(0,1.91,-2.25,8,3.82,.13,woodBack);
    const boards=[];for(let i=0;i<53;i++)boards.push([-3.9+i*.15,1.95,-2.15,.143,3.72,.075]);
    batch(boxGeo,wood,boards);box(0,.16,-2.105,8,.31,.09,concrete);
    const fascia=mat(0x414849,.45,.52),roof=mat(0x414545,.36,.78);
    box(0,3.83,-2.18,8.55,.21,.53,fascia);
    const roofPlane=box(0,4.36,-4.18,8.7,.11,4.55,roof);
    roofPlane.rotation.x=.23;
    cyl(.066,8.52,0,3.77,-1.905,fascia,'x');
    pipe([[-3.77,3.76,-1.9],[-3.77,3.57,-1.9],[-3.77,3.36,-2.01],[-3.77,.25,-2.01],[-3.77,.14,-1.91]],.048,fascia);
    box(0,1.9,-4.14,7.98,3.78,3.71,woodBack);
    const sill=mat(0x56605e);
    for(const side of [-1,1]){
      const x=side*2.67;box(x,2.33,-2.07,1.64,1.41,.12,edge);
      const glass=mat(0x849a9d,.75,.105);box(x,2.33,-1.994,1.53,1.30,.038,glass);
      box(x,2.33,-1.967,.043,1.30,.052,edge);box(x,1.61,-1.99,1.79,.047,.25,sill);
    }
    const green=mat(0x57694e,0,1), pine=mat(0x394f45,0,.99);
    const conifer=new T.ConeGeometry(1,1,9);
    const trees=[],paletrees=[];
    for(let i=0;i<58;i++){
      const a=random()*Math.PI*2,r=9+random()*10,h=1.9+random()*3.3,x=Math.cos(a)*r,z=Math.sin(a)*r;
      for(let j=0;j<3;j++)(i%3===0?paletrees:trees).push([x,h*(.28+j*.23),z,h*(.26-j*.054),h*(.73-j*.10),h*(.26-j*.054)]);
    }
    const fallbackTrees=[batch(conifer,pine,trees),batch(conifer,green,paletrees)];
    let disposed=false;
    const photoSurfaces=[];
    function photoSurface(url,material,repeatX,repeatY,rotate=0){
      const old=material.map;
      const tex=new T.TextureLoader().load(url,t=>{
        if(disposed){t.dispose();return}
        t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(repeatX,repeatY);t.rotation=rotate;
        t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());material.map=t;material.needsUpdate=true;
      },undefined,()=>{});
      photoSurfaces.push(tex);if(old)photoSurfaces.push(old);
    }
    photoSurface('gravel_floor.jpg',ground,19,19);
    const cladding=mat(0xffffff,.01,.88);
    const wallSkin=mesh(new T.PlaneGeometry(7.96,3.55),cladding,0,2.08,-2.11);
    wallSkin.visible=false;
    // Stranski steni hiše z enakim opažem (pri Žireh je na levi steni zunanje tipalo, v senci).
    const sideCladding=mat(0xffffff,.01,.88),sides=[-1,1].map(side=>{const m=mesh(new T.PlaneGeometry(3.71,3.55),sideCladding,side*3.998,2.08,-4.14);m.rotation.y=side*Math.PI/2;m.visible=false;return m});
    const planks=new T.TextureLoader().load('weathered_brown_planks.jpg',t=>{
      if(disposed){t.dispose();return}
      t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(4.1,1.8);
      t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());cladding.map=t;cladding.needsUpdate=true;wallSkin.visible=true;
      const side=t.clone();side.repeat.set(1.9,1.8);side.needsUpdate=true;photoSurfaces.push(side);sideCladding.map=side;sideCladding.needsUpdate=true;sides.forEach(m=>m.visible=true);
    },undefined,()=>{});
    photoSurfaces.push(planks,softEdge);
    const landscape=new T.TextureLoader().load('okolica.jpg',texture=>{
      if(disposed){texture.dispose();return}
      texture.colorSpace=T.SRGBColorSpace;texture.mapping=T.EquirectangularReflectionMapping;
      scene.environment=texture;scene.background=texture;
      scene.backgroundIntensity=sunny?1.05:.84;
      fallbackTrees.forEach(tree=>tree.visible=false);
    },undefined,()=>{});
    const rocks=[];for(let i=0;i<46;i++){const x=1.85+random()*(callbacks.state().f.caseIndex===9?3:1.6),z=-1.5+random()*.58,s=.045+random()*.075;rocks.push([x,s*.3,z,s*1.35,s*.45,s*1.05,random()*.3,random()*4,0]);}
    batch(new T.IcosahedronGeometry(1,2),mat(0x7a7b72,.02,.9),rocks);   // zaobljeni prodniki, ne oglati kosi

    const machine=group(), cover=group(machine),internals=group(machine);
    // A fine powder-coat grain and a less uniform gloss give the folded steel a surface at arm's length.
    const coatGrain=canvasTex(128,128,(g,w,h)=>{
      const pixels=g.createImageData(w,h);
      for(let i=0;i<pixels.data.length;i+=4){
        const tone=132+Math.floor(90*random());pixels.data.set([tone,tone,tone,255],i);
      }
      g.putImageData(pixels,0,0);
    });
    coatGrain.colorSpace=T.NoColorSpace;coatGrain.wrapS=coatGrain.wrapT=T.RepeatWrapping;coatGrain.repeat.set(7,9);
    const coat=new T.MeshStandardMaterial({color:0x687476,metalness:.38,roughness:.69,roughnessMap:coatGrain,bumpMap:coatGrain,bumpScale:.00043});
    const locations={}, targets={}, effects={};
    function part(id,x,y,z,parent=machine){
      const g=group(parent);g.userData.part=id;locations[id]=V(x,y,z);targets[id]=g;return g;
    }
    const fan=part("fan",-.49,1.03,.47),coil=part("coil",-.58,1.0,-.42);
    const ctrl=part("control",.88,1.30,.53);
    const filter=part("filter",1.01,.62,.25,internals),pump=part("pump",.66,.94,.25,internals);
    const valve=part("valve",.99,1.13,.20,internals),power=part("power",.66,1.54,.29,internals);
    const sensor=part("sensor",1.64,1.64,-2.02);
    // Mounting rails, isolators, drip tray and the painted sheet metal enclosure.
    for(const x of [-.94,.94]){
      box(x,.169,0,.21,.115,.94,rubber);box(x,.245,0,.14,.055,.85,silver);
      for(const z of [-.32,.32]){cyl(.08,.10,x,.32,z,rubber);cyl(.055,.035,x,.375,z,silver,"y",machine,6);}
    }
    box(0,.411,0,2.65,.078,.97,graphite,machine);
    box(0,1.812,0,2.69,.064,.985,coat,machine);
    box(0,1.775,.466,2.65,.018,.035,silver,machine);
    box(.428,1.11,0,.046,1.34,.91,edge,machine);
    box(-1.30,1.11,0,.055,1.37,.94,edge,machine);
    box(-.449,1.11,-.424,1.66,1.34,.08,dark,coil);
    box(-.449,1.11,.379,1.66,1.34,.10,dark,fan);
    box(.879,1.11,-.41,.84,1.34,.068,steel,internals);
    // Recessed circular fan opening with curved blades and individual guard wires.
    const fanX=-.46,fanY=1.11;
    const face=new T.Shape();
    face.moveTo(-1.287,.456);face.lineTo(.409,.456);face.lineTo(.409,1.772);face.lineTo(-1.287,1.772);face.closePath();
    const opening=new T.Path();opening.absarc(fanX,fanY,.646,0,Math.PI*2,true);face.holes.push(opening);
    const front=mesh(new T.ExtrudeGeometry(face,{depth:.012,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.003,bevelThickness:.003,curveSegments:72}),coat,0,0,.478,fan);
    front.receiveShadow=true;
    cyl(.648,.068,fanX,fanY,.434,edge,"z",fan,72);
    cyl(.613,.079,fanX,fanY,.448,dark,"z",fan,72);
    const rotor=group(fan);rotor.position.set(fanX,fanY,.497);
    const profile=new T.Shape();
    profile.moveTo(-.058,.102);profile.bezierCurveTo(-.14,.20,-.24,.40,-.22,.48);
    profile.bezierCurveTo(-.16,.56,.05,.586,.13,.536);profile.bezierCurveTo(.02,.414,.024,.231,.065,.12);profile.closePath();
    const bladeGeo=new T.ExtrudeGeometry(profile,{depth:.027,bevelEnabled:true,bevelThickness:.006,bevelSize:.006,bevelSegments:1,steps:1,curveSegments:12});
    for(let i=0;i<5;i++){const b=mesh(bladeGeo,blades,0,0,0,rotor);b.rotation.z=i*Math.PI*2/5;b.rotation.x=.08;}
    cyl(.148,.093,fanX,fanY,.539,graphite,"z",fan);
    cyl(.094,.024,fanX,fanY,.592,edge,"z",fan);
    const rings=[];
    for(let i=0;i<13;i++){const r=.138+i*.0402;rings.push([fanX,fanY,.586-(i/12)*.033,r,r,.7]);}
    batch(new T.TorusGeometry(1,.014,5,88),edge,rings,fan);
    const brim=mesh(new T.TorusGeometry(.644,.022,8,88),graphite,fanX,fanY,.538,fan);
    for(let i=0;i<8;i++){
      const a=i*Math.PI*.25+.14,cs=Math.cos(a),sn=Math.sin(a);
      pipe([[fanX+.106*cs,fanY+.106*sn,.595],[fanX+.625*cs,fanY+.625*sn,.56]],.008,edge,fan);
    }
    const grilles=[];
    for(let i=0;i<52;i++) grilles.push([-1.246+i*.0311,1.106,-.480,.010,1.255,.031]);
    batch(boxGeo,silver,grilles,coil);
    for(let i=0;i<4;i++) box(-.448,.565+i*.355,-.49,1.65,.022,.028,graphite,coil);
    const sideFin=[];for(let i=0;i<25;i++)sideFin.push([-1.334,.498+i*.050,0,.041,.018,.79,0,0,.12]);
    batch(boxGeo,steel,sideFin,coil);
    // Removable front service skin and side skin. The control badge is a separate service target.
    box(.886,1.108,.449,.847,1.338,.051,coat,cover);
    box(1.306,1.108,0,.053,1.339,.901,coat,cover);
    const rig=group(ctrl);rig.userData.part="control";
    box(.908,1.427,.491,.485,.156,.035,rubber,rig);
    const lcd=surfaceLabel(.892,1.426,.514,.401,.126,()=>{},rig);
    lcd.userData.fieldId='regulatorScreen';
    const lcdTexture=lcd.material.map,lcdCanvas=lcdTexture.image;
    let lcdKey='';
    function updateLCD(f){
      const page=f.screenPage||'overview',key=[f.caseIndex,f.fixed,f.isolated,page].join('|');
      if(lcdKey===key)return;
      lcdKey=key;
      Regulator.draw(lcdCanvas.getContext('2d'),lcdCanvas.width,lcdCanvas.height,Regulator.snapshot(f,CASES[f.caseIndex]),page);
      lcdTexture.needsUpdate=true;
    }
    const keycap=box(1.125,1.425,.515,.035,.064,.012,edge,rig);keycap.userData.fieldId='regulatorScreen';
    // Separate diagnostic socket remains accessible with a handheld service terminal.
    cyl(.038,.022,.907,1.293,.485,edge,'z',rig);
    cyl(.022,.012,.907,1.293,.504,steel,'z',rig,8);
    surfaceLabel(1.018,1.294,.477,.126,.031,g=>{g.fillStyle='#cbd1c7';g.fillRect(0,0,512,192);g.fillStyle='#26322f';g.font='bold 118px sans-serif';g.fillText('SERVIS',18,135)},rig);
    surfaceLabel(.906,.67,.48,.293,.115,(g,w,h)=>{
      g.fillStyle="#c4c9bc";g.fillRect(0,0,w,h);g.fillStyle="#28352f";g.font="bold 37px sans-serif";g.fillText("TOPLOLOG  /  MONOBLOK",16,43);
      g.fillRect(16,56,480,3);g.font="23px monospace";g.fillText("MODEL  TL–08  |  UČNA ENOTA",16,88);g.fillText("SERIJA  08.204  /  ZRAK–VODA",16,119);
      for(let i=0;i<92;i++)g.fillRect(19+i*5,138,i%4===0?3:1,38);
    },cover);
    const bolts=[];
    for(const x of [-1.244,.374,.509,1.252])for(const y of [.499,1.718]) bolts.push([x,y,.486,.022,.012,.022,Math.PI/2]);
    batch(new T.CylinderGeometry(1,1,1,6),silver,bolts.slice(0,4),machine);
    batch(new T.CylinderGeometry(1,1,1,6),silver,bolts.slice(4),cover);
    // Key components of the hydronic section. Shapes are individually pickable, including their fittings.
    const insidePlate=mat(0xa7a792,.62,.41);
    const plates=[];for(let i=0;i<22;i++)plates.push([.67,.97,-.232+i*.011,.31,.69,.006]);
    batch(boxGeo,insidePlate,plates,internals);
    box(.69,1.552,.012,.392,.295,.213,rubber,power);
    box(.69,1.553,.139,.339,.242,.045,white,power);
    for(let i=0;i<3;i++)box(.578+i*.072,1.553,.178,.05,.103,.036,i===0?red:edge,power);
    pipe([[.56,1.405,.034],[.51,1.341,.021],[.51,1.156,-.022]],.014,dark,power);
    cyl(.144,.19,.67,.988,.13,red,"z",pump);
    cyl(.123,.033,.67,.988,.241,edge,"z",pump);
    cyl(.084,.02,.67,.988,.266,steel,"z",pump);
    const rotorMark=box(.67,.988,.278,.073,.012,.007,dark,pump);effects.waterRotor=rotorMark;
    box(.57,1.112,.11,.117,.092,.13,rubber,pump);
    pipe([[.65,.857,.111],[.65,.71,.111],[.89,.71,.111],[.89,.608,.111]],.044,copper,pump);
    pipe([[.69,1.116,.115],[.69,1.279,.115],[.97,1.279,.115],[.97,1.17,.115]],.041,copper,valve);
    cyl(.079,.247,1.017,.608,.135,brass,"x",filter,8);
    const cap=cyl(.082,.165,1.043,.548,.225,brass,"z",filter,8);cap.rotation.x=.9;
    cyl(.055,.10,1.04,.603,.28,edge,"z",filter);
    const indicatorMat=mat(0xa94c39,.20);effects.indicator=indicatorMat;
    cyl(.037,.014,1.04,.603,.341,indicatorMat,"z",filter);
    box(1.02,1.135,.156,.18,.171,.173,brass,valve);
    box(1.02,1.166,.272,.215,.152,.10,edge,valve);
    const lever=box(1.025,1.174,.329,.117,.019,.02,red,valve);effects.lever=lever;
    const toAnnex=callbacks.state().f.caseIndex!==9;
    for(const [y,m] of [[.605,blue],[1.134,red]]){
      cyl(.070,.178,1.225,y,.136,brass,"x",internals,6);
      pipe(toAnnex?[[1.22,y,.136],[1.442,y,.136],[1.48,y,-.02],[1.48,y,-1.9],[3.6,y,-1.9]]:[[1.22,y,.136],[1.442,y,.136],[1.48,y,-.02],[1.48,y,-2.085]],.065,rubber);
      cyl(.070,.023,1.48,y,-.34,m,"z");
      if(toAnnex)cyl(.101,.05,3.55,y,-1.9,steel,"x");else cyl(.101,.05,1.48,y,-2.058,steel,"z");
    }
    const wallSensor=group(sensor);
    // Zunanje tipalo v lokalnih koordinatah (+z = stran od stene). Kje visi, določi servisni del glede na nalog.
    box(0,0,.0515,.151,.225,.103,white,wallSensor);
    for(let i=0;i<5;i++)box(0,-.05+i*.021,.109,.099,.009,.012,edge,wallSensor);
    pipe([[0,-.115,.03],[0,-.4,.03],[0,-.43,0]],.008,steel,wallSensor);
    const flowSensor=group(sensor);
    // Pregled notranjosti: "voda" pusti vodni del, hladilni krog postane prosojen – in obratno. Prosojni deli ne lovijo klikov.
    const ghostMat=new T.MeshStandardMaterial({color:0x9fb3b8,roughness:.6,transparent:true,opacity:.12,depthWrite:false});
    const hydroGroups=()=>[filter,pump,valve,power,flowSensor];
    const refGroups=()=>internals.children.filter(g=>/^ref:/.test(g.userData.fieldId||"")&&!["ref:plate","ref:schema"].includes(g.userData.fieldId));
    function ghost(g,on){g.userData.nonBlocking=on;g.traverse(n=>{if(!n.isMesh||(n.userData.solid?n.userData.solid:n.material).opacity===0)return;   // nevidne površine za nameritev ostanejo nevidne
      
      if(on&&!n.userData.solid){n.userData.solid=n.material;n.material=ghostMat;n.castShadow=false}
      else if(!on&&n.userData.solid){n.material=n.userData.solid;delete n.userData.solid}})}
    function layer(mode){hydroGroups().forEach(g=>ghost(g,mode==="refrigerant"));refGroups().forEach(g=>ghost(g,mode==="water"));renderer.shadowMap.needsUpdate=true}
    cyl(.078,.133,1.166,.775,.132,brass,"y",flowSensor,8);
    pipe([[1.163,.609,.14],[1.163,.79,.14],[1.163,.955,.14],[1.03,.955,.14]],.043,copper,flowSensor);
    box(1.167,.831,.205,.151,.104,.098,blue,flowSensor);
    const signal=mat(0xd66143);effects.signal=signal;
    cyl(.016,.011,1.201,.831,.261,signal,"z",flowSensor);
    // Hladilni krog za pokrovom – samo za ogled (poseg samo s spričevalom). Ime in razlaga se pokažeta, ko nanj nameriš.
    {
      const ref=id=>{const g=group(internals);g.userData.fieldId="ref:"+id;return g};
      const felt=mat(0x2a2f2c,.02,.95),coilMat=mat(0x15191a,.1,.6),wire=mat(0x2f3b45,.05,.7),capLow=mat(0x2d5fa8,.2,.5),capHigh=mat(0xb23a2a,.2,.5),accMat=mat(0x2e3a34,.35,.55);
      const L=.0125,ghost=new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});
      // Nevidna večja površina, da tanke dele lažje nameriš.
      const hit=(g,r,h,x,y,z,axis="y")=>{const m=cyl(r,h,x,y,z,ghost,axis,g,8);m.castShadow=m.receiveShadow=false;return m};
      const comp=ref("compressor");                                                    // kompresor v zvočni izolaciji
      cyl(.112,.27,1.08,.6,-.24,felt,"y",comp);cyl(.1,.05,1.08,.76,-.24,steel,"y",comp);
      box(1.0,.79,-.24,.06,.05,.05,rubber,comp);
      for(const [dx,dz] of [[-.07,-.07],[.07,-.07],[-.07,.07],[.07,.07]])cyl(.016,.03,1.08+dx,.47,-.24+dz,rubber,"y",comp);
      const acc=ref("accumulator");cyl(.052,.28,.9,.62,-.32,accMat,"y",acc);cyl(.03,.03,.9,.775,-.32,accMat,"y",acc);
      const four=ref("fourway");cyl(.028,.13,1.06,1.02,-.30,brass,"x",four);box(1.06,1.075,-.30,.05,.05,.045,coilMat,four);
      pipe([[1.06,1.1,-.30],[1.06,1.16,-.36],[.9,1.16,-.38]],.004,wire,four);
      const plateHx=ref("plate");
      for(const z of [-.252,.008])box(.67,.97,z,.33,.73,.012,steel,plateHx);
      for(const [x,y] of [[.53,.62],[.81,.62],[.53,1.32],[.81,1.32]])cyl(.006,.27,x,y,-.122,silver,"z",plateHx,8);
      // cevi: tlačna, sesalna, proti izmenjevalniku in uparjalniku
      pipe([[1.08,.78,-.24],[1.08,.98,-.27],[1.0,1.02,-.30]],L,copper,four);
      pipe([[.995,1.02,-.33],[.9,1.0,-.33],[.9,.8,-.32]],L,copper,acc);
      pipe([[.9,.8,-.29],[.97,.74,-.25],[.99,.7,-.24]],L,copper,acc);
      pipe([[1.12,1.02,-.30],[1.12,1.22,-.30],[.86,1.22,-.30],[.86,1.22,-.2],[.83,1.22,-.2]],L,copper,plateHx);
      pipe([[1.06,1.0,-.33],[1.06,.96,-.36],[.47,.96,-.36]],L,copper,four);
      const liquid=ref("liquid");                                                       // izmenjevalnik → filter sušilnik → EEV → uparjalnik
      pipe([[.83,.7,-.03],[1.24,.7,-.03],[1.24,1.36,-.03],[1.24,1.36,-.32],[.47,1.36,-.32]],.009,copper,liquid);
      const dryer=ref("dryer");cyl(.032,.2,1.24,1.36,-.15,copper,"z",dryer);
      for(const z of [-.04,-.26])cyl(.018,.024,1.24,1.36,z,brass,"z",dryer,6);hit(dryer,.065,.27,1.24,1.36,-.15,"z");
      const eev=ref("eev");cyl(.02,.08,1.02,1.36,-.32,brass,"x",eev);cyl(.036,.075,1.02,1.42,-.32,coilMat,"y",eev);hit(eev,.05,.13,1.02,1.39,-.32);
      pipe([[1.02,1.46,-.32],[.95,1.5,-.38],[.8,1.5,-.38]],.004,wire,eev);
      const ports=ref("ports");
      for(const [y,cap] of [[1.62,capHigh],[1.55,capLow]]){pipe([[1.24,y,-.2],[1.24,y,.04]],.006,copper,ports);cyl(.011,.03,1.24,y,.055,brass,"z",ports,6);cyl(.013,.025,1.24,y,.08,cap,"z",ports,12)}hit(ports,.05,.2,1.24,1.585,.04);
      const hp=ref("hp");cyl(.018,.05,1.13,.93,-.27,rubber,"x",hp);hit(hp,.04,.08,1.13,.93,-.27,"x");pipe([[1.155,.93,-.27],[1.2,.98,-.3],[1.2,1.2,-.38]],.003,wire,hp);
      const lp=ref("lp");cyl(.016,.05,.9,.86,-.32,rubber,"y",lp);hit(lp,.04,.08,.9,.86,-.32);pipe([[.9,.885,-.32],[.88,.95,-.38],[.7,1.1,-.38]],.003,wire,lp);
      const tdis=ref("tdis");box(1.08,.86,-.255,.022,.03,.03,dark,tdis);hit(tdis,.035,.06,1.08,.86,-.255);pipe([[1.08,.86,-.27],[1.15,.9,-.36],[1.15,1.15,-.38]],.003,wire,tdis);
      const tsuc=ref("tsuc");box(.94,.77,-.26,.022,.022,.03,dark,tsuc);hit(tsuc,.035,.06,.94,.77,-.26);pipe([[.94,.77,-.28],[.85,.85,-.37],[.7,1.05,-.38]],.003,wire,tsuc);
    }
    // Nalepka s shemo hladilnega kroga na steni predelka – na objektu jo najprej poišči.
    {
      const schema=group(internals);schema.userData.fieldId="ref:schema";
      const tex=canvasTex(640,470,(g,w,h)=>{
        g.fillStyle="#e4e6dc";g.fillRect(0,0,w,h);g.fillStyle="#26332f";g.fillRect(0,0,w,52);
        g.fillStyle="#eef0e6";g.font="bold 28px sans-serif";g.fillText("SHEMA HLADILNEGA KROGA · OGREVANJE",16,36);
        const node=(x,y,t1,t2)=>{g.fillStyle="#fbfbf6";g.strokeStyle="#26332f";g.lineWidth=3;g.fillRect(x-78,y-30,156,60);g.strokeRect(x-78,y-30,156,60);g.fillStyle="#1e2a27";g.font="bold 19px sans-serif";g.textAlign="center";g.fillText(t1,x,y-4);g.font="16px sans-serif";g.fillText(t2,x,y+18);g.textAlign="left"};
        const line=(pts,c)=>{g.strokeStyle=c;g.lineWidth=7;g.beginPath();g.moveTo(...pts[0]);pts.slice(1).forEach(p=>g.lineTo(...p));g.stroke();const [a,b]=pts.slice(-2);const ang=Math.atan2(b[1]-a[1],b[0]-a[0]),mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;g.fillStyle=c;g.beginPath();g.moveTo(mx+12*Math.cos(ang),my+12*Math.sin(ang));g.lineTo(mx-9*Math.cos(ang)-9*Math.sin(ang),my-9*Math.sin(ang)+9*Math.cos(ang));g.lineTo(mx-9*Math.cos(ang)+9*Math.sin(ang),my-9*Math.sin(ang)-9*Math.cos(ang));g.fill()};
        const RED="#b8432f",ORANGE="#d98a2b",BLUE="#3069a8";
        line([[320,390],[320,150]],RED);line([[398,120],[520,120],[520,175]],RED);
        line([[520,235],[520,300]],ORANGE);line([[520,360],[520,420],[200,420],[120,420],[120,330]],ORANGE);
        line([[120,270],[120,120],[242,120]],BLUE);line([[320,150],[320,150]],BLUE);line([[300,150],[220,250],[220,300]],BLUE);line([[220,360],[220,390],[262,390]],BLUE);
        node(320,120,"4-POTNI VENTIL","s tuljavo");node(520,205,"KONDENZATOR","ploščni · voda");node(520,330,"FILTER SUŠILNIK","tekočinski vod");
        node(120,300,"EEV","ekspanzijski v.");node(120,90+0,"","");g.clearRect(0,0,0,0);
        node(220,330,"LOČEVALNIK","tekočine");node(340,420,"KOMPRESOR","spodaj zadaj");node(120,190,"UPARJALNIK","lamele zunaj");
        g.fillStyle=RED;g.beginPath();g.arc(372,350,12,0,7);g.fill();g.fillStyle=BLUE;g.beginPath();g.arc(268,250,12,0,7);g.fill();
        g.fillStyle="#1e2a27";g.font="bold 17px sans-serif";g.fillText("VT",389,356);g.fillText("NT",284,256);
        g.font="15px sans-serif";g.fillText("rdeče: vroči plin · oranžno: tekočina · modro: sesalni vod",16,h-12);
      });
      const label=mesh(new T.PlaneGeometry(.3,.22),new T.MeshBasicMaterial({map:tex,toneMapped:false}),.454,1.6,-.2,schema);
      label.rotation.y=Math.PI/2;label.castShadow=false;
    }
    const fallenLeaves=group(coil);
    const leafGeo=new T.SphereGeometry(1,6,4),leafSpecs=[[],[],[]];
    for(let i=0;i<110;i++){
      const x=-1.21+random()*1.56,y=.495+random()*.91,z=-.516-random()*.019,s=.036+random()*.032;
      leafSpecs[i%3].push([x,y,z,s*.56,s,.008,random()*.4,0,random()*6.28]);
    }
    [0x87522f,0x725432,0xa0713d].forEach((color,i)=>batch(leafGeo,mat(color),leafSpecs[i],fallenLeaves));
    // Navigation and picking share the same scene geometry used by the renderer.
    const kit=window.createFieldKit(T,scene,camera);
    const service=window.createServiceRig({THREE:T,scene,machine,cover,rig,targets,internals,wallSensor,flowSensor,fallenLeaves,lever,indicatorMat,signal,kit,camera});
    const fp=window.createFirstPerson({T,host,canvas,scene,camera,kit,service,
      callbacks:{...callbacks,shadowsChanged:()=>{renderer.shadowMap.needsUpdate=true},resize:(w,h)=>renderer.setSize(w,h,false)},
      render(dt,f){
        updateLCD(f);
        if(!f.isolated&&!(CASES[f.caseIndex].station&&f.phase==='procedure'&&f.radStep>=1)){
          if(f.fixed||![0,2,3,5].includes(f.caseIndex))rotor.rotation.z-=dt*3.7;
          if(f.fixed||f.caseIndex!==3)rotorMark.rotation.z-=dt*2.4;
        }
        renderer.render(scene,camera);
      }
    });
    renderer.shadowMap.needsUpdate=true;
    return { ...fp, layer, applyState(){fp.sync();renderer.shadowMap.needsUpdate=true},destroy(){
      disposed=true;layer("all");ghostMat.dispose();fp.destroy();
      const gs=new Set(),ms=new Set(),ts=new Set();
      scene.traverse(n=>{if(n.geometry)gs.add(n.geometry);if(n.material){const mats=Array.isArray(n.material)?n.material:[n.material];for(const m of mats){ms.add(m);if(m.map)ts.add(m.map);}}});
      gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());for(const t of [...photoSurfaces,coatGrain,landscape,panorama])ts.add(t);ts.forEach(t=>t.dispose());
      light.shadow.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove();
    }};
  }
  function fallback(host, callbacks) {
    const pane=document.createElement("div");
    pane.style.cssText="width:100%;height:100%;padding:24px;box-sizing:border-box;overflow:auto;background:#253138;color:white;font:16px system-ui;display:grid;align-content:center;gap:12px";
    const head=document.createElement("strong");head.textContent="Servisna shema";pane.appendChild(head);
    const help=document.createElement("span");help.textContent="3D prikaz na tej napravi ni na voljo. Izberi del za pregled.";pane.appendChild(help);
    const grid=document.createElement("div");grid.style.cssText="display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:7px";pane.appendChild(grid);
    const buttons={};
    for(const [k,title] of Object.entries(labels)){
      const b=document.createElement("button");b.type="button";b.textContent=title;b.style.cssText="font:inherit;color:white;background:#38484c;border:1px solid #687c80;border-radius:5px;padding:9px;cursor:pointer";
      b.onclick=()=>{select(k);callbacks.onPart?.(k);};grid.appendChild(b);buttons[k]=b;
    }
    function select(k){for(const key of Object.keys(buttons))buttons[key].style.borderColor=key===k?"#e9b668":"#687c80";}
    host.appendChild(pane);
    return {select,reset:()=>select(null),zoom(){},toggleCover(){current.opened=!current.opened;return current.opened},applyState(){},destroy(){pane.remove()}};
  }
  window.PumpView={
    open(container,callbacks={}){
      this.close();
      try{view=startThree(container,callbacks);}
      catch(err){container.replaceChildren();view=fallback(container,callbacks);callbacks.onError?.(err);}
    },
    close(){if(view){view.destroy();view=null;}},
    select(part){view?.select?.(part);},reset(){view?.reset?.();},zoom(delta){view?.zoom?.(delta);},
    sync(){view?.applyState?.()}, direction(){view?.direction?.()}, releaseMouse(){view?.releaseMouse?.()},
    move(code,down){view?.move?.(code,down)},crouch(){view?.crouch?.()},lookLock(){view?.lookLock?.()},
    setState(next){for(const k of Object.keys(current))if(next[k]!==undefined)current[k]=next[k];view?.applyState();},
    layer(mode){view?.layer?.(mode)},
    toggleCover(){if(view)return view.toggleCover();current.opened=!current.opened;return current.opened;}
  };
})();
