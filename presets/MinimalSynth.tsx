/**
 * @file MinimalSynth.tsx
 * @brief Minimal performance synthesizer preset
 *
 * This demonstrates the new architecture:
 * - TypeScript with strict typing
 * - Layout primitives (Row, ParameterGroup, SynthLayout)
 * - Design token system (themeable)
 * - Migrated components (SynthKnob)
 * - Parameter management hooks
 */

import React from 'react';
import { SynthComponentProps } from '../types/parameters';
import { SynthLayout } from '../layout/SynthLayout';
import { ParameterGroup } from '../layout/ParameterGroup';
import { Row } from '../layout/Row';
import { SynthKnob } from '../components/SynthKnob';
import { parameters } from '../parameters';
import { denormalize, normalize } from '../types/parameters';

/**
 * Minimal Synth UI - Simple performance-focused layout
 *
 * @remarks
 * Demonstrates the complete new architecture:
 * - Pure TSX (no YAML)
 * - Type-safe parameters
 * - Themeable via design tokens
 * - Responsive layout
 * - Accessible components
 *
 * @example
 * ```tsx
 * import { MinimalSynth } from './presets/MinimalSynth';
 * import { useParameters } from './hooks/useParameters';
 * import { parameters } from './parameters';
 *
 * function App() {
 *   const { paramValues, handleChange } = useParameters({ parameters });
 *
 *   return (
 *     <MinimalSynth
 *       paramValues={paramValues}
 *       onChange={handleChange}
 *     />
 *   );
 * }
 * ```
 */
export const MinimalSynth: React.FC<SynthComponentProps> = ({
  paramValues,
  onChange,
  parameters: customParameters = parameters,
}) => {
  /**
   * Helper to create knob props
   * Handles normalization/denormalization automatically
   */
  const knobProps = (paramId: string) => {
    const param = customParameters[paramId];
    if (!param) {
      console.warn(`Parameter ${paramId} not found`);
      return null;
    }

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
          MINIMAL SYNTH
        </h1>
        <p
          style={{
            color: 'var(--synth-text-tertiary)',
            fontSize: 'var(--synth-font-size-sm)',
            marginTop: 'var(--synth-space-sm)',
          }}
        >
          Performance-focused interface • TypeScript • Themeable • Accessible
        </p>
      </div>

      {/* Tone Section */}
      <ParameterGroup title="TONE">
        <Row gap="var(--synth-space-lg)" wrap>
          <SynthKnob {...knobProps('saw_level')!} label="SAW" />
          <SynthKnob {...knobProps('pulse_level')!} label="PULSE" />
          <SynthKnob {...knobProps('noise_level')!} label="NOISE" />
          <SynthKnob {...knobProps('filter_cutoff')!} label="CUTOFF" />
          <SynthKnob {...knobProps('filter_resonance')!} label="RES" />
        </Row>
      </ParameterGroup>

      {/* Shape Section */}
      <ParameterGroup title="SHAPE">
        <Row gap="var(--synth-space-lg)" wrap>
          <SynthKnob {...knobProps('env_attack')!} label="ATK" />
          <SynthKnob {...knobProps('env_decay')!} label="DEC" />
          <SynthKnob {...knobProps('env_sustain')!} label="SUS" />
          <SynthKnob {...knobProps('env_release')!} label="REL" />
          <SynthKnob {...knobProps('lfo_rate')!} label="LFO" />
        </Row>
      </ParameterGroup>

      {/* Mix Section */}
      <ParameterGroup title="MIX">
        <Row gap="var(--synth-space-lg)" wrap>
          <SynthKnob {...knobProps('master_volume')!} label="LEVEL" />
          <SynthKnob {...knobProps('delay_time')!} label="DELAY" />
          <SynthKnob {...knobProps('reverb_size')!} label="REVERB" />
        </Row>
      </ParameterGroup>

      {/* Footer Info */}
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
          Built with TypeScript • Design Tokens • Accessible • Responsive
        </p>
        <p style={{ marginTop: 'var(--synth-space-xs)' }}>
          Double-click knobs to reset • Use arrow keys for keyboard control
        </p>
      </div>
    </SynthLayout>
  );
};

export default MinimalSynth;
