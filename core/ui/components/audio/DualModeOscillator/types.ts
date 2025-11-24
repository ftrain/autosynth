/**
 * Type definitions for DualModeOscillator module
 */

/** CV/Audio inputs to the oscillator */
export interface DualModeOscillatorInputs {
  /** Pitch input - frequency in Hz */
  pitch: number;
  /** PWM modulation CV (0-1), affects square wave pulse width */
  pwm: number;
  /** Gate signal (0 or 1) for note triggering */
  gate: number;
}

/** Audio outputs from the oscillator */
export interface DualModeOscillatorOutputs {
  /** Main audio output (-1 to +1) */
  audio: number;
}

/** User-controllable parameters */
export interface DualModeOscillatorParams {
  /** Waveform type: 0=Square, 1=Sawtooth */
  waveform: number;
  /** Output level (0-1) */
  level: number;
  /** Octave offset (-4 to +4) */
  octave: number;
  /** Base pulse width for square wave (0.05-0.95) */
  pulseWidth: number;
  /** PWM modulation depth (0-1) */
  pwmAmount: number;
  /** Fine tune in semitones (-12 to +12) */
  fineTune: number;
}

/** Default parameter values */
export const defaultParams: DualModeOscillatorParams = {
  waveform: 0,
  level: 0.7,
  octave: 0,
  pulseWidth: 0.5,
  pwmAmount: 0,
  fineTune: 0,
};
