/**
 * @file parameters.ts
 * @brief Parameter definitions for Phoneme formant synthesizer
 *
 * These MUST match the parameters defined in PluginProcessor.cpp
 */

import { ParameterMap, ParameterDefinition } from '../hooks/useParameters';

/**
 * Parameter categories for UI organization
 */
export enum ParameterCategory {
  SOURCE = 'source',
  FORMANT = 'formant',
  VIBRATO = 'vibrato',
  VOWEL_LFO = 'vowel_lfo',
  ENVELOPE = 'envelope',
  MASTER = 'master',
}

/**
 * All parameter definitions
 */
export const PARAMETER_DEFINITIONS: ParameterMap = {
  // =========================================================================
  // SOURCE PARAMETERS
  // =========================================================================

  osc_waveform: {
    id: 'osc_waveform',
    name: 'Waveform',
    min: 0,
    max: 1,
    default: 0, // Saw
    step: 1,
  },

  osc_tune: {
    id: 'osc_tune',
    name: 'Tune',
    min: -24,
    max: 24,
    default: 0,
    step: 1,
    unit: 'st',
  },

  osc_pw: {
    id: 'osc_pw',
    name: 'Pulse Width',
    min: 0.05,
    max: 0.95,
    default: 0.5,
  },

  // =========================================================================
  // FORMANT PARAMETERS
  // =========================================================================

  vowel: {
    id: 'vowel',
    name: 'Vowel',
    min: 0,
    max: 4,
    default: 0, // A
    step: 1,
  },

  formant_shift: {
    id: 'formant_shift',
    name: 'Formant Shift',
    min: -12,
    max: 12,
    default: 0,
    step: 1,
    unit: 'st',
  },

  formant_spread: {
    id: 'formant_spread',
    name: 'Spread',
    min: 0.5,
    max: 2.0,
    default: 1.0,
  },

  // =========================================================================
  // VIBRATO PARAMETERS
  // =========================================================================

  vibrato_rate: {
    id: 'vibrato_rate',
    name: 'Vibrato Rate',
    min: 0.1,
    max: 10,
    default: 5.0,
    unit: 'Hz',
  },

  vibrato_depth: {
    id: 'vibrato_depth',
    name: 'Vibrato Depth',
    min: 0,
    max: 1,
    default: 0,
  },

  // =========================================================================
  // VOWEL LFO PARAMETERS
  // =========================================================================

  vowel_lfo_rate: {
    id: 'vowel_lfo_rate',
    name: 'Vowel LFO Rate',
    min: 0.01,
    max: 5,
    default: 0.5,
    unit: 'Hz',
  },

  vowel_lfo_depth: {
    id: 'vowel_lfo_depth',
    name: 'Vowel LFO Depth',
    min: 0,
    max: 1,
    default: 0,
  },

  // =========================================================================
  // AMPLITUDE ENVELOPE
  // =========================================================================

  amp_attack: {
    id: 'amp_attack',
    name: 'Attack',
    min: 0.001,
    max: 5,
    default: 0.01,
    unit: 's',
  },

  amp_decay: {
    id: 'amp_decay',
    name: 'Decay',
    min: 0.001,
    max: 5,
    default: 0.1,
    unit: 's',
  },

  amp_sustain: {
    id: 'amp_sustain',
    name: 'Sustain',
    min: 0,
    max: 1,
    default: 0.7,
  },

  amp_release: {
    id: 'amp_release',
    name: 'Release',
    min: 0.001,
    max: 5,
    default: 0.3,
    unit: 's',
  },

  // =========================================================================
  // MASTER
  // =========================================================================

  master_level: {
    id: 'master_level',
    name: 'Level',
    min: 0,
    max: 1,
    default: 0.8,
  },
};

/**
 * Get parameters by category
 */
export function getParametersByCategory(category: ParameterCategory): ParameterDefinition[] {
  const categoryMap: Record<ParameterCategory, string[]> = {
    [ParameterCategory.SOURCE]: ['osc_waveform', 'osc_tune', 'osc_pw'],
    [ParameterCategory.FORMANT]: ['vowel', 'formant_shift', 'formant_spread'],
    [ParameterCategory.VIBRATO]: ['vibrato_rate', 'vibrato_depth'],
    [ParameterCategory.VOWEL_LFO]: ['vowel_lfo_rate', 'vowel_lfo_depth'],
    [ParameterCategory.ENVELOPE]: ['amp_attack', 'amp_decay', 'amp_sustain', 'amp_release'],
    [ParameterCategory.MASTER]: ['master_level'],
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
    return `${value.toFixed(2)} Hz`;
  }

  if (param.unit === 's') {
    if (value < 0.01) {
      return `${(value * 1000).toFixed(1)} ms`;
    }
    return `${value.toFixed(2)} s`;
  }

  if (param.unit === 'st') {
    return `${value >= 0 ? '+' : ''}${Math.round(value)} st`;
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
