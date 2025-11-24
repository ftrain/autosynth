/**
 * @file parameters.ts
 * @brief Parameter definitions for the Tape Loop synthesizer
 */

import { ParameterMap } from '../hooks/useParameters';

/**
 * All parameter definitions - MUST match PluginProcessor.cpp
 */
export const PARAMETER_DEFINITIONS: ParameterMap = {
  // =========================================================================
  // OSCILLATOR 1
  // =========================================================================

  osc1_waveform: {
    id: 'osc1_waveform',
    name: 'Osc 1 Wave',
    min: 0,
    max: 2,
    default: 0,
    step: 1,
  },

  osc1_tune: {
    id: 'osc1_tune',
    name: 'Osc 1 Tune',
    min: -24,
    max: 24,
    default: 0,
    unit: 'st',
  },

  osc1_level: {
    id: 'osc1_level',
    name: 'Osc 1 Level',
    min: 0,
    max: 1,
    default: 0.7,
  },

  // =========================================================================
  // OSCILLATOR 2
  // =========================================================================

  osc2_waveform: {
    id: 'osc2_waveform',
    name: 'Osc 2 Wave',
    min: 0,
    max: 2,
    default: 0,
    step: 1,
  },

  osc2_tune: {
    id: 'osc2_tune',
    name: 'Osc 2 Tune',
    min: -24,
    max: 24,
    default: 0,
    unit: 'st',
  },

  osc2_detune: {
    id: 'osc2_detune',
    name: 'Osc 2 Detune',
    min: -100,
    max: 100,
    default: 7,
    unit: 'ct',
  },

  osc2_level: {
    id: 'osc2_level',
    name: 'Osc 2 Level',
    min: 0,
    max: 1,
    default: 0.5,
  },

  // =========================================================================
  // TAPE LOOP
  // =========================================================================

  loop_length: {
    id: 'loop_length',
    name: 'Loop Length',
    min: 0.5,
    max: 60,
    default: 4,
    unit: 's',
  },

  loop_feedback: {
    id: 'loop_feedback',
    name: 'Loop Feedback',
    min: 0,
    max: 1,
    default: 0.85,
  },

  record_level: {
    id: 'record_level',
    name: 'Record Level',
    min: 0,
    max: 1,
    default: 0.5,
  },

  // =========================================================================
  // TAPE CHARACTER
  // =========================================================================

  tape_saturation: {
    id: 'tape_saturation',
    name: 'Saturation',
    min: 0,
    max: 1,
    default: 0.3,
  },

  tape_wobble_rate: {
    id: 'tape_wobble_rate',
    name: 'Wobble Rate',
    min: 0.1,
    max: 5,
    default: 0.5,
    unit: 'Hz',
  },

  tape_wobble_depth: {
    id: 'tape_wobble_depth',
    name: 'Wobble Depth',
    min: 0,
    max: 1,
    default: 0.2,
  },

  // =========================================================================
  // TAPE NOISE
  // =========================================================================

  tape_hiss: {
    id: 'tape_hiss',
    name: 'Tape Hiss',
    min: 0,
    max: 1,
    default: 0.1,
  },

  tape_age: {
    id: 'tape_age',
    name: 'Tape Age',
    min: 0,
    max: 1,
    default: 0.3,
  },

  tape_degrade: {
    id: 'tape_degrade',
    name: 'Tape Degrade',
    min: 0,
    max: 1,
    default: 0,
  },

  // =========================================================================
  // RECORDING ENVELOPE
  // =========================================================================

  rec_attack: {
    id: 'rec_attack',
    name: 'Rec Attack',
    min: 0.005,
    max: 0.5,
    default: 0.02,
    unit: 's',
  },

  rec_decay: {
    id: 'rec_decay',
    name: 'Rec Decay',
    min: 0.01,
    max: 5,
    default: 0.5,
    unit: 's',
  },

  // =========================================================================
  // FM MODULATION
  // =========================================================================

  fm_amount: {
    id: 'fm_amount',
    name: 'FM Amount',
    min: 0,
    max: 1,
    default: 0,
  },

  // =========================================================================
  // TAPE CHARACTER LFO
  // =========================================================================

  lfo_rate: {
    id: 'lfo_rate',
    name: 'LFO Rate',
    min: 0.1,
    max: 20,
    default: 1,
    unit: 'Hz',
  },

  lfo_depth: {
    id: 'lfo_depth',
    name: 'LFO Depth',
    min: 0,
    max: 1,
    default: 0,
  },

  lfo_waveform: {
    id: 'lfo_waveform',
    name: 'LFO Wave',
    min: 0,
    max: 3,
    default: 0,
    step: 1,
  },

  lfo_target: {
    id: 'lfo_target',
    name: 'LFO Target',
    min: 0,
    max: 3,
    default: 0,
    step: 1,
  },

  // =========================================================================
  // MIX
  // =========================================================================

  dry_level: {
    id: 'dry_level',
    name: 'Dry Level',
    min: 0,
    max: 1,
    default: 0.3,
  },

  loop_level: {
    id: 'loop_level',
    name: 'Loop Level',
    min: 0,
    max: 1,
    default: 0.7,
  },

  master_level: {
    id: 'master_level',
    name: 'Master Level',
    min: 0,
    max: 1,
    default: 0.8,
  },

  // =========================================================================
  // DELAY
  // =========================================================================

  delay_time: {
    id: 'delay_time',
    name: 'Delay Time',
    min: 0.01,
    max: 2,
    default: 0.5,
    unit: 's',
  },

  delay_feedback: {
    id: 'delay_feedback',
    name: 'Delay Feedback',
    min: 0,
    max: 0.95,
    default: 0.3,
  },

  delay_mix: {
    id: 'delay_mix',
    name: 'Delay Mix',
    min: 0,
    max: 1,
    default: 0,
  },

  // =========================================================================
  // REVERB
  // =========================================================================

  reverb_decay: {
    id: 'reverb_decay',
    name: 'Reverb Decay',
    min: 0.1,
    max: 10,
    default: 2,
    unit: 's',
  },

  reverb_mix: {
    id: 'reverb_mix',
    name: 'Reverb Mix',
    min: 0,
    max: 1,
    default: 0,
  },

  reverb_damping: {
    id: 'reverb_damping',
    name: 'Reverb Damping',
    min: 0,
    max: 1,
    default: 0.5,
  },

  // =========================================================================
  // COMPRESSOR
  // =========================================================================

  comp_threshold: {
    id: 'comp_threshold',
    name: 'Comp Threshold',
    min: -40,
    max: 0,
    default: -10,
    unit: 'dB',
  },

  comp_ratio: {
    id: 'comp_ratio',
    name: 'Comp Ratio',
    min: 1,
    max: 20,
    default: 4,
  },

  comp_mix: {
    id: 'comp_mix',
    name: 'Comp Mix',
    min: 0,
    max: 1,
    default: 0,
  },
};

/**
 * Get all parameter IDs
 */
export function getAllParameterIds(): string[] {
  return Object.keys(PARAMETER_DEFINITIONS);
}
