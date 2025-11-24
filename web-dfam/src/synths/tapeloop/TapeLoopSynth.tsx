/**
 * @file TapeLoopSynth.tsx
 * @brief TapeLoop web synthesizer UI using core/ui component library
 *
 * Tape loop drone engine with:
 * - 2 oscillators with FM
 * - Tape loop buffer with recording/playback
 * - Tape degradation effects (wobble, hiss, age)
 * - LFO with multiple targets
 * - Dual step sequencers
 * - Delay and reverb effects
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useAudioEngine } from './useAudioEngine';
import { SynthKnob } from '../../components/SynthKnob';
import { SynthSequencer } from '../../components/SynthSequencer';
import { SynthRow } from '../../components/SynthRow';
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

const divisionOptions = [
  { value: 0, label: '1/8' },
  { value: 1, label: '1/4' },
  { value: 2, label: '1/2' },
  { value: 3, label: '1' },
  { value: 4, label: '2' },
  { value: 5, label: '4' },
];

const TapeLoopSynth: React.FC<TapeLoopSynthProps> = ({ onBack }) => {
  const { isReady, seq1Step, seq2Step, error, initialize, setParam, noteOn, noteOff, clearTape } = useAudioEngine();

  // Parameters - Oscillators
  const [osc1Wave, setOsc1Wave] = useState(1);
  const [osc1Tune, setOsc1Tune] = useState(0);
  const [osc1Level, setOsc1Level] = useState(70);
  const [osc2Wave, setOsc2Wave] = useState(1);
  const [osc2Tune, setOsc2Tune] = useState(0);
  const [osc2Detune, setOsc2Detune] = useState(5);
  const [osc2Level, setOsc2Level] = useState(50);
  const [fmAmount, setFmAmount] = useState(0);

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

  // Parameters - Effects
  const [delayTime, setDelayTime] = useState(300);
  const [delayFeedback, setDelayFeedback] = useState(40);
  const [delayMix, setDelayMix] = useState(20);
  const [reverbDecay, setReverbDecay] = useState(70);
  const [reverbDamping, setReverbDamping] = useState(50);
  const [reverbMix, setReverbMix] = useState(20);

  // Parameters - Sequencer
  const [seqEnabled, setSeqEnabled] = useState(true);
  const [seqBPM, setSeqBPM] = useState(120);
  const [seq1Division, setSeq1Division] = useState(3);
  const [seq2Division, setSeq2Division] = useState(2);

  // Parameters - Modulation
  const [voiceLoopFM, setVoiceLoopFM] = useState(0);
  const [panSpeed, setPanSpeed] = useState(0.2);
  const [panDepth, setPanDepth] = useState(30);

  // Sequencer step data
  const [seq1Pitches, setSeq1Pitches] = useState<number[]>(
    [48, 53, 48, 55, 52, 48, 55, 60]
  );
  const [seq1Gates, setSeq1Gates] = useState<boolean[]>(
    [true, true, false, true, true, false, true, true]
  );
  const [seq2Pitches, setSeq2Pitches] = useState<number[]>(
    [60, 64, 67, 60, 65, 69, 64, 72]
  );
  const [seq2Gates, setSeq2Gates] = useState<boolean[]>(
    [true, false, true, true, false, true, false, true]
  );

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
    updateParam('osc1Wave', osc1Wave);
    updateParam('osc1Tune', osc1Tune);
    updateParam('osc1Level', osc1Level / 100);
    updateParam('osc2Wave', osc2Wave);
    updateParam('osc2Tune', osc2Tune);
    updateParam('osc2Detune', osc2Detune);
    updateParam('osc2Level', osc2Level / 100);
    updateParam('fmAmount', fmAmount / 100);
    updateParam('loopLength', loopLength);
    updateParam('loopFeedback', loopFeedback / 100);
    updateParam('recordLevel', recordLevel / 100);
    updateParam('saturation', saturation / 100);
    updateParam('wobbleRate', wobbleRate);
    updateParam('wobbleDepth', wobbleDepth / 100);
    updateParam('tapeHiss', tapeHiss / 100);
    updateParam('tapeAge', tapeAge / 100);
    updateParam('tapeDegrade', tapeDegrade / 100);
    updateParam('lfoRate', lfoRate);
    updateParam('lfoDepth', lfoDepth / 100);
    updateParam('lfoWaveform', lfoWaveform);
    updateParam('lfoTarget', lfoTarget);
    updateParam('dryLevel', dryLevel / 100);
    updateParam('loopLevel', loopLevel / 100);
    updateParam('masterLevel', masterLevel / 100);
    updateParam('recAttack', recAttack / 1000);
    updateParam('recDecay', recDecay / 1000);
    updateParam('delayTime', delayTime / 1000);
    updateParam('delayFeedback', delayFeedback / 100);
    updateParam('delayMix', delayMix / 100);
    updateParam('reverbDecay', reverbDecay / 100);
    updateParam('reverbDamping', reverbDamping / 100);
    updateParam('reverbMix', reverbMix / 100);
    updateParam('seqEnabled', seqEnabled);
    updateParam('seqBPM', seqBPM);
    updateParam('seq1Division', seq1Division);
    updateParam('seq2Division', seq2Division);
    updateParam('voiceLoopFM', voiceLoopFM / 100);
    updateParam('panSpeed', panSpeed);
    updateParam('panDepth', panDepth / 100);

    // Initialize sequencer steps
    seq1Pitches.forEach((pitch, i) => {
      updateParam(`seq1Pitch_${i}`, pitch);
      updateParam(`seq1Gate_${i}`, seq1Gates[i]);
    });
    seq2Pitches.forEach((pitch, i) => {
      updateParam(`seq2Pitch_${i}`, pitch);
      updateParam(`seq2Gate_${i}`, seq2Gates[i]);
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

      {/* Main controls grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 'var(--synth-space-lg)',
        maxWidth: '1400px',
        margin: '0 auto',
      }}>
        {/* Oscillator 1 */}
        <SynthRow label="OSCILLATOR 1" theme="amber" icon="~">
          <Select label="WAVE" value={osc1Wave} options={waveformOptions} onChange={(v) => { setOsc1Wave(v); updateParam('osc1Wave', v); }} />
          <SynthKnob label="TUNE" value={osc1Tune} min={-24} max={24} step={1} onChange={(v) => { setOsc1Tune(v); updateParam('osc1Tune', v); }} />
          <SynthKnob label="LEVEL" value={osc1Level} min={0} max={100} onChange={(v) => { setOsc1Level(v); updateParam('osc1Level', v / 100); }} />
        </SynthRow>

        {/* Oscillator 2 */}
        <SynthRow label="OSCILLATOR 2" theme="amber" icon="~">
          <Select label="WAVE" value={osc2Wave} options={waveformOptions} onChange={(v) => { setOsc2Wave(v); updateParam('osc2Wave', v); }} />
          <SynthKnob label="TUNE" value={osc2Tune} min={-24} max={24} step={1} onChange={(v) => { setOsc2Tune(v); updateParam('osc2Tune', v); }} />
          <SynthKnob label="DETUNE" value={osc2Detune} min={0} max={100} onChange={(v) => { setOsc2Detune(v); updateParam('osc2Detune', v); }} />
          <SynthKnob label="LEVEL" value={osc2Level} min={0} max={100} onChange={(v) => { setOsc2Level(v); updateParam('osc2Level', v / 100); }} />
        </SynthRow>

        {/* Modulation */}
        <SynthRow label="MODULATION" theme="magenta" icon="◊">
          <SynthKnob label="FM AMT" value={fmAmount} min={0} max={100} onChange={(v) => { setFmAmount(v); updateParam('fmAmount', v / 100); }} />
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

        {/* LFO */}
        <SynthRow label="LFO" theme="cyan" icon="∿">
          <SynthKnob label="RATE" value={lfoRate} min={0.01} max={20} onChange={(v) => { setLfoRate(v); updateParam('lfoRate', v); }} />
          <SynthKnob label="DEPTH" value={lfoDepth} min={0} max={100} onChange={(v) => { setLfoDepth(v); updateParam('lfoDepth', v / 100); }} />
          <Select label="WAVE" value={lfoWaveform} options={waveformOptions} onChange={(v) => { setLfoWaveform(v); updateParam('lfoWaveform', v); }} />
          <Select label="TARGET" value={lfoTarget} options={lfoTargetOptions} onChange={(v) => { setLfoTarget(v); updateParam('lfoTarget', v); }} />
        </SynthRow>

        {/* Envelope */}
        <SynthRow label="RECORD ENVELOPE" theme="green" icon="⊢">
          <SynthKnob label="ATTACK" value={recAttack} min={1} max={2000} onChange={(v) => { setRecAttack(v); updateParam('recAttack', v / 1000); }} />
          <SynthKnob label="DECAY" value={recDecay} min={10} max={5000} onChange={(v) => { setRecDecay(v); updateParam('recDecay', v / 1000); }} />
        </SynthRow>

        {/* Mix */}
        <SynthRow label="MIX" theme="blue" icon="≡">
          <SynthKnob label="DRY" value={dryLevel} min={0} max={100} onChange={(v) => { setDryLevel(v); updateParam('dryLevel', v / 100); }} />
          <SynthKnob label="LOOP" value={loopLevel} min={0} max={100} onChange={(v) => { setLoopLevel(v); updateParam('loopLevel', v / 100); }} />
          <SynthKnob label="MASTER" value={masterLevel} min={0} max={100} onChange={(v) => { setMasterLevel(v); updateParam('masterLevel', v / 100); }} />
        </SynthRow>

        {/* Auto Pan */}
        <SynthRow label="AUTO PAN" theme="cyan" icon="↔">
          <SynthKnob label="SPEED" value={panSpeed} min={0} max={5} onChange={(v) => { setPanSpeed(v); updateParam('panSpeed', v); }} />
          <SynthKnob label="DEPTH" value={panDepth} min={0} max={100} onChange={(v) => { setPanDepth(v); updateParam('panDepth', v / 100); }} />
        </SynthRow>

        {/* Delay */}
        <SynthRow label="DELAY" theme="pink" icon="⊙">
          <SynthKnob label="TIME" value={delayTime} min={10} max={1000} onChange={(v) => { setDelayTime(v); updateParam('delayTime', v / 1000); }} />
          <SynthKnob label="FDBK" value={delayFeedback} min={0} max={95} onChange={(v) => { setDelayFeedback(v); updateParam('delayFeedback', v / 100); }} />
          <SynthKnob label="MIX" value={delayMix} min={0} max={100} onChange={(v) => { setDelayMix(v); updateParam('delayMix', v / 100); }} />
        </SynthRow>

        {/* Reverb */}
        <SynthRow label="REVERB" theme="pink" icon="◌">
          <SynthKnob label="DECAY" value={reverbDecay} min={10} max={99} onChange={(v) => { setReverbDecay(v); updateParam('reverbDecay', v / 100); }} />
          <SynthKnob label="DAMP" value={reverbDamping} min={0} max={100} onChange={(v) => { setReverbDamping(v); updateParam('reverbDamping', v / 100); }} />
          <SynthKnob label="MIX" value={reverbMix} min={0} max={100} onChange={(v) => { setReverbMix(v); updateParam('reverbMix', v / 100); }} />
        </SynthRow>
      </div>

      {/* Sequencer Section */}
      <div style={{
        marginTop: 'var(--synth-space-xl)',
        maxWidth: '1400px',
        margin: 'var(--synth-space-xl) auto 0',
      }}>
        <SynthRow label="SEQUENCER" theme="magenta" icon="▶">
          {/* Global controls */}
          <div style={synthStyles.column('var(--synth-space-md)')}>
            <Toggle label="ENABLE" value={seqEnabled} onChange={(v) => { setSeqEnabled(v); updateParam('seqEnabled', v); }} />
            <SynthKnob label="BPM" value={seqBPM} min={30} max={300} step={1} onChange={(v) => { setSeqBPM(v); updateParam('seqBPM', v); }} />
          </div>

          {/* Division selectors */}
          <div style={synthStyles.column('var(--synth-space-md)')}>
            <Select label="SEQ 1 DIV" value={seq1Division} options={divisionOptions} onChange={(v) => { setSeq1Division(v); updateParam('seq1Division', v); }} />
            <Select label="SEQ 2 DIV" value={seq2Division} options={divisionOptions} onChange={(v) => { setSeq2Division(v); updateParam('seq2Division', v); }} />
          </div>

          {/* Sequencer 1 */}
          <div style={{ flex: 1, minWidth: '400px' }}>
            <SynthSequencer
              steps={8}
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

          {/* Sequencer 2 */}
          <div style={{ flex: 1, minWidth: '400px' }}>
            <SynthSequencer
              steps={8}
              pitchValues={seq2Pitches}
              gateValues={seq2Gates}
              currentStep={seq2Step}
              onPitchChange={(i, pitch) => {
                const newPitches = [...seq2Pitches];
                newPitches[i] = pitch;
                setSeq2Pitches(newPitches);
                updateParam(`seq2Pitch_${i}`, pitch);
              }}
              onGateChange={(i, gate) => {
                const newGates = [...seq2Gates];
                newGates[i] = gate;
                setSeq2Gates(newGates);
                updateParam(`seq2Gate_${i}`, gate);
              }}
            />
          </div>
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
