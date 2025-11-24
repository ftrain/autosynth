/**
 * DualModeOscillator - Modular Audio Component
 *
 * A dual-waveform oscillator (Square/Sawtooth) with PWM support.
 *
 * ## Signal Flow
 *
 * INPUTS (CV):
 *   - pitch: frequency in Hz
 *   - pwm: pulse width modulation CV (0-1), only affects square wave
 *   - gate: trigger for envelope/note (0 or 1)
 *
 * OUTPUTS:
 *   - audio: oscillator output (-1 to +1)
 *
 * PARAMETERS:
 *   - waveform: 0=Square, 1=Sawtooth
 *   - level: output amplitude (0-1)
 *   - octave: octave offset (-4 to +4)
 *   - pulseWidth: base pulse width for square wave (0.05-0.95)
 *   - pwmAmount: how much PWM CV affects pulse width (0-1)
 *   - fineTune: pitch offset in semitones (-12 to +12)
 *
 * ## Usage (React)
 *
 * ```tsx
 * import { UI, WebAudio, parameters, parameterIds } from './components/audio/DualModeOscillator';
 *
 * // Create processor
 * const osc = new WebAudio();
 * await osc.init(audioContext);
 *
 * // Render UI
 * <UI paramValues={params} onChange={handleChange} cvInputs={{ pitch: 440 }} />
 * ```
 *
 * ## Usage (C++)
 *
 * ```cpp
 * #include "DualModeOscillatorProcessor.h"
 *
 * DualModeOscillator::Processor osc;
 * osc.prepare(44100.0, 512);
 *
 * DualModeOscillator::Inputs in;
 * in.pitch = 440.0f;
 * in.pwm = 0.5f;
 * in.gate = 1.0f;
 *
 * auto out = osc.process(in);
 * float sample = out.audio;
 * ```
 *
 * @module DualModeOscillator
 */

// React UI Component
export { DualModeOscillator as UI } from './UI';
export type { DualModeOscillatorProps as UIProps } from './UI';

// Web Audio Processor (for testing/web use)
export { DualModeOscillatorWorklet as WebAudio } from './WebAudio';

// Parameter definitions
export { parameters, parameterIds } from './parameters';

// Types
export type {
  DualModeOscillatorInputs,
  DualModeOscillatorOutputs,
  DualModeOscillatorParams
} from './types';

// Default values
export { defaultParams } from './types';
