import {t,localize} from './language.js';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {makeExplosionPlan} from './explosion.js';
import {enrichParts} from './part-info.js?v=language-1';
import {createTapRecognizer} from './pointer-input.js';
import {inspectionDistance,boxFitDistance} from './view-framing.js';
import {createAssemblyIndex,createAssemblyMotion,newViewState,inView,assemblyAnchor} from './assemblies.js';
const v3=a=>new THREE.Vector3(...a);
const white=new THREE.Color(1,1,1);
export class AnatomyViewer{
 constructor(canvas,onSelect){
  this.canvas=canvas;this.onSelect=onSelect;this.parts=new Map();this.batches=[];this.entries=[];this.state=newViewState();this.amount=0;this.dirty=true;this.pendingFrame=false;
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.02;
  this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(36,1,.008,300);this.camera.position.set(-6.6,3.25,5.5);
  this.controls=new OrbitControls(this.camera,canvas);this.controls.target.set(0,.6,0);this.controls.enableDamping=true;this.controls.dampingFactor=.12;this.controls.minDistance=.045;this.controls.maxDistance=50;this.controls.maxPolarAngle=Math.PI*.98;this.controls.addEventListener('change',()=>this.invalidate());this.controls.addEventListener('start',()=>{this.cameraMotion=null;this.beforeCameraInteraction?.()});
  const pmrem=new THREE.PMREMGenerator(this.renderer),room=new RoomEnvironment();this.environment=pmrem.fromScene(room,.01,.1,100,{size:512}).texture;this.scene.environment=this.environment;this.scene.environmentIntensity=.85;room.dispose();pmrem.dispose();
  this.scene.add(new THREE.HemisphereLight(0xf1f5ff,0x8998a7,1.4));const key=new THREE.DirectionalLight(0xf5f8ff,2.1);key.position.set(-3,6,4);this.scene.add(key);const rim=new THREE.DirectionalLight(0xd1e2f5,1.2);rim.position.set(3,4,-4);this.scene.add(rim);
  this.floor=new THREE.GridHelper(28,56,0xa5b4c2,0xb8c5d1);this.floor.material.transparent=true;this.floor.material.opacity=.1;this.floor.position.y=-.025;this.scene.add(this.floor);
  this.highlightGroup=new THREE.Group();this.scene.add(this.highlightGroup);this.highlightMaterial=new THREE.MeshBasicMaterial({color:0x326aff,transparent:true,opacity:.28,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});this.selectionBox=new THREE.Box3Helper(new THREE.Box3(),0x326aff);this.selectionBox.visible=false;this.selectionBox.material.transparent=true;this.selectionBox.material.opacity=.7;this.scene.add(this.selectionBox);
  this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();
  const tap=createTapRecognizer(e=>{const r=canvas.getBoundingClientRect();this.pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);const hit=this.raycaster.intersectObjects(this.batches,false)[0];this.onSelect(hit?hit.object.userData.partIds[hit.batchId]:null)});
  for(const [event,handler] of [['pointerdown','down'],['pointermove','move'],['pointerup','up'],['pointercancel','cancel'],['lostpointercapture','cancel']])canvas.addEventListener(event,e=>tap[handler](e));
  canvas.addEventListener('dblclick',()=>{if(this.state.selected)this.focusPart(this.state.selected)});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();window.dispatchEvent(new CustomEvent('viewererror',{detail:t('图形连接中断，请重新加载页面。')}))});
  new ResizeObserver(()=>this.resize()).observe(canvas.parentElement);this.resize();
 }
 resize(){const {width,height}=this.canvas.parentElement.getBoundingClientRect();if(width<=0||height<=0)return;
  // Keep Retina detail while bounding the framebuffer cost on large displays.
  const pixelRatio=Math.min(window.devicePixelRatio||1,2,Math.sqrt(8000000/(width*height)));
  this.renderer.setPixelRatio(pixelRatio);this.renderer.setSize(width,height,false);this.camera.aspect=width/height;this.camera.updateProjectionMatrix();this.setInspectionFraming(this.inspectionPanel);if(this.ready)this.fit(undefined,false);this.invalidate()}
 setInspectionFraming(panel){
  this.inspectionPanel=panel;
  const rect=this.canvas.getBoundingClientRect(),{width,height}=rect;
  const mobile=matchMedia('(max-width:760px)').matches,visible=panel&&!panel.hidden;
  const bounds=selector=>{const el=this.canvas.parentElement.querySelector(selector);if(!el||!el.getClientRects().length)return null;const r=el.getBoundingClientRect();return {top:r.top-rect.top,bottom:r.bottom-rect.top};};
  const caption=bounds('.stage-caption'),toolbar=bounds('.stage-top'),console=bounds('.assembly-console');
  const left=mobile?14:22,right=visible&&!mobile?Math.min(panel.offsetWidth+46,width*.65):left;
  const top=Math.max(toolbar?.bottom||50,caption?.bottom||0)+16;
  const bottom=Math.max(console?height-console.top+16:120,visible&&mobile?height-panel.offsetTop+15:0);
  const key=`${width},${height},${left},${right},${top},${bottom}`;
  if(key===this.framingKey)return;this.framingKey=key;
  this.insets={left,right,top,bottom};this.usableWidth=Math.max(30,width-left-right);this.usableHeight=Math.max(30,height-top-bottom);
  this.camera.setViewOffset(width,height,(right-left)/2,(bottom-top)/2,width,height);
  this.invalidate();
 }

 invalidate(){this.dirty=true;if(!this.pendingFrame){this.pendingFrame=true;requestAnimationFrame(t=>this.frame(t))}}
 frame(now){this.pendingFrame=false;const dt=Math.min(1,(now-(this.lastTime||now-16))/1000);this.lastTime=now;let anim=false;
  if(Math.abs(this.amount-this.state.amount)>.0003){this.amount=THREE.MathUtils.damp(this.amount,this.state.amount,9,dt);if(Math.abs(this.amount-this.state.amount)<.0003)this.amount=this.state.amount;this.applyTransforms();anim=true;}
  if(this.cameraMotion){const a=this.cameraMotion;a.t=Math.min(1,(now-a.started)/380);const t=a.t*a.t*(3-2*a.t);this.camera.position.lerpVectors(a.from,a.to,t);this.controls.target.lerpVectors(a.oldTarget,a.target,t);this.controls.update();if(a.t>=1)this.cameraMotion=null;anim=true;}
  const moving=this.controls.update();if(this.dirty||moving||anim){this.renderer.render(this.scene,this.camera);this.onDraw?.();this.dirty=false;}if(anim||moving)this.invalidate();
 }
 async load(manifestURL,onProgress,annotationCatalog,assemblyCatalog){
  const response=await fetch(manifestURL);if(!response.ok)throw Error(t('无法载入零件目录，请重试。'));this.manifest=await response.json();localize(this.manifest);if(annotationCatalog)enrichParts(this.manifest.parts,annotationCatalog);this.plan=makeExplosionPlan(this.manifest.parts);this.assemblyIndex=createAssemblyIndex(this.manifest.parts,assemblyCatalog);this.motion=createAssemblyMotion(this.manifest.parts,this.assemblyIndex,this.plan);for(const p of this.manifest.parts)this.parts.set(p.id,{...p,entries:[],offset:[0,0,0]});
  const base=new URL(manifestURL,location.href),loader=new GLTFLoader();let done=0,total=this.manifest.assets.reduce((a,x)=>a+x.bytes,0);
  const ordered=[...this.manifest.assets].sort((a,b)=>['body','wheels','trim','interior','chassis','engine'].indexOf(a.system)-['body','wheels','trim','interior','chassis','engine'].indexOf(b.system));
  for(const asset of ordered){onProgress(done/total,asset.system);const result=await loader.loadAsync(new URL(asset.url,base).href,e=>onProgress((done+e.loaded)/total,asset.system));this.addAsset(result.scene);done+=asset.bytes;onProgress(done/total,asset.system);this.applyTransforms();this.fit('perspective',false);await new Promise(r=>requestAnimationFrame(r));}
  this.ready=true;this.fit('perspective',false);this.invalidate();return this.manifest;
 }
 addAsset(root){root.updateMatrixWorld(true);const groups=new Map();root.traverse(mesh=>{if(!mesh.isMesh)return;let node=mesh;while(node&&!this.parts.has(node.name))node=node.parent;if(!node)return;const part=this.parts.get(node.name);const material=mesh.material;if(Array.isArray(material))throw Error(t('不支持未分开的材质组'));if(material.transmission>0){material.transmission=0;material.opacity=.24;material.transparent=true;material.depthWrite=false;material.roughness=.12}material.side=THREE.DoubleSide;if(material.isMeshStandardMaterial){material.envMapIntensity=.8;material.roughness=Math.max(material.roughness,.025)}const geo=mesh.geometry;if(!geo.index){const ar=geo.attributes.position.count>65535?new Uint32Array(geo.attributes.position.count):new Uint16Array(geo.attributes.position.count);for(let i=0;i<ar.length;i++)ar[i]=i;geo.setIndex(new THREE.BufferAttribute(ar,1))}for(const key of Object.keys(geo.attributes)){if(!['position','normal'].includes(key))geo.deleteAttribute(key)}if(!geo.attributes.normal)geo.computeVertexNormals();const signature=material.uuid;if(!groups.has(signature))groups.set(signature,{material,items:[]});groups.get(signature).items.push({geometry:geo,base:mesh.matrixWorld.clone(),part});});
  for(const {material,items} of groups.values()){
   const vertices=items.reduce((s,e)=>s+e.geometry.attributes.position.count,0),indices=items.reduce((s,e)=>s+e.geometry.index.count,0);const batch=new THREE.BatchedMesh(items.length,vertices,indices,material);batch.frustumCulled=false;batch.perObjectFrustumCulled=true;batch.sortObjects=material.transparent;batch.userData.partIds=[];
   for(const item of items){const geometryId=batch.addGeometry(item.geometry),instanceId=batch.addInstance(geometryId);batch.setMatrixAt(instanceId,item.base);batch.userData.partIds[instanceId]=item.part.id;const entry={...item,batch,instanceId,matrix:item.base.clone()};item.part.entries.push(entry);this.entries.push(entry);}
   this.batches.push(batch);this.scene.add(batch);
  }
  this.invalidate();
 }
 isVisible(p){return p.entries.length>0&&inView(p,this.state,this.assemblyIndex)}
 update(state){const contextChanged=state.assembly!==this.state.assembly||state.explodeMode!==this.state.explodeMode||state.system!==this.state.system;if(contextChanged)this.amount=state.amount;Object.assign(this.state,state);this.applyTransforms();this.invalidate()}
 applyTransforms(){if(!this.plan)return;let count=0;for(const p of this.parts.values()){const offset=this.motion.offset(p.id,this.amount,this.state);p.offset=offset;const visible=this.isVisible(p);if(visible)count++;for(const e of p.entries){e.matrix.copy(e.base);e.matrix.elements[12]+=offset[0];e.matrix.elements[13]+=offset[1];e.matrix.elements[14]+=offset[2];e.batch.setMatrixAt(e.instanceId,e.matrix);e.batch.setVisibleAt(e.instanceId,visible);}}this.visibleCount=count;this.refreshHighlight();this.invalidate()}
 partBox(p,amount=this.amount){const offset=this.motion.offset(p.id,amount,this.state);return new THREE.Box3(v3(p.bounds.min).add(v3(offset)),v3(p.bounds.max).add(v3(offset)))}
 visibleBox(amount=this.state.amount){const box=new THREE.Box3();for(const p of this.parts.values())if(this.isVisible(p))box.union(this.partBox(p,amount));return box}
 fit(view,animate=true){const box=this.visibleBox();if(box.isEmpty())return;this.setInspectionFraming?.(this.inspectionPanel);const target=box.getCenter(new THREE.Vector3());const directions={perspective:new THREE.Vector3(-1,.58,.92).normalize(),side:new THREE.Vector3(0,.1,1).normalize(),top:new THREE.Vector3(0,1,.001).normalize()};const direction=directions[view]||this.cameraDirection();const boxes=this.parts?[...this.parts.values()].filter(p=>this.isVisible(p)).map(p=>{const b=this.partBox(p,this.state.amount);return {min:b.min.toArray(),max:b.max.toArray()}}):undefined;const distance=boxFitDistance(box.min.toArray(),box.max.toArray(),direction.toArray(),this.camera.fov,this.canvas.clientWidth,this.canvas.clientHeight,this.usableWidth,this.usableHeight,boxes);const pos=target.clone().addScaledVector(direction,distance);this.moveCamera(pos,target,animate)}
 cameraDirection(){const d=this.cameraMotion?this.cameraMotion.to.clone().sub(this.cameraMotion.target):this.camera.position.clone().sub(this.controls.target);return d.lengthSq()>1e-8?d.normalize():new THREE.Vector3(-1,.58,.92).normalize()}

 moveCamera(pos,target,animate=true){if(animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches)this.cameraMotion={from:this.camera.position.clone(),to:pos,oldTarget:this.controls.target.clone(),target,t:0,started:performance.now()};else{this.cameraMotion=null;this.camera.position.copy(pos);this.controls.target.copy(target);this.controls.update()}this.invalidate()}
 fittedDistance(radius){return inspectionDistance(radius,this.camera.fov,this.canvas.clientWidth,this.canvas.clientHeight,this.usableWidth,this.usableHeight)}
 focusPart(id){const p=this.parts.get(id);if(!p)return;this.beforeFocus?.();const box=this.partBox(p,this.state.amount),center=box.getCenter(new THREE.Vector3()),radius=Math.max(box.getSize(new THREE.Vector3()).length()/2,.012);const dir=this.cameraDirection();const distance=Math.max(this.controls.minDistance,boxFitDistance(box.min.toArray(),box.max.toArray(),dir.toArray(),this.camera.fov,this.canvas.clientWidth,this.canvas.clientHeight,this.usableWidth,this.usableHeight));this.moveCamera(center.clone().addScaledVector(dir,distance),center)}
 select(id){this.state.selected=id;this.highlightGroup.clear();const p=this.parts.get(id);if(p){for(const e of p.entries){const mesh=new THREE.Mesh(e.geometry,this.highlightMaterial);mesh.matrixAutoUpdate=false;mesh.userData.entry=e;this.highlightGroup.add(mesh)}}this.refreshHighlight();this.invalidate()}
 refreshHighlight(){const p=this.parts.get(this.state.selected);this.highlightGroup.visible=!!p&&this.isVisible(p);this.selectionBox.visible=!!p&&this.isVisible(p);if(!p)return;for(const m of this.highlightGroup.children)m.matrix.copy(m.userData.entry.matrix);this.selectionBox.box.copy(this.partBox(p));this.selectionBox.updateMatrixWorld(true)}
 projectPoint(point){const world=v3(point),local=world.clone().applyMatrix4(this.camera.matrixWorldInverse),projected=world.project(this.camera),rect=this.canvas.getBoundingClientRect();return {x:(projected.x+1)*rect.width/2,y:(1-projected.y)*rect.height/2,visible:local.z<0&&projected.z>=-1&&projected.z<=1&&Math.abs(projected.x)<.98&&Math.abs(projected.y)<.98};}
 projectPart(id){const p=this.parts.get(id);return p&&this.isVisible(p)?this.projectPoint(p.center.map((v,i)=>v+p.offset[i])):null;}
 projectAssembly(id){const group=this.assemblyIndex?.byId.get(id);if(!group)return null;const p=assemblyAnchor(group,this.parts,p=>this.isVisible(p));return p?this.projectPart(p.id):null}

 projectedModelRects(){const rects=[];for(const p of this.parts.values()){
  if(!this.isVisible(p))continue;const box=this.partBox(p),size=box.getSize(new THREE.Vector3());if(Math.max(size.x,size.y,size.z)<.045)continue;
  const points=[];for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])points.push(this.projectPoint([x,y,z]));
  const left=Math.min(...points.map(p=>p.x)),top=Math.min(...points.map(p=>p.y)),width=Math.max(...points.map(p=>p.x))-left,height=Math.max(...points.map(p=>p.y))-top;
  if(width>5&&height>5)rects.push({left:left-6,top:top-6,width:width+12,height:height+12});
 }return rects}


 settle(){this.amount=this.state.amount;this.applyTransforms();if(this.cameraMotion){this.camera.position.copy(this.cameraMotion.to);this.controls.target.copy(this.cameraMotion.target);this.cameraMotion=null;}this.controls.update();this.renderer.render(this.scene,this.camera);this.onDraw?.();}
 getDiagnostics(){return {ready:!!this.ready,cameraDirection:this.cameraDirection().toArray(),stageInsets:this.insets,parts:this.parts.size,loadedParts:[...this.parts.values()].filter(p=>p.entries.length).length,visible:this.visibleCount,amount:this.amount,targetAmount:this.state.amount,system:this.state.system,assembly:this.state.assembly,explodeMode:this.state.explodeMode,assemblies:this.assemblyIndex?.groups.length||0,selected:this.state.selected,isolated:this.state.isolated,batches:this.batches.length,pixelRatio:this.renderer.getPixelRatio(),framebuffer:[this.canvas.width,this.canvas.height],drawCalls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,finite:this.entries.every(e=>e.matrix.elements.every(Number.isFinite)),maxAssemblyError:this.amount===0?Math.max(0,...this.entries.map(e=>Math.max(...e.matrix.elements.map((v,i)=>Math.abs(v-e.base.elements[i]))))):null}}
}
