/**
 * @file TapeLoopSynth.tsx
 * @brief TapeLoop web synthesizer UI using core/ui component library
 *
 * Tape loop drone engine with:
 * - Single oscillator with ADSR
 * - Tape loop buffer with recording/playback
 * - Tape degradation effects (wobble, hiss, age)
 * - LFO with multiple targets
 * - 4-step sequencer
 * - Delay and reverb effects
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useAudioEngine } from './useAudioEngine';
import { SynthKnob } from '../../components/SynthKnob';
import { SynthSequencer } from '../../components/SynthSequencer';
import { SynthRow } from '../../components/SynthRow';
import { SynthADSR } from '../../components/SynthADSR';
import { SynthLFO } from '../../components/SynthLFO';
import { synthStyles } from '../../styles/shared';

interface TapeLoopSynthProps {
  onBack?: () => void;
}

// Select dropdown using synthStyles
const Select: React.FC<{
  label: string;
  value: number;
  options: { value: number; label: string }[];
  onChange: (value: number) => void;
}> = ({ label, value, options, onChange }) => (
  <div style={synthStyles.knobContainer}>
    <div style={synthStyles.knobLabel}>{label}</div>
    <select
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      style={synthStyles.select}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

// Toggle button using synthStyles
const Toggle: React.FC<{
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}> = ({ label, value, onChange }) => {
  const [isPressed, setIsPressed] = useState(false);
  return (
    <div style={synthStyles.knobContainer}>
      <div style={synthStyles.knobLabel}>{label}</div>
      <div
        style={synthStyles.toggleButton(value, isPressed)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => { setIsPressed(false); onChange(!value); }}
        onMouseLeave={() => setIsPressed(false)}
      />
      <div style={synthStyles.knobValue}>{value ? 'ON' : 'OFF'}</div>
    </div>
  );
};

const waveformOptions = [
  { value: 0, label: 'SIN' },
  { value: 1, label: 'SAW' },
  { value: 2, label: 'SQR' },
  { value: 3, label: 'TRI' },
];

const lfoTargetOptions = [
  { value: 0, label: 'PITCH' },
  { value: 1, label: 'FILTER' },
  { value: 2, label: 'LOOP' },
  { value: 3, label: 'PAN' },
];

const tapeModelOptions = [
  { value: 0, label: 'BYPASS' },
  { value: 1, label: 'DUST' },
  { value: 2, label: 'AIRWIN' },
  { value: 3, label: 'BOTH' },
];

const divisionOptions = [
  { value: 0, label: '1/8' },
  { value: 1, label: '1/4' },
  { value: 2, label: '1/2' },
  { value: 3, label: '1' },
  { value: 4, label: '2' },
  { value: 5, label: '4' },
];

const TapeLoopSynth: React.FC<TapeLoopSynthProps> = ({ onBack }) => {
  const { isReady, seq1Step, error, initialize, setParam, noteOn, noteOff, clearTape } = useAudioEngine();

  // Parameters - Oscillator
  const [osc1Wave, setOsc1Wave] = useState(1);
  const [osc1Tune, setOsc1Tune] = useState(0);
  const [osc1Level, setOsc1Level] = useState(70);
  const [osc1Attack, setOsc1Attack] = useState(10);
  const [osc1Decay, setOsc1Decay] = useState(200);
  const [osc1Sustain, setOsc1Sustain] = useState(70);
  const [osc1Release, setOsc1Release] = useState(300);

  // Parameters - Tape Loop
  const [loopLength, setLoopLength] = useState(2.0);
  const [loopFeedback, setLoopFeedback] = useState(85);
  const [recordLevel, setRecordLevel] = useState(80);

  // Parameters - Tape Character
  const [saturation, setSaturation] = useState(30);
  const [wobbleRate, setWobbleRate] = useState(0.5);
  const [wobbleDepth, setWobbleDepth] = useState(20);
  const [tapeHiss, setTapeHiss] = useState(10);
  const [tapeAge, setTapeAge] = useState(20);
  const [tapeDegrade, setTapeDegrade] = useState(10);

  // Parameters - Tape Model (Airwindows)
  const [tapeModel, setTapeModel] = useState(3); // BOTH by default
  const [tapeDrive, setTapeDrive] = useState(30);
  const [tapeBump, setTapeBump] = useState(50);

  // Parameters - LFO
  const [lfoRate, setLfoRate] = useState(0.5);
  const [lfoDepth, setLfoDepth] = useState(30);
  const [lfoWaveform, setLfoWaveform] = useState(0);
  const [lfoTarget, setLfoTarget] = useState(0);

  // Parameters - Mix
  const [dryLevel, setDryLevel] = useState(30);
  const [loopLevel, setLoopLevel] = useState(70);
  const [masterLevel, setMasterLevel] = useState(80);

  // Parameters - Envelope
  const [recAttack, setRecAttack] = useState(10);
  const [recDecay, setRecDecay] = useState(1000);

  // Parameters - Effects (Delay)
  const [delayTime, setDelayTime] = useState(300);
  const [delayFeedback, setDelayFeedback] = useState(40);
  const [delayMix, setDelayMix] = useState(20);

  // Parameters - Reverb (Galactic3)
  const [reverbReplace, setReverbReplace] = useState(50);
  const [reverbBrightness, setReverbBrightness] = useState(50);
  const [reverbDetune, setReverbDetune] = useState(30);
  const [reverbBigness, setReverbBigness] = useState(50);
  const [reverbSize, setReverbSize] = useState(70);
  const [reverbMix, setReverbMix] = useState(20);

  // Parameters - Compressor
  const [compThreshold, setCompThreshold] = useState(-12);
  const [compRatio, setCompRatio] = useState(4);
  const [compAttack, setCompAttack] = useState(10);
  const [compRelease, setCompRelease] = useState(100);
  const [compMakeup, setCompMakeup] = useState(0);
  const [compMix, setCompMix] = useState(50);

  // Parameters - Sequencer
  const [seqEnabled, setSeqEnabled] = useState(true);
  const [seqBPM, setSeqBPM] = useState(120);
  const [seq1Division, setSeq1Division] = useState(3);

  // Parameters - Modulation
  const [voiceLoopFM, setVoiceLoopFM] = useState(0);
  const [panSpeed, setPanSpeed] = useState(0.2);
  const [panDepth, setPanDepth] = useState(30);

  // Sequencer step data - 4 steps
  const [seq1Pitches, setSeq1Pitches] = useState<number[]>([48, 53, 48, 55]);
  const [seq1Gates, setSeq1Gates] = useState<boolean[]>([true, true, false, true]);

  // Keyboard state
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());

  // Parameter update helper
  const updateParam = useCallback((name: string, value: number | boolean) => {
    setParam(name, value);
  }, [setParam]);

  // Initialize all parameters on ready
  useEffect(() => {
    if (!isReady) return;

    // Send all initial parameters (convert percentages to 0-1 range where needed)
    // Oscillator 1
    updateParam('osc1Wave', osc1Wave);
    updateParam('osc1Tune', osc1Tune);
    updateParam('osc1Level', osc1Level / 100);
    updateParam('osc1Attack', osc1Attack);
    updateParam('osc1Decay', osc1Decay);
    updateParam('osc1Sustain', osc1Sustain / 100);
    updateParam('osc1Release', osc1Release);
    // Tape Loop
    updateParam('loopLength', loopLength);
    updateParam('loopFeedback', loopFeedback / 100);
    updateParam('recordLevel', recordLevel / 100);
    // Tape Character
    updateParam('saturation', saturation / 100);
    updateParam('wobbleRate', wobbleRate);
    updateParam('wobbleDepth', wobbleDepth / 100);
    updateParam('tapeHiss', tapeHiss / 100);
    updateParam('tapeAge', tapeAge / 100);
    updateParam('tapeDegrade', tapeDegrade / 100);
    // Tape Model (Airwindows)
    updateParam('tapeModel', tapeModel);
    updateParam('tapeDrive', tapeDrive / 100);
    updateParam('tapeBump', tapeBump / 100);
    // LFO
    updateParam('lfoRate', lfoRate);
    updateParam('lfoDepth', lfoDepth / 100);
    updateParam('lfoWaveform', lfoWaveform);
    updateParam('lfoTarget', lfoTarget);
    // Mix
    updateParam('dryLevel', dryLevel / 100);
    updateParam('loopLevel', loopLevel / 100);
    updateParam('masterLevel', masterLevel / 100);
    // Record Envelope
    updateParam('recAttack', recAttack / 1000);
    updateParam('recDecay', recDecay / 1000);
    // Delay
    updateParam('delayTime', delayTime / 1000);
    updateParam('delayFeedback', delayFeedback / 100);
    updateParam('delayMix', delayMix / 100);
    // Reverb (Galactic3)
    updateParam('reverbReplace', reverbReplace / 100);
    updateParam('reverbBrightness', reverbBrightness / 100);
    updateParam('reverbDetune', reverbDetune / 100);
    updateParam('reverbBigness', reverbBigness / 100);
    updateParam('reverbSize', reverbSize / 100);
    updateParam('reverbMix', reverbMix / 100);
    // Compressor
    updateParam('compThreshold', compThreshold);
    updateParam('compRatio', compRatio);
    updateParam('compAttack', compAttack);
    updateParam('compRelease', compRelease);
    updateParam('compMakeup', compMakeup);
    updateParam('compMix', compMix / 100);
    // Sequencer
    updateParam('seqEnabled', seqEnabled);
    updateParam('seqBPM', seqBPM);
    updateParam('seq1Division', seq1Division);
    // Modulation
    updateParam('voiceLoopFM', voiceLoopFM / 100);
    updateParam('panSpeed', panSpeed);
    updateParam('panDepth', panDepth / 100);

    // Initialize sequencer steps
    seq1Pitches.forEach((pitch, i) => {
      updateParam(`seq1Pitch_${i}`, pitch);
      updateParam(`seq1Gate_${i}`, seq1Gates[i]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  // Keyboard handler
  useEffect(() => {
    const keyToNote: Record<string, number> = {
      'a': 60, 'w': 61, 's': 62, 'e': 63, 'd': 64, 'f': 65, 't': 66,
      'g': 67, 'y': 68, 'h': 69, 'u': 70, 'j': 71, 'k': 72,
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (keyToNote[key] && !activeKeys.has(key)) {
        setActiveKeys(prev => new Set(prev).add(key));
        noteOn(keyToNote[key], 0.8);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (keyToNote[key]) {
        setActiveKeys(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        noteOff(keyToNote[key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeKeys, noteOn, noteOff]);

  return (
    <div style={{
      background: 'var(--synth-bg-darkest)',
      minHeight: '100vh',
      padding: 'var(--synth-space-xl)',
      fontFamily: 'var(--synth-font-sans)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--synth-space-xl)',
        padding: '0 var(--synth-space-md)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--synth-space-lg)' }}>
          {onBack && (
            <button
              onClick={onBack}
              style={synthStyles.button('secondary')}
            >
              BACK
            </button>
          )}
          <h1 style={{
            color: 'var(--synth-text-primary)',
            fontSize: 'var(--synth-font-size-3xl)',
            fontWeight: 'var(--synth-font-weight-bold)',
            letterSpacing: 'var(--synth-letter-spacing-wider)',
            margin: 0,
            textShadow: '0 0 20px var(--synth-accent-glow)',
          }}>
            TAPELOOP
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--synth-space-md)' }}>
          {!isReady ? (
            <button
              onClick={initialize}
              style={synthStyles.button('primary', true)}
            >
              START AUDIO
            </button>
          ) : (
            <>
              <button
                onClick={clearTape}
                style={synthStyles.button('secondary')}
              >
                CLEAR TAPE
              </button>
              <button
                onClick={() => {
                  // Reset to initial state
                  clearTape();
                  setSeqEnabled(true);
                  setSeqBPM(120);
                }}
                style={synthStyles.button('secondary')}
              >
                RESET
              </button>
              <div style={synthStyles.led(true, 'var(--synth-led-green)')} />
              <span style={{ color: 'var(--synth-text-secondary)', fontSize: 'var(--synth-font-size-sm)' }}>READY</span>
            </>
          )}
          {error && <span style={{ color: 'var(--synth-led-red)', fontSize: 'var(--synth-font-size-sm)' }}>{error}</span>}
        </div>
      </div>

      {/* Sequencer at top - compact */}
      <div style={{
        maxWidth: '600px',
        margin: '0 auto var(--synth-space-lg)',
      }}>
        <SynthRow label="SEQUENCER" theme="orange" icon="▶">
          <Toggle label="ON" value={seqEnabled} onChange={(v) => { setSeqEnabled(v); updateParam('seqEnabled', v); }} />
          <SynthKnob label="BPM" value={seqBPM} min={30} max={300} step={1} onChange={(v) => { setSeqBPM(v); updateParam('seqBPM', v); }} />
          <Select label="DIV" value={seq1Division} options={divisionOptions} onChange={(v) => { setSeq1Division(v); updateParam('seq1Division', v); }} />
          <div style={{ minWidth: '200px' }}>
            <SynthSequencer
              steps={4}
              pitchValues={seq1Pitches}
              gateValues={seq1Gates}
              currentStep={seq1Step}
              onPitchChange={(i, pitch) => {
                const newPitches = [...seq1Pitches];
                newPitches[i] = pitch;
                setSeq1Pitches(newPitches);
                updateParam(`seq1Pitch_${i}`, pitch);
              }}
              onGateChange={(i, gate) => {
                const newGates = [...seq1Gates];
                newGates[i] = gate;
                setSeq1Gates(newGates);
                updateParam(`seq1Gate_${i}`, gate);
              }}
            />
          </div>
        </SynthRow>
      </div>

      {/* Main controls grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 'var(--synth-space-lg)',
        maxWidth: '1400px',
        margin: '0 auto',
      }}>
        {/* Oscillator */}
        <SynthRow label="OSCILLATOR" theme="orange" icon="~">
          <Select label="WAVE" value={osc1Wave} options={waveformOptions} onChange={(v) => { setOsc1Wave(v); updateParam('osc1Wave', v); }} />
          <SynthKnob label="TUNE" value={osc1Tune} min={-24} max={24} step={1} onChange={(v) => { setOsc1Tune(v); updateParam('osc1Tune', v); }} />
          <SynthKnob label="LEVEL" value={osc1Level} min={0} max={100} onChange={(v) => { setOsc1Level(v); updateParam('osc1Level', v / 100); }} />
          <SynthADSR
            label="OSC ENV"
            attack={osc1Attack}
            decay={osc1Decay}
            sustain={osc1Sustain}
            release={osc1Release}
            onAttackChange={(v) => { setOsc1Attack(v); updateParam('osc1Attack', v); }}
            onDecayChange={(v) => { setOsc1Decay(v); updateParam('osc1Decay', v); }}
            onSustainChange={(v) => { setOsc1Sustain(v); updateParam('osc1Sustain', v / 100); }}
            onReleaseChange={(v) => { setOsc1Release(v); updateParam('osc1Release', v); }}
            maxAttack={2000}
            maxDecay={2000}
            maxRelease={5000}
            showTabs={false}
          />
        </SynthRow>

        {/* Modulation */}
        <SynthRow label="MODULATION" theme="orange" icon="◊">
          <SynthKnob label="VOICE>LOOP" value={voiceLoopFM} min={0} max={100} onChange={(v) => { setVoiceLoopFM(v); updateParam('voiceLoopFM', v / 100); }} />
        </SynthRow>

        {/* Tape Loop */}
        <SynthRow label="TAPE LOOP" theme="orange" icon="◎">
          <SynthKnob label="LENGTH" value={loopLength} min={0.1} max={10} onChange={(v) => { setLoopLength(v); updateParam('loopLength', v); }} />
          <SynthKnob label="FEEDBACK" value={loopFeedback} min={0} max={100} onChange={(v) => { setLoopFeedback(v); updateParam('loopFeedback', v / 100); }} />
          <SynthKnob label="REC LVL" value={recordLevel} min={0} max={100} onChange={(v) => { setRecordLevel(v); updateParam('recordLevel', v / 100); }} />
        </SynthRow>

        {/* Tape Character */}
        <SynthRow label="TAPE CHARACTER" theme="orange" icon="▣">
          <SynthKnob label="SATUR" value={saturation} min={0} max={100} onChange={(v) => { setSaturation(v); updateParam('saturation', v / 100); }} />
          <SynthKnob label="WOB RT" value={wobbleRate} min={0} max={5} onChange={(v) => { setWobbleRate(v); updateParam('wobbleRate', v); }} />
          <SynthKnob label="WOB DP" value={wobbleDepth} min={0} max={100} onChange={(v) => { setWobbleDepth(v); updateParam('wobbleDepth', v / 100); }} />
          <SynthKnob label="HISS" value={tapeHiss} min={0} max={100} onChange={(v) => { setTapeHiss(v); updateParam('tapeHiss', v / 100); }} />
          <SynthKnob label="AGE" value={tapeAge} min={0} max={100} onChange={(v) => { setTapeAge(v); updateParam('tapeAge', v / 100); }} />
          <SynthKnob label="DEGRADE" value={tapeDegrade} min={0} max={100} onChange={(v) => { setTapeDegrade(v); updateParam('tapeDegrade', v / 100); }} />
        </SynthRow>

        {/* Tape Model (Airwindows) */}
        <SynthRow label="TAPE MODEL" theme="orange" icon="⊞">
          <Select label="MODEL" value={tapeModel} options={tapeModelOptions} onChange={(v) => { setTapeModel(v); updateParam('tapeModel', v); }} />
          <SynthKnob label="DRIVE" value={tapeDrive} min={0} max={100} onChange={(v) => { setTapeDrive(v); updateParam('tapeDrive', v / 100); }} />
          <SynthKnob label="BUMP" value={tapeBump} min={0} max={100} onChange={(v) => { setTapeBump(v); updateParam('tapeBump', v / 100); }} />
        </SynthRow>

        {/* LFO */}
        <SynthRow label="LFO" theme="orange" icon="∿">
          <SynthLFO
            label="MOD LFO"
            waveform={lfoWaveform}
            rate={lfoRate}
            onWaveformChange={(v) => { setLfoWaveform(v); updateParam('lfoWaveform', v); }}
            onRateChange={(v) => { setLfoRate(v); updateParam('lfoRate', v); }}
            minRate={0.01}
            maxRate={20}
          />
          <SynthKnob label="DEPTH" value={lfoDepth} min={0} max={100} onChange={(v) => { setLfoDepth(v); updateParam('lfoDepth', v / 100); }} />
          <Select label="TARGET" value={lfoTarget} options={lfoTargetOptions} onChange={(v) => { setLfoTarget(v); updateParam('lfoTarget', v); }} />
        </SynthRow>

        {/* Envelope */}
        <SynthRow label="RECORD ENVELOPE" theme="orange" icon="⊢">
          <SynthKnob label="ATTACK" value={recAttack} min={1} max={2000} onChange={(v) => { setRecAttack(v); updateParam('recAttack', v / 1000); }} />
          <SynthKnob label="DECAY" value={recDecay} min={10} max={5000} onChange={(v) => { setRecDecay(v); updateParam('recDecay', v / 1000); }} />
        </SynthRow>

        {/* Auto Pan */}
        <SynthRow label="AUTO PAN" theme="orange" icon="↔">
          <SynthKnob label="SPEED" value={panSpeed} min={0} max={5} onChange={(v) => { setPanSpeed(v); updateParam('panSpeed', v); }} />
          <SynthKnob label="DEPTH" value={panDepth} min={0} max={100} onChange={(v) => { setPanDepth(v); updateParam('panDepth', v / 100); }} />
        </SynthRow>

        {/* Delay */}
        <SynthRow label="DELAY" theme="orange" icon="⊙">
          <SynthKnob label="TIME" value={delayTime} min={10} max={1000} onChange={(v) => { setDelayTime(v); updateParam('delayTime', v / 1000); }} />
          <SynthKnob label="FDBK" value={delayFeedback} min={0} max={95} onChange={(v) => { setDelayFeedback(v); updateParam('delayFeedback', v / 100); }} />
          <SynthKnob label="MIX" value={delayMix} min={0} max={100} onChange={(v) => { setDelayMix(v); updateParam('delayMix', v / 100); }} />
        </SynthRow>

        {/* Reverb (Galactic3) */}
        <SynthRow label="GALACTIC REVERB" theme="orange" icon="◌">
          <SynthKnob label="REPLACE" value={reverbReplace} min={0} max={100} onChange={(v) => { setReverbReplace(v); updateParam('reverbReplace', v / 100); }} />
          <SynthKnob label="BRIGHT" value={reverbBrightness} min={0} max={100} onChange={(v) => { setReverbBrightness(v); updateParam('reverbBrightness', v / 100); }} />
          <SynthKnob label="DETUNE" value={reverbDetune} min={0} max={100} onChange={(v) => { setReverbDetune(v); updateParam('reverbDetune', v / 100); }} />
          <SynthKnob label="BIGNESS" value={reverbBigness} min={0} max={100} onChange={(v) => { setReverbBigness(v); updateParam('reverbBigness', v / 100); }} />
          <SynthKnob label="SIZE" value={reverbSize} min={0} max={100} onChange={(v) => { setReverbSize(v); updateParam('reverbSize', v / 100); }} />
          <SynthKnob label="MIX" value={reverbMix} min={0} max={100} onChange={(v) => { setReverbMix(v); updateParam('reverbMix', v / 100); }} />
        </SynthRow>

        {/* Compressor */}
        <SynthRow label="COMPRESSOR" theme="orange" icon="⊟">
          <SynthKnob label="THRESH" value={compThreshold} min={-60} max={0} onChange={(v) => { setCompThreshold(v); updateParam('compThreshold', v); }} />
          <SynthKnob label="RATIO" value={compRatio} min={1} max={20} step={0.5} onChange={(v) => { setCompRatio(v); updateParam('compRatio', v); }} />
          <SynthKnob label="ATK" value={compAttack} min={0.1} max={100} onChange={(v) => { setCompAttack(v); updateParam('compAttack', v); }} />
          <SynthKnob label="REL" value={compRelease} min={10} max={1000} onChange={(v) => { setCompRelease(v); updateParam('compRelease', v); }} />
          <SynthKnob label="MAKEUP" value={compMakeup} min={-12} max={24} onChange={(v) => { setCompMakeup(v); updateParam('compMakeup', v); }} />
          <SynthKnob label="MIX" value={compMix} min={0} max={100} onChange={(v) => { setCompMix(v); updateParam('compMix', v / 100); }} />
        </SynthRow>

        {/* Mix - at the end */}
        <SynthRow label="MIX" theme="orange" icon="≡">
          <SynthKnob label="DRY" value={dryLevel} min={0} max={100} onChange={(v) => { setDryLevel(v); updateParam('dryLevel', v / 100); }} />
          <SynthKnob label="LOOP" value={loopLevel} min={0} max={100} onChange={(v) => { setLoopLevel(v); updateParam('loopLevel', v / 100); }} />
          <SynthKnob label="MASTER" value={masterLevel} min={0} max={100} onChange={(v) => { setMasterLevel(v); updateParam('masterLevel', v / 100); }} />
        </SynthRow>
      </div>

      {/* Keyboard hint */}
      <div style={{
        marginTop: 'var(--synth-space-xl)',
        textAlign: 'center',
        color: 'var(--synth-text-tertiary)',
        fontSize: 'var(--synth-font-size-sm)',
      }}>
        Play with keyboard: A S D F G H J K (white keys) / W E T Y U (black keys)
      </div>
    </div>
  );
};

export default TapeLoopSynth;
