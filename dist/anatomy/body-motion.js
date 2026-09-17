import {BODY_UNITS} from './body-bindings.js';

const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};

export function makeBodyMotion(parts){
 const included=new Set(parts.map(p=>p.id)),byPart=new Map();
 for(const unit of BODY_UNITS)for(const id of unit.partIds){
  if(included.has(id))byPart.set(id,unit);
 }
 return {offset(id,amount){
  const unit=byPart.get(id);if(!unit)return null;
  if(amount<=0)return [0,0,0];
  const separate=smooth(amount/.7),unpack=smooth((amount-.5)/.5);
  return unit.carrier.map((v,i)=>v*separate+unit.release[i]*unpack);
 }};
}
