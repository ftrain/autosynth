/**
 * @file App.tsx
 * @brief A111-5 VCO UI - Doepfer High-End VCO Clone
 *
 * Features:
 * - Multiple waveforms (sine/tri/saw/pulse)
 * - Sub-oscillator
 * - Hard sync
 * - Linear FM
 * - PWM
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
 * A111-5 VCO Main UI
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

  // Waveform labels for display
  const waveformLabels = ['SIN', 'TRI', 'SAW', 'PLS'];

  return (
    <div className="synth-container">
      {/* HEADER */}
      <header className="synth-header">
        <h1 className="synth-title">A111-5 VCO</h1>
        <span className="synth-subtitle">Doepfer High-End VCO Clone</span>
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
            value={getDenormalized('osc_waveform', paramValues.osc_waveform ?? 0.67)}
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
            label="FINE"
            min={-100}
            max={100}
            step={1}
            value={getDenormalized('osc_fine', paramValues.osc_fine ?? 0.5)}
            onChange={(v) => handleChange('osc_fine', getNormalized('osc_fine', v))}
          />
          <SynthKnob
            label="PW"
            min={0}
            max={1}
            value={getDenormalized('pulse_width', paramValues.pulse_width ?? 0.5)}
            onChange={(v) => handleChange('pulse_width', getNormalized('pulse_width', v))}
          />
        </div>
      </section>

      {/* SUB OSCILLATOR SECTION */}
      <section className="synth-section">
        <h2 className="section-title">Sub</h2>
        <div className="knob-row">
          <SynthKnob
            label="LEVEL"
            min={0}
            max={1}
            value={getDenormalized('sub_level', paramValues.sub_level ?? 0)}
            onChange={(v) => handleChange('sub_level', getNormalized('sub_level', v))}
          />
        </div>
      </section>

      {/* MODULATION SECTION */}
      <section className="synth-section">
        <h2 className="section-title">Modulation</h2>
        <div className="knob-row">
          <SynthKnob
            label="SYNC"
            min={0}
            max={1}
            step={1}
            value={getDenormalized('sync_enable', paramValues.sync_enable ?? 0)}
            onChange={(v) => handleChange('sync_enable', getNormalized('sync_enable', v))}
            options={['OFF', 'ON']}
          />
          <SynthKnob
            label="FM AMT"
            min={0}
            max={1}
            value={getDenormalized('fm_amount', paramValues.fm_amount ?? 0)}
            onChange={(v) => handleChange('fm_amount', getNormalized('fm_amount', v))}
          />
          <SynthKnob
            label="FM RATIO"
            min={0.5}
            max={8}
            value={getDenormalized('fm_ratio', paramValues.fm_ratio ?? 0.067)}
            onChange={(v) => handleChange('fm_ratio', getNormalized('fm_ratio', v))}
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
        </div>
      </section>

      {/* OUTPUT / CONTROLS */}
      <section className="synth-section">
        <h2 className="section-title">Output</h2>
        <div className="knob-row">
          <Oscilloscope
            label="SCOPE"
            audioData={audioData}
            width={320}
            height={100}
            color="#00ff88"
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
