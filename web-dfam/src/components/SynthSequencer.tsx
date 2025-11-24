/**
 * @file SynthSequencer.tsx
 * @brief 16-step sequencer with pitch and gate control
 * @note Copied from core/ui/components/SynthSequencer.jsx - keep in sync
 */

import React from 'react';

interface SynthSequencerProps {
  steps?: number;
  pitchValues?: number[];
  gateValues?: boolean[];
  currentStep?: number;
  onPitchChange?: (step: number, pitch: number) => void;
  onGateChange?: (step: number, gate: boolean) => void;
  minPitch?: number;
  maxPitch?: number;
}

interface StepProps {
  index: number;
  pitch: number;
  gate: boolean;
  isActive: boolean;
  stepHeight: number;
  noteRange: number;
  minPitch: number;
  onPitchChange?: (step: number, pitch: number) => void;
  onGateChange?: (step: number, gate: boolean) => void;
  midiToNoteName: (midiNote: number) => string;
}

const Step: React.FC<StepProps> = ({
  index,
  pitch,
  gate,
  isActive,
  stepHeight,
  noteRange,
  minPitch,
  onPitchChange,
  onGateChange,
  midiToNoteName,
}) => {
  const pitchRatio = (pitch - minPitch) / noteRange;
  const barHeight = pitchRatio * (stepHeight - 30);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--synth-space-xs)',
      }}
    >
      {/* Step number */}
      <div
        style={{
          fontSize: 'var(--synth-font-size-xs)',
          color: isActive ? 'var(--synth-accent-primary)' : 'var(--synth-text-secondary)',
          fontWeight: isActive ? 'bold' : 'normal',
        }}
      >
        {index + 1}
      </div>

      {/* Pitch bar */}
      <div
        style={{
          width: '32px',
          height: `${stepHeight}px`,
          background: 'var(--synth-gradient-inset)',
          borderRadius: 'var(--synth-radius-sm)',
          boxShadow: 'var(--synth-shadow-inset)',
          position: 'relative',
          cursor: 'pointer',
          overflow: 'hidden',
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          const rect = e.currentTarget.getBoundingClientRect();
          const y = rect.bottom - e.clientY;
          const ratio = Math.max(0, Math.min(1, y / stepHeight));
          const newPitch = Math.round(minPitch + ratio * noteRange);
          onPitchChange?.(index, newPitch);
        }}
      >
        {/* Pitch indicator bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${barHeight}px`,
            background: isActive
              ? 'linear-gradient(to top, var(--synth-accent-primary), var(--synth-accent-secondary))'
              : gate
                ? 'linear-gradient(to top, #4a9eff, #7fbfff)'
                : 'linear-gradient(to top, #666, #888)',
            boxShadow: isActive ? `0 0 8px var(--synth-accent-primary)` : 'none',
            transition: 'all 150ms',
          }}
        />
      </div>

      {/* Note name */}
      <div
        style={{
          fontSize: 'var(--synth-font-size-xs)',
          color: gate ? 'var(--synth-text-primary)' : 'var(--synth-text-secondary)',
          fontFamily: 'monospace',
        }}
      >
        {midiToNoteName(pitch)}
      </div>

      {/* Gate toggle */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          onGateChange?.(index, !gate);
        }}
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: gate
            ? 'radial-gradient(circle at 30% 30%, var(--synth-accent-primary), var(--synth-accent-secondary))'
            : 'radial-gradient(circle at 30% 30%, #2a2a2a, #0a0a0a)',
          boxShadow: gate
            ? `inset 1px 1px 2px rgba(0,0,0,0.3), 0 0 8px var(--synth-accent-primary)`
            : 'inset 2px 2px 4px rgba(0,0,0,0.6)',
          cursor: 'pointer',
          transition: 'all 150ms',
          border: gate ? '2px solid var(--synth-accent-primary)' : '2px solid #333',
        }}
      />
    </div>
  );
};

export const SynthSequencer: React.FC<SynthSequencerProps> = ({
  steps = 16,
  pitchValues = Array(16).fill(60),
  gateValues = Array(16).fill(true),
  currentStep = -1,
  onPitchChange,
  onGateChange,
  minPitch = 36,
  maxPitch = 84,
}) => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const stepHeight = 120;
  const noteRange = maxPitch - minPitch;

  const midiToNoteName = (midiNote: number): string => {
    const octave = Math.floor(midiNote / 12) - 1;
    const noteName = noteNames[midiNote % 12];
    return `${noteName}${octave}`;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--synth-space-md)',
      }}
    >
      {/* Label */}
      <div
        style={{
          color: 'var(--synth-text-primary)',
          fontSize: 'var(--synth-font-size-sm)',
          fontWeight: 'bold',
          letterSpacing: '1.5px',
        }}
      >
        SEQUENCER
      </div>

      {/* Steps container */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--synth-space-sm)',
          padding: 'var(--synth-space-md)',
          background: 'var(--synth-gradient-panel)',
          borderRadius: 'var(--synth-radius-md)',
          boxShadow: 'var(--synth-shadow-panel)',
        }}
      >
        {Array.from({ length: steps }).map((_, i) => (
          <Step
            key={i}
            index={i}
            pitch={pitchValues[i] || 60}
            gate={gateValues[i] !== false}
            isActive={currentStep === i}
            stepHeight={stepHeight}
            noteRange={noteRange}
            minPitch={minPitch}
            onPitchChange={onPitchChange}
            onGateChange={onGateChange}
            midiToNoteName={midiToNoteName}
          />
        ))}
      </div>
    </div>
  );
};

export default SynthSequencer;
