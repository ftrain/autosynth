import React from 'react';
import { useAudioEngine } from './hooks/useAudioEngine';
import {
  SynthKnob,
  SynthRow,
  SynthADSR,
} from '../../../core/ui/components';

/**
 * {{SYNTH_NAME}} UI
 *
 * TODO: Customize this template with your synth's controls.
 * Always use components from core/ui/components/ - never create custom components.
 */

// Parameter IDs (must match WASM engine)
enum ParamID {
  OSC_FREQ = 0,
  OSC_LEVEL = 1,
  FILTER_CUTOFF = 2,
  FILTER_RESONANCE = 3,
  ENV_ATTACK = 4,
  ENV_DECAY = 5,
  ENV_SUSTAIN = 6,
  ENV_RELEASE = 7,
  MASTER_VOLUME = 127,
}

const App: React.FC = () => {
  const {
    isReady,
    midiInputs,
    error,
    initialize,
    setParameter,
  } = useAudioEngine();

  if (error) {
    return (
      <div style={{
        background: '#0a0a0a',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ff4444',
        fontSize: '18px',
        padding: '40px',
      }}>
        <div>
          <h2>Error</h2>
          <p>{error}</p>
          <button
            onClick={initialize}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              fontSize: '16px',
              background: '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div style={{
        background: '#0a0a0a',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <button
          onClick={initialize}
          style={{
            padding: '20px 40px',
            fontSize: '24px',
            background: '#ff8844',
            color: '#0a0a0a',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '2px',
          }}
        >
          Start {{SYNTH_NAME}}
        </button>
      </div>
    );
  }

  return (
    <div style={{
      background: '#0a0a0a',
      minHeight: '100vh',
      padding: '40px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }}>
      {/* Header */}
      <header style={{
        marginBottom: '40px',
        borderBottom: '2px solid #ff8844',
        paddingBottom: '20px',
      }}>
        <h1 style={{
          fontSize: '36px',
          margin: 0,
          color: '#ff8844',
          letterSpacing: '4px',
        }}>
          {{SYNTH_NAME}}
        </h1>
        {midiInputs.length > 0 && (
          <div style={{
            marginTop: '10px',
            color: '#00ff88',
            fontSize: '14px',
          }}>
            ✓ MIDI: {midiInputs[0].name}
          </div>
        )}
      </header>

      {/* TODO: Customize UI sections below */}

      {/* Oscillator Section */}
      <SynthRow label="OSCILLATOR" theme="orange">
        <SynthKnob
          label="FREQ"
          min={20}
          max={20000}
          value={440}
          onChange={(v) => setParameter(ParamID.OSC_FREQ, v)}
        />
        <SynthKnob
          label="LEVEL"
          min={0}
          max={1}
          value={0.5}
          onChange={(v) => setParameter(ParamID.OSC_LEVEL, v)}
        />
      </SynthRow>

      {/* Filter Section */}
      <SynthRow label="FILTER" theme="orange">
        <SynthKnob
          label="CUTOFF"
          min={20}
          max={20000}
          value={1000}
          onChange={(v) => setParameter(ParamID.FILTER_CUTOFF, v)}
        />
        <SynthKnob
          label="RES"
          min={0}
          max={1}
          value={0.5}
          onChange={(v) => setParameter(ParamID.FILTER_RESONANCE, v)}
        />
      </SynthRow>

      {/* Envelope Section */}
      <SynthADSR
        label="AMP ENV"
        attack={10}
        decay={100}
        sustain={70}
        release={200}
        onAttackChange={(ms) => setParameter(ParamID.ENV_ATTACK, ms)}
        onDecayChange={(ms) => setParameter(ParamID.ENV_DECAY, ms)}
        onSustainChange={(pct) => setParameter(ParamID.ENV_SUSTAIN, pct / 100)}
        onReleaseChange={(ms) => setParameter(ParamID.ENV_RELEASE, ms)}
        maxAttack={5000}
        maxDecay={5000}
        maxRelease={10000}
        showTabs={false}
      />

      {/* Master Section */}
      <SynthRow label="MASTER" theme="orange">
        <SynthKnob
          label="VOLUME"
          min={0}
          max={1}
          value={0.8}
          onChange={(v) => setParameter(ParamID.MASTER_VOLUME, v)}
        />
      </SynthRow>

      {/* Footer */}
      <footer style={{
        marginTop: '60px',
        paddingTop: '20px',
        borderTop: '1px solid #333',
        fontSize: '12px',
        color: '#666',
        textAlign: 'center',
      }}>
        AutoSynth | WebAssembly + Web Audio API + Web MIDI
      </footer>
    </div>
  );
};

export default App;
