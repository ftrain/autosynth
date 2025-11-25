import React, { useState } from 'react';
import { useAudioEngine } from './hooks/useAudioEngine';
import {
  SynthKnob,
  SynthRow,
  SynthADSR,
} from '../../../core/ui/components';

/**
 * Additive Square Synthesizer UI
 *
 * Architecture: 8 square wave partials → Filter → Amp
 * Uses shared components from core/ui/components/
 */

// Parameter IDs (must match Engine.h)
enum ParamID {
  // Partial levels (0-7)
  PARTIAL_1_LEVEL = 0,
  PARTIAL_2_LEVEL = 1,
  PARTIAL_3_LEVEL = 2,
  PARTIAL_4_LEVEL = 3,
  PARTIAL_5_LEVEL = 4,
  PARTIAL_6_LEVEL = 5,
  PARTIAL_7_LEVEL = 6,
  PARTIAL_8_LEVEL = 7,

  // Filter (8-10)
  FILTER_CUTOFF = 8,
  FILTER_RESONANCE = 9,
  FILTER_ENV_AMOUNT = 10,

  // Filter Envelope (11-14)
  FILTER_ATTACK = 11,
  FILTER_DECAY = 12,
  FILTER_SUSTAIN = 13,
  FILTER_RELEASE = 14,

  // Amp Envelope (15-18)
  AMP_ATTACK = 15,
  AMP_DECAY = 16,
  AMP_SUSTAIN = 17,
  AMP_RELEASE = 18,

  // Master
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

  // Local state for UI display values
  const [partials, setPartials] = useState([1.0, 0.5, 0.3, 0.2, 0.15, 0.1, 0.05, 0.02]);
  const [filterCutoff, setFilterCutoff] = useState(0.5);
  const [filterRes, setFilterRes] = useState(0.3);
  const [filterEnvAmt, setFilterEnvAmt] = useState(0.5);

  // Envelope state
  const [filterEnv, setFilterEnv] = useState({ attack: 10, decay: 300, sustain: 50, release: 500 });
  const [ampEnv, setAmpEnv] = useState({ attack: 5, decay: 100, sustain: 80, release: 300 });
  const [masterVolume, setMasterVolume] = useState(0.7);

