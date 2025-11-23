/**
 * @file parameters.ts
 * @brief DFAM Parameter definitions
 *
 * These must match the parameters defined in PluginProcessor.cpp
 */

import { ParameterMap, ParameterDefinition } from '../hooks/useParameters';

export const WAVEFORM_OPTIONS = ['SAW', 'SQR', 'TRI', 'SIN'];

export const PARAMETER_DEFINITIONS: ParameterMap = {
  // =========================================================================
  // TRANSPORT
  // =========================================================================

  tempo: {
    id: 'tempo',
    name: 'Tempo',
    min: 20,
    max: 300,
    default: 120,
    unit: 'BPM',
  },

  running: {
    id: 'running',
    name: 'Running',
    min: 0,
    max: 1,
    default: 0,
    step: 1,
  },

  // =========================================================================
  // VCO1
  // =========================================================================

  vco1_freq: {
    id: 'vco1_freq',
    name: 'VCO1 Frequency',
    min: 20,
    max: 2000,
    default: 110,
    unit: 'Hz',
  },

  vco1_wave: {
    id: 'vco1_wave',
    name: 'VCO1 Waveform',
    min: 0,
    max: 3,
    default: 0,
    step: 1,
  },

  vco1_level: {
    id: 'vco1_level',
    name: 'VCO1 Level',
    min: 0,
    max: 1,
    default: 0.5,
  },

  // =========================================================================
  // VCO2
  // =========================================================================

  vco2_freq: {
    id: 'vco2_freq',
    name: 'VCO2 Frequency',
    min: 20,
    max: 2000,
    default: 110,
    unit: 'Hz',
  },

  vco2_wave: {
    id: 'vco2_wave',
    name: 'VCO2 Waveform',
    min: 0,
    max: 3,
    default: 0,
    step: 1,
  },

  vco2_level: {
    id: 'vco2_level',
    name: 'VCO2 Level',
    min: 0,
    max: 1,
    default: 0.5,
  },

  // =========================================================================
  // FM & NOISE
  // =========================================================================

  fm_amount: {
    id: 'fm_amount',
    name: 'FM Amount',
    min: 0,
    max: 1,
    default: 0,
  },

  noise_level: {
    id: 'noise_level',
    name: 'Noise Level',
    min: 0,
    max: 1,
    default: 0,
  },

  // =========================================================================
  // FILTER
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
    min: 0,
    max: 1,
    default: 0.5,
  },

  // =========================================================================
  // PITCH ENVELOPE
  // =========================================================================

  pitch_env_attack: {
    id: 'pitch_env_attack',
    name: 'Pitch Env Attack',
    min: 0.001,
    max: 2,
    default: 0.001,
    unit: 's',
  },

  pitch_env_decay: {
    id: 'pitch_env_decay',
    name: 'Pitch Env Decay',
    min: 0.001,
    max: 2,
    default: 0.3,
    unit: 's',
  },

  pitch_env_amount: {
    id: 'pitch_env_amount',
    name: 'Pitch Env Amount',
    min: 0,
    max: 48,
    default: 24,
    unit: 'st',
  },

  // =========================================================================
  // VCF/VCA ENVELOPE
  // =========================================================================

  vcf_vca_attack: {
    id: 'vcf_vca_attack',
    name: 'VCF/VCA Attack',
    min: 0.001,
    max: 2,
    default: 0.001,
    unit: 's',
  },

  vcf_vca_decay: {
    id: 'vcf_vca_decay',
    name: 'VCF/VCA Decay',
    min: 0.001,
    max: 2,
    default: 0.5,
    unit: 's',
  },

  // =========================================================================
  // SEQUENCER PITCHES (8 steps)
  // =========================================================================

  seq_pitch_0: { id: 'seq_pitch_0', name: 'Step 1 Pitch', min: -24, max: 24, default: 0, unit: 'st' },
  seq_pitch_1: { id: 'seq_pitch_1', name: 'Step 2 Pitch', min: -24, max: 24, default: 0, unit: 'st' },
  seq_pitch_2: { id: 'seq_pitch_2', name: 'Step 3 Pitch', min: -24, max: 24, default: 0, unit: 'st' },
  seq_pitch_3: { id: 'seq_pitch_3', name: 'Step 4 Pitch', min: -24, max: 24, default: 0, unit: 'st' },
  seq_pitch_4: { id: 'seq_pitch_4', name: 'Step 5 Pitch', min: -24, max: 24, default: 0, unit: 'st' },
  seq_pitch_5: { id: 'seq_pitch_5', name: 'Step 6 Pitch', min: -24, max: 24, default: 0, unit: 'st' },
  seq_pitch_6: { id: 'seq_pitch_6', name: 'Step 7 Pitch', min: -24, max: 24, default: 0, unit: 'st' },
  seq_pitch_7: { id: 'seq_pitch_7', name: 'Step 8 Pitch', min: -24, max: 24, default: 0, unit: 'st' },

  // =========================================================================
  // SEQUENCER VELOCITIES (8 steps)
  // =========================================================================

  seq_vel_0: { id: 'seq_vel_0', name: 'Step 1 Velocity', min: 0, max: 1, default: 1 },
  seq_vel_1: { id: 'seq_vel_1', name: 'Step 2 Velocity', min: 0, max: 1, default: 1 },
  seq_vel_2: { id: 'seq_vel_2', name: 'Step 3 Velocity', min: 0, max: 1, default: 1 },
  seq_vel_3: { id: 'seq_vel_3', name: 'Step 4 Velocity', min: 0, max: 1, default: 1 },
  seq_vel_4: { id: 'seq_vel_4', name: 'Step 5 Velocity', min: 0, max: 1, default: 1 },
  seq_vel_5: { id: 'seq_vel_5', name: 'Step 6 Velocity', min: 0, max: 1, default: 1 },
  seq_vel_6: { id: 'seq_vel_6', name: 'Step 7 Velocity', min: 0, max: 1, default: 1 },
  seq_vel_7: { id: 'seq_vel_7', name: 'Step 8 Velocity', min: 0, max: 1, default: 1 },

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

export interface SequencerState {
  currentStep: number;
  running: boolean;
}

export function getAllParameterIds(): string[] {
  return Object.keys(PARAMETER_DEFINITIONS);
}
