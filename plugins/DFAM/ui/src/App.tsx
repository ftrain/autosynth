/**
 * @file App.tsx
 * @brief Famdrum - Percussion Synthesizer
 *
 * A percussion synthesizer inspired by the Moog DFAM.
 * Features: 2 VCOs, noise, FM, ladder filter (LP/HP), 8-step sequencer, AD envelopes, effects
 *
 * Layout: Oscillators > Filter+Envelopes > Sequencers > Effects
 */

import React, { useState, useEffect } from 'react';
import { useJUCEBridge } from './hooks/useJUCEBridge';
import { useParameters, normalizeValue, denormalizeValue } from './hooks/useParameters';
import { PARAMETER_DEFINITIONS, WAVEFORM_OPTIONS, SequencerState } from './types/parameters';

// Clock divider options for sync controls - musical divisions including triplets
const CLOCK_DIVIDER_OPTIONS = ['1/16', '1/12', '1/8', '1/6', '1/5', '1/4', '1/3', '1/2', '1x', '3/2', '2x', '3x', '4x', '5x', '6x', '8x', '12x', '16x'];

import { SynthKnob } from './components/SynthKnob';
import { SynthRow } from './components/SynthRow';
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
    <div style={{ background: '#0d0d0d', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* =====================================================================
          HEADER - Industrial Control Room (orange theme)
          ===================================================================== */}
      <SynthRow theme="orange" padding="12px 20px" align="center" justify="flex-start" gap="20px">
        <h1 style={{
          color: '#ff6600',
          fontSize: '28px',
          fontWeight: 'bold',
          letterSpacing: '4px',
          textShadow: '0 0 20px rgba(255,102,0,0.5)',
          margin: 0,
        }}>FAMDRUM</h1>
        <SynthLED label="LINK" active={isConnected} color="green" />
        <div style={{ flex: 1, minWidth: '200px' }}>
          <Oscilloscope audioData={bridgeAudioData as any} width={300} height={50} color="#ff6600" />
        </div>
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
        <SynthKnob label="CLK÷" min={0} max={17} step={1} options={CLOCK_DIVIDER_OPTIONS}
          value={getDenormalized('clock_divider', paramValues.clock_divider ?? 0.47)}
          onChange={(v) => handleChange('clock_divider', getNormalized('clock_divider', v))}
        />
        <SynthKnob label="MASTER" min={-60} max={0}
          value={getDenormalized('master_volume', paramValues.master_volume ?? 0.1)}
          onChange={(v) => handleChange('master_volume', getNormalized('master_volume', v))}
        />
      </SynthRow>

      {/* =====================================================================
          OSCILLATORS - Warm Analog Amber (top section)
          ===================================================================== */}
      <SynthRow label="OSCILLATORS" theme="amber" icon="≋" justify="flex-start" gap="16px">
        {/* VCO 1 */}
        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #886600', borderRadius: '8px', padding: '12px' }}>
          <div style={{ color: '#ffcc66', fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '10px', textAlign: 'center' }}>VCO 1</div>
          <div style={{ display: 'flex', gap: '8px' }}>
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

        {/* VCO 2 */}
        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #886600', borderRadius: '8px', padding: '12px' }}>
          <div style={{ color: '#ffcc66', fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '10px', textAlign: 'center' }}>VCO 2</div>
          <div style={{ display: 'flex', gap: '8px' }}>
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

        {/* FM / NOISE */}
        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #886600', borderRadius: '8px', padding: '12px' }}>
          <div style={{ color: '#ffcc66', fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '10px', textAlign: 'center' }}>FM / NOISE</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <SynthKnob label="FM" min={0} max={1}
              value={getDenormalized('fm_amount', paramValues.fm_amount ?? 0)}
              onChange={(v) => handleChange('fm_amount', getNormalized('fm_amount', v))}
            />
            <SynthKnob label="NOISE" min={0} max={1}
              value={getDenormalized('noise_level', paramValues.noise_level ?? 0)}
              onChange={(v) => handleChange('noise_level', getNormalized('noise_level', v))}
            />
            <SynthKnob label="P→N" min={0} max={1}
              value={getDenormalized('pitch_to_noise', paramValues.pitch_to_noise ?? 0)}
              onChange={(v) => handleChange('pitch_to_noise', getNormalized('pitch_to_noise', v))}
            />
            <SynthKnob label="P→D" min={-1} max={1}
              value={getDenormalized('pitch_to_decay', paramValues.pitch_to_decay ?? 0)}
              onChange={(v) => handleChange('pitch_to_decay', getNormalized('pitch_to_decay', v))}
            />
          </div>
        </div>
      </SynthRow>

      {/* =====================================================================
          FILTER + ENVELOPES - Combined into one row (blue theme)
          ===================================================================== */}
      <SynthRow label="FILTER & ENVELOPES" theme="blue" icon="〰" justify="flex-start" gap="16px">
        {/* Filter Controls */}
        <div style={{ background: 'rgba(0,0,30,0.4)', border: '1px solid #5555cc', borderRadius: '8px', padding: '12px' }}>
          <div style={{ color: '#aaaaff', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '8px', textAlign: 'center' }}>FILTER</div>
          <div style={{ display: 'flex', gap: '8px' }}>
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
          </div>
        </div>

        {/* Filter LFO */}
        <div style={{ background: 'rgba(0,0,30,0.4)', border: '1px solid #5555cc', borderRadius: '8px', padding: '12px' }}>
          <div style={{ color: '#aaaaff', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '8px', textAlign: 'center' }}>FILTER LFO</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <SynthKnob label="RATE" min={0} max={17} step={1} options={CLOCK_DIVIDER_OPTIONS}
              value={getDenormalized('filter_lfo_rate', paramValues.filter_lfo_rate ?? 0.47)}
              onChange={(v) => handleChange('filter_lfo_rate', getNormalized('filter_lfo_rate', v))}
            />
            <SynthKnob label="AMT" min={0} max={1}
              value={getDenormalized('filter_lfo_amount', paramValues.filter_lfo_amount ?? 0)}
              onChange={(v) => handleChange('filter_lfo_amount', getNormalized('filter_lfo_amount', v))}
            />
          </div>
        </div>

        {/* Pitch Envelope */}
        <div style={{ background: 'rgba(0,30,15,0.5)', border: '1px solid #00aa44', borderRadius: '8px', padding: '12px' }}>
          <div style={{ color: '#66ff99', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '8px', textAlign: 'center' }}>▲ PITCH ENV</div>
          <div style={{ display: 'flex', gap: '8px' }}>
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

        {/* VCF/VCA Envelope */}
        <div style={{ background: 'rgba(0,30,15,0.5)', border: '1px solid #00aa44', borderRadius: '8px', padding: '12px' }}>
          <div style={{ color: '#66ff99', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '8px', textAlign: 'center' }}>▲ VCF/VCA ENV</div>
          <div style={{ display: 'flex', gap: '8px' }}>
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
      </SynthRow>

      {/* =====================================================================
          SEQUENCERS - Combined into one row (magenta theme)
          ===================================================================== */}
      <SynthRow label="SEQUENCERS" theme="magenta" icon="◆" align="center" justify="flex-start" gap="24px">
        {/* PITCH SEQUENCER */}
        <div style={{ background: 'rgba(40,0,40,0.4)', border: '1px solid #cc00cc', borderRadius: '8px', padding: '12px' }}>
          <div style={{ color: '#ff66ff', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '8px', textAlign: 'center' }}>PITCH</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <SynthKnob label="LFO ↻" min={0} max={17} step={1} options={CLOCK_DIVIDER_OPTIONS}
                value={getDenormalized('pitch_lfo_rate', paramValues.pitch_lfo_rate ?? 0.47)}
                onChange={(v) => handleChange('pitch_lfo_rate', getNormalized('pitch_lfo_rate', v))}
              />
              <SynthKnob label="LFO ↕" min={0} max={24}
                value={getDenormalized('pitch_lfo_amount', paramValues.pitch_lfo_amount ?? 0.5)}
                onChange={(v) => handleChange('pitch_lfo_amount', getNormalized('pitch_lfo_amount', v))}
              />
            </div>
          </div>
        </div>

        {/* VELOCITY SEQUENCER */}
        <div style={{ background: 'rgba(0,40,40,0.4)', border: '1px solid #00cccc', borderRadius: '8px', padding: '12px' }}>
          <div style={{ color: '#66ffff', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '8px', textAlign: 'center' }}>VELOCITY</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <SynthKnob label="LFO ↻" min={0} max={17} step={1} options={CLOCK_DIVIDER_OPTIONS}
                value={getDenormalized('vel_lfo_rate', paramValues.vel_lfo_rate ?? 0.47)}
                onChange={(v) => handleChange('vel_lfo_rate', getNormalized('vel_lfo_rate', v))}
              />
              <SynthKnob label="LFO ↕" min={0} max={1}
                value={getDenormalized('vel_lfo_amount', paramValues.vel_lfo_amount ?? 0.5)}
                onChange={(v) => handleChange('vel_lfo_amount', getNormalized('vel_lfo_amount', v))}
              />
            </div>
          </div>
        </div>
      </SynthRow>

      {/* =====================================================================
          EFFECTS - Deep Space Pink
          ===================================================================== */}
      <SynthRow label="EFFECTS" theme="pink" icon="✦" justify="flex-start" gap="12px">
        {/* Drive */}
        <div style={{ background: 'rgba(255,51,102,0.05)', border: '1px solid rgba(255,51,102,0.3)', borderRadius: '8px', padding: '10px' }}>
          <div style={{ color: '#ff6688', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '8px', textAlign: 'center' }}>🔥 DRIVE</div>
          <div style={{ display: 'flex', gap: '6px' }}>
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

        {/* Delay */}
        <div style={{ background: 'rgba(255,51,102,0.05)', border: '1px solid rgba(255,51,102,0.3)', borderRadius: '8px', padding: '10px' }}>
          <div style={{ color: '#ff6688', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '8px', textAlign: 'center' }}>📡 DELAY</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <SynthKnob label="TIME" min={0} max={17} step={1} options={CLOCK_DIVIDER_OPTIONS}
              value={getDenormalized('delay_time', paramValues.delay_time ?? 0.29)}
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

        {/* Reverb */}
        <div style={{ background: 'rgba(255,51,102,0.05)', border: '1px solid rgba(255,51,102,0.3)', borderRadius: '8px', padding: '10px' }}>
          <div style={{ color: '#ff6688', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '8px', textAlign: 'center' }}>🌌 REVERB</div>
          <div style={{ display: 'flex', gap: '6px' }}>
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

        {/* Compressor */}
        <div style={{ background: 'rgba(255,51,102,0.05)', border: '1px solid rgba(255,51,102,0.3)', borderRadius: '8px', padding: '10px' }}>
          <div style={{ color: '#ff6688', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '8px', textAlign: 'center' }}>💪 COMP</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <SynthKnob label="THRESH" min={-60} max={0}
              value={getDenormalized('comp_threshold', paramValues.comp_threshold ?? 0.83)}
              onChange={(v) => handleChange('comp_threshold', getNormalized('comp_threshold', v))}
            />
            <SynthKnob label="RATIO" min={1} max={20}
              value={getDenormalized('comp_ratio', paramValues.comp_ratio ?? 0.16)}
              onChange={(v) => handleChange('comp_ratio', getNormalized('comp_ratio', v))}
            />
            <SynthKnob label="GAIN" min={0} max={24}
              value={getDenormalized('comp_makeup', paramValues.comp_makeup ?? 0)}
              onChange={(v) => handleChange('comp_makeup', getNormalized('comp_makeup', v))}
            />
            <SynthKnob label="MIX" min={0} max={1}
              value={getDenormalized('comp_mix', paramValues.comp_mix ?? 1)}
              onChange={(v) => handleChange('comp_mix', getNormalized('comp_mix', v))}
            />
          </div>
        </div>
      </SynthRow>
    </div>
  );
};

export default App;
