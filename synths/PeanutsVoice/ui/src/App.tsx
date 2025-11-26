import React, { useState, useEffect, useRef } from 'react';
import { useAudioEngine } from './hooks/useAudioEngine';
import {
  SynthKnob,
  SynthRow,
  SynthADSR,
  SynthLFO,
  SynthSequencer,
} from '../../../core/ui/components';

/**
 * PeanutsVoice - Muted Trombone "Wah Wah Wah" Synthesizer
 *
 * Recreates the iconic adult voice sound from Peanuts cartoons.
 * Uses brass-like oscillators with heavy filtering and LFO modulation
 * to create the characteristic "wah wah wah" talking effect.
 */

// Parameter IDs (must match Voice.h)
enum ParamID {
  OSC_WAVEFORM = 0,
  OSC_TUNE = 1,
  OSC_LEVEL = 2,
  DRIVE = 3,
  FILTER_FORMANT = 4,
  FILTER_CUTOFF = 5,
  FILTER_RESONANCE = 6,
  LFO_RATE = 7,
  LFO_DEPTH = 8,
  LFO_WAVEFORM = 9,
  FILTER_ATTACK = 10,
  FILTER_DECAY = 11,
  FILTER_SUSTAIN = 12,
  FILTER_RELEASE = 13,
  AMP_ATTACK = 14,
  AMP_DECAY = 15,
  AMP_SUSTAIN = 16,
  AMP_RELEASE = 17,
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

  // UI State
  const [oscWaveform, setOscWaveform] = useState(0);
  const [oscTune, setOscTune] = useState(0.5); // 0-1 (maps to -24 to +24 semitones)
  const [oscLevel, setOscLevel] = useState(0.8);
  const [drive, setDrive] = useState(0.3);

  const [filterFormant, setFilterFormant] = useState(0.6); // 0-1 (vowel position: ah→eh→ee→oh→oo)
  const [filterCutoff, setFilterCutoff] = useState(0.1); // 0-1 (maps to 20-8000 Hz) [deprecated - now uses formant]
  const [filterResonance, setFilterResonance] = useState(0.7); // Higher resonance for formant peaks

  const [lfoRate, setLfoRate] = useState(0.2); // 0-1 (maps to 0.1-10 Hz)
  const [lfoDepth, setLfoDepth] = useState(0.5);
  const [lfoWaveform, setLfoWaveform] = useState(0);

  const [filterAttack, setFilterAttack] = useState(10);
  const [filterDecay, setFilterDecay] = useState(100);
  const [filterSustain, setFilterSustain] = useState(70);
  const [filterRelease, setFilterRelease] = useState(200);

  const [ampAttack, setAmpAttack] = useState(5);
  const [ampDecay, setAmpDecay] = useState(150);
  const [ampSustain, setAmpSustain] = useState(80);
  const [ampRelease, setAmpRelease] = useState(300);

  const [masterVolume, setMasterVolume] = useState(0.8);

  // Sequencer state
  const [sequencerEnabled, setSequencerEnabled] = useState(false);
  const [sequencerSteps, setSequencerSteps] = useState(8);
  const [sequencerTempo, setSequencerTempo] = useState(120); // BPM
  const [currentStep, setCurrentStep] = useState(-1);
  const [stepPitches, setStepPitches] = useState<number[]>([
    60, 60, 60, 60, 60, 60, 60, 60, // All C4 by default
  ]);
  const [stepGates, setStepGates] = useState<boolean[]>([
    true, true, true, false, true, true, true, false, // Pattern: on on on off...
  ]);

