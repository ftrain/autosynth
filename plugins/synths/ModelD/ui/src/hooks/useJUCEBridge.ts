/**
 * @file useJUCEBridge.ts
 * @brief React hook for JUCE WebView integration
 *
 * This hook manages bi-directional communication between the React UI
 * and the JUCE C++ backend via the WebView bridge.
 *
 * Communication Flow:
 *   React -> JUCE: window.__JUCE__.postMessage() or registered native functions
 *   JUCE -> React: window.onParameterUpdate(), window.onAudioData(), etc.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * JUCE bridge window extensions
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
      /** JUCE 8 backend object for native function calls */
      backend?: {
        addEventListener: (eventId: string, fn: (payload: unknown) => void) => [string, number];
        removeEventListener: (handle: [string, number]) => void;
        emitEvent: (eventId: string, payload: unknown) => void;
        emitByBackend: (eventId: string, payload: string) => void;
        listeners?: unknown;
      };
    };
    /** Called by JUCE when a parameter changes */
    onParameterUpdate?: (paramId: string, value: number) => void;
    /** Called by JUCE with all parameter state */
    onStateUpdate?: (state: Record<string, number>) => void;
    /** Called by JUCE with audio visualization data */
    onAudioData?: (samples: number[]) => void;
  }
}

/**
 * Hook configuration options
 */
export interface UseJUCEBridgeOptions {
  /** Enable audio data streaming for visualization */
  enableAudioData?: boolean;
  /** Audio channel to receive data from */
  audioChannel?: 'lead' | 'drum' | 'sub' | 'master';
  /** Enable preset management */
  enablePresets?: boolean;
}

/**
 * JUCE backend information
 */
export interface JUCEInfo {
  version?: string;
  platform?: string;
  sampleRate?: number;
  bufferSize?: number;
}

/**
 * Hook return type
 */
export interface UseJUCEBridgeReturn {
  /** Is running inside JUCE WebView */
  isConnected: boolean;
  /** JUCE backend information */
  juceInfo: JUCEInfo;
  /** Latest audio data samples for visualization */
  audioData: number[];
  /** Send parameter value to JUCE */
  setParameter: (paramId: string, value: number) => void;
  /** Request all parameters from JUCE */
  requestState: () => void;
  /** Trigger MIDI note on */
  noteOn: (note: number, velocity: number) => void;
  /** Trigger MIDI note off */
  noteOff: (note: number) => void;
  /** Register callback for parameter updates from JUCE */
  onParameterChange: (callback: (paramId: string, value: number) => void) => void;
  /** Register callback for full state updates from JUCE */
  onStateChange: (callback: (state: Record<string, number>) => void) => void;
}

/**
 * Check if running inside JUCE WebView
 */
const isJUCEWebView = (): boolean => {
  return typeof window !== 'undefined' && window.__JUCE__ !== undefined;
};

/**
 * React hook for JUCE WebView integration
 *
 * @example
 * ```tsx
 * const { isConnected, setParameter, audioData } = useJUCEBridge({
 *   enableAudioData: true,
 * });
 *
 * // Send parameter to JUCE
 * setParameter('filter_cutoff', 0.5);
 *
 * // Display audio waveform
 * <Oscilloscope data={audioData} />
 * ```
 */
export function useJUCEBridge(options: UseJUCEBridgeOptions = {}): UseJUCEBridgeReturn {
  const { enableAudioData = false } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [juceInfo, setJuceInfo] = useState<JUCEInfo>({});
  const [audioData, setAudioData] = useState<number[]>([]);

  // Callback refs for JUCE -> React communication
  const parameterCallbackRef = useRef<((paramId: string, value: number) => void) | null>(null);
  const stateCallbackRef = useRef<((state: Record<string, number>) => void) | null>(null);

  // Check connection and initialize
  useEffect(() => {
    const connected = isJUCEWebView();
    setIsConnected(connected);

    // Debug: log what's available on window.__JUCE__
    console.log('=== JUCE Bridge Debug ===');
    console.log('window.__JUCE__:', window.__JUCE__);
    console.log('Keys:', window.__JUCE__ ? Object.keys(window.__JUCE__) : 'N/A');
    if (window.__JUCE__) {
      console.log('backend:', window.__JUCE__.backend);
      // Log all properties
      for (const key in window.__JUCE__) {
        console.log(`  ${key}:`, (window.__JUCE__ as Record<string, unknown>)[key]);
      }
    }
    console.log('=========================');

    if (connected && window.__JUCE__) {
      setJuceInfo({
        version: window.__JUCE__.version,
        platform: window.__JUCE__.platform,
        sampleRate: window.__JUCE__.sampleRate,
        bufferSize: window.__JUCE__.bufferSize,
      });
    }
  }, []);

  // Set up JUCE -> React message handlers
  useEffect(() => {
    if (!isConnected) return;

    // Parameter update handler
    window.onParameterUpdate = (paramId: string, value: number) => {
      if (parameterCallbackRef.current) {
        parameterCallbackRef.current(paramId, value);
      }
    };

    // Full state update handler
    window.onStateUpdate = (state: Record<string, number>) => {
      if (stateCallbackRef.current) {
        stateCallbackRef.current(state);
      }
    };

    // Audio data handler
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
  }, [isConnected, enableAudioData]);

  // Helper to call native JUCE functions via emitEvent
  const callNativeFunction = useCallback((name: string, params: unknown[]) => {
    if (!isConnected) return;
    window.__JUCE__?.backend?.emitEvent?.("__juce__invoke", {
      name,
      params,
      resultId: 0,
    });
  }, [isConnected]);

  // Send parameter to JUCE
  const setParameter = useCallback((paramId: string, value: number) => {
    if (!isConnected) return;
    const clampedValue = Math.max(0, Math.min(1, value));
    callNativeFunction("setParameter", [paramId, clampedValue]);
  }, [isConnected, callNativeFunction]);

  // Request full state from JUCE
  const requestState = useCallback(() => {
    if (!isConnected) return;
    callNativeFunction("requestState", []);
  }, [isConnected, callNativeFunction]);

  // MIDI note on
  const noteOn = useCallback((note: number, velocity: number) => {
    if (!isConnected) return;
    callNativeFunction("noteOn", [note, velocity]);
  }, [isConnected, callNativeFunction]);

  // MIDI note off
  const noteOff = useCallback((note: number) => {
    if (!isConnected) return;
    callNativeFunction("noteOff", [note]);
  }, [isConnected, callNativeFunction]);

  // Register parameter change callback
  const onParameterChange = useCallback((callback: (paramId: string, value: number) => void) => {
    parameterCallbackRef.current = callback;
  }, []);

  // Register state change callback
  const onStateChange = useCallback((callback: (state: Record<string, number>) => void) => {
    stateCallbackRef.current = callback;
  }, []);

  return {
    isConnected,
    juceInfo,
    audioData,
    setParameter,
    requestState,
    noteOn,
    noteOff,
    onParameterChange,
    onStateChange,
  };
}
