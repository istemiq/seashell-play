import { Text } from './Ui.jsx';
import { splitDictGlossLine } from '../utils/dictGloss.js';

export function DictGlossText({ gloss, className = 'ss-mt-6' }) {
  const { study, translation } = splitDictGlossLine(gloss);
  if (!study && !translation) return null;

  if (!translation) {
    return (
      <Text className={`${className} ss-dict-study-text`} dir="auto">
        {study}
      </Text>
    );
  }

  return (
    <Text className={className} dir="auto">
      <span className="ss-dict-study-text">{study}</span>
      <span className="ss-dict-gloss-sep"> — </span>
      <span className="ss-dict-translation-text">{translation}</span>
    </Text>
  );
}
