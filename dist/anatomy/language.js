import {connectLanguageControls,createTranslator,translateDOM,objectLocalizer,language} from '../i18n.js';
const [ui,catalog]=await Promise.all([fetch('../locales/model-en.json'),fetch('../locales/parts-en.json')]);
if(!ui.ok||!catalog.ok)throw new Error('Language catalog unavailable');
const dictionary={...await catalog.json(),...await ui.json()};
export const t=createTranslator('zh',dictionary,[
 ['{0} 个部件','{0} parts'],
 ['显示更多 · 还有 {0} 个','Show more · {0} remaining'],
 ['{0} / {1} 个组内部件','{0} / {1} assembly parts'],['{0} / {1} 个部件','{0} / {1} parts'],
 ['恢复隐藏内容（{0}）','Restore hidden ({0})'],['↗ 查看所属总成：{0}','↗ Explore assembly: {0}'],
 ['同类对象 {0} 件','{0} related model objects'],['查看{0}的组成','Explore {0}'],['查看{0}的用途','Inspect {0}'],
 ['{0} 个部件 · 点击进入总成','{0} parts · Explore assembly'],['零件 {0} 的说明缺失。','Missing description for part {0}.'],
 ['{0} · 组内','{0} · Parts'],
 ['显示{0}','Show {0}'],['隐藏{0}','Hide {0}'],
 ['{0} · {1}','{0} · {1}'],['{0} / {1}','{0} / {1}']
]);
export const english=value=>dictionary[value]??value;
export const localize=objectLocalizer(t);
export {language};
connectLanguageControls();translateDOM(t);
