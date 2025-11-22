/**
 * @file ComponentShowcase.tsx
 * @brief Comprehensive showcase of ALL synth components
 *
 * This demonstrates every component in the library:
 * - VintageSynthUI components (SynthKnob, SynthToggle, SynthMultiSwitch)
 * - SynthSlider
 * - SynthADSR
 * - SynthLFO
 * - Sequencer
 * - ModMatrix
 * - Oscilloscope
 * - SynthLED
 * - SynthLCD
 * - SynthVUMeter
 * - TransportControls
 * - PresetBrowser
 * - FMSynthUI
 * - SpeechSynthUI
 */

import React, { useState } from 'react';
import { SynthComponentProps } from '../types/parameters';
import { SynthLayout } from '../layout/SynthLayout';
import { ParameterGroup } from '../layout/ParameterGroup';
import { Row } from '../layout/Row';
import { Column } from '../layout/Column';

// Import new TypeScript component
import { SynthKnob } from '../components/SynthKnob';

// Import existing JSX components
// @ts-ignore - JSX components without type declarations
import { SynthToggle } from '../components/VintageSynthUI';
// @ts-ignore
import { SynthSlider } from '../components/SynthSlider';
// @ts-ignore
import { SynthADSR } from '../components/SynthADSR';
// @ts-ignore
import { SynthDAHDSR } from '../components/SynthDAHDSR';
// @ts-ignore
import { SynthLFO } from '../components/SynthLFO';
// @ts-ignore
import Oscilloscope from '../components/Oscilloscope';
// @ts-ignore
import { SynthLED } from '../components/SynthLED';
// @ts-ignore
import { SynthLCD } from '../components/SynthLCD';
// @ts-ignore
import { SynthVUMeter } from '../components/SynthVUMeter';
// @ts-ignore
import { TransportControls } from '../components/TransportControls';

import { parameters } from '../parameters';
import { denormalize, normalize } from '../types/parameters';

/**
 * Complete Component Showcase
 */
