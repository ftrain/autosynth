/**
 * @file parameters.ts
 * @brief Parameter definitions for A111-5 VCO
 *
 * These MUST match the parameters defined in PluginProcessor.cpp
 */

import { ParameterMap, ParameterDefinition } from '../hooks/useParameters';

/**
 * Parameter categories for UI organization
 */
export enum ParameterCategory {
  OSCILLATOR = 'oscillator',
  SUB = 'sub',
  MODULATION = 'modulation',
  ENVELOPE = 'envelope',
  MASTER = 'master',
}

/**
 * All parameter definitions
 */
export const PARAMETER_DEFINITIONS: ParameterMap = {
  // =========================================================================
  // OSCILLATOR PARAMETERS
  // =========================================================================

  osc_waveform: {
    id: 'osc_waveform',
    name: 'Waveform',
    min: 0,
    max: 3,
    default: 2, // Saw
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

  osc_fine: {
    id: 'osc_fine',
    name: 'Fine',
    min: -100,
    max: 100,
    default: 0,
    step: 1,
    unit: 'cents',
  },

  pulse_width: {
    id: 'pulse_width',
    name: 'Pulse Width',
    min: 0,
    max: 1,
    default: 0.5,
  },

  // =========================================================================
  // SUB OSCILLATOR
  // =========================================================================

  sub_level: {
    id: 'sub_level',
    name: 'Sub Level',
    min: 0,
    max: 1,
    default: 0,
  },

  // =========================================================================
  // MODULATION
  // =========================================================================

  sync_enable: {
    id: 'sync_enable',
    name: 'Sync',
    min: 0,
    max: 1,
    default: 0,
    step: 1,
  },

  fm_amount: {
    id: 'fm_amount',
    name: 'FM Amount',
    min: 0,
    max: 1,
    default: 0,
  },

  fm_ratio: {
    id: 'fm_ratio',
    name: 'FM Ratio',
    min: 0.5,
    max: 8,
    default: 1,
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
    [ParameterCategory.OSCILLATOR]: ['osc_waveform', 'osc_tune', 'osc_fine', 'pulse_width'],
    [ParameterCategory.SUB]: ['sub_level'],
    [ParameterCategory.MODULATION]: ['sync_enable', 'fm_amount', 'fm_ratio'],
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

  if (param.unit === 'cents') {
    return `${value >= 0 ? '+' : ''}${Math.round(value)} ct`;
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
