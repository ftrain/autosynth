/**
 * @file App.tsx
 * @brief A111-5 Mini Synthesizer Voice UI - Doepfer Clone
 *
 * Based on Doepfer A-111-5 with:
 * - VCO: Triangle, Saw, Pulse with FM, PWM, and Sub oscillator
 * - VCF: Lowpass filter with resonance, tracking, LFO2/ADSR modulation
 * - VCA: Amplitude control with LFO1/ADSR modulation
 * - LFO1: Modulates VCO pitch and VCA amplitude
 * - LFO2: Modulates VCO pulse width and VCF cutoff
 * - ADSR: Envelope for VCF and VCA
 */

import React from 'react';
import { useJUCEBridge } from './hooks/useJUCEBridge';
import { useParameters, normalizeValue, denormalizeValue } from './hooks/useParameters';
import { PARAMETER_DEFINITIONS } from './types/parameters';
import { SynthKnob } from './components/SynthKnob';
import { SynthRow } from './components/SynthRow';
import { SynthToggle } from './components/SynthToggle';
import Oscilloscope from './components/Oscilloscope';
import './App.css';

const getDenormalized = (paramId: string, normalizedValue: number): number => {
  const param = PARAMETER_DEFINITIONS[paramId];
  if (!param) return normalizedValue;
  return denormalizeValue(normalizedValue, param.min, param.max);
};

const getNormalized = (paramId: string, rawValue: number): number => {
  const param = PARAMETER_DEFINITIONS[paramId];
  if (!param) return rawValue;
  return normalizeValue(rawValue, param.min, param.max);
};

