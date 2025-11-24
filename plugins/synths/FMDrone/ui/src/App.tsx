/**
 * @file App.tsx
 * @brief FM Drone synthesizer UI
 *
 * Minimalist 2-operator FM synth for drones and ambient textures.
 * Uses SynthRow for all layout - simple left-to-right flow.
 */

import React from 'react';
import { useJUCEBridge } from './hooks/useJUCEBridge';
import { useParameters, normalizeValue, denormalizeValue } from './hooks/useParameters';
import { PARAMETER_DEFINITIONS } from './types/parameters';
import { SynthKnob } from './components/SynthKnob';
import { SynthADSR } from './components/SynthADSR';
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
 * FM Drone main UI
 */
const App: React.FC = () => {
  // Connect to JUCE backend
  const { isConnected, juceInfo, audioData } = useJUCEBridge({
    enableAudioData: true,
    audioChannel: 'master',
  });

  // Manage parameter state
  const { paramValues, handleChange, resetToDefaults } = useParameters({
    parameters: PARAMETER_DEFINITIONS,
    syncWithJUCE: true,
  });

  return (
    <div className="synth-container">
      {/* HEADER */}
      <header className="synth-header">
        <h1 className="synth-title">FM Drone</h1>
        <span className="synth-subtitle">2-Op FM Synthesizer</span>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
          {isConnected ? 'Connected' : 'Standalone'}
        </div>
      </header>

      {/* CARRIER SECTION */}
      <SynthRow label="CARRIER" showPanel>
        <SynthKnob
          label="RATIO"
          min={0.5}
          max={8}
          value={getDenormalized('carrier_ratio', paramValues.carrier_ratio ?? 0.067)}
          onChange={(v) => handleChange('carrier_ratio', getNormalized('carrier_ratio', v))}
        />
        <SynthKnob
          label="LEVEL"
          min={0}
          max={1}
          value={getDenormalized('carrier_level', paramValues.carrier_level ?? 0.8)}
          onChange={(v) => handleChange('carrier_level', getNormalized('carrier_level', v))}
        />
      </SynthRow>

      {/* MODULATOR SECTION */}
      <SynthRow label="MODULATOR" showPanel>
        <SynthKnob
          label="RATIO"
          min={0.5}
          max={16}
          value={getDenormalized('mod_ratio', paramValues.mod_ratio ?? 0.097)}
          onChange={(v) => handleChange('mod_ratio', getNormalized('mod_ratio', v))}
        />
        <SynthKnob
          label="DEPTH"
          min={0}
          max={1}
          value={getDenormalized('mod_depth', paramValues.mod_depth ?? 0.3)}
          onChange={(v) => handleChange('mod_depth', getNormalized('mod_depth', v))}
        />
        <SynthKnob
          label="FEEDBACK"
          min={0}
          max={1}
          value={getDenormalized('mod_feedback', paramValues.mod_feedback ?? 0)}
          onChange={(v) => handleChange('mod_feedback', getNormalized('mod_feedback', v))}
        />
      </SynthRow>

      {/* FM ENVELOPE SECTION */}
      <SynthRow label="FM ENVELOPE" showPanel>
        <SynthADSR
          label=""
          tabs={[]}
          maxAttack={30000}
          maxDecay={30000}
          maxRelease={30000}
          attack={getDenormalized('mod_attack', paramValues.mod_attack ?? 0.167) * 1000}
          decay={getDenormalized('mod_decay', paramValues.mod_decay ?? 0.333) * 1000}
          sustain={(paramValues.mod_sustain ?? 0.7) * 100}
          release={getDenormalized('mod_release', paramValues.mod_release ?? 0.267) * 1000}
          onAttackChange={(ms: number) => handleChange('mod_attack', getNormalized('mod_attack', ms / 1000))}
          onDecayChange={(ms: number) => handleChange('mod_decay', getNormalized('mod_decay', ms / 1000))}
          onSustainChange={(v: number) => handleChange('mod_sustain', v / 100)}
          onReleaseChange={(ms: number) => handleChange('mod_release', getNormalized('mod_release', ms / 1000))}
        />
      </SynthRow>

      {/* AMP ENVELOPE SECTION */}
      <SynthRow label="AMP ENVELOPE" showPanel>
        <SynthADSR
          label=""
          tabs={[]}
          maxAttack={30000}
          maxDecay={30000}
          maxRelease={30000}
          attack={getDenormalized('amp_attack', paramValues.amp_attack ?? 0.1) * 1000}
          decay={getDenormalized('amp_decay', paramValues.amp_decay ?? 0.167) * 1000}
          sustain={(paramValues.amp_sustain ?? 0.9) * 100}
          release={getDenormalized('amp_release', paramValues.amp_release ?? 0.333) * 1000}
          onAttackChange={(ms: number) => handleChange('amp_attack', getNormalized('amp_attack', ms / 1000))}
          onDecayChange={(ms: number) => handleChange('amp_decay', getNormalized('amp_decay', ms / 1000))}
          onSustainChange={(v: number) => handleChange('amp_sustain', v / 100)}
          onReleaseChange={(ms: number) => handleChange('amp_release', getNormalized('amp_release', ms / 1000))}
        />
      </SynthRow>

      {/* DRIFT SECTION */}
      <SynthRow label="DRIFT" showPanel>
        <SynthKnob
          label="RATE"
          min={0.01}
          max={2}
          value={getDenormalized('drift_rate', paramValues.drift_rate ?? 0.045)}
          onChange={(v) => handleChange('drift_rate', getNormalized('drift_rate', v))}
        />
        <SynthKnob
          label="AMOUNT"
          min={0}
          max={1}
          value={getDenormalized('drift_amount', paramValues.drift_amount ?? 0.2)}
          onChange={(v) => handleChange('drift_amount', getNormalized('drift_amount', v))}
        />
      </SynthRow>

      {/* OUTPUT SECTION */}
      <SynthRow label="OUTPUT" showPanel>
        <SynthKnob
          label="MASTER"
          min={0}
          max={1}
          value={getDenormalized('master_level', paramValues.master_level ?? 0.7)}
          onChange={(v) => handleChange('master_level', getNormalized('master_level', v))}
        />
        <button className="reset-button" onClick={resetToDefaults}>
          Reset All
        </button>
      </SynthRow>

      {/* OSCILLOSCOPE */}
      <SynthRow label="VISUALIZATION">
        <Oscilloscope
          label="SCOPE"
          audioData={audioData}
          width={380}
          height={100}
          color="#00ff88"
          showGrid={true}
          showPeaks={true}
        />
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
