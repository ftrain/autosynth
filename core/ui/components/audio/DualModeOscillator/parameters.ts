/**
 * Parameter definitions for DualModeOscillator
 * These are used by both React UI and JUCE backend
 */

import type { ParameterDefinition } from '../../../types/parameters';

/** Parameter IDs - use these as keys */
export const parameterIds = {
  waveform: 'osc_waveform',
  level: 'osc_level',
  octave: 'osc_octave',
  pulseWidth: 'osc_pulse_width',
  pwmAmount: 'osc_pwm_amount',
  fineTune: 'osc_fine_tune',
} as const;

/** Full parameter definitions with ranges and metadata */
export const parameters: Record<string, ParameterDefinition> = {
  [parameterIds.waveform]: {
    name: 'Waveform',
    min: 0,
    max: 1,
    default: 0,
    choices: ['Square', 'Sawtooth'],
  },
  [parameterIds.level]: {
    name: 'Level',
    min: 0,
    max: 1,
    default: 0.7,
  },
  [parameterIds.octave]: {
    name: 'Octave',
    min: -4,
    max: 4,
    default: 0,
    choices: ["128'", "64'", "32'", "16'", "8'", "4'", "2'", "1'", "1/2'"],
  },
  [parameterIds.pulseWidth]: {
    name: 'Pulse Width',
    min: 0.05,
    max: 0.95,
    default: 0.5,
  },
  [parameterIds.pwmAmount]: {
    name: 'PWM Amount',
    min: 0,
    max: 1,
    default: 0,
  },
  [parameterIds.fineTune]: {
    name: 'Fine Tune',
    min: -12,
    max: 12,
    default: 0,
  },
};
