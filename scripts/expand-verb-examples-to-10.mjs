/**
 * 10 examples per verb: 3 present, 4 past_simple, 3 past_participle.
 * Hand-crafted for core verbs; others: keep good Gemini pairs + safe templates.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'irregularVerbsTop50.json',
  'irregularVerbsTop100.json',
  'irregularVerbsAdvanced.json',
];

const TARGET = { present: 3, past_simple: 4, past_participle: 3 };

const BAD_RU = /идл|плачл|есть туда|есть на прошлой|есть сегодня|\(\d+\)|\/он:/i;
const PAST_TIME_IN_PRESENT =
  /\b(yesterday|last night|last week|last month|last year|ago|this morning)\b/i;

function altForms(v) {
  return String(v ?? '')
    .split(/[/,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}
function first(v) {
  return altForms(v)[0] ?? v;
}

const EN_S3 = {
  be: 'is',
  do: 'does',
  go: 'goes',
  have: 'has',
  say: 'says',
  pay: 'pays',
  fly: 'flies',
  try: 'tries',
  eat: 'eats',
  run: 'runs',
  write: 'writes',
  see: 'sees',
  give: 'gives',
  take: 'takes',
  come: 'comes',
  become: 'becomes',
};
function en3(inf) {
  if (EN_S3[inf]) return EN_S3[inf];
  if (inf.endsWith('y') && !/[aeiou]y$/i.test(inf)) return `${inf.slice(0, -1)}ies`;
  if (/(s|x|z|ch|sh)$/i.test(inf)) return `${inf}es`;
  return `${inf}s`;
}

function good(ex) {
  if (!ex?.en?.trim() || !ex?.ru?.trim()) return false;
  if (BAD_RU.test(ex.ru)) return false;
  if (ex.form === 'present' && PAST_TIME_IN_PRESENT.test(ex.en)) return false;
  if (ex.form === 'present' && /\b(was|were|went|paid|did|had|seen|gone)\b/i.test(ex.en)) return false;
  return true;
}

function uniq(list) {
  const s = new Set();
  return list.filter((e) => {
    const k = `${e.form}::${e.en.toLowerCase()}`;
    if (s.has(k)) return false;
    s.add(k);
    return true;
  });
}

function swapRu(ru, from, to) {
  return ru.replace(new RegExp(`^${from}\\s`, 'i'), `${to} `);
}

function packFromHand(h) {
  const examples = [];
  for (const form of ['present', 'past_simple', 'past_participle']) {
    for (const ex of h[form] ?? []) examples.push({ form, ...ex });
  }
  return examples;
}

const HAND = {
  be: {
    present: [
      { en: 'I am at home every evening.', ru: 'Каждый вечер я дома.' },
      { en: 'She is always on time.', ru: 'Она всегда приходит вовремя.' },
      { en: 'They are good friends.', ru: 'Они хорошие друзья.' },
    ],
    past_simple: [
      { en: 'He was at home yesterday.', ru: 'Вчера он был дома.' },
      { en: 'We were at the party last night.', ru: 'Прошлой ночью мы были на вечеринке.' },
      { en: 'I was tired this morning.', ru: 'Сегодня утром я был уставшим.' },
      { en: 'They were late for the meeting.', ru: 'Они опоздали на встречу.' },
    ],
    past_participle: [
      { en: 'I have been to London twice.', ru: 'Я был в Лондоне дважды.' },
      { en: 'She has been very busy lately.', ru: 'В последнее время она была очень занята.' },
      { en: 'We have been here before.', ru: 'Мы уже были здесь раньше.' },
    ],
  },
  go: {
    present: [
      { en: 'I go to work by bus.', ru: 'Я езжу на работу на автобусе.' },
      { en: 'She goes to the gym every week.', ru: 'Она ходит в спортзал каждую неделю.' },
      { en: 'They go abroad every summer.', ru: 'Каждое лето они ездят за границу.' },
    ],
    past_simple: [
      { en: 'They went to the cinema last night.', ru: 'Прошлой ночью они ходили в кино.' },
      { en: 'He went to Paris last year.', ru: 'В прошлом году он ездил в Париж.' },
      { en: 'I went home early yesterday.', ru: 'Вчера я рано пошёл домой.' },
      { en: 'We went shopping together.', ru: 'Мы вместе ходили по магазинам.' },
    ],
    past_participle: [
      { en: 'He has gone to the office.', ru: 'Он ушёл в офис.' },
      { en: 'She has gone abroad for work.', ru: 'Она уехала за границу по работе.' },
      { en: 'They have gone home already.', ru: 'Они уже ушли домой.' },
    ],
  },
  pay: {
    present: [
      { en: 'I pay the rent every month.', ru: 'Я плачу аренду каждый месяц.' },
      { en: 'She pays by card.', ru: 'Она платит картой.' },
      { en: 'We pay for lunch together.', ru: 'Мы вместе платим за обед.' },
    ],
    past_simple: [
      { en: 'I paid the bill in cash.', ru: 'Я оплатил счёт наличными.' },
      { en: 'He paid for dinner last night.', ru: 'Прошлой ночью он оплатил ужин.' },
      { en: 'She paid online this morning.', ru: 'Сегодня утром она оплатила онлайн.' },
      { en: 'They paid the full amount.', ru: 'Они заплатили полную сумму.' },
    ],
    past_participle: [
      { en: 'They have already paid for the order.', ru: 'Они уже оплатили заказ.' },
      { en: 'I have paid all my bills.', ru: 'Я оплатил все свои счета.' },
      { en: 'She has paid the deposit.', ru: 'Она внесла депозит.' },
    ],
  },
};

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toPresentRu(ru) {
  return ru
    .replace(/увидел/gi, 'вижу')
    .replace(/увидела/gi, 'видит')
    .replace(/увидели/gi, 'видят')
    .replace(/сделал/gi, 'делаю')
    .replace(/сделала/gi, 'делает')
    .replace(/сделали/gi, 'делают')
    .replace(/оплатил/gi, 'плачу')
    .replace(/оплатила/gi, 'платит')
    .replace(/оплатили/gi, 'платят')
    .replace(/ходил/gi, 'хожу')
    .replace(/ходила/gi, 'ходит')
    .replace(/ходили/gi, 'ходят')
    .replace(/был/gi, 'есть')
    .replace(/была/gi, 'есть')
    .replace(/были/gi, 'есть');
}

function ruForSubject(ru, subject) {
  let r = toPresentRu(ru.replace(/^Я /i, `${subject} `));
  if (subject === 'Она') {
    r = r.replace(/вижу/g, 'видит').replace(/делаю/g, 'делает').replace(/плачу/g, 'платит').replace(/хожу/g, 'ходит');
  }
  if (subject === 'Мы') {
    r = r.replace(/вижу/g, 'видим').replace(/делаю/g, 'делаем').replace(/плачу/g, 'платим').replace(/хожу/g, 'ходим');
  }
  if (subject === 'Они') {
    r = r.replace(/вижу/g, 'видят').replace(/делаю/g, 'делают').replace(/плачу/g, 'платят').replace(/хожу/g, 'ходят');
  }
  if (subject === 'Он') {
    r = r.replace(/^Я /i, 'Он ').replace(/вижу/g, 'видит').replace(/делаю/g, 'делает').replace(/плачу/g, 'платит');
  }
  return r;
}

function presentFromAnchor(verb, pAnchor) {
  const inf = verb.infinitive;
  const e3 = en3(inf);
  if (!pAnchor) {
    return {
      en: `I ${inf} every day.`,
      ru: `Я ${verb.translation.split(/[,;(/]/)[0].trim()}.`,
    };
  }
  let en = pAnchor.en;
  for (const f of altForms(verb.past_simple)) {
    en = en.replace(new RegExp(`\\b${escapeRegExp(f)}\\b`, 'gi'), inf);
  }
  en = en.replace(new RegExp(`\\b(She|He) ${escapeRegExp(inf)}\\b`, 'gi'), `$1 ${e3}`);
  en = en
    .replace(/\byesterday\b/gi, 'every day')
    .replace(/\blast night\b/gi, 'every evening')
    .replace(/\blast week\b/gi, 'every week')
    .replace(/\bthis morning\b/gi, 'in the morning');
  const ru = toPresentRu(
    pAnchor.ru
      .replace(/вчера/gi, 'каждый день')
      .replace(/прошлой ночью/gi, 'каждый вечер')
      .replace(/на прошлой неделе/gi, 'каждую неделю')
      .replace(/сегодня утром/gi, 'по утрам'),
  );
  return { en, ru };
}

function presentVariants(verb, pAnchor) {
  const base = presentFromAnchor(verb, pAnchor);
  const e3 = en3(verb.infinitive);
  const inf = verb.infinitive;
  const en2 = base.en.replace(new RegExp(`^I ${escapeRegExp(inf)}\\b`, 'i'), `She ${e3}`);
  const en3v = base.en.replace(new RegExp(`^I ${escapeRegExp(inf)}\\b`, 'i'), `We ${inf}`);
  return [
    base,
    {
      en: en2,
      ru: ruForSubject(base.ru, 'Она'),
    },
    {
      en: en3v.includes(inf) ? en3v : `We ${inf} together on weekends.`,
      ru: ruForSubject(base.ru, 'Мы'),
    },
  ];
}

function buildPack(verb) {
  const inf = verb.infinitive;
  const ps = first(verb.past_simple);
  const pp = first(verb.past_participle);
  const e3 = en3(inf);

  const kept = uniq((verb.examples ?? []).filter(good));
  const pAnchor = kept.find((e) => e.form === 'past_simple');
  const ppAnchor = kept.find((e) => e.form === 'past_participle');

  const present = [];
  const past = [];
  const ppList = [];

  if (pAnchor) {
    for (const item of presentVariants(verb, pAnchor).slice(0, TARGET.present)) {
      present.push({ form: 'present', ...item });
    }
  } else {
    present.push({
      form: 'present',
      en: `I ${inf} every day.`,
      ru: `Я ${verb.translation.split(/[,;(/]/)[0].trim()}.`,
    });
    while (present.length < TARGET.present) {
      present.push({
        form: 'present',
        en: `She ${e3} often.`,
        ru: `Она ${verb.translation}.`,
      });
    }
  }

  const pastItems = [
    { en: pAnchor?.en ?? `I ${ps} yesterday.`, ru: pAnchor?.ru ?? `Past: ${verb.translation}.` },
    { en: `He ${ps} last week.`, ru: pAnchor?.ru ? swapRu(pAnchor.ru, 'Я', 'Он').replace(/^She /i, 'He ') : `Он — ${verb.translation}.` },
    { en: `She ${ps} this morning.`, ru: pAnchor?.ru ? swapRu(pAnchor.ru, 'Я', 'Она').replace(/^He /i, 'She ') : `Она — ${verb.translation}.` },
    { en: `They ${ps} together.`, ru: pAnchor?.ru ? swapRu(pAnchor.ru, 'Я', 'Они').replace(/^He /i, 'They ').replace(/^She /i, 'They ') : `Они — ${verb.translation}.` },
  ];
  for (const item of pastItems.slice(0, TARGET.past_simple)) {
    past.push({ form: 'past_simple', ...item });
  }

  const ppItems = [
    { en: ppAnchor?.en ?? `I have ${pp} before.`, ru: ppAnchor?.ru ?? `Perfect: ${verb.translation}.` },
    { en: `She has ${pp} already.`, ru: ppAnchor?.ru ? swapRu(ppAnchor.ru, 'Он', 'Она') : `Она — ${verb.translation}.` },
    { en: `They have ${pp} many times.`, ru: ppAnchor?.ru ? swapRu(ppAnchor.ru, 'Он', 'Они') : `Они — ${verb.translation}.` },
  ];
  for (const item of ppItems.slice(0, TARGET.past_participle)) {
    ppList.push({ form: 'past_participle', ...item });
  }

  return uniq([...present, ...past, ...ppList]);
}

function apply(verb) {
  if (HAND[verb.infinitive]) return packFromHand(HAND[verb.infinitive]);
  return buildPack(verb);
}

for (const file of files) {
  const path = join(root, 'src/content', file);
  const data = JSON.parse(readFileSync(path, 'utf8'));
  const out = data.map((verb) => ({ ...verb, examples: apply(verb) }));
  writeFileSync(path, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
  const counts = out.map((v) => v.examples.length);
  console.log(`${file}: min=${Math.min(...counts)} max=${Math.max(...counts)}`);
}
