/**
 * @file useJUCEBridge.ts
 * @brief React hook for JUCE WebView integration
 */

/// <reference path="../types/juce.d.ts" />

import { useState, useEffect, useCallback, useRef } from 'react';
import { JUCEMessage } from '../types/juce';
import { isJUCEWebView } from '../utils/juce-bridge';

/**
 * Hook options
 */
export interface UseJUCEBridgeOptions {
  /** Enable audio data streaming */
  enableAudioData?: boolean;
  /** Audio data channel to listen to */
  audioChannel?: 'lead' | 'drum' | 'sub' | 'master';
  /** Enable preset management */
  enablePresets?: boolean;
}

/**
 * Hook return type
 */
export interface UseJUCEBridgeReturn {
  /** Is running in JUCE WebView */
  isJUCE: boolean;
  /** JUCE backend info */
  juceInfo: {
    version?: string;
    platform?: string;
    sampleRate?: number;
    bufferSize?: number;
  };
  /** Latest audio data samples */
  audioData: number[];
  /** Available presets */
  presets: string[];
  /** Current preset name */
  currentPreset: string | null;
  /** Load a preset */
  loadPreset: (name: string) => void;
  /** Save current state as preset */
  savePreset: (name: string) => void;
  /** Delete a preset */
  deletePreset: (name: string) => void;
  /** Trigger note on */
  noteOn: (note: number, velocity: number) => void;
  /** Trigger note off */
  noteOff: (note: number) => void;
}

/**
 * React hook for JUCE WebView integration
 *
 * @remarks
 * Handles bi-directional communication with JUCE C++ backend
 *
 * @example
 * ```tsx
 * const {
 *   isJUCE,
 *   audioData,
 *   presets,
 *   loadPreset,
 *   savePreset,
 * } = useJUCEBridge({
 *   enableAudioData: true,
 *   audioChannel: 'master',
 *   enablePresets: true,
 * });
 *
 * if (isJUCE) {
 *   return <Oscilloscope audioData={audioData} />;
 * }
 * ```
 */
export function useJUCEBridge(options: UseJUCEBridgeOptions = {}): UseJUCEBridgeReturn {
  const {
    enableAudioData = false,
    audioChannel = 'master',
    enablePresets = false,
  } = options;

  const [audioData, setAudioData] = useState<number[]>([]);
  const [presets, setPresets] = useState<string[]>([]);
  const [currentPreset, setCurrentPreset] = useState<string | null>(null);
  const [juceInfo, setJuceInfo] = useState<{
    version?: string;
    platform?: string;
    sampleRate?: number;
    bufferSize?: number;
  }>({});

  const isJUCE = isJUCEWebView();
  const audioDataRef = useRef<number[]>([]);

  // Initialize JUCE info
  useEffect(() => {
    if (isJUCE && window.__juce__) {
      setJuceInfo({
        version: window.__juce__.version,
        platform: window.__juce__.platform,
        sampleRate: window.__juce__.sampleRate,
        bufferSize: window.__juce__.bufferSize,
      });
    }
  }, [isJUCE]);

  // Request initial preset list
  useEffect(() => {
    if (isJUCE && enablePresets && window.getPresets) {
      const presetList = window.getPresets();
      setPresets(presetList);
    }
  }, [isJUCE, enablePresets]);

  // Handle messages from JUCE
  useEffect(() => {
    if (!isJUCE) return;

    const handleMessage = (message: JUCEMessage) => {
      switch (message.type) {
        case 'audioData':
          if (enableAudioData && message.channel === audioChannel) {
            audioDataRef.current = message.samples;
            setAudioData(message.samples);
          }
          break;

        case 'presetList':
          if (enablePresets) {
            setPresets(message.presets);
          }
          break;

        case 'presetChanged':
          if (enablePresets) {
            setCurrentPreset(message.name);
          }
          break;

        default:
          break;
      }
    };

    // Set up message handler
    window.onJUCEMessage = handleMessage;

    return () => {
      window.onJUCEMessage = undefined;
    };
  }, [isJUCE, enableAudioData, audioChannel, enablePresets]);

  // Preset management functions
  const loadPreset = useCallback(
    (name: string) => {
      if (isJUCE && window.loadPreset) {
        window.loadPreset(name);
      }
    },
    [isJUCE]
  );

  const savePreset = useCallback(
    (name: string) => {
      if (isJUCE && window.savePreset) {
        window.savePreset(name);
      }
    },
    [isJUCE]
  );

  const deletePreset = useCallback(
    (name: string) => {
      if (isJUCE && window.deletePreset) {
        window.deletePreset(name);
      }
    },
    [isJUCE]
  );

  // MIDI functions
  const noteOn = useCallback(
    (note: number, velocity: number) => {
      if (isJUCE && window.noteOn) {
        window.noteOn(note, velocity);
      }
    },
    [isJUCE]
  );

  const noteOff = useCallback(
    (note: number) => {
      if (isJUCE && window.noteOff) {
        window.noteOff(note);
      }
    },
    [isJUCE]
  );

  return {
    isJUCE,
    juceInfo,
    audioData,
    presets,
    currentPreset,
    loadPreset,
    savePreset,
    deletePreset,
    noteOn,
    noteOff,
  };
}
