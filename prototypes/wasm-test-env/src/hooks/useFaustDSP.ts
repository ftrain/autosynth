import { useEffect, useState, useCallback, useRef } from 'react';
import type { FaustAudioWorkletNode } from '../types/faust';

interface UseFaustDSPOptions {
  processorUrl: string; // URL to the AudioWorklet processor JS file
  autoStart?: boolean;
}

export const useFaustDSP = (options: UseFaustDSPOptions) => {
  const { processorUrl, autoStart = false } = options;

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const dspNodeRef = useRef<FaustAudioWorkletNode | null>(null);

  // Initialize audio context and load DSP
  const initialize = useCallback(async () => {
    try {
      // Create audio context
      const context = new AudioContext();
      audioContextRef.current = context;

      // Load the AudioWorklet module
      await context.audioWorklet.addModule(processorUrl);

      // Create the Faust DSP node
      // Note: The processor name should match what's in the processor file
      const processorName = processorUrl.split('/').pop()?.replace('.js', '') || 'faust-processor';
      const dspNode = new AudioWorkletNode(context, processorName) as FaustAudioWorkletNode;

      dspNodeRef.current = dspNode;
      setIsReady(true);
      setError(null);

      if (autoStart) {
        dspNode.connect(context.destination);
        setIsPlaying(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize audio';
      setError(errorMessage);
      console.error('Error initializing Faust DSP:', err);
    }
  }, [processorUrl, autoStart]);

  // Start/resume audio
  const start = useCallback(async () => {
    if (!audioContextRef.current || !dspNodeRef.current) {
      await initialize();
      return;
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    if (!isPlaying) {
      dspNodeRef.current.connect(audioContextRef.current.destination);
      setIsPlaying(true);
    }
  }, [initialize, isPlaying]);

  // Stop audio
  const stop = useCallback(() => {
    if (dspNodeRef.current && isPlaying) {
      dspNodeRef.current.disconnect();
      setIsPlaying(false);
    }
  }, [isPlaying]);

  // Set parameter value
  const setParam = useCallback((path: string, value: number) => {
    if (dspNodeRef.current && 'setParamValue' in dspNodeRef.current) {
      dspNodeRef.current.setParamValue(path, value);
    } else if (dspNodeRef.current) {
      // Fallback: try to set via port message
      dspNodeRef.current.port.postMessage({
        type: 'param',
        path,
        value,
      });
    }
  }, []);

  // Get parameter value
  const getParam = useCallback((path: string): number | undefined => {
    if (dspNodeRef.current && 'getParamValue' in dspNodeRef.current) {
      return dspNodeRef.current.getParamValue(path);
    }
    return undefined;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dspNodeRef.current) {
        dspNodeRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    isReady,
    isPlaying,
    error,
    initialize,
    start,
    stop,
    setParam,
    getParam,
    audioContext: audioContextRef.current,
    dspNode: dspNodeRef.current,
  };
};
