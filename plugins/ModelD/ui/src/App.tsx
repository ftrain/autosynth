/**
 * @file App.tsx
 * @brief Model D Synthesizer UI using component library
 */

import React from 'react';
import { useJUCEBridge } from './hooks/useJUCEBridge';
import { useParameters, normalizeValue, denormalizeValue } from './hooks/useParameters';
import { PARAMETER_DEFINITIONS, WAVEFORM_OPTIONS, OCTAVE_OPTIONS } from './types/parameters';
import { SynthKnob } from './components/SynthKnob';
import { SynthADSR } from './components/SynthADSR';
import Oscilloscope from './components/Oscilloscope';

/**
 * Helper to get denormalized value from paramValues
 */
const getDenormalized = (paramId: string, normalizedValue: number): number => {
  const param = PARAMETER_DEFINITIONS[paramId];
  if (!param) return normalizedValue;
  return denormalizeValue(normalizedValue, param.min, param.max);
};

/**
 * Helper to normalize a raw value for a given param
 */
const getNormalized = (paramId: string, rawValue: number): number => {
  const param = PARAMETER_DEFINITIONS[paramId];
  if (!param) return rawValue;
  return normalizeValue(rawValue, param.min, param.max);
};

/**
 * Oscillator Section using SynthKnob
 * Note: paramValues contains normalized 0-1 values, so we denormalize for display
 * and normalize when sending changes back.
 */
interface OscillatorProps {
  title: string;
  waveformId: string;
  octaveId: string;
  levelId: string;
  detuneId?: string;
  paramValues: Record<string, number>;
  handleChange: (id: string, normalizedValue: number) => void;
}

const OscillatorSection: React.FC<OscillatorProps> = ({
  title,
  waveformId,
  octaveId,
  levelId,
  detuneId,
  paramValues,
  handleChange,
}) => {
  // Get param definitions for min/max
  const waveformParam = PARAMETER_DEFINITIONS[waveformId];
  const octaveParam = PARAMETER_DEFINITIONS[octaveId];
  const levelParam = PARAMETER_DEFINITIONS[levelId];
  const detuneParam = detuneId ? PARAMETER_DEFINITIONS[detuneId] : null;

  return (
    <div className="oscillator-section">
      <h3>{title}</h3>
      <div className="knob-row">
        <SynthKnob
          label="WAVE"
          min={waveformParam?.min ?? 0}
          max={waveformParam?.max ?? 3}
          step={1}
          value={getDenormalized(waveformId, paramValues[waveformId] ?? 0)}
          onChange={(v) => handleChange(waveformId, getNormalized(waveformId, v))}
          options={WAVEFORM_OPTIONS.map(o => o.label)}
        />
        <SynthKnob
          label="OCTAVE"
          min={octaveParam?.min ?? -2}
          max={octaveParam?.max ?? 2}
          step={1}
          value={getDenormalized(octaveId, paramValues[octaveId] ?? 0.5)}
          onChange={(v) => handleChange(octaveId, getNormalized(octaveId, v))}
          options={OCTAVE_OPTIONS.map(o => o.label)}
        />
        {detuneId && detuneParam && (
          <SynthKnob
            label="DETUNE"
            min={detuneParam.min}
            max={detuneParam.max}
            value={getDenormalized(detuneId, paramValues[detuneId] ?? 0.5)}
            onChange={(v) => handleChange(detuneId, getNormalized(detuneId, v))}
          />
        )}
        <SynthKnob
          label="LEVEL"
          min={levelParam?.min ?? 0}
          max={levelParam?.max ?? 1}
          value={getDenormalized(levelId, paramValues[levelId] ?? 1)}
          onChange={(v) => handleChange(levelId, getNormalized(levelId, v))}
        />
      </div>
    </div>
  );
};