  // Helper to update partial level
  const updatePartial = (index: number, value: number) => {
    const newPartials = [...partials];
    newPartials[index] = value;
    setPartials(newPartials);
    setParameter(index, value);
  };

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
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '40px',
        }}>
          <h1 style={{
            fontSize: '48px',
            margin: 0,
            color: '#ff8844',
            letterSpacing: '8px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
          }}>
            ADDITIVE SQUARE
          </h1>
          <p style={{
            color: '#888',
            fontSize: '16px',
            marginTop: '10px',
            letterSpacing: '2px',
          }}>
            Square Wave Additive Synthesis
          </p>
        </div>
        <button
          onClick={initialize}
          style={{
            padding: '20px 60px',
            fontSize: '24px',
            background: '#ff8844',
            color: '#0a0a0a',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '4px',
            fontFamily: 'monospace',
            boxShadow: '0 4px 20px rgba(255, 136, 68, 0.3)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 30px rgba(255, 136, 68, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(255, 136, 68, 0.3)';
          }}
        >
          Start Synth
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
          fontSize: '42px',
          margin: 0,
          color: '#ff8844',
          letterSpacing: '6px',
          fontWeight: 'bold',
        }}>
          ADDITIVE SQUARE
        </h1>
        <p style={{
          margin: '10px 0 0 0',
          color: '#888',
          fontSize: '14px',
          letterSpacing: '2px',
        }}>
          8 Square Wave Partials • Ladder Filter • Dual ADSR Envelopes
        </p>
        {midiInputs.length > 0 && (
          <div style={{
            marginTop: '10px',
            color: '#00ff88',
            fontSize: '13px',
            letterSpacing: '1px',
          }}>
            MIDI: {midiInputs[0].name}
          </div>
        )}
      </header>

      {/* Partials Section - 8 square wave oscillators */}
      <SynthRow label="PARTIALS" theme="orange">
        <SynthKnob
          label="1x"
          min={0}
          max={1}
          value={partials[0]}
          onChange={(v) => updatePartial(0, v)}
        />
        <SynthKnob
          label="2x"
          min={0}
          max={1}
          value={partials[1]}
          onChange={(v) => updatePartial(1, v)}
        />
        <SynthKnob
          label="3x"
          min={0}
          max={1}
          value={partials[2]}
          onChange={(v) => updatePartial(2, v)}
        />
        <SynthKnob
          label="4x"
          min={0}
          max={1}
          value={partials[3]}
          onChange={(v) => updatePartial(3, v)}
        />
        <SynthKnob
          label="5x"
          min={0}
          max={1}
          value={partials[4]}
          onChange={(v) => updatePartial(4, v)}
        />
        <SynthKnob
          label="6x"
          min={0}
          max={1}
          value={partials[5]}
          onChange={(v) => updatePartial(5, v)}
        />
        <SynthKnob
          label="7x"
          min={0}
          max={1}
          value={partials[6]}
          onChange={(v) => updatePartial(6, v)}
        />
        <SynthKnob
          label="8x"
          min={0}
          max={1}
          value={partials[7]}
          onChange={(v) => updatePartial(7, v)}
        />
      </SynthRow>

      {/* Filter Section */}
      <SynthRow label="FILTER (Vintage Ladder)" theme="orange">
        <SynthKnob
          label="CUTOFF"
          min={0}
          max={1}
          value={filterCutoff}
          onChange={(v) => {
            setFilterCutoff(v);
            setParameter(ParamID.FILTER_CUTOFF, v);
          }}
        />
        <SynthKnob
          label="RES"
          min={0}
          max={1}
          value={filterRes}
          onChange={(v) => {
            setFilterRes(v);
            setParameter(ParamID.FILTER_RESONANCE, v);
          }}
        />
        <SynthKnob
          label="ENV AMT"
          min={-1}
          max={1}
          value={filterEnvAmt}
          onChange={(v) => {
            setFilterEnvAmt(v);
            setParameter(ParamID.FILTER_ENV_AMOUNT, v);
          }}
          bipolar={true}
        />
      </SynthRow>

      {/* Filter Envelope */}
      <SynthADSR
        label="FILTER ENVELOPE"
        attack={filterEnv.attack}
        decay={filterEnv.decay}
        sustain={filterEnv.sustain}
        release={filterEnv.release}
        onAttackChange={(ms) => {
          setFilterEnv({ ...filterEnv, attack: ms });
          setParameter(ParamID.FILTER_ATTACK, ms / 1000); // Convert to seconds
        }}
        onDecayChange={(ms) => {
          setFilterEnv({ ...filterEnv, decay: ms });
          setParameter(ParamID.FILTER_DECAY, ms / 1000);
        }}
        onSustainChange={(pct) => {
          setFilterEnv({ ...filterEnv, sustain: pct });
          setParameter(ParamID.FILTER_SUSTAIN, pct / 100);
        }}
        onReleaseChange={(ms) => {
          setFilterEnv({ ...filterEnv, release: ms });
          setParameter(ParamID.FILTER_RELEASE, ms / 1000);
        }}
        maxAttack={5000}
        maxDecay={5000}
        maxRelease={10000}
        showTabs={false}
      />

      {/* Amp Envelope */}
      <SynthADSR
        label="AMP ENVELOPE"
        attack={ampEnv.attack}
        decay={ampEnv.decay}
        sustain={ampEnv.sustain}
        release={ampEnv.release}
        onAttackChange={(ms) => {
          setAmpEnv({ ...ampEnv, attack: ms });
          setParameter(ParamID.AMP_ATTACK, ms / 1000);
        }}
        onDecayChange={(ms) => {
          setAmpEnv({ ...ampEnv, decay: ms });
          setParameter(ParamID.AMP_DECAY, ms / 1000);
        }}
        onSustainChange={(pct) => {
          setAmpEnv({ ...ampEnv, sustain: pct });
          setParameter(ParamID.AMP_SUSTAIN, pct / 100);
        }}
        onReleaseChange={(ms) => {
          setAmpEnv({ ...ampEnv, release: ms });
          setParameter(ParamID.AMP_RELEASE, ms / 1000);
        }}
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
          value={masterVolume}
          onChange={(v) => {
            setMasterVolume(v);
            setParameter(ParamID.MASTER_VOLUME, v);
          }}
        />
      </SynthRow>

      {/* Footer */}
      <footer style={{
        marginTop: '60px',
        paddingTop: '20px',
        borderTop: '1px solid #333',
        fontSize: '11px',
        color: '#555',
        textAlign: 'center',
        letterSpacing: '1px',
      }}>
        <div style={{ marginBottom: '8px' }}>
          AutoSynth | WebAssembly + Web Audio API + Web MIDI
        </div>
        <div style={{ color: '#444' }}>
          DSP: SST Basic Blocks (PulseOscillator) • SST Filters (VintageLadder)
        </div>
      </footer>
    </div>
  );
};

export default App;
