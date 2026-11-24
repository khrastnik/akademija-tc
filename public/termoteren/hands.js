/* One continuous skin surface per hand, weighted to the wrist and fourteen finger joints. */
window.createAnatomicalHand=(()=>{
 let library=null,users=0;
 function build(T){
  const V=(x,y,z)=>new T.Vector3(x,y,z),digits=[],segments=[];
  const lengths=[[32,22,17],[36,25,18],[33,23,17],[25,17,14]];
  for(let i=0;i<4;i++){
   const x=[-28,-9,11,29][i],z=[-24,-28,-26,-19][i],r=[8,8.5,8,6.8][i],pts=[V(x,1,z)];
   for(let j=0;j<3;j++)pts.push(pts[j].clone().add(V((i-1.5)*1.4,-1.2-j*.3,-lengths[i][j])));
   digits.push({pts,r})
  }
  digits.push({pts:[V(-27,-3,23),V(-42,-9,3),V(-50,-12,-18),V(-54,-14,-35)],r:10});
  digits.forEach(({pts,r},i)=>{for(let j=0;j<3;j++){
   const a=pts[j],b=pts[j+1],d=b.clone().sub(a);segments.push({a,b,d,len:d.lengthSq(),r:r*(1-.09*j),idx:1+3*i+j})
  }});
  function ell(x,y,z,rx,ry,rz){return (Math.sqrt((x/rx)**2+(y/ry)**2+(z/rz)**2)-1)*Math.min(rx,ry,rz)}
  function blend(a,b,k){const h=Math.max(0,k-Math.abs(a-b));return Math.min(a,b)-h*h/(4*k)}
  function surface(x,y,z,weights){
   let val=blend(ell(x,y,z-6,39,13.4,47),ell(x+1,y+1,z-38,24,13,30),9);
   val=blend(val,ell(x+20,y+6,z-11,18,12,28),7);val=blend(val,ell(x-21,y+5,z-3,14,10,31),6);
   const palm=val;if(weights)weights.push([0,1/(4+(Math.max(0,palm)+3)**3)]);
   for(const s of segments){
    const px=x-s.a.x,py=y-s.a.y,pz=z-s.a.z;
    const u=Math.max(0,Math.min(1,(px*s.d.x+py*s.d.y+pz*s.d.z)/s.len));
    const dx=px-u*s.d.x,dy=py-u*s.d.y,dz=pz-u*s.d.z;
    const rad=s.r*(1-.12*u+.055*Math.cos(u*Math.PI*2));
    const dst=Math.sqrt(dx*dx+dy*dy*1.13+dz*dz)-rad;
    val=blend(val,dst,3.6);
    if(weights)weights.push([s.idx,1/(4+(Math.max(0,dst)+3)**3)])
   }return val
  }
  const step=3.5,nx=34,ny=18,nz=57,x0=-68,y0=-34,z0=-126;
  const field=new Float32Array(nx*ny*nz),at=(x,y,z)=>x+nx*(y+ny*z);
  for(let z=0;z<nz;z++)for(let y=0;y<ny;y++)for(let x=0;x<nx;x++)field[at(x,y,z)]=surface(x0+x*step,y0+y*step,z0+z*step);
  const positions=[],normals=[],colors=[],indices=[],skinIdx=[],skinW=[],cache=new Map();
  const point=i=>V(x0+(i%nx)*step,y0+(Math.floor(i/nx)%ny)*step,z0+Math.floor(i/(nx*ny))*step);
  const skin=new T.Color(0xb67e65),flush=new T.Color(0xac6859),color=new T.Color();
  function vertex(a,b){
   const key=Math.min(a,b)*field.length+Math.max(a,b);if(cache.has(key))return cache.get(key);
   const p=point(a).lerp(point(b),field[a]/(field[a]-field[b])),{x,y,z}=p,h=.25;
   const normal=V(surface(x+h,y,z)-surface(x-h,y,z),surface(x,y+h,z)-surface(x,y-h,z),surface(x,y,z+h)-surface(x,y,z-h)).normalize();
   const idx=positions.length/3;positions.push(x,y,z);normals.push(normal.x,normal.y,normal.z);
   const w=[];surface(x,y,z,w);w.sort((a,b)=>b[1]-a[1]);const sum=w.slice(0,4).reduce((s,e)=>s+e[1],0);
   for(let i=0;i<4;i++){skinIdx.push(w[i][0]);skinW.push(w[i][1]/sum)}
   const joint=segments.some(s=>p.distanceToSquared(s.a)<105);
   color.copy(skin).lerp(flush,joint?.65:Math.max(0,-normal.y)*.29);
   for(const s of segments){const dz=Math.abs(z-s.a.z),dx=Math.abs(x-s.a.x);if(dx<s.r&&dz<2.4&&normal.y>.3){color.multiplyScalar(.92+.08*dz/2.4);break}}
   const mottling=.98+.016*Math.sin(.19*x+.06*z)*Math.cos(.11*y+.16*z);colors.push(color.r*mottling,color.g*mottling,color.b*mottling);
   cache.set(key,idx);return idx
  }
  function tri(a,b,c){
   const va=new T.Vector3().fromArray(positions,a*3),vb=new T.Vector3().fromArray(positions,b*3),vc=new T.Vector3().fromArray(positions,c*3);
   if(vb.sub(va).cross(vc.sub(va)).dot(new T.Vector3().fromArray(normals,a*3))<0)indices.push(a,c,b);else indices.push(a,b,c)
  }
  const tets=[[0,1,3,7],[0,3,2,7],[0,2,6,7],[0,6,4,7],[0,4,5,7],[0,5,1,7]];
  const offsets=[0,1,nx,nx+1,nx*ny,nx*ny+1,nx*ny+nx,nx*ny+nx+1];
  for(let z=0;z<nz-1;z++)for(let y=0;y<ny-1;y++)for(let x=0;x<nx-1;x++){
   const i=at(x,y,z),sg=field[i]<0;if(offsets.every(o=>(field[i+o]<0)===sg))continue;
   for(const tet of tets){
    const inside=[],outside=[];for(const k of tet){const n=i+offsets[k];(field[n]<0?inside:outside).push(n)}
    if(!inside.length||!outside.length)continue;
    if(inside.length===2){const [a,b]=inside,[c,d]=outside;const ac=vertex(a,c),ad=vertex(a,d),bc=vertex(b,c),bd=vertex(b,d);tri(ac,ad,bc);tri(ad,bd,bc)}
    else{const lone=(inside.length===1?inside:outside)[0],rest=inside.length===1?outside:inside;tri(...rest.map(n=>vertex(lone,n)))}
   }
  }
  const g=new T.BufferGeometry();g.setIndex(indices);for(const [name,array,size] of [['position',positions,3],['normal',normals,3],['color',colors,3],['skinWeight',skinW,4]])g.setAttribute(name,new T.Float32BufferAttribute(array,size));
  g.setAttribute('skinIndex',new T.Uint16BufferAttribute(skinIdx,4));
  // Pores and shallow folds break up highlights across the back of the hand.
  const uv=[];for(let i=0;i<positions.length;i+=3)uv.push(positions[i]/75+positions[i+1]/170,positions[i+2]/75);
  g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d'),im=ctx.createImageData(128,128);let seed=19;
  for(let i=0;i<im.data.length;i+=4){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const n=118+(seed%48);im.data.set([n,n,n,255],i)}ctx.putImageData(im,0,0);
  const texture=new T.CanvasTexture(c);texture.wrapS=texture.wrapT=T.RepeatWrapping;
  const mat=new T.MeshStandardMaterial({vertexColors:true,roughness:.72,bumpMap:texture,bumpScale:.00011});
  const nailGeo=new T.SphereGeometry(1,18,10),nailMat=new T.MeshStandardMaterial({color:0xbc8a79,roughness:.48});
  return {g,mat,nailGeo,nailMat,digits,dispose(){g.dispose();mat.dispose();texture.dispose();nailGeo.dispose();nailMat.dispose()}}
 }
 return function(T,parent,side){
  const lib=library||(library=build(T));users++;
  const mount=new T.Group();parent.add(mount);mount.position.set(side*.032,-.001,.028);
  mount.scale.set(.001*side,.001,.001);
  mount.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(new T.Vector3(0,-.94,.342).normalize(),new T.Vector3(1,0,0),new T.Vector3(0,.342,.94).normalize()));
  // Mirror the completed hand about the wrist's sagittal plane.
  if(side<0){mount.scale.setScalar(.001);const mirror=new T.Group();parent.add(mirror);mirror.scale.x=-1;mirror.add(mount);mount.position.x=.032}
  const mesh=new T.SkinnedMesh(lib.g,lib.mat);mesh.frustumCulled=false;mount.add(mesh);
  const base=new T.Bone(),bones=[base],chains=[];mesh.add(base);
  lib.digits.forEach(({pts,r},i)=>{
   let prev=base;const ch=[];
   for(let j=0;j<3;j++){const bone=new T.Bone();bone.position.copy(pts[j]);if(j)bone.position.sub(pts[j-1]);prev.add(bone);prev=bone;bones.push(bone);ch.push(bone)}
   const nail=new T.Mesh(lib.nailGeo,lib.nailMat);nail.scale.set(r*.65,.95,r*.88);nail.position.copy(pts[3]).sub(pts[2]).multiplyScalar(.68);nail.position.y+=r*.69;prev.add(nail);chains.push(ch)
  });
  // Bind in local millimetres before the arm assumes its world pose.
  mesh.updateMatrixWorld(true);const skeleton=new T.Skeleton(bones);mesh.bind(skeleton);
  // Prijemi po orodju. f = upogib prstov (kazalec, sredinec, prstanec, mezinec), t = palec,
  // o = kako daleč palec pride čez dlan, tip = koliko se upogne zadnji členek.
  const GRIPS={
   relaxed:{f:[.82,1,1.14,1.3],t:.8,o:.8,tip:1},              // naravna kaskada: mezinec bolj skrčen kot kazalec
   grip:{f:[.94,1,1.04,1.08],t:1,o:1,tip:1},
   power:{f:[.9,1.02,1.08,1.14],t:1.08,o:1.35,tip:.9},        // ročaj v pesti, palec ovit čez kazalec
   instrument:{f:[.5,.56,.62,.7],t:.22,o:.55,tip:1.1},        // instrument v dlani, palec prost za tipke
   pinch:{f:[.78,.92,1.02,1.12],t:.8,o:1.15,tip:.55},         // tipalo med palcem in kazalcem
   edge:{f:[.55,.58,.6,.62],t:.7,o:.7,tip:1.6}                // rob pokrova: ravni prsti, upognjene konice
  };
  return {pose(flex,style){
   const grip=Math.max(0,Math.min(1,flex)),G=GRIPS[style]||GRIPS.grip;
   chains.forEach((chain,i)=>{const thumb=i===4;chain.forEach((b,k)=>{
    const f=Math.min(1.12,grip*(thumb?G.t:G.f[i]))*(k===2&&!thumb?G.tip:1);
    b.rotation.x=thumb?-.25-f*[.27,.36,.48][k]:-[.28,.22,.12][k]-f*[.82,1.04,.78][k];
    b.rotation.y=thumb?-.12+grip*G.o*[.69,.25,.11][k]:(i-1.5)*.046*(1-Math.min(1,f));
    b.rotation.z=thumb&&k===0?-.27*grip*G.o:0;
   })});
   mount.position.x=.032;if(style==='instrument'){mount.position.x=.059;mount.position.z=.067}else mount.position.z=.028
  },dispose(){skeleton.dispose();if(--users===0){lib.dispose();library=null}}}
 };
})();
