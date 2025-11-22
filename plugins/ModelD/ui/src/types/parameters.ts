/**
 * @file parameters.ts
 * @brief Parameter definitions for the Model D synthesizer
 *
 * This file defines all parameters exposed by the plugin.
 * Parameters are normalized to 0-1 range for UI communication.
 *
 * These MUST match the parameters defined in PluginProcessor.cpp
 */

import { ParameterMap, ParameterDefinition } from '../hooks/useParameters';

/**
 * Parameter categories for UI organization
 */
export enum ParameterCategory {
  OSCILLATOR_1 = 'oscillator1',
  OSCILLATOR_2 = 'oscillator2',
  OSCILLATOR_3 = 'oscillator3',
  MIXER = 'mixer',
  FILTER = 'filter',
  AMP_ENVELOPE = 'amp_envelope',
  FILTER_ENVELOPE = 'filter_envelope',
  MASTER = 'master',
}

/**
 * All parameter definitions
 *
 * IMPORTANT: These must match the parameters in PluginProcessor.cpp
 */
export const PARAMETER_DEFINITIONS: ParameterMap = {
  // =========================================================================
  // OSCILLATOR 1 PARAMETERS
  // =========================================================================

  osc1_waveform: {
    id: 'osc1_waveform',
    name: 'Osc 1 Waveform',
    min: 0,
    max: 3,
    default: 0,
    step: 1,
  },

  osc1_octave: {
    id: 'osc1_octave',
    name: 'Osc 1 Octave',
    min: -2,
    max: 2,
    default: 0,
    step: 1,
  },

  osc1_level: {
    id: 'osc1_level',
    name: 'Osc 1 Level',
    min: 0,
    max: 1,
    default: 1.0,
  },

  // =========================================================================
  // OSCILLATOR 2 PARAMETERS
  // =========================================================================

  osc2_waveform: {
    id: 'osc2_waveform',
    name: 'Osc 2 Waveform',
    min: 0,
    max: 3,
    default: 0,
    step: 1,
  },

  osc2_octave: {
    id: 'osc2_octave',
    name: 'Osc 2 Octave',
    min: -2,
    max: 2,
    default: 0,
    step: 1,
  },

  osc2_detune: {
    id: 'osc2_detune',
    name: 'Osc 2 Detune',
    min: -50,
    max: 50,
    default: 0,
    unit: 'cents',
  },

  osc2_level: {
    id: 'osc2_level',
    name: 'Osc 2 Level',
    min: 0,
    max: 1,
    default: 1.0,
  },

  osc2_sync: {
    id: 'osc2_sync',
    name: 'Osc 2 Sync',
    min: 0,
    max: 1,
    default: 0,
    step: 1,
  },

  // =========================================================================
  // OSCILLATOR 3 PARAMETERS
  // =========================================================================

  osc3_waveform: {
    id: 'osc3_waveform',
    name: 'Osc 3 Waveform',
    min: 0,
    max: 3,
    default: 0,
    step: 1,
  },

  osc3_octave: {
    id: 'osc3_octave',
    name: 'Osc 3 Octave',
    min: -2,
    max: 2,
    default: 0,
    step: 1,
  },

  osc3_detune: {
    id: 'osc3_detune',
    name: 'Osc 3 Detune',
    min: -50,
    max: 50,
    default: 0,
    unit: 'cents',
  },

  osc3_level: {
    id: 'osc3_level',
    name: 'Osc 3 Level',
    min: 0,
    max: 1,
    default: 0.0,  // Off by default
  },

  // =========================================================================
  // NOISE
  // =========================================================================

  noise_level: {
    id: 'noise_level',
    name: 'Noise Level',
    min: 0,
    max: 1,
    default: 0.0,
  },

  // =========================================================================
  // FILTER PARAMETERS
  // =========================================================================

  filter_cutoff: {
    id: 'filter_cutoff',
    name: 'Filter Cutoff',
    min: 20,
    max: 20000,
    default: 5000,
    unit: 'Hz',
  },

  filter_reso: {
    id: 'filter_reso',
    name: 'Filter Resonance',
    min: 0,
    max: 1,
    default: 0,
  },

  filter_env_amount: {
    id: 'filter_env_amount',
    name: 'Filter Env Amount',
    min: -1,
    max: 1,
    default: 0.5,
  },

  filter_kbd_track: {
    id: 'filter_kbd_track',
    name: 'Filter Keyboard Tracking',
    min: 0,
    max: 1,
    default: 0,
  },

  // =========================================================================
  // AMPLITUDE ENVELOPE
  // =========================================================================

  amp_attack: {
    id: 'amp_attack',
    name: 'Amp Attack',
    min: 0.001,
    max: 10,
    default: 0.01,
    unit: 's',
  },

  amp_decay: {
    id: 'amp_decay',
    name: 'Amp Decay',
    min: 0.001,
    max: 10,
    default: 0.1,
    unit: 's',
  },

  amp_sustain: {
    id: 'amp_sustain',
    name: 'Amp Sustain',
    min: 0,
    max: 1,
    default: 0.7,
  },

  amp_release: {
    id: 'amp_release',
    name: 'Amp Release',
    min: 0.001,
    max: 10,
    default: 0.3,
    unit: 's',
  },

  // =========================================================================
  // FILTER ENVELOPE
  // =========================================================================

  filter_attack: {
    id: 'filter_attack',
    name: 'Filter Attack',
    min: 0.001,
    max: 10,
    default: 0.01,
    unit: 's',
  },

  filter_decay: {
    id: 'filter_decay',
    name: 'Filter Decay',
    min: 0.001,
    max: 10,
    default: 0.2,
    unit: 's',
  },

  filter_sustain: {
    id: 'filter_sustain',
    name: 'Filter Sustain',
    min: 0,
    max: 1,
    default: 0.5,
  },

  filter_release: {
    id: 'filter_release',
    name: 'Filter Release',
    min: 0.001,
    max: 10,
    default: 0.3,
    unit: 's',
  },

  // =========================================================================
  // MASTER
  // =========================================================================

  master_volume: {
    id: 'master_volume',
    name: 'Master Volume',
    min: -60,
    max: 0,
    default: -6,
    unit: 'dB',
  },
};

