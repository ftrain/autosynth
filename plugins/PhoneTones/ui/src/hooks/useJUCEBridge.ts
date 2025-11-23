/**
 * @file useJUCEBridge.ts
 * @brief React hook for JUCE 8 WebView integration
 */

import { useState, useEffect, useCallback, useRef } from 'react';

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
        addEventListener: (eventId: string, fn: (payload: unknown) => void) => [string, number];
        removeEventListener: (handle: [string, number]) => void;
        emitEvent: (eventId: string, payload: unknown) => void;
        emitByBackend: (eventId: string, payload: string) => void;
        listeners?: unknown;
      };
    };
    onParameterUpdate?: (paramId: string, value: number) => void;
    onStateUpdate?: (state: Record<string, number>) => void;
    onAudioData?: (samples: number[]) => void;
  }
}

export interface UseJUCEBridgeOptions {
  enableAudioData?: boolean;
  audioChannel?: 'lead' | 'drum' | 'sub' | 'master';
  enablePresets?: boolean;
}

export interface JUCEInfo {
  version?: string;
  platform?: string;
  sampleRate?: number;
  bufferSize?: number;
}

export interface UseJUCEBridgeReturn {
  isConnected: boolean;
  juceInfo: JUCEInfo;
  audioData: number[];
  setParameter: (paramId: string, value: number) => void;
  requestState: () => void;
  noteOn: (note: number, velocity: number) => void;
  noteOff: (note: number) => void;
  onParameterChange: (callback: (paramId: string, value: number) => void) => void;
  onStateChange: (callback: (state: Record<string, number>) => void) => void;
}

const isJUCEWebView = (): boolean => {
  return typeof window !== 'undefined' && window.__JUCE__ !== undefined;
};

export function useJUCEBridge(options: UseJUCEBridgeOptions = {}): UseJUCEBridgeReturn {
  const { enableAudioData = false } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [juceInfo, setJuceInfo] = useState<JUCEInfo>({});
  const [audioData, setAudioData] = useState<number[]>([]);

  const parameterCallbackRef = useRef<((paramId: string, value: number) => void) | null>(null);
  const stateCallbackRef = useRef<((state: Record<string, number>) => void) | null>(null);

  useEffect(() => {
    const connected = isJUCEWebView();
    setIsConnected(connected);

    if (connected && window.__JUCE__?.initialisationData) {
      const platform = window.__JUCE__.initialisationData.__juce__platform?.[0];
      setJuceInfo({ platform });
    }
  }, []);

  useEffect(() => {
    if (!isConnected) return;

    window.onParameterUpdate = (paramId: string, value: number) => {
      if (parameterCallbackRef.current) {
        parameterCallbackRef.current(paramId, value);
      }
    };

    window.onStateUpdate = (state: Record<string, number>) => {
      if (stateCallbackRef.current) {
        stateCallbackRef.current(state);
      }
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
  }, [isConnected, enableAudioData]);

  const callNativeFunction = useCallback((name: string, params: unknown[]) => {
    if (!isConnected) return;
    window.__JUCE__?.backend?.emitEvent?.("__juce__invoke", {
      name,
      params,
      resultId: 0,
    });
  }, [isConnected]);

  const setParameter = useCallback((paramId: string, value: number) => {
    if (!isConnected) return;
    const clampedValue = Math.max(0, Math.min(1, value));
    callNativeFunction("setParameter", [paramId, clampedValue]);
  }, [isConnected, callNativeFunction]);

  const requestState = useCallback(() => {
    if (!isConnected) return;
    callNativeFunction("requestState", []);
  }, [isConnected, callNativeFunction]);

  const noteOn = useCallback((note: number, velocity: number) => {
    if (!isConnected) return;
    callNativeFunction("noteOn", [note, velocity]);
  }, [isConnected, callNativeFunction]);

  const noteOff = useCallback((note: number) => {
    if (!isConnected) return;
    callNativeFunction("noteOff", [note]);
  }, [isConnected, callNativeFunction]);

  const onParameterChange = useCallback((callback: (paramId: string, value: number) => void) => {
    parameterCallbackRef.current = callback;
  }, []);

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
