import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReactReader } from 'react-reader';

import { PracticeDictionaryAddBar } from '../components/PracticeDictionaryAddBar.jsx';
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

export function ReaderPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [location, setLocation] = useState(() => localStorage.getItem('epub-location') || 0);
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedText, setSelectedText] = useState(null);
  const [adding, setAdding] = useState(false);
  const [addedText, setAddedText] = useState(null);
  const [snackbar, setSnackbar] = useState(null);
  const renditionRef = useRef(null);
  const textAreaRef = useRef(null);

  const resetReaderState = () => {
    setSelectedText(null);
    setAddedText(null);
    setAdding(false);
    setError(null);
    setSnackbar(null);
    renditionRef.current = null;
  };

  const handleUploadBook = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setLoading(true);
    resetReaderState();
    try {
      const ext = fileExtension(file.name);
      if (ext === 'epub') {
        const data = await file.arrayBuffer();
        setBook({ kind: 'epub', data, name: file.name });
      } else {
        const raw = await file.text();
        if (looksLikeBinary(raw)) {
          setError(t('reader.fileFormat'));
          return;
        }
        let text;
        if (ext === 'fb2' || raw.trimStart().startsWith('<?xml')) {
          text = fb2ToText(raw);
        } else if (ext === 'html' || ext === 'htm') {
          text = htmlToText(raw);
        } else {
          text = raw;
        }
        if (!text || !text.trim()) {
          setError(t('reader.fileFormat'));
          return;
        }
        setBook({ kind: 'text', text, name: file.name });
      }
    } catch {
      setError(t('reader.uploadError'));
    } finally {
      setLoading(false);
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
      }
    };
    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, [book?.kind]);

  const handleEpubLocationChanged = (cfi) => {
    setLocation(cfi);
    localStorage.setItem('epub-location', cfi);
  };

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

  const handleBack = () => {
    if (book) {
      setBook(null);
      setLocation(0);
      resetReaderState();
    } else {
      navigate('/');
    }
  };

  const tooLong = (selectedText?.length ?? 0) > MAX_SELECTION_LEN;

  return (
    <Panel>
      <PanelHeader before={<PanelHeaderBack onClick={handleBack} />}>
        {book ? book.name : t('reader.title')}
      </PanelHeader>

      {book ? (
        <>
          <Group>
            <Box style={{ padding: '4px 0' }}>
              {selectedText || adding || addedText ? (
                <>
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
                  {tooLong && selectedText ? (
                    <Footnote style={{ color: 'var(--ss-color-text-negative, #e64646)' }}>
                      {t('reader.selectionTooLong', { max: MAX_SELECTION_LEN })}
                    </Footnote>
                  ) : null}
                </>
              ) : (
                <Footnote>{t('reader.selectText')}</Footnote>
              )}
            </Box>
          </Group>

          {book.kind === 'epub' ? (
            <div style={{ height: 'calc(100vh - 160px)' }}>
              <ReactReader
                url={book.data}
                location={location}
                locationChanged={handleEpubLocationChanged}
                getRendition={(r) => {
                  renditionRef.current = r;
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
              ref={textAreaRef}
              style={{
                padding: '8px 20px 48px',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.65,
                fontSize: 16,
                userSelect: 'text',
                WebkitUserSelect: 'text',
                overflowWrap: 'anywhere',
              }}
            >
              {book.text}
            </div>
          )}
        </>
      ) : (
        <>
          {loading && (
            <Box className="ss-center-load">
              <Spinner size="l" />
            </Box>
          )}

          {error && (
            <Group>
              <Box>
                <Text style={{ color: 'var(--ss-color-text-negative, #e64646)' }}>{error}</Text>
              </Box>
            </Group>
          )}

          <Group>
            <Cell>
              <input
                type="file"
                accept=".epub,.fb2,.txt,.md,.markdown,.html,.htm,.srt,.csv,.json,text/*"
                onChange={(e) => void handleUploadBook(e)}
                style={{ display: 'none' }}
                id="reader-upload"
              />
              <label htmlFor="reader-upload">
                <Button size="l" onClick={() => document.getElementById('reader-upload').click()}>
                  {t('reader.uploadBook')}
                </Button>
              </label>
            </Cell>
          </Group>

          <Group>
            <Box>
              <Text style={{ textAlign: 'center' }}>{t('reader.instructions')}</Text>
            </Box>
          </Group>
        </>
      )}

      {snackbar}
    </Panel>
  );
}
