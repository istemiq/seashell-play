import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReactReader } from 'react-reader';

import { PracticeDictionaryAddBar } from '../components/PracticeDictionaryAddBar.jsx';
import { ReaderWordPopup } from '../components/ReaderWordPopup.jsx';
import {
  Box,
  Button,
  Cell,
  Footnote,
  Group,
  Panel,
  PanelHeader,
  PanelHeaderBack,
  Snackbar,
  Spinner,
  Text,
} from '../components/Ui.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';
import * as dictionaryApi from '../api/dictionaryApi.js';
import { fetchCatalogBook, defineWord, listMyBooks, fetchMyBook, deleteMyBook } from '../api/readerApi.js';
import { resolveContentLocaleForApi } from '../utils/contentLocale.js';
import { setCustomBackHandler } from '../utils/backNavigation.js';
import { listBooks, getBook, saveBook, deleteBook } from '../utils/bookStorage.js';
import { getWebApp } from '../platform/telegramApp.js';
import { READER_CATALOG } from '../data/readerCatalog.js';

/** Сервер принимает word до 200 символов (POST /api/words). */
const MAX_SELECTION_LEN = 200;
const TEXT_BLOCK_TAGS = new Set([
  'p', 'v', 'title', 'subtitle', 'text-author',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'li', 'blockquote', 'pre', 'td', 'th',
]);

function fileExtension(name) {
  const idx = String(name || '').lastIndexOf('.');
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : '';
}

/** Грубая проверка: NUL-байты или много control-символов → это не текст. */
function looksLikeBinary(text) {
  const sample = text.slice(0, 8192);
  if (!sample.length) return false;
  let bad = 0;
  for (const ch of sample) {
    const c = ch.charCodeAt(0);
    if (c === 0) return true;
    if (c < 9 || (c > 13 && c < 32)) bad += 1;
  }
  return bad / sample.length > 0.02;
}

/** FB2 (FictionBook XML) → текст: параграфы, стихи, заголовки в порядке документа. */
function fb2ToText(xmlText) {
  const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
  if (doc.querySelector('parsererror')) return null;
  const body = doc.getElementsByTagName('body')[0];
  if (!body) return null;
  const parts = [];
  const all = body.getElementsByTagName('*');
  for (const el of all) {
    if (!TEXT_BLOCK_TAGS.has(el.localName)) continue;
    const line = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (line) parts.push(line);
  }
  return parts.length ? parts.join('\n\n') : null;
}

