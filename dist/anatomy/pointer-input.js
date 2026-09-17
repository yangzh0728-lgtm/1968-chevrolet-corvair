// A camera gesture must never become a component selection on pointer-up.
export function createTapRecognizer(onTap){
 const active=new Set();let candidate=null;
 return {
  down(e){active.add(e.pointerId);candidate=active.size===1&&e.isPrimary&&e.button===0?{id:e.pointerId,x:e.clientX,y:e.clientY,time:e.timeStamp}:null;},
  move(e){if(candidate?.id===e.pointerId&&Math.hypot(e.clientX-candidate.x,e.clientY-candidate.y)>=5)candidate=null;},
  cancel(e){active.delete(e.pointerId);candidate=null;},
  up(e){const p=candidate;active.delete(e.pointerId);candidate=null;if(p&&p.id===e.pointerId&&e.button===0&&active.size===0&&e.timeStamp-p.time<500&&Math.hypot(e.clientX-p.x,e.clientY-p.y)<5)onTap(e);}
 };
}
