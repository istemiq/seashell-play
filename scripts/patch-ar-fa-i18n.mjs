import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'i18n', 'messages');

const ar = {
  'home.tagline1': 'تعلّم بالممارسة.',
  'home.tagline2': 'وسّع مفرداتك.',
  'home.tagline3': 'واظب على التمرين.',
  'home.tagline4': 'تكلّم بثقة.',
  'lang.hint':
    'أمثلة القاموس وترجماتها بالعربية. حوار الممارسة بالإنجليزية مع تلميحات عربية عند الحاجة. القوائم والأزرار باللغة التي تختارها.',
  'practice.placeholder': 'اكتب هنا بالإنجليزية…',
  'dict.emptyWordsHint':
    'إذا كانت كلماتك على خادم آخر، فلن تظهر هنا — أضفها من جديد.',
  'dict.addHint':
    'يمكنك الكتابة بالعربية أو الإنجليزية — نحفظ المكافئ الإنجليزي الطبيعي. نولّد أمثلةً وترجمات بالعربية مع ملاحظات الأسلوب وBrE/AmE. «مثال آخر» يبدّل البطاقات.',
  'dict.addHintGroup':
    'ستُضاف الكلمة إلى هذه المجموعة. يمكنك الكتابة بالعربية — نحفظ المكافئ الإنجليزي والأمثلة والترجمات بالعربية مع ملاحظات الأسلوب (محايد، عامي، BrE، إلخ).',
};

const fa = {
  'home.tagline1': 'با تمرین یاد بگیر.',
  'home.tagline2': 'واژگانت را گسترش بده.',
  'home.tagline3': 'مداومت کن.',
  'home.tagline4': 'با اطمینان حرف بزن.',
  'lang.hint':
    'مثال‌ها و ترجمه‌های واژه‌نامه به فارسی است. گفتگوی تمرین به انگلیسی است با راهنمایی فارسی در صورت نیاز. منوها به زبان انتخابی شما.',
  'practice.placeholder': 'اینجا به انگلیسی بنویسید…',
};

const enExtra = { 'practice.placeholder': 'Type in English…' };
const ruExtra = { 'practice.placeholder': 'Пишите по-английски…' };

function patchFile(name, patches) {
  const file = path.join(dir, `${name}.js`);
  let src = fs.readFileSync(file, 'utf8');
  for (const [key, value] of Object.entries(patches)) {
    const re = new RegExp(`('${key}':\\s*)(['"])(?:\\\\.|(?!\\2)[^\\\\])*\\2`, 'm');
    if (!re.test(src)) {
      console.warn(`skip ${name} ${key}`);
      continue;
    }
    const escaped = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    src = src.replace(re, `$1'${escaped}'`);
  }
  fs.writeFileSync(file, src, 'utf8');
  console.log(`patched ${name}`);
}

patchFile('ar', ar);
patchFile('fa', fa);
patchFile('en', enExtra);
patchFile('ru', ruExtra);
