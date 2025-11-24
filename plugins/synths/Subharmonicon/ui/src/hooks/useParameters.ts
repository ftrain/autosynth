/**
 * @file useParameters.ts
 * @brief React hook for managing synthesizer parameter state
 *
 * This hook provides:
 * - Local state management for parameters
 * - Automatic sync with JUCE backend
 * - Batched updates for performance
 * - Reset functionality
 *
 * All values are normalized to 0-1 range for consistency.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useJUCEBridge } from './useJUCEBridge';

/**
 * Parameter definition
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

/**
 * Map of parameter ID to definition
 */
export type ParameterMap = Record<string, ParameterDefinition>;

/**
 * Map of parameter ID to normalized value (0-1)
 */
export type ParameterValues = Record<string, number>;

/**
 * Hook configuration options
 */
export interface UseParametersOptions {
  /** Parameter definitions */
  parameters: ParameterMap;
  /** Sync with JUCE backend (default: true) */
  syncWithJUCE?: boolean;
  /** Batch updates for performance (default: true) */
  batchUpdates?: boolean;
  /** Batch interval in ms (default: 16 for ~60fps) */
  batchInterval?: number;
}

/**
 * Hook return type
 */
export interface UseParametersReturn {
  /** Current parameter values (0-1 normalized) */
  paramValues: ParameterValues;
  /** Update a single parameter */
  handleChange: (paramId: string, normalizedValue: number) => void;
  /** Update multiple parameters at once */
  batchUpdate: (updates: ParameterValues) => void;
  /** Reset all parameters to defaults */
  resetToDefaults: () => void;
  /** Reset a specific parameter to default */
  resetParameter: (paramId: string) => void;
  /** Load parameter state from object */
  loadState: (state: ParameterValues) => void;
  /** Is connected to JUCE */
  isJUCE: boolean;
}

/**
 * Normalize a raw value to 0-1 range
 */
const normalizeValue = (value: number, min: number, max: number): number => {
  return (value - min) / (max - min);
};

/**
 * Denormalize a 0-1 value to raw range
 */
const denormalizeValue = (normalizedValue: number, min: number, max: number): number => {
  return min + normalizedValue * (max - min);
};

/**
 * React hook for managing synthesizer parameters
 *
 * @example
 * ```tsx
 * const { paramValues, handleChange, resetToDefaults } = useParameters({
 *   parameters: PARAMETER_DEFINITIONS,
 *   syncWithJUCE: true,
 * });
 *
 * <SynthKnob
 *   value={paramValues.filter_cutoff}
 *   onChange={(v) => handleChange('filter_cutoff', v)}
 * />
 * ```
 */
export function useParameters(options: UseParametersOptions): UseParametersReturn {
  const {
    parameters,
    syncWithJUCE = true,
    batchUpdates = true,
    batchInterval = 16,
  } = options;

  // Connect to JUCE
  const bridge = useJUCEBridge();
  const isJUCE = syncWithJUCE && bridge.isConnected;

  // Initialize parameter values from defaults
  const [paramValues, setParamValues] = useState<ParameterValues>(() => {
    const defaults: ParameterValues = {};
    Object.entries(parameters).forEach(([id, param]) => {
      defaults[id] = normalizeValue(param.default, param.min, param.max);
    });
    return defaults;
  });

  // Batching state
  const pendingUpdates = useRef<ParameterValues>({});
  const batchTimerRef = useRef<number | null>(null);

  // Flush batched updates to JUCE
  const flushUpdates = useCallback(() => {
    const updates = pendingUpdates.current;
    if (Object.keys(updates).length > 0 && isJUCE) {
      Object.entries(updates).forEach(([paramId, value]) => {
        bridge.setParameter(paramId, value);
      });
      pendingUpdates.current = {};
    }
    batchTimerRef.current = null;
  }, [isJUCE, bridge]);

  // Handle parameter change
  const handleChange = useCallback((paramId: string, normalizedValue: number) => {
    // Clamp to 0-1
    const clampedValue = Math.max(0, Math.min(1, normalizedValue));

    // Update local state immediately
    setParamValues((prev) => ({
      ...prev,
      [paramId]: clampedValue,
    }));

    // Send to JUCE
    if (isJUCE) {
      if (batchUpdates) {
        // Add to batch
        pendingUpdates.current[paramId] = clampedValue;

        // Schedule flush
        if (batchTimerRef.current === null) {
          batchTimerRef.current = window.setTimeout(flushUpdates, batchInterval);
        }
      } else {
        // Send immediately
        bridge.setParameter(paramId, clampedValue);
      }
    }
  }, [isJUCE, batchUpdates, batchInterval, flushUpdates, bridge]);

  // Batch update multiple parameters
  const batchUpdate = useCallback((updates: ParameterValues) => {
    setParamValues((prev) => ({
      ...prev,
      ...updates,
    }));

    if (isJUCE) {
      Object.entries(updates).forEach(([paramId, value]) => {
        bridge.setParameter(paramId, value);
      });
    }
  }, [isJUCE, bridge]);

  // Reset all parameters to defaults
  const resetToDefaults = useCallback(() => {
    const defaults: ParameterValues = {};
    Object.entries(parameters).forEach(([id, param]) => {
      defaults[id] = normalizeValue(param.default, param.min, param.max);
    });

    setParamValues(defaults);

    if (isJUCE) {
      Object.entries(defaults).forEach(([paramId, value]) => {
        bridge.setParameter(paramId, value);
      });
    }
  }, [parameters, isJUCE, bridge]);

  // Reset a specific parameter
  const resetParameter = useCallback((paramId: string) => {
    const param = parameters[paramId];
    if (param) {
      const defaultValue = normalizeValue(param.default, param.min, param.max);
      handleChange(paramId, defaultValue);
    }
  }, [parameters, handleChange]);

  // Load state from object
  const loadState = useCallback((state: ParameterValues) => {
    setParamValues((prev) => ({
      ...prev,
      ...state,
    }));

    if (isJUCE) {
      Object.entries(state).forEach(([paramId, value]) => {
        bridge.setParameter(paramId, value);
      });
    }
  }, [isJUCE, bridge]);

  // Listen for parameter updates from JUCE
  useEffect(() => {
    if (!isJUCE) return;

    // Register for parameter changes
    bridge.onParameterChange((paramId, value) => {
      setParamValues((prev) => ({
        ...prev,
        [paramId]: value,
      }));
    });

    // Register for full state updates
    bridge.onStateChange((state) => {
      setParamValues((prev) => ({
        ...prev,
        ...state,
      }));
    });

    // Request initial state
    bridge.requestState();
  }, [isJUCE, bridge]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (batchTimerRef.current !== null) {
        clearTimeout(batchTimerRef.current);
      }
    };
  }, []);

  return {
    paramValues,
    handleChange,
    batchUpdate,
    resetToDefaults,
    resetParameter,
    loadState,
    isJUCE,
  };
}

// Export utility functions for external use
export { normalizeValue, denormalizeValue };
