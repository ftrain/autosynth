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

// =============================================================================
// VISUAL THEMES - Each module has a distinct visual identity
// =============================================================================

const THEMES = {
  // Header: Industrial control room - dark steel with status indicators
  header: {
    container: {
      background: 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)',
      borderBottom: '3px solid #ff6600',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    },
    title: {
      color: '#ff6600',
      fontSize: '28px',
      fontWeight: 'bold',
      letterSpacing: '4px',
      textShadow: '0 0 20px rgba(255,102,0,0.5)',
      margin: 0,
    },
  },

  // Pitch Sequencer: Neon magenta - energetic, musical
  pitchSeq: {
    container: {
      background: 'linear-gradient(135deg, #1a0a1a 0%, #2d1033 50%, #1a0a1a 100%)',
      border: '1px solid #ff00ff',
      borderRadius: '8px',
      padding: '16px',
      margin: '8px',
      boxShadow: '0 0 30px rgba(255,0,255,0.15), inset 0 0 60px rgba(255,0,255,0.05)',
    },
    title: {
      color: '#ff00ff',
      fontSize: '14px',
      fontWeight: 'bold',
      letterSpacing: '3px',
      textShadow: '0 0 10px rgba(255,0,255,0.8)',
      marginBottom: '12px',
      textTransform: 'uppercase' as const,
    },
    controlRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
    },
  },

  // Velocity Sequencer: Cyan digital - precise, dynamic
  velSeq: {
    container: {
      background: 'linear-gradient(135deg, #0a1a1a 0%, #0d2d33 50%, #0a1a1a 100%)',
      border: '1px solid #00ffff',
      borderRadius: '8px',
      padding: '16px',
      margin: '8px',
      boxShadow: '0 0 30px rgba(0,255,255,0.15), inset 0 0 60px rgba(0,255,255,0.05)',
    },
    title: {
      color: '#00ffff',
      fontSize: '14px',
      fontWeight: 'bold',
      letterSpacing: '3px',
      textShadow: '0 0 10px rgba(0,255,255,0.8)',
      marginBottom: '12px',
      textTransform: 'uppercase' as const,
    },
    controlRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
    },
  },

  // Oscillators: Warm amber - analog, organic waveforms
  oscillators: {
    container: {
      background: 'linear-gradient(180deg, #1a1408 0%, #2d2010 50%, #1a1408 100%)',
      border: '2px solid #cc8800',
      borderRadius: '12px',
      padding: '20px',
      margin: '8px',
      boxShadow: '0 0 40px rgba(204,136,0,0.2), inset 0 1px 0 rgba(255,200,100,0.1)',
    },
    title: {
      color: '#ffaa00',
      fontSize: '16px',
      fontWeight: 'bold',
      letterSpacing: '4px',
      textShadow: '0 0 15px rgba(255,170,0,0.6)',
      marginBottom: '16px',
      borderBottom: '1px solid #cc8800',
      paddingBottom: '8px',
    },
    vcoBox: {
      background: 'rgba(0,0,0,0.3)',
      border: '1px solid #886600',
      borderRadius: '8px',
      padding: '12px',
      flex: 1,
    },
    vcoTitle: {
      color: '#ffcc66',
      fontSize: '12px',
      fontWeight: 'bold',
      letterSpacing: '2px',
      marginBottom: '10px',
      textAlign: 'center' as const,
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '12px',
    },
    knobRow: {
      display: 'flex',
      justifyContent: 'center',
      gap: '8px',
    },
  },

  // Filter: Liquid blue/purple - flowing, resonant
  filter: {
    container: {
      background: 'linear-gradient(135deg, #0a0a1f 0%, #151530 30%, #1a1040 70%, #0a0a1f 100%)',
      border: '2px solid #6666ff',
      borderRadius: '16px',
      padding: '20px',
      margin: '8px',
      boxShadow: '0 0 50px rgba(102,102,255,0.2), inset 0 0 80px rgba(102,102,255,0.05)',
      position: 'relative' as const,
      overflow: 'hidden',
    },
    title: {
      color: '#8888ff',
      fontSize: '18px',
      fontWeight: 'bold',
      letterSpacing: '6px',
      textShadow: '0 0 20px rgba(136,136,255,0.8)',
      marginBottom: '16px',
      textAlign: 'center' as const,
    },
    knobRow: {
      display: 'flex',
      justifyContent: 'center',
      gap: '16px',
      flexWrap: 'wrap' as const,
    },
    // Decorative wave overlay
    wave: {
      position: 'absolute' as const,
      bottom: 0,
      left: 0,
      right: 0,
      height: '40px',
      background: 'linear-gradient(180deg, transparent 0%, rgba(102,102,255,0.1) 100%)',
      pointerEvents: 'none' as const,
    },
  },

  // Envelopes: Sharp green - precise timing, attack/decay
  envelopes: {
    container: {
      background: 'linear-gradient(180deg, #0a1a0a 0%, #102010 50%, #0a1a0a 100%)',
      border: '2px solid #00cc44',
      borderRadius: '8px',
      padding: '16px',
      margin: '8px',
      boxShadow: '0 0 30px rgba(0,204,68,0.15)',
      clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)',
    },
    title: {
      color: '#00ff55',
      fontSize: '14px',
      fontWeight: 'bold',
      letterSpacing: '3px',
      textShadow: '0 0 10px rgba(0,255,85,0.6)',
      marginBottom: '12px',
    },
    envRow: {
      display: 'flex',
      gap: '20px',
      justifyContent: 'center',
    },
    envGroup: {
      background: 'rgba(0,40,20,0.5)',
      border: '1px solid #008833',
      borderRadius: '6px',
      padding: '12px',
      minWidth: '160px',
    },
    envTitle: {
      color: '#66ff99',
      fontSize: '11px',
      fontWeight: 'bold',
      letterSpacing: '2px',
      marginBottom: '10px',
      textAlign: 'center' as const,
    },
    knobRow: {
      display: 'flex',
      justifyContent: 'center',
      gap: '8px',
    },
  },

  // Effects: Deep space - expansive, atmospheric
  effects: {
    container: {
      background: 'linear-gradient(180deg, #1a0a1a 0%, #200818 30%, #180a20 70%, #100510 100%)',
      border: '1px solid #ff3366',
      borderRadius: '12px',
      padding: '20px',
      margin: '8px',
      boxShadow: '0 0 60px rgba(255,51,102,0.1), inset 0 0 100px rgba(255,51,102,0.03)',
    },
    title: {
      color: '#ff3366',
      fontSize: '16px',
      fontWeight: 'bold',
      letterSpacing: '5px',
      textShadow: '0 0 25px rgba(255,51,102,0.7)',
      marginBottom: '16px',
      textAlign: 'center' as const,
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '12px',
    },
    effectBox: {
      background: 'rgba(255,51,102,0.05)',
      border: '1px solid rgba(255,51,102,0.3)',
      borderRadius: '8px',
      padding: '12px',
      transition: 'all 0.3s ease',
    },
    effectTitle: {
      color: '#ff6688',
      fontSize: '11px',
      fontWeight: 'bold',
      letterSpacing: '2px',
      marginBottom: '10px',
      textAlign: 'center' as const,
      textTransform: 'uppercase' as const,
    },
    knobRow: {
      display: 'flex',
      justifyContent: 'center',
      gap: '6px',
    },
  },
};

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
          HEADER - Industrial Control Room
          ===================================================================== */}
      <header style={THEMES.header.container}>
        <h1 style={THEMES.header.title}>FAMDRUM</h1>
        <SynthLED label="LINK" active={isConnected} color="green" />
        <div style={{ flex: 1 }}>
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
        <SynthKnob label="MASTER" min={-60} max={0}
          value={getDenormalized('master_volume', paramValues.master_volume ?? 0.1)}
          onChange={(v) => handleChange('master_volume', getNormalized('master_volume', v))}
        />
      </header>

      {/* =====================================================================
          PITCH SEQUENCER - Neon Magenta
          ===================================================================== */}
      <section style={THEMES.pitchSeq.container}>
        <h2 style={THEMES.pitchSeq.title}>◆ PITCH SEQUENCE</h2>
        <div style={THEMES.pitchSeq.controlRow}>
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
          <div style={{ display: 'flex', gap: '8px' }}>
            <SynthKnob label="LFO ↻" min={0.1} max={10}
              value={getDenormalized('pitch_lfo_rate', paramValues.pitch_lfo_rate ?? 0.1)}
              onChange={(v) => handleChange('pitch_lfo_rate', getNormalized('pitch_lfo_rate', v))}
            />
            <SynthKnob label="LFO ↕" min={0} max={24}
              value={getDenormalized('pitch_lfo_amount', paramValues.pitch_lfo_amount ?? 0.5)}
              onChange={(v) => handleChange('pitch_lfo_amount', getNormalized('pitch_lfo_amount', v))}
            />
          </div>
        </div>
      </section>

      {/* =====================================================================
          VELOCITY SEQUENCER - Digital Cyan
          ===================================================================== */}
      <section style={THEMES.velSeq.container}>
        <h2 style={THEMES.velSeq.title}>◆ VELOCITY SEQUENCE</h2>
        <div style={THEMES.velSeq.controlRow}>
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
          <div style={{ display: 'flex', gap: '8px' }}>
            <SynthKnob label="LFO ↻" min={0.1} max={10}
              value={getDenormalized('vel_lfo_rate', paramValues.vel_lfo_rate ?? 0.1)}
              onChange={(v) => handleChange('vel_lfo_rate', getNormalized('vel_lfo_rate', v))}
            />
            <SynthKnob label="LFO ↕" min={0} max={1}
              value={getDenormalized('vel_lfo_amount', paramValues.vel_lfo_amount ?? 0.5)}
              onChange={(v) => handleChange('vel_lfo_amount', getNormalized('vel_lfo_amount', v))}
            />
          </div>
        </div>
      </section>

      {/* =====================================================================
          OSCILLATORS - Warm Analog Amber
          ===================================================================== */}
      <section style={THEMES.oscillators.container}>
        <h2 style={THEMES.oscillators.title}>≋ OSCILLATORS ≋</h2>
        <div style={THEMES.oscillators.grid}>
          {/* VCO 1 */}
          <div style={THEMES.oscillators.vcoBox}>
            <h3 style={THEMES.oscillators.vcoTitle}>VCO 1</h3>
            <div style={THEMES.oscillators.knobRow}>
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
          <div style={THEMES.oscillators.vcoBox}>
            <h3 style={THEMES.oscillators.vcoTitle}>VCO 2</h3>
            <div style={THEMES.oscillators.knobRow}>
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
          <div style={THEMES.oscillators.vcoBox}>
            <h3 style={THEMES.oscillators.vcoTitle}>FM / NOISE</h3>
            <div style={THEMES.oscillators.knobRow}>
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
        </div>
      </section>

      {/* =====================================================================
          FILTER - Liquid Blue/Purple
          ===================================================================== */}
      <section style={THEMES.filter.container}>
        <h2 style={THEMES.filter.title}>〰 FILTER 〰</h2>
        <div style={THEMES.filter.knobRow}>
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
          <div style={{ width: '20px' }} /> {/* Spacer */}
          <SynthKnob label="LFO ↻" min={0.1} max={10}
            value={getDenormalized('filter_lfo_rate', paramValues.filter_lfo_rate ?? 0.1)}
            onChange={(v) => handleChange('filter_lfo_rate', getNormalized('filter_lfo_rate', v))}
          />
          <SynthKnob label="LFO ↕" min={0} max={1}
            value={getDenormalized('filter_lfo_amount', paramValues.filter_lfo_amount ?? 0)}
            onChange={(v) => handleChange('filter_lfo_amount', getNormalized('filter_lfo_amount', v))}
          />
        </div>
        <div style={THEMES.filter.wave} />
      </section>

      {/* =====================================================================
          ENVELOPES - Sharp Green
          ===================================================================== */}
      <section style={THEMES.envelopes.container}>
        <h2 style={THEMES.envelopes.title}>▲ ENVELOPES ▲</h2>
        <div style={THEMES.envelopes.envRow}>
          {/* Pitch Envelope */}
          <div style={THEMES.envelopes.envGroup}>
            <h3 style={THEMES.envelopes.envTitle}>PITCH ENV</h3>
            <div style={THEMES.envelopes.knobRow}>
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
          <div style={THEMES.envelopes.envGroup}>
            <h3 style={THEMES.envelopes.envTitle}>VCF/VCA ENV</h3>
            <div style={THEMES.envelopes.knobRow}>
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

      {/* =====================================================================
          EFFECTS - Deep Space
          ===================================================================== */}
      <section style={THEMES.effects.container}>
        <h2 style={THEMES.effects.title}>✦ EFFECTS ✦</h2>
        <div style={THEMES.effects.grid}>
          {/* Drive */}
          <div style={THEMES.effects.effectBox}>
            <h3 style={THEMES.effects.effectTitle}>🔥 DRIVE</h3>
            <div style={THEMES.effects.knobRow}>
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
          <div style={THEMES.effects.effectBox}>
            <h3 style={THEMES.effects.effectTitle}>📡 DELAY</h3>
            <div style={THEMES.effects.knobRow}>
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

          {/* Reverb */}
          <div style={THEMES.effects.effectBox}>
            <h3 style={THEMES.effects.effectTitle}>🌌 REVERB</h3>
            <div style={THEMES.effects.knobRow}>
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
          <div style={THEMES.effects.effectBox}>
            <h3 style={THEMES.effects.effectTitle}>💪 COMP</h3>
            <div style={THEMES.effects.knobRow}>
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
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default App;
