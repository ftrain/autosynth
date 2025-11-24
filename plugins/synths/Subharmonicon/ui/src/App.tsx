/**
 * @file App.tsx
 * @brief Subharmonicon - True 2-Voice Synthesizer UI
 *
 * HORIZONTAL ROW LAYOUT:
 * - Oscilloscope at top
 * - Voice 1: VCO1+subs | Filter1 | VCF1 EG | VCA1 EG | Sequencer1 | Rhythms 1&2
 * - Voice 2: VCO2+subs | Filter2 | VCF2 EG | VCA2 EG | Sequencer2 | Rhythms 3&4
 * - Master controls at bottom
 */

import React, { useState, useEffect } from 'react';
import { useJUCEBridge } from './hooks/useJUCEBridge';
import { useParameters, normalizeValue, denormalizeValue } from './hooks/useParameters';
import { PARAMETER_DEFINITIONS, WAVEFORM_OPTIONS, DIVISION_OPTIONS, RHYTHM_PRESETS, SequencerState } from './types/parameters';

const RHYTHM_LABELS = RHYTHM_PRESETS.map(p => p.label);
import { SynthKnob } from './components/SynthKnob';
import Oscilloscope from './components/Oscilloscope';
import { SynthLED } from './components/SynthLED';
import { SynthToggle } from './components/SynthToggle';
import { TransportControls } from './components/TransportControls';
import './styles/tokens.css';
import './index.css';

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
  const { isConnected, audioData: bridgeAudioData } = useJUCEBridge({ enableAudioData: true });

  const { paramValues, handleChange } = useParameters({
    parameters: PARAMETER_DEFINITIONS,
    syncWithJUCE: true,
  });

  const [seqState, setSeqState] = useState<SequencerState>({
    seq1Step: 0,
    seq2Step: 0,
    seq1Enabled: true,
    seq2Enabled: true,
    rhythm1Active: false,
    rhythm2Active: false,
    rhythm3Active: false,
    rhythm4Active: false,
  });

  useEffect(() => {
    (window as any).onSequencerState = (state: SequencerState) => {
      setSeqState(state);
    };
    return () => {
      (window as any).onSequencerState = null;
    };
  }, []);

  const isRunning = getDenormalized('seq_run', paramValues.seq_run ?? 0) > 0.5;
  const seq1Enabled = getDenormalized('seq1_enable', paramValues.seq1_enable ?? 1) > 0.5;
  const seq2Enabled = getDenormalized('seq2_enable', paramValues.seq2_enable ?? 1) > 0.5;

  return (
    <div className="synth-container horizontal-layout">
      {/* HEADER ROW: Title + Oscilloscope + Master Controls */}
      <header className="header-row">
        <div className="header-left">
          <h1 className="synth-title">SUBHARMONICON</h1>
          <SynthLED label="JUCE" active={isConnected} color="green" />
        </div>

        <div className="header-scope">
          <Oscilloscope
            audioData={bridgeAudioData}
            width={300}
            height={80}
            color="#00ff88"
          />
        </div>

        <div className="header-right">
          <TransportControls
            isPlaying={isRunning}
            onPlay={() => handleChange('seq_run', 1)}
            onPause={() => handleChange('seq_run', 0)}
            onStop={() => handleChange('seq_run', 0)}
          />
          <SynthKnob
            label="TEMPO"
            min={20}
            max={300}
            value={getDenormalized('tempo', paramValues.tempo ?? 0.5)}
            onChange={(v) => handleChange('tempo', getNormalized('tempo', v))}
          />
          <SynthKnob
            label="MASTER"
            min={0}
            max={1}
            value={getDenormalized('master_volume', paramValues.master_volume ?? 0.1)}
            onChange={(v) => handleChange('master_volume', getNormalized('master_volume', v))}
          />
        </div>
      </header>

      {/* VOICE 1 ROW */}
      <section className="voice-row">
        <div className="voice-label-box">
          <span className="voice-number">1</span>
          <SynthToggle
            label="SEQ"
            value={seq1Enabled}
            onChange={(v) => handleChange('seq1_enable', v ? 1 : 0)}
            variant="indicator"
          />
        </div>

        {/* VCO 1 */}
        <div className="module vco-module">
          <div className="module-title">VCO</div>
          <div className="module-knobs">
            <SynthKnob
              label="FREQ"
              min={20}
              max={2000}
              value={getDenormalized('osc1_freq', paramValues.osc1_freq ?? 0.1)}
              onChange={(v) => handleChange('osc1_freq', getNormalized('osc1_freq', v))}
            />
            <SynthKnob
              label="WAVE"
              min={0}
              max={3}
              step={1}
              value={getDenormalized('osc1_wave', paramValues.osc1_wave ?? 0)}
              onChange={(v) => handleChange('osc1_wave', getNormalized('osc1_wave', v))}
              options={WAVEFORM_OPTIONS}
            />
            <SynthKnob
              label="LVL"
              min={0}
              max={1}
              value={getDenormalized('osc1_level', paramValues.osc1_level ?? 0.8)}
              onChange={(v) => handleChange('osc1_level', getNormalized('osc1_level', v))}
            />
          </div>
          <div className="sub-knobs">
            <div className="sub-pair">
              <span className="sub-lbl">A</span>
              <SynthKnob
                label=""
                min={1}
                max={16}
                step={1}
                value={getDenormalized('sub1a_div', paramValues.sub1a_div ?? 0.0625)}
                onChange={(v) => handleChange('sub1a_div', getNormalized('sub1a_div', v))}
                options={DIVISION_OPTIONS}
              />
              <SynthKnob
                label=""
                min={0}
                max={1}
                value={getDenormalized('sub1a_level', paramValues.sub1a_level ?? 0.5)}
                onChange={(v) => handleChange('sub1a_level', getNormalized('sub1a_level', v))}
              />
            </div>
            <div className="sub-pair">
              <span className="sub-lbl">B</span>
              <SynthKnob
                label=""
                min={1}
                max={16}
                step={1}
                value={getDenormalized('sub1b_div', paramValues.sub1b_div ?? 0.125)}
                onChange={(v) => handleChange('sub1b_div', getNormalized('sub1b_div', v))}
                options={DIVISION_OPTIONS}
              />
              <SynthKnob
                label=""
                min={0}
                max={1}
                value={getDenormalized('sub1b_level', paramValues.sub1b_level ?? 0.5)}
                onChange={(v) => handleChange('sub1b_level', getNormalized('sub1b_level', v))}
              />
            </div>
          </div>
        </div>

        {/* Filter 1 */}
        <div className="module filter-module">
          <div className="module-title">FILTER</div>
          <div className="module-knobs">
            <SynthKnob
              label="CUT"
              min={20}
              max={20000}
              value={getDenormalized('filter1_cutoff', paramValues.filter1_cutoff ?? 0.1)}
              onChange={(v) => handleChange('filter1_cutoff', getNormalized('filter1_cutoff', v))}
            />
            <SynthKnob
              label="RES"
              min={0}
              max={1}
              value={getDenormalized('filter1_reso', paramValues.filter1_reso ?? 0.3)}
              onChange={(v) => handleChange('filter1_reso', getNormalized('filter1_reso', v))}
            />
            <SynthKnob
              label="EG"
              min={-1}
              max={1}
              value={getDenormalized('filter1_env_amt', paramValues.filter1_env_amt ?? 0.75)}
              onChange={(v) => handleChange('filter1_env_amt', getNormalized('filter1_env_amt', v))}
            />
          </div>
        </div>

        {/* VCF1 EG */}
        <div className="module eg-module">
          <div className="module-title">VCF EG</div>
          <div className="module-knobs">
            <SynthKnob
              label="ATK"
              min={0.001}
              max={5}
              value={getDenormalized('vcf1_attack', paramValues.vcf1_attack ?? 0.002)}
              onChange={(v) => handleChange('vcf1_attack', getNormalized('vcf1_attack', v))}
            />
            <SynthKnob
              label="DEC"
              min={0.001}
              max={5}
              value={getDenormalized('vcf1_decay', paramValues.vcf1_decay ?? 0.1)}
              onChange={(v) => handleChange('vcf1_decay', getNormalized('vcf1_decay', v))}
            />
          </div>
        </div>

        {/* VCA1 EG */}
        <div className="module eg-module">
          <div className="module-title">VCA EG</div>
          <div className="module-knobs">
            <SynthKnob
              label="ATK"
              min={0.001}
              max={5}
              value={getDenormalized('vca1_attack', paramValues.vca1_attack ?? 0.002)}
              onChange={(v) => handleChange('vca1_attack', getNormalized('vca1_attack', v))}
            />
            <SynthKnob
              label="DEC"
              min={0.001}
              max={5}
              value={getDenormalized('vca1_decay', paramValues.vca1_decay ?? 0.1)}
              onChange={(v) => handleChange('vca1_decay', getNormalized('vca1_decay', v))}
            />
          </div>
        </div>

        {/* Sequencer 1 */}
        <div className="module seq-module">
          <div className="module-title">SEQUENCER</div>
          <div className="seq-steps-row">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`seq-step-cell ${seqState.seq1Step === i && isRunning && seq1Enabled ? 'active' : ''}`}>
                <span className="step-indicator">{i + 1}</span>
                <SynthKnob
                  label=""
                  min={-24}
                  max={24}
                  step={1}
                  value={getDenormalized(`seq1_step${i + 1}`, paramValues[`seq1_step${i + 1}`] ?? 0.5)}
                  onChange={(v) => handleChange(`seq1_step${i + 1}`, getNormalized(`seq1_step${i + 1}`, v))}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Rhythms 1 & 2 */}
        <div className="module rhythm-module">
          <div className="module-title">RHYTHM</div>
          <div className="rhythm-pair">
            <div className="rhythm-unit">
              <SynthLED label="1" active={seqState.rhythm1Active && isRunning} color="green" />
              <SynthKnob
                label=""
                min={0}
                max={10}
                step={1}
                value={getDenormalized('rhythm1_div', paramValues.rhythm1_div ?? 0.4)}
                onChange={(v) => handleChange('rhythm1_div', getNormalized('rhythm1_div', v))}
                options={RHYTHM_LABELS}
              />
            </div>
            <div className="rhythm-unit">
              <SynthLED label="2" active={seqState.rhythm2Active && isRunning} color="green" />
              <SynthKnob
                label=""
                min={0}
                max={10}
                step={1}
                value={getDenormalized('rhythm2_div', paramValues.rhythm2_div ?? 0.5)}
                onChange={(v) => handleChange('rhythm2_div', getNormalized('rhythm2_div', v))}
                options={RHYTHM_LABELS}
              />
            </div>
          </div>
        </div>
      </section>

      {/* VOICE 2 ROW */}
      <section className="voice-row">
        <div className="voice-label-box">
          <span className="voice-number">2</span>
          <SynthToggle
            label="SEQ"
            value={seq2Enabled}
            onChange={(v) => handleChange('seq2_enable', v ? 1 : 0)}
            variant="indicator"
          />
        </div>

        {/* VCO 2 */}
        <div className="module vco-module">
          <div className="module-title">VCO</div>
          <div className="module-knobs">
            <SynthKnob
              label="FREQ"
              min={20}
              max={2000}
              value={getDenormalized('osc2_freq', paramValues.osc2_freq ?? 0.1)}
              onChange={(v) => handleChange('osc2_freq', getNormalized('osc2_freq', v))}
            />
            <SynthKnob
              label="WAVE"
              min={0}
              max={3}
              step={1}
              value={getDenormalized('osc2_wave', paramValues.osc2_wave ?? 0)}
              onChange={(v) => handleChange('osc2_wave', getNormalized('osc2_wave', v))}
              options={WAVEFORM_OPTIONS}
            />
            <SynthKnob
              label="LVL"
              min={0}
              max={1}
              value={getDenormalized('osc2_level', paramValues.osc2_level ?? 0.8)}
              onChange={(v) => handleChange('osc2_level', getNormalized('osc2_level', v))}
            />
          </div>
          <div className="sub-knobs">
            <div className="sub-pair">
              <span className="sub-lbl">A</span>
              <SynthKnob
                label=""
                min={1}
                max={16}
                step={1}
                value={getDenormalized('sub2a_div', paramValues.sub2a_div ?? 0.1875)}
                onChange={(v) => handleChange('sub2a_div', getNormalized('sub2a_div', v))}
                options={DIVISION_OPTIONS}
              />
              <SynthKnob
                label=""
                min={0}
                max={1}
                value={getDenormalized('sub2a_level', paramValues.sub2a_level ?? 0.5)}
                onChange={(v) => handleChange('sub2a_level', getNormalized('sub2a_level', v))}
              />
            </div>
            <div className="sub-pair">
              <span className="sub-lbl">B</span>
              <SynthKnob
                label=""
                min={1}
                max={16}
                step={1}
                value={getDenormalized('sub2b_div', paramValues.sub2b_div ?? 0.25)}
                onChange={(v) => handleChange('sub2b_div', getNormalized('sub2b_div', v))}
                options={DIVISION_OPTIONS}
              />
              <SynthKnob
                label=""
                min={0}
                max={1}
                value={getDenormalized('sub2b_level', paramValues.sub2b_level ?? 0.5)}
                onChange={(v) => handleChange('sub2b_level', getNormalized('sub2b_level', v))}
              />
            </div>
          </div>
        </div>

        {/* Filter 2 */}
        <div className="module filter-module">
          <div className="module-title">FILTER</div>
          <div className="module-knobs">
            <SynthKnob
              label="CUT"
              min={20}
              max={20000}
              value={getDenormalized('filter2_cutoff', paramValues.filter2_cutoff ?? 0.1)}
              onChange={(v) => handleChange('filter2_cutoff', getNormalized('filter2_cutoff', v))}
            />
            <SynthKnob
              label="RES"
              min={0}
              max={1}
              value={getDenormalized('filter2_reso', paramValues.filter2_reso ?? 0.3)}
              onChange={(v) => handleChange('filter2_reso', getNormalized('filter2_reso', v))}
            />
            <SynthKnob
              label="EG"
              min={-1}
              max={1}
              value={getDenormalized('filter2_env_amt', paramValues.filter2_env_amt ?? 0.75)}
              onChange={(v) => handleChange('filter2_env_amt', getNormalized('filter2_env_amt', v))}
            />
          </div>
        </div>

        {/* VCF2 EG */}
        <div className="module eg-module">
          <div className="module-title">VCF EG</div>
          <div className="module-knobs">
            <SynthKnob
              label="ATK"
              min={0.001}
              max={5}
              value={getDenormalized('vcf2_attack', paramValues.vcf2_attack ?? 0.002)}
              onChange={(v) => handleChange('vcf2_attack', getNormalized('vcf2_attack', v))}
            />
            <SynthKnob
              label="DEC"
              min={0.001}
              max={5}
              value={getDenormalized('vcf2_decay', paramValues.vcf2_decay ?? 0.1)}
              onChange={(v) => handleChange('vcf2_decay', getNormalized('vcf2_decay', v))}
            />
          </div>
        </div>

        {/* VCA2 EG */}
        <div className="module eg-module">
          <div className="module-title">VCA EG</div>
          <div className="module-knobs">
            <SynthKnob
              label="ATK"
              min={0.001}
              max={5}
              value={getDenormalized('vca2_attack', paramValues.vca2_attack ?? 0.002)}
              onChange={(v) => handleChange('vca2_attack', getNormalized('vca2_attack', v))}
            />
            <SynthKnob
              label="DEC"
              min={0.001}
              max={5}
              value={getDenormalized('vca2_decay', paramValues.vca2_decay ?? 0.1)}
              onChange={(v) => handleChange('vca2_decay', getNormalized('vca2_decay', v))}
            />
          </div>
        </div>

        {/* Sequencer 2 */}
        <div className="module seq-module">
          <div className="module-title">SEQUENCER</div>
          <div className="seq-steps-row">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`seq-step-cell ${seqState.seq2Step === i && isRunning && seq2Enabled ? 'active' : ''}`}>
                <span className="step-indicator">{i + 1}</span>
                <SynthKnob
                  label=""
                  min={-24}
                  max={24}
                  step={1}
                  value={getDenormalized(`seq2_step${i + 1}`, paramValues[`seq2_step${i + 1}`] ?? 0.5)}
                  onChange={(v) => handleChange(`seq2_step${i + 1}`, getNormalized(`seq2_step${i + 1}`, v))}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Rhythms 3 & 4 */}
        <div className="module rhythm-module">
          <div className="module-title">RHYTHM</div>
          <div className="rhythm-pair">
            <div className="rhythm-unit">
              <SynthLED label="3" active={seqState.rhythm3Active && isRunning} color="green" />
              <SynthKnob
                label=""
                min={0}
                max={10}
                step={1}
                value={getDenormalized('rhythm3_div', paramValues.rhythm3_div ?? 0.4)}
                onChange={(v) => handleChange('rhythm3_div', getNormalized('rhythm3_div', v))}
                options={RHYTHM_LABELS}
              />
            </div>
            <div className="rhythm-unit">
              <SynthLED label="4" active={seqState.rhythm4Active && isRunning} color="green" />
              <SynthKnob
                label=""
                min={0}
                max={10}
                step={1}
                value={getDenormalized('rhythm4_div', paramValues.rhythm4_div ?? 0.5)}
                onChange={(v) => handleChange('rhythm4_div', getNormalized('rhythm4_div', v))}
                options={RHYTHM_LABELS}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default App;
