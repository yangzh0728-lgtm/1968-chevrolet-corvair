import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Exercise real callout measurement and placement without loading WebGL assets.
const sandbox = {t:value=>value, ASSEMBLY_ANCHORS:{}, matchMedia:()=>({matches:false})};
const element = () => ({style:{},classList:{add(){}},setAttribute(){},append(){}});
sandbox.document={createElementNS:element};
vm.createContext(sandbox);
const source = path => fs.readFileSync(new URL(path,import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace(/export /g,'');
vm.runInContext(source('../dist/anatomy/part-info.js'),sandbox);
vm.runInContext(source('../dist/anatomy/labels.js')+'\nthis.PartLabels=PartLabels;',sandbox);
let width=900;
const viewer={canvas:{getBoundingClientRect:()=>({width,height:650})},insets:{top:100,bottom:140,left:20,right:20},projectedModelRects:()=>[],projectPart:()=>({x:350,y:260,visible:true})};
const labels=new sandbox.PartLabels(viewer,{append(){}},()=>{},()=>{});
labels.state={};
let measures=0;
const button=()=>({...element(),hidden:true,getBoundingClientRect(){assert.equal(this.hidden,false,'measure visible content');measures++;return {height:parseFloat(this.style.width)<180?104:72};}});
for(const id of ['long-english-label','second-label'])labels.nodes.set(id,{button:button(),line:element(),dot:element(),selected:false,isGroup:false});
function check(){
 const visible=[...labels.nodes.values()].filter(n=>!n.button.hidden);
 assert.equal(visible.length,2);
 const boxes=visible.map(n=>{const [x,y]=n.button.style.transform.match(/-?\d+(?:\.\d+)?/g).map(Number);return {x,y,w:parseFloat(n.button.style.width),h:n.measuredHeight};});
 for(const box of boxes){assert.ok(box.y>=100);assert.ok(box.y+box.h<=510);assert.ok(box.x>=20&&box.x+box.w<=width-20);}
 assert.ok(boxes[0].x+boxes[0].w<=boxes[1].x||boxes[1].x+boxes[1].w<=boxes[0].x||boxes[0].y+boxes[0].h<=boxes[1].y||boxes[1].y+boxes[1].h<=boxes[0].y,'full text boxes must not overlap');
 return boxes;
}
labels.draw();assert.ok(check().every(b=>b.h===72));
labels.draw();assert.equal(measures,2,'reuse measurements while rotating');
sandbox.matchMedia=()=>({matches:true});width=390;
labels.draw();assert.ok(check().every(b=>b.h===104&&b.w===166));
assert.equal(measures,4,'remeasure when responsive width changes');
console.log('PASS: measured text heights, non-overlapping bounds, mobile reflow, and cached measurements.');
