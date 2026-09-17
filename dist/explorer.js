const container=document.querySelector('#viewer-container');
const mount=document.querySelector('#viewer-mount');
const poster=document.querySelector('#viewer-poster');
const launch=document.querySelector('#load-viewer');
const close=document.querySelector('#viewer-unload');
const fullscreen=document.querySelector('#viewer-fullscreen');
const status=document.querySelector('#viewer-status');
const assemblyButtons=[...document.querySelectorAll('[data-assembly]')];
const assemblyIds=new Set(assemblyButtons.map(b=>b.dataset.assembly));
const requested=new URLSearchParams(location.search).get('assembly');
let assembly=assemblyIds.has(requested)?requested:null;
let frame=null,ready=false,slowTimer;
function markAssembly(){assemblyButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.assembly===assembly)));}
markAssembly();
if(assembly){launch.firstChild.textContent=`Launch ${assemblyButtons.find(b=>b.dataset.assembly===assembly).querySelector('strong').textContent.toLowerCase()} view `;status.textContent='Your assembly is selected. Launch the model to inspect it.';}
function load(){if(frame)return;poster.hidden=true;frame=document.createElement('iframe');frame.title='Corvair Anatomy — interactive 3D model, Chinese interface';frame.allow='fullscreen';frame.src='/anatomy/'+(assembly?'?assembly='+encodeURIComponent(assembly):'');mount.append(frame);close.hidden=false;fullscreen.hidden=false;status.textContent='Loading Corvair Anatomy… Model download is approximately 88 MB. Loading progress appears inside the viewer.';slowTimer=setTimeout(()=>{if(!ready)status.textContent='The detailed model is still loading. If loading fails, use the retry button inside the viewer, or close the model and try again.';},45000);}
launch.addEventListener('click',load);
assemblyButtons.forEach(button=>button.addEventListener('click',()=>{assembly=button.dataset.assembly;markAssembly();history.replaceState(null,'','?assembly='+encodeURIComponent(assembly));if(!frame)load();else if(ready)frame.contentWindow.postMessage({type:'legacy-select-assembly',assembly},location.origin);container.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('motion-paused')?'instant':'smooth',block:'start'});}));
window.addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==frame?.contentWindow)return;if(event.data?.type==='corvair-ready'){ready=true;clearTimeout(slowTimer);status.textContent='Model ready. Drag to rotate, scroll to zoom, and select an assembly or part. Viewer explanations are in Chinese.';if(assembly)frame.contentWindow.postMessage({type:'legacy-select-assembly',assembly},location.origin);}if(event.data?.type==='corvair-error'){ready=false;clearTimeout(slowTimer);status.textContent='The model could not load. Try the retry control inside the viewer, or read the explorer guide below.';}});
close.addEventListener('click',()=>{clearTimeout(slowTimer);frame?.remove();frame=null;ready=false;poster.hidden=false;close.hidden=true;fullscreen.hidden=true;status.textContent='Model closed. You can launch it again when you’re ready.';launch.focus();});
fullscreen.addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await container.requestFullscreen();}catch{status.textContent='Full screen is unavailable in this browser. The embedded model remains usable.';}});
addEventListener('pagehide',()=>clearTimeout(slowTimer));

const exitFullscreen=document.querySelector('#exit-fullscreen');
document.addEventListener('fullscreenchange',()=>{exitFullscreen.hidden=document.fullscreenElement!==container;});
exitFullscreen.addEventListener('click',()=>document.exitFullscreen());
