/**
 * @file parameters.ts
 * @brief TypeScript type definitions for synthesizer parameters
 */

/**
 * Parameter definition with metadata
 */
export interface ParameterDefinition {
  /** Human-readable name */
  name: string;
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
  /** Default value */
  default: number;
  /** Optional choices for discrete parameters */
  choices?: string[];
  /** Optional unit (Hz, dB, ms, %) */
  unit?: 'Hz' | 'dB' | 'ms' | '%' | 's';
}

/**
 * Map of parameter IDs to their definitions
 */
export type ParameterMap = Record<string, ParameterDefinition>;

/**
 * Map of parameter IDs to their current values (0-1 normalized)
 */
export type ParameterValues = Record<string, number>;

/**
 * Parameter change handler
 */
export type ParameterChangeHandler = (paramId: string, normalizedValue: number) => void;

/**
 * Props common to all synth components
 */
export interface SynthComponentProps {
  /** Current parameter values (0-1 normalized) */
  paramValues: ParameterValues;
  /** Parameter change callback */
  onChange: ParameterChangeHandler;
  /** Optional parameter definitions (defaults to global parameters) */
  parameters?: ParameterMap;
}

/**
 * Helper type for extracting parameter IDs as literal types
 */
export type ParameterID = keyof ParameterMap;

/**
 * Helper function to get parameter definition
 */
export function getParamDef(
  paramId: string,
  parameters: ParameterMap
): ParameterDefinition | undefined {
  return parameters[paramId];
}

/**
 * Denormalize a value from 0-1 to actual range
 */
export function denormalize(
  paramId: string,
  normalizedValue: number,
  parameters: ParameterMap
): number {
  const def = parameters[paramId];
  if (!def) return normalizedValue;
  return def.min + normalizedValue * (def.max - def.min);
}

/**
 * Normalize a value from actual range to 0-1
 */
export function normalize(
  paramId: string,
  actualValue: number,
  parameters: ParameterMap
): number {
  const def = parameters[paramId];
  if (!def) return actualValue;
  if (def.max === def.min) return 0;
  return (actualValue - def.min) / (def.max - def.min);
}

/**
 * Format a value for display
 */
export function formatValue(
  paramId: string,
  normalizedValue: number,
  parameters: ParameterMap
): string {
  const def = parameters[paramId];
  if (!def) return normalizedValue.toFixed(2);

  const actualValue = denormalize(paramId, normalizedValue, parameters);

  // If choices exist, return the choice
  if (def.choices && def.choices.length > 0) {
    const index = Math.round(normalizedValue * (def.choices.length - 1));
    return def.choices[index] || '';
  }

  // Format based on range
  const range = def.max - def.min;
  if (range >= 100) {
    return Math.round(actualValue).toString();
  } else if (range >= 10) {
    return actualValue.toFixed(1);
  } else {
    return actualValue.toFixed(2);
  }
}
