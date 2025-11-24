/**
 * @file useAudioEngine.ts
 * @brief React hook for TapeLoop Web Audio integration using AudioWorklet
 */

import { useEffect, useRef, useState, useCallback } from 'react';

interface AudioEngineState {
  isReady: boolean;
  seq1Step: number;
  seq2Step: number;
  error: string | null;
}

export function useAudioEngine() {
  const [state, setState] = useState<AudioEngineState>({
    isReady: false,
    seq1Step: 0,
    seq2Step: 0,
    error: null,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const isInitializedRef = useRef(false);

  const initialize = useCallback(async () => {
    if (isInitializedRef.current) return;

    try {
      console.log('[TapeLoop] Initializing audio engine...');

      const ctx = new AudioContext({ sampleRate: 44100 });
      audioContextRef.current = ctx;

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      console.log('[TapeLoop] Loading AudioWorklet module...');
      await ctx.audioWorklet.addModule('/tapeloop-processor.js');

      console.log('[TapeLoop] Fetching WASM binary...');
      const wasmResponse = await fetch('/tapeloop.wasm');
      if (!wasmResponse.ok) {
        throw new Error(`Failed to fetch WASM: ${wasmResponse.status}`);
      }
      const wasmBytes = await wasmResponse.arrayBuffer();
      console.log('[TapeLoop] WASM binary loaded:', wasmBytes.byteLength, 'bytes');

      const workletNode = new AudioWorkletNode(ctx, 'tapeloop-processor', {
        numberOfInputs: 0,
        numberOfOutputs: 1,
        outputChannelCount: [2],
      });
      workletNodeRef.current = workletNode;

      workletNode.port.onmessage = (event) => {
        const data = event.data;
        if (data.type === 'ready') {
          console.log('[TapeLoop] AudioWorklet WASM ready!');
          isInitializedRef.current = true;
          setState(s => ({ ...s, isReady: true }));
        } else if (data.type === 'error') {
          console.error('[TapeLoop] AudioWorklet error:', data.message);
          setState(s => ({ ...s, error: data.message }));
        } else if (data.type === 'seqStep') {
          setState(s => (s.seq1Step !== data.seq1 || s.seq2Step !== data.seq2)
            ? { ...s, seq1Step: data.seq1, seq2Step: data.seq2 }
            : s);
        }
      };

      workletNode.connect(ctx.destination);

      console.log('[TapeLoop] Sending WASM to worklet...');
      workletNode.port.postMessage({
        type: 'init',
        wasmBytes: wasmBytes,
        sampleRate: ctx.sampleRate,
      }, [wasmBytes]);

      console.log('[TapeLoop] Audio engine initialization started...');
    } catch (error) {
      console.error('[TapeLoop] Audio engine initialization failed:', error);
      setState(s => ({ ...s, error: String(error) }));
    }
  }, []);

  const setParam = useCallback((name: string, value: number | boolean) => {
    const workletNode = workletNodeRef.current;
    if (!workletNode) return;

    workletNode.port.postMessage({
      type: 'param',
      name,
      value,
    });
  }, []);

  const noteOn = useCallback((note: number, velocity: number = 1.0) => {
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
    const workletNode = workletNodeRef.current;
    if (!workletNode) return;
    workletNode.port.postMessage({ type: 'noteOn', note, velocity });
  }, []);

  const noteOff = useCallback((note: number) => {
    const workletNode = workletNodeRef.current;
    if (!workletNode) return;
    workletNode.port.postMessage({ type: 'noteOff', note });
  }, []);

  const clearTape = useCallback(() => {
    const workletNode = workletNodeRef.current;
    if (!workletNode) return;
    workletNode.port.postMessage({ type: 'clearTape' });
  }, []);

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
    noteOn,
    noteOff,
    clearTape,
  };
}
