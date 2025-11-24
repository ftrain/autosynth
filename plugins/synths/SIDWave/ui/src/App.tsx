/**
 * @file App.tsx
 * @brief SID Wave 8-bit synthesizer UI
 *
 * 8-bit wavetable synth inspired by the Commodore 64 SID chip.
 * Features 3 oscillators, ring modulation, bit crushing, and classic SID character.
 */

import React from 'react';
import { useJUCEBridge } from './hooks/useJUCEBridge';
import { useParameters, normalizeValue, denormalizeValue } from './hooks/useParameters';
import { PARAMETER_DEFINITIONS } from './types/parameters';
import { SynthKnob } from './components/SynthKnob';
import { SynthADSR } from './components/SynthADSR';
import { SynthRow } from './components/SynthRow';
import Oscilloscope from './components/Oscilloscope';

// Waveform options matching SID chip (Pulse, Saw, Triangle, Noise)
const WAVE_OPTIONS = ['PLS', 'SAW', 'TRI', 'NOI'];
const FILTER_OPTIONS = ['LP', 'BP', 'HP'];

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
 * SID Wave synthesizer UI
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
        <h1 className="synth-title">SID Wave</h1>
        <span className="synth-subtitle">8-BIT SYNTHESIZER</span>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
          {isConnected ? 'Connected' : 'Standalone'}
        </div>
      </header>

      {/* OSC 1 */}
      <SynthRow label="OSC 1" showPanel>
        <SynthKnob
          label="WAVE"
          min={0}
          max={3}
          step={1}
          value={getDenormalized('osc1_wave', paramValues.osc1_wave ?? 0.333)}
          onChange={(v) => handleChange('osc1_wave', getNormalized('osc1_wave', v))}
          options={WAVE_OPTIONS}
        />
        <SynthKnob
          label="TUNE"
          min={-24}
          max={24}
          step={1}
          value={getDenormalized('osc1_tune', paramValues.osc1_tune ?? 0.5)}
          onChange={(v) => handleChange('osc1_tune', getNormalized('osc1_tune', v))}
        />
        <SynthKnob
          label="PW"
          min={0.05}
          max={0.95}
          value={getDenormalized('osc1_pw', paramValues.osc1_pw ?? 0.5)}
          onChange={(v) => handleChange('osc1_pw', getNormalized('osc1_pw', v))}
        />
        <SynthKnob
          label="LEVEL"
          min={0}
          max={1}
          value={getDenormalized('osc1_level', paramValues.osc1_level ?? 0.8)}
          onChange={(v) => handleChange('osc1_level', getNormalized('osc1_level', v))}
        />
      </SynthRow>

      {/* OSC 2 */}
      <SynthRow label="OSC 2" showPanel>
        <SynthKnob
          label="WAVE"
          min={0}
          max={3}
          step={1}
          value={getDenormalized('osc2_wave', paramValues.osc2_wave ?? 0)}
          onChange={(v) => handleChange('osc2_wave', getNormalized('osc2_wave', v))}
          options={WAVE_OPTIONS}
        />
        <SynthKnob
          label="TUNE"
          min={-24}
          max={24}
          step={1}
          value={getDenormalized('osc2_tune', paramValues.osc2_tune ?? 0.5)}
          onChange={(v) => handleChange('osc2_tune', getNormalized('osc2_tune', v))}
        />
        <SynthKnob
          label="PW"
          min={0.05}
          max={0.95}
          value={getDenormalized('osc2_pw', paramValues.osc2_pw ?? 0.5)}
          onChange={(v) => handleChange('osc2_pw', getNormalized('osc2_pw', v))}
        />
        <SynthKnob
          label="LEVEL"
          min={0}
          max={1}
          value={getDenormalized('osc2_level', paramValues.osc2_level ?? 0.5)}
          onChange={(v) => handleChange('osc2_level', getNormalized('osc2_level', v))}
        />
        <SynthKnob
          label="RING"
          min={0}
          max={1}
          value={getDenormalized('osc2_ring', paramValues.osc2_ring ?? 0)}
          onChange={(v) => handleChange('osc2_ring', getNormalized('osc2_ring', v))}
        />
      </SynthRow>

      {/* OSC 3 */}
      <SynthRow label="OSC 3" showPanel>
        <SynthKnob
          label="WAVE"
          min={0}
          max={3}
          step={1}
          value={getDenormalized('osc3_wave', paramValues.osc3_wave ?? 0.666)}
          onChange={(v) => handleChange('osc3_wave', getNormalized('osc3_wave', v))}
          options={WAVE_OPTIONS}
        />
        <SynthKnob
          label="TUNE"
          min={-24}
          max={24}
          step={1}
          value={getDenormalized('osc3_tune', paramValues.osc3_tune ?? 0.5)}
          onChange={(v) => handleChange('osc3_tune', getNormalized('osc3_tune', v))}
        />
        <SynthKnob
          label="LEVEL"
          min={0}
          max={1}
          value={getDenormalized('osc3_level', paramValues.osc3_level ?? 0.3)}
          onChange={(v) => handleChange('osc3_level', getNormalized('osc3_level', v))}
        />
      </SynthRow>

      {/* LO-FI */}
      <SynthRow label="LO-FI" showPanel>
        <SynthKnob
          label="BITS"
          min={4}
          max={16}
          step={1}
          value={getDenormalized('bit_depth', paramValues.bit_depth ?? 0.333)}
          onChange={(v) => handleChange('bit_depth', getNormalized('bit_depth', v))}
        />
        <SynthKnob
          label="RATE"
          min={0}
          max={1}
          value={getDenormalized('sample_rate', paramValues.sample_rate ?? 1)}
          onChange={(v) => handleChange('sample_rate', getNormalized('sample_rate', v))}
        />
      </SynthRow>

      {/* FILTER */}
      <SynthRow label="FILTER" showPanel>
        <SynthKnob
          label="CUTOFF"
          min={20}
          max={20000}
          value={getDenormalized('filter_cutoff', paramValues.filter_cutoff ?? 0.4)}
          onChange={(v) => handleChange('filter_cutoff', getNormalized('filter_cutoff', v))}
        />
        <SynthKnob
          label="RESO"
          min={0}
          max={1}
          value={getDenormalized('filter_reso', paramValues.filter_reso ?? 0.2)}
          onChange={(v) => handleChange('filter_reso', getNormalized('filter_reso', v))}
        />
        <SynthKnob
          label="TYPE"
          min={0}
          max={2}
          step={1}
          value={getDenormalized('filter_type', paramValues.filter_type ?? 0)}
          onChange={(v) => handleChange('filter_type', getNormalized('filter_type', v))}
          options={FILTER_OPTIONS}
        />
      </SynthRow>

      {/* AMP ENVELOPE */}
      <SynthRow label="AMP" showPanel>
        <SynthADSR
          label=""
          attack={getDenormalized('amp_attack', paramValues.amp_attack ?? 0.005) * 1000}
          decay={getDenormalized('amp_decay', paramValues.amp_decay ?? 0.1) * 1000}
          sustain={(paramValues.amp_sustain ?? 0.7) * 100}
          release={getDenormalized('amp_release', paramValues.amp_release ?? 0.15) * 1000}
          onAttackChange={(ms: number) => handleChange('amp_attack', getNormalized('amp_attack', ms / 1000))}
          onDecayChange={(ms: number) => handleChange('amp_decay', getNormalized('amp_decay', ms / 1000))}
          onSustainChange={(v: number) => handleChange('amp_sustain', v / 100)}
          onReleaseChange={(ms: number) => handleChange('amp_release', getNormalized('amp_release', ms / 1000))}
        />
        <SynthKnob
          label="VOLUME"
          min={0}
          max={1}
          value={getDenormalized('master_level', paramValues.master_level ?? 0.8)}
          onChange={(v) => handleChange('master_level', getNormalized('master_level', v))}
        />
      </SynthRow>

      {/* OSCILLOSCOPE */}
      <SynthRow label="OUTPUT" showPanel>
        <Oscilloscope
          label="SCOPE"
          audioData={audioData}
          width={380}
          height={100}
          color="#00ff88"
          showGrid={true}
          showPeaks={true}
        />
        <button className="reset-button" onClick={resetToDefaults}>
          Reset All
        </button>
      </SynthRow>

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
