import {t} from './language.js';
export const KIND_LABELS={mechanical:'机械功能件',electrical:'电气件',structural:'结构件',fastener:'紧固件',seal:'密封件',finish:'表面与装饰细节',graphic:'文字与图形标识'};

export function enrichParts(parts,catalog){
 if(catalog.schemaVersion!==1||!catalog.entries||!catalog.sources)throw Error('零件说明文件格式不正确。');
 for(const p of parts){
  const info=catalog.entries[p.id];
  if(!info?.purpose||!info?.operation||!info?.name)throw Error(t(`零件 ${p.id} 的说明缺失。`));
  p.originalLabel=p.label;p.label=info.name;p.info=info;
  p.searchText=searchText(p);
 }
}

function searchText(p){return [p.id,p.label,p.originalLabel,p.sourceName,p.subsystem,p.assemblyLabel,p.info?.purpose,p.info?.operation,p.info?.family,KIND_LABELS[p.info?.kind]].filter(Boolean).join(' ').toLocaleLowerCase();}
export function matchesPart(p,query=''){
 const words=String(query).trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
 const text=p.searchText||searchText(p);
 return words.every(word=>text.includes(word));
}

export function locationLabel(p){
 const [x,,z]=p.center,[minX,,minZ]=p.bounds.min,[maxX,,maxZ]=p.bounds.max;
 const longitudinal=maxX-minX>2.8?t('纵向贯通'):x<-.6?t('车身前部'):x>.7?t('车身后部'):t('乘员舱附近');
 const lateral=maxZ-minZ>1.2?t('横向跨车身'):z>.16?t('左侧（驾驶员侧）'):z<-.16?t('右侧（乘客侧）'):t('中线附近');
 return `${longitudinal} · ${lateral}`;
}

// Label layout is independent of WebGL, so cramped screens and collisions can be verified directly.
export function layoutLabels(points,{width,height,top=76,bottom=195,left=18,right=18,exclude=[],maxCount=Infinity}){
 const result=[],maxX=width-right,maxY=height-bottom;
 for(const p of [...points].sort((a,b)=>Number(!!b.selected)-Number(!!a.selected))){
  if(result.length>=maxCount)break;
  if(p.width>maxX-left||p.height>maxY-top)continue;
  const candidates=[[p.x+24,p.y-p.height-20],[p.x-p.width-24,p.y-p.height-20],[p.x+24,p.y+20],[p.x-p.width-24,p.y+20],[p.x-p.width/2,p.y-p.height-65],[p.x-p.width/2,p.y+65],[p.x+65,p.y-p.height/2],[p.x-p.width-65,p.y-p.height/2]];
  if(exclude.length){const edge=[[left,p.y-p.height/2],[maxX-p.width,p.y-p.height/2],[p.x-p.width/2,top],[p.x-p.width/2,maxY-p.height]];candidates.unshift(...edge.sort((a,b)=>Math.hypot(a[0]+p.width/2-p.x,a[1]+p.height/2-p.y)-Math.hypot(b[0]+p.width/2-p.x,b[1]+p.height/2-p.y)));}
  for(const [cx,cy] of candidates){
   const x=Math.max(left,Math.min(maxX-p.width,cx)),y=Math.max(top,Math.min(maxY-p.height,cy));
   if(!p.selected&&Math.hypot(x+p.width/2-p.x,y+p.height/2-p.y)>(exclude.length?width:220))continue;
   if(exclude.some(r=>x<r.left+r.width&&x+p.width>r.left&&y<r.top+r.height&&y+p.height>r.top))continue;
   if(result.some(r=>x<r.left+r.width+8&&x+p.width+8>r.left&&y<r.top+r.height+8&&y+p.height+8>r.top))continue;
   result.push({...p,left:x,top:y});break;
  }
 }
 return result;
}
