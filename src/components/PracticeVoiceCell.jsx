import { Button } from './Ui.jsx';
import {
  practiceVoiceCellDisabled,
  practiceVoiceCellLabel,
  voiceUsesTap,
} from '../utils/practiceVoiceUi.js';

/** Voice answer cell — tap (Web Speech) or hold-to-speak (server STT). */
export function PracticeVoiceCell({
  tr,
  tb,
  voiceMode,
  voiceAvailable,
  transcribing,
  listening,
  voiceBusy,
  blockStart,
  toggleVoice,
  onVoicePointerDown,
  onVoicePointerUp,
  onVoicePointerCancel,
  onVoiceTouchStart,
  onVoiceTouchEnd,
}) {
  const usesTap = voiceUsesTap(voiceMode);
  const usesHold = voiceMode === 'hold';
  const disabled = practiceVoiceCellDisabled({
    voiceAvailable,
    transcribing,
    listening,
    voiceBusy,
    blockStart,
  });

  return (
    <Button
      mode="secondary"
      stretched
      className="ss-practice-voice-cell"
      disabled={disabled}
      onClick={usesTap ? toggleVoice : undefined}
      onPointerDown={usesHold && !disabled ? onVoicePointerDown : undefined}
      onPointerUp={usesHold && !disabled ? onVoicePointerUp : undefined}
      onPointerLeave={usesHold && !disabled ? onVoicePointerUp : undefined}
      onPointerCancel={usesHold && !disabled ? onVoicePointerCancel : undefined}
      onTouchStart={usesHold && !disabled ? onVoiceTouchStart : undefined}
      onTouchEnd={usesHold && !disabled ? onVoiceTouchEnd : undefined}
      style={usesHold ? { touchAction: 'none', userSelect: 'none' } : undefined}
    >
      {practiceVoiceCellLabel({ tr, tb, transcribing, listening })}
    </Button>
  );
}
