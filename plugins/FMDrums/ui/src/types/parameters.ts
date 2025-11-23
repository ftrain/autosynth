/**
 * @file parameters.ts
 * @brief Parameter definitions for FM Drums synthesizer
 */

export interface ParameterDefinition {
  id: string;
  name: string;
  min: number;
  max: number;
  default: number;
  step?: number;
  unit?: string;
}

export type ParameterMap = Record<string, ParameterDefinition>;

export const PARAMETER_DEFINITIONS: ParameterMap = {
  // KICK
  kick_carrier_freq: { id: 'kick_carrier_freq', name: 'Kick Freq', min: 20, max: 200, default: 60, unit: 'Hz' },
  kick_mod_ratio: { id: 'kick_mod_ratio', name: 'Kick Mod Ratio', min: 0.5, max: 16, default: 1 },
  kick_mod_depth: { id: 'kick_mod_depth', name: 'Kick FM Depth', min: 0, max: 1, default: 0.5 },
  kick_pitch_decay: { id: 'kick_pitch_decay', name: 'Kick Pitch Decay', min: 1, max: 500, default: 50, unit: 'ms' },
  kick_pitch_amount: { id: 'kick_pitch_amount', name: 'Kick Pitch Amt', min: 0, max: 1, default: 0.8 },
  kick_amp_decay: { id: 'kick_amp_decay', name: 'Kick Amp Decay', min: 1, max: 2000, default: 400, unit: 'ms' },
  kick_level: { id: 'kick_level', name: 'Kick Level', min: 0, max: 1, default: 0.8 },

  // SNARE
  snare_carrier_freq: { id: 'snare_carrier_freq', name: 'Snare Freq', min: 80, max: 500, default: 180, unit: 'Hz' },
  snare_mod_ratio: { id: 'snare_mod_ratio', name: 'Snare Mod Ratio', min: 0.5, max: 16, default: 2.4 },
  snare_mod_depth: { id: 'snare_mod_depth', name: 'Snare FM Depth', min: 0, max: 1, default: 0.6 },
  snare_noise: { id: 'snare_noise', name: 'Snare Noise', min: 0, max: 1, default: 0.5 },
  snare_pitch_decay: { id: 'snare_pitch_decay', name: 'Snare Pitch Decay', min: 1, max: 200, default: 20, unit: 'ms' },
  snare_amp_decay: { id: 'snare_amp_decay', name: 'Snare Amp Decay', min: 1, max: 1000, default: 200, unit: 'ms' },
  snare_level: { id: 'snare_level', name: 'Snare Level', min: 0, max: 1, default: 0.8 },

  // HAT
  hat_carrier_freq: { id: 'hat_carrier_freq', name: 'Hat Freq', min: 200, max: 2000, default: 800, unit: 'Hz' },
  hat_mod_ratio: { id: 'hat_mod_ratio', name: 'Hat Mod Ratio', min: 0.5, max: 16, default: 7.1 },
  hat_mod_depth: { id: 'hat_mod_depth', name: 'Hat FM Depth', min: 0, max: 1, default: 0.8 },
  hat_noise: { id: 'hat_noise', name: 'Hat Noise', min: 0, max: 1, default: 0.7 },
  hat_amp_decay: { id: 'hat_amp_decay', name: 'Hat Amp Decay', min: 1, max: 500, default: 80, unit: 'ms' },
  hat_level: { id: 'hat_level', name: 'Hat Level', min: 0, max: 1, default: 0.7 },

  // PERC
  perc_carrier_freq: { id: 'perc_carrier_freq', name: 'Perc Freq', min: 100, max: 1000, default: 400, unit: 'Hz' },
  perc_mod_ratio: { id: 'perc_mod_ratio', name: 'Perc Mod Ratio', min: 0.5, max: 16, default: 3.5 },
  perc_mod_depth: { id: 'perc_mod_depth', name: 'Perc FM Depth', min: 0, max: 1, default: 0.4 },
  perc_pitch_decay: { id: 'perc_pitch_decay', name: 'Perc Pitch Decay', min: 1, max: 300, default: 30, unit: 'ms' },
  perc_amp_decay: { id: 'perc_amp_decay', name: 'Perc Amp Decay', min: 1, max: 1000, default: 250, unit: 'ms' },
  perc_level: { id: 'perc_level', name: 'Perc Level', min: 0, max: 1, default: 0.7 },

  // MASTER
  master_level: { id: 'master_level', name: 'Master Level', min: 0, max: 1, default: 0.8 },
};
