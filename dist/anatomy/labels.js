import {t} from './language.js';
import {ASSEMBLY_ANCHORS} from './assemblies.js';
import {layoutLabels,KIND_LABELS} from './part-info.js?v=language-1';

const LANDMARKS={
 all:['p0864','p0935','p0887','p0165','p2141','p3591','p3593'],
 body:['p0864','p0935','p0001','p0165','p0046','p3565','p0167'],
 trim:['p0887','p2141','p3675','p3689','p3711','p3682'],
 interior:['p3779','p0890','p3221','p3622','p3186','p2840','p2495'],
 engine:['p1063','p1406','p1876','p2059','p1842','p1893','p0004','p1070'],
 chassis:['p0497','p0494','p0437','p0730','p0404','p0798','p0849','p0614'],
 wheels:['p3591','p3592','p3593','p3594','p0047']
};

export class PartLabels{
 constructor(viewer,container,onSelect,onAssembly){
  this.viewer=viewer;this.container=container;this.onSelect=onSelect;this.onAssembly=onAssembly;this.enabled=true;this.nodes=new Map();
  this.svg=document.createElementNS('http://www.w3.org/2000/svg','svg');this.svg.classList.add('annotation-lines');this.svg.setAttribute('aria-hidden','true');container.append(this.svg);
  // Web fonts can change wrapping after the first model frame.
  document.fonts?.ready.then(()=>{for(const node of this.nodes.values())node.measuredWidth=null;this.viewer.invalidate()});
 }
 update(state){
  this.state=state;
  const groupView=state.explodeMode==='groups'&&!state.assembly;
  const group=this.viewer.assemblyIndex.byId.get(state.assembly);
  const overview=['body','engine','wheels','cabin','steering','brakes','suspension','transmission','fuel','exhaust','electrical','seats','lighting'];
  const ids=[...new Set([state.selected,...(state.isolated||state.selected?[]:groupView?overview.map(id=>'g:'+id):group?[ASSEMBLY_ANCHORS[group.id],...group.representativeIds]:LANDMARKS[state.system]||[])].filter(Boolean))];
  const key=ids.join(',')+':'+state.selected;
  if(key!==this.key){
   this.key=key;for(const n of this.nodes.values()){n.button.remove();n.line.remove();n.dot.remove()}this.nodes.clear();
   for(const id of ids){
    const isGroup=id.startsWith('g:'),item=isGroup?this.viewer.assemblyIndex.byId.get(id.slice(2)):this.viewer.parts.get(id);if(!item)continue;
    const selected=id===state.selected,button=document.createElement('button');button.className='part-annotation'+(selected?' is-selected':'');button.setAttribute('aria-label',isGroup?t(`查看${item.label}的组成`):t(`查看${item.label}的用途`));button.title=item.info?.purpose||item.description||item.label;
    const name=document.createElement('strong');name.textContent=item.label;
    const sub=document.createElement('span');sub.textContent=isGroup?t(`${item.partIds.length} 个部件 · 点击进入总成`):t(`${item.id.toUpperCase()} · ${selected?'当前选中':KIND_LABELS[item.info?.kind]||'查看用途'}`);button.append(sub,name);button.onclick=()=>isGroup?this.onAssembly(item.id):this.onSelect(id);this.container.append(button);
    const line=document.createElementNS(this.svg.namespaceURI,'path'),dot=document.createElementNS(this.svg.namespaceURI,'circle');line.classList.toggle('selected',selected);dot.classList.toggle('selected',selected);dot.setAttribute('r',selected?'3.5':'2.5');this.svg.append(line,dot);this.nodes.set(id,{button,line,dot,selected,isGroup});
   }
  }
  this.draw();
 }
 setEnabled(enabled){this.enabled=enabled;this.container.hidden=!enabled;this.draw()}
 draw(){
  if(!this.enabled||!this.state)return;
  const {width,height}=this.viewer.canvas.getBoundingClientRect(),mobile=matchMedia('(max-width:760px)').matches;
  const inset=this.viewer.insets||{top:110,bottom:135,left:20,right:20};
  const model=this.viewer.projectedModelRects();
  const points=[];
  for(const [id,node] of this.nodes){
   node.button.hidden=true;node.line.style.display='none';node.dot.style.display='none';
   const p=node.isGroup?this.viewer.projectAssembly(id.slice(2)):this.viewer.projectPart(id);if(!p||!p.visible)continue;
   if(mobile&&!node.selected&&points.length>=3)continue;
   const labelWidth=Math.min(mobile?166:196,width-inset.left-inset.right);
   if(labelWidth<=0)continue;
   if(node.measuredWidth!==labelWidth){
    node.button.style.width=`${labelWidth}px`;node.button.hidden=false;
    node.measuredHeight=Math.ceil(node.button.getBoundingClientRect().height);
    node.measuredWidth=labelWidth;node.button.hidden=true;
   }
   points.push({id,x:p.x,y:p.y,width:labelWidth,height:node.measuredHeight,selected:node.selected});
  }
  const placed=layoutLabels(points,{width,height,top:inset.top,bottom:inset.bottom,left:inset.left,right:inset.right,exclude:model,maxCount:mobile?2:4});
  this.svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
  for(const p of placed){
   const n=this.nodes.get(p.id);n.button.hidden=false;n.button.style.width=`${p.width}px`;n.button.style.transform=`translate(${p.left}px,${p.top}px)`;
   const toX=p.x<p.left?p.left:p.x>p.left+p.width?p.left+p.width:Math.max(p.left+10,Math.min(p.left+p.width-10,p.x));
   const toY=p.y<p.top?p.top:p.y>p.top+p.height?p.top+p.height:p.top+p.height/2;
   n.line.setAttribute('d',`M${p.x},${p.y} L${toX},${toY}`);n.dot.setAttribute('cx',String(p.x));n.dot.setAttribute('cy',String(p.y));n.line.style.display='';n.dot.style.display='';
  }
 }
}
