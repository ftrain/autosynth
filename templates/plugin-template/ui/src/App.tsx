/**
 * @file App.tsx
 * @brief Main synthesizer UI component
 *
 * This is the root component for the plugin UI. It:
 * - Manages parameter state via useParameters hook
 * - Connects to JUCE via useJUCEBridge hook
 * - Composes UI from the shared component library
 *
 * ## Value Normalization
 * IMPORTANT: The useParameters hook stores all values normalized to 0-1 range.
 * When passing values to SynthKnob or other components that expect raw values
 * (like -60 to 0 dB for volume, or 20 to 20000 Hz for cutoff), you must:
 * 1. Denormalize when displaying: getDenormalized(paramId, normalizedValue)
 * 2. Normalize when storing: handleChange(paramId, getNormalized(paramId, rawValue))
 *
 * @see docs/TYPESCRIPT_COMPONENT_DEVELOPER_GUIDE.md
 */

import React from 'react';
import { useJUCEBridge } from './hooks/useJUCEBridge';
import { useParameters, normalizeValue, denormalizeValue } from './hooks/useParameters';
import { PARAMETER_DEFINITIONS } from './types/parameters';
import { SynthKnob } from './components/SynthKnob';
import { SynthADSR } from './components/SynthADSR';
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
 * Main synthesizer UI
 *
 * Customize this component for your specific synth. The template shows
 * a basic subtractive synthesizer layout with:
 * - 1 oscillator with waveform, level, and tune
 * - 1 lowpass filter with cutoff, resonance, and envelope amount
 * - Amp and filter envelopes
 * - Master volume
 * - Oscilloscope visualization
 *
 * Add or remove sections as needed for your synth design.
 */
const App: React.FC = () => {
  // Connect to JUCE backend
  const { isConnected, juceInfo, audioData } = useJUCEBridge({
    enableAudioData: true,
    audioChannel: 'master',
  });

  // Manage parameter state - all values stored as normalized 0-1
  const { paramValues, handleChange, resetToDefaults } = useParameters({
    parameters: PARAMETER_DEFINITIONS,
    syncWithJUCE: true,
  });

  return (
    <div className="synth-container">
      {/* HEADER */}
      <header className="synth-header">
        <h1 className="synth-title">{{SYNTH_NAME}}</h1>
        <span className="synth-subtitle">Synthesizer</span>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
          {isConnected ? 'Connected' : 'Standalone'}
        </div>
      </header>

      {/* OSCILLATOR SECTION */}
      <section className="synth-section">
        <h2 className="section-title">Oscillator</h2>
        <div className="knob-row">
          <SynthKnob
            label="WAVE"
            min={0}
            max={3}
            step={1}
            value={getDenormalized('osc1_waveform', paramValues.osc1_waveform ?? 0)}
            onChange={(v) => handleChange('osc1_waveform', getNormalized('osc1_waveform', v))}
            options={['SAW', 'SQR', 'TRI', 'SIN']}
          />
          <SynthKnob
            label="LEVEL"
            min={0}
            max={1}
            value={getDenormalized('osc1_level', paramValues.osc1_level ?? 1)}
            onChange={(v) => handleChange('osc1_level', getNormalized('osc1_level', v))}
          />
          <SynthKnob
            label="TUNE"
            min={-24}
            max={24}
            step={1}
            value={getDenormalized('osc1_tune', paramValues.osc1_tune ?? 0.5)}
            onChange={(v) => handleChange('osc1_tune', getNormalized('osc1_tune', v))}
          />
        </div>
      </section>

      {/* FILTER SECTION */}
      <section className="synth-section">
        <h2 className="section-title">Filter</h2>
        <div className="knob-row">
          <SynthKnob
            label="CUTOFF"
            min={20}
            max={20000}
            value={getDenormalized('filter_cutoff', paramValues.filter_cutoff ?? 0.5)}
            onChange={(v) => handleChange('filter_cutoff', getNormalized('filter_cutoff', v))}
          />
          <SynthKnob
            label="RESONANCE"
            min={0}
            max={1}
            value={getDenormalized('filter_reso', paramValues.filter_reso ?? 0)}
            onChange={(v) => handleChange('filter_reso', getNormalized('filter_reso', v))}
          />
          <SynthKnob
            label="ENV AMT"
            min={-1}
            max={1}
            value={getDenormalized('filter_env_amount', paramValues.filter_env_amount ?? 0.75)}
            onChange={(v) => handleChange('filter_env_amount', getNormalized('filter_env_amount', v))}
          />
        </div>
      </section>

      {/* ENVELOPES SECTION */}
      <section className="synth-section">
        <h2 className="section-title">Envelopes</h2>
        <div className="envelope-row">
          <SynthADSR
            label="AMP ENV"
            attack={getDenormalized('amp_attack', paramValues.amp_attack ?? 0) * 1000}
            decay={getDenormalized('amp_decay', paramValues.amp_decay ?? 0.01) * 1000}
            sustain={(paramValues.amp_sustain ?? 0.7) * 100}
            release={getDenormalized('amp_release', paramValues.amp_release ?? 0.03) * 1000}
            onAttackChange={(ms: number) => handleChange('amp_attack', getNormalized('amp_attack', ms / 1000))}
            onDecayChange={(ms: number) => handleChange('amp_decay', getNormalized('amp_decay', ms / 1000))}
            onSustainChange={(v: number) => handleChange('amp_sustain', v / 100)}
            onReleaseChange={(ms: number) => handleChange('amp_release', getNormalized('amp_release', ms / 1000))}
          />
          <SynthADSR
            label="FILTER ENV"
            attack={getDenormalized('filter_attack', paramValues.filter_attack ?? 0) * 1000}
            decay={getDenormalized('filter_decay', paramValues.filter_decay ?? 0.01) * 1000}
            sustain={(paramValues.filter_sustain ?? 0.5) * 100}
            release={getDenormalized('filter_release', paramValues.filter_release ?? 0.03) * 1000}
            onAttackChange={(ms: number) => handleChange('filter_attack', getNormalized('filter_attack', ms / 1000))}
            onDecayChange={(ms: number) => handleChange('filter_decay', getNormalized('filter_decay', ms / 1000))}
            onSustainChange={(v: number) => handleChange('filter_sustain', v / 100)}
            onReleaseChange={(ms: number) => handleChange('filter_release', getNormalized('filter_release', ms / 1000))}
          />
        </div>
      </section>

      {/* MASTER SECTION */}
      <section className="synth-section">
        <h2 className="section-title">Output</h2>
        <div className="knob-row">
          <SynthKnob
            label="MASTER"
            min={-60}
            max={0}
            value={getDenormalized('master_volume', paramValues.master_volume ?? 0.9)}
            onChange={(v) => handleChange('master_volume', getNormalized('master_volume', v))}
          />
          <button className="reset-button" onClick={resetToDefaults}>
            Reset All
          </button>
        </div>
      </section>

      {/* OSCILLOSCOPE */}
      <section className="synth-section">
        <h2 className="section-title">Visualization</h2>
        <Oscilloscope
          label="SCOPE"
          audioData={audioData}
          width={380}
          height={120}
          color="#00ff88"
          showGrid={true}
          showPeaks={true}
        />
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
