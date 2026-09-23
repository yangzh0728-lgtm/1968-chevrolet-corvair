import {connectLanguageControls,createTranslator,translateDOM} from './i18n.js';
const response=await fetch('/locales/site-zh.json?v=old-new-1');
if(!response.ok)throw new Error('Language catalog unavailable');
export const t=createTranslator('en',await response.json(),[
 ['{0} notes','{0} 篇日志'],['{0} note','{0} 篇日志'],['{0}% as-purchased view','{0}% 购入时的旧车视图'],
 ['Launch {0} view','打开{0}视图']
]);
connectLanguageControls();translateDOM(t);
