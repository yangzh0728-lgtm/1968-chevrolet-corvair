// Small, event-driven enhancements. No model download or perpetual animation loop.
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const allowed = () => !reduced.matches && !document.body.classList.contains('motion-paused');
const lab = document.querySelector('[data-garage-lab]');
if (lab) {
  const tabs = [...lab.querySelectorAll('[role="tab"]')];
  const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
  function select(index, focus = false) {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
    if (focus) tabs[index].focus();
  }
  panels.forEach(panel => { panel.setAttribute('role', 'tabpanel'); panel.tabIndex = 0; });
  select(0);
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(index));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); select(next, true); }
    });
  });
  lab.querySelector('[role="tablist"]').hidden = false;
  lab.classList.add('lab-enhanced');
}

const hero = document.querySelector('.cinematic-hero');
const progress = document.createElement('div');
progress.className = 'reading-progress';
progress.setAttribute('aria-hidden', 'true');
document.body.append(progress);
let frame = 0;
function drawScroll() {
  frame = 0;
  const length = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${length > 0 ? Math.min(1, Math.max(0, scrollY / length)) : 0})`;
  if (hero) {
    const rect = hero.getBoundingClientRect();
    const amount = allowed() ? Math.min(1, Math.max(0, -rect.top / rect.height)) : 0;
    hero.style.setProperty('--hero-drift', `${amount * 65}px`);
    hero.style.setProperty('--hero-scale', String(1 + amount * .065));
  }
}
function schedule() { if (!frame) frame = requestAnimationFrame(drawScroll); }
addEventListener('scroll', schedule, {passive: true});
addEventListener('resize', schedule, {passive: true});
new ResizeObserver(schedule).observe(document.body);
reduced.addEventListener('change', schedule);
new MutationObserver(schedule).observe(document.body, {attributes: true, attributeFilter: ['class']});
schedule();

// The marker changes shape; the link's label and click area stay still.
for (const action of document.querySelectorAll('.button,.text-link')) {
  const arrow = [...action.children].find(child =>
    child.tagName === 'SPAN' && /^[↗→↓]$/.test(child.textContent.trim())
  );
  if (!arrow) continue;
  action.classList.add('shape-action');
  arrow.classList.add('action-mark');
  arrow.setAttribute('aria-hidden', 'true');
}

// Reveal each section only once and stop observing it immediately afterwards.
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) if (entry.isIntersecting) {
    entry.target.classList.add('motion-arrived');
    observer.unobserve(entry.target);
  }
}, {threshold: .12});
for (const element of document.querySelectorAll('.lab-heading,.lab-tabs,.lab-visual,.lab-copy,.lab-footer')) {
  element.classList.add('motion-enter');
  observer.observe(element);
}
