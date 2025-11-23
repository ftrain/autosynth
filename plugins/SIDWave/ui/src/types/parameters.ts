/**
 * @file parameters.ts
 * @brief Parameter definitions for SID Wave synthesizer
 *
 * 8-bit wavetable synth inspired by the Commodore 64 SID chip
 */

import { ParameterMap, ParameterDefinition } from '../hooks/useParameters';

/**
 * Parameter categories for UI organization
 */
export enum ParameterCategory {
  OSC1 = 'osc1',
  OSC2 = 'osc2',
  OSC3 = 'osc3',
  LOFI = 'lofi',
  FILTER = 'filter',
  ENVELOPE = 'envelope',
  MASTER = 'master',
}

/**
 * All parameter definitions - MUST match PluginProcessor.cpp
 */
export const PARAMETER_DEFINITIONS: ParameterMap = {
  // =========================================================================
  // OSCILLATOR 1
  // =========================================================================

  osc1_wave: {
    id: 'osc1_wave',
    name: 'Wave',
    min: 0,
    max: 3,
    default: 1,  // Saw
    step: 1,
  },

  osc1_tune: {
    id: 'osc1_tune',
    name: 'Tune',
    min: -24,
    max: 24,
    default: 0,
    step: 1,
    unit: 'st',
  },

  osc1_pw: {
    id: 'osc1_pw',
    name: 'PW',
    min: 0.05,
    max: 0.95,
    default: 0.5,
  },

  osc1_level: {
    id: 'osc1_level',
    name: 'Level',
    min: 0,
    max: 1,
    default: 0.8,
  },

  // =========================================================================
  // OSCILLATOR 2
  // =========================================================================

  osc2_wave: {
    id: 'osc2_wave',
    name: 'Wave',
    min: 0,
    max: 3,
    default: 0,  // Pulse
    step: 1,
  },

  osc2_tune: {
    id: 'osc2_tune',
    name: 'Tune',
    min: -24,
    max: 24,
    default: 0,
    step: 1,
    unit: 'st',
  },

  osc2_pw: {
    id: 'osc2_pw',
    name: 'PW',
    min: 0.05,
    max: 0.95,
    default: 0.5,
  },

  osc2_level: {
    id: 'osc2_level',
    name: 'Level',
    min: 0,
    max: 1,
    default: 0.5,
  },

  osc2_ring: {
    id: 'osc2_ring',
    name: 'Ring',
    min: 0,
    max: 1,
    default: 0,
  },

  // =========================================================================
  // OSCILLATOR 3
  // =========================================================================

  osc3_wave: {
    id: 'osc3_wave',
    name: 'Wave',
    min: 0,
    max: 3,
    default: 2,  // Triangle
    step: 1,
  },

  osc3_tune: {
    id: 'osc3_tune',
    name: 'Tune',
    min: -24,
    max: 24,
    default: 0,
    step: 1,
    unit: 'st',
  },

  osc3_level: {
    id: 'osc3_level',
    name: 'Level',
    min: 0,
    max: 1,
    default: 0.3,
  },

  // =========================================================================
  // LO-FI (8-BIT CHARACTER)
  // =========================================================================

  bit_depth: {
    id: 'bit_depth',
    name: 'Bits',
    min: 4,
    max: 16,
    default: 8,
    step: 1,
  },

  sample_rate: {
    id: 'sample_rate',
    name: 'Rate',
    min: 0,
    max: 1,
    default: 1,
  },

  // =========================================================================
  // FILTER
  // =========================================================================

  filter_cutoff: {
    id: 'filter_cutoff',
    name: 'Cutoff',
    min: 20,
    max: 20000,
    default: 8000,
    unit: 'Hz',
  },

  filter_reso: {
    id: 'filter_reso',
    name: 'Reso',
    min: 0,
    max: 1,
    default: 0.2,
  },

  filter_type: {
    id: 'filter_type',
    name: 'Type',
    min: 0,
    max: 2,
    default: 0,  // LP
    step: 1,
  },

  // =========================================================================
  // AMPLITUDE ENVELOPE
  // =========================================================================

  amp_attack: {
    id: 'amp_attack',
    name: 'Attack',
    min: 0.001,
    max: 2,
    default: 0.01,
    unit: 's',
  },

  amp_decay: {
    id: 'amp_decay',
    name: 'Decay',
    min: 0.001,
    max: 2,
    default: 0.2,
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
    max: 2,
    default: 0.3,
    unit: 's',
  },

  // =========================================================================
  // MASTER
  // =========================================================================

  master_level: {
    id: 'master_level',
    name: 'Volume',
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
    [ParameterCategory.OSC1]: ['osc1_wave', 'osc1_tune', 'osc1_pw', 'osc1_level'],
    [ParameterCategory.OSC2]: ['osc2_wave', 'osc2_tune', 'osc2_pw', 'osc2_level', 'osc2_ring'],
    [ParameterCategory.OSC3]: ['osc3_wave', 'osc3_tune', 'osc3_level'],
    [ParameterCategory.LOFI]: ['bit_depth', 'sample_rate'],
    [ParameterCategory.FILTER]: ['filter_cutoff', 'filter_reso', 'filter_type'],
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
    return `${Math.round(value)} Hz`;
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
