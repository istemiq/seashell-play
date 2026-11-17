import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button, Input, Panel, PanelHeader, PanelHeaderBack } from '../components/Ui.jsx';
import { ListenTtsButton } from '../components/ListenTtsButton.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';
import { useEscapeBack } from '../hooks/useEscapeBack.js';
import { useNavigateBackOrHome } from '../utils/useNavigateBackOrHome.js';
import { isEnglishLearnModule, useLearnLocale } from '../hooks/useLearnLocale.js';
import { speakEnglish } from '../utils/tts.js';
import { PRONOUN_STEPS_EN, PRONOUN_WORDS_EN } from '../data/pronounTrainerEn.js';

const PROGRESS_KEY = 'seashell.trainer.pronouns.en.choiceDone';
const WORDS_KEY = 'seashell.trainer.pronouns.en.wordsDone';

function loadChoiceDone() {
  try {
    return localStorage.getItem(PROGRESS_KEY) === '1';
  } catch {
    return false;
  }
}

function saveChoiceDone() {
  try {
    localStorage.setItem(PROGRESS_KEY, '1');
  } catch {
    /* private mode */
  }
}

function loadWordsDone() {
  try {
    return localStorage.getItem(WORDS_KEY) === '1' || localStorage.getItem(PROGRESS_KEY) === '1';
  } catch {
    return false;
  }
}

function saveWordsDone() {
  try {
    localStorage.setItem(WORDS_KEY, '1');
  } catch {
    /* private mode */
  }
}

function shuffledPair(options) {
  const pair = [...options];
  if (Math.random() > 0.5) pair.reverse();
  return pair;
}

/**
 * Тренажёр местоимений: уровень 1 — выбор из пары с инсайтом,
 * уровень 2 — самостоятельный ввод слова.
 */