/**
 * Waveform labels for UI display
 */
export const WAVEFORM_OPTIONS = [
  { value: 0, label: 'Saw' },
  { value: 1, label: 'Triangle' },
  { value: 2, label: 'Pulse' },
  { value: 3, label: 'Sine' },
];

/**
 * Octave labels for UI display
 */
export const OCTAVE_OPTIONS = [
  { value: -2, label: "16'" },
  { value: -1, label: "8'" },
  { value: 0, label: "4'" },
  { value: 1, label: "2'" },
  { value: 2, label: "1'" },
];

/**
 * Get parameters by category
 */
export function getParametersByCategory(category: ParameterCategory): ParameterDefinition[] {
  const categoryMap: Record<ParameterCategory, string[]> = {
    [ParameterCategory.OSCILLATOR_1]: ['osc1_waveform', 'osc1_octave', 'osc1_level'],
    [ParameterCategory.OSCILLATOR_2]: ['osc2_waveform', 'osc2_octave', 'osc2_detune', 'osc2_level', 'osc2_sync'],
    [ParameterCategory.OSCILLATOR_3]: ['osc3_waveform', 'osc3_octave', 'osc3_detune', 'osc3_level'],
    [ParameterCategory.MIXER]: ['osc1_level', 'osc2_level', 'osc3_level', 'noise_level'],
    [ParameterCategory.FILTER]: ['filter_cutoff', 'filter_reso', 'filter_env_amount', 'filter_kbd_track'],
    [ParameterCategory.AMP_ENVELOPE]: ['amp_attack', 'amp_decay', 'amp_sustain', 'amp_release'],
    [ParameterCategory.FILTER_ENVELOPE]: ['filter_attack', 'filter_decay', 'filter_sustain', 'filter_release'],
    [ParameterCategory.MASTER]: ['master_volume'],
  };

  return categoryMap[category]
    .map((id) => PARAMETER_DEFINITIONS[id])
    .filter((p): p is ParameterDefinition => p !== undefined);
}

/**
 * Get all parameter IDs
 */
export function getAllParameterIds(): string[] {
  return Object.keys(PARAMETER_DEFINITIONS);
}

/**
 * Format parameter value for display
 */
export function formatParameterValue(paramId: string, normalizedValue: number): string {
  const param = PARAMETER_DEFINITIONS[paramId];
  if (!param) return normalizedValue.toFixed(2);

  // Denormalize
  const value = param.min + normalizedValue * (param.max - param.min);

  // Format based on unit
  if (param.unit === 'Hz') {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(2)} kHz`;
    }
    return `${Math.round(value)} Hz`;
  }

  if (param.unit === 's') {
    if (value < 0.01) {
      return `${(value * 1000).toFixed(1)} ms`;
    }
    return `${value.toFixed(2)} s`;
  }

  if (param.unit === 'dB') {
    return `${value.toFixed(1)} dB`;
  }

  if (param.unit === 'cents') {
    return `${value >= 0 ? '+' : ''}${Math.round(value)} cents`;
  }

  // Percentage
  if (param.max === 1 && param.min === 0) {
    return `${Math.round(value * 100)}%`;
  }

  // Integer step
  if (param.step && param.step >= 1) {
    return Math.round(value).toString();
  }

  return value.toFixed(2);
}
