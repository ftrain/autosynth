/**
 * @file parameters.ts
 * @brief Parameter definitions for the Subharmonicon synthesizer
 *
 * These MUST match the parameters defined in PluginProcessor.cpp
 *
 * TRUE 2-VOICE ARCHITECTURE:
 * - Voice 1: VCO1 + SUB1A + SUB1B -> Filter1 -> VCA1
 * - Voice 2: VCO2 + SUB2A + SUB2B -> Filter2 -> VCA2
 */

import { ParameterMap } from '../hooks/useParameters';

/**
 * All parameter definitions for Subharmonicon
 */
export const PARAMETER_DEFINITIONS: ParameterMap = {
  // =========================================================================
  // VCO 1 PARAMETERS
  // =========================================================================

  osc1_freq: {
    id: 'osc1_freq',
    name: 'VCO1 Frequency',
    min: 20,
    max: 2000,
    default: 220,
    unit: 'Hz',
  },

  osc1_level: {
    id: 'osc1_level',
    name: 'VCO1 Level',
    min: 0,
    max: 1,
    default: 0.8,
  },

  osc1_wave: {
    id: 'osc1_wave',
    name: 'VCO1 Waveform',
    min: 0,
    max: 3,
    default: 0,
    step: 1,
  },

  sub1a_div: {
    id: 'sub1a_div',
    name: 'Sub1A Division',
    min: 1,
    max: 16,
    default: 2,
    step: 1,
  },

  sub1a_level: {
    id: 'sub1a_level',
    name: 'Sub1A Level',
    min: 0,
    max: 1,
    default: 0.5,
  },

  sub1b_div: {
    id: 'sub1b_div',
    name: 'Sub1B Division',
    min: 1,
    max: 16,
    default: 3,
    step: 1,
  },

  sub1b_level: {
    id: 'sub1b_level',
    name: 'Sub1B Level',
    min: 0,
    max: 1,
    default: 0.5,
  },

  // =========================================================================
  // VCO 2 PARAMETERS
  // =========================================================================

  osc2_freq: {
    id: 'osc2_freq',
    name: 'VCO2 Frequency',
    min: 20,
    max: 2000,
    default: 220,
    unit: 'Hz',
  },

  osc2_level: {
    id: 'osc2_level',
    name: 'VCO2 Level',
    min: 0,
    max: 1,
    default: 0.8,
  },

  osc2_wave: {
    id: 'osc2_wave',
    name: 'VCO2 Waveform',
    min: 0,
    max: 3,
    default: 0,
    step: 1,
  },

  sub2a_div: {
    id: 'sub2a_div',
    name: 'Sub2A Division',
    min: 1,
    max: 16,
    default: 4,
    step: 1,
  },

  sub2a_level: {
    id: 'sub2a_level',
    name: 'Sub2A Level',
    min: 0,
    max: 1,
    default: 0.5,
  },

  sub2b_div: {
    id: 'sub2b_div',
    name: 'Sub2B Division',
    min: 1,
    max: 16,
    default: 5,
    step: 1,
  },

  sub2b_level: {
    id: 'sub2b_level',
    name: 'Sub2B Level',
    min: 0,
    max: 1,
    default: 0.5,
  },

  // =========================================================================
  // VOICE 1 FILTER & ENVELOPES
  // =========================================================================

  filter1_cutoff: {
    id: 'filter1_cutoff',
    name: 'Filter 1 Cutoff',
    min: 20,
    max: 20000,
    default: 2000,
    unit: 'Hz',
  },

  filter1_reso: {
    id: 'filter1_reso',
    name: 'Filter 1 Resonance',
    min: 0,
    max: 1,
    default: 0.3,
  },

  filter1_env_amt: {
    id: 'filter1_env_amt',
    name: 'VCF1 EG Amount',
    min: -1,
    max: 1,
    default: 0.5,
  },

  vcf1_attack: {
    id: 'vcf1_attack',
    name: 'VCF1 Attack',
    min: 0.001,
    max: 5,
    default: 0.01,
    unit: 's',
  },

  vcf1_decay: {
    id: 'vcf1_decay',
    name: 'VCF1 Decay',
    min: 0.001,
    max: 5,
    default: 0.5,
    unit: 's',
  },

  vca1_attack: {
    id: 'vca1_attack',
    name: 'VCA1 Attack',
    min: 0.001,
    max: 5,
    default: 0.01,
    unit: 's',
  },

  vca1_decay: {
    id: 'vca1_decay',
    name: 'VCA1 Decay',
    min: 0.001,
    max: 5,
    default: 0.5,
    unit: 's',
  },

  // =========================================================================
  // VOICE 2 FILTER & ENVELOPES
  // =========================================================================

  filter2_cutoff: {
    id: 'filter2_cutoff',
    name: 'Filter 2 Cutoff',
    min: 20,
    max: 20000,
    default: 2000,
    unit: 'Hz',
  },

  filter2_reso: {
    id: 'filter2_reso',
    name: 'Filter 2 Resonance',
    min: 0,
    max: 1,
    default: 0.3,
  },

  filter2_env_amt: {
    id: 'filter2_env_amt',
    name: 'VCF2 EG Amount',
    min: -1,
    max: 1,
    default: 0.5,
  },

  vcf2_attack: {
    id: 'vcf2_attack',
    name: 'VCF2 Attack',
    min: 0.001,
    max: 5,
    default: 0.01,
    unit: 's',
  },

  vcf2_decay: {
    id: 'vcf2_decay',
    name: 'VCF2 Decay',
    min: 0.001,
    max: 5,
    default: 0.5,
    unit: 's',
  },

  vca2_attack: {
    id: 'vca2_attack',
    name: 'VCA2 Attack',
    min: 0.001,
    max: 5,
    default: 0.01,
    unit: 's',
  },

  vca2_decay: {
    id: 'vca2_decay',
    name: 'VCA2 Decay',
    min: 0.001,
    max: 5,
    default: 0.5,
    unit: 's',
  },

  // =========================================================================
  // POLYRHYTHMIC SEQUENCER
  // =========================================================================

  tempo: {
    id: 'tempo',
    name: 'Tempo',
    min: 20,
    max: 300,
    default: 120,
    unit: 'BPM',
  },

  // Rhythm divisions (index 0-12 mapping to RHYTHM_PRESETS)
  // 0=1/64, 1=1/32, 2=1/16, 3=1/8, 4=1/4, 5=1/2, 6=1x, 7=2x, 8=4x, 9=8x, 10=16x, 11=32x, 12=64x
  rhythm1_div: {
    id: 'rhythm1_div',
    name: 'Rhythm 1',
    min: 0,
    max: 12,
    default: 6,  // 1x
    step: 1,
  },

  rhythm2_div: {
    id: 'rhythm2_div',
    name: 'Rhythm 2',
    min: 0,
    max: 12,
    default: 7,  // 2x
    step: 1,
  },

  rhythm3_div: {
    id: 'rhythm3_div',
    name: 'Rhythm 3',
    min: 0,
    max: 12,
    default: 6,  // 1x
    step: 1,
  },

  rhythm4_div: {
    id: 'rhythm4_div',
    name: 'Rhythm 4',
    min: 0,
    max: 12,
    default: 7,  // 2x
    step: 1,
  },

  // =========================================================================
  // SEQUENCER 1 (VCO1)
  // =========================================================================

  seq1_enable: {
    id: 'seq1_enable',
    name: 'Seq1 Enable',
    min: 0,
    max: 1,
    default: 1,
    step: 1,
  },

  seq1_step1: {
    id: 'seq1_step1',
    name: 'Seq1 Step 1',
    min: -24,
    max: 24,
    default: 0,
    step: 1,
    unit: 'st',
  },

  seq1_step2: {
    id: 'seq1_step2',
    name: 'Seq1 Step 2',
    min: -24,
    max: 24,
    default: 0,
    step: 1,
    unit: 'st',
  },

  seq1_step3: {
    id: 'seq1_step3',
    name: 'Seq1 Step 3',
    min: -24,
    max: 24,
    default: 0,
    step: 1,
    unit: 'st',
  },

  seq1_step4: {
    id: 'seq1_step4',
    name: 'Seq1 Step 4',
    min: -24,
    max: 24,
    default: 0,
    step: 1,
    unit: 'st',
  },

  // =========================================================================
  // SEQUENCER 2 (VCO2)
  // =========================================================================

  seq2_enable: {
    id: 'seq2_enable',
    name: 'Seq2 Enable',
    min: 0,
    max: 1,
    default: 1,
    step: 1,
  },

  seq2_step1: {
    id: 'seq2_step1',
    name: 'Seq2 Step 1',
    min: -24,
    max: 24,
    default: 0,
    step: 1,
    unit: 'st',
  },

  seq2_step2: {
    id: 'seq2_step2',
    name: 'Seq2 Step 2',
    min: -24,
    max: 24,
    default: 0,
    step: 1,
    unit: 'st',
  },

  seq2_step3: {
    id: 'seq2_step3',
    name: 'Seq2 Step 3',
    min: -24,
    max: 24,
    default: 0,
    step: 1,
    unit: 'st',
  },

  seq2_step4: {
    id: 'seq2_step4',
    name: 'Seq2 Step 4',
    min: -24,
    max: 24,
    default: 0,
    step: 1,
    unit: 'st',
  },

  // =========================================================================
  // TRANSPORT
  // =========================================================================

  seq_run: {
    id: 'seq_run',
    name: 'Run',
    min: 0,
    max: 1,
    default: 0,
    step: 1,
  },

  // =========================================================================
  // MASTER
  // =========================================================================

  master_volume: {
    id: 'master_volume',
    name: 'Master Volume',
    min: 0,
    max: 1,
    default: 0.7,
  },
};

