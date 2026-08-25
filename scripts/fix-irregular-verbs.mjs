import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = join(root, 'src/content');

function load(name) {
  return JSON.parse(readFileSync(join(contentDir, name), 'utf8'));
}

function save(name, data) {
  writeFileSync(join(contentDir, name), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function patchById(list, id, patch) {
  const i = list.findIndex((v) => v.id === id);
  if (i === -1) throw new Error(`id ${id} not found`);
  list[i] = typeof patch === 'function' ? patch(list[i]) : { ...list[i], ...patch };
}

const top100 = load('irregularVerbsTop100.json');
for (const id of [62, 68, 69, 70, 71]) {
  patchById(top100, id, { pattern: 'ABC' });
}
save('irregularVerbsTop100.json', top100);

const replacements = {
  125: {
    id: 125,
    block: 'advanced',
    pattern: 'ABC',
    infinitive: 'swell',
    past_simple: 'swelled',
    past_participle: 'swollen',
    translation: 'опухать, раздуваться, увеличиваться',
    transcription: 'swel',
    examples: [
      {
        form: 'past_simple',
        en: 'Her ankle swelled after the injury.',
        ru: 'Лодыжка распухла после травмы.',
      },
      {
        form: 'past_participle',
        en: 'The river has swollen after the heavy rain.',
        ru: 'Река разлилась после сильного дождя.',
      },
    ],
  },
  126: {
    id: 126,
    block: 'advanced',
    pattern: 'ABC',
    infinitive: 'strive',
    past_simple: 'strove',
    past_participle: 'striven',
    translation: 'стремиться, прилагать усилия',
    transcription: 'straɪv',
    examples: [
      {
        form: 'past_simple',
        en: 'They strove to finish the project on time.',
        ru: 'Они старались закончить проект в срок.',
      },
      {
        form: 'past_participle',
        en: 'She has always striven for excellence.',
        ru: 'Она всегда стремилась к совершенству.',
      },
    ],
  },
  127: {
    id: 127,
    block: 'advanced',
    pattern: 'ABC',
    infinitive: 'shear',
    past_simple: 'sheared',
    past_participle: 'shorn',
    translation: 'стричь (шерсть), срезать',
    transcription: 'ʃɪə',
    examples: [
      {
        form: 'past_simple',
        en: 'The farmer sheared the sheep in spring.',
        ru: 'Фермер постриг овец весной.',
      },
      {
        form: 'past_participle',
        en: 'The lambs have been shorn already.',
        ru: 'Ягнят уже постригли.',
      },
    ],
  },
  138: {
    id: 138,
    block: 'advanced',
    pattern: 'ABB',
    infinitive: 'shed',
    past_simple: 'shed',
    past_participle: 'shed',
    translation: 'проливать, сбрасывать, избавляться',
    transcription: 'ʃed',
    examples: [
      {
        form: 'past_simple',
        en: 'The tree shed its leaves in autumn.',
        ru: 'Дерево сбросило листья осенью.',
      },
      {
        form: 'past_participle',
        en: 'He has shed many tears over the years.',
        ru: 'За годы он пролил немало слёз.',
      },
    ],
  },
  141: {
    id: 141,
    block: 'advanced',
    pattern: 'ABC',
    infinitive: 'undergo',
    past_simple: 'underwent',
    past_participle: 'undergone',
    translation: 'проходить через, переносить (испытание, операцию)',
    transcription: 'ˌʌndəˈɡəʊ',
    examples: [
      {
        form: 'past_simple',
        en: 'He underwent surgery last month.',
        ru: 'В прошлом месяце ему сделали операцию.',
      },
      {
        form: 'past_participle',
        en: 'The product has undergone major changes.',
        ru: 'Продукт претерпел серьёзные изменения.',
      },
    ],
  },
};

const advanced = load('irregularVerbsAdvanced.json');

patchById(advanced, 118, { pattern: 'ABC' });
patchById(advanced, 123, { translation: 'наклониться, прислоняться' });
patchById(advanced, 137, { pattern: 'ABC' });

for (const [id, entry] of Object.entries(replacements)) {
  const idx = advanced.findIndex((v) => v.id === Number(id));
  if (idx === -1) throw new Error(`id ${id} not found in advanced`);
  advanced[idx] = entry;
}

patchById(advanced, 173, (v) => ({
  ...v,
  examples: v.examples.map((ex) =>
    ex.form === 'past_simple'
      ? {
          ...ex,
          en: 'They partook of the traditional ceremony.',
          ru: 'Они приняли участие в традиционной церемонии.',
        }
      : ex,
  ),
}));

save('irregularVerbsAdvanced.json', advanced);

console.log('Fixed irregular verbs in top100 and advanced files');
