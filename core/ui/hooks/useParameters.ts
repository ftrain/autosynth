/**
 * @file useParameters.ts
 * @brief React hook for managing synthesizer parameters
 */

import { useState, useEffect, useCallback } from 'react';
import { ParameterValues, ParameterMap, ParameterChangeHandler } from '../types/parameters';
import { isJUCEWebView, sendParameterToJUCE, batchSendParametersToJUCE } from '../utils/juce-bridge';

/**
 * Hook options
 */
export interface UseParametersOptions {
  /** Parameter definitions */
  parameters: ParameterMap;
  /** Sync with JUCE backend */
  syncWithJUCE?: boolean;
  /** Batch updates to JUCE (more efficient) */
  batchUpdates?: boolean;
  /** Batch interval in milliseconds */
  batchInterval?: number;
}

/**
 * Hook return type
 */
export interface UseParametersReturn {
  /** Current parameter values (0-1 normalized) */
  paramValues: ParameterValues;
  /** Update a single parameter */
  handleChange: ParameterChangeHandler;
  /** Update multiple parameters at once */
  batchUpdate: (updates: ParameterValues) => void;
  /** Reset all parameters to defaults */
  resetToDefaults: () => void;
  /** Reset a specific parameter to default */
  resetParameter: (paramId: string) => void;
  /** Load parameter state from object */
  loadState: (state: ParameterValues) => void;
  /** Check if running in JUCE WebView */
  isJUCE: boolean;
}

/**
 * React hook for managing synthesizer parameters
 *
 * @remarks
 * - Automatically syncs with JUCE backend if available
 * - Supports batching for performance
 * - Normalizes all values to 0-1 range
 *
 * @example
 * ```tsx
 * const { paramValues, handleChange, resetToDefaults } = useParameters({
 *   parameters: myParameters,
 *   syncWithJUCE: true,
 *   batchUpdates: true,
 * });
 *
 * <SynthKnob
 *   label="CUTOFF"
 *   param="filter_cutoff"
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
    batchInterval = 16, // ~60fps
  } = options;

  // Initialize parameter values from defaults or JUCE
  const [paramValues, setParamValues] = useState<ParameterValues>(() => {
    const defaults: ParameterValues = {};

    // Try to load from JUCE first
    if (typeof window !== 'undefined' && window.__juce__ && window.__juce__.initialParams) {
      return window.__juce__.initialParams;
    }

    // Otherwise use defaults from parameter definitions
    Object.keys(parameters).forEach((key) => {
      const param = parameters[key];
      if (!param) return;
      // Normalize default value to 0-1
      defaults[key] = param.default !== undefined
        ? (param.default - param.min) / (param.max - param.min)
        : 0.5;
    });
    return defaults;
  });

  const [pendingUpdates, setPendingUpdates] = useState<ParameterValues>({});
  const [batchTimer, setBatchTimer] = useState<NodeJS.Timeout | null>(null);

  const isJUCE = isJUCEWebView();

  // Flush pending updates to JUCE
  useEffect(() => {
    if (batchTimer) {
      return () => clearTimeout(batchTimer);
    }
    return undefined;
  }, [batchTimer]);

  // Flush function
  const flushUpdates = useCallback(() => {
    if (Object.keys(pendingUpdates).length > 0 && isJUCE && syncWithJUCE) {
      batchSendParametersToJUCE(pendingUpdates);
      setPendingUpdates({});
    }
    setBatchTimer(null);
  }, [pendingUpdates, isJUCE, syncWithJUCE]);

  // Handle parameter change
  const handleChange: ParameterChangeHandler = useCallback(
    (paramId: string, normalizedValue: number) => {
      console.log('[useParameters] handleChange called:', paramId, normalizedValue);

      // Clamp value to 0-1
      const clampedValue = Math.max(0, Math.min(1, normalizedValue));

      // Update local state immediately
      setParamValues((prev) => ({
        ...prev,
        [paramId]: clampedValue,
      }));

      // Send to JUCE
      if (isJUCE && syncWithJUCE) {
        console.log('[useParameters] Sending to JUCE, batchUpdates:', batchUpdates);
        if (batchUpdates) {
          // Add to pending batch
          setPendingUpdates((prev) => ({
            ...prev,
            [paramId]: clampedValue,
          }));

          // Schedule flush
          if (batchTimer) {
            clearTimeout(batchTimer);
          }
          setBatchTimer(setTimeout(flushUpdates, batchInterval));
        } else {
          // Send immediately
          console.log('[useParameters] Calling sendParameterToJUCE immediately');
          sendParameterToJUCE(paramId, clampedValue);
        }
      } else {
        console.log('[useParameters] Not sending to JUCE, isJUCE:', isJUCE, 'syncWithJUCE:', syncWithJUCE);
      }
    },
    [isJUCE, syncWithJUCE, batchUpdates, batchInterval, batchTimer, flushUpdates]
  );

  // Batch update multiple parameters
  const batchUpdate = useCallback(
    (updates: ParameterValues) => {
      setParamValues((prev) => ({
        ...prev,
        ...updates,
      }));

      if (isJUCE && syncWithJUCE) {
        batchSendParametersToJUCE(updates);
      }
    },
    [isJUCE, syncWithJUCE]
  );

  // Reset all parameters to defaults
  const resetToDefaults = useCallback(() => {
    const defaults: ParameterValues = {};
    Object.keys(parameters).forEach((key) => {
      const param = parameters[key];
      if (!param) return;
      defaults[key] = param.default !== undefined
        ? (param.default - param.min) / (param.max - param.min)
        : 0.5;
    });
    setParamValues(defaults);

    if (isJUCE && syncWithJUCE) {
      batchSendParametersToJUCE(defaults);
    }
  }, [parameters, isJUCE, syncWithJUCE]);

  // Reset specific parameter
  const resetParameter = useCallback(
    (paramId: string) => {
      const param = parameters[paramId];
      if (param) {
        const defaultValue =
          param.default !== undefined
            ? (param.default - param.min) / (param.max - param.min)
            : 0.5;
        handleChange(paramId, defaultValue);
      }
    },
    [parameters, handleChange]
  );

  // Load state from object
  const loadState = useCallback(
    (state: ParameterValues) => {
      setParamValues(state);
      if (isJUCE && syncWithJUCE) {
        batchSendParametersToJUCE(state);
      }
    },
    [isJUCE, syncWithJUCE]
  );

  // Listen for parameter updates from JUCE
  useEffect(() => {
    if (!isJUCE || !syncWithJUCE) return;

    const handleJUCEMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === 'parameterUpdate') {
        setParamValues((prev) => ({
          ...prev,
          [message.paramId]: message.value,
        }));
      }
    };

    window.addEventListener('message', handleJUCEMessage);
    return () => window.removeEventListener('message', handleJUCEMessage);
  }, [isJUCE, syncWithJUCE]);

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
