/**
 * @file DFAMSynth.tsx
 * @brief DFAM Web Synth Component
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAudioEngine } from './useAudioEngine';
import { SynthKnob } from '../../components/SynthKnob';
import { Sequencer } from '../../components/Sequencer';

const WAVEFORM_OPTIONS = ['SAW', 'SQR', 'TRI', 'SIN'];
const CLOCK_DIVIDER_OPTIONS = ['1/16', '1/12', '1/8', '1/6', '1/5', '1/4', '1/3', '1/2', '1x', '3/2', '2x', '3x', '4x', '5x', '6x', '8x'];
const CLOCK_DIVIDER_VALUES = [0.0625, 0.0833, 0.125, 0.167, 0.2, 0.25, 0.333, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8];

interface SynthParams {
  // Transport
  tempo: number;
  clockDivider: number;

  // VCO1
  vco1Freq: number;
  vco1Wave: number;
  vco1Level: number;

  // VCO2
  vco2Freq: number;
  vco2Wave: number;
  vco2Level: number;

  // FM & Noise
  fmAmount: number;
  noiseLevel: number;

  // Filter
  filterCutoff: number;
  filterReso: number;
  filterEnvAmount: number;
  filterMode: number;
  filterLfoRate: number;
  filterLfoAmount: number;

  // Pitch Envelope
  pitchEnvAttack: number;
  pitchEnvDecay: number;
  pitchEnvAmount: number;

  // VCF/VCA Envelope
  vcfVcaAttack: number;
  vcfVcaDecay: number;

  // Effects
  satDrive: number;
  satMix: number;
  delayTime: number;
  delayFeedback: number;
  delayMix: number;
  reverbDecay: number;
  reverbDamping: number;
  reverbMix: number;

  // Master
  masterVolume: number;

  // Sequencer
  seqPitch: number[];
  seqVel: number[];
}

const defaultParams: SynthParams = {
  tempo: 120,
  clockDivider: 8,
  vco1Freq: 110,
  vco1Wave: 0,
  vco1Level: 0.5,
  vco2Freq: 110,
  vco2Wave: 0,
  vco2Level: 0.5,
  fmAmount: 0,
  noiseLevel: 0,
  filterCutoff: 5000,
  filterReso: 0,
  filterEnvAmount: 0.5,
  filterMode: 0,
  filterLfoRate: 1,
  filterLfoAmount: 0,
  pitchEnvAttack: 0.001,
  pitchEnvDecay: 0.3,
  pitchEnvAmount: 24,
  vcfVcaAttack: 0.001,
  vcfVcaDecay: 0.5,
  satDrive: 1,
  satMix: 0,
  delayTime: 0.5,
  delayFeedback: 0.3,
  delayMix: 0,
  reverbDecay: 2,
  reverbDamping: 0.5,
  reverbMix: 0,
  masterVolume: -6,
  seqPitch: [0, 0, 0, 0, 0, 0, 0, 0],
  seqVel: [1, 1, 1, 1, 1, 1, 1, 1],
};

interface DFAMSynthProps {
  onBack?: () => void;
}

const DFAMSynth: React.FC<DFAMSynthProps> = ({ onBack }) => {
  const { isReady, isPlaying, currentStep, error, initialize, setParam, setPlaying } = useAudioEngine();
  const [params, setParams] = useState<SynthParams>(defaultParams);
  const [isStarted, setIsStarted] = useState(false);

  // Handle start button click
  const handleStart = useCallback(async () => {
    await initialize();
    setIsStarted(true);
  }, [initialize]);

  // Update a parameter
  const updateParam = useCallback((name: keyof SynthParams, value: number | number[]) => {
    setParams(p => ({ ...p, [name]: value }));

    if (typeof value === 'number') {
      // Handle clock divider conversion
      if (name === 'clockDivider') {
        setParam('clockDivider', CLOCK_DIVIDER_VALUES[value] ?? 1);
      } else {
        setParam(name, value);
      }
    }
  }, [setParam]);

  // Update sequencer step
  const updateSeqPitch = useCallback((step: number, value: number) => {
    setParams(p => {
      const newPitch = [...p.seqPitch];
      newPitch[step] = value;
      return { ...p, seqPitch: newPitch };
    });
    setParam(`seqPitch_${step}`, value);
  }, [setParam]);

  const updateSeqVel = useCallback((step: number, value: number) => {
    setParams(p => {
      const newVel = [...p.seqVel];
      newVel[step] = value;
      return { ...p, seqVel: newVel };
    });
    setParam(`seqVel_${step}`, value);
  }, [setParam]);

  // Send initial params when ready
  useEffect(() => {
    if (isReady) {
      Object.entries(params).forEach(([key, value]) => {
        if (key === 'seqPitch' || key === 'seqVel') return;
        if (key === 'clockDivider') {
          setParam('clockDivider', CLOCK_DIVIDER_VALUES[value as number] ?? 1);
        } else {
          setParam(key, value as number);
        }
      });
      params.seqPitch.forEach((v, i) => setParam(`seqPitch_${i}`, v));
      params.seqVel.forEach((v, i) => setParam(`seqVel_${i}`, v));
    }
  }, [isReady]);

  // Show start screen if not started
  if (!isStarted) {
    return (
      <div style={{
        background: '#0d0d0d',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
        color: '#fff',
      }}>
        <h1 style={{
          color: '#ff6600',
          fontSize: '48px',
          fontWeight: 'bold',
          letterSpacing: '8px',
          textShadow: '0 0 30px rgba(255,102,0,0.5)',
          marginBottom: '20px',
        }}>DFAM</h1>
        <p style={{ color: '#888', marginBottom: '40px' }}>
          Percussion Synthesizer
        </p>
        <button
          onClick={handleStart}
          style={{
            background: 'linear-gradient(145deg, #ff6600, #cc4400)',
            border: 'none',
            borderRadius: '8px',
            padding: '16px 48px',
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#fff',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(255,102,0,0.4)',
            transition: 'transform 0.1s, box-shadow 0.1s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 6px 30px rgba(255,102,0,0.6)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,102,0,0.4)';
          }}
        >
          START AUDIO
        </button>
        <p style={{ color: '#666', fontSize: '12px', marginTop: '20px' }}>
          Click to enable Web Audio
        </p>
      </div>
    );
  }

  // Show loading
  if (!isReady) {
    return (
      <div style={{
        background: '#0d0d0d',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ff6600',
        fontSize: '24px',
      }}>
        Loading WASM...
      </div>
    );
  }

  // Show error
  if (error) {
    return (
      <div style={{
        background: '#0d0d0d',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ff4444',
        fontSize: '18px',
        padding: '20px',
        textAlign: 'center',
      }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{
      background: '#0d0d0d',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
      padding: '16px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        padding: '12px 20px',
        background: 'linear-gradient(180deg, rgba(255,102,0,0.15), rgba(255,102,0,0.05))',
        borderBottom: '2px solid #ff6600',
        borderRadius: '8px 8px 0 0',
        marginBottom: '16px',
      }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              background: 'transparent',
              border: '1px solid #666',
              borderRadius: '4px',
              padding: '6px 12px',
              color: '#888',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            ← Back
          </button>
        )}
        <h1 style={{
          color: '#ff6600',
          fontSize: '28px',
          fontWeight: 'bold',
          letterSpacing: '4px',
          textShadow: '0 0 20px rgba(255,102,0,0.5)',
          margin: 0,
        }}>DFAM</h1>

        {/* Play/Stop */}
        <button
          onClick={() => setPlaying(!isPlaying)}
          style={{
            background: isPlaying
              ? 'linear-gradient(145deg, #ff4444, #cc2222)'
              : 'linear-gradient(145deg, #44ff44, #22cc22)',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 24px',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#fff',
            cursor: 'pointer',
            boxShadow: isPlaying
              ? '0 0 15px rgba(255,68,68,0.5)'
              : '0 0 15px rgba(68,255,68,0.5)',
          }}
        >
          {isPlaying ? 'STOP' : 'PLAY'}
        </button>

        <SynthKnob
          label="TEMPO"
          min={20}
          max={300}
          value={params.tempo}
          onChange={(v) => updateParam('tempo', v)}
          defaultValue={120}
        />

        <SynthKnob
          label="CLK÷"
          min={0}
          max={15}
          step={1}
          options={CLOCK_DIVIDER_OPTIONS}
          value={params.clockDivider}
          onChange={(v) => updateParam('clockDivider', v)}
          defaultValue={8}
        />

        <SynthKnob
          label="MASTER"
          min={-60}
          max={0}
          value={params.masterVolume}
          onChange={(v) => updateParam('masterVolume', v)}
          defaultValue={-6}
        />
      </div>

      {/* Oscillators Row */}
      <div style={{
        display: 'flex',
        gap: '16px',
        padding: '16px',
        background: 'linear-gradient(180deg, rgba(255,200,100,0.1), rgba(255,200,100,0.02))',
        border: '1px solid #886600',
        borderRadius: '8px',
        marginBottom: '16px',
      }}>
        <div style={{ color: '#ffcc66', fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px', writingMode: 'vertical-rl', textOrientation: 'mixed' }}>OSC</div>

        {/* VCO 1 */}
        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #886600', borderRadius: '8px', padding: '12px' }}>
          <div style={{ color: '#ffcc66', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '8px', textAlign: 'center' }}>VCO 1</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <SynthKnob label="FREQ" min={20} max={2000} value={params.vco1Freq} onChange={(v) => updateParam('vco1Freq', v)} defaultValue={110} />
            <SynthKnob label="WAVE" min={0} max={3} step={1} options={WAVEFORM_OPTIONS} value={params.vco1Wave} onChange={(v) => updateParam('vco1Wave', v)} />
            <SynthKnob label="LEVEL" min={0} max={1} value={params.vco1Level} onChange={(v) => updateParam('vco1Level', v)} defaultValue={0.5} />
          </div>
        </div>

        {/* VCO 2 */}
        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #886600', borderRadius: '8px', padding: '12px' }}>
          <div style={{ color: '#ffcc66', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '8px', textAlign: 'center' }}>VCO 2</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <SynthKnob label="FREQ" min={20} max={2000} value={params.vco2Freq} onChange={(v) => updateParam('vco2Freq', v)} defaultValue={110} />
            <SynthKnob label="WAVE" min={0} max={3} step={1} options={WAVEFORM_OPTIONS} value={params.vco2Wave} onChange={(v) => updateParam('vco2Wave', v)} />
            <SynthKnob label="LEVEL" min={0} max={1} value={params.vco2Level} onChange={(v) => updateParam('vco2Level', v)} defaultValue={0.5} />
          </div>
        </div>

        {/* FM / Noise */}
        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #886600', borderRadius: '8px', padding: '12px' }}>
          <div style={{ color: '#ffcc66', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '8px', textAlign: 'center' }}>FM / NOISE</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <SynthKnob label="FM" min={0} max={1} value={params.fmAmount} onChange={(v) => updateParam('fmAmount', v)} defaultValue={0} />
            <SynthKnob label="NOISE" min={0} max={1} value={params.noiseLevel} onChange={(v) => updateParam('noiseLevel', v)} defaultValue={0} />
          </div>
        </div>
      </div>

      {/* Filter & Envelopes Row */}
      <div style={{
        display: 'flex',
        gap: '16px',
        padding: '16px',
        background: 'linear-gradient(180deg, rgba(100,100,255,0.1), rgba(100,100,255,0.02))',
        border: '1px solid #5555cc',
        borderRadius: '8px',
        marginBottom: '16px',
      }}>
        <div style={{ color: '#aaaaff', fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px', writingMode: 'vertical-rl', textOrientation: 'mixed' }}>FLT/ENV</div>

        {/* Filter */}
        <div style={{ background: 'rgba(0,0,30,0.4)', border: '1px solid #5555cc', borderRadius: '8px', padding: '12px' }}>
          <div style={{ color: '#aaaaff', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '8px', textAlign: 'center' }}>FILTER</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <SynthKnob label="CUTOFF" min={20} max={20000} value={params.filterCutoff} onChange={(v) => updateParam('filterCutoff', v)} defaultValue={5000} />
            <SynthKnob label="RESO" min={0} max={1} value={params.filterReso} onChange={(v) => updateParam('filterReso', v)} defaultValue={0} />
            <SynthKnob label="ENV" min={0} max={1} value={params.filterEnvAmount} onChange={(v) => updateParam('filterEnvAmount', v)} defaultValue={0.5} />
            <SynthKnob label="MODE" min={0} max={1} step={1} options={['LP', 'HP']} value={params.filterMode} onChange={(v) => updateParam('filterMode', v)} />
          </div>
        </div>

        {/* Pitch Envelope */}
        <div style={{ background: 'rgba(0,30,15,0.5)', border: '1px solid #00aa44', borderRadius: '8px', padding: '12px' }}>
          <div style={{ color: '#66ff99', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '8px', textAlign: 'center' }}>PITCH ENV</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <SynthKnob label="ATK" min={0.001} max={2} value={params.pitchEnvAttack} onChange={(v) => updateParam('pitchEnvAttack', v)} defaultValue={0.001} />
            <SynthKnob label="DCY" min={0.001} max={2} value={params.pitchEnvDecay} onChange={(v) => updateParam('pitchEnvDecay', v)} defaultValue={0.3} />
            <SynthKnob label="AMT" min={0} max={48} value={params.pitchEnvAmount} onChange={(v) => updateParam('pitchEnvAmount', v)} defaultValue={24} />
          </div>
        </div>

        {/* VCF/VCA Envelope */}
        <div style={{ background: 'rgba(0,30,15,0.5)', border: '1px solid #00aa44', borderRadius: '8px', padding: '12px' }}>
          <div style={{ color: '#66ff99', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '8px', textAlign: 'center' }}>VCF/VCA ENV</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <SynthKnob label="ATK" min={0.001} max={2} value={params.vcfVcaAttack} onChange={(v) => updateParam('vcfVcaAttack', v)} defaultValue={0.001} />
            <SynthKnob label="DCY" min={0.001} max={2} value={params.vcfVcaDecay} onChange={(v) => updateParam('vcfVcaDecay', v)} defaultValue={0.5} />
          </div>
        </div>
      </div>

      {/* Sequencer Row */}
      <div style={{
        display: 'flex',
        gap: '16px',
        padding: '16px',
        background: 'linear-gradient(180deg, rgba(255,100,255,0.1), rgba(255,100,255,0.02))',
        border: '1px solid #cc00cc',
        borderRadius: '8px',
        marginBottom: '16px',
      }}>
        <div style={{ color: '#ff66ff', fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px', writingMode: 'vertical-rl', textOrientation: 'mixed' }}>SEQ</div>

        <Sequencer
          label="PITCH"
          values={params.seqPitch}
          currentStep={currentStep}
          min={-24}
          max={24}
          bipolar={true}
          onChange={updateSeqPitch}
          formatValue={(v) => `${v > 0 ? '+' : ''}${v}`}
        />

        <Sequencer
          label="VELOCITY"
          values={params.seqVel.map(v => v * 100)}
          currentStep={currentStep}
          min={0}
          max={100}
          onChange={(step, value) => updateSeqVel(step, value / 100)}
          formatValue={(v) => `${v}%`}
        />
      </div>

      {/* Effects Row */}
      <div style={{
        display: 'flex',
        gap: '16px',
        padding: '16px',
        background: 'linear-gradient(180deg, rgba(255,100,150,0.1), rgba(255,100,150,0.02))',
        border: '1px solid #ff3366',
        borderRadius: '8px',
      }}>
        <div style={{ color: '#ff6688', fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px', writingMode: 'vertical-rl', textOrientation: 'mixed' }}>FX</div>

        {/* Drive */}
        <div style={{ background: 'rgba(255,51,102,0.05)', border: '1px solid rgba(255,51,102,0.3)', borderRadius: '8px', padding: '10px' }}>
          <div style={{ color: '#ff6688', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '8px', textAlign: 'center' }}>DRIVE</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <SynthKnob label="DRIVE" min={1} max={20} value={params.satDrive} onChange={(v) => updateParam('satDrive', v)} defaultValue={1} />
            <SynthKnob label="MIX" min={0} max={1} value={params.satMix} onChange={(v) => updateParam('satMix', v)} defaultValue={0} />
          </div>
        </div>

        {/* Delay */}
        <div style={{ background: 'rgba(255,51,102,0.05)', border: '1px solid rgba(255,51,102,0.3)', borderRadius: '8px', padding: '10px' }}>
          <div style={{ color: '#ff6688', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '8px', textAlign: 'center' }}>DELAY</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <SynthKnob label="TIME" min={0.01} max={2} value={params.delayTime} onChange={(v) => updateParam('delayTime', v)} defaultValue={0.5} />
            <SynthKnob label="FDBK" min={0} max={0.95} value={params.delayFeedback} onChange={(v) => updateParam('delayFeedback', v)} defaultValue={0.3} />
            <SynthKnob label="MIX" min={0} max={1} value={params.delayMix} onChange={(v) => updateParam('delayMix', v)} defaultValue={0} />
          </div>
        </div>

        {/* Reverb */}
        <div style={{ background: 'rgba(255,51,102,0.05)', border: '1px solid rgba(255,51,102,0.3)', borderRadius: '8px', padding: '10px' }}>
          <div style={{ color: '#ff6688', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '8px', textAlign: 'center' }}>REVERB</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <SynthKnob label="DECAY" min={0.1} max={10} value={params.reverbDecay} onChange={(v) => updateParam('reverbDecay', v)} defaultValue={2} />
            <SynthKnob label="DAMP" min={0} max={1} value={params.reverbDamping} onChange={(v) => updateParam('reverbDamping', v)} defaultValue={0.5} />
            <SynthKnob label="MIX" min={0} max={1} value={params.reverbMix} onChange={(v) => updateParam('reverbMix', v)} defaultValue={0} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DFAMSynth;
