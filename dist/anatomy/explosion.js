import {makeWheelMotion} from './wheel-motion.js';
import {MECHANICAL_UNITS} from './mechanical-bindings.js';
import {makeBodyMotion} from './body-motion.js';
export const SYSTEMS=[
 {id:'all',label:'完整汽车',short:'整车',code:'00',color:'#a6bcd1',description:'拖动旋转 · 滚轮缩放 · 点击查看零件'},
 {id:'body',label:'车身与玻璃',short:'车身',code:'01',color:'#78aedd',description:'车壳、车顶、玻璃与舱盖'},
 {id:'trim',label:'灯具与饰件',short:'灯具与饰件',code:'02',color:'#cad5df',description:'四圆灯、保险杠、镀铬饰条与徽章'},
 {id:'interior',label:'座舱与内饰',short:'内饰',code:'03',color:'#bd91cb',description:'仪表、方向盘、座椅与车内饰件'},
 {id:'engine',label:'后置六缸发动机',short:'发动机',code:'04',color:'#efb873',description:'Turbo-Air 164 · 冷却、进气、曲轴与气门机构'},
 {id:'chassis',label:'底盘与传动',short:'底盘',code:'05',color:'#8ebda8',description:'变速箱、悬挂、制动与燃油系统'},
 {id:'wheels',label:'车轮与轮胎',short:'车轮',code:'06',color:'#91a7c2',description:'四轮总成、轮毂、轮盖与胎面'}
];
const length=v=>Math.hypot(...v);
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const mul=(v,k)=>v.map(x=>x*k);
const add=(a,b)=>a.map((v,i)=>v+b[i]);
const mean=pts=>pts.reduce((a,v)=>add(a,v),[0,0,0]).map(v=>v/pts.length);
const sign=v=>v<0?-1:1;
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
export function makeExplosionPlan(parts){
 const wheelMotion=makeWheelMotion(parts);
 const bodyMotion=makeBodyMotion(parts);
 const owners=new Map(),motionParts=[...parts],present=new Set(parts.map(p=>p.id));
 for(const unit of MECHANICAL_UNITS){
  const member=parts.find(p=>unit.partIds.includes(p.id));if(!member)continue;
  for(const id of unit.partIds)if(present.has(id))owners.set(id,unit.anchor.id);
  if(!present.has(unit.anchor.id)){motionParts.push({...unit.anchor,system:member.system});present.add(unit.anchor.id);}
 }
 const sys=new Map(),groups=new Map();
 for(const p of motionParts){if(!sys.has(p.system))sys.set(p.system,[]);sys.get(p.system).push(p.center);const key=p.system+':'+p.assemblyGroup;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p.center)}
 const sc=new Map([...sys].map(([k,v])=>[k,mean(v)])),gc=new Map([...groups].map(([k,v])=>[k,mean(v)]));
 const plan=new Map();
 for(const p of motionParts){const c=p.center,s=sc.get(p.system),g=gc.get(p.system+':'+p.assemblyGroup);const number=Number(p.id.replace(/\D/g,''))||1;let global=[0,0,0];
  if(p.system==='body')global=[c[0]*.12,c[1]>.95?2.2:1.35,Math.abs(c[2])>.4?sign(c[2])*.45:0];
  if(p.system==='interior')global=[c[0]*.15,1.0,1.45];
  if(p.system==='engine')global=[2.35,.55,-.45];
  if(p.system==='chassis')global=[c[0]*.12,-.16,-.95];
  if(p.system==='wheels')global=[sign(c[0])*.3,.03,sign(c[2])*1.48];
  if(p.system==='trim'){const n=p.sourceName.toLowerCase();if(/wind|roof|pillar|ventpane|headliner/.test(n))global=[c[0]*.12,2.2,c[2]*.45];else if(Math.abs(c[0])>1.75)global=[sign(c[0])*.72,.18,sign(c[2])*.18];else global=[c[0]*.1,1.05,sign(c[2])*.72]}
  let direction=sub(g,s);if(length(direction)<.025)direction=[Math.cos(number*2.399),.45,Math.sin(number*2.399)];direction=mul(direction,1/length(direction));
  const cluster=add(mul(sub(g,s),1.05),mul(direction,.28));
  const detail=add(mul(sub(c,g),1.25),[Math.cos(number*2.399)*.025,Math.sin(number*1.73)*.025,Math.sin(number*2.399)*.025]);
  if(p.cutawayCover)cluster[1]+=.5;
  plan.set(p.id,{global,cluster,detail});
 }
 return {offset(id,amount,system='all'){if(amount<=0)return [0,0,0];const wheelOffset=wheelMotion.offset(id,amount);if(wheelOffset)return wheelOffset;const bodyOffset=bodyMotion.offset(id,amount);if(bodyOffset)return bodyOffset;const v=plan.get(owners.get(id)||id);if(!v)return [0,0,0];const major=smooth(amount/.64),minor=smooth((amount-.35)/.65);return system==='all'?add(mul(v.global,major),mul(add(mul(v.cluster,.45),v.detail),minor*.48)):add(mul(v.cluster,major*1.25),mul(v.detail,minor*1.8));}};
}
