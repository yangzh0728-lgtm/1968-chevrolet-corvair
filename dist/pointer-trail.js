// A soft, tapered wake with orbital hover feedback. Native hit targets stay intact.
const fine = matchMedia('(hover: hover) and (pointer: fine)');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const trail = document.createElement('div');
trail.className = 'pointer-trail';
trail.hidden = true;
trail.setAttribute('aria-hidden', 'true');
const shape = document.createElement('span');
shape.className = 'pointer-head';
const core = document.createElement('span');
core.className = 'pointer-core';
const orbit = document.createElement('span');
orbit.className = 'pointer-orbit';
const impact = document.createElement('span');
impact.className = 'pointer-impact';
const wake = document.createElement('span');
wake.className = 'pointer-wake';
const particles = Array.from({length: 12}, (_, index) => {
  const element = document.createElement('span');
  element.className = 'pointer-streak';
  element.style.height = `${8 * (1 - index / 12)}px`;
  wake.append(element);
  return {element, x: 0, y: 0};
});
shape.append(orbit, core, impact);
trail.append(wake, shape);
document.body.append(trail);

const actions = 'a[href],button,summary,[role="button"],[role="tab"],[role="link"]';
const native = 'input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"],iframe,video[controls],audio[controls],[data-cursor="native"]';
let hasPointer = false, scrolling = false, frame = 0, scrollTimer = 0, lastTime = 0;
let energy = 0, burst = false;
let x = 0, y = 0, targetX = 0, targetY = 0, previousScroll = window.scrollY;
const enabled = () => fine.matches && !reduced.matches && !document.hidden && !document.body.classList.contains('motion-paused');

function hide() {
  trail.hidden = true;
  hasPointer = false;
  scrolling = false;
  delete trail.dataset.pressed;
  cancelAnimationFrame(frame);
  clearTimeout(scrollTimer);
  frame = 0; scrollTimer = 0; lastTime = 0;
  energy = 0;
}

function updateTarget(target) {
  if (!(target instanceof Element) || target.closest(native)) {
    trail.hidden = true;
    return;
  }
  const action = target.closest(actions);
  trail.dataset.mode = scrolling ? 'scroll' : action && !action.matches(':disabled,[aria-disabled="true"]') ? 'action' : 'move';
  trail.hidden = false;
}

function draw(now) {
  frame = 0;
  if (!enabled() || trail.hidden) return;
  const dt = lastTime ? Math.min(50, now - lastTime) : 16.67;
  lastTime = now;
  const easing = 1 - Math.exp(-dt / 38);
  x += (targetX - x) * easing;
  y += (targetY - y) * easing;
  let remaining = Math.hypot(targetX - x, targetY - y);
  if (remaining < .15) { x = targetX; y = targetY; }
  energy = scrolling ? Math.max(.8, energy) : energy * Math.exp(-dt / 210);
  let aheadX = x, aheadY = y;
  const follow = 1 - Math.exp(-dt / 28);
  const drift = scrolling ? (trail.dataset.direction === 'up' ? 4 : -4) : 0;
  // Each link follows the one ahead, making a curved ribbon instead of a rigid shape.
  for (const [index, particle] of particles.entries()) {
    particle.x += (aheadX - particle.x) * follow;
    particle.y += (aheadY + drift - particle.y) * follow;
    const dx = aheadX - particle.x, dy = aheadY - particle.y;
    const distance = Math.hypot(dx, dy);
    remaining = Math.max(remaining, distance);
    particle.element.style.width = `${Math.max(1, distance + 3).toFixed(2)}px`;
    particle.element.style.transform = `translate3d(${(particle.x - x).toFixed(2)}px,${(particle.y - y).toFixed(2)}px,0) rotate(${Math.atan2(dy, dx)}rad)`;
    particle.element.style.opacity = (energy * (1 - index / particles.length) * .9).toFixed(3);
    aheadX = particle.x; aheadY = particle.y;
  }
  trail.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)`;
  if (remaining > .15 || energy > .01 || scrolling) frame = requestAnimationFrame(draw);
  else lastTime = 0;
}

function schedule() {
  if (!frame && enabled() && !trail.hidden) frame = requestAnimationFrame(draw);
}

function track(event) {
  if (event.pointerType !== 'mouse' || !enabled()) { hide(); return; }
  energy = Math.max(energy, Math.min(1, Math.hypot(event.clientX - targetX, event.clientY - targetY) / 16));
  targetX = event.clientX; targetY = event.clientY;
  if (targetX < 0 || targetY < 0 || targetX >= innerWidth || targetY >= innerHeight) { hide(); return; }
  // On entry, start at the mouse instead of flying across the page from (0,0).
  if (!hasPointer || trail.hidden) {
    x = targetX; y = targetY;
    energy = 0;
    for (const particle of particles) { particle.x = x; particle.y = y; particle.element.style.opacity = '0'; }
    trail.style.transform = `translate3d(${x}px,${y}px,0)`;
  }
  hasPointer = true;
  updateTarget(event.target);
  schedule();
}

document.addEventListener('pointermove', track, {passive: true});
document.addEventListener('pointerover', track, {passive: true});
document.addEventListener('pointerdown', event => {
  if (event.pointerType !== 'mouse') { hide(); return; }
  if (enabled() && !trail.hidden && event.button === 0) {
    trail.dataset.pressed = 'true';
    // Alternating names restart a finite ripple even on rapid repeated clicks.
    burst = !burst;
    trail.dataset.burst = burst ? 'a' : 'b';
  }
}, {passive: true});
document.addEventListener('pointerup', () => { delete trail.dataset.pressed; }, {passive: true});
document.addEventListener('pointercancel', hide, {passive: true});
document.documentElement.addEventListener('pointerleave', hide, {passive: true});
document.addEventListener('keydown', hide);
document.addEventListener('visibilitychange', hide);
addEventListener('blur', hide);
addEventListener('pagehide', hide);
addEventListener('resize', hide, {passive: true});

addEventListener('scroll', () => {
  const direction = window.scrollY < previousScroll ? 'up' : 'down';
  previousScroll = window.scrollY;
  if (!enabled() || !hasPointer) return;
  scrolling = true;
  delete trail.dataset.pressed;
  trail.dataset.direction = direction;
  updateTarget(document.elementFromPoint(targetX, targetY));
  schedule();
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => {
    scrolling = false; scrollTimer = 0;
    if (!enabled() || !hasPointer) return;
    // Content moves beneath a stationary mouse, so the former hover may be stale.
    updateTarget(document.elementFromPoint(targetX, targetY));
    schedule();
  }, 180);
}, {passive: true});

fine.addEventListener('change', hide);
reduced.addEventListener('change', hide);
new MutationObserver(() => { if (!enabled()) hide(); }).observe(document.body, {attributes: true, attributeFilter: ['class']});
