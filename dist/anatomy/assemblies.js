import {makeExplosionPlan} from './explosion.js';

export function newViewState(){return {system:'all',assembly:null,explodeMode:'groups',amount:0,selected:null,isolated:null,hidden:new Set(),hiddenSystems:new Set(),hiddenAssemblies:new Set()};}

export function createAssemblyIndex(parts,catalog){
 if(catalog.schemaVersion!==1||!Array.isArray(catalog.groups))throw Error('总成目录格式不正确');
 const partMap=new Map(parts.map(p=>[p.id,p])),byPart=new Map(),byId=new Map(),groups=[];
 for(const data of catalog.groups){
  if(byId.has(data.id))throw Error(`重复总成 ${data.id}`);
  if(!data.partIds?.length||data.explodeVector?.length!==3||!data.explodeVector.every(Number.isFinite))throw Error(`无效总成 ${data.id}`);
  const group={...data,members:new Set(data.partIds),parts:[],bounds:{min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]}};
  for(const id of data.partIds){
   if(!partMap.has(id))throw Error(`无效零件 ${id}`);
   if(byPart.has(id))throw Error(`重复成员 ${id}`);
   const p=partMap.get(id);byPart.set(id,group);group.parts.push(p);
   for(let i=0;i<3;i++){group.bounds.min[i]=Math.min(group.bounds.min[i],p.bounds.min[i]);group.bounds.max[i]=Math.max(group.bounds.max[i],p.bounds.max[i]);}
  }
  if(!data.representativeIds?.every(id=>group.members.has(id)))throw Error(`无效代表部件 ${data.id}`);
  group.center=group.bounds.min.map((v,i)=>(v+group.bounds.max[i])/2);groups.push(group);byId.set(group.id,group);
 }
 if(byPart.size!==parts.length)throw Error('总成目录缺少零件');
 return {groups,byId,byPart,partMap};
}

export function createAssemblyMotion(parts,index,originalPlan=makeExplosionPlan(parts)){
 const localPlans=new Map(index.groups.map(g=>[g.id,makeExplosionPlan(g.parts.map(p=>({...p,system:'assembly'})))]));
 return {offset(id,amount,state){
  if(amount<=0)return [0,0,0];
  const group=index.byPart.get(id);if(!group)return [0,0,0];
  if(state.explodeMode==='groups'){
   const t=Math.max(0,Math.min(1,amount)),ease=t*t*(3-2*t);
   return group.explodeVector.map(v=>v*ease);
  }
  if(state.assembly)return localPlans.get(state.assembly)?.offset(id,amount,'assembly')||[0,0,0];
  return originalPlan.offset(id,amount,state.system);
 }};
}

export function inView(part,state,index){
 const group=index.byPart.get(part.id);
 return !!group&&!state.hidden.has(part.id)&&!state.hiddenSystems.has(part.system)&&!state.hiddenAssemblies.has(group.id)&&(!state.assembly||state.assembly===group.id)&&(!state.isolated||state.isolated===part.id)&&(state.system==='all'||state.system===part.system);
}

export function enterAssembly(state,id,index){
 const group=index.byId.get(id);if(!group)throw Error('Unknown assembly');
 state.system='all';state.assembly=id;state.explodeMode='parts';state.amount=0;state.selected=null;state.isolated=null;
 state.hiddenAssemblies.delete(id);
 for(const p of group.parts){state.hidden.delete(p.id);state.hiddenSystems.delete(p.system);}
 return group;
}

export function enterSystem(state,id,index){
 if(id!=='all'&&!index.groups.some(g=>g.parts.some(p=>p.system===id)))throw Error('Unknown system');
 state.system=id;state.assembly=null;state.explodeMode='parts';state.amount=0;state.selected=null;state.isolated=null;
 state.hiddenSystems.delete(id);
 for(const group of index.groups)if(id==='all'||group.parts.some(p=>p.system===id))state.hiddenAssemblies.delete(group.id);
}

export function revealPart(state,id,index){
 const group=index.byPart.get(id);if(!group)throw Error('Unknown part');
 if((state.assembly&&state.assembly!==group.id)||state.explodeMode==='groups')enterAssembly(state,group.id,index);
 const part=index.partMap.get(id);
 if(state.system!=='all'&&state.system!==part.system)state.system='all';
 state.isolated=null;state.hidden.delete(id);state.hiddenSystems.delete(part.system);state.hiddenAssemblies.delete(group.id);
 return part;
}

export function toggleVisibility(state,kind,id,index){
 const hidden=kind==='assemblies'?state.hiddenAssemblies:state.hiddenSystems;
 hidden.has(id)?hidden.delete(id):hidden.add(id);
 if(hidden.has(id)&&((kind==='assemblies'&&state.assembly===id)||(kind==='systems'&&state.system===id))){state.assembly=null;state.system='all';state.amount=0;}
 if(state.isolated&&!inView(index.partMap.get(state.isolated),state,index))state.isolated=null;
 if(state.selected&&!inView(index.partMap.get(state.selected),state,index))state.selected=null;
}

export function restoreView(state){
 if(state.isolated){state.isolated=null;return;}
 state.hidden.clear();state.hiddenSystems.clear();state.hiddenAssemblies.clear();
}

// Anchor labels on the mechanism itself, rather than the midpoint of distant
// controls, cables and the mechanism (which can land in an unrelated compartment).
export const ASSEMBLY_ANCHORS={steering:'p3779',brakes:'p0438',suspension:'p0494',transmission:'p0311',engine:'p1063',fuel:'p0497',exhaust:'p0309',electrical:'p0004',wheels:'p3591',seats:'p2481',cabin:'p0890',body:'p0864',lighting:'p2147'};
export function assemblyAnchor(group,partMap,isVisible){
 const ids=[ASSEMBLY_ANCHORS[group.id],...group.representativeIds,...group.partIds];
 return ids.map(id=>partMap.get(id)).find(p=>p&&group.members.has(p.id)&&isVisible(p));
}
