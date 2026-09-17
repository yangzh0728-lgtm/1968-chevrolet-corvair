import {connectLanguageControls,createTranslator,translateDOM} from './i18n.js';
const response=await fetch('/locales/site-zh.json');
if(!response.ok)throw new Error('Language catalog unavailable');
export const t=createTranslator('en',await response.json(),[
 ['{0} notes','{0} 篇日志'],['{0} note','{0} 篇日志'],['{0}% mechanical view','{0}% 机械结构视图'],
 ['Launch {0} view','打开{0}视图']
]);
connectLanguageControls();translateDOM(t);
