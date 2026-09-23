// Regression coverage for pointer state changes, scroll hit-testing and motion opt-outs.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const file = new URL('../dist/pointer-trail.js', import.meta.url);
const source = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';

function fixture({fine = true, reduced = false} = {}) {
  const frames = new Map(), timers = new Map(), observers = [];
  let id = 0, now = 0, hit;
  class Element {
    constructor(kind = 'plain') {
      this.kind = kind; this.events = {}; this.children = []; this.dataset = {};
      this.style = {setProperty(k, v) {this[k] = v;}};
      this.attrs = {}; this.hidden = false;
      const classes = new Set();
      this.classList = {contains: n => classes.has(n), add: n => classes.add(n), remove: n => classes.delete(n)};
    }
    addEventListener(type, fn) {(this.events[type] ||= []).push(fn);}
    fire(type, event = {}) {for (const fn of this.events[type] || []) fn(event);}
    append(...children) {this.children.push(...children);}
    setAttribute(k, v) {this.attrs[k] = v;}
    matches(selector) {return selector.includes(':disabled') && this.kind === 'disabled';}
    closest(selector) {
      if (selector.includes('input') && this.kind === 'input') return this;
      if (selector.includes('canvas') && this.kind === 'canvas') return this;
      if (selector.includes('button') && ['button', 'disabled'].includes(this.kind)) return this;
      return null;
    }
  }
  const document = new Element(), body = new Element();
  document.body = body; document.documentElement = new Element(); document.hidden = false;
  document.createElement = () => new Element();
  document.elementFromPoint = () => hit;
  const media = {fine: new Element(), reduced: new Element()};
  media.fine.matches = fine; media.reduced.matches = reduced;
  const window = new Element(); window.scrollY = 0;
  vm.runInNewContext(source, {
    document, window, Element, innerWidth: 1280, innerHeight: 800,
    matchMedia: q => q.includes('reduced-motion') ? media.reduced : media.fine,
    performance: {now: () => now},
    addEventListener: window.addEventListener.bind(window),
    requestAnimationFrame: fn => {frames.set(++id, fn); return id;},
    cancelAnimationFrame: key => frames.delete(key),
    setTimeout: (fn, delay) => {timers.set(++id, {fn, at: now + delay}); return id;},
    clearTimeout: key => timers.delete(key),
    MutationObserver: class {constructor(fn) {observers.push(fn);} observe() {}},
  });
  const plain = new Element(), button = new Element('button'), input = new Element('input'), disabled = new Element('disabled'), canvas = new Element('canvas');
  hit = plain;
  return {
    body, document, window, media, frames, plain, button, input, disabled, canvas,
    get trail() {return body.children[0];},
    move(target = plain, x = 100, y = 100, pointerType = 'mouse') {
      hit = target; document.fire('pointermove', {target, clientX: x, clientY: y, pointerType});
    },
    scroll(target = plain) {hit = target; window.scrollY += 120; window.fire('scroll');},
    advance(milliseconds = 1000) {
      for (let step = 0; step < milliseconds; step += 16) {
        now += 16;
        for (const [key, item] of [...timers]) if (item.at <= now) {timers.delete(key); item.fn();}
        const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(fn => fn(now));
      }
    },
    pause(value) {body.classList[value ? 'add' : 'remove']('motion-paused'); observers.forEach(fn => fn());},
  };
}

const f = fixture();
assert.ok(f.trail, 'create the decorative pointer follower');
assert.equal(f.trail.attrs['aria-hidden'], 'true');
assert.equal(f.trail.hidden, true, 'no stray follower before the first mouse event');
f.move(); f.advance();
assert.equal(f.trail.hidden, false);
assert.equal(f.trail.dataset.mode, 'move');
assert.equal(f.frames.size, 0, 'stop scheduling frames when the pointer settles');
f.move(f.button, 220, 180); f.advance();
assert.equal(f.trail.dataset.mode, 'action', 'clickable items have a distinct animation state');
f.scroll(f.plain); f.advance(32);
assert.equal(f.trail.dataset.mode, 'scroll', 'scrolling temporarily overrides button hover');
f.advance();
assert.equal(f.trail.dataset.mode, 'move', 'recheck content below a stationary mouse after scrolling');
f.scroll(f.button); f.advance();
assert.equal(f.trail.dataset.mode, 'action', 'restore action feedback when a button scrolls under the pointer');
f.move(f.disabled); f.advance();
assert.notEqual(f.trail.dataset.mode, 'action', 'disabled buttons are not presented as clickable');
f.move(f.input); f.advance();
assert.equal(f.trail.hidden, true, 'leave form input cursors unobstructed');
f.move(f.canvas); f.advance();
assert.equal(f.trail.hidden, false, 'keep tracking over the homepage car comparison');
f.move(); f.pause(true); f.advance();
assert.equal(f.trail.hidden, true); assert.equal(f.frames.size, 0);
f.pause(false); assert.equal(f.trail.hidden, true, 'wait for fresh mouse input after resuming');
f.move(); f.advance(); assert.equal(f.trail.hidden, false);
f.document.fire('keydown', {key: 'Tab'}); f.advance();
assert.equal(f.trail.hidden, true, 'keyboard navigation removes decorative tracking');
f.move(); f.media.reduced.matches = true; f.media.reduced.fire('change'); f.advance();
assert.equal(f.trail.hidden, true); assert.equal(f.frames.size, 0);
const touch = fixture({fine: false}); touch.move(touch.button, 100, 100, 'touch'); touch.advance();
assert.equal(touch.trail.hidden, true); assert.equal(touch.frames.size, 0);
const r = fixture({reduced: true}); r.move(); r.advance(); assert.equal(r.trail.hidden, true);
console.log('PASS: pointer/action/scroll states, scroll hit-testing, disabled controls, idle frames, touch, forms, keyboard, pause and reduced motion.');
