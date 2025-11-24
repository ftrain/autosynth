/**
 * @file useJUCEBridge.ts
 * @brief React hook for communicating with JUCE backend via WebView
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * JUCE WebView global interface
 */
declare global {
  interface Window {
    __JUCE__?: {
      postMessage: (data: string) => void;
      initialisationData?: {
        __juce__platform: string[];
        __juce__functions: string[];
        __juce__sliders: string[];
        __juce__toggles: string[];
        __juce__comboBoxes: string[];
      };
      backend?: {
        emitEvent?: (eventName: string, data: unknown) => void;
      };
    };
    onParameterUpdate?: (paramId: string, value: number) => void;
    onStateUpdate?: (state: Record<string, number>) => void;
    onAudioData?: (samples: number[]) => void;
    onSequencerState?: (state: unknown) => void;
  }
}

/**
 * Hook options
 */
export interface UseJUCEBridgeOptions {
  /** Enable audio data callbacks */
  enableAudioData?: boolean;
  /** Audio channel to monitor */
  audioChannel?: 'left' | 'right' | 'master';
}

/**
 * Hook return type
 */
export interface UseJUCEBridgeReturn {
  /** Is connected to JUCE backend */
  isConnected: boolean;
  /** Send parameter to JUCE */
  setParameter: (paramId: string, value: number) => void;
  /** Request full state from JUCE */
  requestState: () => void;
  /** Register parameter change callback */
  onParameterChange: (callback: (paramId: string, value: number) => void) => void;
  /** Register state change callback */
  onStateChange: (callback: (state: Record<string, number>) => void) => void;
  /** Audio visualization data */
  audioData: number[];
}

/**
 * React hook for JUCE WebView communication
 */
export function useJUCEBridge(options: UseJUCEBridgeOptions = {}): UseJUCEBridgeReturn {
  const { enableAudioData = false } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [audioData, setAudioData] = useState<number[]>([]);

  const paramChangeCallback = useRef<((paramId: string, value: number) => void) | null>(null);
  const stateChangeCallback = useRef<((state: Record<string, number>) => void) | null>(null);

  // Check for JUCE connection
  useEffect(() => {
    const checkConnection = () => {
      const connected = typeof window.__JUCE__ !== 'undefined' &&
                       typeof window.__JUCE__.backend?.emitEvent === 'function';
      setIsConnected(connected);
    };

    checkConnection();
    const interval = setInterval(checkConnection, 1000);
    return () => clearInterval(interval);
  }, []);

  // Setup global callbacks
  useEffect(() => {
    window.onParameterUpdate = (paramId: string, value: number) => {
      paramChangeCallback.current?.(paramId, value);
    };

    window.onStateUpdate = (state: Record<string, number>) => {
      stateChangeCallback.current?.(state);
    };

    if (enableAudioData) {
      window.onAudioData = (samples: number[]) => {
        setAudioData(samples);
      };
    }

    return () => {
      window.onParameterUpdate = undefined;
      window.onStateUpdate = undefined;
      window.onAudioData = undefined;
    };
  }, [enableAudioData]);

  // Helper to call native JUCE functions
  const callNativeFunction = useCallback((name: string, params: unknown[]) => {
    if (!isConnected) return;
    window.__JUCE__?.backend?.emitEvent?.('__juce__invoke', {
      name,
      params,
      resultId: 0,
    });
  }, [isConnected]);

  // Send parameter to JUCE
  const setParameter = useCallback((paramId: string, value: number) => {
    const clampedValue = Math.max(0, Math.min(1, value));
    callNativeFunction('setParameter', [paramId, clampedValue]);
  }, [callNativeFunction]);

  // Request full state
  const requestState = useCallback(() => {
    callNativeFunction('requestState', []);
  }, [callNativeFunction]);

  // Register callbacks
  const onParameterChange = useCallback((callback: (paramId: string, value: number) => void) => {
    paramChangeCallback.current = callback;
  }, []);

  const onStateChange = useCallback((callback: (state: Record<string, number>) => void) => {
    stateChangeCallback.current = callback;
  }, []);

  return {
    isConnected,
    setParameter,
    requestState,
    onParameterChange,
    onStateChange,
    audioData,
  };
}

export default useJUCEBridge;