  // Sequencer timing
  const stepIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sequencer playback
  useEffect(() => {
    if (!isReady || !sequencerEnabled) {
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
        stepIntervalRef.current = null;
      }
      setCurrentStep(-1);
      return;
    }

    // Calculate step duration from tempo
    const stepDuration = (60 / sequencerTempo) * 1000 / 4; // 16th notes

    let step = 0;
    stepIntervalRef.current = setInterval(() => {
      setCurrentStep(step);

      // Trigger note if gate is on
      if (stepGates[step]) {
        const note = stepPitches[step];
        const velocity = 0.8;

        // Send note on
        setParameter(ParamID.OSC_LEVEL, velocity);
        // Note: In a real implementation, we'd send MIDI note on/off
        // For now, just trigger the envelope
      }

      step = (step + 1) % sequencerSteps;
    }, stepDuration);

    return () => {
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
      }
    };
  }, [isReady, sequencerEnabled, sequencerTempo, sequencerSteps, stepGates, stepPitches, setParameter]);

  // Error state
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

  // Loading state
  if (!isReady) {
    return (
      <div style={{
        background: '#0a0a0a',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
      }}>
        <div style={{
          fontSize: '72px',
          marginBottom: '20px',
        }}>
          🎺
        </div>
        <h1 style={{
          color: '#ff8844',
          fontSize: '48px',
          margin: 0,
          fontFamily: 'monospace',
          letterSpacing: '4px',
        }}>
          PEANUTS VOICE
        </h1>
        <p style={{
          color: '#888',
          fontSize: '18px',
          fontFamily: 'monospace',
          marginBottom: '20px',
        }}>
          Classic Muted Trombone "Wah Wah Wah" Effect
        </p>
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
            fontFamily: 'monospace',
          }}
        >
          Start Engine
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
        borderBottom: '3px solid #ff8844',
        paddingBottom: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ fontSize: '48px' }}>🎺</div>
          <div>
            <h1 style={{
              fontSize: '42px',
              margin: 0,
              color: '#ff8844',
              letterSpacing: '4px',
            }}>
              PEANUTS VOICE
            </h1>
            <p style={{
              margin: '5px 0 0 0',
              color: '#888',
              fontSize: '14px',
            }}>
              Muted Trombone "Wah Wah Wah" Synthesizer
            </p>
          </div>
        </div>
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

      {/* Oscillator Section */}
      <SynthRow label="OSCILLATOR" theme="orange">
        <SynthKnob
          label="WAVE"
          min={0}
          max={1}
          value={oscWaveform}
          options={['SAW', 'PULSE']}
          onChange={(v) => {
            setOscWaveform(v);
            setParameter(ParamID.OSC_WAVEFORM, v);
          }}
        />
        <SynthKnob
          label="TUNE"
          min={0}
          max={1}
          value={oscTune}
          onChange={(v) => {
            setOscTune(v);
            setParameter(ParamID.OSC_TUNE, v);
          }}
          formatValue={(v) => {
            const semitones = Math.round(v * 48 - 24);
            return semitones >= 0 ? `+${semitones}` : `${semitones}`;
          }}
        />
        <SynthKnob
          label="LEVEL"
          min={0}
          max={1}
          value={oscLevel}
          onChange={(v) => {
            setOscLevel(v);
            setParameter(ParamID.OSC_LEVEL, v);
          }}
          formatValue={(v) => `${Math.round(v * 100)}%`}
        />
        <SynthKnob
          label="DRIVE"
          min={0}
          max={1}
          value={drive}
          onChange={(v) => {
            setDrive(v);
            setParameter(ParamID.DRIVE, v);
          }}
          formatValue={(v) => `${Math.round(v * 100)}%`}
        />
      </SynthRow>

      {/* Formant Filter Section */}
      <SynthRow label="FORMANT FILTER (Vowel Morphing)" theme="orange">
        <SynthKnob
          label="VOWEL"
          min={0}
          max={1}
          value={filterFormant}
          onChange={(v) => {
            setFilterFormant(v);
            setParameter(ParamID.FILTER_FORMANT, v);
          }}
          formatValue={(v) => {
            const vowels = ['/a/ (ah)', '/e/ (eh)', '/i/ (ee)', '/o/ (oh)', '/u/ (oo)'];
            const idx = Math.floor(v * 4.999);
            return vowels[idx];
          }}
        />
        <SynthKnob
          label="RESONANCE"
          min={0}
          max={1}
          value={filterResonance}
          onChange={(v) => {
            setFilterResonance(v);
            setParameter(ParamID.FILTER_RESONANCE, v);
          }}
          formatValue={(v) => `${Math.round(v * 100)}%`}
        />
      </SynthRow>

      {/* LFO Section - "Wah Wah" Modulation */}
      <SynthRow label='LFO ("WAH WAH" MODULATION)' theme="orange">
        <SynthKnob
          label="WAVE"
          min={0}
          max={2}
          value={lfoWaveform}
          step={1}
          options={['SINE', 'TRI', 'SQR']}
          onChange={(v) => {
            setLfoWaveform(v);
            setParameter(ParamID.LFO_WAVEFORM, v);
          }}
        />
        <SynthKnob
          label="RATE"
          min={0}
          max={1}
          value={lfoRate}
          onChange={(v) => {
            setLfoRate(v);
            setParameter(ParamID.LFO_RATE, v);
          }}
          formatValue={(v) => {
            const hz = v * 9.9 + 0.1;
            return `${hz.toFixed(1)}Hz`;
          }}
        />
        <SynthKnob
          label="DEPTH"
          min={0}
          max={1}
          value={lfoDepth}
          onChange={(v) => {
            setLfoDepth(v);
            setParameter(ParamID.LFO_DEPTH, v);
          }}
          formatValue={(v) => `${Math.round(v * 100)}%`}
        />
      </SynthRow>

      {/* Filter Envelope */}
      <SynthADSR
        label="FILTER ENVELOPE"
        attack={filterAttack}
        decay={filterDecay}
        sustain={filterSustain}
        release={filterRelease}
        onAttackChange={(ms) => {
          setFilterAttack(ms);
          setParameter(ParamID.FILTER_ATTACK, ms / 1000);
        }}
        onDecayChange={(ms) => {
          setFilterDecay(ms);
          setParameter(ParamID.FILTER_DECAY, ms / 2000);
        }}
        onSustainChange={(pct) => {
          setFilterSustain(pct);
          setParameter(ParamID.FILTER_SUSTAIN, pct / 100);
        }}
        onReleaseChange={(ms) => {
          setFilterRelease(ms);
          setParameter(ParamID.FILTER_RELEASE, ms / 3000);
        }}
        maxAttack={1000}
        maxDecay={2000}
        maxRelease={3000}
        showTabs={false}
      />

      {/* Amp Envelope */}
      <SynthADSR
        label="AMP ENVELOPE"
        attack={ampAttack}
        decay={ampDecay}
        sustain={ampSustain}
        release={ampRelease}
        onAttackChange={(ms) => {
          setAmpAttack(ms);
          setParameter(ParamID.AMP_ATTACK, ms / 500);
        }}
        onDecayChange={(ms) => {
          setAmpDecay(ms);
          setParameter(ParamID.AMP_DECAY, ms / 2000);
        }}
        onSustainChange={(pct) => {
          setAmpSustain(pct);
          setParameter(ParamID.AMP_SUSTAIN, pct / 100);
        }}
        onReleaseChange={(ms) => {
          setAmpRelease(ms);
          setParameter(ParamID.AMP_RELEASE, ms / 3000);
        }}
        maxAttack={500}
        maxDecay={2000}
        maxRelease={3000}
        showTabs={false}
      />

      {/* Sequencer Section */}
      <div style={{ marginTop: '40px' }}>
        <SynthRow label="SEQUENCER ('Wah Wah Wah' Patterns)" theme="orange">
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <button
              onClick={() => setSequencerEnabled(!sequencerEnabled)}
              style={{
                padding: '12px 24px',
                background: sequencerEnabled ? '#00ff88' : '#333',
                color: sequencerEnabled ? '#0a0a0a' : '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                fontFamily: 'monospace',
              }}
            >
              {sequencerEnabled ? '⏸ STOP' : '▶ PLAY'}
            </button>
            <SynthKnob
              label="TEMPO"
              min={60}
              max={240}
              value={sequencerTempo}
              onChange={setSequencerTempo}
              formatValue={(v) => `${Math.round(v)} BPM`}
            />
            <SynthKnob
              label="STEPS"
              min={4}
              max={16}
              step={1}
              value={sequencerSteps}
              onChange={(v) => {
                const newSteps = Math.round(v);
                setSequencerSteps(newSteps);
                // Resize arrays if needed
                if (stepPitches.length < newSteps) {
                  setStepPitches([...stepPitches, ...Array(newSteps - stepPitches.length).fill(60)]);
                  setStepGates([...stepGates, ...Array(newSteps - stepGates.length).fill(true)]);
                }
              }}
              formatValue={(v) => `${Math.round(v)}`}
            />
          </div>
        </SynthRow>

        <SynthSequencer
          steps={sequencerSteps}
          pitchValues={stepPitches}
          gateValues={stepGates}
          currentStep={currentStep}
          onPitchChange={(step, pitch) => {
            const newPitches = [...stepPitches];
            newPitches[step] = pitch;
            setStepPitches(newPitches);
          }}
          onGateChange={(step, gate) => {
            const newGates = [...stepGates];
            newGates[step] = gate;
            setStepGates(newGates);
          }}
          minPitch={36}  // C1
          maxPitch={84}  // C6
        />
      </div>

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
          formatValue={(v) => `${Math.round(v * 100)}%`}
        />
      </SynthRow>

      {/* Sound Design Tips */}
      <div style={{
        marginTop: '40px',
        padding: '20px',
        background: '#1a1a1a',
        borderRadius: '8px',
        borderLeft: '4px solid #ff8844',
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#ff8844' }}>
          Sound Design Tips (Formant Filter Edition)
        </h3>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#aaa', lineHeight: '1.8' }}>
          <li><strong>Classic "Wah Wah":</strong> Vowel at /o/ or /u/ (muted), high resonance (70-80%), LFO rate 2-4Hz, depth 50-70%</li>
          <li><strong>Vowel Morphing:</strong> LFO sweeps between vowels (/a/→/o/→/u/) creating speech-like articulation</li>
          <li><strong>Brass Character:</strong> Use SAW waveform, add Drive (30-50%) for rich harmonics through formant bank</li>
          <li><strong>Muted Sound:</strong> Set vowel to /u/ (oo) - lowest, darkest formants for that muffled trombone tone</li>
          <li><strong>Open Sound:</strong> Set vowel to /a/ (ah) - highest formants for brighter, more open brass tone</li>
          <li><strong>Talking Effect:</strong> High resonance (80%+) creates pronounced formant peaks = clearer "speech"</li>
          <li><strong>Articulation:</strong> Fast filter attack (5-10ms), medium decay (100-200ms) for syllable-like phrasing</li>
        </ul>
      </div>

      {/* Footer */}
      <footer style={{
        marginTop: '60px',
        paddingTop: '20px',
        borderTop: '1px solid #333',
        fontSize: '12px',
        color: '#666',
        textAlign: 'center',
      }}>
        AutoSynth PeanutsVoice | WebAssembly + SST Libraries + Web Audio + Web MIDI
      </footer>
    </div>
  );
};

export default App;