/** Слово под точкой касания/клика: Range вокруг границ слова → {word, rect}. */
function wordAtPoint(doc, x, y) {
  let node = null;
  let offset = 0;
  if (doc.caretRangeFromPoint) {
    const r = doc.caretRangeFromPoint(x, y);
    if (!r) return null;
    node = r.startContainer;
    offset = r.startOffset;
  } else if (doc.caretPositionFromPoint) {
    const p = doc.caretPositionFromPoint(x, y);
    if (!p) return null;
    node = p.offsetNode;
    offset = p.offset;
  }
  if (!node || node.nodeType !== 3) return null;
  const text = node.data;
  const isWordChar = (ch) => /[\p{L}\p{N}'’-]/u.test(ch);
  let s = offset;
  let e = offset;
  while (s > 0 && isWordChar(text[s - 1])) s -= 1;
  while (e < text.length && isWordChar(text[e])) e += 1;
  const word = text.slice(s, e).replace(/^['’-]+|['’-]+$/g, '');
  if (!word) return null;
  const range = doc.createRange();
  range.setStart(node, s);
  range.setEnd(node, s + word.length);
  return { word, rect: range.getBoundingClientRect() };
}

/** HTML → текст по блочным элементам; без блоков — весь textContent. */
function htmlToText(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const root = doc.body;
  if (!root) return null;
  const parts = [];
  for (const el of root.querySelectorAll([...TEXT_BLOCK_TAGS].join(','))) {
    const line = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (line) parts.push(line);
  }
  if (parts.length) return parts.join('\n\n');
  const fallback = (root.textContent || '').trim();
  return fallback || null;
}

/** Собирает book-объект из сырых байт (upload input или серверный файл). */
function buildBookFromRaw(name, arrayBuffer) {
  const ext = fileExtension(name);
  if (ext === 'epub') {
    return { kind: 'epub', data: arrayBuffer, name };
  }
  const raw = new TextDecoder().decode(arrayBuffer);
  if (looksLikeBinary(raw)) return null;
  let text;
  if (ext === 'fb2' || raw.trimStart().startsWith('<?xml')) {
    text = fb2ToText(raw);
  } else if (ext === 'html' || ext === 'htm') {
    text = htmlToText(raw);
  } else {
    text = raw;
  }
  if (!text || !text.trim()) return null;
  return { kind: 'text', text, name };
}

export function ReaderPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [location, setLocation] = useState(0);
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(false);
  const [catalogId, setCatalogId] = useState(null);
  const [error, setError] = useState(null);
  const [selectedText, setSelectedText] = useState(null);
  const [adding, setAdding] = useState(false);
  const [addedText, setAddedText] = useState(null);
  const [snackbar, setSnackbar] = useState(null);
  const [lookup, setLookup] = useState(null);
  const [lookupAdding, setLookupAdding] = useState(false);
  const [myBooks, setMyBooks] = useState([]);
  const [immersive, setImmersive] = useState(false);
  // В Telegram Desktop (tdesktop/macos) file input в Mini App не открывает пикер —
  // прячем кнопку, загрузка там идёт через отправку файла боту.
  const hideFileInput = ['tdesktop', 'macos'].includes(getWebApp()?.platform ?? '');
  const renditionRef = useRef(null);
  const textAreaRef = useRef(null);
  const contentRef = useRef(null);

  const resetReaderState = () => {
    setSelectedText(null);
    setAddedText(null);
    setAdding(false);
    setError(null);
    setSnackbar(null);
    renditionRef.current = null;
  };

  const refreshMyBooks = useCallback(() => {
    const local = listBooks()
      .then((rows) => rows.map((b) => ({ ...b, source: 'local' })))
      .catch(() => []);
    const remote = listMyBooks()
      .then((rows) => rows.map((b) => ({ ...b, source: 'server', kind: fileExtension(b.name) })))
      .catch(() => []);
    Promise.all([local, remote]).then(([l, r]) => setMyBooks([...l, ...r]));
  }, []);

  useEffect(refreshMyBooks, [refreshMyBooks]);

  const persistBook = (b) => {
    saveBook({ name: b.name, kind: b.kind, data: b.data, text: b.text })
      .then((id) => {
        if (id) refreshMyBooks();
      })
      .catch(() => {});
  };

  const handleUploadBook = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setLoading(true);
    resetReaderState();
    try {
      const b = buildBookFromRaw(file.name, await file.arrayBuffer());
      if (!b) {
        setError(t('reader.fileFormat'));
        return;
      }
      setBook(b);
      persistBook(b);
    } catch {
      setError(t('reader.uploadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMyBook = async (entry) => {
    if (loading) return;
    setLoading(true);
    resetReaderState();
    try {
      if (entry.source === 'server') {
        const { data } = await fetchMyBook(entry.id);
        const b = buildBookFromRaw(entry.name, data);
        if (!b) {
          setError(t('reader.fileFormat'));
          return;
        }
        setBook(b);
        return;
      }
      const b = await getBook(entry.id);
      if (!b) return;
      setBook({
        kind: b.kind,
        name: b.name,
        src: null,
        ...(b.kind === 'epub' ? { data: b.data } : { text: b.text }),
      });
    } catch {
      setError(t('reader.fileFormat'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMyBook = async (e, entry) => {
    e.stopPropagation?.();
    try {
      if (entry.source === 'server') {
        await deleteMyBook(entry.id);
      } else {
        await deleteBook(entry.id);
      }
      refreshMyBooks();
    } catch {
      /* ignore */
    }
  };

  const handleOpenCatalogBook = async (entry) => {
    if (loading) return;
    setLoading(true);
    setCatalogId(entry.id);
    resetReaderState();
    try {
      const { data, contentType } = await fetchCatalogBook(entry.id);
      const name = `${entry.title} — ${entry.author}`;
      if (contentType.includes('epub')) {
        setBook({ kind: 'epub', data, name, src: entry.lang });
      } else {
        const text = new TextDecoder('utf-8').decode(data);
        if (!text.trim() || looksLikeBinary(text)) {
          setError(t('reader.fileFormat'));
          return;
        }
        setBook({ kind: 'text', text, name, src: entry.lang });
      }
    } catch {
      setError(t('reader.downloadError'));
    } finally {
      setLoading(false);
      setCatalogId(null);
    }
  };

  // Выделение в plain-text режиме (drag-select мышью или пальцем).
  useEffect(() => {
    if (book?.kind !== 'text') return undefined;
    const onSelectionChange = () => {
      const sel = window.getSelection();
      // Коллапс выделения (клик по кнопке «В словарь») не сбрасываем —
      // иначе кнопка исчезнет до onClick. Сброс — по новой выделенной области или крестику.
      if (!sel || sel.isCollapsed) return;
      const node = sel.anchorNode;
      if (!textAreaRef.current || !node || !textAreaRef.current.contains(node)) return;
      const text = sel.toString().replace(/\s+/g, ' ').trim();
      if (text) {
        setSelectedText(text);
        setAddedText(null);
        setLookup(null);
      }
    };
    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, [book?.kind]);

  // Позиция чтения — per book (имя + размер как ключ)
  const posKey = book
    ? `reader-pos:${book.name}:${book.data?.byteLength ?? book.text?.length ?? 0}`
    : null;

  const handleEpubLocationChanged = (cfi) => {
    setLocation(cfi);
    if (posKey) localStorage.setItem(posKey, cfi);
  };

  // Восстановить позицию при открытии книги
  useEffect(() => {
    if (!posKey) return;
    if (book?.kind === 'epub') {
      setLocation(localStorage.getItem(posKey) || 0);
    } else if (book?.kind === 'text' && contentRef.current) {
      const saved = localStorage.getItem(`${posKey}-scroll`);
      if (saved) contentRef.current.scrollTop = parseInt(saved, 10);
    }
  }, [posKey, book?.kind]);

  const handleEpubTextSelected = (cfiRange, contents) => {
    let text = '';
    try {
      text = renditionRef.current?.getRange(cfiRange)?.toString() || '';
    } catch {
      /* ignore */
    }
    if (!text) {
      text = contents?.window?.getSelection()?.toString() || '';
    }
    text = text.replace(/\s+/g, ' ').trim();
    if (text) {
      setSelectedText(text);
      setAddedText(null);
      setLookup(null);
    }
  };

  const clearNativeSelection = () => {
    try {
      window.getSelection()?.removeAllRanges();
      renditionRef.current?.getContents?.()?.forEach?.((c) => {
        c?.window?.getSelection()?.removeAllRanges();
      });
    } catch {
      /* ignore */
    }
  };

  const handleAddToDictionary = async () => {
    const word = selectedText;
    if (!word || adding || word.length > MAX_SELECTION_LEN) return;
    setAdding(true);
    try {
      await dictionaryApi.addWord(word);
      setAddedText(word);
      setSelectedText(null);
      clearNativeSelection();
    } catch {
      setSnackbar(
        <Snackbar onClose={() => setSnackbar(null)} duration={3000}>
          {t('errors.dictAddFailed')}
        </Snackbar>,
      );
    } finally {
      setAdding(false);
    }
  };

  const bookSrcRef = useRef(null);
  bookSrcRef.current = book?.src ?? null;

  const openLookup = (hit) => {
    if (!hit?.word) return;
    const w = hit.word;
    setLookup({ word: w, rect: hit.rect, loading: true, data: null, error: null, addedWord: null });
    // dst — язык словарных карточек (не UI-локаль): попап и словарь говорят на одном языке
    defineWord(w, { src: bookSrcRef.current, dst: resolveContentLocaleForApi() })
      .then((data) =>
        setLookup((cur) => (cur?.word === w ? { ...cur, loading: false, data } : cur)),
      )
      .catch(() =>
        setLookup((cur) => (cur?.word === w ? { ...cur, loading: false, error: true } : cur)),
      );
  };

  /** На таче браузер часто сам выделяет слово по тапу — берём его как слово для попапа. */
  const singleWordSelection = (sel) => {
    if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
    const t = sel.toString().trim();
    if (!t || t.length > MAX_SELECTION_LEN || /\s/.test(t)) return null;
    return { word: t, rect: sel.getRangeAt(0).getBoundingClientRect() };
  };

  const handleTextTap = (e) => {
    // drag-select фразы идёт в бар «В словарь», одиночный тап — в попап словаря
    const autoSel = singleWordSelection(window.getSelection());
    if (autoSel) {
      openLookup(autoSel);
      return;
    }
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) return;
    const hit = wordAtPoint(document, e.clientX, e.clientY);
    if (hit) openLookup(hit);
  };

  const handleEpubIframeClick = (e, doc, frameEl) => {
    const frameRect = frameEl?.getBoundingClientRect?.();
    const toViewport = (r) =>
      frameRect
        ? {
            left: r.left + frameRect.left,
            right: r.right + frameRect.left,
            top: r.top + frameRect.top,
            bottom: r.bottom + frameRect.top,
          }
        : r;
    const autoSel = singleWordSelection(doc.getSelection?.());
    if (autoSel) {
      openLookup({ word: autoSel.word, rect: toViewport(autoSel.rect) });
      return;
    }
    const hit = wordAtPoint(doc, e.clientX, e.clientY);
    if (!hit) return;
    openLookup({ word: hit.word, rect: toViewport(hit.rect) });
  };

  const handlePopupAdd = async () => {
    const word = lookup?.data?.word || lookup?.word;
    if (!word || lookupAdding) return;
    setLookupAdding(true);
    try {
      await dictionaryApi.addWord(word);
      setLookup((cur) => (cur ? { ...cur, addedWord: word } : cur));
    } catch {
      setSnackbar(
        <Snackbar onClose={() => setSnackbar(null)} duration={3000}>
          {t('errors.dictAddFailed')}
        </Snackbar>,
      );
    } finally {
      setLookupAdding(false);
    }
  };

  const exitImmersive = useCallback(() => {
    setImmersive(false);
    try {
      const wa = getWebApp();
      if (typeof wa?.exitFullscreen === 'function' && wa.isFullscreen) wa.exitFullscreen();
      if (document.fullscreenElement) document.exitFullscreen?.();
    } catch {
      /* ignore */
    }
  }, []);

  const toggleImmersive = useCallback(() => {
    if (immersive) {
      exitImmersive();
      return;
    }
    setImmersive(true);
    try {
      const wa = getWebApp();
      // Telegram Bot API 8.0+: нативный фулскрин прячет шапку клиента (мобильные).
      if (typeof wa?.requestFullscreen === 'function') {
        wa.requestFullscreen();
      } else if (document.fullscreenEnabled) {
        document.documentElement.requestFullscreen?.();
      } else {
        wa?.expand?.();
      }
    } catch {
      /* ignore */
    }
  }, [immersive, exitImmersive]);

  // Если пользователь вышел из нативного фулскрина системно — сбросить состояние.
  useEffect(() => {
    const wa = getWebApp();
    const off = () => {
      if (!document.fullscreenElement && !wa?.isFullscreen) setImmersive(false);
    };
    document.addEventListener('fullscreenchange', off);
    try {
      wa?.onEvent?.('fullscreen_changed', off);
      wa?.onEvent?.('fullscreen_failed', off);
    } catch {
      /* ignore */
    }
    return () => {
      document.removeEventListener('fullscreenchange', off);
      try {
        wa?.offEvent?.('fullscreen_changed', off);
        wa?.offEvent?.('fullscreen_failed', off);
      } catch {
        /* ignore */
      }
    };
  }, []);

  const handleBack = useCallback(() => {
    if (immersive) {
      exitImmersive();
    } else if (book) {
      setBook(null);
      setLocation(0);
      resetReaderState();
    } else {
      navigate('/');
    }
  }, [immersive, book, navigate, exitImmersive]);

  // Системный «назад»: закрыть открытую книгу → каталог; иначе → главная.
  useEffect(() => {
    setCustomBackHandler(handleBack);
    return () => setCustomBackHandler(null);
  }, [handleBack]);

  const handleScroll = () => {
    setLookup(null);
    if (contentRef.current && posKey) {
      localStorage.setItem(`${posKey}-scroll`, String(contentRef.current.scrollTop));
    }
  };

  const tooLong = (selectedText?.length ?? 0) > MAX_SELECTION_LEN;
  const barActive = Boolean(selectedText || adding || addedText);

  return (
    <Panel className={book ? 'ss-panel--reading' : ''}>
      {!immersive && (
        <PanelHeader before={<PanelHeaderBack onClick={handleBack} />}>
          {book ? book.name : t('reader.title')}
        </PanelHeader>
      )}

      {book ? (
        <>
          <div className={`ss-reader${immersive ? ' ss-reader--immersive' : ''}`}>
            <button
              type="button"
              className="ss-reader__fs"
              onClick={toggleImmersive}
              aria-label={t('reader.fullscreen')}
              title={t('reader.fullscreen')}
            >
              {immersive ? '⤡' : '⤢'}
            </button>
            {book.kind === 'epub' ? (
              <div className="ss-reader__epub">
                <ReactReader
                  url={book.data}
                  location={location}
                  locationChanged={handleEpubLocationChanged}
                  getRendition={(r) => {
                    renditionRef.current = r;
                    r.hooks?.content?.register?.((contents) => {
                      const doc = contents.document;
                      doc?.addEventListener('click', (e) =>
                        handleEpubIframeClick(e, doc, doc.defaultView?.frameElement),
                      );
                    });
                  }}
                  handleTextSelected={handleEpubTextSelected}
                  loadingView={
                    <Box className="ss-center-load">
                      <Spinner size="l" />
                    </Box>
                  }
                />
              </div>
            ) : (
              <div
                ref={(el) => {
                  textAreaRef.current = el;
                  contentRef.current = el;
                }}
                onScroll={handleScroll}
                onClick={handleTextTap}
                className="ss-reader__text"
              >
                {book.text}
              </div>
            )}

            <div className="ss-reader-bar">
              <div className="ss-reader-bar__in">
                {barActive ? (
                  <>
                    <div className="ss-reader-bar__row">
                      <PracticeDictionaryAddBar
                        selectedWord={selectedText}
                        loading={adding}
                        addedWord={addedText}
                        onAdd={handleAddToDictionary}
                        disabled={tooLong}
                      />
                      {selectedText && !adding ? (
                        <Button
                          size="s"
                          mode="secondary"
                          onClick={() => {
                            setSelectedText(null);
                            clearNativeSelection();
                          }}
                        >
                          {t('common.cancel')}
                        </Button>
                      ) : null}
                    </div>
                    {tooLong && selectedText ? (
                      <Footnote style={{ color: 'var(--ss-color-text-negative, #e64646)' }}>
                        {t('reader.selectionTooLong', { max: MAX_SELECTION_LEN })}
                      </Footnote>
                    ) : null}
                  </>
                ) : immersive ? null : (
                  <Footnote>{t('reader.selectText')}</Footnote>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {loading && (
            <Box className="ss-center-load">
              <Spinner size="l" />
              <Footnote>{t('reader.downloading')}</Footnote>
            </Box>
          )}

          {error && (
            <Group>
              <Box>
                <Text style={{ color: 'var(--ss-color-text-negative, #e64646)' }}>{error}</Text>
              </Box>
            </Group>
          )}

          {myBooks.length ? (
            <Group header={t('reader.myBooks')}>
              {myBooks.map((entry) => (
                <Cell
                  key={entry.id}
                  subtitle={entry.kind.toUpperCase()}
                  after={
                    <button
                      type="button"
                      className="ss-reader-delete"
                      aria-label={t('common.delete')}
                      onClick={(e) => void handleDeleteMyBook(e, entry)}
                    >
                      ×
                    </button>
                  }
                  onClick={() => void handleOpenMyBook(entry)}
                  disabled={loading}
                >
                  {entry.name}
                </Cell>
              ))}
            </Group>
          ) : null}

          <Group header={t('reader.library')}>
            {READER_CATALOG.map((entry) => (
              <Cell
                key={entry.id}
                subtitle={entry.author}
                after={
                  catalogId === entry.id ? (
                    <Spinner size="s" />
                  ) : (
                    <span className="ss-reader-lang">{entry.lang.toUpperCase()}</span>
                  )
                }
                onClick={() => void handleOpenCatalogBook(entry)}
                disabled={loading}
              >
                {entry.title}
              </Cell>
            ))}
          </Group>

          <Group header={t('reader.uploadTitle')}>
            {!hideFileInput && (
              <div className="ss-reader-upload-btn">
                <Button size="l" stretched>
                  {t('reader.uploadBook')}
                </Button>
                <input
                  type="file"
                  accept=".epub,.fb2,.txt,.md,.markdown,.html,.htm,.srt,.csv,.json,text/*"
                  onChange={(e) => void handleUploadBook(e)}
                  className="ss-reader-upload-btn__input"
                />
              </div>
            )}
            <Box>
              <Footnote>{t('reader.botUploadHint')}</Footnote>
            </Box>
          </Group>

          <Group>
            <Box>
              <Text style={{ textAlign: 'center' }}>{t('reader.instructions')}</Text>
            </Box>
          </Group>
        </>
      )}

      {lookup ? (
        <ReaderWordPopup
          anchorRect={lookup.rect}
          word={lookup.word}
          loading={lookup.loading}
          data={lookup.data}
          error={lookup.error}
          adding={lookupAdding}
          addedWord={lookup.addedWord}
          onAdd={() => void handlePopupAdd()}
          onClose={() => setLookup(null)}
        />
      ) : null}

      {snackbar}
    </Panel>
  );
}
