// React Bits Depth Text, adapted for this static website's header.
// Copyright (c) 2026 David Haz. License: vendor/REACT-BITS-LICENSE.txt
// https://www.reactbits.dev/c/text-animations/depth-text
// Keep the real home link and text usable before this enhancement loads.
const root = document.querySelector('.depth-brand');
if (root) {
  const stage = root.querySelector('.depth-brand-stage');
  const face = root.querySelector('.depth-brand-face');
  const header = root.closest('.site-header');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const base = {x: -2.4, y: 3.15};
  const current = {...base}, target = {...base};
  const layers = 24;
  for (let index = layers; index > 0; index--) {
    const layer = document.createElement('span');
    layer.className = 'depth-brand-layer';
    layer.setAttribute('aria-hidden', 'true');
    layer.textContent = face.textContent;
    layer.style.setProperty('--layer', index);
    layer.style.setProperty('--face-mix', `${Math.round((1 - (index / layers) ** 2) * 72 + 4)}%`);
    stage.insertBefore(layer, face);
  }
  let frame = 0, visible = false, tracking = false, lastTime = 0, elapsed = 0;
  const allowed = () => !reduced.matches && !document.body.classList.contains('motion-paused');
  const active = () => allowed() && visible && !document.hidden;
  const apply = () => { stage.style.transform = `rotateX(${current.x.toFixed(3)}deg) rotateY(${current.y.toFixed(3)}deg)`; };
  function start() {
    if (!frame && active()) {
      root.setAttribute('data-running', '');
      frame = requestAnimationFrame(tick);
    }
  }
  function tick(now) {
    frame = 0;
    if (!active()) return;
    const delta = lastTime ? Math.min(50, now - lastTime) : 16.67;
    lastTime = now; elapsed += delta / 1000;
    if (!tracking) {
      const orbit = elapsed * .16 * Math.PI * 2;
      target.x = base.x + Math.sin(orbit) * 1.5;
      target.y = base.y + Math.cos(orbit * .85) * 2;
    }
    const smoothing = 1 - .86 ** (delta / 16.67);
    current.x += (target.x - current.x) * smoothing;
    current.y += (target.y - current.y) * smoothing;
    apply(); start();
  }
  function reset() {
    cancelAnimationFrame(frame); frame = 0; lastTime = 0; tracking = false;
    root.removeAttribute('data-running');
    Object.assign(current, base); Object.assign(target, base); apply(); start();
  }
  header.addEventListener('pointermove', event => {
    if (!active() || !fine.matches || event.pointerType !== 'mouse') return;
    const rect = root.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const clamp = value => Math.min(1, Math.max(-1, value));
    tracking = true;
    target.x = base.x - clamp((event.clientY - rect.top - rect.height / 2) / (rect.height * .8)) * 7.5;
    target.y = base.y + clamp((event.clientX - rect.left - rect.width / 2) / (rect.width * .8)) * 7.5;
    start();
  }, {passive: true});
  header.addEventListener('pointerleave', () => { tracking = false; });
  addEventListener('blur', () => { tracking = false; });
  document.addEventListener('visibilitychange', reset);
  reduced.addEventListener('change', reset);
  fine.addEventListener('change', reset);
  new MutationObserver(reset).observe(document.body, {attributes: true, attributeFilter: ['class']});
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; reset(); }).observe(root);
  apply();
}
