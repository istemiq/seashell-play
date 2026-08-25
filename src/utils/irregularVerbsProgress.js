const STORAGE_KEY = 'seashell_irregular_verbs_v1';

function readRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { savedIds: [], dictWordIdByVerbId: {} };
    const parsed = JSON.parse(raw);
    return {
      savedIds: Array.isArray(parsed.savedIds) ? parsed.savedIds.map(Number).filter(Number.isFinite) : [],
      dictWordIdByVerbId:
        parsed.dictWordIdByVerbId && typeof parsed.dictWordIdByVerbId === 'object'
          ? parsed.dictWordIdByVerbId
          : {},
    };
  } catch {
    return { savedIds: [], dictWordIdByVerbId: {} };
  }
}

function writeRaw(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadSavedVerbIds() {
  return readRaw().savedIds;
}

export function saveVerbId(id) {
  const n = Number(id);
  if (!Number.isFinite(n)) return;
  const data = readRaw();
  if (!data.savedIds.includes(n)) {
    data.savedIds = [n, ...data.savedIds];
    writeRaw(data);
  }
}

export function getDictWordIdForVerb(verbId) {
  const n = Number(verbId);
  const data = readRaw();
  const v = data.dictWordIdByVerbId[String(n)];
  const wordId = v != null ? Number(v) : NaN;
  return Number.isFinite(wordId) && wordId > 0 ? wordId : null;
}

export function setDictWordIdForVerb(verbId, wordId) {
  const vid = Number(verbId);
  const wid = Number(wordId);
  if (!Number.isFinite(vid) || !Number.isFinite(wid) || wid <= 0) return;
  const data = readRaw();
  data.dictWordIdByVerbId[String(vid)] = wid;
  if (!data.savedIds.includes(vid)) {
    data.savedIds = [vid, ...data.savedIds];
  }
  writeRaw(data);
}

export function clearDictWordIdForVerb(verbId) {
  const vid = Number(verbId);
  if (!Number.isFinite(vid)) return;
  const data = readRaw();
  delete data.dictWordIdByVerbId[String(vid)];
  writeRaw(data);
}

export function removeSavedVerbId(id) {
  const n = Number(id);
  const data = readRaw();
  data.savedIds = data.savedIds.filter((x) => x !== n);
  delete data.dictWordIdByVerbId[String(n)];
  writeRaw(data);
}
