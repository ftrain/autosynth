/**
 * @file parameters.ts
 * @brief Parameter definitions for the synthesizer
 *
 * This file defines all parameters exposed by the plugin.
 * Parameters are normalized to 0-1 range for UI communication.
 *
 * TODO: Update these definitions to match your plugin's parameters
 * These MUST match the parameters defined in PluginProcessor.cpp
 */

import { ParameterMap, ParameterDefinition } from '../hooks/useParameters';

/**
 * Parameter categories for UI organization
 */
export enum ParameterCategory {
  OSCILLATOR = 'oscillator',
  FILTER = 'filter',
  ENVELOPE = 'envelope',
  MODULATION = 'modulation',
  EFFECTS = 'effects',
  MASTER = 'master',
}

/**
 * All parameter definitions
 *
 * IMPORTANT: These must match the parameters in PluginProcessor.cpp
 */
export const PARAMETER_DEFINITIONS: ParameterMap = {
  // =========================================================================
  // OSCILLATOR PARAMETERS
  // =========================================================================

  osc1_waveform: {
    id: 'osc1_waveform',
    name: 'Osc 1 Waveform',
    min: 0,
    max: 3,
    default: 0,
    step: 1,
  },

  osc1_level: {
    id: 'osc1_level',
    name: 'Osc 1 Level',
    min: 0,
    max: 1,
    default: 0.8,
  },

  osc1_tune: {
    id: 'osc1_tune',
    name: 'Osc 1 Tune',
    min: -24,
    max: 24,
    default: 0,
    unit: 'st',
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
 * Get parameters by category
 */
export function getParametersByCategory(category: ParameterCategory): ParameterDefinition[] {
  const categoryMap: Record<ParameterCategory, string[]> = {
    [ParameterCategory.OSCILLATOR]: ['osc1_waveform', 'osc1_level', 'osc1_tune'],
    [ParameterCategory.FILTER]: ['filter_cutoff', 'filter_reso', 'filter_env_amount'],
    [ParameterCategory.ENVELOPE]: [
      'amp_attack', 'amp_decay', 'amp_sustain', 'amp_release',
      'filter_attack', 'filter_decay', 'filter_sustain', 'filter_release',
    ],
    [ParameterCategory.MODULATION]: [],
    [ParameterCategory.EFFECTS]: [],
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
