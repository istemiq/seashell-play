const FREE_KEY = 'seashell_practice_session_free';



export function loadFreePracticeSessionId() {

  if (typeof sessionStorage === 'undefined') return null;

  const raw = sessionStorage.getItem(FREE_KEY);

  const id = parseInt(String(raw ?? ''), 10);

  return Number.isFinite(id) && id > 0 ? id : null;

}



export function saveFreePracticeSessionId(sessionId) {

  if (typeof sessionStorage === 'undefined') return;

  if (sessionId) sessionStorage.setItem(FREE_KEY, String(sessionId));

  else sessionStorage.removeItem(FREE_KEY);

}



export function expertPracticeSessionKey(expertId) {

  return `seashell_practice_session_expert_${expertId}`;

}



export function loadExpertPracticeSessionId(expertId) {

  if (typeof sessionStorage === 'undefined' || !expertId) return null;

  const raw = sessionStorage.getItem(expertPracticeSessionKey(expertId));

  const id = parseInt(String(raw ?? ''), 10);

  return Number.isFinite(id) && id > 0 ? id : null;

}



export function saveExpertPracticeSessionId(expertId, sessionId) {

  if (typeof sessionStorage === 'undefined' || !expertId) return;

  if (sessionId) sessionStorage.setItem(expertPracticeSessionKey(expertId), String(sessionId));

  else sessionStorage.removeItem(expertPracticeSessionKey(expertId));

}



export function wordPracticeSessionKey(wordId) {

  return `seashell_practice_session_word_${wordId}`;

}



export function loadWordPracticeSessionId(wordId) {

  if (typeof sessionStorage === 'undefined' || wordId == null) return null;

  const raw = sessionStorage.getItem(wordPracticeSessionKey(wordId));

  const id = parseInt(String(raw ?? ''), 10);

  return Number.isFinite(id) && id > 0 ? id : null;

}



export function saveWordPracticeSessionId(wordId, sessionId) {

  if (typeof sessionStorage === 'undefined' || wordId == null) return;

  if (sessionId) sessionStorage.setItem(wordPracticeSessionKey(wordId), String(sessionId));

  else sessionStorage.removeItem(wordPracticeSessionKey(wordId));

}



export {

  loadPatternPracticeSessionId,

  savePatternPracticeSessionId,

} from './practicePatternHistory.js';


