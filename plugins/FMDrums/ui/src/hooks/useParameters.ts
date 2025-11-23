/**
 * @file useParameters.ts
 * @brief React hook for managing synthesizer parameter state
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useJUCEBridge } from './useJUCEBridge';

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
export type ParameterValues = Record<string, number>;

export interface UseParametersOptions {
  parameters: ParameterMap;
  syncWithJUCE?: boolean;
  batchUpdates?: boolean;
  batchInterval?: number;
}

export interface UseParametersReturn {
  paramValues: ParameterValues;
  handleChange: (paramId: string, normalizedValue: number) => void;
  batchUpdate: (updates: ParameterValues) => void;
  resetToDefaults: () => void;
  resetParameter: (paramId: string) => void;
  loadState: (state: ParameterValues) => void;
  isJUCE: boolean;
}

export const normalizeValue = (value: number, min: number, max: number): number => {
  return (value - min) / (max - min);
};

export const denormalizeValue = (normalizedValue: number, min: number, max: number): number => {
  return min + normalizedValue * (max - min);
};

export function useParameters(options: UseParametersOptions): UseParametersReturn {
  const {
    parameters,
    syncWithJUCE = true,
    batchUpdates = true,
    batchInterval = 16,
  } = options;

  const bridge = useJUCEBridge();
  const isJUCE = syncWithJUCE && bridge.isConnected;

  const [paramValues, setParamValues] = useState<ParameterValues>(() => {
    const defaults: ParameterValues = {};
    Object.entries(parameters).forEach(([id, param]) => {
      defaults[id] = normalizeValue(param.default, param.min, param.max);
    });
    return defaults;
  });

  const pendingUpdates = useRef<ParameterValues>({});
  const batchTimerRef = useRef<number | null>(null);

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

  const handleChange = useCallback((paramId: string, normalizedValue: number) => {
    const clampedValue = Math.max(0, Math.min(1, normalizedValue));

    setParamValues((prev) => ({
      ...prev,
      [paramId]: clampedValue,
    }));

    if (isJUCE) {
      if (batchUpdates) {
        pendingUpdates.current[paramId] = clampedValue;
        if (batchTimerRef.current === null) {
          batchTimerRef.current = window.setTimeout(flushUpdates, batchInterval);
        }
      } else {
        bridge.setParameter(paramId, clampedValue);
      }
    }
  }, [isJUCE, batchUpdates, batchInterval, flushUpdates, bridge]);

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

  const resetParameter = useCallback((paramId: string) => {
    const param = parameters[paramId];
    if (param) {
      const defaultValue = normalizeValue(param.default, param.min, param.max);
      handleChange(paramId, defaultValue);
    }
  }, [parameters, handleChange]);

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

  useEffect(() => {
    if (!isJUCE) return;

    bridge.onParameterChange((paramId, value) => {
      setParamValues((prev) => ({
        ...prev,
        [paramId]: value,
      }));
    });

    bridge.onStateChange((state) => {
      setParamValues((prev) => ({
        ...prev,
        ...state,
      }));
    });

    bridge.requestState();
  }, [isJUCE, bridge]);

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