export function PronounTrainerPage() {
  const navigate = useNavigate();
  const goBackOrHome = useNavigateBackOrHome();
  const { t } = useI18n();
  const learnLocale = useLearnLocale();
  useEscapeBack(goBackOrHome);

  const [level, setLevel] = useState('words');
  const [stepIdx, setStepIdx] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [wordsDone, setWordsDone] = useState(loadWordsDone);
  const [choiceDone, setChoiceDone] = useState(loadChoiceDone);
  const [picked, setPicked] = useState(null);
  const [input, setInput] = useState('');
  const [writeStatus, setWriteStatus] = useState('idle'); // idle | wrong | right

  const step = PRONOUN_STEPS_EN[stepIdx];
  const word = PRONOUN_WORDS_EN[wordIdx];
  const wordImageSrc = `/trainer/pronouns/${word.id}.png`;
  const isLastWord = wordIdx === PRONOUN_WORDS_EN.length - 1;
  const options = useMemo(() => shuffledPair(step.options), [step]);
  const sentence = (word) => `${step.before}${word || '___'}${step.after}`;
  const targetSentence = sentence(step.target);
  const isLast = stepIdx === PRONOUN_STEPS_EN.length - 1;

  const resetStep = () => {
    setPicked(null);
    setInput('');
    setWriteStatus('idle');
  };

  const pick = (opt) => {
    setPicked(opt);
    void speakEnglish(sentence(opt.word)).catch(() => {});
  };

  const checkInput = () => {
    const guess = input.trim().toLowerCase();
    if (!guess) return;
    if (guess === step.target.toLowerCase()) {
      setWriteStatus('right');
      void speakEnglish(targetSentence).catch(() => {});
    } else {
      setWriteStatus('wrong');
    }
  };

  const nextStep = () => {
    if (isLast) {
      if (level === 'choice' && !choiceDone) {
        saveChoiceDone();
        setChoiceDone(true);
      }
      setStepIdx(0);
      setLevel('summary');
      resetStep();
      return;
    }
    setStepIdx(stepIdx + 1);
    resetStep();
  };

  const nextWord = () => {
    if (isLastWord) {
      if (!wordsDone) {
        saveWordsDone();
        setWordsDone(true);
      }
      setStepIdx(0);
      setWordIdx(0);
      setLevel('choice');
      resetStep();
      return;
    }
    setWordIdx(wordIdx + 1);
    setRevealed(false);
    setImgFailed(false);
  };

  const prevWord = () => {
    if (wordIdx === 0) return;
    setWordIdx(wordIdx - 1);
    setRevealed(false);
    setImgFailed(false);
  };

  if (!isEnglishLearnModule(learnLocale)) {
    return (
      <Panel>
        <PanelHeader before={<PanelHeaderBack onClick={() => void goBackOrHome()} />}>
          {t('trainers.pronouns')}
        </PanelHeader>
        <p className="ss-trainer-note">{t('trainers.englishOnly')}</p>
      </Panel>
    );
  }

  return (
    <Panel>
      <PanelHeader before={<PanelHeaderBack onClick={() => navigate('/trainers')} />}>
        {t('trainers.pronouns')}
      </PanelHeader>

      <div className="ss-trainer-levels">
        <button
          type="button"
          className={`ss-trainer-level ${level === 'words' ? 'ss-trainer-level--active' : ''}`}
          onClick={() => setLevel('words')}
        >
          {t('trainer.levelWords')}
        </button>
        <button
          type="button"
          className={`ss-trainer-level ${level === 'choice' || level === 'summary' ? 'ss-trainer-level--active' : ''} ${wordsDone ? '' : 'ss-trainer-level--locked'}`}
          disabled={!wordsDone}
          title={wordsDone ? '' : t('trainer.lockedWordsHint')}
          onClick={() => {
            setLevel('choice');
            resetStep();
          }}
        >
          {t('trainer.levelChoice')}
        </button>
        <button
          type="button"
          className={`ss-trainer-level ${level === 'write' ? 'ss-trainer-level--active' : ''} ${choiceDone ? '' : 'ss-trainer-level--locked'}`}
          disabled={!choiceDone}
          title={choiceDone ? '' : t('trainer.lockedHint')}
          onClick={() => {
            setStepIdx(0);
            setLevel('write');
            resetStep();
          }}
        >
          {t('trainer.levelWrite')}
        </button>
      </div>

      {level === 'words' ? (
        <div className="ss-trainer-body">
          <div className="ss-trainer-meta">
            <span className="ss-trainer-axis">{t('trainer.levelWords')}</span>
            <span className="ss-trainer-progress">
              {wordIdx + 1} / {PRONOUN_WORDS_EN.length}
            </span>
          </div>

          <button
            type="button"
            className="ss-trainer-wordcard"
            onClick={() => setRevealed((v) => !v)}
            aria-expanded={revealed}
          >
            <span className="ss-trainer-wordimg">
              {imgFailed ? (
                <span className="ss-trainer-wordimg--placeholder" aria-hidden="true">
                  {word.word[0].toUpperCase()}
                </span>
              ) : (
                <img
                  src={wordImageSrc}
                  alt=""
                  loading="lazy"
                  onError={() => setImgFailed(true)}
                />
              )}
            </span>
            <span className="ss-trainer-wordtext">{word.word}</span>
            <span className={`ss-trainer-wordtr ${revealed ? 'ss-trainer-wordtr--open' : ''}`}>
              {revealed ? t(word.trKey) : t('trainer.tapToReveal')}
            </span>
          </button>

          <div className="ss-trainer-actions">
            <ListenTtsButton text={word.word} labelKey="dict.listen" mode="secondary" stretched />
            <Button stretched mode="primary" onClick={nextWord}>
              {isLastWord ? t('trainer.finish') : t('trainer.next')}
            </Button>
          </div>
          {wordIdx > 0 ? (
            <button type="button" className="ss-flat-link ss-trainer-back" onClick={prevWord}>
              {t('nav.back')}
            </button>
          ) : null}
        </div>
      ) : level === 'summary' ? (
        <div className="ss-trainer-body">
          <div className="ss-trainer-axis">{t('trainer.doneTitle')}</div>
          <div className="ss-trainer-insight">{t('trainer.doneText')}</div>
          <div className="ss-trainer-actions">
            <Button stretched mode="primary" onClick={() => setLevel('write')}>
              {t('trainer.startWrite')}
            </Button>
            <Button stretched mode="secondary" onClick={() => navigate('/trainers')}>
              {t('trainer.backToTrainers')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="ss-trainer-body">
          <div className="ss-trainer-meta">
            <span className="ss-trainer-axis">{t(step.axis)}</span>
            <span className="ss-trainer-progress">
              {stepIdx + 1} / {PRONOUN_STEPS_EN.length}
            </span>
          </div>
          <div className="ss-trainer-situation">{t(step.situation)}</div>
          <div className="ss-trainer-sentence">
            <span>{step.before}</span>
            <span
              className={[
                'ss-trainer-slot',
                picked || writeStatus === 'right' ? 'ss-trainer-slot--filled' : '',
                writeStatus === 'right' || (picked && picked.word === step.target) ? 'ss-trainer-slot--right' : '',
                writeStatus === 'wrong' || (picked && picked.word !== step.target) ? 'ss-trainer-slot--wrong' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {picked?.word ?? (writeStatus === 'right' ? step.target : input || '___')}
            </span>
            <span>{step.after}</span>
          </div>

          {level === 'choice' ? (
            <div className="ss-trainer-options">
              {options.map((opt) => {
                const cls = picked
                  ? opt.word === step.target
                    ? 'ss-trainer-card--right'
                    : opt.word === picked.word
                      ? 'ss-trainer-card--wrong'
                      : 'ss-trainer-card--dim'
                  : '';
                return (
                  <button
                    key={opt.word}
                    type="button"
                    className={`ss-trainer-card ${cls}`}
                    disabled={Boolean(picked)}
                    onClick={() => pick(opt)}
                  >
                    <span className="ss-trainer-card-word">{opt.word}</span>
                    <span className="ss-trainer-card-tag">{t(opt.tag)}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <form
              className="ss-trainer-write"
              onSubmit={(e) => {
                e.preventDefault();
                checkInput();
              }}
            >
              <Input
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (writeStatus === 'wrong') setWriteStatus('idle');
                }}
                placeholder={t('trainer.typePlaceholder')}
                disabled={writeStatus === 'right'}
              />
              <Button stretched mode="primary" type="submit" disabled={writeStatus === 'right' || !input.trim()}>
                {t('trainer.check')}
              </Button>
            </form>
          )}

          {writeStatus === 'wrong' ? (
            <div className="ss-trainer-hint" role="alert">
              {t('trainer.tryAgain')}
            </div>
          ) : null}

          {picked && picked.word !== step.target ? (
            <div className="ss-trainer-hint ss-trainer-hint--wrong">{t('trainer.notThisOne')}</div>
          ) : null}

          {picked || writeStatus === 'right' ? (
            <div className="ss-trainer-insight">
              {options.map((opt) => (
                <div key={opt.word} className="ss-trainer-insight-row">
                  <span className={`ss-trainer-insight-word ${opt.word === step.target ? 'ss-trainer-insight-word--right' : ''}`}>
                    {opt.word}
                  </span>
                  <span>{t(opt.text)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="ss-trainer-hint">
              {t(level === 'choice' ? 'trainer.tapToSee' : 'trainer.typeToSee')}
            </div>
          )}

          <div className="ss-trainer-actions">
            <ListenTtsButton
              text={targetSentence}
              labelKey="dict.listen"
              mode="secondary"
              stretched
            />
            {picked || writeStatus === 'right' ? (
              <Button stretched mode="primary" onClick={nextStep}>
                {isLast ? t('trainer.finish') : t('trainer.next')}
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </Panel>
  );
}