/**
 * Waveform options
 */
export const WAVEFORM_OPTIONS = ['SAW', 'SQR', 'TRI', 'SIN'];

/**
 * Subharmonic division labels
 */
export const DIVISION_OPTIONS = Array.from({ length: 16 }, (_, i) => (
  `/${i + 1}`
));

/**
 * Rhythm division presets for quick selection
 * Range: 1/64 (very slow) to 64x (very fast)
 */
export const RHYTHM_PRESETS = [
  { value: 0.015625, label: '1/64' },
  { value: 0.03125, label: '1/32' },
  { value: 0.0625, label: '1/16' },
  { value: 0.125, label: '1/8' },
  { value: 0.25, label: '1/4' },
  { value: 0.5, label: '1/2' },
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
  { value: 4, label: '4x' },
  { value: 8, label: '8x' },
  { value: 16, label: '16x' },
  { value: 32, label: '32x' },
  { value: 64, label: '64x' },
];

/**
 * Sequencer state from JUCE backend
 */
export interface SequencerState {
  seq1Step: number;
  seq2Step: number;
  seq1Enabled: boolean;
  seq2Enabled: boolean;
  rhythm1Active: boolean;
  rhythm2Active: boolean;
  rhythm3Active: boolean;
  rhythm4Active: boolean;
}
