#!/usr/bin/env node
/**
 * Проверка: все JSX-компоненты (имена с большой буквы) должны быть импортированы
 * или объявлены в файле. Иначе в рантайме будет `ReferenceError: X is not defined`
 * (сборка Vite такое не ловит) — страница падает в белый экран / ошибку.
 *
 * Запуск: node scripts/check-jsx-imports.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SRC = join(ROOT, 'src');
const EXT = new Set(['.js', '.jsx']);

/** Имена, приходящие из глобалов/реакта, объявлять не нужно. */
const GLOBALS = new Set(['React', 'Fragment', 'Suspense', 'StrictMode', 'Math', 'JSON']);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (EXT.has(entry.slice(entry.lastIndexOf('.')))) out.push(full);
  }
  return out;
}

/** Убираем комментарии, строки и regex-литералы; переводы строк сохраняем (нужны номера строк). */
function stripNoise(code) {
  const blank = (m) => m.replace(/[^\n]/g, ' ');
  return code
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^:'"\\\w])\/\/[^\n]*/g, '$1')
    .replace(/`(?:\\.|\$\{[^}]*\}|[^`\\])*`/g, blank)
    .replace(/'(?:\\.|[^'\\\n])*'/g, blank)
    .replace(/"(?:\\.|[^"\\\n])*"/g, blank)
    .replace(/\/(?![/*])(?:\\.|\[(?:\\.|[^\]\\\n])*\]|[^/\\\n])+\/[gimsuy]*/g, blank);
}

/** Имена из import-деклараций (включая `as`-алиасы и `* as ns`). */
function importedNames(code) {
  const names = new Set();
  const re = /import\s+([^;'"]*?)from\s*['"][^'"]+['"]/g;
  for (const m of code.matchAll(re)) {
    const clause = m[1];
    for (const part of clause.split(',')) {
      const p = part.trim();
      if (!p) continue;
      if (p.startsWith('*')) {
        const ns = p.split(/\s+as\s+/)[1];
        if (ns) names.add(ns.trim());
        continue;
      }
      const cleaned = p.replace(/[{}]/g, '').trim();
      if (!cleaned) continue;
      const [orig, alias] = cleaned.split(/\s+as\s+/);
      const n = (alias ?? orig ?? '').trim();
      if (/^[A-Za-z_$][\w$]*$/.test(n)) names.add(n);
    }
  }
  return names;
}

/** Локальные объявления: function/const/let/var/class + деструктуризация. */
function declaredNames(code) {
  const names = new Set();
  const add = (raw) => {
    const n = String(raw ?? '').trim();
    if (!n) return;
    if (n.startsWith('{') || n.startsWith('[')) {
      for (const inner of n.replace(/[{}[\]]/g, '').split(',')) {
        const [key, alias] = inner.split(':');
        const candidate = (alias ?? key ?? '').split('=')[0];
        const t = candidate.trim();
        if (/^[A-Z][A-Za-z0-9_]*$/.test(t)) names.add(t);
      }
      return;
    }
    if (/^[A-Za-z_$][\w$]*$/.test(n)) names.add(n);
  };

  for (const m of code.matchAll(/\b(?:function|class)\s+([A-Z][\w$]*)/g)) names.add(m[1]);
  for (const m of code.matchAll(/\b(?:const|let|var)\s+([^;=\n]+)/g)) add(m[1]);
  return names;
}

function jsxUsages(code) {
  const used = new Map();
  const re = /<([A-Z][\w$]*)(?=[\s/>])/g;
  let m;
  while ((m = re.exec(code))) {
    const name = m[1];
    const line = code.slice(0, m.index).split('\n').length;
    if (!used.has(name)) used.set(name, []);
    used.get(name).push(line);
  }
  return used;
}

const problems = [];
for (const file of walk(SRC)) {
  const raw = readFileSync(file, 'utf8');
  const code = stripNoise(raw);
  const known = new Set([...importedNames(raw), ...declaredNames(code), ...GLOBALS]);
  for (const [name, lines] of jsxUsages(code)) {
    if (known.has(name)) continue;
    problems.push({ file: relative(ROOT, file).replace(/\\/g, '/'), name, lines });
  }
}

if (problems.length === 0) {
  console.log('✓ JSX imports ok — все компоненты объявлены или импортированы');
  process.exit(0);
}

console.error(`✗ Найдено ${problems.length} необъявленных JSX-компонентов (рантайм-краш):`);
for (const p of problems) {
  console.error(`  ${p.file}: <${p.name}> (строки ${p.lines.join(', ')}) — нет импорта/объявления`);
}
process.exit(1);
