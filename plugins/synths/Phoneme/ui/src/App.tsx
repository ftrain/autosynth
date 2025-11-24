/**
 * @file App.tsx
 * @brief Phoneme Formant Synthesizer UI
 *
 * Features:
 * - Saw/Pulse oscillator source
 * - Vowel selection (A, E, I, O, U) with morphing
 * - Formant shift and spread controls
 * - Vibrato for natural pitch modulation
 * - Vowel LFO for automatic morphing
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
 * SynthRow - A labeled row of controls
 */
const SynthRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <section className="synth-section">
    <h2 className="section-title">{label}</h2>
    <div className="knob-row">
      {children}
    </div>
  </section>
);

/**
 * Phoneme Main UI
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

  // Waveform labels
  const waveformLabels = ['SAW', 'PLS'];

  // Vowel labels
  const vowelLabels = ['A', 'E', 'I', 'O', 'U'];

  return (
    <div className="synth-container">
      {/* HEADER */}
      <header className="synth-header">
        <h1 className="synth-title">PHONEME</h1>
        <span className="synth-subtitle">Formant Synthesizer</span>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
          {isConnected ? 'Connected' : 'Standalone'}
        </div>
      </header>

      {/* SOURCE SECTION */}
      <SynthRow label="SOURCE">
        <SynthKnob
          label="WAVE"
          min={0}
          max={1}
          step={1}
          value={getDenormalized('osc_waveform', paramValues.osc_waveform ?? 0)}
          onChange={(v) => handleChange('osc_waveform', getNormalized('osc_waveform', v))}
          options={waveformLabels}
        />
        <SynthKnob
          label="TUNE"
          min={-24}
          max={24}
          step={1}
          value={getDenormalized('osc_tune', paramValues.osc_tune ?? 0.5)}
          onChange={(v) => handleChange('osc_tune', getNormalized('osc_tune', v))}
        />
        <SynthKnob
          label="PW"
          min={0.05}
          max={0.95}
          value={getDenormalized('osc_pw', paramValues.osc_pw ?? 0.5)}
          onChange={(v) => handleChange('osc_pw', getNormalized('osc_pw', v))}
        />
      </SynthRow>

      {/* FORMANT SECTION */}
      <SynthRow label="FORMANT">
        <SynthKnob
          label="VOWEL"
          min={0}
          max={4}
          step={1}
          value={getDenormalized('vowel', paramValues.vowel ?? 0)}
          onChange={(v) => handleChange('vowel', getNormalized('vowel', v))}
          options={vowelLabels}
        />
        <SynthKnob
          label="SHIFT"
          min={-12}
          max={12}
          step={1}
          value={getDenormalized('formant_shift', paramValues.formant_shift ?? 0.5)}
          onChange={(v) => handleChange('formant_shift', getNormalized('formant_shift', v))}
        />
        <SynthKnob
          label="SPREAD"
          min={0.5}
          max={2.0}
          value={getDenormalized('formant_spread', paramValues.formant_spread ?? 0.333)}
          onChange={(v) => handleChange('formant_spread', getNormalized('formant_spread', v))}
        />
      </SynthRow>

      {/* VIBRATO SECTION */}
      <SynthRow label="VIBRATO">
        <SynthKnob
          label="RATE"
          min={0.1}
          max={10}
          value={getDenormalized('vibrato_rate', paramValues.vibrato_rate ?? 0.495)}
          onChange={(v) => handleChange('vibrato_rate', getNormalized('vibrato_rate', v))}
        />
        <SynthKnob
          label="DEPTH"
          min={0}
          max={1}
          value={getDenormalized('vibrato_depth', paramValues.vibrato_depth ?? 0)}
          onChange={(v) => handleChange('vibrato_depth', getNormalized('vibrato_depth', v))}
        />
      </SynthRow>

      {/* VOWEL LFO SECTION */}
      <SynthRow label="VOWEL LFO">
        <SynthKnob
          label="RATE"
          min={0.01}
          max={5}
          value={getDenormalized('vowel_lfo_rate', paramValues.vowel_lfo_rate ?? 0.098)}
          onChange={(v) => handleChange('vowel_lfo_rate', getNormalized('vowel_lfo_rate', v))}
        />
        <SynthKnob
          label="DEPTH"
          min={0}
          max={1}
          value={getDenormalized('vowel_lfo_depth', paramValues.vowel_lfo_depth ?? 0)}
          onChange={(v) => handleChange('vowel_lfo_depth', getNormalized('vowel_lfo_depth', v))}
        />
      </SynthRow>

      {/* AMP SECTION */}
      <SynthRow label="AMP">
        <SynthKnob
          label="ATTACK"
          min={0.001}
          max={5}
          value={getDenormalized('amp_attack', paramValues.amp_attack ?? 0.002)}
          onChange={(v) => handleChange('amp_attack', getNormalized('amp_attack', v))}
        />
        <SynthKnob
          label="DECAY"
          min={0.001}
          max={5}
          value={getDenormalized('amp_decay', paramValues.amp_decay ?? 0.02)}
          onChange={(v) => handleChange('amp_decay', getNormalized('amp_decay', v))}
        />
        <SynthKnob
          label="SUSTAIN"
          min={0}
          max={1}
          value={getDenormalized('amp_sustain', paramValues.amp_sustain ?? 0.7)}
          onChange={(v) => handleChange('amp_sustain', getNormalized('amp_sustain', v))}
        />
        <SynthKnob
          label="RELEASE"
          min={0.001}
          max={5}
          value={getDenormalized('amp_release', paramValues.amp_release ?? 0.06)}
          onChange={(v) => handleChange('amp_release', getNormalized('amp_release', v))}
        />
        <SynthKnob
          label="LEVEL"
          min={0}
          max={1}
          value={getDenormalized('master_level', paramValues.master_level ?? 0.8)}
          onChange={(v) => handleChange('master_level', getNormalized('master_level', v))}
        />
      </SynthRow>

      {/* OUTPUT / CONTROLS */}
      <section className="synth-section">
        <h2 className="section-title">Output</h2>
        <div className="knob-row">
          <Oscilloscope
            label="SCOPE"
            audioData={audioData}
            width={320}
            height={100}
            color="#ff6b6b"
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
