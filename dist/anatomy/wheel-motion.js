import {WHEEL_BINDINGS} from './wheel-bindings.js';

const smooth=value=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t)};
const axialDistance={tire:0,rim:.30,fastener:.50,cap:.72,spareMount:-.30,tool:0};

export function makeWheelMotion(parts){
 const members=new Map();
 for(const p of parts){
  const binding=WHEEL_BINDINGS.members[p.id];
  if(binding){const [unit,layer]=binding;members.set(p.id,{...WHEEL_BINDINGS.units[unit],layer});}
 }
 return {offset(id,amount){
  const p=members.get(id);if(!p)return null;
  if(amount<=0)return [0,0,0];
  const separate=smooth(amount/.55),unstack=smooth((amount-.25)/.75),axial=axialDistance[p.layer]*unstack;
  // Every surface belonging to a physical piece receives the identical translation.
  // Only axial separation changes between tire, rim, lug pattern and cap.
  return p.separation.map((v,i)=>v*separate+p.axis[i]*axial);
 }};
}
