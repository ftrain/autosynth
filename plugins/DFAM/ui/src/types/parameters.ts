/**
 * @file parameters.ts
 * @brief Famdrum Parameter definitions
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

  pitch_to_noise: {
    id: 'pitch_to_noise',
    name: 'Pitch→Noise',
    min: 0,
    max: 1,
    default: 0,
  },

  pitch_to_decay: {
    id: 'pitch_to_decay',
    name: 'Pitch→Decay',
    min: -1,
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
  // PITCH LFO
  // =========================================================================

  pitch_lfo_rate: { id: 'pitch_lfo_rate', name: 'Pitch LFO Rate', min: 0.1, max: 10, default: 1, unit: 'Hz' },
  pitch_lfo_amount: { id: 'pitch_lfo_amount', name: 'Pitch LFO Amount', min: 0, max: 24, default: 12, unit: 'st' },

  pitch_lfo_en_0: { id: 'pitch_lfo_en_0', name: 'Step 1 Pitch LFO', min: 0, max: 1, default: 0, step: 1 },
  pitch_lfo_en_1: { id: 'pitch_lfo_en_1', name: 'Step 2 Pitch LFO', min: 0, max: 1, default: 0, step: 1 },
  pitch_lfo_en_2: { id: 'pitch_lfo_en_2', name: 'Step 3 Pitch LFO', min: 0, max: 1, default: 0, step: 1 },
  pitch_lfo_en_3: { id: 'pitch_lfo_en_3', name: 'Step 4 Pitch LFO', min: 0, max: 1, default: 0, step: 1 },
  pitch_lfo_en_4: { id: 'pitch_lfo_en_4', name: 'Step 5 Pitch LFO', min: 0, max: 1, default: 0, step: 1 },
  pitch_lfo_en_5: { id: 'pitch_lfo_en_5', name: 'Step 6 Pitch LFO', min: 0, max: 1, default: 0, step: 1 },
  pitch_lfo_en_6: { id: 'pitch_lfo_en_6', name: 'Step 7 Pitch LFO', min: 0, max: 1, default: 0, step: 1 },
  pitch_lfo_en_7: { id: 'pitch_lfo_en_7', name: 'Step 8 Pitch LFO', min: 0, max: 1, default: 0, step: 1 },

  // =========================================================================
  // VELOCITY LFO
  // =========================================================================

  vel_lfo_rate: { id: 'vel_lfo_rate', name: 'Velocity LFO Rate', min: 0.1, max: 10, default: 1, unit: 'Hz' },
  vel_lfo_amount: { id: 'vel_lfo_amount', name: 'Velocity LFO Amount', min: 0, max: 1, default: 0.5 },

  vel_lfo_en_0: { id: 'vel_lfo_en_0', name: 'Step 1 Velocity LFO', min: 0, max: 1, default: 0, step: 1 },
  vel_lfo_en_1: { id: 'vel_lfo_en_1', name: 'Step 2 Velocity LFO', min: 0, max: 1, default: 0, step: 1 },
  vel_lfo_en_2: { id: 'vel_lfo_en_2', name: 'Step 3 Velocity LFO', min: 0, max: 1, default: 0, step: 1 },
  vel_lfo_en_3: { id: 'vel_lfo_en_3', name: 'Step 4 Velocity LFO', min: 0, max: 1, default: 0, step: 1 },
  vel_lfo_en_4: { id: 'vel_lfo_en_4', name: 'Step 5 Velocity LFO', min: 0, max: 1, default: 0, step: 1 },
  vel_lfo_en_5: { id: 'vel_lfo_en_5', name: 'Step 6 Velocity LFO', min: 0, max: 1, default: 0, step: 1 },
  vel_lfo_en_6: { id: 'vel_lfo_en_6', name: 'Step 7 Velocity LFO', min: 0, max: 1, default: 0, step: 1 },
  vel_lfo_en_7: { id: 'vel_lfo_en_7', name: 'Step 8 Velocity LFO', min: 0, max: 1, default: 0, step: 1 },

  // =========================================================================
  // FILTER LFO
  // =========================================================================

  filter_lfo_rate: { id: 'filter_lfo_rate', name: 'Filter LFO Rate', min: 0.1, max: 10, default: 1, unit: 'Hz' },
  filter_lfo_amount: { id: 'filter_lfo_amount', name: 'Filter LFO Amount', min: 0, max: 1, default: 0 },

  // =========================================================================
  // FILTER MODE
  // =========================================================================

  filter_mode: { id: 'filter_mode', name: 'Filter Mode', min: 0, max: 1, default: 0, step: 1 },

  // =========================================================================
  // EFFECTS - SATURATOR
  // =========================================================================

  sat_drive: { id: 'sat_drive', name: 'Drive', min: 1, max: 20, default: 1 },
  sat_mix: { id: 'sat_mix', name: 'Drive Mix', min: 0, max: 1, default: 0 },

  // =========================================================================
  // EFFECTS - DELAY
  // =========================================================================

  delay_time: { id: 'delay_time', name: 'Delay Time', min: 0.001, max: 2, default: 0.25, unit: 's' },
  delay_feedback: { id: 'delay_feedback', name: 'Delay Feedback', min: 0, max: 0.95, default: 0.3 },
  delay_mix: { id: 'delay_mix', name: 'Delay Mix', min: 0, max: 1, default: 0 },

  // =========================================================================
  // EFFECTS - REVERB
  // =========================================================================

  reverb_decay: { id: 'reverb_decay', name: 'Reverb Decay', min: 0.1, max: 10, default: 2, unit: 's' },
  reverb_damping: { id: 'reverb_damping', name: 'Reverb Damping', min: 0, max: 1, default: 0.5 },
  reverb_mix: { id: 'reverb_mix', name: 'Reverb Mix', min: 0, max: 1, default: 0 },

  // =========================================================================
  // EFFECTS - COMPRESSOR
  // =========================================================================

  comp_threshold: { id: 'comp_threshold', name: 'Comp Threshold', min: -60, max: 0, default: -10, unit: 'dB' },
  comp_ratio: { id: 'comp_ratio', name: 'Comp Ratio', min: 1, max: 20, default: 4 },
  comp_attack: { id: 'comp_attack', name: 'Comp Attack', min: 0.1, max: 100, default: 10, unit: 'ms' },
  comp_release: { id: 'comp_release', name: 'Comp Release', min: 10, max: 1000, default: 100, unit: 'ms' },
  comp_makeup: { id: 'comp_makeup', name: 'Comp Makeup', min: 0, max: 24, default: 0, unit: 'dB' },

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
