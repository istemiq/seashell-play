import fs from 'fs';
import path from 'path';

const translations = {
  en: 'Chat History',
  ru: 'История диалогов',
  ar: 'سجل الدردشة',
  es: 'Historial de chat',
  pt: 'Histórico de chat',
  fa: 'تاریخچه چت',
  uk: 'Історія діалогів',
  ko: '채팅 기록',
  ja: 'チャット履歴',
  it: 'Cronologia chat',
  tr: 'Sohbet Geçmişi'
};

const dir = 'src/i18n/messages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') && f !== 'index.js');

for (const file of files) {
  const lang = file.replace('.js', '');
  const p = path.join(dir, file);
  let content = fs.readFileSync(p, 'utf8');
  
  if (!content.includes("'practice.history'")) {
    const text = translations[lang] || translations.en;
    content = content.replace(/};\s*$/, `  'practice.history': ${JSON.stringify(text)},\n};\n`);
    fs.writeFileSync(p, content);
    console.log(`Added practice.history to ${file}`);
  }
}