export const ComponentShowcase: React.FC<SynthComponentProps> = ({
  paramValues,
  onChange,
  parameters: customParameters = parameters,
}) => {
  // Local state for demo
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Generate some demo audio data for oscilloscope
  const [audioData] = useState(() => {
    const data = [];
    for (let i = 0; i < 256; i++) {
      data.push(Math.sin(i * 0.1) * 0.8);
    }
    return data;
  });

  // Helper to create knob props (unused but kept for future use)
  // @ts-expect-error - Unused function kept for future use
  const knobProps = (paramId: string) => {
    const param = customParameters[paramId];
    if (!param) return null;

    const normalizedValue = paramValues[paramId] ?? 0.5;
    const actualValue = denormalize(paramId, normalizedValue, customParameters);

    return {
      label: param.name.toUpperCase(),
      min: param.min,
      max: param.max,
      value: actualValue,
      onChange: (v: number) => onChange(paramId, normalize(paramId, v, customParameters)),
      defaultValue: param.default,
    };
  };

  return (
    <SynthLayout>
      {/* Header */}
      <div
        style={{
          marginBottom: 'var(--synth-space-2xl)',
          textAlign: 'center',
          borderBottom: '2px solid var(--synth-border-color)',
          paddingBottom: 'var(--synth-space-lg)',
        }}
      >
        <h1
          style={{
            fontSize: 'var(--synth-font-size-3xl)',
            color: 'var(--synth-text-primary)',
            letterSpacing: 'var(--synth-letter-spacing-wider)',
            fontWeight: 'var(--synth-font-weight-bold)',
            textShadow: '0 0 12px var(--synth-accent-glow)',
            margin: 0,
          }}
        >
          COMPONENT SHOWCASE
        </h1>
        <p
          style={{
            color: 'var(--synth-text-tertiary)',
            fontSize: 'var(--synth-font-size-sm)',
            marginTop: 'var(--synth-space-sm)',
          }}
        >
          Complete demonstration of all synth UI components
        </p>
      </div>

      {/* Section 1: Basic Controls - Knobs, Toggles, Sliders, Transport */}
      <ParameterGroup title="BASIC CONTROLS">
        <Row gap={16} wrap>
          <SynthKnob
            label="KNOB"
            min={0}
            max={100}
            value={(paramValues['master_volume'] ?? 0.8) * 100}
            onChange={(v) => onChange('master_volume', v / 100)}
          />

          <SynthKnob
            label="STEPPED KNOB"
            min={0}
            max={4}
            step={1}
            value={Math.round((paramValues['filter_type'] ?? 0) * 4)}
            onChange={(v: number) => onChange('filter_type', v / 4)}
            options={['OFF', 'LOW', 'MID', 'HIGH', 'MAX']}
          />

          <SynthToggle
            label="TOGGLE"
            value={paramValues['lead_mute'] !== undefined ? paramValues['lead_mute'] < 0.5 : true}
            onChange={(val: boolean) => onChange('lead_mute', val ? 0 : 1)}
          />

          <SynthSlider
            label="VERTICAL"
            min={0}
            max={1}
            value={paramValues['master_volume'] ?? 0.8}
            onChange={(v: number) => onChange('master_volume', v)}
            orientation="vertical"
          />

          <SynthSlider
            label="HORIZONTAL"
            min={0}
            max={1}
            value={paramValues['delay_mix'] ?? 0.3}
            onChange={(v: number) => onChange('delay_mix', v)}
            orientation="horizontal"
          />

          <TransportControls
            isPlaying={isPlaying}
            isRecording={isRecording}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onStop={() => { setIsPlaying(false); setIsRecording(false); }}
            onRecord={() => setIsRecording(!isRecording)}
          />
        </Row>
      </ParameterGroup>

      {/* Section 2: Envelopes and LFO */}
      <ParameterGroup title="ENVELOPES & LFO">
        <Row gap={16} wrap>
          <SynthADSR
            label="ADSR"
            attack={denormalize('env_attack', paramValues['env_attack'] ?? 0.5, customParameters) * 1000}
            decay={denormalize('env_decay', paramValues['env_decay'] ?? 0.5, customParameters) * 1000}
            sustain={(paramValues['env_sustain'] ?? 0.7) * 100}
            release={denormalize('env_release', paramValues['env_release'] ?? 0.5, customParameters) * 1000}
            onAttackChange={(v: number) => onChange('env_attack', normalize('env_attack', v / 1000, customParameters))}
            onDecayChange={(v: number) => onChange('env_decay', normalize('env_decay', v / 1000, customParameters))}
            onSustainChange={(v: number) => onChange('env_sustain', v / 100)}
            onReleaseChange={(v: number) => onChange('env_release', normalize('env_release', v / 1000, customParameters))}
          />

          <SynthDAHDSR
            label="DAHDSR"
            defaultDelay={50}
            defaultAttack={150}
            defaultHold={100}
            defaultDecay={300}
            defaultSustain={60}
            defaultRelease={400}
          />

          <SynthLFO
            label="LFO"
            waveform={Math.round((paramValues['lfo_waveform'] ?? 0) * 4)}
            rate={denormalize('lfo_rate', paramValues['lfo_rate'] ?? 0.5, customParameters)}
            onWaveformChange={(v: number) => onChange('lfo_waveform', v / 4)}
            onRateChange={(v: number) => onChange('lfo_rate', normalize('lfo_rate', v, customParameters))}
          />
        </Row>
      </ParameterGroup>

      {/* Section 3: Visualization */}
      <ParameterGroup title="VISUALIZATION">
        <Row gap={16} wrap>
          <Oscilloscope
            label="SCOPE"
            width={192}
            height={64}
            audioData={audioData}
            color="#4CAF50"
            showGrid={true}
            showPeaks={true}
          />

          <SynthVUMeter
            label="VU"
            level={(paramValues['master_volume'] ?? 0.8) * 100}
            peakHold={true}
          />
        </Row>
      </ParameterGroup>

      {/* Section 7: Indicators & Displays */}
      <ParameterGroup title="INDICATORS & DISPLAYS">
        <Row gap={16} wrap>
          <Column gap={8} align="center">
            <div style={{ color: 'var(--synth-text-secondary)', fontSize: 'var(--synth-font-size-sm)' }}>
              LED INDICATORS
            </div>
            <Row gap={8}>
              <SynthLED label="PWR" isOn={true} color="green" />
              <SynthLED label="CLK" isOn={isPlaying} color="red" />
              <SynthLED label="REC" isOn={isRecording} color="red" />
              <SynthLED label="MIDI" isOn={false} color="blue" />
            </Row>
          </Column>

          <Column gap={8}>
            <div style={{ color: 'var(--synth-text-secondary)', fontSize: 'var(--synth-font-size-sm)' }}>
              LCD DISPLAY
            </div>
            <SynthLCD text={`RATE: ${(denormalize('lfo_rate', paramValues['lfo_rate'] ?? 0.5, customParameters)).toFixed(2)} Hz`} lines={1} />
          </Column>
        </Row>
      </ParameterGroup>

      {/* Footer */}
      <div
        style={{
          marginTop: 'var(--synth-space-3xl)',
          padding: 'var(--synth-space-lg)',
          borderTop: '1px solid var(--synth-border-color)',
          color: 'var(--synth-text-tertiary)',
          fontSize: 'var(--synth-font-size-xs)',
          textAlign: 'center',
        }}
      >
        <p>
          <strong>Core Components:</strong> SynthKnob • SynthToggle • SynthMultiSwitch • SynthSlider • SynthADSR • SynthDAHDSR • SynthLFO • Oscilloscope • SynthVUMeter • SynthLED • SynthLCD • TransportControls
        </p>
        <p style={{ marginTop: 'var(--synth-space-sm)' }}>
          TypeScript + React • Fully Themeable • Responsive • Design Token System
        </p>
      </div>
    </SynthLayout>
  );
};

export default ComponentShowcase;
