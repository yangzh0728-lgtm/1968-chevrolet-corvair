// Native disclosures remain usable before JS loads and without JavaScript.
const groups = [...document.querySelectorAll('.nav-dropdown')];
const hover = matchMedia('(hover: hover) and (pointer: fine)');
const desktop = matchMedia('(min-width: 961px)');
const timers = new Map();
const hoverOpened = new WeakSet();
function clearTimer(group) { clearTimeout(timers.get(group)); timers.delete(group); }
export function closeDropdowns(except = null) {
  for (const group of groups) if (group !== except) { clearTimer(group); hoverOpened.delete(group); group.open = false; }
}
function open(group) { clearTimer(group); closeDropdowns(group); group.open = true; }
for (const group of groups) {
  const summary = group.querySelector('summary');
  const links = [...group.querySelectorAll('a')];
  group.addEventListener('toggle', () => { if (group.open) closeDropdowns(group); });
  group.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse' && hover.matches && desktop.matches) {
      if (!group.open) hoverOpened.add(group);
      open(group);
    }
  });
  summary.addEventListener('click', event => {
    // The first click should keep a hover-opened panel open, not immediately shut it.
    if (hoverOpened.has(group) && event.detail > 0) {
      event.preventDefault(); event.stopPropagation(); hoverOpened.delete(group); open(group);
    }
  });
  group.addEventListener('pointerleave', () => {
    if (!desktop.matches) return;
    clearTimer(group);
    timers.set(group, setTimeout(() => {
      if (!group.contains(document.activeElement)) { group.open = false; hoverOpened.delete(group); }
      timers.delete(group);
    }, 180));
  });
  group.addEventListener('focusout', event => {
    if (!group.contains(event.relatedTarget)) { clearTimer(group); hoverOpened.delete(group); group.open = false; }
  });
  summary.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault(); event.stopPropagation(); hoverOpened.delete(group); open(group);
      links[event.key === 'ArrowDown' ? 0 : links.length - 1]?.focus();
    }
  });
  group.addEventListener('keydown', event => {
    const index = links.indexOf(document.activeElement);
    if (index < 0 || !['ArrowDown','ArrowUp','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? links.length - 1 :
      (index + (event.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
    links[next].focus();
  });
  links.forEach(link => link.addEventListener('click', () => closeDropdowns()));
}
document.addEventListener('pointerdown', event => {
  if (!groups.some(group => group.contains(event.target))) closeDropdowns();
});
// Escape closes the disclosure first; a second Escape closes the mobile panel.
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  const active = groups.find(group => group.open);
  if (!active) return;
  event.preventDefault(); event.stopImmediatePropagation();
  closeDropdowns(); active.querySelector('summary').focus();
}, true);
desktop.addEventListener('change', () => closeDropdowns());
