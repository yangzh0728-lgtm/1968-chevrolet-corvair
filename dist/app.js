import {t} from './language.js';
const menuToggle=document.querySelector('.menu-toggle');
const menu=document.querySelector('#mobile-menu');
function closeMenu(){menu.hidden=true;menuToggle.setAttribute('aria-expanded','false');menuToggle.setAttribute('aria-label','Open navigation');}
menuToggle?.addEventListener('click',()=>{const open=menu.hidden;menu.hidden=!open;menuToggle.setAttribute('aria-expanded',String(open));menuToggle.setAttribute('aria-label',open?'Close navigation':'Open navigation');});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){closeMenu();menuToggle.focus();}});
const motionButton=document.querySelector('.motion-toggle');
let paused=false;try{paused=localStorage.getItem('legacy-motion')==='paused';}catch{}
function setMotion(value){paused=value;document.body.classList.toggle('motion-paused',paused);document.documentElement.classList.toggle('motion-paused',paused);motionButton?.setAttribute('aria-pressed',String(paused));if(motionButton)motionButton.textContent=paused?'Resume motion':'Pause motion';}
setMotion(paused);motionButton?.addEventListener('click',()=>{setMotion(!paused);try{localStorage.setItem('legacy-motion',paused?'paused':'active');}catch{}});
document.querySelector('.back-top')?.addEventListener('click',e=>{e.preventDefault();window.scrollTo({top:0,behavior:canAnimate()?'smooth':'instant'});});

// Enhance ordinary links and content; everything remains readable without JS.
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
const canAnimate=()=>!paused&&!reduceMotion.matches;
const currentPath=location.pathname.replace(/\/$/,'')||'/';
for(const link of document.querySelectorAll('.site-header nav a,.mobile-menu a')){const path=new URL(link.href).pathname.replace(/\/$/,'')||'/';if(currentPath===path||(path!=='/'&&currentPath.startsWith(path+'/')))link.setAttribute('aria-current','page');}
const revealTargets=document.querySelectorAll('.calm-story>div,.calm-explore>div,.note-list>a,.intro h2,.intro-bottom,.section-heading,.home-explore>div,.journal-card,.value-row,.team-section>div,.vision-section h2,.contact-strip,.roadmap-preview>a');
const revealObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.remove('reveal-pending');entry.target.classList.add('revealed');revealObserver.unobserve(entry.target);}},{threshold:.08});
for(const el of revealTargets){if(canAnimate())el.classList.add('reveal-pending');revealObserver.observe(el);}
motionButton?.addEventListener('click',()=>{if(paused)document.querySelectorAll('.reveal-pending').forEach(el=>el.classList.remove('reveal-pending'));});
reduceMotion.addEventListener('change',()=>{if(reduceMotion.matches)document.querySelectorAll('.reveal-pending').forEach(el=>el.classList.remove('reveal-pending'));});

// Restoration stages use the WAI-ARIA tab keyboard pattern.
const stageTabs=[...document.querySelectorAll('[data-stage]')];
function selectStage(index,focus=false){if(!stageTabs[index])return;stageTabs.forEach((tab,i)=>{const selected=i===index;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;document.getElementById(tab.getAttribute('aria-controls')).hidden=!selected;});document.querySelector('.milestone-tabs').style.setProperty('--road-progress',`${(index+1)/stageTabs.length*100}%`);if(focus)stageTabs[index].focus();history.replaceState(null,'',`#stage-${index+1}`);}
stageTabs.forEach((tab,i)=>{tab.addEventListener('click',()=>selectStage(i));tab.addEventListener('keydown',e=>{let next;if(e.key==='ArrowDown'||e.key==='ArrowRight')next=(i+1)%stageTabs.length;if(e.key==='ArrowUp'||e.key==='ArrowLeft')next=(i-1+stageTabs.length)%stageTabs.length;if(e.key==='Home')next=0;if(e.key==='End')next=stageTabs.length-1;if(next!==undefined){e.preventDefault();selectStage(next,true);}});});
if(stageTabs.length&&/^#stage-[1-8]$/.test(location.hash))selectStage(Number(location.hash.slice(7))-1);

// Journal categories and text search can be combined.
const cards=[...document.querySelectorAll('[data-category]')];
const filters=[...document.querySelectorAll('[data-filter]')];
const search=document.querySelector('#journal-search');let category='all';
function filterJournal(){if(!cards.length)return;const term=(search?.value||'').trim().toLocaleLowerCase();let visible=0;for(const card of cards){const show=(category==='all'||card.dataset.category===category)&&card.textContent.toLocaleLowerCase().includes(term);card.hidden=!show;card.classList.remove('filter-enter');if(show){visible++;if(canAnimate())requestAnimationFrame(()=>card.classList.add('filter-enter'));}}document.querySelector('#journal-results').textContent=`${visible} ${visible===1?'note':'notes'}`;document.querySelector('#journal-empty').hidden=visible>0;}
filters.forEach(button=>button.addEventListener('click',()=>{category=button.dataset.filter;filters.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));filterJournal();}));
search?.addEventListener('input',filterJournal);
document.querySelector('#clear-filters')?.addEventListener('click',()=>{category='all';search.value='';filters.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter==='all')));filterJournal();filters[0].focus();});

// Contact links create a draft in the visitor's mail app; no data is submitted.
const topics=[...document.querySelectorAll('[data-topic]')];
function selectTopic(topic){const valid=topics.find(b=>b.dataset.topic===topic);if(!valid)return;topics.forEach(b=>b.setAttribute('aria-pressed',String(b===valid)));document.querySelector('#topic-email').href='mailto:contact@legacygarage26.org?subject='+encodeURIComponent(`Legacy Garage 26 — ${t(topic)}`);}
topics.forEach(b=>b.addEventListener('click',()=>selectTopic(b.dataset.topic)));
if(topics.length)selectTopic(new URLSearchParams(location.search).get('topic')||'Corvair story');
document.querySelector('#copy-email')?.addEventListener('click',async()=>{const status=document.querySelector('#copy-status');try{await navigator.clipboard.writeText('contact@legacygarage26.org');status.textContent='Email address copied.';}catch{status.textContent='Select and copy: contact@legacygarage26.org';}});

if(document.querySelector('#viewer-container'))import('./explorer.js?v=language-1');

matchMedia('(min-width: 701px)').addEventListener('change',e=>{if(e.matches)closeMenu();});

if(document.querySelector('[data-car-reveal]')) import('./hero-reveal.js');

import('./motion.js?v=1');
