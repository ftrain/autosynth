/**
 * @file App.tsx
 * @brief Phone Tones UI - Telephone Sound Synthesizer
 *
 * Features:
 * - Dual sine oscillators for DTMF/dial tones
 * - Telephone bandpass filter (300-3400 Hz)
 * - Line noise and crackle
 * - Pattern sequencer for automated tones
 */

import React from 'react';
import { useJUCEBridge } from './hooks/useJUCEBridge';
import { useParameters, normalizeValue, denormalizeValue } from './hooks/useParameters';
import { PARAMETER_DEFINITIONS } from './types/parameters';
import { SynthKnob } from './components/SynthKnob';
import Oscilloscope from './components/Oscilloscope';

/**
 * Helper to denormalize a value from 0-1 to the parameter's actual range
 */
const getDenormalized = (paramId: string, normalizedValue: number): number => {
  const param = PARAMETER_DEFINITIONS[paramId];
  if (!param) return normalizedValue;
  return denormalizeValue(normalizedValue, param.min, param.max);
};

/**
 * Helper to normalize a raw value to 0-1 range for storage
 */
const getNormalized = (paramId: string, rawValue: number): number => {
  const param = PARAMETER_DEFINITIONS[paramId];
  if (!param) return rawValue;
  return normalizeValue(rawValue, param.min, param.max);
};

/**
 * Phone Tones Main UI
 */