const App: React.FC = () => {
  const { isConnected, juceInfo, audioData } = useJUCEBridge({
    enableAudioData: true,
    audioChannel: 'master',
  });

  const { paramValues, handleChange, resetToDefaults } = useParameters({
    parameters: PARAMETER_DEFINITIONS,
    syncWithJUCE: true,
  });

  // Labels for stepped controls
  const waveformLabels = ['TRI', 'SAW', 'PLS'];
  const modSourceLabels = ['OFF', 'LFO', 'ENV'];
  const trackingLabels = ['OFF', '1/2', 'FUL'];
  const rangeLabels = ['LOW', 'MED', 'HI'];
  const lfoWaveLabels = ['TRI', 'SQR', 'OFF'];

  return (
    <div className="synth-container">
      {/* HEADER */}
      <header className="synth-header">
        <h1 className="synth-title">A-111-5</h1>
        <span className="synth-subtitle">Mini Synthesizer Voice</span>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
          {isConnected ? 'Connected' : 'Standalone'}
        </div>
      </header>

      {/* VCO Section */}
      <SynthRow label="VCO" theme="amber">
        <SynthToggle
          label="MONO"
          value={(paramValues.mono_mode ?? 0) > 0.5}
          onChange={(v: boolean) => handleChange('mono_mode', v ? 1 : 0)}
          variant="signal"
        />
        <SynthKnob
          label="GLIDE"
          min={0}
          max={2}
          value={getDenormalized('glide_time', paramValues.glide_time ?? 0)}
          onChange={(v) => handleChange('glide_time', getNormalized('glide_time', v))}
        />
        <SynthKnob
          label="WAVE"
          min={0}
          max={2}
          step={1}
          value={getDenormalized('osc_waveform', paramValues.osc_waveform ?? 0.5)}
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
          min={0.05}
          max={0.95}
          value={getDenormalized('pulse_width', paramValues.pulse_width ?? 0.5)}
          onChange={(v) => handleChange('pulse_width', getNormalized('pulse_width', v))}
        />
        <SynthKnob
          label="SUB"
          min={0}
          max={1}
          value={getDenormalized('sub_level', paramValues.sub_level ?? 0)}
          onChange={(v) => handleChange('sub_level', getNormalized('sub_level', v))}
        />
      </SynthRow>

      {/* VCO Modulation */}
      <SynthRow label="VCO MOD" theme="amber">
        <SynthKnob
          label="FM SRC"
          min={0}
          max={2}
          step={1}
          value={getDenormalized('vco_fm_source', paramValues.vco_fm_source ?? 0)}
          onChange={(v) => handleChange('vco_fm_source', getNormalized('vco_fm_source', v))}
          options={modSourceLabels}
        />
        <SynthKnob
          label="FM AMT"
          min={0}
          max={1}
          value={getDenormalized('vco_fm_amount', paramValues.vco_fm_amount ?? 0)}
          onChange={(v) => handleChange('vco_fm_amount', getNormalized('vco_fm_amount', v))}
        />
        <SynthKnob
          label="PWM SRC"
          min={0}
          max={2}
          step={1}
          value={getDenormalized('vco_pwm_source', paramValues.vco_pwm_source ?? 0)}
          onChange={(v) => handleChange('vco_pwm_source', getNormalized('vco_pwm_source', v))}
          options={modSourceLabels}
        />
        <SynthKnob
          label="PWM AMT"
          min={0}
          max={1}
          value={getDenormalized('vco_pwm_amount', paramValues.vco_pwm_amount ?? 0)}
          onChange={(v) => handleChange('vco_pwm_amount', getNormalized('vco_pwm_amount', v))}
        />
      </SynthRow>

      {/* VCF Section */}
      <SynthRow label="VCF" theme="blue">
        <SynthKnob
          label="CUTOFF"
          min={20}
          max={20000}
          value={getDenormalized('vcf_cutoff', paramValues.vcf_cutoff ?? 0.25)}
          onChange={(v) => handleChange('vcf_cutoff', getNormalized('vcf_cutoff', v))}
        />
        <SynthKnob
          label="RES"
          min={0}
          max={1}
          value={getDenormalized('vcf_resonance', paramValues.vcf_resonance ?? 0)}
          onChange={(v) => handleChange('vcf_resonance', getNormalized('vcf_resonance', v))}
        />
        <SynthKnob
          label="TRACK"
          min={0}
          max={2}
          step={1}
          value={getDenormalized('vcf_tracking', paramValues.vcf_tracking ?? 0)}
          onChange={(v) => handleChange('vcf_tracking', getNormalized('vcf_tracking', v))}
          options={trackingLabels}
        />
        <SynthKnob
          label="MOD SRC"
          min={0}
          max={2}
          step={1}
          value={getDenormalized('vcf_mod_source', paramValues.vcf_mod_source ?? 1)}
          onChange={(v) => handleChange('vcf_mod_source', getNormalized('vcf_mod_source', v))}
          options={modSourceLabels}
        />
        <SynthKnob
          label="MOD AMT"
          min={-1}
          max={1}
          value={getDenormalized('vcf_mod_amount', paramValues.vcf_mod_amount ?? 0.75)}
          onChange={(v) => handleChange('vcf_mod_amount', getNormalized('vcf_mod_amount', v))}
        />
        <SynthKnob
          label="LFM"
          min={0}
          max={1}
          value={getDenormalized('vcf_lfm_amount', paramValues.vcf_lfm_amount ?? 0)}
          onChange={(v) => handleChange('vcf_lfm_amount', getNormalized('vcf_lfm_amount', v))}
        />
      </SynthRow>

      {/* LFO Section */}
      <SynthRow label="LFO 1 (VCO FM, VCA)" theme="green">
        <SynthKnob
          label="FREQ"
          min={0}
          max={1}
          value={getDenormalized('lfo1_frequency', paramValues.lfo1_frequency ?? 0.5)}
          onChange={(v) => handleChange('lfo1_frequency', getNormalized('lfo1_frequency', v))}
        />
        <SynthKnob
          label="WAVE"
          min={0}
          max={2}
          step={1}
          value={getDenormalized('lfo1_waveform', paramValues.lfo1_waveform ?? 0)}
          onChange={(v) => handleChange('lfo1_waveform', getNormalized('lfo1_waveform', v))}
          options={lfoWaveLabels}
        />
        <SynthKnob
          label="RANGE"
          min={0}
          max={2}
          step={1}
          value={getDenormalized('lfo1_range', paramValues.lfo1_range ?? 0)}
          onChange={(v) => handleChange('lfo1_range', getNormalized('lfo1_range', v))}
          options={rangeLabels}
        />
      </SynthRow>

      <SynthRow label="LFO 2 (VCO PWM, VCF)" theme="cyan">
        <SynthKnob
          label="FREQ"
          min={0}
          max={1}
          value={getDenormalized('lfo2_frequency', paramValues.lfo2_frequency ?? 0.5)}
          onChange={(v) => handleChange('lfo2_frequency', getNormalized('lfo2_frequency', v))}
        />
        <SynthKnob
          label="WAVE"
          min={0}
          max={2}
          step={1}
          value={getDenormalized('lfo2_waveform', paramValues.lfo2_waveform ?? 0)}
          onChange={(v) => handleChange('lfo2_waveform', getNormalized('lfo2_waveform', v))}
          options={lfoWaveLabels}
        />
        <SynthKnob
          label="RANGE"
          min={0}
          max={2}
          step={1}
          value={getDenormalized('lfo2_range', paramValues.lfo2_range ?? 0)}
          onChange={(v) => handleChange('lfo2_range', getNormalized('lfo2_range', v))}
          options={rangeLabels}
        />
      </SynthRow>

      {/* VCA + ADSR Section */}
      <SynthRow label="VCA" theme="pink">
        <SynthKnob
          label="SRC"
          min={0}
          max={2}
          step={1}
          value={getDenormalized('vca_mod_source', paramValues.vca_mod_source ?? 1)}
          onChange={(v) => handleChange('vca_mod_source', getNormalized('vca_mod_source', v))}
          options={modSourceLabels}
        />
        <SynthKnob
          label="INIT"
          min={0}
          max={1}
          value={getDenormalized('vca_initial_level', paramValues.vca_initial_level ?? 0)}
          onChange={(v) => handleChange('vca_initial_level', getNormalized('vca_initial_level', v))}
        />
        <SynthKnob
          label="LEVEL"
          min={0}
          max={1}
          value={getDenormalized('master_level', paramValues.master_level ?? 0.8)}
          onChange={(v) => handleChange('master_level', getNormalized('master_level', v))}
        />
      </SynthRow>

      {/* ADSR Section */}
      <SynthRow label="ENVELOPE" theme="green">
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
      </SynthRow>

      {/* Output Section */}
      <SynthRow label="OUTPUT" theme="orange">
        <Oscilloscope
          label="SCOPE"
          audioData={audioData}
          width={300}
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
