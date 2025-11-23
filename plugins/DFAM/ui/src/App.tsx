/**
 * @file App.tsx
 * @brief DFAM - Drum From Another Machine
 *
 * A clone of the Moog DFAM percussion synthesizer.
 * Features: 2 VCOs, noise, FM, ladder filter, 8-step sequencer, AD envelopes
 */

import React, { useState, useEffect } from 'react';
import { useJUCEBridge } from './hooks/useJUCEBridge';
import { useParameters, normalizeValue, denormalizeValue } from './hooks/useParameters';
import { PARAMETER_DEFINITIONS, WAVEFORM_OPTIONS, SequencerState } from './types/parameters';

import { SynthKnob } from './components/SynthKnob';
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

  return (
    <div className="synth-container" style={{ padding: '16px', minHeight: '100vh', background: '#1a1a1a' }}>
      {/* HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 style={{ color: '#ff6600', fontSize: '28px', fontWeight: 'bold', letterSpacing: '3px', margin: 0 }}>DFAM</h1>
          <SynthLED label="JUCE" active={isConnected} color="green" />
        </div>

        <Oscilloscope
          audioData={bridgeAudioData as any}
          width={250}
          height={60}
          color="#ff6600"
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <TransportControls
            isPlaying={isRunning}
            isRecording={false}
            onPlay={() => handleChange('running', 1)}
            onPause={() => handleChange('running', 0)}
            onStop={() => handleChange('running', 0)}
            onRecord={() => {}}
          />
          <SynthKnob
            label="TEMPO"
            min={20}
            max={300}
            value={getDenormalized('tempo', paramValues.tempo ?? 0.5)}
            onChange={(v) => handleChange('tempo', getNormalized('tempo', v))}
          />
          <SynthKnob
            label="MASTER"
            min={-60}
            max={0}
            value={getDenormalized('master_volume', paramValues.master_volume ?? 0.1)}
            onChange={(v) => handleChange('master_volume', getNormalized('master_volume', v))}
          />
        </div>
      </header>

      {/* 8-STEP SEQUENCER */}
      <section style={{ marginBottom: '24px' }}>
        <div style={{ color: '#888', fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '8px' }}>
          8-STEP SEQUENCER
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((step) => (
            <div
              key={step}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: '8px',
                background: currentStep === step ? 'rgba(255, 102, 0, 0.2)' : 'rgba(40, 40, 40, 0.8)',
                border: currentStep === step ? '2px solid #ff6600' : '2px solid #333',
              }}
            >
              <div style={{ color: currentStep === step ? '#ff6600' : '#666', fontWeight: 'bold', fontSize: '12px' }}>
                {step + 1}
              </div>
              <SynthKnob
                label="PITCH"
                min={-24}
                max={24}
                step={1}
                value={getDenormalized(`seq_pitch_${step}`, paramValues[`seq_pitch_${step}`] ?? 0.5)}
                onChange={(v) => handleChange(`seq_pitch_${step}`, getNormalized(`seq_pitch_${step}`, v))}
              />
              <SynthKnob
                label="VEL"
                min={0}
                max={1}
                value={getDenormalized(`seq_vel_${step}`, paramValues[`seq_vel_${step}`] ?? 1)}
                onChange={(v) => handleChange(`seq_vel_${step}`, getNormalized(`seq_vel_${step}`, v))}
              />
            </div>
          ))}
        </div>
      </section>

      {/* SYNTH CONTROLS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {/* VCO 1 */}
        <div style={{ background: 'rgba(40, 40, 40, 0.6)', borderRadius: '8px', padding: '16px' }}>
          <div style={{ color: '#888', fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '12px' }}>
            VCO 1
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <SynthKnob
              label="FREQ"
              min={20}
              max={2000}
              value={getDenormalized('vco1_freq', paramValues.vco1_freq ?? 0.1)}
              onChange={(v) => handleChange('vco1_freq', getNormalized('vco1_freq', v))}
            />
            <SynthKnob
              label="WAVE"
              min={0}
              max={3}
              step={1}
              value={getDenormalized('vco1_wave', paramValues.vco1_wave ?? 0)}
              onChange={(v) => handleChange('vco1_wave', getNormalized('vco1_wave', v))}
              options={WAVEFORM_OPTIONS}
            />
            <SynthKnob
              label="LEVEL"
              min={0}
              max={1}
              value={getDenormalized('vco1_level', paramValues.vco1_level ?? 0.5)}
              onChange={(v) => handleChange('vco1_level', getNormalized('vco1_level', v))}
            />
          </div>
        </div>

        {/* VCO 2 */}
        <div style={{ background: 'rgba(40, 40, 40, 0.6)', borderRadius: '8px', padding: '16px' }}>
          <div style={{ color: '#888', fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '12px' }}>
            VCO 2
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <SynthKnob
              label="FREQ"
              min={20}
              max={2000}
              value={getDenormalized('vco2_freq', paramValues.vco2_freq ?? 0.1)}
              onChange={(v) => handleChange('vco2_freq', getNormalized('vco2_freq', v))}
            />
            <SynthKnob
              label="WAVE"
              min={0}
              max={3}
              step={1}
              value={getDenormalized('vco2_wave', paramValues.vco2_wave ?? 0)}
              onChange={(v) => handleChange('vco2_wave', getNormalized('vco2_wave', v))}
              options={WAVEFORM_OPTIONS}
            />
            <SynthKnob
              label="LEVEL"
              min={0}
              max={1}
              value={getDenormalized('vco2_level', paramValues.vco2_level ?? 0.5)}
              onChange={(v) => handleChange('vco2_level', getNormalized('vco2_level', v))}
            />
          </div>
        </div>

        {/* MIXER */}
        <div style={{ background: 'rgba(40, 40, 40, 0.6)', borderRadius: '8px', padding: '16px' }}>
          <div style={{ color: '#888', fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '12px' }}>
            MIXER
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <SynthKnob
              label="FM"
              min={0}
              max={1}
              value={getDenormalized('fm_amount', paramValues.fm_amount ?? 0)}
              onChange={(v) => handleChange('fm_amount', getNormalized('fm_amount', v))}
            />
            <SynthKnob
              label="NOISE"
              min={0}
              max={1}
              value={getDenormalized('noise_level', paramValues.noise_level ?? 0)}
              onChange={(v) => handleChange('noise_level', getNormalized('noise_level', v))}
            />
          </div>
        </div>

        {/* FILTER */}
        <div style={{ background: 'rgba(40, 40, 40, 0.6)', borderRadius: '8px', padding: '16px' }}>
          <div style={{ color: '#888', fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '12px' }}>
            FILTER
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <SynthKnob
              label="CUTOFF"
              min={20}
              max={20000}
              value={getDenormalized('filter_cutoff', paramValues.filter_cutoff ?? 0.3)}
              onChange={(v) => handleChange('filter_cutoff', getNormalized('filter_cutoff', v))}
            />
            <SynthKnob
              label="RESO"
              min={0}
              max={1}
              value={getDenormalized('filter_reso', paramValues.filter_reso ?? 0)}
              onChange={(v) => handleChange('filter_reso', getNormalized('filter_reso', v))}
            />
            <SynthKnob
              label="ENV"
              min={0}
              max={1}
              value={getDenormalized('filter_env_amount', paramValues.filter_env_amount ?? 0.5)}
              onChange={(v) => handleChange('filter_env_amount', getNormalized('filter_env_amount', v))}
            />
          </div>
        </div>
      </div>

      {/* ENVELOPES */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
        {/* PITCH ENVELOPE */}
        <div style={{ background: 'rgba(40, 40, 40, 0.6)', borderRadius: '8px', padding: '16px' }}>
          <div style={{ color: '#888', fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '12px' }}>
            PITCH ENVELOPE
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <SynthKnob
              label="ATTACK"
              min={0.001}
              max={2}
              value={getDenormalized('pitch_env_attack', paramValues.pitch_env_attack ?? 0)}
              onChange={(v) => handleChange('pitch_env_attack', getNormalized('pitch_env_attack', v))}
            />
            <SynthKnob
              label="DECAY"
              min={0.001}
              max={2}
              value={getDenormalized('pitch_env_decay', paramValues.pitch_env_decay ?? 0.15)}
              onChange={(v) => handleChange('pitch_env_decay', getNormalized('pitch_env_decay', v))}
            />
            <SynthKnob
              label="AMOUNT"
              min={0}
              max={48}
              value={getDenormalized('pitch_env_amount', paramValues.pitch_env_amount ?? 0.5)}
              onChange={(v) => handleChange('pitch_env_amount', getNormalized('pitch_env_amount', v))}
            />
          </div>
        </div>

        {/* VCF/VCA ENVELOPE */}
        <div style={{ background: 'rgba(40, 40, 40, 0.6)', borderRadius: '8px', padding: '16px' }}>
          <div style={{ color: '#888', fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '12px' }}>
            VCF / VCA ENVELOPE
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <SynthKnob
              label="ATTACK"
              min={0.001}
              max={2}
              value={getDenormalized('vcf_vca_attack', paramValues.vcf_vca_attack ?? 0)}
              onChange={(v) => handleChange('vcf_vca_attack', getNormalized('vcf_vca_attack', v))}
            />
            <SynthKnob
              label="DECAY"
              min={0.001}
              max={2}
              value={getDenormalized('vcf_vca_decay', paramValues.vcf_vca_decay ?? 0.25)}
              onChange={(v) => handleChange('vcf_vca_decay', getNormalized('vcf_vca_decay', v))}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
