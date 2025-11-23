/**
 * @file App.tsx
 * @brief Famdrum - Percussion Synthesizer
 *
 * A percussion synthesizer inspired by the Moog DFAM.
 * Features: 2 VCOs, noise, FM, ladder filter (LP/HP), 8-step sequencer, AD envelopes, effects
 */

import React, { useState, useEffect } from 'react';
import { useJUCEBridge } from './hooks/useJUCEBridge';
import { useParameters, normalizeValue, denormalizeValue } from './hooks/useParameters';
import { PARAMETER_DEFINITIONS, WAVEFORM_OPTIONS, SequencerState } from './types/parameters';

import { SynthKnob } from './components/SynthKnob';
import { DFAMSequencer } from './components/DFAMSequencer';
import Oscilloscope from './components/Oscilloscope';
import { SynthLED } from './components/SynthLED';
import { TransportControls } from './components/TransportControls';
import './styles/global.css';

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
  const { isConnected, audioData: bridgeAudioData } = useJUCEBridge({ enableAudioData: true });

  const { paramValues, handleChange } = useParameters({
    parameters: PARAMETER_DEFINITIONS,
    syncWithJUCE: true,
  });

  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    (window as any).onSequencerState = (state: SequencerState) => {
      setCurrentStep(state.currentStep);
    };
    return () => {
      (window as any).onSequencerState = null;
    };
  }, []);

  const isRunning = getDenormalized('running', paramValues.running ?? 0) > 0.5;

  // Get sequencer values as arrays
  const pitchValues = Array.from({ length: 8 }, (_, i) =>
    getDenormalized(`seq_pitch_${i}`, paramValues[`seq_pitch_${i}`] ?? 0.5)
  );
  const velocityValues = Array.from({ length: 8 }, (_, i) =>
    getDenormalized(`seq_vel_${i}`, paramValues[`seq_vel_${i}`] ?? 1)
  );
  const pitchLfoEnabled = Array.from({ length: 8 }, (_, i) =>
    getDenormalized(`pitch_lfo_en_${i}`, paramValues[`pitch_lfo_en_${i}`] ?? 0) > 0.5
  );
  const velocityLfoEnabled = Array.from({ length: 8 }, (_, i) =>
    getDenormalized(`vel_lfo_en_${i}`, paramValues[`vel_lfo_en_${i}`] ?? 0) > 0.5
  );

  return (
    <div className="synth-container">
      {/* HEADER */}
      <header className="synth-header">
        <h1 className="synth-title" style={{ color: '#ff6600' }}>FAMDRUM</h1>
        <SynthLED label="JUCE" active={isConnected} color="green" />
        <Oscilloscope audioData={bridgeAudioData as any} width={250} height={60} color="#ff6600" />
        <TransportControls
          isPlaying={isRunning}
          isRecording={false}
          onPlay={() => handleChange('running', 1)}
          onPause={() => handleChange('running', 0)}
          onStop={() => handleChange('running', 0)}
          onRecord={() => {}}
        />
        <SynthKnob label="TEMPO" min={20} max={300}
          value={getDenormalized('tempo', paramValues.tempo ?? 0.5)}
          onChange={(v) => handleChange('tempo', getNormalized('tempo', v))}
        />
        <SynthKnob label="MASTER" min={-60} max={0}
          value={getDenormalized('master_volume', paramValues.master_volume ?? 0.1)}
          onChange={(v) => handleChange('master_volume', getNormalized('master_volume', v))}
        />
      </header>

      {/* PITCH SEQUENCER */}
      <section className="synth-section">
        <h2 className="section-title" style={{ color: '#ff00ff' }}>PITCH SEQUENCE</h2>
        <div className="control-row">
          <DFAMSequencer
            label=""
            values={pitchValues}
            currentStep={currentStep}
            min={-24} max={24} bipolar={true}
            onChange={(step, value) => handleChange(`seq_pitch_${step}`, getNormalized(`seq_pitch_${step}`, value))}
            formatValue={(v) => `${v > 0 ? '+' : ''}${v}`}
            lfoEnabled={pitchLfoEnabled}
            onLfoToggle={(step, enabled) => handleChange(`pitch_lfo_en_${step}`, enabled ? 1 : 0)}
            lfoColor="#ff00ff"
          />
          <div className="knob-row">
            <SynthKnob label="LFO RATE" min={0.1} max={10}
              value={getDenormalized('pitch_lfo_rate', paramValues.pitch_lfo_rate ?? 0.1)}
              onChange={(v) => handleChange('pitch_lfo_rate', getNormalized('pitch_lfo_rate', v))}
            />
            <SynthKnob label="LFO AMT" min={0} max={24}
              value={getDenormalized('pitch_lfo_amount', paramValues.pitch_lfo_amount ?? 0.5)}
              onChange={(v) => handleChange('pitch_lfo_amount', getNormalized('pitch_lfo_amount', v))}
            />
          </div>
        </div>
      </section>

      {/* VELOCITY SEQUENCER */}
      <section className="synth-section">
        <h2 className="section-title" style={{ color: '#00ffff' }}>VELOCITY SEQUENCE</h2>
        <div className="control-row">
          <DFAMSequencer
            label=""
            values={velocityValues.map(v => Math.round(v * 100))}
            currentStep={currentStep}
            min={0} max={100} bipolar={false}
            accentColor="#4a9eff"
            onChange={(step, value) => handleChange(`seq_vel_${step}`, getNormalized(`seq_vel_${step}`, value / 100))}
            formatValue={(v) => `${v}%`}
            lfoEnabled={velocityLfoEnabled}
            onLfoToggle={(step, enabled) => handleChange(`vel_lfo_en_${step}`, enabled ? 1 : 0)}
            lfoColor="#00ffff"
          />
          <div className="knob-row">
            <SynthKnob label="LFO RATE" min={0.1} max={10}
              value={getDenormalized('vel_lfo_rate', paramValues.vel_lfo_rate ?? 0.1)}
              onChange={(v) => handleChange('vel_lfo_rate', getNormalized('vel_lfo_rate', v))}
            />
            <SynthKnob label="LFO AMT" min={0} max={1}
              value={getDenormalized('vel_lfo_amount', paramValues.vel_lfo_amount ?? 0.5)}
              onChange={(v) => handleChange('vel_lfo_amount', getNormalized('vel_lfo_amount', v))}
            />
          </div>
        </div>
      </section>

      {/* OSCILLATORS */}
      <section className="synth-section">
        <h2 className="section-title">OSCILLATORS</h2>
        <div className="oscillators-grid">
          <div className="oscillator-section">
            <h3>VCO 1</h3>
            <div className="knob-row">
              <SynthKnob label="FREQ" min={20} max={2000}
                value={getDenormalized('vco1_freq', paramValues.vco1_freq ?? 0.1)}
                onChange={(v) => handleChange('vco1_freq', getNormalized('vco1_freq', v))}
              />
              <SynthKnob label="WAVE" min={0} max={3} step={1} options={WAVEFORM_OPTIONS}
                value={getDenormalized('vco1_wave', paramValues.vco1_wave ?? 0)}
                onChange={(v) => handleChange('vco1_wave', getNormalized('vco1_wave', v))}
              />
              <SynthKnob label="LEVEL" min={0} max={1}
                value={getDenormalized('vco1_level', paramValues.vco1_level ?? 0.5)}
                onChange={(v) => handleChange('vco1_level', getNormalized('vco1_level', v))}
              />
            </div>
          </div>
          <div className="oscillator-section">
            <h3>VCO 2</h3>
            <div className="knob-row">
              <SynthKnob label="FREQ" min={20} max={2000}
                value={getDenormalized('vco2_freq', paramValues.vco2_freq ?? 0.1)}
                onChange={(v) => handleChange('vco2_freq', getNormalized('vco2_freq', v))}
              />
              <SynthKnob label="WAVE" min={0} max={3} step={1} options={WAVEFORM_OPTIONS}
                value={getDenormalized('vco2_wave', paramValues.vco2_wave ?? 0)}
                onChange={(v) => handleChange('vco2_wave', getNormalized('vco2_wave', v))}
              />
              <SynthKnob label="LEVEL" min={0} max={1}
                value={getDenormalized('vco2_level', paramValues.vco2_level ?? 0.5)}
                onChange={(v) => handleChange('vco2_level', getNormalized('vco2_level', v))}
              />
            </div>
          </div>
          <div className="oscillator-section">
            <h3>FM / NOISE</h3>
            <div className="knob-row">
              <SynthKnob label="FM" min={0} max={1}
                value={getDenormalized('fm_amount', paramValues.fm_amount ?? 0)}
                onChange={(v) => handleChange('fm_amount', getNormalized('fm_amount', v))}
              />
              <SynthKnob label="NOISE" min={0} max={1}
                value={getDenormalized('noise_level', paramValues.noise_level ?? 0)}
                onChange={(v) => handleChange('noise_level', getNormalized('noise_level', v))}
              />
              <SynthKnob label="P>NSE" min={0} max={1}
                value={getDenormalized('pitch_to_noise', paramValues.pitch_to_noise ?? 0)}
                onChange={(v) => handleChange('pitch_to_noise', getNormalized('pitch_to_noise', v))}
              />
              <SynthKnob label="P>DCY" min={-1} max={1}
                value={getDenormalized('pitch_to_decay', paramValues.pitch_to_decay ?? 0)}
                onChange={(v) => handleChange('pitch_to_decay', getNormalized('pitch_to_decay', v))}
              />
            </div>
          </div>
        </div>
      </section>

      {/* FILTER */}
      <section className="synth-section">
        <h2 className="section-title">FILTER</h2>
        <div className="knob-row filter-knobs">
          <SynthKnob label="CUTOFF" min={20} max={20000}
            value={getDenormalized('filter_cutoff', paramValues.filter_cutoff ?? 0.3)}
            onChange={(v) => handleChange('filter_cutoff', getNormalized('filter_cutoff', v))}
          />
          <SynthKnob label="RESO" min={0} max={1}
            value={getDenormalized('filter_reso', paramValues.filter_reso ?? 0)}
            onChange={(v) => handleChange('filter_reso', getNormalized('filter_reso', v))}
          />
          <SynthKnob label="ENV" min={0} max={1}
            value={getDenormalized('filter_env_amount', paramValues.filter_env_amount ?? 0.5)}
            onChange={(v) => handleChange('filter_env_amount', getNormalized('filter_env_amount', v))}
          />
          <SynthKnob label="MODE" min={0} max={1} step={1} options={['LP', 'HP']}
            value={getDenormalized('filter_mode', paramValues.filter_mode ?? 0)}
            onChange={(v) => handleChange('filter_mode', getNormalized('filter_mode', v))}
          />
          <SynthKnob label="LFO RT" min={0.1} max={10}
            value={getDenormalized('filter_lfo_rate', paramValues.filter_lfo_rate ?? 0.1)}
            onChange={(v) => handleChange('filter_lfo_rate', getNormalized('filter_lfo_rate', v))}
          />
          <SynthKnob label="LFO AMT" min={0} max={1}
            value={getDenormalized('filter_lfo_amount', paramValues.filter_lfo_amount ?? 0)}
            onChange={(v) => handleChange('filter_lfo_amount', getNormalized('filter_lfo_amount', v))}
          />
        </div>
      </section>

      {/* ENVELOPES */}
      <section className="synth-section">
        <h2 className="section-title">ENVELOPES</h2>
        <div className="envelope-row">
          <div className="envelope-group">
            <h3>PITCH ENV</h3>
            <div className="knob-row">
              <SynthKnob label="ATK" min={0.001} max={2}
                value={getDenormalized('pitch_env_attack', paramValues.pitch_env_attack ?? 0)}
                onChange={(v) => handleChange('pitch_env_attack', getNormalized('pitch_env_attack', v))}
              />
              <SynthKnob label="DCY" min={0.001} max={2}
                value={getDenormalized('pitch_env_decay', paramValues.pitch_env_decay ?? 0.15)}
                onChange={(v) => handleChange('pitch_env_decay', getNormalized('pitch_env_decay', v))}
              />
              <SynthKnob label="AMT" min={0} max={48}
                value={getDenormalized('pitch_env_amount', paramValues.pitch_env_amount ?? 0.5)}
                onChange={(v) => handleChange('pitch_env_amount', getNormalized('pitch_env_amount', v))}
              />
            </div>
          </div>
          <div className="envelope-group">
            <h3>VCF/VCA ENV</h3>
            <div className="knob-row">
              <SynthKnob label="ATK" min={0.001} max={2}
                value={getDenormalized('vcf_vca_attack', paramValues.vcf_vca_attack ?? 0)}
                onChange={(v) => handleChange('vcf_vca_attack', getNormalized('vcf_vca_attack', v))}
              />
              <SynthKnob label="DCY" min={0.001} max={2}
                value={getDenormalized('vcf_vca_decay', paramValues.vcf_vca_decay ?? 0.25)}
                onChange={(v) => handleChange('vcf_vca_decay', getNormalized('vcf_vca_decay', v))}
              />
            </div>
          </div>
        </div>
      </section>

      {/* EFFECTS */}
      <section className="synth-section">
        <h2 className="section-title" style={{ color: '#ff3366' }}>EFFECTS</h2>
        <div className="oscillators-grid">
          <div className="oscillator-section">
            <h3 style={{ color: '#ff3366' }}>DRIVE</h3>
            <div className="knob-row">
              <SynthKnob label="DRIVE" min={1} max={20}
                value={getDenormalized('sat_drive', paramValues.sat_drive ?? 0)}
                onChange={(v) => handleChange('sat_drive', getNormalized('sat_drive', v))}
              />
              <SynthKnob label="MIX" min={0} max={1}
                value={getDenormalized('sat_mix', paramValues.sat_mix ?? 0)}
                onChange={(v) => handleChange('sat_mix', getNormalized('sat_mix', v))}
              />
            </div>
          </div>
          <div className="oscillator-section">
            <h3 style={{ color: '#ff3366' }}>DELAY</h3>
            <div className="knob-row">
              <SynthKnob label="TIME" min={0.001} max={2}
                value={getDenormalized('delay_time', paramValues.delay_time ?? 0.125)}
                onChange={(v) => handleChange('delay_time', getNormalized('delay_time', v))}
              />
              <SynthKnob label="FDBK" min={0} max={0.95}
                value={getDenormalized('delay_feedback', paramValues.delay_feedback ?? 0.315)}
                onChange={(v) => handleChange('delay_feedback', getNormalized('delay_feedback', v))}
              />
              <SynthKnob label="MIX" min={0} max={1}
                value={getDenormalized('delay_mix', paramValues.delay_mix ?? 0)}
                onChange={(v) => handleChange('delay_mix', getNormalized('delay_mix', v))}
              />
            </div>
          </div>
          <div className="oscillator-section">
            <h3 style={{ color: '#ff3366' }}>REVERB</h3>
            <div className="knob-row">
              <SynthKnob label="DECAY" min={0.1} max={10}
                value={getDenormalized('reverb_decay', paramValues.reverb_decay ?? 0.2)}
                onChange={(v) => handleChange('reverb_decay', getNormalized('reverb_decay', v))}
              />
              <SynthKnob label="DAMP" min={0} max={1}
                value={getDenormalized('reverb_damping', paramValues.reverb_damping ?? 0.5)}
                onChange={(v) => handleChange('reverb_damping', getNormalized('reverb_damping', v))}
              />
              <SynthKnob label="MIX" min={0} max={1}
                value={getDenormalized('reverb_mix', paramValues.reverb_mix ?? 0)}
                onChange={(v) => handleChange('reverb_mix', getNormalized('reverb_mix', v))}
              />
            </div>
          </div>
          <div className="oscillator-section">
            <h3 style={{ color: '#ff3366' }}>COMPRESSOR</h3>
            <div className="knob-row">
              <SynthKnob label="THRESH" min={-60} max={0}
                value={getDenormalized('comp_threshold', paramValues.comp_threshold ?? 0.83)}
                onChange={(v) => handleChange('comp_threshold', getNormalized('comp_threshold', v))}
              />
              <SynthKnob label="RATIO" min={1} max={20}
                value={getDenormalized('comp_ratio', paramValues.comp_ratio ?? 0.16)}
                onChange={(v) => handleChange('comp_ratio', getNormalized('comp_ratio', v))}
              />
              <SynthKnob label="MAKEUP" min={0} max={24}
                value={getDenormalized('comp_makeup', paramValues.comp_makeup ?? 0)}
                onChange={(v) => handleChange('comp_makeup', getNormalized('comp_makeup', v))}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default App;
