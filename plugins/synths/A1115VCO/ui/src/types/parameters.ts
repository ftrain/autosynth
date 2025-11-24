/**
 * @file parameters.ts
 * @brief Parameter definitions for A111-5 Mini Synthesizer Voice
 *
 * Based on Doepfer A-111-5 with VCO, VCF, VCA, dual LFOs, and ADSR.
 * These MUST match the parameters defined in PluginProcessor.cpp
 */

import { ParameterMap, ParameterDefinition } from '../hooks/useParameters';

/**
 * Parameter categories for UI organization
 */
export enum ParameterCategory {
  VCO = 'vco',
  VCF = 'vcf',
  VCA = 'vca',
  LFO1 = 'lfo1',
  LFO2 = 'lfo2',
  ADSR = 'adsr',
}

/**
 * All parameter definitions
 */
export const PARAMETER_DEFINITIONS: ParameterMap = {
  // =========================================================================
  // VCO PARAMETERS
  // =========================================================================

  osc_waveform: {
    id: 'osc_waveform',
    name: 'Waveform',
    min: 0,
    max: 2,
    default: 1, // Saw
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
    min: 0.05,
    max: 0.95,
    default: 0.5,
  },

  sub_level: {
    id: 'sub_level',
    name: 'Sub Level',
    min: 0,
    max: 1,
    default: 0,
  },

  glide_time: {
    id: 'glide_time',
    name: 'Glide',
    min: 0,
    max: 2,
    default: 0,
    unit: 's',
  },

  mono_mode: {
    id: 'mono_mode',
    name: 'Mono',
    min: 0,
    max: 1,
    default: 0,
    step: 1,
  },

  vco_fm_source: {
    id: 'vco_fm_source',
    name: 'FM Source',
    min: 0,
    max: 2,
    default: 0,
    step: 1,
  },

  vco_fm_amount: {
    id: 'vco_fm_amount',
    name: 'FM Amount',
    min: 0,
    max: 1,
    default: 0,
  },

  vco_pwm_source: {
    id: 'vco_pwm_source',
    name: 'PWM Source',
    min: 0,
    max: 2,
    default: 0,
    step: 1,
  },

  vco_pwm_amount: {
    id: 'vco_pwm_amount',
    name: 'PWM Amount',
    min: 0,
    max: 1,
    default: 0,
  },

  // =========================================================================
  // VCF PARAMETERS
  // =========================================================================

  vcf_cutoff: {
    id: 'vcf_cutoff',
    name: 'Cutoff',
    min: 20,
    max: 20000,
    default: 5000,
    unit: 'Hz',
  },

  vcf_resonance: {
    id: 'vcf_resonance',
    name: 'Resonance',
    min: 0,
    max: 1,
    default: 0,
  },

  vcf_tracking: {
    id: 'vcf_tracking',
    name: 'Tracking',
    min: 0,
    max: 2,
    default: 0,
    step: 1,
  },

  vcf_mod_source: {
    id: 'vcf_mod_source',
    name: 'Mod Source',
    min: 0,
    max: 2,
    default: 2, // ADSR
    step: 1,
  },

  vcf_mod_amount: {
    id: 'vcf_mod_amount',
    name: 'Mod Amount',
    min: -1,
    max: 1,
    default: 0.5,
  },

  vcf_lfm_amount: {
    id: 'vcf_lfm_amount',
    name: 'Linear FM',
    min: 0,
    max: 1,
    default: 0,
  },

  // =========================================================================
  // VCA PARAMETERS
  // =========================================================================

  vca_mod_source: {
    id: 'vca_mod_source',
    name: 'Mod Source',
    min: 0,
    max: 2,
    default: 2, // ADSR
    step: 1,
  },

  vca_initial_level: {
    id: 'vca_initial_level',
    name: 'Initial Level',
    min: 0,
    max: 1,
    default: 0,
  },

  master_level: {
    id: 'master_level',
    name: 'Master',
    min: 0,
    max: 1,
    default: 0.8,
  },

  // =========================================================================
  // LFO1 PARAMETERS
  // =========================================================================

  lfo1_frequency: {
    id: 'lfo1_frequency',
    name: 'Frequency',
    min: 0,
    max: 1,
    default: 0.5,
  },

  lfo1_waveform: {
    id: 'lfo1_waveform',
    name: 'Waveform',
    min: 0,
    max: 2,
    default: 0, // Triangle
    step: 1,
  },

  lfo1_range: {
    id: 'lfo1_range',
    name: 'Range',
    min: 0,
    max: 2,
    default: 0, // Low
    step: 1,
  },

  // =========================================================================
  // LFO2 PARAMETERS
  // =========================================================================

  lfo2_frequency: {
    id: 'lfo2_frequency',
    name: 'Frequency',
    min: 0,
    max: 1,
    default: 0.5,
  },

  lfo2_waveform: {
    id: 'lfo2_waveform',
    name: 'Waveform',
    min: 0,
    max: 2,
    default: 0, // Triangle
    step: 1,
  },

  lfo2_range: {
    id: 'lfo2_range',
    name: 'Range',
    min: 0,
    max: 2,
    default: 0, // Low
    step: 1,
  },

  // =========================================================================
  // ADSR PARAMETERS
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
};

/**
 * Get parameters by category
 */
export function getParametersByCategory(category: ParameterCategory): ParameterDefinition[] {
  const categoryMap: Record<ParameterCategory, string[]> = {
    [ParameterCategory.VCO]: [
      'osc_waveform', 'osc_tune', 'osc_fine', 'pulse_width', 'sub_level',
      'glide_time', 'mono_mode',
      'vco_fm_source', 'vco_fm_amount', 'vco_pwm_source', 'vco_pwm_amount'
    ],
    [ParameterCategory.VCF]: [
      'vcf_cutoff', 'vcf_resonance', 'vcf_tracking',
      'vcf_mod_source', 'vcf_mod_amount', 'vcf_lfm_amount'
    ],
    [ParameterCategory.VCA]: [
      'vca_mod_source', 'vca_initial_level', 'master_level'
    ],
    [ParameterCategory.LFO1]: [
      'lfo1_frequency', 'lfo1_waveform', 'lfo1_range'
    ],
    [ParameterCategory.LFO2]: [
      'lfo2_frequency', 'lfo2_waveform', 'lfo2_range'
    ],
    [ParameterCategory.ADSR]: [
      'amp_attack', 'amp_decay', 'amp_sustain', 'amp_release'
    ],
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
