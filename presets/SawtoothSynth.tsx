/**
 * @file SawtoothSynth.tsx
 * @brief Simple sawtooth synth UI using the component library
 */

import { SynthKnob, SynthToggle } from '../components/VintageSynthUI';
import { SynthADSR } from '../components/SynthADSR';
import { TransportControls } from '../components/TransportControls';
import { SynthRow } from '../components/SynthRow';
import { SynthSequencer } from '../components/SynthSequencer';
import Oscilloscope from '../components/Oscilloscope';
import { useState, useEffect } from 'react';

interface SawtoothSynthProps {
  paramValues: Record<string, number>;
  onChange: (paramId: string, value: number) => void;
  parameters: Record<string, any>;
}

export function SawtoothSynth({ paramValues, onChange, parameters: _parameters }: SawtoothSynthProps) {
  void _parameters; // Suppress unused variable warning
  const [activeEnvTab, setActiveEnvTab] = useState(0); // 0=OSC1, 1=OSC2, 2=FLT
  const [audioData, setAudioData] = useState<number[]>([]);

  // Helper to get parameter value with fallback to default
  const getParamValue = (paramId: string, defaultValue: number) => {
    const value = paramValues[paramId];
    return value !== undefined ? value : defaultValue;
  };

  // Receive real audio data from JUCE
  useEffect(() => {
    // Register callback for JUCE to send scope data
    (window as any).updateScopeData = (data: number[]) => {
      setAudioData(data);
    };

    // Cleanup
    return () => {
      delete (window as any).updateScopeData;
    };
  }, []);

  // Convert normalized values to actual times (milliseconds) and percentages
  // IMPORTANT: JUCE uses skewed normalization (skew=0.3) for envelope times
  // With skew < 1.0, the curve is weighted toward lower values
  const denormalizeTime = (normalizedValue: number, min: number, max: number, skew: number = 0.3) => {
    // JUCE: start + (end - start) * proportion^(1/skew) when skew < 1
    const seconds = min + (max - min) * Math.pow(normalizedValue, 1.0 / skew);
    return seconds * 1000; // Convert to milliseconds
  };

  const normalizeTime = (milliseconds: number, min: number, max: number, skew: number = 0.3) => {
    // JUCE: inverse of denormalize
    const seconds = milliseconds / 1000;
    const proportion = (seconds - min) / (max - min);
    return Math.pow(proportion, skew);
  };

  const denormalizePercent = (normalizedValue: number) => {
    return normalizedValue * 100;
  };

  const normalizePercent = (percentage: number) => {
    return percentage / 100;
  };

  const denormalizeFreq = (normalizedValue: number, min: number, max: number, skew: number = 0.3) => {
    return min + (max - min) * Math.pow(normalizedValue, 1.0 / skew);
  };

  const normalizeFreq = (frequency: number, min: number, max: number, skew: number = 0.3) => {
    const proportion = (frequency - min) / (max - min);
    return Math.pow(proportion, skew);
  };

  // Normalize octave value (-4 to 4) to 0-1 range
  const normalizeOctave = (octave: number) => {
    return (octave + 4) / 8; // Maps -4->0, 0->0.5, 4->1
  };

  // Denormalize 0-1 to octave value (-4 to 4)
  const denormalizeOctave = (normalizedValue: number) => {
    return Math.round(normalizedValue * 8 - 4); // Maps 0->-4, 0.5->0, 1->4
  };

  // Get active envelope params based on tab
  const getEnvParams = () => {
    switch (activeEnvTab) {
      case 0: // OSC1
        return {
          attack: denormalizeTime(getParamValue('osc1_attack', 0.0001), 0.005, 50),
          decay: denormalizeTime(getParamValue('osc1_decay', 0.003), 0.005, 50),
          sustain: denormalizePercent(getParamValue('osc1_sustain', 0.7)),
          release: denormalizeTime(getParamValue('osc1_release', 0.006), 0.005, 50),
          onAttackChange: (ms: number) => onChange('osc1_attack', normalizeTime(ms, 0.005, 50)),
          onDecayChange: (ms: number) => onChange('osc1_decay', normalizeTime(ms, 0.005, 50)),
          onSustainChange: (pct: number) => onChange('osc1_sustain', normalizePercent(pct)),
          onReleaseChange: (ms: number) => onChange('osc1_release', normalizeTime(ms, 0.005, 50)),
        };
      case 1: // OSC2
        return {
          attack: denormalizeTime(getParamValue('osc2_attack', 0.0001), 0.005, 50),
          decay: denormalizeTime(getParamValue('osc2_decay', 0.003), 0.005, 50),
          sustain: denormalizePercent(getParamValue('osc2_sustain', 0.7)),
          release: denormalizeTime(getParamValue('osc2_release', 0.006), 0.005, 50),
          onAttackChange: (ms: number) => onChange('osc2_attack', normalizeTime(ms, 0.005, 50)),
          onDecayChange: (ms: number) => onChange('osc2_decay', normalizeTime(ms, 0.005, 50)),
          onSustainChange: (pct: number) => onChange('osc2_sustain', normalizePercent(pct)),
          onReleaseChange: (ms: number) => onChange('osc2_release', normalizeTime(ms, 0.005, 50)),
        };
      case 2: // FLT
        return {
          attack: denormalizeTime(getParamValue('saw_filter_attack', 0.0001), 0.005, 50),
          decay: denormalizeTime(getParamValue('saw_filter_decay', 0.01), 0.005, 50),
          sustain: denormalizePercent(getParamValue('saw_filter_sustain', 0.5)),
          release: denormalizeTime(getParamValue('saw_filter_release', 0.006), 0.005, 50),
          onAttackChange: (ms: number) => onChange('saw_filter_attack', normalizeTime(ms, 0.005, 50)),
          onDecayChange: (ms: number) => onChange('saw_filter_decay', normalizeTime(ms, 0.005, 50)),
          onSustainChange: (pct: number) => onChange('saw_filter_sustain', normalizePercent(pct)),
          onReleaseChange: (ms: number) => onChange('saw_filter_release', normalizeTime(ms, 0.005, 50)),
        };
      default:
        return getEnvParams(); // Fallback to first tab
    }
  };

  const envParams = getEnvParams();

  // Denormalize BPM (30-300)
  const denormalizeBpm = (normalizedValue: number) => {
    return 30 + normalizedValue * (300 - 30);
  };

  const normalizeBpm = (bpm: number) => {
    return (bpm - 30) / (300 - 30);
  };

  // Denormalize pitch parameter (MIDI note 36-84)
  const denormalizePitch = (normalizedValue: number) => {
    return Math.round(36 + normalizedValue * (84 - 36));
  };

  const normalizePitch = (midiNote: number) => {
    return (midiNote - 36) / (84 - 36);
  };

  // Get sequencer values
  const getSeqPitches = () => {
    const pitches = [];
    for (let i = 1; i <= 16; i++) {
      const normalized = getParamValue(`saw_seq_pitch_${i}`, 0.5); // Default to middle of range
      pitches.push(denormalizePitch(normalized));
    }
    return pitches;
  };

  const getSeqGates = () => {
    const gates = [];
    for (let i = 1; i <= 16; i++) {
      gates.push(getParamValue(`saw_seq_gate_${i}`, 1) >= 0.5);
    }
    return gates;
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--synth-gradient-panel)',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: 'var(--synth-space-xl)',
          gap: 'calc(var(--synth-space-xl) * 2)',
        }}
      >
        {/* Row 1: BPM, Voice Mode, Transport, Oscilloscope */}
        <SynthRow gap="calc(var(--synth-space-xl) * 2)" wrap={true}>
          {/* BPM Tempo Knob */}
          <SynthKnob
            label="TEMPO"
            value={denormalizeBpm(getParamValue('saw_seq_bpm', 0.333))}
            onChange={(v: number) => onChange('saw_seq_bpm', normalizeBpm(v))}
            min={30}
            max={300}
            step={1}
          />

          {/* Voice Mode Toggle */}
          <SynthToggle
            label="POLY"
            value={getParamValue('voice_mode', 1) >= 0.5}
            onChange={(v: boolean) => onChange('voice_mode', v ? 1 : 0)}
            variant="toggle"
          />

          {/* Transport Controls */}
          <TransportControls
            isPlaying={getParamValue('saw_seq_playing', 0) >= 0.5}
            onPlay={() => {
              console.log('[SawtoothSynth] onPlay called');
              onChange('saw_seq_playing', 1);
            }}
            onPause={() => {
              console.log('[SawtoothSynth] onPause called');
              onChange('saw_seq_playing', 0);
            }}
            onStop={() => {
              console.log('[SawtoothSynth] onStop called');
              onChange('saw_seq_playing', 0);
              onChange('saw_seq_current_step', 0);
            }}
          />

          {/* Oscilloscope */}
          <div style={{ width: 'var(--synth-3k)', height: 'var(--synth-1k)' }}>
            <Oscilloscope
              label="WAVEFORM"
              width={192}
              height={64}
              audioData={audioData}
              color="#00ff88"
              backgroundColor="#000000"
              gridColor="#2a2a2a"
              showGrid={true}
              showPeaks={true}
            />
          </div>
        </SynthRow>

        {/* Row 2: Oscillators, Filter, Envelope */}
        <SynthRow gap="calc(var(--synth-space-xl) * 2)" wrap={true}>
          {/* Oscillator 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--synth-space-md)', alignItems: 'center' }}>
            <div style={{ color: 'var(--synth-accent-primary)', fontSize: 'var(--synth-font-size-base)', fontWeight: 'bold' }}>
              OSC 1
            </div>
            <div style={{ display: 'flex', gap: 'var(--synth-space-md)' }}>
              <SynthKnob
                label="LEVEL"
                value={getParamValue('osc1_level', 0.7)}
                onChange={(v: number) => onChange('osc1_level', v)}
                min={0}
                max={1}
              />
              <SynthKnob
                label="OCTAVE"
                value={denormalizeOctave(getParamValue('osc1_octave', 0.5))}
                onChange={(v: number) => onChange('osc1_octave', normalizeOctave(v))}
                min={-4}
                max={4}
                step={1}
                options={["128'", "64'", "32'", "16'", "8'", "4'", "2'", "1'", "1/2'"]}
              />
            </div>
          </div>

          {/* Oscillator 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--synth-space-md)', alignItems: 'center' }}>
            <div style={{ color: 'var(--synth-accent-primary)', fontSize: 'var(--synth-font-size-base)', fontWeight: 'bold' }}>
              OSC 2
            </div>
            <div style={{ display: 'flex', gap: 'var(--synth-space-md)' }}>
              <SynthKnob
                label="LEVEL"
                value={getParamValue('osc2_level', 0.5)}
                onChange={(v: number) => onChange('osc2_level', v)}
                min={0}
                max={1}
              />
              <SynthKnob
                label="OCTAVE"
                value={denormalizeOctave(getParamValue('osc2_octave', 0.375))}
                onChange={(v: number) => onChange('osc2_octave', normalizeOctave(v))}
                min={-4}
                max={4}
                step={1}
                options={["128'", "64'", "32'", "16'", "8'", "4'", "2'", "1'", "1/2'"]}
              />
            </div>
          </div>

          {/* Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--synth-space-md)', alignItems: 'center' }}>
            <div style={{ color: 'var(--synth-accent-primary)', fontSize: 'var(--synth-font-size-base)', fontWeight: 'bold' }}>
              FILTER
            </div>
            <SynthKnob
              label="CUTOFF"
              value={denormalizeFreq(getParamValue('saw_filter_cutoff', 0.3988), 20, 20000)}
              onChange={(v: number) => onChange('saw_filter_cutoff', normalizeFreq(v, 20, 20000))}
              min={20}
              max={20000}
            />
          </div>

          {/* Envelope Section */}
          <SynthADSR
            label="ENVELOPE"
            tabs={['OSC1', 'OSC2', 'FLT']}
            activeTab={activeEnvTab}
            onTabChange={setActiveEnvTab}
            attack={envParams.attack}
            decay={envParams.decay}
            sustain={envParams.sustain}
            release={envParams.release}
            onAttackChange={envParams.onAttackChange}
            onDecayChange={envParams.onDecayChange}
            onSustainChange={envParams.onSustainChange}
            onReleaseChange={envParams.onReleaseChange}
            maxAttack={50000}
            maxDecay={50000}
            maxRelease={50000}
          />
        </SynthRow>

        {/* Row 3: Sequencer */}
        <SynthRow>
          <SynthSequencer
            steps={16}
            pitchValues={getSeqPitches()}
            gateValues={getSeqGates()}
            currentStep={Math.round(getParamValue('saw_seq_current_step', 0) * 15)}
            onPitchChange={(index: number, pitch: number) => {
              console.log('[SawtoothSynth] onPitchChange:', index, pitch, 'normalized:', normalizePitch(pitch));
              onChange(`saw_seq_pitch_${index + 1}`, normalizePitch(pitch));
            }}
            onGateChange={(index: number, gate: boolean) => {
              console.log('[SawtoothSynth] onGateChange:', index, gate, 'value:', gate ? 1 : 0);
              onChange(`saw_seq_gate_${index + 1}`, gate ? 1 : 0);
            }}
            minPitch={36}
            maxPitch={84}
          />
        </SynthRow>
      </div>
    </div>
  );
}
