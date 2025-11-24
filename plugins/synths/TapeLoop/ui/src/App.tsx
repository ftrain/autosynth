/**
 * @file App.tsx
 * @brief Main Tape Loop synthesizer UI
 */

import React from 'react';
import { useJUCEBridge } from './hooks/useJUCEBridge';
import { useParameters, normalizeValue, denormalizeValue } from './hooks/useParameters';
import { PARAMETER_DEFINITIONS } from './types/parameters';
// Import from core component library
import { SynthKnob } from '../../../../../core/ui/components/SynthKnob';
import { SynthRow } from '../../../../../core/ui/components/SynthRow';
import { SynthADSR } from '../../../../../core/ui/components/SynthADSR';
import { SynthLFO } from '../../../../../core/ui/components/SynthLFO';
import { SynthSequencer } from '../../../../../core/ui/components/SynthSequencer';
import { SynthLED } from '../../../../../core/ui/components/SynthLED';
import Oscilloscope from '../../../../../core/ui/components/Oscilloscope';

// Local toggle component (not in core library yet)
import { SynthToggle } from './components/SynthToggle';

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
 * Main Tape Loop UI
 */
const App: React.FC = () => {
  const { isConnected, juceInfo, audioData } = useJUCEBridge({
    enableAudioData: true,
    audioChannel: 'master',
  });

  const { paramValues, handleChange } = useParameters({
    parameters: PARAMETER_DEFINITIONS,
    syncWithJUCE: true,
  });

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <header style={styles.header}>
        <h1 style={styles.title}>TAPE LOOP</h1>
        <span style={styles.subtitle}>Drone Synthesizer</span>
        <div style={styles.connectionStatus}>
          <span style={{
            ...styles.statusDot,
            backgroundColor: isConnected ? '#00ff88' : '#ff4444',
          }} />
          {isConnected ? 'Connected' : 'Standalone'}
        </div>
      </header>

      {/* TRANSPORT */}
      <SynthRow label="TRANSPORT">
        <SynthToggle
          label="SEQ"
          value={(paramValues.seq_enabled ?? 0) > 0.5}
          onChange={(v: boolean) => handleChange('seq_enabled', v ? 1 : 0)}
          variant="signal"
        />
        <SynthKnob
          label="BPM"
          min={30}
          max={300}
          step={1}
          value={getDenormalized('seq_bpm', paramValues.seq_bpm ?? 0.333)}
          onChange={(v) => handleChange('seq_bpm', getNormalized('seq_bpm', v))}
        />
      </SynthRow>

      {/* OSCILLATOR 1 ROW: OSC + ADSR + SEQUENCER */}
      <div style={styles.oscRow}>
        {/* OSC 1 Controls */}
        <div style={styles.oscSection}>
          <div style={styles.sectionLabel}>OSC 1</div>
          <div style={styles.knobRow}>
            <SynthKnob
              label="WAVE"
              min={0}
              max={2}
              step={1}
              value={getDenormalized('osc1_waveform', paramValues.osc1_waveform ?? 0)}
              onChange={(v) => handleChange('osc1_waveform', getNormalized('osc1_waveform', v))}
              options={['SIN', 'TRI', 'SAW']}
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
              label="LEVEL"
              min={0}
              max={1}
              value={getDenormalized('osc1_level', paramValues.osc1_level ?? 0.7)}
              onChange={(v) => handleChange('osc1_level', getNormalized('osc1_level', v))}
            />
          </div>
        </div>

        {/* OSC 1 ADSR */}
        <div style={styles.adsrSection}>
          <SynthADSR
            label="OSC1 ENV"
            attack={getDenormalized('osc1_attack', paramValues.osc1_attack ?? 0.002)}
            decay={getDenormalized('osc1_decay', paramValues.osc1_decay ?? 0.02)}
            sustain={getDenormalized('osc1_sustain', paramValues.osc1_sustain ?? 0.7) * 100}
            release={getDenormalized('osc1_release', paramValues.osc1_release ?? 0.03)}
            onAttackChange={(v: number) => handleChange('osc1_attack', getNormalized('osc1_attack', v))}
            onDecayChange={(v: number) => handleChange('osc1_decay', getNormalized('osc1_decay', v))}
            onSustainChange={(v: number) => handleChange('osc1_sustain', v / 100)}
            onReleaseChange={(v: number) => handleChange('osc1_release', getNormalized('osc1_release', v))}
            maxAttack={5000}
            maxDecay={5000}
            maxRelease={10000}
          />
        </div>

        {/* OSC 1 Sequencer */}
        <div style={styles.seqSection}>
          <div style={styles.seqHeader}>
            <SynthKnob
              label="SEQ DIV"
              min={0}
              max={15}
              step={1}
              value={getDenormalized('seq1_division', paramValues.seq1_division ?? 0.267)}
              onChange={(v) => handleChange('seq1_division', getNormalized('seq1_division', v))}
              options={['1/128', '1/64', '1/32', '1/16', '1/8', '1/4', '1/2', '1', '2bar', '4bar', '8bar', '16bar', '32bar', '64bar', '128bar', '256bar']}
            />
          </div>
          <SynthSequencer
            steps={4}
            pitchValues={[
              getDenormalized('seq1_pitch1', paramValues.seq1_pitch1 ?? 0.5),
              getDenormalized('seq1_pitch2', paramValues.seq1_pitch2 ?? 0.5),
              getDenormalized('seq1_pitch3', paramValues.seq1_pitch3 ?? 0.5),
              getDenormalized('seq1_pitch4', paramValues.seq1_pitch4 ?? 0.5),
            ]}
            gateValues={[
              (paramValues.seq1_gate1 ?? 1) > 0.5,
              (paramValues.seq1_gate2 ?? 1) > 0.5,
              (paramValues.seq1_gate3 ?? 1) > 0.5,
              (paramValues.seq1_gate4 ?? 1) > 0.5,
            ]}
            currentStep={-1}
            onPitchChange={(step: number, pitch: number) => {
              const paramIds = ['seq1_pitch1', 'seq1_pitch2', 'seq1_pitch3', 'seq1_pitch4'];
              const paramId = paramIds[step];
              if (paramId) handleChange(paramId, getNormalized(paramId, pitch));
            }}
            onGateChange={(step: number, gate: boolean) => {
              const paramIds = ['seq1_gate1', 'seq1_gate2', 'seq1_gate3', 'seq1_gate4'];
              const paramId = paramIds[step];
              if (paramId) handleChange(paramId, gate ? 1 : 0);
            }}
            minPitch={36}
            maxPitch={84}
          />
        </div>
      </div>

      {/* OSCILLATOR 2 ROW: OSC + ADSR + SEQUENCER */}
      <div style={styles.oscRow}>
        {/* OSC 2 Controls */}
        <div style={styles.oscSection}>
          <div style={styles.sectionLabel}>OSC 2</div>
          <div style={styles.knobRow}>
            <SynthKnob
              label="WAVE"
              min={0}
              max={2}
              step={1}
              value={getDenormalized('osc2_waveform', paramValues.osc2_waveform ?? 0)}
              onChange={(v) => handleChange('osc2_waveform', getNormalized('osc2_waveform', v))}
              options={['SIN', 'TRI', 'SAW']}
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
              label="DETUNE"
              min={-100}
              max={100}
              step={1}
              value={getDenormalized('osc2_detune', paramValues.osc2_detune ?? 0.535)}
              onChange={(v) => handleChange('osc2_detune', getNormalized('osc2_detune', v))}
            />
            <SynthKnob
              label="LEVEL"
              min={0}
              max={1}
              value={getDenormalized('osc2_level', paramValues.osc2_level ?? 0.5)}
              onChange={(v) => handleChange('osc2_level', getNormalized('osc2_level', v))}
            />
          </div>
        </div>

        {/* OSC 2 ADSR */}
        <div style={styles.adsrSection}>
          <SynthADSR
            label="OSC2 ENV"
            attack={getDenormalized('osc2_attack', paramValues.osc2_attack ?? 0.002)}
            decay={getDenormalized('osc2_decay', paramValues.osc2_decay ?? 0.02)}
            sustain={getDenormalized('osc2_sustain', paramValues.osc2_sustain ?? 0.7) * 100}
            release={getDenormalized('osc2_release', paramValues.osc2_release ?? 0.03)}
            onAttackChange={(v: number) => handleChange('osc2_attack', getNormalized('osc2_attack', v))}
            onDecayChange={(v: number) => handleChange('osc2_decay', getNormalized('osc2_decay', v))}
            onSustainChange={(v: number) => handleChange('osc2_sustain', v / 100)}
            onReleaseChange={(v: number) => handleChange('osc2_release', getNormalized('osc2_release', v))}
            maxAttack={5000}
            maxDecay={5000}
            maxRelease={10000}
          />
        </div>

        {/* OSC 2 Sequencer */}
        <div style={styles.seqSection}>
          <div style={styles.seqHeader}>
            <SynthKnob
              label="SEQ DIV"
              min={0}
              max={15}
              step={1}
              value={getDenormalized('seq2_division', paramValues.seq2_division ?? 0.267)}
              onChange={(v) => handleChange('seq2_division', getNormalized('seq2_division', v))}
              options={['1/128', '1/64', '1/32', '1/16', '1/8', '1/4', '1/2', '1', '2bar', '4bar', '8bar', '16bar', '32bar', '64bar', '128bar', '256bar']}
            />
          </div>
          <SynthSequencer
            steps={4}
            pitchValues={[
              getDenormalized('seq2_pitch1', paramValues.seq2_pitch1 ?? 0.5),
              getDenormalized('seq2_pitch2', paramValues.seq2_pitch2 ?? 0.5),
              getDenormalized('seq2_pitch3', paramValues.seq2_pitch3 ?? 0.5),
              getDenormalized('seq2_pitch4', paramValues.seq2_pitch4 ?? 0.5),
            ]}
            gateValues={[
              (paramValues.seq2_gate1 ?? 1) > 0.5,
              (paramValues.seq2_gate2 ?? 1) > 0.5,
              (paramValues.seq2_gate3 ?? 1) > 0.5,
              (paramValues.seq2_gate4 ?? 1) > 0.5,
            ]}
            currentStep={-1}
            onPitchChange={(step: number, pitch: number) => {
              const paramIds = ['seq2_pitch1', 'seq2_pitch2', 'seq2_pitch3', 'seq2_pitch4'];
              const paramId = paramIds[step];
              if (paramId) handleChange(paramId, getNormalized(paramId, pitch));
            }}
            onGateChange={(step: number, gate: boolean) => {
              const paramIds = ['seq2_gate1', 'seq2_gate2', 'seq2_gate3', 'seq2_gate4'];
              const paramId = paramIds[step];
              if (paramId) handleChange(paramId, gate ? 1 : 0);
            }}
            minPitch={36}
            maxPitch={84}
          />
        </div>
      </div>

      {/* TAPE LOOP */}
      <SynthRow label="TAPE LOOP">
        <SynthKnob
          label="LENGTH"
          min={0.5}
          max={60}
          value={getDenormalized('loop_length', paramValues.loop_length ?? 0.059)}
          onChange={(v) => handleChange('loop_length', getNormalized('loop_length', v))}
        />
        <SynthKnob
          label="FEEDBACK"
          min={0}
          max={1}
          value={getDenormalized('loop_feedback', paramValues.loop_feedback ?? 0.85)}
          onChange={(v) => handleChange('loop_feedback', getNormalized('loop_feedback', v))}
        />
        <SynthKnob
          label="RECORD"
          min={0}
          max={1}
          value={getDenormalized('record_level', paramValues.record_level ?? 0.5)}
          onChange={(v) => handleChange('record_level', getNormalized('record_level', v))}
        />
      </SynthRow>

      {/* TAPE CHARACTER */}
      <SynthRow label="TAPE CHARACTER">
        <SynthKnob
          label="SATURATION"
          min={0}
          max={1}
          value={getDenormalized('tape_saturation', paramValues.tape_saturation ?? 0.3)}
          onChange={(v) => handleChange('tape_saturation', getNormalized('tape_saturation', v))}
        />
        <SynthKnob
          label="WOBBLE RATE"
          min={0.1}
          max={5}
          value={getDenormalized('tape_wobble_rate', paramValues.tape_wobble_rate ?? 0.082)}
          onChange={(v) => handleChange('tape_wobble_rate', getNormalized('tape_wobble_rate', v))}
        />
        <SynthKnob
          label="WOBBLE DEPTH"
          min={0}
          max={1}
          value={getDenormalized('tape_wobble_depth', paramValues.tape_wobble_depth ?? 0.2)}
          onChange={(v) => handleChange('tape_wobble_depth', getNormalized('tape_wobble_depth', v))}
        />
      </SynthRow>

      {/* TAPE NOISE */}
      <SynthRow label="TAPE NOISE">
        <SynthKnob
          label="HISS"
          min={0}
          max={1}
          value={getDenormalized('tape_hiss', paramValues.tape_hiss ?? 0.1)}
          onChange={(v) => handleChange('tape_hiss', getNormalized('tape_hiss', v))}
        />
        <SynthKnob
          label="AGE"
          min={0}
          max={1}
          value={getDenormalized('tape_age', paramValues.tape_age ?? 0.3)}
          onChange={(v) => handleChange('tape_age', getNormalized('tape_age', v))}
        />
        <SynthKnob
          label="DEGRADE"
          min={0}
          max={1}
          value={getDenormalized('tape_degrade', paramValues.tape_degrade ?? 0)}
          onChange={(v) => handleChange('tape_degrade', getNormalized('tape_degrade', v))}
        />
      </SynthRow>

      {/* RECORDING ENVELOPE */}
      <SynthRow label="RECORDING">
        <SynthKnob
          label="ATTACK"
          min={0.005}
          max={0.5}
          value={getDenormalized('rec_attack', paramValues.rec_attack ?? 0.03)}
          onChange={(v) => handleChange('rec_attack', getNormalized('rec_attack', v))}
        />
        <SynthKnob
          label="DECAY"
          min={0.01}
          max={5}
          value={getDenormalized('rec_decay', paramValues.rec_decay ?? 0.098)}
          onChange={(v) => handleChange('rec_decay', getNormalized('rec_decay', v))}
        />
        <SynthKnob
          label="FM"
          min={0}
          max={1}
          value={getDenormalized('fm_amount', paramValues.fm_amount ?? 0)}
          onChange={(v) => handleChange('fm_amount', getNormalized('fm_amount', v))}
        />
      </SynthRow>

      {/* LFO - Visual Component */}
      <SynthRow label="TAPE LFO">
        <SynthLFO
          label="TAPE MOD"
          waveform={Math.round(getDenormalized('lfo_waveform', paramValues.lfo_waveform ?? 0))}
          rate={getDenormalized('lfo_rate', paramValues.lfo_rate ?? 0.045)}
          onWaveformChange={(w: number) => handleChange('lfo_waveform', getNormalized('lfo_waveform', w))}
          onRateChange={(r: number) => handleChange('lfo_rate', getNormalized('lfo_rate', r))}
          minRate={0.1}
          maxRate={20}
        />
        <SynthKnob
          label="DEPTH"
          min={0}
          max={1}
          value={getDenormalized('lfo_depth', paramValues.lfo_depth ?? 0)}
          onChange={(v) => handleChange('lfo_depth', getNormalized('lfo_depth', v))}
        />
        <SynthKnob
          label="TARGET"
          min={0}
          max={3}
          step={1}
          value={getDenormalized('lfo_target', paramValues.lfo_target ?? 0)}
          onChange={(v) => handleChange('lfo_target', getNormalized('lfo_target', v))}
          options={['SAT', 'AGE', 'WOB', 'DEG']}
        />
      </SynthRow>

      {/* DELAY */}
      <SynthRow label="DELAY">
        <SynthKnob
          label="TIME"
          min={0.01}
          max={2}
          value={getDenormalized('delay_time', paramValues.delay_time ?? 0.25)}
          onChange={(v) => handleChange('delay_time', getNormalized('delay_time', v))}
        />
        <SynthKnob
          label="FEEDBACK"
          min={0}
          max={0.95}
          value={getDenormalized('delay_feedback', paramValues.delay_feedback ?? 0.316)}
          onChange={(v) => handleChange('delay_feedback', getNormalized('delay_feedback', v))}
        />
        <SynthKnob
          label="MIX"
          min={0}
          max={1}
          value={getDenormalized('delay_mix', paramValues.delay_mix ?? 0)}
          onChange={(v) => handleChange('delay_mix', getNormalized('delay_mix', v))}
        />
      </SynthRow>

      {/* REVERB - Airwindows Galactic3 */}
      <SynthRow label="GALACTIC REVERB">
        <SynthKnob
          label="REPLACE"
          min={0}
          max={1}
          value={getDenormalized('reverb_replace', paramValues.reverb_replace ?? 0.5)}
          onChange={(v) => handleChange('reverb_replace', getNormalized('reverb_replace', v))}
        />
        <SynthKnob
          label="BRIGHTNESS"
          min={0}
          max={1}
          value={getDenormalized('reverb_brightness', paramValues.reverb_brightness ?? 0.5)}
          onChange={(v) => handleChange('reverb_brightness', getNormalized('reverb_brightness', v))}
        />
        <SynthKnob
          label="DETUNE"
          min={0}
          max={1}
          value={getDenormalized('reverb_detune', paramValues.reverb_detune ?? 0.2)}
          onChange={(v) => handleChange('reverb_detune', getNormalized('reverb_detune', v))}
        />
        <SynthKnob
          label="BIGNESS"
          min={0}
          max={1}
          value={getDenormalized('reverb_bigness', paramValues.reverb_bigness ?? 0.5)}
          onChange={(v) => handleChange('reverb_bigness', getNormalized('reverb_bigness', v))}
        />
        <SynthKnob
          label="SIZE"
          min={0}
          max={1}
          value={getDenormalized('reverb_size', paramValues.reverb_size ?? 0.5)}
          onChange={(v) => handleChange('reverb_size', getNormalized('reverb_size', v))}
        />
        <SynthKnob
          label="MIX"
          min={0}
          max={1}
          value={getDenormalized('reverb_mix', paramValues.reverb_mix ?? 0)}
          onChange={(v) => handleChange('reverb_mix', getNormalized('reverb_mix', v))}
        />
      </SynthRow>

      {/* COMPRESSOR */}
      <SynthRow label="COMPRESSOR">
        <SynthKnob
          label="THRESHOLD"
          min={-40}
          max={0}
          value={getDenormalized('comp_threshold', paramValues.comp_threshold ?? 0.75)}
          onChange={(v) => handleChange('comp_threshold', getNormalized('comp_threshold', v))}
        />
        <SynthKnob
          label="RATIO"
          min={1}
          max={20}
          value={getDenormalized('comp_ratio', paramValues.comp_ratio ?? 0.158)}
          onChange={(v) => handleChange('comp_ratio', getNormalized('comp_ratio', v))}
        />
        <SynthKnob
          label="MIX"
          min={0}
          max={1}
          value={getDenormalized('comp_mix', paramValues.comp_mix ?? 0)}
          onChange={(v) => handleChange('comp_mix', getNormalized('comp_mix', v))}
        />
      </SynthRow>

      {/* VOICE FM TO LOOP */}
      <SynthRow label="VOICE FM">
        <SynthKnob
          label="LOOP FM"
          min={0}
          max={1}
          value={getDenormalized('voice_loop_fm', paramValues.voice_loop_fm ?? 0)}
          onChange={(v) => handleChange('voice_loop_fm', getNormalized('voice_loop_fm', v))}
        />
      </SynthRow>

      {/* PAN LFO */}
      <SynthRow label="PAN">
        <SynthKnob
          label="SPEED"
          min={0.01}
          max={10}
          value={getDenormalized('pan_speed', paramValues.pan_speed ?? 0.049)}
          onChange={(v) => handleChange('pan_speed', getNormalized('pan_speed', v))}
        />
        <SynthKnob
          label="DEPTH"
          min={0}
          max={1}
          value={getDenormalized('pan_depth', paramValues.pan_depth ?? 0)}
          onChange={(v) => handleChange('pan_depth', getNormalized('pan_depth', v))}
        />
      </SynthRow>

      {/* MIX */}
      <SynthRow label="MIX">
        <SynthKnob
          label="DRY"
          min={0}
          max={1}
          value={getDenormalized('dry_level', paramValues.dry_level ?? 0.3)}
          onChange={(v) => handleChange('dry_level', getNormalized('dry_level', v))}
        />
        <SynthKnob
          label="LOOP"
          min={0}
          max={1}
          value={getDenormalized('loop_level', paramValues.loop_level ?? 0.7)}
          onChange={(v) => handleChange('loop_level', getNormalized('loop_level', v))}
        />
        <SynthKnob
          label="MASTER"
          min={0}
          max={1}
          value={getDenormalized('master_level', paramValues.master_level ?? 0.8)}
          onChange={(v) => handleChange('master_level', getNormalized('master_level', v))}
        />
      </SynthRow>

      {/* OSCILLOSCOPE */}
      <div style={styles.scopeContainer}>
        <Oscilloscope
          label="OUTPUT"
          audioData={audioData}
          width={650}
          height={100}
          color="#ff8844"
          showGrid={true}
          showPeaks={false}
        />
      </div>

      {/* Debug info */}
      {import.meta.env.DEV && (
        <footer style={styles.debug}>
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

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    padding: '20px',
    background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)',
    color: '#fff',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid #2a2a2a',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    letterSpacing: '4px',
    margin: 0,
    color: '#ff8844',
    textShadow: '0 0 20px rgba(255, 136, 68, 0.3)',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    letterSpacing: '2px',
    textTransform: 'uppercase',
  },
  connectionStatus: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#666',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  scopeContainer: {
    marginTop: '16px',
    padding: '16px',
    background: 'linear-gradient(145deg, #1a1a1a, #141414)',
    borderRadius: '8px',
    border: '1px solid #2a2a2a',
  },
  oscRow: {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: '16px',
    marginBottom: '16px',
    padding: '16px',
    background: 'linear-gradient(145deg, #1a1a1a, #141414)',
    borderRadius: '8px',
    border: '1px solid #2a2a2a',
    alignItems: 'flex-start',
  },
  oscSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    minWidth: '180px',
  },
  sectionLabel: {
    color: 'var(--synth-text-primary, #fff)',
    fontSize: '12px',
    fontWeight: 'bold',
    letterSpacing: '1.5px',
    textTransform: 'uppercase' as const,
  },
  knobRow: {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  adsrSection: {
    flex: '0 0 auto',
    minWidth: '280px',
  },
  seqSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    flex: '1 1 auto',
  },
  seqHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  debug: {
    marginTop: '24px',
    padding: '12px',
    background: '#0a0a0a',
    borderRadius: '4px',
    color: '#666',
    textAlign: 'center',
  },
};

export default App;
