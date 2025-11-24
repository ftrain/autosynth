/**
 * @file useAudioEngine.ts
 * @brief React hook for DFAM Web Audio integration using AudioWorklet
 *
 * Uses AudioWorklet for real-time audio processing with WASM
 */

import { useEffect, useRef, useState, useCallback } from 'react';

interface AudioEngineState {
  isReady: boolean;
  isPlaying: boolean;
  currentStep: number;
  error: string | null;
}

export function useAudioEngine() {
  const [state, setState] = useState<AudioEngineState>({
    isReady: false,
    isPlaying: false,
    currentStep: 0,
    error: null,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const isInitializedRef = useRef(false);

  const initialize = useCallback(async () => {
    if (isInitializedRef.current) return;

    try {
      console.log('Initializing audio engine...');

      // Create audio context
      const ctx = new AudioContext({ sampleRate: 44100 });
      audioContextRef.current = ctx;

      // Resume context if needed (for browsers that require user interaction)
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      console.log('Loading AudioWorklet module...');
      // Register the AudioWorklet processor
      await ctx.audioWorklet.addModule('/dfam-processor.js');

      console.log('Fetching WASM binary...');
      // Fetch the WASM binary
      const wasmResponse = await fetch('/dfam.wasm');
      if (!wasmResponse.ok) {
        throw new Error(`Failed to fetch WASM: ${wasmResponse.status}`);
      }
      const wasmBytes = await wasmResponse.arrayBuffer();
      console.log('WASM binary loaded:', wasmBytes.byteLength, 'bytes');

      // Create the AudioWorklet node
      const workletNode = new AudioWorkletNode(ctx, 'dfam-processor', {
        numberOfInputs: 0,
        numberOfOutputs: 1,
        outputChannelCount: [2],
      });
      workletNodeRef.current = workletNode;

      // Set up message handling from the worklet
      workletNode.port.onmessage = (event) => {
        const data = event.data;
        if (data.type === 'ready') {
          console.log('AudioWorklet WASM ready!');
          isInitializedRef.current = true;
          setState(s => ({ ...s, isReady: true }));
        } else if (data.type === 'error') {
          console.error('AudioWorklet error:', data.message);
          setState(s => ({ ...s, error: data.message }));
        } else if (data.type === 'step') {
          setState(s => s.currentStep !== data.step ? { ...s, currentStep: data.step } : s);
        }
      };

      // Connect to destination
      workletNode.connect(ctx.destination);

      // Send the WASM binary to the worklet
      console.log('Sending WASM to worklet...');
      workletNode.port.postMessage({
        type: 'init',
        wasmBytes: wasmBytes,
        sampleRate: ctx.sampleRate,
      }, [wasmBytes]); // Transfer ownership for performance

      console.log('Audio engine initialization started...');
    } catch (error) {
      console.error('Audio engine initialization failed:', error);
      setState(s => ({ ...s, error: String(error) }));
    }
  }, []);

  const setParam = useCallback((name: string, value: number) => {
    const workletNode = workletNodeRef.current;
    if (!workletNode) return;

    workletNode.port.postMessage({
      type: 'param',
      name,
      value,
    });
  }, []);

  const setPlaying = useCallback((playing: boolean) => {
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
    setParam('running', playing ? 1 : 0);
    setState(s => ({ ...s, isPlaying: playing }));
  }, [setParam]);

  useEffect(() => {
    return () => {
      if (workletNodeRef.current) {
        workletNodeRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    ...state,
    initialize,
    setParam,
    setPlaying,
  };
}
