// Exercise the no-WebGL fallback, loading failure, motion preferences and controls.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../dist/hero-reveal.js', import.meta.url), 'utf8');
async function fixture({reduced = false, failedImage = false} = {}) {
  const callbacks = new Map(); let time = 100, nextFrame = 0, mutation;
  function element() {
    const classes = new Set();
    return {hidden:true,value:'50',textContent:'',width:0,height:0,events:{},attrs:{},styles:{},
      classList:{add(...names){names.forEach(n=>classes.add(n));},remove(n){classes.delete(n);},contains(n){return classes.has(n);}},
      addEventListener(name,fn){this.events[name]=fn;},setAttribute(name,value){this.attrs[name]=value;},
      getBoundingClientRect(){return {left:0,top:0,width:800,height:400};},setPointerCapture(){},
      decode(){return failedImage?Promise.reject(Error('offline')):Promise.resolve();},getContext(){return null;},
      fire(name,event={}){this.events[name]?.(event);}};
  }
  const selectors=['.reveal-stage','canvas','.reveal-exterior','.reveal-as-purchased','input','.reveal-replay','.reveal-status','.reveal-controls'];
  const elements=Object.fromEntries(selectors.map(s=>[s,element()])); const root=element(), body=element();
  root.querySelector=s=>elements[s]; root.style={setProperty(k,v){root.styles[k]=v;}};
  const doc={querySelector:()=>root,body,hidden:false,addEventListener(){}};
  vm.runInNewContext(source, {document:doc,matchMedia:q=>({matches:q.includes('reduced-motion')?reduced:true,addEventListener(){}}),
    performance:{now:()=>time},devicePixelRatio:1,
    requestAnimationFrame:fn=>{const id=++nextFrame;callbacks.set(id,fn);return id;},cancelAnimationFrame:id=>callbacks.delete(id),
    MutationObserver:class{constructor(fn){mutation=fn;}observe(){}},IntersectionObserver:class{observe(){}},ResizeObserver:class{observe(){}},
  });
  await new Promise(resolve=>setImmediate(resolve));
  function advance(frames=1){for(let i=0;i<frames;i++){time+=16;const current=[...callbacks.values()];callbacks.clear();current.forEach(fn=>fn(time));}}
  return {elements,root,body,advance,pause(){body.classList.add('motion-paused');mutation();}};
}
const f=await fixture();
assert.equal(f.elements['.reveal-controls'].hidden,false);
assert.equal(f.root.classList.contains('reveal-webgl'),false);
assert.equal(f.root.classList.contains('reveal-ready'),true);
f.advance(350);assert.equal(f.elements.input.value,'50','intro settles halfway');
f.elements.input.value='100';f.elements.input.fire('input');f.advance(80);assert.equal(f.root.styles['--reveal'],'100%');
assert.equal(f.elements.input.attrs['aria-valuetext'],'100% as-purchased view');
f.elements.input.value='0';f.elements.input.fire('input');f.advance(80);assert.equal(f.root.styles['--reveal'],'0%');
const stage=f.elements['.reveal-stage'];
stage.fire('pointermove',{pointerType:'mouse',clientX:0,clientY:200});f.advance(100);
assert.equal(f.root.styles['--reveal'],'100%','moving the mouse left reveals the old red car');
stage.fire('pointermove',{pointerType:'mouse',clientX:800,clientY:200});f.advance(100);
assert.equal(f.root.styles['--reveal'],'0%','moving the mouse right reveals the blue restoration vision');
stage.fire('pointermove',{pointerType:'touch',clientX:0,clientY:200});f.advance(100);
assert.equal(f.root.styles['--reveal'],'0%','touch scrolling without a drag does not move the comparison');
stage.fire('pointerdown',{pointerType:'touch',pointerId:1,clientX:400,clientY:200});
stage.fire('pointermove',{pointerType:'touch',clientX:0,clientY:200});f.advance(100);
assert.equal(f.root.styles['--reveal'],'100%','dragging on touch reveals the old red car');
stage.fire('pointerup');
f.elements['.reveal-replay'].fire('click');f.advance(60);f.elements['.reveal-replay'].fire('click');f.advance(100);
const frozen=f.root.styles['--reveal'];f.advance(100);assert.equal(f.root.styles['--reveal'],frozen,'pause holds its position');
f.pause();assert.equal(f.elements['.reveal-replay'].textContent,'Switch view');
f.elements['.reveal-replay'].fire('click');f.advance();assert.equal(f.elements['.reveal-replay'].textContent,'Switch view');
const reduced=await fixture({reduced:true});reduced.advance(300);assert.equal(reduced.elements['.reveal-replay'].textContent,'Switch view');assert.equal(reduced.elements.input.value,'50','reduced motion skips intro');
reduced.elements.input.value='100';reduced.elements.input.fire('input');reduced.advance();assert.equal(reduced.root.styles['--reveal'],'100%','reduced motion responds immediately');
const offline=await fixture({failedImage:true});assert.equal(offline.elements['.reveal-controls'].hidden,true);assert.match(offline.elements['.reveal-status'].textContent,/unavailable/);
console.log('PASS: old/new mouse and touch comparison, accessible values, fallback, intro, keyboard-input endpoints, pause, reduced motion and image-load failure.');
