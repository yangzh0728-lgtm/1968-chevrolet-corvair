// One device-local preference shared by the website and its same-origin model.
export const LANGUAGE_KEY = 'legacy-language';
export function initialLanguage(search = location.search, storage) {
  const query = new URLSearchParams(search).get('lang');
  if (query === 'en' || query === 'zh') return query;
  try { const saved = (storage ?? window.localStorage).getItem(LANGUAGE_KEY); if (saved === 'en' || saved === 'zh') return saved; } catch {}
  return 'en';
}
export let language = initialLanguage();
export function setLanguage(next, {broadcast = true} = {}) {
  if (!['en', 'zh'].includes(next)) return;
  const changed = next !== language; language = next;
  try { localStorage.setItem(LANGUAGE_KEY, next); } catch {}
  document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en';
  const url = new URL(location.href); if (url.searchParams.has('lang')) { url.searchParams.set('lang',next); history.replaceState(null,'',url); }
  document.querySelectorAll('[data-language]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === next)));
  if (changed) window.dispatchEvent(new CustomEvent('legacy-languagechange', {detail: next}));
  if (broadcast) {
    for (const frame of document.querySelectorAll('iframe')) frame.contentWindow?.postMessage({type:'legacy-language',language:next},location.origin);
    if (parent !== window) parent.postMessage({type:'legacy-language',language:next},location.origin);
  }
}
export function connectLanguageControls() {
  setLanguage(language, {broadcast:false});
  document.querySelectorAll('[data-language]').forEach(button => {button.disabled=false;button.addEventListener('click',()=>setLanguage(button.dataset.language));});
  addEventListener('storage', event => {if(event.key===LANGUAGE_KEY) setLanguage(event.newValue);});
  addEventListener('message', event => {
    if(event.origin!==location.origin) return;
    const trusted = (parent!==window && event.source===parent) || [...document.querySelectorAll('iframe')].some(f=>event.source===f.contentWindow);
    if(trusted && event.data?.type==='legacy-language') setLanguage(event.data.language,{broadcast:false});
  });
}
export function createTranslator(source, dictionary, templates = []) {
  const patterns = templates.map(([from,to]) => ({
    regex: new RegExp('^'+from.split(/\{\d+\}/).map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('(.*?)')+'$'), to
  }));
  function t(value) {
    if(typeof value!=='string'||language===source) return value;
    const text=value.trim(); let result=dictionary[text];
    if(result===undefined) {
      for(const {regex,to} of patterns) {const match=text.match(regex);if(match){result=to.replace(/\{(\d+)\}/g,(_,i)=>t(match[Number(i)+1]));break;}}
    }
    // Repeated details and composite breadcrumbs reuse the same canonical entries.
    if(result===undefined && / · | \/ /.test(text)) result=text.split(/( · | \/ )/).map(s=>dictionary[s]??s).join('');
    return result===undefined ? value : value.replace(text,()=>result);
  }
  return t;
}
export function translateDOM(t) {
  const records=new WeakMap();
  const attrs=['alt','title','placeholder','aria-label','aria-valuetext','content'];
  const excluded=node=>node.parentElement?.closest('script,style,noscript,[data-no-translate]');
  function value(node,key,current,write) {
    let record=records.get(node);if(!record){record={};records.set(node,record);}
    let pair=record[key];if(!pair||current!==pair.output) pair={original:current};
    pair.output=t(pair.original);record[key]=pair;
    if(current!==pair.output) write(pair.output);
  }
  function visit(root) {
    if(root.nodeType===Node.TEXT_NODE){if(!excluded(root))value(root,'text',root.data,v=>root.data=v);return;}
    if(root.nodeType!==Node.ELEMENT_NODE || root.closest('script,style,noscript,[data-no-translate]'))return;
    for(const attr of attrs)if(root.hasAttribute(attr))value(root,attr,root.getAttribute(attr),v=>root.setAttribute(attr,v));
    for(const child of root.childNodes)visit(child);
  }
  const observer=new MutationObserver(mutations=>{observer.disconnect();for(const mutation of mutations){if(mutation.type==='childList')mutation.addedNodes.forEach(visit);else visit(mutation.target);}observe();});
  function observe(){observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attrs});}
  function refresh(){observer.disconnect();visit(document.documentElement);observe();}
  addEventListener('legacy-languagechange',refresh);refresh();return refresh;
}
// Save originals separately, so switching never translates an already translated value.
export function objectLocalizer(t) {
  const originals=new WeakMap();
  return function localize(value) {
    if(!value||typeof value!=='object')return;
    let original=originals.get(value);if(!original){original={};originals.set(value,original);}
    for(const key of Object.keys(value)) {
      if(typeof value[key]==='string'){if(!(key in original))original[key]=value[key];value[key]=t(original[key]);}
      else if(value[key]&&typeof value[key]==='object')localize(value[key]);
    }
  };
}
