import fs from 'node:fs';

const files = process.argv.slice(2);

function styleFromHtmlSelector(sel) {
  const m = sel.match(/^html\[data-seashell-ui-style='(\w+)'\]/);
  return m?.[1] ?? null;
}

function shellSelector(htmlSel) {
  const style = styleFromHtmlSelector(htmlSel.trim());
  if (style) {
    const rest = htmlSel.trim().slice(`html[data-seashell-ui-style='${style}']`.length);
    return `.seashell-crt.seashell-ui-style-${style}${rest}`;
  }
  if (/^html:not\(\[data-seashell-ui-style\]\)/.test(htmlSel.trim())) {
    const rest = htmlSel.trim().replace(/^html:not\(\[data-seashell-ui-style\]\)/, '');
    return `.seashell-crt.seashell-ui-style-academic${rest}`;
  }
  if (/^html:not\(\[data-seashell-ui-style='academic'\]\):not\(\[data-seashell-ui-style=''\]\)/.test(htmlSel.trim())) {
    const rest = htmlSel.trim().replace(
      /^html:not\(\[data-seashell-ui-style='academic'\]\):not\(\[data-seashell-ui-style=''\]\)/,
      '',
    );
    return `.seashell-crt:not(.seashell-ui-style-calm):not(.seashell-ui-style-paper):not(.seashell-ui-style-evening):not(.seashell-ui-style-ongo):not(.seashell-ui-style-focus)${rest}`;
  }
  return null;
}

function patchRuleSelectors(selectorBlock) {
  const parts = selectorBlock
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const out = [...parts];
  for (const part of parts) {
    const shell = shellSelector(part);
    if (shell && !out.includes(shell)) out.push(shell);
  }
  return out.join(',\n');
}

function patchCss(css) {
  const chunks = css.split('{');
  let out = '';
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (i === chunks.length - 1) {
      out += chunk;
      break;
    }
    const braceIdx = chunk.lastIndexOf('}');
    if (braceIdx === -1) {
      const selectorBlock = chunk.trimEnd();
      if (selectorBlock && !selectorBlock.startsWith('/*') && selectorBlock.includes('html[')) {
        out += `${patchRuleSelectors(selectorBlock)} {`;
      } else {
        out += `${chunk}{`;
      }
    } else {
      out += `${chunk}{`;
    }
  }
  return out.replace(/\{\{/g, '{');
}

function patchCssSimple(css) {
  return css.replace(/(^|\n)([^@\n/][^{]*)\{/g, (full, prefix, selectorBlock) => {
    if (!selectorBlock.includes('html[') && !selectorBlock.includes('html:not(')) {
      return full;
    }
    if (selectorBlock.includes('.seashell-crt.seashell-ui-style-')) {
      return full;
    }
    return `${prefix}${patchRuleSelectors(selectorBlock)} {`;
  });
}

for (const file of files) {
  let css = fs.readFileSync(file, 'utf8');
  if (css.includes('.seashell-crt.seashell-ui-style-calm .seashell-crt')) {
    css = css
      .replace(/, \.seashell-crt\.seashell-ui-style-\w+[^,{]+/g, '')
      .replace(/,,+/g, ',')
      .replace(/,\s*,/g, ',')
      .replace(/,\s*\{/g, ' {')
      .replace(/\.ss-practice-tur\b/g, '.ss-practice-turn');
  }
  fs.writeFileSync(file, patchCssSimple(css));
  console.log('patched', file);
}