const App: React.FC = () => {
  const { isConnected, juceInfo, audioData } = useJUCEBridge({
    enableAudioData: true,
    audioChannel: 'master',
  });

  const { paramValues, handleChange, resetToDefaults } = useParameters({
    parameters: PARAMETER_DEFINITIONS,
    syncWithJUCE: true,
  });

  // Tone mode labels
  const toneModeLabels = ['DIAL', 'BUSY', 'RING', 'DTMF', 'MODEM', 'CUST'];

  return (
    <div className="synth-container">
      {/* HEADER */}
      <header className="synth-header">
        <h1 className="synth-title">Phone Tones</h1>
        <span className="synth-subtitle">Telephone Sound Synthesizer</span>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
          {isConnected ? 'Connected' : 'Standalone'}
        </div>
      </header>

      {/* TONE MODE SECTION */}
      <section className="synth-section">
        <h2 className="section-title">Tone Mode</h2>
        <div className="knob-row">
          <SynthKnob
            label="MODE"
            min={0}
            max={5}
            step={1}
            value={getDenormalized('tone_mode', paramValues.tone_mode ?? 0)}
            onChange={(v) => handleChange('tone_mode', getNormalized('tone_mode', v))}
            options={toneModeLabels}
          />
        </div>
      </section>

      {/* FREQUENCIES SECTION */}
      <section className="synth-section">
        <h2 className="section-title">Frequencies</h2>
        <div className="knob-row">
          <SynthKnob
            label="TONE 1"
            min={200}
            max={2000}
            value={getDenormalized('tone1_freq', paramValues.tone1_freq ?? 0.27)}
            onChange={(v) => handleChange('tone1_freq', getNormalized('tone1_freq', v))}
          />
          <SynthKnob
            label="TONE 2"
            min={200}
            max={2000}
            value={getDenormalized('tone2_freq', paramValues.tone2_freq ?? 0.31)}
            onChange={(v) => handleChange('tone2_freq', getNormalized('tone2_freq', v))}
          />
          <SynthKnob
            label="MIX"
            min={0}
            max={1}
            value={getDenormalized('tone_mix', paramValues.tone_mix ?? 0.5)}
            onChange={(v) => handleChange('tone_mix', getNormalized('tone_mix', v))}
          />
        </div>
      </section>

      {/* PHONE FILTER SECTION */}
      <section className="synth-section">
        <h2 className="section-title">Phone Filter</h2>
        <div className="knob-row">
          <SynthKnob
            label="LOW"
            min={200}
            max={500}
            value={getDenormalized('filter_low', paramValues.filter_low ?? 0.33)}
            onChange={(v) => handleChange('filter_low', getNormalized('filter_low', v))}
          />
          <SynthKnob
            label="HIGH"
            min={2500}
            max={4000}
            value={getDenormalized('filter_high', paramValues.filter_high ?? 0.6)}
            onChange={(v) => handleChange('filter_high', getNormalized('filter_high', v))}
          />
          <SynthKnob
            label="DRIVE"
            min={0}
            max={1}
            value={getDenormalized('filter_drive', paramValues.filter_drive ?? 0.2)}
            onChange={(v) => handleChange('filter_drive', getNormalized('filter_drive', v))}
          />
        </div>
      </section>

      {/* NOISE SECTION */}
      <section className="synth-section">
        <h2 className="section-title">Noise</h2>
        <div className="knob-row">
          <SynthKnob
            label="LEVEL"
            min={0}
            max={1}
            value={getDenormalized('noise_level', paramValues.noise_level ?? 0.1)}
            onChange={(v) => handleChange('noise_level', getNormalized('noise_level', v))}
          />
          <SynthKnob
            label="CRACKLE"
            min={0}
            max={1}
            value={getDenormalized('noise_crackle', paramValues.noise_crackle ?? 0.1)}
            onChange={(v) => handleChange('noise_crackle', getNormalized('noise_crackle', v))}
          />
        </div>
      </section>

      {/* PATTERN SECTION */}
      <section className="synth-section">
        <h2 className="section-title">Pattern</h2>
        <div className="knob-row">
          <SynthKnob
            label="RATE"
            min={0.1}
            max={10}
            value={getDenormalized('pattern_rate', paramValues.pattern_rate ?? 0.19)}
            onChange={(v) => handleChange('pattern_rate', getNormalized('pattern_rate', v))}
          />
          <SynthKnob
            label="DUTY"
            min={0}
            max={1}
            value={getDenormalized('pattern_duty', paramValues.pattern_duty ?? 0.5)}
            onChange={(v) => handleChange('pattern_duty', getNormalized('pattern_duty', v))}
          />
        </div>
      </section>

      {/* AMP ENVELOPE SECTION */}
      <section className="synth-section">
        <h2 className="section-title">Amp</h2>
        <div className="knob-row">
          <SynthKnob
            label="ATTACK"
            min={0.001}
            max={2}
            value={getDenormalized('amp_attack', paramValues.amp_attack ?? 0.002)}
            onChange={(v) => handleChange('amp_attack', getNormalized('amp_attack', v))}
          />
          <SynthKnob
            label="DECAY"
            min={0.001}
            max={2}
            value={getDenormalized('amp_decay', paramValues.amp_decay ?? 0.05)}
            onChange={(v) => handleChange('amp_decay', getNormalized('amp_decay', v))}
          />
          <SynthKnob
            label="SUSTAIN"
            min={0}
            max={1}
            value={getDenormalized('amp_sustain', paramValues.amp_sustain ?? 1.0)}
            onChange={(v) => handleChange('amp_sustain', getNormalized('amp_sustain', v))}
          />
          <SynthKnob
            label="RELEASE"
            min={0.001}
            max={2}
            value={getDenormalized('amp_release', paramValues.amp_release ?? 0.025)}
            onChange={(v) => handleChange('amp_release', getNormalized('amp_release', v))}
          />
          <SynthKnob
            label="LEVEL"
            min={0}
            max={1}
            value={getDenormalized('master_level', paramValues.master_level ?? 0.8)}
            onChange={(v) => handleChange('master_level', getNormalized('master_level', v))}
          />
        </div>
      </section>

      {/* OUTPUT / CONTROLS */}
      <section className="synth-section">
        <h2 className="section-title">Output</h2>
        <div className="knob-row">
          <Oscilloscope
            audioData={audioData}
            width={320}
            height={100}
            color="#00ccff"
            showGrid={true}
            showPeaks={true}
          />
          <button className="reset-button" onClick={resetToDefaults}>
            Reset All
          </button>
        </div>
      </section>

      {/* Debug info in development */}
      {import.meta.env.DEV && (
        <footer className="debug-info">
          <small>
            JUCE: {isConnected ? 'Yes' : 'No'} |
            Sample Rate: {juceInfo.sampleRate || 'N/A'} |
            Buffer: {juceInfo.bufferSize || 'N/A'}
          </small>
        </footer>
      )}
    </div>
  );
};

export default App;