/**
 * Main synthesizer UI
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

  return (
    <div className="synth-container model-d">
      {/* HEADER + OUTPUT */}
      <header className="synth-header">
        <div className="header-left">
          <h1 className="synth-title">Model D</h1>
          <span className="synth-subtitle">Minimoog-Style Synthesizer</span>
        </div>
        <div className="header-center">
          <Oscilloscope
            label="SCOPE"
            audioData={audioData}
            width={300}
            height={80}
            color="#00ff88"
            showGrid={true}
            showPeaks={true}
          />
        </div>
        <div className="header-right">
          <SynthKnob
            label="MASTER"
            min={-60}
            max={0}
            value={getDenormalized('master_volume', paramValues.master_volume ?? 0.9)}
            onChange={(v) => handleChange('master_volume', getNormalized('master_volume', v))}
            size="medium"
          />
          <div className="connection-status">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
            {isConnected ? 'Connected' : 'Standalone'}
          </div>
        </div>
      </header>

      {/* OSCILLATORS */}
      <section className="synth-section oscillators-panel">
        <h2 className="section-title">Oscillator Bank</h2>
        <div className="oscillators-grid">
          <OscillatorSection
            title="OSC 1"
            waveformId="osc1_waveform"
            octaveId="osc1_octave"
            levelId="osc1_level"
            paramValues={paramValues}
            handleChange={handleChange}
          />
          <OscillatorSection
            title="OSC 2"
            waveformId="osc2_waveform"
            octaveId="osc2_octave"
            levelId="osc2_level"
            detuneId="osc2_detune"
            paramValues={paramValues}
            handleChange={handleChange}
          />
          <OscillatorSection
            title="OSC 3"
            waveformId="osc3_waveform"
            octaveId="osc3_octave"
            levelId="osc3_level"
            detuneId="osc3_detune"
            paramValues={paramValues}
            handleChange={handleChange}
          />
          <div className="oscillator-section noise-section">
            <h3>NOISE</h3>
            <div className="knob-row">
              <SynthKnob
                label="LEVEL"
                min={0}
                max={1}
                value={getDenormalized('noise_level', paramValues.noise_level ?? 0)}
                onChange={(v) => handleChange('noise_level', getNormalized('noise_level', v))}
              />
            </div>
          </div>
        </div>
      </section>

      {/* FILTER & ENVELOPES */}
      <section className="synth-section filter-env-panel">
        <h2 className="section-title">Filter & Envelopes</h2>
        <div className="filter-env-row">
          <div className="filter-controls">
            <SynthKnob
              label="CUTOFF"
              min={20}
              max={20000}
              value={getDenormalized('filter_cutoff', paramValues.filter_cutoff ?? 0.25)}
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
            <SynthKnob
              label="KBD TRACK"
              min={0}
              max={1}
              value={getDenormalized('filter_kbd_track', paramValues.filter_kbd_track ?? 0)}
              onChange={(v) => handleChange('filter_kbd_track', getNormalized('filter_kbd_track', v))}
            />
          </div>
          <SynthADSR
            label="FILTER ENV"
            tabs={[]}
            attack={getDenormalized('filter_attack', paramValues.filter_attack ?? 0) * 1000}
            decay={getDenormalized('filter_decay', paramValues.filter_decay ?? 0.01) * 1000}
            sustain={(paramValues.filter_sustain ?? 0.5) * 100}
            release={getDenormalized('filter_release', paramValues.filter_release ?? 0.03) * 1000}
            onAttackChange={(ms: number) => handleChange('filter_attack', getNormalized('filter_attack', ms / 1000))}
            onDecayChange={(ms: number) => handleChange('filter_decay', getNormalized('filter_decay', ms / 1000))}
            onSustainChange={(v: number) => handleChange('filter_sustain', v / 100)}
            onReleaseChange={(ms: number) => handleChange('filter_release', getNormalized('filter_release', ms / 1000))}
          />
          <SynthADSR
            label="AMP ENV"
            tabs={[]}
            attack={getDenormalized('amp_attack', paramValues.amp_attack ?? 0) * 1000}
            decay={getDenormalized('amp_decay', paramValues.amp_decay ?? 0.01) * 1000}
            sustain={(paramValues.amp_sustain ?? 0.7) * 100}
            release={getDenormalized('amp_release', paramValues.amp_release ?? 0.03) * 1000}
            onAttackChange={(ms: number) => handleChange('amp_attack', getNormalized('amp_attack', ms / 1000))}
            onDecayChange={(ms: number) => handleChange('amp_decay', getNormalized('amp_decay', ms / 1000))}
            onSustainChange={(v: number) => handleChange('amp_sustain', v / 100)}
            onReleaseChange={(ms: number) => handleChange('amp_release', getNormalized('amp_release', ms / 1000))}
          />
        </div>
      </section>

    </div>
  );
};

export default App;
