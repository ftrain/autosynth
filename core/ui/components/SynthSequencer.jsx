/**
 * @file SynthSequencer.jsx
 * @brief 16-step sequencer with pitch and gate control
 *
 * @description
 * A step sequencer component with per-step pitch and gate controls.
 * Each step displays a pitch bar (click to set note) and gate button (toggle on/off).
 * Visual feedback shows the currently playing step.
 *
 * ## Use Cases
 * - **Melodic Sequences**: Program bass lines, arpeggios, or melodies
 * - **Drum Patterns**: Gate patterns for triggering drum sounds
 * - **Modulation Sequencer**: Step-based modulation source
 * - **Euclidean Rhythms**: Create complex rhythmic patterns
 * - **Generative Music**: Random or algorithmic pattern generation
 * - **Live Performance**: Real-time pattern tweaking
 *
 * ## Features
 * - Click pitch bars to set note (C2-C6 range by default)
 * - Toggle gates to create rhythmic patterns
 * - Visual step indicator shows playback position
 * - Supports 8 or 16 step modes
 * - MIDI note values (36-84 default range)
 *
 * ## Integration
 * - Connect to a clock/transport for playback
 * - Use pitch values to control oscillator frequency
 * - Use gate values to trigger envelope generators
 *
 * @example
 * ```jsx
 * <SynthSequencer
 *   steps={16}
 *   pitchValues={pitches}
 *   gateValues={gates}
 *   currentStep={playingStep}
 *   onPitchChange={(step, pitch) => updatePitch(step, pitch)}
 *   onGateChange={(step, gate) => updateGate(step, gate)}
 * />
 * ```
 */

import React from 'react';

export const SynthSequencer = ({
  steps = 16,
  pitchValues = Array(16).fill(60), // MIDI note values (C4 = 60)
  gateValues = Array(16).fill(true), // Gate on/off
  currentStep = -1, // Which step is currently playing (-1 = none)
  onPitchChange,
  onGateChange,
  minPitch = 36, // C2
  maxPitch = 84, // C6
}) => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  const midiToNoteName = (midiNote) => {
    const octave = Math.floor(midiNote / 12) - 1;
    const noteName = noteNames[midiNote % 12];
    return `${noteName}${octave}`;
  };

  const Step = ({ index, pitch, gate, isActive }) => {
    const stepHeight = 120;
    const noteRange = maxPitch - minPitch;
    const pitchRatio = (pitch - minPitch) / noteRange;
    const barHeight = pitchRatio * (stepHeight - 30); // Leave room for gate indicator

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
            const y = rect.bottom - e.clientY; // Distance from bottom
            const ratio = Math.max(0, Math.min(1, y / stepHeight));
            const newPitch = Math.round(minPitch + ratio * noteRange);
            console.log('[Sequencer] Pitch clicked:', index, 'new pitch:', newPitch);
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
            console.log('[Sequencer] Gate clicked:', index, 'current:', gate, 'new:', !gate);
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
          boxShadow: 'var(--synth-shadow-sm)',
        }}
      >
        {Array.from({ length: steps }).map((_, i) => (
          <Step
            key={i}
            index={i}
            pitch={pitchValues[i] || 60}
            gate={gateValues[i] !== false}
            isActive={currentStep === i}
          />
        ))}
      </div>
    </div>
  );
};
