/**
 * @file App.tsx
 * @brief Main Tape Loop synthesizer UI
 */

import React from 'react';
import { useJUCEBridge } from './hooks/useJUCEBridge';
import { useParameters, normalizeValue, denormalizeValue } from './hooks/useParameters';
import { PARAMETER_DEFINITIONS } from './types/parameters';
import { SynthKnob } from './components/SynthKnob';
import { SynthRow } from './components/SynthRow';
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

      {/* OSCILLATOR 1 */}
      <SynthRow label="OSC 1">
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
      </SynthRow>

      {/* OSCILLATOR 2 */}
      <SynthRow label="OSC 2">
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
      </SynthRow>

      {/* TAPE LOOP */}
      <SynthRow label="TAPE LOOP">
        <SynthKnob
          label="LENGTH"
          min={0.5}
          max={10}
          value={getDenormalized('loop_length', paramValues.loop_length ?? 0.368)}
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
