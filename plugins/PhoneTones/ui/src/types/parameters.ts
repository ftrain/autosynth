/**
 * @file parameters.ts
 * @brief Parameter definitions for Phone Tones
 *
 * These MUST match the parameters defined in PluginProcessor.cpp
 */

import { ParameterMap, ParameterDefinition } from '../hooks/useParameters';

/**
 * Parameter categories for UI organization
 */
export enum ParameterCategory {
  TONE = 'tone',
  FILTER = 'filter',
  NOISE = 'noise',
  PATTERN = 'pattern',
  AMP = 'amp',
  MASTER = 'master',
}

/**
 * All parameter definitions
 */
export const PARAMETER_DEFINITIONS: ParameterMap = {
  // =========================================================================
  // TONE PARAMETERS
  // =========================================================================

  tone_mode: {
    id: 'tone_mode',
    name: 'Tone Mode',
    min: 0,
    max: 5,
    default: 0,
    step: 1,
  },

  tone1_freq: {
    id: 'tone1_freq',
    name: 'Tone 1 Freq',
    min: 200,
    max: 2000,
    default: 440,
    unit: 'Hz',
  },

  tone2_freq: {
    id: 'tone2_freq',
    name: 'Tone 2 Freq',
    min: 200,
    max: 2000,
    default: 480,
    unit: 'Hz',
  },

  tone_mix: {
    id: 'tone_mix',
    name: 'Tone Mix',
    min: 0,
    max: 1,
    default: 0.5,
  },

  // =========================================================================
  // FILTER PARAMETERS
  // =========================================================================

  filter_low: {
    id: 'filter_low',
    name: 'Filter Low',
    min: 200,
    max: 500,
    default: 300,
    unit: 'Hz',
  },

  filter_high: {
    id: 'filter_high',
    name: 'Filter High',
    min: 2500,
    max: 4000,
    default: 3400,
    unit: 'Hz',
  },

  filter_drive: {
    id: 'filter_drive',
    name: 'Drive',
    min: 0,
    max: 1,
    default: 0.2,
  },

  // =========================================================================
  // NOISE PARAMETERS
  // =========================================================================

  noise_level: {
    id: 'noise_level',
    name: 'Noise Level',
    min: 0,
    max: 1,
    default: 0.1,
  },

  noise_crackle: {
    id: 'noise_crackle',
    name: 'Crackle',
    min: 0,
    max: 1,
    default: 0.1,
  },

  // =========================================================================
  // PATTERN PARAMETERS
  // =========================================================================

  pattern_rate: {
    id: 'pattern_rate',
    name: 'Pattern Rate',
    min: 0.1,
    max: 10,
    default: 2,
    unit: 'Hz',
  },

  pattern_duty: {
    id: 'pattern_duty',
    name: 'Duty Cycle',
    min: 0,
    max: 1,
    default: 0.5,
  },

  // =========================================================================
  // AMPLITUDE ENVELOPE
  // =========================================================================

  amp_attack: {
    id: 'amp_attack',
    name: 'Attack',
    min: 0.001,
    max: 2,
    default: 0.005,
    unit: 's',
  },

  amp_decay: {
    id: 'amp_decay',
    name: 'Decay',
    min: 0.001,
    max: 2,
    default: 0.1,
    unit: 's',
  },

  amp_sustain: {
    id: 'amp_sustain',
    name: 'Sustain',
    min: 0,
    max: 1,
    default: 1.0,
  },

  amp_release: {
    id: 'amp_release',
    name: 'Release',
    min: 0.001,
    max: 2,
    default: 0.05,
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
    [ParameterCategory.TONE]: ['tone_mode', 'tone1_freq', 'tone2_freq', 'tone_mix'],
    [ParameterCategory.FILTER]: ['filter_low', 'filter_high', 'filter_drive'],
    [ParameterCategory.NOISE]: ['noise_level', 'noise_crackle'],
    [ParameterCategory.PATTERN]: ['pattern_rate', 'pattern_duty'],
    [ParameterCategory.AMP]: ['amp_attack', 'amp_decay', 'amp_sustain', 'amp_release'],
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
    return `${Math.round(value)} Hz`;
  }

  if (param.unit === 's') {
    if (value < 0.01) {
      return `${(value * 1000).toFixed(1)} ms`;
    }
    return `${value.toFixed(2)} s`;
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
