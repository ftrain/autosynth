/**
 * @file parameters.ts
 * @brief FM Drone parameter definitions
 *
 * These MUST match the parameters defined in PluginProcessor.cpp
 */

import { ParameterMap, ParameterDefinition } from '../hooks/useParameters';

/**
 * Parameter categories for UI organization
 */
export enum ParameterCategory {
  CARRIER = 'carrier',
  MODULATOR = 'modulator',
  MOD_ENV = 'mod_env',
  AMP_ENV = 'amp_env',
  DRIFT = 'drift',
  OUTPUT = 'output',
}

/**
 * FM Drone parameter definitions
 */
export const PARAMETER_DEFINITIONS: ParameterMap = {
  // =========================================================================
  // CARRIER PARAMETERS
  // =========================================================================

  carrier_ratio: {
    id: 'carrier_ratio',
    name: 'Carrier Ratio',
    min: 0.5,
    max: 8,
    default: 1,
  },

  carrier_level: {
    id: 'carrier_level',
    name: 'Carrier Level',
    min: 0,
    max: 1,
    default: 0.8,
  },

  // =========================================================================
  // MODULATOR PARAMETERS
  // =========================================================================

  mod_ratio: {
    id: 'mod_ratio',
    name: 'Mod Ratio',
    min: 0.5,
    max: 16,
    default: 2,
  },

  mod_depth: {
    id: 'mod_depth',
    name: 'Mod Depth',
    min: 0,
    max: 1,
    default: 0.3,
  },

  mod_feedback: {
    id: 'mod_feedback',
    name: 'Feedback',
    min: 0,
    max: 1,
    default: 0,
  },

  // =========================================================================
  // FM ENVELOPE (Modulator Envelope)
  // =========================================================================

  mod_attack: {
    id: 'mod_attack',
    name: 'FM Attack',
    min: 0.001,
    max: 30,
    default: 5,
    unit: 's',
  },

  mod_decay: {
    id: 'mod_decay',
    name: 'FM Decay',
    min: 0.001,
    max: 30,
    default: 10,
    unit: 's',
  },

  mod_sustain: {
    id: 'mod_sustain',
    name: 'FM Sustain',
    min: 0,
    max: 1,
    default: 0.7,
  },

  mod_release: {
    id: 'mod_release',
    name: 'FM Release',
    min: 0.001,
    max: 30,
    default: 8,
    unit: 's',
  },

  // =========================================================================
  // AMPLITUDE ENVELOPE
  // =========================================================================

  amp_attack: {
    id: 'amp_attack',
    name: 'Amp Attack',
    min: 0.001,
    max: 30,
    default: 3,
    unit: 's',
  },

  amp_decay: {
    id: 'amp_decay',
    name: 'Amp Decay',
    min: 0.001,
    max: 30,
    default: 5,
    unit: 's',
  },

  amp_sustain: {
    id: 'amp_sustain',
    name: 'Amp Sustain',
    min: 0,
    max: 1,
    default: 0.9,
  },

  amp_release: {
    id: 'amp_release',
    name: 'Amp Release',
    min: 0.001,
    max: 30,
    default: 10,
    unit: 's',
  },

  // =========================================================================
  // DRIFT PARAMETERS
  // =========================================================================

  drift_rate: {
    id: 'drift_rate',
    name: 'Drift Rate',
    min: 0.01,
    max: 2,
    default: 0.1,
    unit: 'Hz',
  },

  drift_amount: {
    id: 'drift_amount',
    name: 'Drift Amount',
    min: 0,
    max: 1,
    default: 0.2,
  },

  // =========================================================================
  // OUTPUT
  // =========================================================================

  master_level: {
    id: 'master_level',
    name: 'Master Level',
    min: 0,
    max: 1,
    default: 0.7,
  },
};

/**
 * Get parameters by category
 */
export function getParametersByCategory(category: ParameterCategory): ParameterDefinition[] {
  const categoryMap: Record<ParameterCategory, string[]> = {
    [ParameterCategory.CARRIER]: ['carrier_ratio', 'carrier_level'],
    [ParameterCategory.MODULATOR]: ['mod_ratio', 'mod_depth', 'mod_feedback'],
    [ParameterCategory.MOD_ENV]: ['mod_attack', 'mod_decay', 'mod_sustain', 'mod_release'],
    [ParameterCategory.AMP_ENV]: ['amp_attack', 'amp_decay', 'amp_sustain', 'amp_release'],
    [ParameterCategory.DRIFT]: ['drift_rate', 'drift_amount'],
    [ParameterCategory.OUTPUT]: ['master_level'],
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
    return `${value.toFixed(2)} Hz`;
  }

  if (param.unit === 's') {
    if (value < 1) {
      return `${(value * 1000).toFixed(0)} ms`;
    }
    return `${value.toFixed(1)} s`;
  }

  // Percentage for 0-1 ranges
  if (param.max === 1 && param.min === 0) {
    return `${Math.round(value * 100)}%`;
  }

  // Ratio
  if (paramId.includes('ratio')) {
    return value.toFixed(2);
  }

  return value.toFixed(2);
}
