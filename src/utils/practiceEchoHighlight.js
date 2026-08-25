function normalizeWord(w) {
  return String(w ?? '')
    .toLowerCase()
    .replace(/^[^\w']+|[^\w']+$/g, '');
}

/** Индексы слов в b, входящие в LCS с a (по normalizeWord). */
function lcsMatchedIndicesInB(a, b) {
  const n = a.length;
  const m = b.length;
  const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const matched = new Set();
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      matched.add(j - 1);
      i -= 1;
      j -= 1;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i -= 1;
    } else {
      j -= 1;
    }
  }
  return matched;
}

/**
 * Разбивает echo на куски; changed=true — слово изменено/добавлено относительно userText.
 * @returns {{ text: string, changed: boolean }[]}
 */
export function highlightEchoDiff(original, echo) {
  const echoStr = String(echo ?? '');
  if (!echoStr.trim()) return [];

  const origWords = (String(original ?? '').match(/\S+/g) || []).map(normalizeWord).filter(Boolean);
  const echoWords = (echoStr.match(/\S+/g) || []).map(normalizeWord).filter(Boolean);

  if (!origWords.length) {
    return echoStr.match(/\S+|\s+/g)?.map((text) => ({ text, changed: false })) ?? [{ text: echoStr, changed: false }];
  }

  const matched = lcsMatchedIndicesInB(origWords, echoWords);

  const parts = [];
  const re = /\S+|\s+/g;
  let wordIdx = 0;
  let m;
  while ((m = re.exec(echoStr)) !== null) {
    const chunk = m[0];
    if (/^\s+$/.test(chunk)) {
      parts.push({ text: chunk, changed: false });
    } else {
      parts.push({ text: chunk, changed: !matched.has(wordIdx) });
      wordIdx += 1;
    }
  }
  return parts;
}
