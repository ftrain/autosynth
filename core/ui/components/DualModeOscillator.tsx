/**
 * @file DualModeOscillator.tsx
 * @brief Dual-mode oscillator UI component (Square/Sawtooth with PWM)
 *
 * @description
 * A comprehensive oscillator control panel supporting both Square/PWM and Sawtooth
 * waveforms. Designed for use in analog-style synthesizers with full parameter control.
 *
 * ## Use Cases
 * - **Lead Synth**: Square wave for punchy, cutting leads; saw for bright, brassy leads
 * - **Bass Patches**: Square for deep sub bass; saw for growling, aggressive bass
 * - **Pad Sounds**: Detuned oscillators with PWM for rich, evolving pads
 * - **Brass Emulation**: Sawtooth with filter envelope for realistic brass
 * - **FM Synthesis**: Use as carrier or modulator in FM patches
 * - **PWM Effects**: Pulse width modulation for chorus-like thickness
 *
 * ## Parameters
 * - **Waveform**: Toggle between Square (0) and Sawtooth (1)
 * - **Level**: Oscillator output volume (0-100%)
 * - **Octave**: Coarse tuning in octaves (-4 to +4)
 * - **Pulse Width**: Duty cycle for square wave (5-95%)
 * - **PWM Amount**: Pulse width modulation depth
 * - **Fine Tune**: Fine pitch adjustment in semitones (-12 to +12)
 *
 * ## Multiple Oscillators
 * Use the `prefix` prop to create multiple independent oscillators:
 * - `prefix="osc1"` creates parameters like `osc1_level`, `osc1_waveform`
 * - `prefix="osc2"` creates parameters like `osc2_level`, `osc2_waveform`
 *
 * @example
 * ```tsx
 * // Single oscillator
 * <DualModeOscillator
 *   paramValues={params}
 *   onChange={(id, value) => setParams(p => ({...p, [id]: value}))}
 * />
 *
 * // Dual oscillator setup
 * <DualModeOscillator prefix="osc1" label="OSC 1" paramValues={params} onChange={handleChange} />
 * <DualModeOscillator prefix="osc2" label="OSC 2" paramValues={params} onChange={handleChange} />
 * ```
 */

import { SynthKnob, SynthToggle } from './VintageSynthUI';
import { SynthRow } from './SynthRow';

interface DualModeOscillatorProps {
  paramValues: Record<string, number>;
  onChange: (paramId: string, value: number) => void;
  /** Optional parameter prefix for multiple oscillators */
  prefix?: string;
  /** Display label */
  label?: string;
}

export function DualModeOscillator({
  paramValues,
  onChange,
  prefix = 'osc',
  label = 'OSCILLATOR'
}: DualModeOscillatorProps) {
  // Parameter ID helper
  const p = (name: string) => `${prefix}_${name}`;

  // Get parameter values with defaults
  const getParam = (name: string, defaultValue: number) => {
    const value = paramValues[p(name)];
    return value !== undefined ? value : defaultValue;
  };

  // Check if in square mode (waveform = 0)
  const isSquareMode = getParam('waveform', 0) < 0.5;

  // Octave normalization (maps -4 to 4 -> 0 to 1)
  const normalizeOctave = (octave: number) => (octave + 4) / 8;
  const denormalizeOctave = (normalized: number) => Math.round(normalized * 8 - 4);

  // Pulse width normalization (0.05-0.95 -> 0-1 for display)
  const normalizePW = (pw: number) => (pw - 0.05) / 0.9;
  const denormalizePW = (normalized: number) => normalized * 0.9 + 0.05;

  // Fine tune normalization (-12 to +12 semitones -> 0-1)
  const normalizeFineTune = (semitones: number) => (semitones + 12) / 24;
  const denormalizeFineTune = (normalized: number) => normalized * 24 - 12;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--synth-space-md)',
      alignItems: 'center',
      padding: 'var(--synth-space-md)',
      background: 'var(--synth-surface-elevated)',
      borderRadius: 'var(--synth-radius-md)',
      border: '1px solid var(--synth-border-subtle)',
    }}>
      {/* Section Label */}
      <div style={{
        color: 'var(--synth-accent-primary)',
        fontSize: 'var(--synth-font-size-base)',
        fontWeight: 'bold',
        letterSpacing: '0.1em'
      }}>
        {label}
      </div>

      {/* Row 1: Waveform selector, Level, and Octave */}
      <SynthRow gap="var(--synth-space-lg)">
        <SynthToggle
          label="SAW"
          value={!isSquareMode}
          onChange={(v: boolean) => onChange(p('waveform'), v ? 1 : 0)}
          variant="toggle"
        />

        <SynthKnob
          label="LEVEL"
          value={getParam('level', 0.7)}
          onChange={(v: number) => onChange(p('level'), v)}
          min={0}
          max={1}
        />

        <SynthKnob
          label="OCTAVE"
          value={denormalizeOctave(getParam('octave', 0.5))}
          onChange={(v: number) => onChange(p('octave'), normalizeOctave(v))}
          min={-4}
          max={4}
          step={1}
          options={["128'", "64'", "32'", "16'", "8'", "4'", "2'", "1'", "1/2'"]}
        />
      </SynthRow>

      {/* Row 2: PWM controls and Fine tune */}
      <SynthRow gap="var(--synth-space-lg)">
        <div style={{
          opacity: isSquareMode ? 1 : 0.3,
          pointerEvents: isSquareMode ? 'auto' : 'none',
          transition: 'opacity 0.2s'
        }}>
          <SynthKnob
            label="WIDTH"
            value={normalizePW(getParam('pulse_width', 0.5))}
            onChange={(v: number) => onChange(p('pulse_width'), denormalizePW(v))}
            min={0}
            max={1}
          />
        </div>

        <div style={{
          opacity: isSquareMode ? 1 : 0.3,
          pointerEvents: isSquareMode ? 'auto' : 'none',
          transition: 'opacity 0.2s'
        }}>
          <SynthKnob
            label="PWM"
            value={getParam('pwm_amount', 0)}
            onChange={(v: number) => onChange(p('pwm_amount'), v)}
            min={0}
            max={1}
          />
        </div>

        <SynthKnob
          label="FINE"
          value={normalizeFineTune(getParam('fine_tune', 0))}
          onChange={(v: number) => onChange(p('fine_tune'), denormalizeFineTune(v))}
          min={0}
          max={1}
        />
      </SynthRow>

      {/* Status indicator */}
      <div style={{
        color: 'var(--synth-text-tertiary)',
        fontSize: '10px',
        fontFamily: 'monospace',
        display: 'flex',
        gap: 'var(--synth-space-md)',
      }}>
        <span>{isSquareMode ? 'SQUARE' : 'SAW'}</span>
        {isSquareMode && (
          <span>PW: {Math.round(getParam('pulse_width', 0.5) * 100)}%</span>
        )}
      </div>
    </div>
  );
}

export default DualModeOscillator;
