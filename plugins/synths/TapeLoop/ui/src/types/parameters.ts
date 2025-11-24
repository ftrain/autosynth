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
  // REVERB (Airwindows Galactic3)
  // =========================================================================

  reverb_replace: {
    id: 'reverb_replace',
    name: 'Reverb Replace',
    min: 0,
    max: 1,
    default: 0.5,
  },

  reverb_brightness: {
    id: 'reverb_brightness',
    name: 'Reverb Brightness',
    min: 0,
    max: 1,
    default: 0.5,
  },

  reverb_detune: {
    id: 'reverb_detune',
    name: 'Reverb Detune',
    min: 0,
    max: 1,
    default: 0.2,
  },

  reverb_bigness: {
    id: 'reverb_bigness',
    name: 'Reverb Bigness',
    min: 0,
    max: 1,
    default: 0.5,
  },

  reverb_size: {
    id: 'reverb_size',
    name: 'Reverb Size',
    min: 0,
    max: 1,
    default: 0.5,
  },

  reverb_mix: {
    id: 'reverb_mix',
    name: 'Reverb Mix',
    min: 0,
    max: 1,
    default: 0,
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

  // =========================================================================
  // SEQUENCERS (dual - one per oscillator)
  // =========================================================================

  seq_enabled: {
    id: 'seq_enabled',
    name: 'Sequencer',
    min: 0,
    max: 1,
    default: 0,
    step: 1,
  },

  seq_bpm: {
    id: 'seq_bpm',
    name: 'BPM',
    min: 30,
    max: 300,
    default: 120,
    step: 1,
  },

  // Sequencer 1 (Osc 1)
  seq1_division: {
    id: 'seq1_division',
    name: 'Seq1 Div',
    min: 0,
    max: 15,
    default: 4,
    step: 1,
  },

  seq1_pitch1: { id: 'seq1_pitch1', name: 'Seq1 Pitch 1', min: 36, max: 84, default: 60, step: 1 },
  seq1_pitch2: { id: 'seq1_pitch2', name: 'Seq1 Pitch 2', min: 36, max: 84, default: 60, step: 1 },
  seq1_pitch3: { id: 'seq1_pitch3', name: 'Seq1 Pitch 3', min: 36, max: 84, default: 60, step: 1 },
  seq1_pitch4: { id: 'seq1_pitch4', name: 'Seq1 Pitch 4', min: 36, max: 84, default: 60, step: 1 },

  seq1_gate1: { id: 'seq1_gate1', name: 'Seq1 Gate 1', min: 0, max: 1, default: 1, step: 1 },
  seq1_gate2: { id: 'seq1_gate2', name: 'Seq1 Gate 2', min: 0, max: 1, default: 1, step: 1 },
  seq1_gate3: { id: 'seq1_gate3', name: 'Seq1 Gate 3', min: 0, max: 1, default: 1, step: 1 },
  seq1_gate4: { id: 'seq1_gate4', name: 'Seq1 Gate 4', min: 0, max: 1, default: 1, step: 1 },

  // Sequencer 2 (Osc 2)
  seq2_division: {
    id: 'seq2_division',
    name: 'Seq2 Div',
    min: 0,
    max: 15,
    default: 4,
    step: 1,
  },

  seq2_pitch1: { id: 'seq2_pitch1', name: 'Seq2 Pitch 1', min: 36, max: 84, default: 60, step: 1 },
  seq2_pitch2: { id: 'seq2_pitch2', name: 'Seq2 Pitch 2', min: 36, max: 84, default: 60, step: 1 },
  seq2_pitch3: { id: 'seq2_pitch3', name: 'Seq2 Pitch 3', min: 36, max: 84, default: 60, step: 1 },
  seq2_pitch4: { id: 'seq2_pitch4', name: 'Seq2 Pitch 4', min: 36, max: 84, default: 60, step: 1 },

  seq2_gate1: { id: 'seq2_gate1', name: 'Seq2 Gate 1', min: 0, max: 1, default: 1, step: 1 },
  seq2_gate2: { id: 'seq2_gate2', name: 'Seq2 Gate 2', min: 0, max: 1, default: 1, step: 1 },
  seq2_gate3: { id: 'seq2_gate3', name: 'Seq2 Gate 3', min: 0, max: 1, default: 1, step: 1 },
  seq2_gate4: { id: 'seq2_gate4', name: 'Seq2 Gate 4', min: 0, max: 1, default: 1, step: 1 },

  // =========================================================================
  // VOICE TO LOOP FM
  // =========================================================================

  voice_loop_fm: {
    id: 'voice_loop_fm',
    name: 'Voice->Loop FM',
    min: 0,
    max: 1,
    default: 0,
  },

  // =========================================================================
  // ADSR ENVELOPES (per oscillator)
  // =========================================================================

  osc1_attack: {
    id: 'osc1_attack',
    name: 'Osc1 Attack',
    min: 1,
    max: 5000,
    default: 10,
    unit: 'ms',
  },

  osc1_decay: {
    id: 'osc1_decay',
    name: 'Osc1 Decay',
    min: 1,
    max: 5000,
    default: 100,
    unit: 'ms',
  },

  osc1_sustain: {
    id: 'osc1_sustain',
    name: 'Osc1 Sustain',
    min: 0,
    max: 1,
    default: 0.7,
  },

  osc1_release: {
    id: 'osc1_release',
    name: 'Osc1 Release',
    min: 1,
    max: 10000,
    default: 300,
    unit: 'ms',
  },

  osc2_attack: {
    id: 'osc2_attack',
    name: 'Osc2 Attack',
    min: 1,
    max: 5000,
    default: 10,
    unit: 'ms',
  },

  osc2_decay: {
    id: 'osc2_decay',
    name: 'Osc2 Decay',
    min: 1,
    max: 5000,
    default: 100,
    unit: 'ms',
  },

  osc2_sustain: {
    id: 'osc2_sustain',
    name: 'Osc2 Sustain',
    min: 0,
    max: 1,
    default: 0.7,
  },

  osc2_release: {
    id: 'osc2_release',
    name: 'Osc2 Release',
    min: 1,
    max: 10000,
    default: 300,
    unit: 'ms',
  },

  // =========================================================================
  // PAN LFO
  // =========================================================================

  pan_speed: {
    id: 'pan_speed',
    name: 'Pan Speed',
    min: 0.01,
    max: 10,
    default: 0.5,
    unit: 'Hz',
  },

  pan_depth: {
    id: 'pan_depth',
    name: 'Pan Depth',
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
