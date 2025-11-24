/**
 * @file App.tsx
 * @brief FM Drums synthesizer UI
 *
 * 4 drum channels: KICK, SNARE, HAT, PERC
 * Each with FM synthesis and fast envelopes for punchy percussion.
 */

import React from 'react';
import { useJUCEBridge } from './hooks/useJUCEBridge';
import { useParameters, normalizeValue, denormalizeValue } from './hooks/useParameters';
import { PARAMETER_DEFINITIONS } from './types/parameters';
import { SynthKnob } from './components/SynthKnob';
import { SynthRow } from './components/SynthRow';
import { Oscilloscope } from './components/Oscilloscope';

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
  const { isConnected, audioData } = useJUCEBridge({
    enableAudioData: true,
    audioChannel: 'master',
  });

  const { paramValues, handleChange, resetToDefaults } = useParameters({
    parameters: PARAMETER_DEFINITIONS,
    syncWithJUCE: true,
  });

  return (
    <div className="synth-container">
      {/* HEADER */}
      <header className="synth-header">
        <h1 className="synth-title">FM Drums</h1>
        <span className="synth-subtitle">FM Percussion Synthesizer</span>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
          {isConnected ? 'Connected' : 'Standalone'}
        </div>
      </header>

      {/* KICK SECTION */}
      <SynthRow label="KICK" showPanel>
        <SynthKnob
          label="FREQ"
          min={20}
          max={200}
          value={getDenormalized('kick_carrier_freq', paramValues.kick_carrier_freq ?? 0.22)}
          onChange={(v) => handleChange('kick_carrier_freq', getNormalized('kick_carrier_freq', v))}
        />
        <SynthKnob
          label="MOD RATIO"
          min={0.5}
          max={16}
          value={getDenormalized('kick_mod_ratio', paramValues.kick_mod_ratio ?? 0.03)}
          onChange={(v) => handleChange('kick_mod_ratio', getNormalized('kick_mod_ratio', v))}
        />
        <SynthKnob
          label="FM DEPTH"
          min={0}
          max={1}
          value={getDenormalized('kick_mod_depth', paramValues.kick_mod_depth ?? 0.5)}
          onChange={(v) => handleChange('kick_mod_depth', getNormalized('kick_mod_depth', v))}
        />
      </SynthRow>

      <SynthRow label="KICK ENV">
        <SynthKnob
          label="PITCH DEC"
          min={1}
          max={500}
          value={getDenormalized('kick_pitch_decay', paramValues.kick_pitch_decay ?? 0.1)}
          onChange={(v) => handleChange('kick_pitch_decay', getNormalized('kick_pitch_decay', v))}
        />
        <SynthKnob
          label="PITCH AMT"
          min={0}
          max={1}
          value={getDenormalized('kick_pitch_amount', paramValues.kick_pitch_amount ?? 0.8)}
          onChange={(v) => handleChange('kick_pitch_amount', getNormalized('kick_pitch_amount', v))}
        />
        <SynthKnob
          label="AMP DEC"
          min={1}
          max={2000}
          value={getDenormalized('kick_amp_decay', paramValues.kick_amp_decay ?? 0.2)}
          onChange={(v) => handleChange('kick_amp_decay', getNormalized('kick_amp_decay', v))}
        />
        <SynthKnob
          label="LEVEL"
          min={0}
          max={1}
          value={getDenormalized('kick_level', paramValues.kick_level ?? 0.8)}
          onChange={(v) => handleChange('kick_level', getNormalized('kick_level', v))}
        />
      </SynthRow>

      {/* SNARE SECTION */}
      <SynthRow label="SNARE" showPanel>
        <SynthKnob
          label="FREQ"
          min={80}
          max={500}
          value={getDenormalized('snare_carrier_freq', paramValues.snare_carrier_freq ?? 0.24)}
          onChange={(v) => handleChange('snare_carrier_freq', getNormalized('snare_carrier_freq', v))}
        />
        <SynthKnob
          label="MOD RATIO"
          min={0.5}
          max={16}
          value={getDenormalized('snare_mod_ratio', paramValues.snare_mod_ratio ?? 0.12)}
          onChange={(v) => handleChange('snare_mod_ratio', getNormalized('snare_mod_ratio', v))}
        />
        <SynthKnob
          label="FM DEPTH"
          min={0}
          max={1}
          value={getDenormalized('snare_mod_depth', paramValues.snare_mod_depth ?? 0.6)}
          onChange={(v) => handleChange('snare_mod_depth', getNormalized('snare_mod_depth', v))}
        />
        <SynthKnob
          label="NOISE"
          min={0}
          max={1}
          value={getDenormalized('snare_noise', paramValues.snare_noise ?? 0.5)}
          onChange={(v) => handleChange('snare_noise', getNormalized('snare_noise', v))}
        />
      </SynthRow>

      <SynthRow label="SNARE ENV">
        <SynthKnob
          label="PITCH DEC"
          min={1}
          max={200}
          value={getDenormalized('snare_pitch_decay', paramValues.snare_pitch_decay ?? 0.1)}
          onChange={(v) => handleChange('snare_pitch_decay', getNormalized('snare_pitch_decay', v))}
        />
        <SynthKnob
          label="AMP DEC"
          min={1}
          max={1000}
          value={getDenormalized('snare_amp_decay', paramValues.snare_amp_decay ?? 0.2)}
          onChange={(v) => handleChange('snare_amp_decay', getNormalized('snare_amp_decay', v))}
        />
        <SynthKnob
          label="LEVEL"
          min={0}
          max={1}
          value={getDenormalized('snare_level', paramValues.snare_level ?? 0.8)}
          onChange={(v) => handleChange('snare_level', getNormalized('snare_level', v))}
        />
      </SynthRow>

      {/* HAT SECTION */}
      <SynthRow label="HAT" showPanel>
        <SynthKnob
          label="FREQ"
          min={200}
          max={2000}
          value={getDenormalized('hat_carrier_freq', paramValues.hat_carrier_freq ?? 0.33)}
          onChange={(v) => handleChange('hat_carrier_freq', getNormalized('hat_carrier_freq', v))}
        />
        <SynthKnob
          label="MOD RATIO"
          min={0.5}
          max={16}
          value={getDenormalized('hat_mod_ratio', paramValues.hat_mod_ratio ?? 0.43)}
          onChange={(v) => handleChange('hat_mod_ratio', getNormalized('hat_mod_ratio', v))}
        />
        <SynthKnob
          label="FM DEPTH"
          min={0}
          max={1}
          value={getDenormalized('hat_mod_depth', paramValues.hat_mod_depth ?? 0.8)}
          onChange={(v) => handleChange('hat_mod_depth', getNormalized('hat_mod_depth', v))}
        />
        <SynthKnob
          label="NOISE"
          min={0}
          max={1}
          value={getDenormalized('hat_noise', paramValues.hat_noise ?? 0.7)}
          onChange={(v) => handleChange('hat_noise', getNormalized('hat_noise', v))}
        />
      </SynthRow>

      <SynthRow label="HAT ENV">
        <SynthKnob
          label="AMP DEC"
          min={1}
          max={500}
          value={getDenormalized('hat_amp_decay', paramValues.hat_amp_decay ?? 0.16)}
          onChange={(v) => handleChange('hat_amp_decay', getNormalized('hat_amp_decay', v))}
        />
        <SynthKnob
          label="LEVEL"
          min={0}
          max={1}
          value={getDenormalized('hat_level', paramValues.hat_level ?? 0.7)}
          onChange={(v) => handleChange('hat_level', getNormalized('hat_level', v))}
        />
      </SynthRow>

      {/* PERC SECTION */}
      <SynthRow label="PERC" showPanel>
        <SynthKnob
          label="FREQ"
          min={100}
          max={1000}
          value={getDenormalized('perc_carrier_freq', paramValues.perc_carrier_freq ?? 0.33)}
          onChange={(v) => handleChange('perc_carrier_freq', getNormalized('perc_carrier_freq', v))}
        />
        <SynthKnob
          label="MOD RATIO"
          min={0.5}
          max={16}
          value={getDenormalized('perc_mod_ratio', paramValues.perc_mod_ratio ?? 0.19)}
          onChange={(v) => handleChange('perc_mod_ratio', getNormalized('perc_mod_ratio', v))}
        />
        <SynthKnob
          label="FM DEPTH"
          min={0}
          max={1}
          value={getDenormalized('perc_mod_depth', paramValues.perc_mod_depth ?? 0.4)}
          onChange={(v) => handleChange('perc_mod_depth', getNormalized('perc_mod_depth', v))}
        />
      </SynthRow>

      <SynthRow label="PERC ENV">
        <SynthKnob
          label="PITCH DEC"
          min={1}
          max={300}
          value={getDenormalized('perc_pitch_decay', paramValues.perc_pitch_decay ?? 0.1)}
          onChange={(v) => handleChange('perc_pitch_decay', getNormalized('perc_pitch_decay', v))}
        />
        <SynthKnob
          label="AMP DEC"
          min={1}
          max={1000}
          value={getDenormalized('perc_amp_decay', paramValues.perc_amp_decay ?? 0.25)}
          onChange={(v) => handleChange('perc_amp_decay', getNormalized('perc_amp_decay', v))}
        />
        <SynthKnob
          label="LEVEL"
          min={0}
          max={1}
          value={getDenormalized('perc_level', paramValues.perc_level ?? 0.7)}
          onChange={(v) => handleChange('perc_level', getNormalized('perc_level', v))}
        />
      </SynthRow>

      {/* OUTPUT SECTION */}
      <SynthRow label="OUTPUT" showPanel>
        <SynthKnob
          label="MASTER"
          min={0}
          max={1}
          value={getDenormalized('master_level', paramValues.master_level ?? 0.8)}
          onChange={(v) => handleChange('master_level', getNormalized('master_level', v))}
        />
        <button className="reset-button" onClick={resetToDefaults}>
          Reset All
        </button>
      </SynthRow>

      {/* OSCILLOSCOPE */}
      <SynthRow label="OUTPUT">
        <Oscilloscope
          audioData={audioData}
          width={380}
          height={100}
          color="#ff6600"
          showGrid={true}
          showPeaks={true}
        />
      </SynthRow>

      {/* Debug info in development */}
      {import.meta.env.DEV && (
        <footer className="debug-info">
          <small>
            JUCE: {isConnected ? 'Yes' : 'No'} |
            MIDI: C1=Kick, D1=Snare, F#1=Hat, Others=Perc
          </small>
        </footer>
      )}
    </div>
  );
};

export default App;
